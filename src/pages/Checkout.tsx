import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, CreditCard, Lock, CheckCircle, Loader2, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartCount, totalPrice, discount, finalPrice, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in to complete checkout');

      const { data: learnerData } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (!learnerData) {
        throw new Error('No learner profile found. Please complete your profile first.');
      }

      const lessonsToCreate = cartItems.map(item => ({
        learner_id: learnerData.id,
        teacher_id: item.teacher_id,
        subject_id: item.subject_id,
        scheduled_time: item.scheduled_time,
        duration_minutes: item.duration_minutes,
        status: 'booked',
        is_free_trial: false,
        teacher_rate_at_booking: item.duration_minutes === 30 ? 7.50 : 15.00,
        platform_fee: 10.00,
        total_cost_paid: item.price,
        payment_id: `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }));

      const { error: insertError } = await supabase
        .from('lessons')
        .insert(lessonsToCreate);

      if (insertError) throw insertError;

      await clearCart();

      setSuccess(true);

      setTimeout(() => {
        navigate('/payment-success');
      }, 2000);

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to complete checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  if (cartItems.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-slate-400 mb-6">Add lessons to your cart to checkout</p>
          <button
            onClick={() => navigate('/teachers')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
          >
            Browse Teachers
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Booking Confirmed!</h2>
          <p className="text-slate-300 mb-6">
            Your lessons have been successfully booked. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Teachers</span>
        </button>

        <h1 className="text-4xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Checkout
          </span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const scheduledDate = new Date(item.scheduled_time);
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{item.teacher_name}</h4>
                          <p className="text-sm text-slate-400">{item.subject_name}</p>
                        </div>
                        <span className="font-bold text-white">£{item.price.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {format(scheduledDate, 'EEE, MMM d, yyyy • h:mm a')} ({item.duration_minutes} min)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Method</span>
              </h2>
              <p className="text-slate-400 mb-4">
                Payment processing will be integrated in production.
              </p>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Demo Payment</p>
                    <p className="text-sm text-slate-400">Test mode - no actual charge</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 sticky top-6">
              <h3 className="text-lg font-bold text-white mb-4">Price Breakdown</h3>
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

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-lg font-bold transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Complete Booking</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-500 mt-4">
                By completing this booking, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
