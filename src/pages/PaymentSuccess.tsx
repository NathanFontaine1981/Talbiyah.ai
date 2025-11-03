import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Mail, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-12 border border-slate-700/50 backdrop-blur-sm shadow-xl text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-xl text-slate-300 mb-8">
            Your sessions have been booked successfully
          </p>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 text-left">
            <h2 className="text-lg font-semibold text-white mb-4">What's Next?</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Check Your Dashboard</p>
                  <p className="text-sm text-slate-400">
                    View all your upcoming sessions and join them when it's time. You'll find everything you need on your dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Check Your Email</p>
                  <p className="text-sm text-slate-400">
                    We've sent you a confirmation email with all your session details and calendar invites.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Prepare for Your Sessions</p>
                  <p className="text-sm text-slate-400">
                    Make sure you have a quiet space and good internet connection. You'll receive a reminder 15 minutes before each session.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20 mb-8">
            <p className="text-sm text-slate-300 mb-2">
              Need help or have questions?
            </p>
            <p className="text-cyan-400 font-medium">
              Contact us at support@talbiyah.ai
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/teachers')}
            className="w-full mt-4 px-8 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition"
          >
            Book More Sessions
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Thank you for choosing Talbiyah.ai for your Islamic learning journey
          </p>
        </div>
      </div>
    </div>
  );
}
