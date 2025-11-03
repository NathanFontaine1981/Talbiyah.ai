import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    timezone: '',
    learner_name: ''
  });

  useEffect(() => {
    const code = searchParams.get('ref');
    if (code) {
      setReferralCode(code);
    }
  }, [searchParams]);

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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          timezone: formData.timezone
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const userRole = user.user_metadata?.selected_role;

      if (userRole === 'teacher') {
        navigate('/apply-to-teach');
      } else {
        let referrerLearnerId = null;

        if (referralCode) {
          const { data: referrerLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('referral_code', referralCode)
            .maybeSingle();

          referrerLearnerId = referrerLearner?.id || null;
        }

        const learnerName = formData.learner_name || formData.full_name;

        const { error: learnerError } = await supabase
          .from('learners')
          .insert({
            name: learnerName,
            parent_id: user.id,
            referred_by: referrerLearnerId
          });

        if (learnerError) throw learnerError;

        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-slate-800/50 backdrop-blur rounded-3xl border border-slate-700/50 shadow-2xl p-8 md:p-12">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <User className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome! Let's complete your profile.</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {referralCode && (
            <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <p className="text-cyan-400 text-sm">
                You were referred! You'll earn bonus rewards when you complete lessons.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-3">
                Your Full Name (Parent/Guardian) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="learner_name" className="block text-sm font-medium text-slate-300 mb-3">
                Student's Name <span className="text-slate-500">(Optional - defaults to your name)</span>
              </label>
              <input
                type="text"
                id="learner_name"
                value={formData.learner_name}
                onChange={(e) => setFormData({ ...formData, learner_name: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="If different from your name"
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-slate-300 mb-3">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                id="phone_number"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="+44 123 456 7890"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-slate-300 mb-3">
                Your Timezone <span className="text-red-400">*</span>
              </label>
              <select
                id="timezone"
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              >
                <option value="" className="bg-slate-800">Select your timezone</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-slate-800">
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 mt-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save and Continue</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
