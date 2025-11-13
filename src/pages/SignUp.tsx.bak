import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, User, GraduationCap, Loader2, Mail, Lock, ArrowLeft, Gift } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getDashboardRoute } from '../lib/authHelpers';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autoRole = (location.state as any)?.autoRole;
  const referralCode = searchParams.get('ref');

  const [step, setStep] = useState<'role' | 'form'>(autoRole ? 'form' : 'role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>(autoRole || 'student');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    if (referralCode) {
      loadReferrerInfo();
    }
  }, [referralCode]);

  async function loadReferrerInfo() {
    if (!referralCode) return;

    try {
      const { data: learner } = await supabase
        .from('learners')
        .select('name, profiles!learners_parent_id_fkey(full_name)')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (learner) {
        const name = (learner as any).profiles?.full_name || learner.name || 'A friend';
        setReferrerName(name);
      }
    } catch (err) {
      console.error('Error loading referrer:', err);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    if (authForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: {
            selected_role: selectedRole,
            referral_code: referralCode || null
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('User created successfully:', data.user.id);

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: null,
            roles: [selectedRole]
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
        } else {
          console.log('Profile created for user:', data.user.id);
        }
      }

      if (data.user && referralCode) {
        const { data: newLearner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', data.user.id)
          .maybeSingle();

        if (newLearner) {
          const { data: referrerLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('referral_code', referralCode)
            .maybeSingle();

          if (referrerLearner) {
            await supabase
              .from('learners')
              .update({ referred_by: referrerLearner.id })
              .eq('id', newLearner.id);

            await supabase
              .from('referrals')
              .insert({
                referrer_id: referrerLearner.id,
                referred_id: newLearner.id,
                hours_completed: 0,
                credits_awarded: 0
              });
          }
        }
      }

      if (data.user) {
        navigate('/welcome');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  if (step === 'role' && !autoRole) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                <BookOpen className="w-12 h-12 text-cyan-400 relative" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Create Your Account</span>
            </h1>
            <p className="text-xl text-slate-400">Choose how you'd like to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => {
                setSelectedRole('student');
                setStep('form');
              }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-10 rounded-3xl border border-slate-700/50 hover:border-cyan-500/50 transition text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">I am a Student</h3>
                <p className="text-slate-400 mb-4">or Parent for a Student</p>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 rounded-lg">
                  <span className="text-cyan-400 font-semibold text-sm">Most Popular</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedRole('teacher');
                setStep('form');
              }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-3xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm p-10 rounded-3xl border border-slate-700/50 hover:border-slate-600 transition text-center">
                <div className="w-20 h-20 mx-auto bg-slate-700 rounded-2xl flex items-center justify-center mb-6">
                  <GraduationCap className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">I want to Teach</h3>
                <p className="text-slate-400 mb-4">Apply as a Teacher</p>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-400 font-semibold text-sm">Public Application</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => autoRole ? navigate('/') : setStep('role')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                <BookOpen className="w-10 h-10 text-cyan-400 relative" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Create Your Account
            </h2>
            <p className="text-slate-400">
              {selectedRole === 'student' ? 'Start your learning journey' : 'Apply to become a teacher'}
            </p>
          </div>

          {referralCode && referrerName && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <Gift className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">Referred by {referrerName}</p>
                  <p className="text-slate-300 text-xs mt-1">You're joining through a referral! Welcome to our community.</p>
                </div>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
              </label>
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                </div>
              </label>
              <input
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Confirm Password</span>
                </div>
              </label>
              <input
                type="password"
                required
                value={authForm.confirmPassword}
                onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/', { state: { showSignIn: true } })}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
