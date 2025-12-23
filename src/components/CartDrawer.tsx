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
        className="fixed inset-0 bg-gray-50/80 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
              <p className="text-sm text-gray-500">{cartCount} {cartCount === 1 ? 'lesson' : 'lessons'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-500">Add lessons to get started</p>
            </div>
          ) : (
            <>
              {cartItems.map((item) => {
                const scheduledDate = new Date(item.scheduled_time);
                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-emerald-500/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{item.teacher_name}</h4>
                        <p className="text-sm text-gray-500">{item.subject_name}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-red-500/20 hover:text-red-400 transition flex items-center justify-center text-gray-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>{format(scheduledDate, 'EEE, MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>{format(scheduledDate, 'h:mm a')} ({item.duration_minutes} min)</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-sm text-gray-500">Price</span>
                      <span className="font-bold text-gray-900">£{item.price.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}

              {freeSessionsEarned > 0 && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-blue-600/10 rounded-xl p-4 border border-emerald-500/30">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-gray-900" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Block Booking Reward!</h4>
                      <p className="text-sm text-gray-600">
                        You've earned {freeSessionsEarned} free {freeSessionsEarned === 1 ? 'session' : 'sessions'} (60 min each)
                      </p>
                      <p className="text-xs text-emerald-600 mt-2">
                        -£{discount.toFixed(2)} discount applied
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sessionsUntilNextFree > 0 && sessionsUntilNextFree < 10 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Progress to next free session</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {10 - sessionsUntilNextFree}/10
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${((10 - sessionsUntilNextFree) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Add {sessionsUntilNextFree} more {sessionsUntilNextFree === 1 ? 'session' : 'sessions'} to unlock a free 60-min lesson!
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal ({cartCount} lessons)</span>
                <span>£{totalPrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="flex items-center space-x-2">
                    <Gift className="w-4 h-4" />
                    <span>Block Booking Discount</span>
                  </span>
                  <span>-£{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-2xl">£{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-gray-900 rounded-xl text-lg font-bold transition shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Proceed to Checkout</span>
            </button>

            <p className="text-xs text-center text-gray-500">
              Your cart items are reserved for 15 minutes
            </p>
          </div>
        )}
      </div>
    </>
  );
}
