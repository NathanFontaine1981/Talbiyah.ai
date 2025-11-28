import { ParentData } from '../../pages/Onboarding';

interface ParentDetailsStepProps {
  data: ParentData;
  onChange: (data: ParentData) => void;
  onNext: () => void;
}

const COUNTRY_CODES = [
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
];

export default function ParentDetailsStep({ data, onChange, onNext }: ParentDetailsStepProps) {
  const isValid = data.fullName.trim().length >= 2 && data.phoneNumber.trim().length >= 6;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Talbiyah.ai! 🌙</h1>
          <p className="text-gray-600">Let's set up your account so we can best serve your family.</p>
        </div>

        {/* Full Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Fatima Ahmed"
            className="w-full p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            value={data.fullName}
            onChange={e => onChange({ ...data, fullName: e.target.value })}
          />
        </div>

        {/* Phone Number with Country Code */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              className="w-28 p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition bg-white"
              value={data.phoneCountryCode}
              onChange={e => onChange({ ...data, phoneCountryCode: e.target.value })}
            >
              {COUNTRY_CODES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="7700 900123"
              className="flex-1 p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              value={data.phoneNumber}
              onChange={e => onChange({ ...data, phoneNumber: e.target.value.replace(/[^0-9\s]/g, '') })}
            />
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you prefer we contact you? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'whatsapp', icon: '📱', label: 'WhatsApp', color: 'green' },
              { id: 'email', icon: '📧', label: 'Email', color: 'blue' },
              { id: 'telegram', icon: '✈️', label: 'Telegram', color: 'sky' },
              { id: 'sms', icon: '💬', label: 'SMS', color: 'gray' }
            ].map(option => (
              <button
                key={option.id}
                type="button"
                className={`p-3.5 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  data.preferredContact === option.id
                    ? option.color === 'green'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : option.color === 'blue'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : option.color === 'sky'
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                onClick={() => onChange({ ...data, preferredContact: option.id as ParentData['preferredContact'] })}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* How did you hear about us */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            How did you hear about us?
          </label>
          <select
            className="w-full p-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition bg-white"
            value={data.howHeardAboutUs}
            onChange={e => onChange({ ...data, howHeardAboutUs: e.target.value })}
          >
            <option value="">Select (optional)</option>
            <option value="friend_family">Friend or Family</option>
            <option value="mosque">Mosque</option>
            <option value="social_media">Social Media</option>
            <option value="google">Google Search</option>
            <option value="youtube">YouTube</option>
            <option value="school">School</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white p-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
        >
          Continue →
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Your information is secure and will never be shared with third parties.
        </p>
      </div>
    </div>
  );
}
