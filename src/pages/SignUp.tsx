import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, User, GraduationCap, Loader2, Mail, Lock, ArrowLeft, Gift, Users, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autoRole = (location.state as any)?.autoRole;
  const referralCodeFromUrl = searchParams.get('ref');

  const [step, setStep] = useState<'role' | 'form'>(autoRole ? 'form' : 'role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'parent' | 'teacher'>(autoRole || 'student');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl || '');
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [referralValidation, setReferralValidation] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    if (referralCodeFromUrl) {
      loadReferrerInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReferrerInfo() {
    if (!referralCode || referralCode.trim() === '') {
      setReferralValidation('idle');
      setReferrerName(null);
      return;
    }

    setReferralValidation('checking');

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('referral_code', referralCode.trim())
        .maybeSingle();

      if (profile) {
        const name = profile.full_name || 'A friend';
        setReferrerName(name);
        setReferralValidation('valid');
      } else {
        setReferrerName(null);
        setReferralValidation('invalid');
      }
    } catch (err) {
      console.error('Error loading referrer:', err);
      setReferrerName(null);
      setReferralValidation('invalid');
    }
  }

  async function handleReferralCodeChange(value: string) {
    setReferralCode(value);

    // Reset validation when user changes the code
    if (value.trim() === '') {
      setReferralValidation('idle');
      setReferrerName(null);
    }
  }

  async function validateReferralCode() {
    if (referralCode && referralCode.trim() !== '') {
      await loadReferrerInfo();
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');

    if (!authForm.fullName.trim()) {
      setAuthError('Please enter your full name');
      return;
    }

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
            full_name: authForm.fullName.trim(),
            selected_role: selectedRole,
            referral_code: referralCode.trim() || null
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('User created successfully:', data.user.id);

        // Generate unique referral code for new user
        const name = authForm.fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10) || 'user';
        const random = Math.random().toString(36).substring(2, 8);
        const newReferralCode = `${name}-${random}`;

        // Parents are students with parent capabilities
        const roles = selectedRole === 'parent' ? ['student', 'parent'] : [selectedRole];

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: authForm.fullName.trim(),
            roles: roles,
            referral_code: newReferralCode
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
        } else {
          console.log('Profile created for user:', data.user.id);
        }

        // Handle referral tracking if user signed up with a referral code
        if (referralCode && referralCode.trim() !== '') {
          try {
            // Find the referrer by their referral code
            const { data: referrerProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', referralCode.trim())
              .maybeSingle();

            if (referrerProfile) {
              // Create referral record
              await supabase
                .from('referrals')
                .insert({
                  referrer_id: referrerProfile.id,
                  referred_id: data.user.id,
                  referral_code: referralCode.trim(),
                  status: 'pending'
                });

              console.log('Referral tracked successfully');
            }
          } catch (refError) {
            console.error('Error creating referral record:', refError);
            // Don't block signup if referral tracking fails
          }
        }
      }

      if (data.user) {
        // Parents go through onboarding wizard to add children
        // Other users go through normal welcome flow
        if (selectedRole === 'parent') {
          navigate('/parent/onboarding');
        } else {
          navigate('/welcome');
        }
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

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <button
              onClick={() => {
                setSelectedRole('student');
                setStep('form');
              }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-700/50 hover:border-cyan-500/50 transition text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I am a Student</h3>
                <p className="text-slate-400 text-sm">Learn Quran & Arabic</p>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedRole('parent');
                setStep('form');
              }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-700/50 hover:border-emerald-500/50 transition text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/50">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I am a Parent</h3>
                <p className="text-slate-400 text-sm mb-3">Manage multiple children</p>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                  <span className="text-emerald-400 font-semibold text-xs">Most Popular</span>
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
              <div className="relative bg-slate-800/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-700/50 hover:border-slate-600 transition text-center">
                <div className="w-16 h-16 mx-auto bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I want to Teach</h3>
                <p className="text-slate-400 text-sm">Apply as a Teacher</p>
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
              {selectedRole === 'student' ? 'Start your learning journey' :
               selectedRole === 'parent' ? 'Manage your children\'s learning' :
               'Apply to become a teacher'}
            </p>
          </div>

          {referralCodeFromUrl && referrerName && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <Gift className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">You were referred by {referrerName}!</p>
                  <p className="text-slate-300 text-xs mt-1">Welcome to our community! Complete signup to track your referral.</p>
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
                  <User className="w-4 h-4" />
                  <span>{selectedRole === 'parent' ? 'Parent Full Name' : 'Full Name'}</span>
                  {selectedRole === 'parent' && (
                    <span className="text-xs text-emerald-400">(Required for parent account)</span>
                  )}
                </div>
              </label>
              <input
                type="text"
                required
                value={authForm.fullName}
                onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder={selectedRole === 'parent' ? 'Your full name (e.g., Sarah Ahmed)' : 'Your full name'}
              />
            </div>

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

            {/* Referral Code Field - Only for students and parents (not teachers) */}
            {selectedRole !== 'teacher' && (
            <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Gift className="w-4 h-4" />
                  <span>Referral Code</span>
                  <span className="text-xs text-slate-500">(Optional)</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  onBlur={validateReferralCode}
                  disabled={!!referralCodeFromUrl}
                  className={`w-full px-4 py-3 pr-12 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
                    referralCodeFromUrl ? 'opacity-75 cursor-not-allowed' : ''
                  } ${
                    referralValidation === 'valid' ? 'border-emerald-500/50' :
                    referralValidation === 'invalid' ? 'border-red-500/50' :
                    'border-slate-700'
                  }`}
                  placeholder="e.g., nathan-a3f9x2"
                />
                {referralValidation === 'checking' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  </div>
                )}
                {referralValidation === 'valid' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
                {referralValidation === 'invalid' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                )}
              </div>

              {/* Referrer Name Display */}
              {referralValidation === 'valid' && referrerName && (
                <p className="text-emerald-400 text-sm mt-2 flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Referred by: <strong>{referrerName}</strong></span>
                </p>
              )}

              {/* Invalid Code Message */}
              {referralValidation === 'invalid' && (
                <p className="text-red-400 text-sm mt-2">
                  This referral code doesn't exist. Please check and try again.
                </p>
              )}

              {/* Locked Message */}
              {referralCodeFromUrl && (
                <p className="text-slate-400 text-xs mt-2">
                  🔒 Referral code locked from your signup link
                </p>
              )}

              {/* Benefits Tip */}
              {!referralCodeFromUrl && referralValidation === 'idle' && (
                <div className="mt-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                  <p className="text-slate-300 text-xs leading-relaxed">
                    💡 <strong>Tip:</strong> Get 1 free lesson when your referrer completes 10 learning hours!
                  </p>
                </div>
              )}
            </div>

            {/* Referral Benefits Explanation - Only for students and parents (not teachers) */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-white font-semibold text-base mb-3 flex items-center space-x-2">
                <Gift className="w-5 h-5 text-cyan-400" />
                <span>💡 Why Use a Referral Code?</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-2">When you sign up with a referral code:</p>
                  <ul className="space-y-1.5 text-slate-400 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 flex-shrink-0">•</span>
                      <span>Help a friend/family member earn free lessons</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 flex-shrink-0">•</span>
                      <span>Join a community of learners</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 flex-shrink-0">•</span>
                      <span>Support someone's learning journey</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <p className="text-slate-300 text-sm font-medium mb-2">When you refer others:</p>
                  <ul className="space-y-1.5 text-slate-400 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-400 flex-shrink-0">•</span>
                      <span><strong className="text-cyan-400">Earn 1 FREE lesson</strong> for every 10 learning hours your referrals complete</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-400 flex-shrink-0">•</span>
                      <span>Share the gift of Quranic understanding</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-400 flex-shrink-0">•</span>
                      <span>Help others while helping yourself</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            </>
            )}

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
