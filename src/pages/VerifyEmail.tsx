import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  async function sendReferralNotificationIfNeeded(userId: string) {
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id, notification_sent, status')
        .eq('referred_user_id', userId)
        .eq('notification_sent', false)
        .maybeSingle();

      if (referral && referral.referrer_id) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', referral.referrer_id)
          .single();

        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-referral-signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            referrer_id: referral.referrer_id,
            referred_id: userId,
            referral_code: referrer?.referral_code || 'UNKNOWN'
          })
        });
      }
    } catch (error) {
      console.error('Error sending referral notification:', error);
    }
  }

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

  function handleOtpChange(index: number, value: string) {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // Handle backspace - move to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      inputRefs.current[5]?.focus();
    }
  }

  async function handleVerify() {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otpCode,
        type: 'signup'
      });

      if (verifyError) {
        if (verifyError.message.includes('expired')) {
          setError('Code has expired. Please request a new one.');
        } else if (verifyError.message.includes('invalid')) {
          setError('Invalid code. Please check and try again.');
        } else {
          setError(verifyError.message);
        }
        return;
      }

      if (data.user) {
        // Send referral notification if applicable
        await sendReferralNotificationIfNeeded(data.user.id);

        toast.success('Email verified successfully!');

        // Redirect based on role
        const userRole = data.user.user_metadata?.selected_role;
        if (userRole === 'parent') {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  async function resendCode() {
    if (resendCountdown > 0) return;

    setResending(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;

      toast.success('New verification code sent!');
      setResendCountdown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']); // Clear current input
    } catch (error: any) {
      console.error('Error resending code:', error);
      toast.error(error?.message || 'Failed to resend code. Please try again.');
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
          Verify Your Email
        </h1>

        <p className="text-center text-gray-500 mb-6">
          As-salamu alaykum! 🌙
        </p>

        {/* Email Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            We've sent a 6-digit verification code to:
          </p>
          <p className="font-semibold text-gray-900 mt-2 text-center text-lg">
            {userEmail}
          </p>
        </div>

        {/* Spam Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-amber-800 text-sm text-center font-medium">
            Don't see the email? Check your spam/junk folder!
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter verification code
          </label>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 flex items-center justify-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={verifying || otp.join('').length !== 6}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2 mb-4"
        >
          {verifying ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Verify Email</span>
            </>
          )}
        </button>

        {/* Resend Button */}
        <button
          onClick={resendCode}
          disabled={resending || resendCountdown > 0}
          className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg font-medium transition flex items-center justify-center space-x-2 mb-6"
        >
          {resending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : resendCountdown > 0 ? (
            <span>Resend code in {resendCountdown}s</span>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Resend Code</span>
            </>
          )}
        </button>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">
            Didn't receive the code?
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
          Code expires in 24 hours
        </p>
      </div>
    </div>
  );
}
