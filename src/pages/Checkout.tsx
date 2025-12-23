import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useBookingAPI } from '../hooks/useBookingAPI';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CreditCard, CheckCircle, Loader2, ShoppingCart, User, Gift, Coins } from 'lucide-react';
import { format } from 'date-fns';

interface Child {
  id: string;
  child_name: string;
  child_age: number | null;
  has_account: boolean;
  learner_id: string | null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartCount, totalPrice, discount, finalPrice, loading: cartLoading, clearCart } = useCart();
  const { initiateBookingCheckout, loading: checkoutLoading } = useBookingAPI();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [referralBalance, setReferralBalance] = useState(0);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [hasUnlimitedCredits, setHasUnlimitedCredits] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'credits'>('stripe');
  const [freeFirstLesson, setFreeFirstLesson] = useState(false);
  const [freeFirstLessonDiscount, setFreeFirstLessonDiscount] = useState(0);

  useEffect(() => {
    loadUserAndChildren();
    loadReferralBalance();
    loadCreditBalance();
    checkFreeFirstLesson();
  }, []);

  useEffect(() => {
    // Auto-calculate referral discount based on available balance
    if (referralBalance > 0 && finalPrice > 0) {
      const appliedAmount = Math.min(referralBalance, finalPrice - promoDiscount - freeFirstLessonDiscount);
      setReferralDiscount(appliedAmount);
    } else {
      setReferralDiscount(0);
    }
  }, [referralBalance, finalPrice, promoDiscount, freeFirstLessonDiscount]);

  useEffect(() => {
    // Auto-apply free first lesson discount (one lesson only)
    if (freeFirstLesson && cartItems.length > 0 && paymentMethod === 'stripe') {
      // Apply free lesson to the cheapest item (or first item)
      const cheapestItem = [...cartItems].sort((a, b) => a.price - b.price)[0];
      setFreeFirstLessonDiscount(cheapestItem.price);
    } else {
      setFreeFirstLessonDiscount(0);
    }
  }, [freeFirstLesson, cartItems, paymentMethod]);

  async function loadUserAndChildren() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single();

      if (profile?.roles && profile.roles.includes('parent')) {
        setIsParent(true);

        const { data: childrenData } = await supabase
          .from('parent_children')
          .select('*')
          .eq('parent_id', user.id);

        const childrenWithLearners = await Promise.all(
          (childrenData || []).map(async (child) => {
            // parent_children uses child_id to reference learners
            let learnerId = child.child_id;

            if (!learnerId) {
              const { data: newLearner } = await supabase
                .from('learners')
                .insert({
                  parent_id: user.id,
                  name: child.child_name,
                  age: child.child_age
                })
                .select()
                .single();

              if (newLearner) {
                learnerId = newLearner.id;

                // Update parent_children with the child_id (learner reference)
                await supabase
                  .from('parent_children')
                  .update({ child_id: learnerId })
                  .eq('id', child.id);
              }
            }

            return {
              ...child,
              learner_id: learnerId
            };
          })
        );

        setChildren(childrenWithLearners);

        if (childrenWithLearners.length === 1) {
          setSelectedChildId(childrenWithLearners[0].id);
        }
      } else {
        // Student booking for themselves
        setSelectedChildId('self');
      }
    } catch (err) {
      console.error('Error loading user/children:', err);
      setError(err instanceof Error ? err.message : 'Failed to load account information');
    } finally {
      setLoading(false);
    }
  }

  async function loadReferralBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create referral credits
      let { data: credits } = await supabase
        .from('referral_credits')
        .select('available_balance')
        .eq('user_id', user.id)
        .single();

      if (!credits) {
        const { data: newCredits } = await supabase
          .from('referral_credits')
          .insert({ user_id: user.id })
          .select('available_balance')
          .single();
        credits = newCredits;
      }

      setReferralBalance(credits?.available_balance || 0);
    } catch (error) {
      console.error('Error loading referral balance:', error);
      setReferralBalance(0);
    }
  }

  async function loadCreditBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has unlimited credits (Gold account)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('unlimited_credits')
        .eq('id', user.id)
        .single();

      if (profileData?.unlimited_credits) {
        setHasUnlimitedCredits(true);
        setPaymentMethod('credits'); // Auto-select credits for unlimited users
        return;
      }

      const { data: credits, error } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading credit balance:', error);
        return;
      }

      if (credits) {
        setCreditBalance(credits.credits_remaining || 0);
        // Auto-select credits if user has enough
        const totalDurationHours = cartItems.reduce((acc, item) => acc + item.duration_minutes / 60, 0);
        if (credits.credits_remaining >= totalDurationHours) {
          setPaymentMethod('credits');
        }
      }
    } catch (error) {
      console.error('Error loading credit balance:', error);
      setCreditBalance(0);
    }
  }

  async function checkFreeFirstLesson() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has any completed or scheduled lessons
      const { data: learners } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id);

      const learnerIds = learners?.map(l => l.id) || [];

      let hasAnyLessons = false;
      if (learnerIds.length > 0) {
        const { count } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .in('learner_id', learnerIds)
          .not('status', 'in', '(cancelled_by_teacher,cancelled_by_student)');
        hasAnyLessons = (count || 0) > 0;
      }

      // If no lessons yet, they're eligible for free first lesson
      if (!hasAnyLessons) {
        setFreeFirstLesson(true);
      }
    } catch (error) {
      console.error('Error checking free first lesson:', error);
    }
  }

  // Calculate credits needed for cart (1 credit = 60 min, 0.5 credit = 30 min)
  const creditsNeeded = cartItems.reduce((total, item) => {
    return total + (item.duration_minutes === 30 ? 0.5 : 1);
  }, 0);
  // Unlimited credits users always have "enough"
  const hasEnoughCredits = hasUnlimitedCredits || creditBalance >= creditsNeeded;

  async function applyPromoCode() {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setApplyingPromo(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the database function to validate promo code
      const { data, error: rpcError } = await supabase.rpc('validate_promo_code', {
        p_code: promoCode.trim(),
        p_user_id: user.id,
        p_cart_value: finalPrice
      });

      if (rpcError) {
        // Fallback to legacy codes if the function doesn't exist yet
        if (rpcError.code === '42883' || rpcError.code === 'PGRST202') { // function not found
          // Handle legacy promo codes
          const upperCode = promoCode.toUpperCase();

          // 100OWNER - unlimited use owner code (100% off)
          if (upperCode === '100OWNER') {
            setPromoDiscount(finalPrice);
            setPromoApplied(true);
            setPromoCodeId(null);
            setError('');
            return;
          }

          // 100HONOR - first lesson only code (100% off)
          if (upperCode === '100HONOR') {
            // Check if user has any completed lessons
            const { data: learners } = await supabase
              .from('learners')
              .select('id')
              .eq('parent_id', user.id);

            const learnerIds = learners?.map(l => l.id) || [];

            let hasCompletedLessons = false;
            if (learnerIds.length > 0) {
              const { count } = await supabase
                .from('lessons')
                .select('id', { count: 'exact', head: true })
                .in('learner_id', learnerIds)
                .eq('status', 'completed');
              hasCompletedLessons = (count || 0) > 0;
            }

            if (hasCompletedLessons) {
              throw new Error('This promo code is only valid for your first lesson');
            }

            setPromoDiscount(finalPrice);
            setPromoApplied(true);
            setPromoCodeId(null);
            setError('');
            return;
          }

          throw new Error('Invalid promo code');
        }
        throw rpcError;
      }

      if (!data?.valid) {
        throw new Error(data?.error || 'Invalid promo code');
      }

      // Apply the discount
      setPromoDiscount(data.discount_amount);
      setPromoApplied(true);
      setPromoCodeId(data.promo_code_id);
      setError('');
    } catch (err) {
      console.error('Promo code error:', err);
      setError(err instanceof Error ? err.message : 'Invalid promo code');
      setPromoDiscount(0);
      setPromoApplied(false);
      setPromoCodeId(null);
    } finally {
      setApplyingPromo(false);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      // Validate no cart items are in the past
      const now = new Date();
      const pastItems = cartItems.filter(item => new Date(item.scheduled_time) <= now);
      if (pastItems.length > 0) {
        throw new Error('One or more sessions in your cart are scheduled in the past. Please remove them and select a future time slot.');
      }

      if (isParent && !selectedChildId) {
        throw new Error('Please select which child these sessions are for');
      }

      // Get subject slugs from database
      const subjectIds = [...new Set(cartItems.map(item => item.subject_id))];
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, slug')
        .in('id', subjectIds);

      if (subjectsError) throw subjectsError;

      const subjectMap = new Map(subjects?.map(s => [s.id, s.slug]) || []);

      // Calculate discounts properly:
      // 1. Block discount (from CartContext) is already applied to finalPrice
      // 2. Free first lesson, promo and referral discounts are additional on top of that
      const additionalDiscounts = freeFirstLessonDiscount + promoDiscount + referralDiscount;
      const actualPayable = Math.max(0, finalPrice - additionalDiscounts);

      // Calculate per-item price - first apply block discount ratio, then additional discounts
      const blockDiscountRatio = totalPrice > 0 ? discount / totalPrice : 0;
      const additionalDiscountRatio = finalPrice > 0 ? additionalDiscounts / finalPrice : 0;

      const bookings = cartItems.map(item => {
        // Apply block discount first
        let itemPrice = item.price * (1 - blockDiscountRatio);

        // Then apply promo/referral discounts
        if (additionalDiscounts > 0 && additionalDiscounts < finalPrice) {
          itemPrice = Math.max(0, itemPrice * (1 - additionalDiscountRatio));
        } else if (additionalDiscounts >= finalPrice) {
          itemPrice = 0;
        }

        return {
          teacher_id: item.teacher_id,
          subject_id: item.subject_id,
          scheduled_time: item.scheduled_time,
          date: item.scheduled_time.split('T')[0],
          time: item.scheduled_time.split('T')[1].substring(0, 5),
          subject: subjectMap.get(item.subject_id) || 'general',
          duration: item.duration_minutes,
          price: itemPrice,
          use_free_session: false
        };
      });

      // If 100% discount applied (actualPayable is 0), create bookings directly without Stripe
      if (actualPayable <= 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        // Determine learner_id
        let learnerId: string;
        if (isParent && selectedChildId) {
          const selectedChild = children.find(c => c.id === selectedChildId);
          if (!selectedChild?.learner_id) {
            throw new Error('Selected child has no learner profile');
          }
          learnerId = selectedChild.learner_id;
        } else {
          // Student booking for themselves - get or create learner
          const { data: existingLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', session.user.id)
            .maybeSingle();

          if (existingLearner) {
            learnerId = existingLearner.id;
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();

            const { data: newLearner } = await supabase
              .from('learners')
              .insert({
                parent_id: session.user.id,
                name: profile?.full_name || 'Student',
                gamification_points: 0
              })
              .select('id')
              .single();

            if (!newLearner) throw new Error('Failed to create learner profile');
            learnerId = newLearner.id;
          }
        }

        // Call edge function to create bookings with 100ms rooms
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking-with-room`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              cart_items: cartItems,
              learner_id: learnerId,
              promo_code: promoCode,
              promo_code_id: promoCodeId,
              promo_discount: promoDiscount
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create booking');
        }

        await response.json();

        // Deduct referral balance if used
        if (referralDiscount > 0) {
          const { data: credits } = await supabase
            .from('referral_credits')
            .select('available_balance, available_hours, total_used')
            .eq('user_id', session.user.id)
            .single();

          if (credits) {
            const hoursUsed = referralDiscount / 15; // £15 per hour
            await supabase
              .from('referral_credits')
              .update({
                available_balance: Math.max(0, credits.available_balance - referralDiscount),
                available_hours: Math.max(0, credits.available_hours - hoursUsed),
                total_used: credits.total_used + referralDiscount
              })
              .eq('user_id', session.user.id);

            // Record transaction
            await supabase
              .from('referral_transactions')
              .insert({
                user_id: session.user.id,
                type: 'used',
                credit_amount: -referralDiscount,
                hours_amount: -hoursUsed,
                description: `Used £${referralDiscount.toFixed(2)} referral balance for booking`
              });
          }
        }

        // Clear cart
        await clearCart();

        // Redirect to dashboard (no Stripe session for 100% discount)
        navigate('/dashboard?booking_success=true');
        return;
      }

      // Handle credit payment
      if (paymentMethod === 'credits' && hasEnoughCredits) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        // Determine learner_id
        let learnerId: string;
        if (isParent && selectedChildId) {
          const selectedChild = children.find(c => c.id === selectedChildId);
          if (!selectedChild?.learner_id) {
            throw new Error('Selected child has no learner profile');
          }
          learnerId = selectedChild.learner_id;
        } else {
          // Student booking for themselves - get or create learner
          const { data: existingLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', session.user.id)
            .maybeSingle();

          if (existingLearner) {
            learnerId = existingLearner.id;
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();

            const { data: newLearner } = await supabase
              .from('learners')
              .insert({
                parent_id: session.user.id,
                name: profile?.full_name || 'Student',
                gamification_points: 0
              })
              .select('id')
              .single();

            if (!newLearner) throw new Error('Failed to create learner profile');
            learnerId = newLearner.id;
          }
        }

        // Call edge function to create bookings with 100ms rooms
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking-with-room`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              cart_items: cartItems,
              learner_id: learnerId,
              payment_method: 'credits'
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create booking');
        }

        const result = await response.json();

        // Skip credit deduction for unlimited credits users (Gold accounts)
        if (!hasUnlimitedCredits) {
          // Deduct credits using the proper RPC function (handles transaction logging)
          const { error: creditError } = await supabase
            .rpc('deduct_user_credits', {
              p_user_id: session.user.id,
              p_credits: creditsNeeded,
              p_lesson_id: result.lessons?.[0]?.id || null,
              p_notes: `Used ${creditsNeeded} ${creditsNeeded === 1 ? 'credit' : 'credits'} for lesson booking`
            });

          if (creditError) {
            console.error('Error deducting credits:', creditError);
          }
        }

        // Clear cart
        await clearCart();

        // Redirect to dashboard
        navigate('/dashboard?booking_success=true&payment=credits');
        return;
      }

      const response = await initiateBookingCheckout(bookings, {
        referral_discount: referralDiscount
      });

      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate checkout');
    } finally {
      setProcessing(false);
    }
  }

  if (loading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add lessons to your cart to checkout</p>
          <button
            onClick={() => navigate('/teachers')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
          >
            Browse Teachers
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Teachers</span>
        </button>

        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const scheduledDate = new Date(item.scheduled_time);
                  return (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.teacher_name}</h4>
                          <p className="text-sm text-gray-500">{item.subject_name}</p>
                        </div>
                        <span className="font-bold text-gray-900">£{item.price.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(scheduledDate, 'EEE, MMM d, yyyy • h:mm a')} ({item.duration_minutes} min)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!(promoApplied && promoDiscount >= finalPrice) && !hasUnlimitedCredits && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Method</span>
                </h2>

                {/* Credit Balance Info */}
                {creditBalance > 0 && (
                  <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700">Your Credit Balance</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">{creditBalance} {creditBalance === 1 ? 'credit' : 'credits'}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      This booking requires {creditsNeeded} {creditsNeeded === 1 ? 'credit' : 'credits'}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Credits Option */}
                  {creditBalance > 0 && (
                    <button
                      onClick={() => setPaymentMethod('credits')}
                      disabled={!hasEnoughCredits}
                      className={`w-full p-4 rounded-xl text-left transition border-2 ${
                        paymentMethod === 'credits'
                          ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                          : hasEnoughCredits
                            ? 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'credits' ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}>
                          <Coins className={`w-6 h-6 ${paymentMethod === 'credits' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Use Credits</p>
                          <p className="text-sm text-gray-500">
                            {hasEnoughCredits
                              ? `Use ${creditsNeeded} ${creditsNeeded === 1 ? 'credit' : 'credits'} from your balance`
                              : `Need ${creditsNeeded - creditBalance} more ${(creditsNeeded - creditBalance) === 1 ? 'credit' : 'credits'}`
                            }
                          </p>
                        </div>
                        {paymentMethod === 'credits' && (
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        )}
                      </div>
                    </button>
                  )}

                  {/* Stripe Option */}
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`w-full p-4 rounded-xl text-left transition border-2 ${
                      paymentMethod === 'stripe'
                        ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        paymentMethod === 'stripe' ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}>
                        <CreditCard className={`w-6 h-6 ${paymentMethod === 'stripe' ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Pay with Card</p>
                        <p className="text-sm text-gray-500">Secure payment via Stripe</p>
                      </div>
                      {paymentMethod === 'stripe' && (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {promoApplied && promoDiscount >= finalPrice && (
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Free Booking Confirmed</span>
                </h2>
                <p className="text-gray-600 mb-4">
                  Your promo code <span className="font-bold text-emerald-600">{promoCode.toUpperCase()}</span> has been applied! This booking is completely free.
                </p>
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-600">No payment required</p>
                      <p className="text-sm text-gray-600 mt-1">Click "Confirm Free Booking" to complete your booking.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gold Account - Unlimited Credits */}
            {hasUnlimitedCredits && (
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 rounded-2xl p-6 border-2 border-amber-400 shadow-xl shadow-amber-500/40">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <span className="text-2xl">👑</span>
                  <span className="text-amber-100">Gold Member</span>
                </h2>
                <p className="text-amber-100 mb-4">
                  As a Gold member, all your lessons are <span className="font-bold text-amber-200">free</span>!
                </p>
                <div className="bg-amber-800/60 rounded-xl p-4 border-2 border-amber-400/50">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-amber-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-100">Unlimited Credits Active</p>
                      <p className="text-sm text-amber-200 mt-1">Click "Confirm Free Booking" to complete your booking.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {isParent && children.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Who is this for?</span>
                </h3>
                <div className="space-y-3">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`w-full p-4 rounded-xl text-left transition ${
                        selectedChildId === child.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5" />
                        <div>
                          <div className="font-semibold">{child.child_name}</div>
                          {child.child_age && (
                            <div className="text-sm opacity-75">Age {child.child_age}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm lg:sticky lg:top-24">
              {freeFirstLesson && paymentMethod === 'stripe' && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">Free First Lesson!</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Welcome to Talbiyah! Your first lesson is on us. {freeFirstLessonDiscount > 0 && `£${freeFirstLessonDiscount.toFixed(2)} discount applied!`}
                  </p>
                </div>
              )}
              {referralBalance > 0 && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">Referral Balance Available</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    You have £{referralBalance.toFixed(2)} in referral rewards. {referralDiscount > 0 ? `£${referralDiscount.toFixed(2)} will be automatically applied to this order!` : 'Will be applied automatically.'}
                  </p>
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-4">Price Breakdown</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Lessons ({cartCount})</span>
                  <span>£{totalPrice.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Block Discount</span>
                    <span>-£{discount.toFixed(2)}</span>
                  </div>
                )}
                {freeFirstLessonDiscount > 0 && paymentMethod === 'stripe' && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Free First Lesson</span>
                    <span>-£{freeFirstLessonDiscount.toFixed(2)}</span>
                  </div>
                )}
                {promoApplied && promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Promo Code ({promoCode.toUpperCase()})</span>
                    <span>-£{promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div className="flex items-center justify-between text-amber-600">
                    <span>Referral Balance</span>
                    <span>-£{referralDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>£{Math.max(0, finalPrice - freeFirstLessonDiscount - promoDiscount - referralDiscount).toFixed(2)}</span>
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    disabled={promoApplied || applyingPromo}
                    className="flex-1 px-4 py-3 sm:py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={promoApplied || applyingPromo || !promoCode.trim()}
                    className="px-6 py-3 sm:py-2 min-h-[44px] bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {applyingPromo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>
                {promoApplied && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600">Promo code applied!</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={processing || checkoutLoading || (isParent && !selectedChildId) || (paymentMethod === 'credits' && !hasEnoughCredits)}
                className={`w-full px-6 py-4 text-white rounded-full text-lg font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                  hasUnlimitedCredits
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {processing || checkoutLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : hasUnlimitedCredits ? (
                  <>
                    <span>Confirm Free Booking</span>
                  </>
                ) : promoApplied && promoDiscount >= finalPrice ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirm Free Booking</span>
                  </>
                ) : paymentMethod === 'credits' ? (
                  <>
                    <Coins className="w-5 h-5" />
                    <span>Book with Credits</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>

              {hasUnlimitedCredits && (
                <p className="text-xs text-center text-amber-600 mt-4">
                  Gold Account - Free booking with unlimited credits
                </p>
              )}
              {!hasUnlimitedCredits && !(promoApplied && promoDiscount >= finalPrice) && paymentMethod === 'stripe' && (
                <p className="text-xs text-center text-gray-500 mt-4">
                  Secure payment powered by Stripe
                </p>
              )}
              {!hasUnlimitedCredits && !(promoApplied && promoDiscount >= finalPrice) && paymentMethod === 'credits' && (
                <p className="text-xs text-center text-emerald-600 mt-4">
                  {creditsNeeded} {creditsNeeded === 1 ? 'credit' : 'credits'} will be deducted from your balance
                </p>
              )}
              {promoApplied && promoDiscount >= finalPrice && (
                <p className="text-xs text-center text-emerald-600 mt-4">
                  Your booking is completely free with promo code {promoCode.toUpperCase()}!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
