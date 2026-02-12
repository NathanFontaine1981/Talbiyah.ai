import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ArrowRight, X, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ProfileField {
  key: string;
  label: string;
}

const REQUIRED_FIELDS: ProfileField[] = [
  { key: 'full_name', label: 'Full name' },
  { key: 'phone_number', label: 'Phone number' },
  { key: 'date_of_birth', label: 'Date of birth' },
  { key: 'location', label: 'Location' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'gender', label: 'Gender' },
];

const DISMISS_KEY = 'talbiyah_profile_banner_dismissed_at';

export default function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [completionPercent, setCompletionPercent] = useState(100);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  async function checkProfileCompletion() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if dismissed recently (re-show after 3 days)
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const daysSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 3) {
          setDismissed(true);
          setLoading(false);
          return;
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone_number, date_of_birth, location, timezone, gender')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const missing: string[] = [];
      for (const field of REQUIRED_FIELDS) {
        const value = profile[field.key as keyof typeof profile];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missing.push(field.label);
        }
      }

      const completed = REQUIRED_FIELDS.length - missing.length;
      const percent = Math.round((completed / REQUIRED_FIELDS.length) * 100);

      setMissingFields(missing);
      setCompletionPercent(percent);
    } catch (err) {
      console.error('Error checking profile completion:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }

  if (loading || dismissed || missingFields.length === 0) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1">Complete Your Profile</h3>
            <p className="text-blue-100 text-sm mb-3">
              Your profile is {completionPercent}% complete. Add your details so teachers and the community can get to know you better.
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-xs bg-white/20 rounded-full h-2 mb-3">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            {/* Missing fields */}
            <div className="flex flex-wrap gap-2 mb-4">
              {missingFields.map((field) => (
                <span
                  key={field}
                  className="px-2.5 py-1 bg-white/15 text-white text-xs rounded-full"
                >
                  {field}
                </span>
              ))}
            </div>

            <button
              onClick={() => navigate('/account/settings')}
              className="px-5 py-2.5 bg-white hover:bg-gray-100 text-indigo-600 rounded-full font-semibold transition shadow-lg flex items-center gap-2 text-sm"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-white/60 hover:text-white transition p-1 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
