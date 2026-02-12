import { useState, useEffect } from 'react';
import { UserCircle, X, Check, MapPin, Phone, Calendar, Globe, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

const PROFILE_FIELDS = ['full_name', 'phone_number', 'date_of_birth', 'location', 'timezone', 'gender'] as const;
const MODAL_SKIP_KEY = 'talbiyah_profile_modal_skipped_at';

export default function CompleteProfileModal() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    phone_country_code: '+44',
    date_of_birth: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    gender: '',
  });

  useEffect(() => {
    checkAndShow();
  }, []);

  async function checkAndShow() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Check if skipped this session (re-show every new login/session)
      const skippedAt = sessionStorage.getItem(MODAL_SKIP_KEY);
      if (skippedAt) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone_number, phone_country_code, date_of_birth, location, timezone, gender')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Find which fields are missing
      const missing: string[] = [];
      for (const field of PROFILE_FIELDS) {
        const value = profile[field as keyof typeof profile];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missing.push(field);
        }
      }

      if (missing.length === 0) return;

      // Pre-fill form with existing data
      setForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        phone_country_code: profile.phone_country_code || '+44',
        date_of_birth: profile.date_of_birth || '',
        location: profile.location || '',
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        gender: profile.gender || '',
      });

      setMissingFields(missing);
      setOpen(true);
    } catch (err) {
      console.error('Error checking profile:', err);
    }
  }

  function handleSkip() {
    sessionStorage.setItem(MODAL_SKIP_KEY, Date.now().toString());
    setOpen(false);
  }

  async function handleSave() {
    if (!userId) return;

    setSaving(true);
    try {
      const updates: Record<string, string | null> = {};

      if (form.full_name.trim()) updates.full_name = form.full_name.trim();
      if (form.phone_number.trim()) {
        updates.phone_number = form.phone_number.trim();
        updates.phone_country_code = form.phone_country_code;
      }
      if (form.date_of_birth) updates.date_of_birth = form.date_of_birth;
      if (form.location.trim()) updates.location = form.location.trim();
      if (form.timezone.trim()) updates.timezone = form.timezone.trim();
      if (form.gender) updates.gender = form.gender;

      if (Object.keys(updates).length === 0) {
        toast.error('Please fill in at least one field');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast.success('Profile updated!');
      setOpen(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const filledCount = PROFILE_FIELDS.length - missingFields.length;
  const totalCount = PROFILE_FIELDS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <UserCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Complete Your Profile</h2>
                <p className="text-emerald-100 text-sm">{filledCount}/{totalCount} fields complete</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-white/60 hover:text-white transition p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${Math.round((filledCount / totalCount) * 100)}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Help us personalise your experience. This only takes a moment.
          </p>

          {/* Full Name */}
          {missingFields.includes('full_name') && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <UserCircle className="w-4 h-4 text-gray-400" />
                Full Name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Phone Number */}
          {missingFields.includes('phone_number') && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={form.phone_country_code}
                  onChange={(e) => setForm({ ...form, phone_country_code: e.target.value })}
                  className="w-24 px-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="+44">+44</option>
                  <option value="+1">+1</option>
                  <option value="+91">+91</option>
                  <option value="+92">+92</option>
                  <option value="+966">+966</option>
                  <option value="+971">+971</option>
                  <option value="+20">+20</option>
                  <option value="+90">+90</option>
                  <option value="+60">+60</option>
                  <option value="+62">+62</option>
                  <option value="+33">+33</option>
                  <option value="+49">+49</option>
                </select>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="7700 900000"
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Gender */}
          {missingFields.includes('gender') && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                Gender
              </label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, gender: opt.value })}
                    className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-lg border text-sm font-medium transition ${
                      form.gender === opt.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date of Birth */}
          {missingFields.includes('date_of_birth') && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Date of Birth
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Location */}
          {missingFields.includes('location') && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. London, UK"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Timezone */}
          {missingFields.includes('timezone') && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Globe className="w-4 h-4 text-gray-400" />
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select timezone</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur (MYT)</option>
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="America/Toronto">America/Toronto (EST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            Complete Later
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
