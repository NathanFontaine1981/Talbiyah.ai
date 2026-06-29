import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import {
  CreditCard,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowLeft,
  ExternalLink,
  Globe
} from 'lucide-react';
import { COUNTRIES, isUKCountry } from '../data/locationConstants';

interface PaymentSettings {
  id?: string;
  teacher_id: string;
  preferred_payout_method: string;
  minimum_payout_amount: number;
  payout_schedule: string;
  stripe_account_id: string | null;
  stripe_onboarding_completed: boolean;
  bank_account_holder_name: string | null;
  bank_account_number: string | null;
  bank_sort_code: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_swift_bic: string | null;
  bank_country: string | null;
  bank_currency: string | null;
  taptap_phone: string | null;
  paypal_email: string | null;
  tax_id: string | null;
  vat_registered: boolean;
  vat_number: string | null;
}

export default function TeacherPaymentSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherCountry, setTeacherCountry] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>({
    teacher_id: '',
    preferred_payout_method: 'stripe_connect',
    minimum_payout_amount: 10.00,
    payout_schedule: 'monthly',
    stripe_account_id: null,
    stripe_onboarding_completed: false,
    bank_account_holder_name: null,
    bank_account_number: null,
    bank_sort_code: null,
    bank_name: null,
    bank_iban: null,
    bank_swift_bic: null,
    bank_country: null,
    bank_currency: null,
    taptap_phone: null,
    paypal_email: null,
    tax_id: null,
    vat_registered: false,
    vat_number: null,
  });
  const [stripeOnboarding, setStripeOnboarding] = useState(false);

  useEffect(() => {
    loadPaymentSettings();

    // Check if returning from Stripe Connect onboarding
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      // Refresh Stripe account status
      refreshStripeStatus();
    }
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setLoading(true);

      // Get teacher profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/', { state: { showSignIn: true } });
        return;
      }

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile) {
        console.error('No teacher profile found');
        return;
      }

      // Only approved teachers can access this page
      if (teacherProfile.status !== 'approved') {
        navigate('/teacher/pending-approval');
        return;
      }

      setTeacherId(teacherProfile.id);

      // Load the teacher's country to decide between UK and international bank fields
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();

      setTeacherCountry(profile?.country ?? null);

      // Load payment settings
      const { data: settingsData, error } = await supabase
        .from('teacher_payment_settings')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Initialize with teacher_id, pre-filling the bank country from their profile.
        // International teachers default to TapTap Send (the primary manual rail).
        const intl = profile?.country ? profile.country !== 'GB' : false;
        setSettings(prev => ({
          ...prev,
          teacher_id: teacherProfile.id,
          bank_country: profile?.country ?? null,
          preferred_payout_method: intl ? 'taptap_send' : prev.preferred_payout_method,
        }));
      }

    } catch (error) {
      console.error('Error loading payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teacherId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('teacher_payment_settings')
        .upsert({
          ...settings,
          teacher_id: teacherId,
        });

      if (error) throw error;

      toast.success('Payment settings saved successfully!');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const refreshStripeStatus = async () => {
    if (!teacherId) return;

    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-refresh', {
        body: { teacher_id: teacherId }
      });

      if (error) throw error;

      if (data.onboarding_complete) {
        setSettings(prev => ({ ...prev, stripe_onboarding_completed: true }));
        toast.success('Stripe account connected successfully!');
        // Clear URL params
        window.history.replaceState({}, '', '/teacher/payment-settings');
      }
    } catch (error) {
      console.error('Error refreshing Stripe status:', error);
    }
  };

  const handleStripeConnect = async () => {
    try {
      setStripeOnboarding(true);

      // Call Edge Function to create Stripe Connect account
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { teacher_id: teacherId }
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error starting Stripe Connect:', error);
      toast.error('Failed to start Stripe Connect onboarding. Please try again.');
      setStripeOnboarding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  // Teachers outside the UK (e.g. Egypt) are paid by international bank transfer
  // (Wise) rather than UK sort-code/account-number details.
  const isIntl = teacherCountry ? !isUKCountry(teacherCountry) : false;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/earnings')}
            className="flex items-center gap-2 text-gray-500 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Earnings
          </button>
          <h1 className="text-3xl font-bold text-white">Payment Settings</h1>
          <p className="text-gray-500 mt-1">Configure how you receive payments</p>
        </div>

        {/* Stripe Connect Section */}
        <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Stripe Connect</h2>
              <p className="text-sm text-gray-500 mb-4">
                Recommended for fast, secure, and automatic payouts directly to your bank account.
              </p>

              {isIntl && (
                <div className="flex items-start gap-2 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg mb-4">
                  <Globe className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1 text-amber-700">Outside the UK?</p>
                    <p>
                      Stripe Connect isn't available in some countries (including Egypt). If
                      onboarding won't complete, choose <strong>International Bank Transfer</strong>{' '}
                      below — we'll pay you by international transfer (Wise) instead.
                    </p>
                  </div>
                </div>
              )}

              {settings.stripe_onboarding_completed ? (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="font-medium text-emerald-300">Stripe Connected</p>
                    <p className="text-sm text-emerald-400/80">
                      Your Stripe account is set up and ready for payouts
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-2 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1 text-white">Connect your Stripe account to receive payouts</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Automatic payouts to your bank account</li>
                        <li>Secure payment processing</li>
                        <li>Track all transactions in one place</li>
                        <li>Standard Stripe fees apply (0.25% per payout)</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={handleStripeConnect}
                    disabled={stripeOnboarding}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {stripeOnboarding ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Connect with Stripe
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payout Preferences */}
        <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Payout Preferences</h2>

          <div className="space-y-6">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Preferred Payment Method
              </label>
              <select
                value={settings.preferred_payout_method}
                onChange={(e) => setSettings({ ...settings, preferred_payout_method: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
              >
                {isIntl && <option value="taptap_send">TapTap Send (Recommended)</option>}
                <option value="stripe_connect">
                  {isIntl ? 'Stripe Connect' : 'Stripe Connect (Recommended)'}
                </option>
                <option value="bank_transfer">
                  {isIntl ? 'International Bank Transfer (Wise)' : 'Manual Bank Transfer'}
                </option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {/* Minimum Payout Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Minimum Payout Amount (£)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={settings.minimum_payout_amount}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  // Enforce a £10 floor for payouts
                  const value = isNaN(parsed) ? 10 : Math.max(10, parsed);
                  setSettings({ ...settings, minimum_payout_amount: value });
                }}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">
                You'll receive payouts once your balance reaches this amount
              </p>
            </div>

            {/* Payout Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Payout Schedule
              </label>
              <select
                value={settings.payout_schedule}
                onChange={(e) => setSettings({ ...settings, payout_schedule: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="manual">Manual (on request)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TapTap Send (manual mobile/wallet payout) */}
        {settings.preferred_payout_method === 'taptap_send' && (
          <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">TapTap Send Details</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              We'll send your payouts via TapTap Send to the mobile number / wallet below.
              Make sure the name matches the account registered to receive the funds.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  value={settings.bank_account_holder_name || ''}
                  onChange={(e) => setSettings({ ...settings, bank_account_holder_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="As registered to receive funds"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Mobile / Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.taptap_phone || ''}
                  onChange={(e) => setSettings({ ...settings, taptap_phone: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="+20 1X XXXX XXXX"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include your country code (e.g. +20 for Egypt).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bank Details (for manual transfers) */}
        {settings.preferred_payout_method === 'bank_transfer' && (
          <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isIntl ? 'International Bank Account Details' : 'Bank Account Details'}
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={settings.bank_account_holder_name || ''}
                  onChange={(e) => setSettings({ ...settings, bank_account_holder_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="John Smith"
                />
              </div>

              {isIntl ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        IBAN
                      </label>
                      <input
                        type="text"
                        value={settings.bank_iban || ''}
                        onChange={(e) => setSettings({ ...settings, bank_iban: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                        placeholder="EG380019000500000000263180002"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        SWIFT / BIC
                      </label>
                      <input
                        type="text"
                        value={settings.bank_swift_bic || ''}
                        onChange={(e) => setSettings({ ...settings, bank_swift_bic: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                        placeholder="NBEGEGCX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Bank Country
                      </label>
                      <select
                        value={settings.bank_country || ''}
                        onChange={(e) => setSettings({ ...settings, bank_country: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Payout Currency
                      </label>
                      <input
                        type="text"
                        value={settings.bank_currency || ''}
                        onChange={(e) => setSettings({ ...settings, bank_currency: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) })}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                        placeholder="EGP"
                        maxLength={3}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        The currency you'd like to be paid in (e.g. EGP, USD).
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Sort Code
                    </label>
                    <input
                      type="text"
                      value={settings.bank_sort_code || ''}
                      onChange={(e) => setSettings({ ...settings, bank_sort_code: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                      placeholder="12-34-56"
                      maxLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={settings.bank_account_number || ''}
                      onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bank_name || ''}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="Barclays Bank"
                />
              </div>

              <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1 text-amber-300">Security Notice</p>
                    <p>Your bank details are stored securely and will only be used for processing payouts. Never share your banking information outside of this secure platform.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PayPal Email */}
        {settings.preferred_payout_method === 'paypal' && (
          <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">PayPal Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                PayPal Email Address
              </label>
              <input
                type="email"
                value={settings.paypal_email || ''}
                onChange={(e) => setSettings({ ...settings, paypal_email: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                placeholder="your-email@example.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                Payouts will be sent to this PayPal account
              </p>
            </div>
          </div>
        )}

        {/* Tax Information (UK teachers only) */}
        {!isIntl && (
        <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Tax Information (UK)</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                UTR Number (Self-Assessment)
              </label>
              <input
                type="text"
                value={settings.tax_id || ''}
                onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                placeholder="1234567890"
                maxLength={10}
              />
              <p className="text-sm text-gray-500 mt-1">
                Your 10-digit Unique Taxpayer Reference (optional but recommended)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="vat_registered"
                checked={settings.vat_registered}
                onChange={(e) => setSettings({ ...settings, vat_registered: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 bg-white"
              />
              <label htmlFor="vat_registered" className="text-sm font-medium text-gray-600">
                I am VAT registered
              </label>
            </div>

            {settings.vat_registered && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  VAT Number
                </label>
                <input
                  type="text"
                  value={settings.vat_number || ''}
                  onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="GB123456789"
                />
              </div>
            )}
          </div>
        </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/teacher/earnings')}
            className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
