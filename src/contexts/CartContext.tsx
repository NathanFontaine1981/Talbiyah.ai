import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface CartItem {
  id: string;
  user_id: string;
  teacher_id: string;
  teacher_name?: string;
  subject_id: string;
  subject_name?: string;
  scheduled_time: string;
  duration_minutes: 30 | 60;
  price: number;
  created_at: string;
  expires_at: string;
  lesson_tier?: 'standard' | 'premium';
}

interface ExpiryNotification {
  id: string;
  teacherName: string;
  scheduledTime: string;
  type: 'expiring_soon' | 'expired';
  expiresAt: string;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  loading: boolean;
  expiryNotifications: ExpiryNotification[];
  dismissExpiryNotification: (id: string) => void;
  addToCart: (item: Omit<CartItem, 'id' | 'user_id' | 'created_at' | 'expires_at'>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryNotifications, setExpiryNotifications] = useState<ExpiryNotification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const cartCount = cartItems.length;

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const discount = Math.floor(cartCount / 10) * 15.00;

  const finalPrice = Math.max(0, totalPrice - discount);

  // Check for expiring items and generate notifications
  function checkExpiringItems(items: CartItem[]) {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const notifications: ExpiryNotification[] = [];

    items.forEach(item => {
      const expiresAt = new Date(item.expires_at);

      // Check if item expires within 5 minutes
      if (expiresAt <= fiveMinutesFromNow && expiresAt > now && !dismissedNotifications.has(item.id)) {
        notifications.push({
          id: item.id,
          teacherName: item.teacher_name || 'Unknown Teacher',
          scheduledTime: item.scheduled_time,
          type: 'expiring_soon',
          expiresAt: item.expires_at
        });
      }
    });

    setExpiryNotifications(notifications);
  }

  function dismissExpiryNotification(id: string) {
    setDismissedNotifications(prev => new Set([...prev, id]));
    setExpiryNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function fetchCart() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          teacher_profiles!inner(
            id,
            profiles!inner(full_name)
          ),
          subjects!inner(name)
        `)
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const formattedItems: CartItem[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        teacher_id: item.teacher_id,
        teacher_name: item.teacher_profiles?.profiles?.full_name || 'Unknown Teacher',
        subject_id: item.subject_id,
        subject_name: item.subjects?.name || 'Unknown Subject',
        scheduled_time: item.scheduled_time,
        duration_minutes: item.duration_minutes,
        price: parseFloat(item.price),
        created_at: item.created_at,
        expires_at: item.expires_at,
        lesson_tier: item.lesson_tier || 'premium',
      }));

      setCartItems(formattedItems);
      checkExpiringItems(formattedItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(item: Omit<CartItem, 'id' | 'user_id' | 'created_at' | 'expires_at'>) {
    try {
      // Validate scheduled time is in the future
      const scheduledTime = new Date(item.scheduled_time);
      if (scheduledTime <= new Date()) {
        throw new Error('Cannot book a time slot in the past. Please select a future time.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          teacher_id: item.teacher_id,
          subject_id: item.subject_id,
          scheduled_time: item.scheduled_time,
          duration_minutes: item.duration_minutes,
          price: item.price,
          lesson_tier: item.lesson_tier || 'premium',
        });

      if (error) throw error;

      await fetchCart();
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      throw new Error(err.message || 'Failed to add item to cart');
    }
  }

  async function removeFromCart(itemId: string) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error removing from cart:', err);
      throw err;
    }
  }

  async function clearCart() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      throw err;
    }
  }

  async function refreshCart() {
    await fetchCart();
  }

  useEffect(() => {
    fetchCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCart();
    });

    const interval = setInterval(() => {
      fetchCart();
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        totalPrice,
        discount,
        finalPrice,
        loading,
        expiryNotifications,
        dismissExpiryNotification,
        addToCart,
        removeFromCart,
        clearCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
