import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, User, GraduationCap, Loader2, Mail, Lock, ArrowLeft, Gift, Users, CheckCircle, XCircle, AlertTriangle, Compass, Phone, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { validateEmail } from '../utils/emailValidation';
import { validatePassword, getStrengthColor, getStrengthTextColor } from '../utils/passwordValidation';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autoRole = (location.state as any)?.autoRole;
  const referralCodeFromUrl = searchParams.get('ref');
  const typeFromUrl = searchParams.get('type'); // Check for ?type=explorer

  // If type=explorer is in URL, auto-select explorer role and skip to form
  const isExplorerSignup = typeFromUrl === 'explorer';
  const [step, setStep] = useState<'role' | 'form'>(autoRole || isExplorerSignup ? 'form' : 'role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'parent' | 'teacher' | 'explorer'>(
    isExplorerSignup ? 'explorer' : (autoRole || 'student')
  );
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [countryCode, setCountryCode] = useState('+44'); // Default to UK
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Common country codes - UK first as default
  const countryCodes = [
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+353', country: 'Ireland', flag: '🇮🇪' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+962', country: 'Jordan', flag: '🇯🇴' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  ];

  // Filter countries based on input
  const filteredCountries = countryCode
    ? countryCodes.filter(c =>
        c.code.includes(countryCode) ||
        c.country.toLowerCase().includes(countryCode.toLowerCase().replace('+', ''))
      )
    : countryCodes;

  // Get current country info for display
  const currentCountry = countryCodes.find(c => c.code === countryCode);
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl || '');
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [referralValidation, setReferralValidation] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof validatePassword> | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  function extractReferralCode(value: string): string {
    // If user pastes a full URL, extract just the referral code
    const trimmed = value.trim();

    // Check if it's a URL with ?ref= parameter
    if (trimmed.includes('?ref=') || trimmed.includes('&ref=')) {
      try {
        const url = new URL(trimmed);
        const refParam = url.searchParams.get('ref');
        if (refParam) {
          return refParam;
        }
      } catch {
        // Not a valid URL, try regex extraction
        const match = trimmed.match(/[?&]ref=([^&\s]+)/);
        if (match) {
          return match[1];
        }
      }
    }

    // Return as-is if not a URL
    return trimmed;
  }

  async function handleReferralCodeChange(value: string) {
    // Extract code if user pastes a full referral URL
    const extractedCode = extractReferralCode(value);
    setReferralCode(extractedCode);

    // Reset validation when user changes the code
    if (extractedCode === '') {
      setReferralValidation('idle');
      setReferrerName(null);
    }
  }

  async function validateReferralCode() {
    if (referralCode && referralCode.trim() !== '') {
      await loadReferrerInfo();
    }
  }

  function handleEmailChange(value: string) {
    setAuthForm({ ...authForm, email: value });
    // Clear email error when user types
    if (emailError) {
      setEmailError(null);
    }
  }

  function handleEmailBlur() {
    if (authForm.email.trim()) {
      const validation = validateEmail(authForm.email);
      if (!validation.valid) {
        setEmailError(validation.error || 'Invalid email');
      } else {
        setEmailError(null);
      }
    }
  }

  function handlePasswordChange(value: string) {
    setAuthForm({ ...authForm, password: value });
    if (value) {
      setPasswordStrength(validatePassword(value));
    } else {
      setPasswordStrength(null);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');

    if (!agreedToTerms) {
      setAuthError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!authForm.fullName.trim()) {
      setAuthError('Please enter your full name');
      return;
    }

    if (!authForm.phone.trim()) {
      setAuthError('Please enter your phone number');
      return;
    }

    // Basic phone validation - allow digits, spaces, hyphens, parentheses (no + as country code is separate)
    const phoneRegex = /^[\d\s()-]{6,15}$/;
    if (!phoneRegex.test(authForm.phone.trim())) {
      setAuthError('Please enter a valid phone number (digits only, without country code)');
      return;
    }

    // Combine country code with phone number
    const fullPhoneNumber = `${countryCode} ${authForm.phone.trim()}`;

    // Validate email before signup
    const emailValidation = validateEmail(authForm.email);
    if (!emailValidation.valid) {
      setAuthError(emailValidation.error || 'Invalid email address');
      setEmailError(emailValidation.error || 'Invalid email address');
      return;
    }

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    // Validate password strength
    const pwdValidation = validatePassword(authForm.password);
    if (!pwdValidation.valid) {
      setAuthError(pwdValidation.errors[0]);
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
            phone: fullPhoneNumber,
            selected_role: selectedRole,
            referral_code: referralCode.trim() || null
          }
        }
      });

      if (error) throw error;

      if (data.user) {

        // Generate unique 6-char referral code for new user
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        const newReferralCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

        // Parents are students with parent capabilities, explorers just get explorer role
        const roles = selectedRole === 'parent'
          ? ['student', 'parent']
          : selectedRole === 'explorer'
            ? ['explorer']
            : [selectedRole];

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: authForm.fullName.trim(),
            phone: fullPhoneNumber,
            role: selectedRole,  // Set the singular role field
            roles: roles,
            referral_code: selectedRole === 'explorer' ? null : newReferralCode, // No referral for explorers
            onboarding_completed: selectedRole !== 'parent'  // Only parents need onboarding
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
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
              // Update the new user's profile with the referrer
              await supabase
                .from('profiles')
                .update({ referred_by: referrerProfile.id })
                .eq('id', data.user.id);

              // Create referral record for tracking rewards
              await supabase
                .from('referrals')
                .upsert({
                  referrer_id: referrerProfile.id,
                  referred_user_id: data.user.id,
                  status: 'pending',
                  completed_lessons: 0,
                  total_hours: 0,
                  credits_earned: 0,
                  conversion_paid: false
                }, {
                  onConflict: 'referrer_id,referred_user_id',
                  ignoreDuplicates: true
                });

              // Update the referrer's total_referrals count
              const { data: referrerCredits } = await supabase
                .from('referral_credits')
                .select('total_referrals')
                .eq('user_id', referrerProfile.id)
                .maybeSingle();

              if (referrerCredits) {
                await supabase
                  .from('referral_credits')
                  .update({ total_referrals: (referrerCredits.total_referrals || 0) + 1 })
                  .eq('user_id', referrerProfile.id);
              } else {
                await supabase
                  .from('referral_credits')
                  .insert({ user_id: referrerProfile.id, total_referrals: 1 });
              }

              // NOTE: Referral notification is sent AFTER email verification via database trigger
              // This ensures referrers only get notified for verified users
            }
          } catch (refError) {
            console.error('Error creating referral record:', refError);
            // Don't block signup if referral tracking fails
          }
        }
      }

      if (data.user) {
        // Send welcome email to new user
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'welcome',
              recipient_email: authForm.email,
              recipient_name: authForm.fullName.trim(),
              data: {}
            }
          });
        } catch (welcomeEmailError) {
          console.error('Error sending welcome email:', welcomeEmailError);
          // Don't block signup if welcome email fails
        }

        // Send admin notification email
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'admin_new_signup',
              recipient_email: 'contact@talbiyah.ai',
              recipient_name: 'Talbiyah Admin',
              data: {
                user_name: authForm.fullName.trim(),
                user_email: authForm.email,
                user_role: selectedRole,
                signup_time: new Date().toISOString(),
                referral_code: referralCode.trim() || null
              }
            }
          });
        } catch (adminEmailError) {
          console.error('Error sending admin notification:', adminEmailError);
          // Don't block signup if admin email fails
        }

        // Check if email confirmation is required (user not confirmed yet)
        if (!data.user.email_confirmed_at) {
          // Show toast before redirecting
          toast.success('Account created! Check your email for the verification code.', {
            description: 'Be sure to check your spam/junk folder too.',
            duration: 5000
          });
          // Redirect to email verification page with email in state
          navigate('/verify-email', { state: { email: authForm.email, returnTo: selectedRole === 'explorer' ? '/explore' : undefined } });
        } else if (selectedRole === 'explorer') {
          // Explorers go directly to Exploring Islam
          navigate('/explore');
        } else if (selectedRole === 'parent') {
          // Parents go through onboarding wizard to add children
          navigate('/onboarding');
        } else {
          // Other users go through normal welcome flow
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 mb-8">
              <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Where are you on your journey?
            </h1>
            <p className="text-xl text-gray-500">Choose your path and we'll guide you</p>
          </div>

          {/* Top row - Exploring & New to Islam */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6">
            <button
              onClick={() => navigate('/explore')}
              className="group"
            >
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-amber-500 hover:shadow-lg transition text-center h-full">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Compass className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">I'm curious about Islam</h3>
                <p className="text-gray-500 text-sm">Explore freely, no signup needed</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/new-muslim-landing')}
              className="group"
            >
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-lg transition text-center h-full relative">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">I'm new to Islam</h3>
                <p className="text-gray-500 text-sm">Begin your foundations journey</p>
              </div>
            </button>
          </div>

          {/* Bottom row - Student, Parent, Teacher */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <button
              onClick={() => {
                setSelectedRole('student');
                setStep('form');
              }}
              className="group"
            >
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition text-center h-full">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a Student of Islam</h3>
                <p className="text-gray-500 text-sm">Learn Quran & Arabic with teachers</p>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedRole('parent');
                setStep('form');
              }}
              className="group"
            >
              <div className="bg-white p-8 rounded-2xl border-2 border-emerald-500 hover:shadow-lg transition text-center h-full relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                </div>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a Parent</h3>
                <p className="text-gray-500 text-sm">Manage your children's learning</p>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedRole('teacher');
                setStep('form');
              }}
              className="group"
            >
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-rose-500 hover:shadow-lg transition text-center h-full">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">I want to Teach</h3>
                <p className="text-gray-500 text-sm">Share your knowledge with others</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {/* Skip to form link for accessibility */}
      <a
        href="#signup-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to signup form
      </a>

      <div className="w-full max-w-md">
        <button
          onClick={() => (autoRole || isExplorerSignup) ? navigate(isExplorerSignup ? '/explore' : '/') : setStep('role')}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div id="signup-form" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              Create Your Account
            </h2>
            <p className="text-gray-500">
              {selectedRole === 'student' ? 'Start your learning journey' :
               selectedRole === 'parent' ? 'Manage your children\'s learning' :
               selectedRole === 'explorer' ? 'Save your progress and explore at your own pace' :
               'Apply to become a teacher'}
            </p>
          </div>

          {referralCodeFromUrl && referrerName && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-700 font-semibold text-sm">You were referred by {referrerName}!</p>
                  <p className="text-emerald-600 text-xs mt-1">Welcome to our community! Complete signup to track your referral.</p>
                </div>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{selectedRole === 'parent' ? 'Parent Full Name' : 'Full Name'}</span>
                  {selectedRole === 'parent' && (
                    <span className="text-xs text-emerald-600">(Required for parent account)</span>
                  )}
                </div>
              </label>
              <input
                type="text"
                required
                value={authForm.fullName}
                onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={selectedRole === 'parent' ? 'Your full name (e.g., Sarah Ahmed)' : 'Your full name'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${
                    emailError ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="your.email@example.com"
                />
                {emailError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              {emailError && (
                <p className="text-red-500 text-sm mt-2 flex items-start space-x-1">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                  <span className="text-xs text-red-500">*</span>
                </div>
              </label>
              <div className="flex gap-2">
                {/* Country Code Input with Dropdown */}
                <div className="relative">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={countryCode}
                      onChange={(e) => {
                        let val = e.target.value;
                        // Ensure it starts with +
                        if (val && !val.startsWith('+')) {
                          val = '+' + val;
                        }
                        setCountryCode(val);
                        setShowCountryDropdown(true);
                      }}
                      onFocus={() => setShowCountryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                      className="w-24 px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="+44"
                    />
                    {currentCountry && (
                      <span className="absolute right-2 text-lg pointer-events-none">{currentCountry.flag}</span>
                    )}
                  </div>
                  {/* Dropdown */}
                  {showCountryDropdown && filteredCountries.length > 0 && (
                    <div className="absolute z-50 mt-1 w-72 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                      {filteredCountries.slice(0, 10).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCountryCode(c.code);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-emerald-50 flex items-center gap-2 text-sm"
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="font-medium">{c.code}</span>
                          <span className="text-gray-500">{c.country}</span>
                        </button>
                      ))}
                      {filteredCountries.length > 10 && (
                        <p className="px-3 py-2 text-xs text-gray-400 text-center">
                          Type to filter more countries...
                        </p>
                      )}
                      {filteredCountries.length === 0 && countryCode && (
                        <p className="px-3 py-2 text-xs text-gray-500 text-center">
                          Using custom code: {countryCode}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="7123 456789"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {currentCountry ? `${currentCountry.flag} ${currentCountry.country}` : 'Enter country code or select from list'} — We'll use this to contact you about lessons
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authForm.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {passwordStrength && authForm.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor(passwordStrength.strength)} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getStrengthTextColor(passwordStrength.strength)}`}>
                      {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                  {passwordStrength.errors.length > 0 && (
                    <p className="text-red-500 text-xs">{passwordStrength.errors[0]}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Confirm Password</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Referral Code Field - Only for students and parents (not teachers or explorers) */}
            {selectedRole !== 'teacher' && selectedRole !== 'explorer' && (
            <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Gift className="w-4 h-4" />
                  <span>Referral Code</span>
                  <span className="text-xs text-gray-400">(Optional)</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  onBlur={validateReferralCode}
                  disabled={!!referralCodeFromUrl}
                  className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${
                    referralCodeFromUrl ? 'opacity-75 cursor-not-allowed' : ''
                  } ${
                    referralValidation === 'valid' ? 'border-emerald-500' :
                    referralValidation === 'invalid' ? 'border-red-400' :
                    'border-gray-300'
                  }`}
                  placeholder="e.g., nathan-a3f9x2"
                />
                {referralValidation === 'checking' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  </div>
                )}
                {referralValidation === 'valid' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
                {referralValidation === 'invalid' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>

              {/* Referrer Name Display */}
              {referralValidation === 'valid' && referrerName && (
                <p className="text-emerald-600 text-sm mt-2 flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Referred by: <strong>{referrerName}</strong></span>
                </p>
              )}

              {/* Invalid Code Message */}
              {referralValidation === 'invalid' && (
                <p className="text-red-500 text-sm mt-2">
                  This referral code doesn't exist. Please check and try again.
                </p>
              )}

              {/* Locked Message */}
              {referralCodeFromUrl && (
                <p className="text-gray-500 text-xs mt-2">
                  Referral code locked from your signup link
                </p>
              )}

              {/* Benefits Tip */}
              {!referralCodeFromUrl && referralValidation === 'idle' && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-gray-600 text-xs leading-relaxed">
                    <strong className="text-emerald-600">Tip:</strong> Get 1 free lesson when your referrer completes 10 learning hours!
                  </p>
                </div>
              )}
            </div>

            {/* Referral Benefits Explanation - Collapsible */}
            <details className="bg-gray-50 border border-gray-200 rounded-xl">
              <summary className="p-4 cursor-pointer font-semibold text-gray-900 flex items-center space-x-2 hover:bg-gray-100 rounded-xl transition">
                <Gift className="w-5 h-5 text-emerald-500" />
                <span>Why Use a Referral Code?</span>
                <span className="text-xs text-gray-400 ml-auto">(tap to expand)</span>
              </summary>
              <div className="px-5 pb-5 space-y-3">
                <div>
                  <p className="text-gray-700 text-sm font-medium mb-2">When you sign up with a referral code:</p>
                  <ul className="space-y-1.5 text-gray-600 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-500 flex-shrink-0">•</span>
                      <span>Help a friend/family member earn free lessons</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-500 flex-shrink-0">•</span>
                      <span>Join a community of learners</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-700 text-sm font-medium mb-2">When you refer others:</p>
                  <ul className="space-y-1.5 text-gray-600 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-500 flex-shrink-0">•</span>
                      <span><strong className="text-emerald-600">Earn 1 FREE lesson</strong> for every 10 learning hours</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-500 flex-shrink-0">•</span>
                      <span>Share the gift of Quranic understanding</span>
                    </li>
                  </ul>
                </div>
              </div>
            </details>
            </>
            )}

            {/* Terms and Privacy Consent */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={authLoading || !agreedToTerms}
              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
