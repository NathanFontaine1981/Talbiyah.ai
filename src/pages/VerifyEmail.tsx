import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [checking, setChecking] = useState(true);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
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

  async function checkEmailStatus() {
    try {
      const stateEmail = (location.state as any)?.email;
      const { data: { user } } = await supabase.auth.getUser();

      if (!user && !stateEmail) {
        navigate('/');
        return;
      }

      setUserEmail(stateEmail || user?.email || '');

      if (user?.email_confirmed_at) {
        const returnTo = (location.state as any)?.returnTo;
        navigate(returnTo || '/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking email status:', error);
    } finally {
      setChecking(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or next empty one
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all 6 digits pasted
    if (pastedData.length === 6) {
      handleVerifyOtp(pastedData);
    }
  }

  async function handleVerifyOtp(code?: string) {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otpCode,
        type: 'signup',
      });

      if (error) throw error;

      setVerified(true);
      toast.success('Email verified successfully!');

      const { data: { user } } = await supabase.auth.getUser();
      const userRole = user?.user_metadata?.selected_role;
      const returnTo = (location.state as any)?.returnTo;

      setTimeout(() => {
        if (userRole === 'parent') {
          supabase
            .from('parent_children')
            .select('id')
            .eq('parent_id', user?.id)
            .limit(1)
            .then(({ data }) => {
              navigate(data && data.length > 0 ? '/dashboard' : '/onboarding');
            })
            .catch(() => navigate('/onboarding'));
        } else if (userRole === 'explorer' || userRole === 'new_muslim') {
          navigate(returnTo || '/dashboard');
        } else {
          // Go through Welcome for profile setup, passing returnTo
          navigate('/welcome', { state: { returnTo } });
        }
      }, 2000);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error?.message || 'Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function resendVerification() {
    if (resendCountdown > 0) return;
    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;

      toast.success('New verification code sent!');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Error resending:', error);
      toast.error(error?.message || 'Failed to resend. Please try again.');
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

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-14 h-14 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-lg text-gray-600 mb-1">Your account is ready.</p>
          <p className="text-sm text-gray-400">Redirecting to your dashboard...</p>
          <div className="mt-6">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            We've sent a verification code and link to:
          </p>
          <p className="font-semibold text-gray-900 mt-2 text-center text-lg">
            {userEmail}
          </p>
        </div>

        {/* OTP Code Input */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3 text-center">
            Enter the 6-digit code from your email:
          </p>
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={verifying}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition disabled:opacity-50 disabled:bg-gray-50"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerifyOtp()}
            disabled={verifying || otp.join('').length !== 6}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Email</span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 uppercase">or click the link in your email</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Spam Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-amber-800 text-sm text-center font-medium">
            Don't see the email? Check your spam/junk folder!
          </p>
        </div>

        {/* Resend Button */}
        <button
          onClick={resendVerification}
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
              <span>Resend Verification Code</span>
            </>
          )}
        </button>

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
