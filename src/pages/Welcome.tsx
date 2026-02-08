import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const LEARNING_GOALS = [
  { id: 'quran', label: 'Quran', icon: '📖' },
  { id: 'arabic_language', label: 'Arabic Language', icon: '🌍' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Helsinki',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires'
];

export default function Welcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    timezone: '',
    learner_name: ''
  });
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    const code = searchParams.get('ref');
    if (code) {
      setReferralCode(code);
    }
    loadUserData();
  }, [searchParams]);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Try to get name from user metadata (signup) or profile
      const nameFromSignup = user.user_metadata?.full_name || '';

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, phone_number, role, timezone')
        .eq('id', user.id)
        .maybeSingle();

      // Get role from profile first (source of truth), fall back to metadata
      const role = profile?.role || user.user_metadata?.selected_role || 'student';
      setUserRole(role);

      // Auto-detect timezone
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Use phone_number first, fall back to phone (set by signup trigger)
      const phoneFromProfile = profile?.phone_number || profile?.phone || '';

      setFormData({
        full_name: profile?.full_name || nameFromSignup,
        phone_number: phoneFromProfile,
        timezone: profile?.timezone || detectedTimezone,
        learner_name: ''
      });
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleGoal(goalId: string) {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, roles')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const userRole = user.user_metadata?.selected_role || 'student';
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            timezone: formData.timezone,
            roles: [userRole]
          });
      } else {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            timezone: formData.timezone
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      const userRole = user.user_metadata?.selected_role || profile?.role;

      if (userRole === 'teacher') {
        // Teacher profile is auto-created by signup trigger — go straight to dashboard
        navigate('/dashboard');
        return;
      } else {
        let referrerUserId = null;
        let referrerCode = null;

        if (referralCode) {
          // Look up the learner by referral code, get the parent (user) ID
          const { data: referrerLearner } = await supabase
            .from('learners')
            .select('parent_id, referral_code')
            .eq('referral_code', referralCode)
            .maybeSingle();

          if (referrerLearner) {
            referrerUserId = referrerLearner.parent_id;
            referrerCode = referrerLearner.referral_code;
          }
        }

        const learnerName = formData.learner_name || formData.full_name;

        const { error: learnerError } = await supabase
          .from('learners')
          .insert({
            name: learnerName,
            parent_id: user.id,
            referred_by: referrerUserId, // FK references profiles, not learners
            learning_goals: selectedGoals.length > 0 ? selectedGoals : null
          });

        if (learnerError) throw learnerError;

        // If referred, create referrals record and send notification
        if (referrerUserId && referrerUserId !== user.id) {
          // Update profile with referrer
          await supabase
            .from('profiles')
            .update({ referred_by: referrerUserId })
            .eq('id', user.id);

          // Create referrals record
          await supabase
            .from('referrals')
            .upsert({
              referrer_id: referrerUserId,
              referred_user_id: user.id,
              status: 'pending',
              completed_lessons: 0,
              total_hours: 0,
              credits_earned: 0,
              notification_sent: false,
              conversion_paid: false
            }, {
              onConflict: 'referrer_id,referred_user_id',
              ignoreDuplicates: true
            });

          // Send notification to referrer
          try {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-referral-signup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                referrer_id: referrerUserId,
                referred_id: user.id,
                referral_code: referrerCode || referralCode
              })
            });
          } catch (notifyError) {
            console.error('Error sending referral notification:', notifyError);
          }
        }

        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-50 dark:bg-gray-800 backdrop-blur rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-8 md:p-12">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {formData.full_name ? `Welcome, ${formData.full_name.split(' ')[0]}!` : 'Welcome!'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {userRole === 'teacher' ? 'Just a few quick details before your application...' : 'Let\'s complete your profile.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {referralCode && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-emerald-600 text-sm">
                You were referred! You'll earn bonus rewards when you complete lessons.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field - hidden for teachers with pre-filled name */}
            {userRole !== 'teacher' && (
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                  Your Full Name {userRole === 'parent' ? '(Parent/Guardian)' : ''} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            {/* Student name field - only for parents */}
            {userRole === 'parent' && (
              <div>
                <label htmlFor="learner_name" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                  Child's Name <span className="text-gray-500 dark:text-gray-400">(Optional - defaults to your name)</span>
                </label>
                <input
                  type="text"
                  id="learner_name"
                  value={formData.learner_name}
                  onChange={(e) => setFormData({ ...formData, learner_name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Enter your child's name"
                />
              </div>
            )}

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                id="phone_number"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="+44 123 456 7890"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                Your Timezone <span className="text-red-400">*</span>
              </label>
              <select
                id="timezone"
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              >
                <option value="" className="bg-gray-100 dark:bg-gray-700">Select your timezone</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-gray-100 dark:bg-gray-700">
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            {/* Learning Goals - only for non-teachers */}
            {userRole !== 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                  What would you like to learn? <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {LEARNING_GOALS.map(goal => (
                    <label
                      key={goal.id}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                        selectedGoals.includes(goal.id)
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400'
                          : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGoals.includes(goal.id)}
                        onChange={() => toggleGoal(goal.id)}
                        className="w-5 h-5 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-xl">{goal.icon}</span>
                      <span className={`font-medium ${
                        selectedGoals.includes(goal.id) ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'
                      }`}>
                        {goal.label}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedGoals.length === 0 && (
                  <p className="text-sm text-amber-500 mt-2">Please select at least one subject</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (userRole !== 'teacher' && selectedGoals.length === 0)}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 mt-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{userRole === 'teacher' ? 'Continue to Application' : 'Save and Continue'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
