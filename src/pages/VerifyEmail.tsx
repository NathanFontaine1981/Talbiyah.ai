import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkEmailStatus();

    // Listen for auth state changes (email verification)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        // Email is now verified, redirect to dashboard
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  async function checkEmailStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/');
        return;
      }

      setUserEmail(user.email || '');

      // If email is already verified, redirect to dashboard
      if (user.email_confirmed_at) {
        navigate('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking email status:', error);
    } finally {
      setChecking(false);
    }
  }

  async function resendEmail() {
    setResending(true);
    setSent(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });

        if (error) throw error;

        setSent(true);
        setTimeout(() => setSent(false), 5000); // Hide message after 5 seconds
      }
    } catch (error: any) {
      console.error('Error resending email:', error);
      alert(error?.message || 'Failed to resend email. Please try again.');
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
          <p className="text-gray-600">Checking email verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Mail className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Verify Your Email
        </h1>

        <p className="text-center text-gray-500 mb-6">
          As-salamu alaykum! 🌙
        </p>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            We've sent a verification link to:
          </p>
          <p className="font-semibold text-gray-900 mt-2 text-center text-lg">
            {userEmail}
          </p>
        </div>

        <p className="text-gray-600 text-sm text-center mb-6">
          Please check your inbox and click the verification link to activate your account.
        </p>

        {/* Success Message */}
        {sent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">
                Verification email sent! Check your inbox.
              </span>
            </div>
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={resendEmail}
          disabled={resending || sent}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2 mb-4"
        >
          {resending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : sent ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Email Sent!</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Resend Verification Email</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Need help?</span>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">
            Didn't receive the email?
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email</li>
            <li>• Click "Resend" to get a new verification link</li>
            <li>• Wait a few minutes and check again</li>
          </ul>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Sign Out</span>
        </button>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Verification link expires in 24 hours
        </p>
      </div>
    </div>
  );
}
