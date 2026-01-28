import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ArrowLeft, ShoppingCart, Trash2, CreditCard, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, cartCount, totalPrice, discount, finalPrice, removeFromCart, clearCart, loading } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to cart
      </a>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/teachers')}
              aria-label="Go back to teachers"
              className="flex items-center space-x-2 text-gray-500 hover:text-emerald-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Teachers</span>
            </button>

            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <ShoppingCart className="w-6 h-6" />
              <span>Your Cart</span>
            </h1>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Add lessons to your cart to get started</p>
            <button
              onClick={() => navigate('/teachers')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
            >
              Browse Teachers
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Cart Items ({cartCount})
                </h2>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all items from your cart?')) {
                      clearCart();
                    }
                  }}
                  className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear All</span>
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative group hover:border-emerald-300 transition"
                >
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-500 opacity-0 group-hover:opacity-100 transition"
                    aria-label={`Remove ${item.subject_name || 'item'} from cart`}
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.subject_name || 'Unknown Subject'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        with {item.teacher_name || 'Unknown Teacher'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        £{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
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
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

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

                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>£{finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Checkout</span>
                </button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
