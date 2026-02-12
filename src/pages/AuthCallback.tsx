import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  async function handleAuthCallback() {
    try {
      // Get the hash fragment from URL (contains tokens)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'signup' && accessToken) {
        // Email confirmation successful
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });

        if (error) throw error;

        setStatus('success');
        setMessage('Email verified successfully!');

        // Check user role to determine redirect
        const { data: { user } } = await supabase.auth.getUser();
        const userRole = user?.user_metadata?.selected_role;
        const userName = user?.user_metadata?.full_name?.split(' ')[0] || '';

        // Show persistent toast that stays after redirect
        toast.success(`Welcome${userName ? `, ${userName}` : ''}! Your email has been verified.`, {
          description: 'Your account is ready to use.',
          duration: 6000,
        });

        // Wait 3 seconds so user sees the confirmation
        setTimeout(() => {
          if (userRole === 'parent') {
            // Check if parent has completed onboarding (has children)
            supabase
              .from('parent_children')
              .select('id')
              .eq('parent_id', user?.id)
              .limit(1)
              .then(({ data }) => {
                if (data && data.length > 0) {
                  navigate('/dashboard');
                } else {
                  navigate('/onboarding');
                }
              })
              .catch(() => navigate('/onboarding'));
          } else {
            navigate('/dashboard');
          }
        }, 3000);
      } else if (type === 'recovery') {
        // Password reset
        navigate('/reset-password');
      } else {
        // Handle OAuth or other auth state changes
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          throw new Error('No valid session found');
        }
      }
    } catch (error: any) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to verify email. Please try again.');

      // Redirect to home after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <main id="main-content" role="status" aria-live="polite" className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-14 h-14 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-lg text-gray-600 mb-1">{message}</p>
            <p className="text-sm text-gray-400">Redirecting to your dashboard...</p>
            <div className="mt-6">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </>
        )}

        {status === 'error' && (
          <div role="alert">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-gray-900 rounded-lg font-semibold transition"
            >
              Go to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
