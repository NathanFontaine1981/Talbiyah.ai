import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ArrowLeft, ShoppingCart, Trash2, CreditCard, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, cartCount, totalPrice, discount, finalPrice, removeFromCart, clearCart, loading } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/teachers')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Teachers</span>
            </button>

            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <ShoppingCart className="w-6 h-6" />
              <span>Your Cart</span>
            </h1>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-slate-600" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Your cart is empty</h2>
            <p className="text-slate-400 mb-8">Add lessons to your cart to get started</p>
            <button
              onClick={() => navigate('/teachers')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
            >
              Browse Teachers
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Cart Items ({cartCount})
                </h2>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all items from your cart?')) {
                      clearCart();
                    }
                  }}
                  className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear All</span>
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 relative group"
                >
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-400 opacity-0 group-hover:opacity-100 transition"
                    title="Remove from cart"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {item.subject_name || 'Unknown Subject'}
                      </h3>
                      <p className="text-sm text-slate-400">
                        with {item.teacher_name || 'Unknown Teacher'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        £{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span>📅</span>
                      <span>{format(parseISO(item.scheduled_time), 'EEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🕐</span>
                      <span>{format(parseISO(item.scheduled_time), 'h:mm a')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>⏱️</span>
                      <span>{item.duration_minutes} minutes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-6">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Lessons ({cartCount})</span>
                    <span>£{totalPrice.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-cyan-400">
                      <span>Block Discount</span>
                      <span>-£{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-700 flex items-center justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span>£{finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Checkout</span>
                </button>

                <p className="text-xs text-center text-slate-500 mt-4">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
