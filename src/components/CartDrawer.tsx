import { X, ShoppingCart, Calendar, Clock, Trash2, Gift, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { format } from 'date-fns';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { cartItems, cartCount, totalPrice, discount, finalPrice, removeFromCart } = useCart();

  if (!isOpen) return null;

  const freeSessionsEarned = Math.floor(cartCount / 10);
  const sessionsUntilNextFree = cartCount % 10 === 0 ? 10 : 10 - (cartCount % 10);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Cart</h2>
              <p className="text-sm text-slate-400">{cartCount} {cartCount === 1 ? 'lesson' : 'lessons'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">Your cart is empty</p>
              <p className="text-sm text-slate-500">Add lessons to get started</p>
            </div>
          ) : (
            <>
              {cartItems.map((item) => {
                const scheduledDate = new Date(item.scheduled_time);
                return (
                  <div
                    key={item.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{item.teacher_name}</h4>
                        <p className="text-sm text-slate-400">{item.subject_name}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-red-500/20 hover:text-red-400 transition flex items-center justify-center text-slate-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>{format(scheduledDate, 'EEE, MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>{format(scheduledDate, 'h:mm a')} ({item.duration_minutes} min)</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                      <span className="text-sm text-slate-400">Price</span>
                      <span className="font-bold text-white">£{item.price.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}

              {freeSessionsEarned > 0 && (
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-xl p-4 border border-cyan-500/30">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Block Booking Reward!</h4>
                      <p className="text-sm text-slate-300">
                        You've earned {freeSessionsEarned} free {freeSessionsEarned === 1 ? 'session' : 'sessions'} (60 min each)
                      </p>
                      <p className="text-xs text-cyan-400 mt-2">
                        -£{discount.toFixed(2)} discount applied
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sessionsUntilNextFree > 0 && sessionsUntilNextFree < 10 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Progress to next free session</span>
                    <span className="text-sm font-semibold text-cyan-400">
                      {10 - sessionsUntilNextFree}/10
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${((10 - sessionsUntilNextFree) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Add {sessionsUntilNextFree} more {sessionsUntilNextFree === 1 ? 'session' : 'sessions'} to unlock a free 60-min lesson!
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-slate-800 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Subtotal ({cartCount} lessons)</span>
                <span>£{totalPrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-cyan-400">
                  <span className="flex items-center space-x-2">
                    <Gift className="w-4 h-4" />
                    <span>Block Booking Discount</span>
                  </span>
                  <span>-£{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-bold text-white pt-2 border-t border-slate-700">
                <span>Total</span>
                <span className="text-2xl">£{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-lg font-bold transition shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Proceed to Checkout</span>
            </button>

            <p className="text-xs text-center text-slate-500">
              Your cart items are reserved for 15 minutes
            </p>
          </div>
        )}
      </div>
    </>
  );
}
