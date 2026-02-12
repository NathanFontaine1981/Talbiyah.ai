import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkEmailStatus();
  }, [navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  async function checkEmailStatus() {
    try {
      // First check if email was passed via navigation state
      const stateEmail = (location.state as any)?.email;

      const { data: { user } } = await supabase.auth.getUser();

      if (!user && !stateEmail) {
        navigate('/');
        return;
      }

      setUserEmail(stateEmail || user?.email || '');

      // If email is already verified, redirect to dashboard
      if (user?.email_confirmed_at) {
        navigate('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking email status:', error);
    } finally {
      setChecking(false);
    }
  }

  async function resendMagicLink() {
    if (resendCountdown > 0) return;

    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;

      toast.success('New verification link sent!');
      setResendCountdown(60);
    } catch (error: any) {
      console.error('Error resending link:', error);
      toast.error(error?.message || 'Failed to resend link. Please try again.');
    } finally {
      setResending(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Check Your Email
        </h1>

        <p className="text-center text-gray-500 mb-6">
          As-salamu alaykum! 🌙
        </p>

        {/* Email Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            We've sent a verification link to:
          </p>
          <p className="font-semibold text-gray-900 mt-2 text-center text-lg">
            {userEmail}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-emerald-800 text-sm text-center font-medium">
            Click the link in the email to verify your account and get started.
          </p>
        </div>

        {/* Spam Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-amber-800 text-sm text-center font-medium">
            Don't see the email? Check your spam/junk folder!
          </p>
        </div>

        {/* Resend Button */}
        <button
          onClick={resendMagicLink}
          disabled={resending || resendCountdown > 0}
          className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg font-medium transition flex items-center justify-center space-x-2 mb-6"
        >
          {resending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : resendCountdown > 0 ? (
            <span>Resend link in {resendCountdown}s</span>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Resend Verification Link</span>
            </>
          )}
        </button>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">
            Didn't receive the email?
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Wait a few minutes for the email to arrive</li>
          </ul>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full px-6 py-3 text-gray-500 hover:text-gray-700 rounded-lg font-medium transition flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Use a different email</span>
        </button>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Link expires in 24 hours
        </p>
      </div>
    </div>
  );
}
