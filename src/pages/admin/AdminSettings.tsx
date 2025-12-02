import { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  CreditCard,
  Shield,
  Users,
  Video,
  Mail,
  Globe,
  Palette,
  Save,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  DollarSign,
  Clock,
  BookOpen,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface PlatformSettings {
  // General
  platform_name: string;
  support_email: string;
  maintenance_mode: boolean;

  // Pricing
  default_lesson_price_per_credit: number;
  referral_reward_credits: number;
  min_credits_purchase: number;

  // Lessons
  default_lesson_duration: number;
  max_booking_days_ahead: number;
  cancellation_window_hours: number;
  auto_generate_insights: boolean;

  // Notifications
  email_notifications_enabled: boolean;
  lesson_reminder_hours: number;

  // Video
  video_provider: '100ms' | 'other';
  auto_record_lessons: boolean;
  recording_retention_days: number;

  // XP & Gamification
  xp_per_lesson_completed: number;
  xp_per_streak_day: number;
  daily_login_reward_xp: number;
}

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const defaultSettings: PlatformSettings = {
  platform_name: 'Talbiyah.ai',
  support_email: 'support@talbiyah.ai',
  maintenance_mode: false,
  default_lesson_price_per_credit: 1,
  referral_reward_credits: 1,
  min_credits_purchase: 5,
  default_lesson_duration: 60,
  max_booking_days_ahead: 30,
  cancellation_window_hours: 24,
  auto_generate_insights: true,
  email_notifications_enabled: true,
  lesson_reminder_hours: 2,
  video_provider: '100ms',
  auto_record_lessons: true,
  recording_retention_days: 90,
  xp_per_lesson_completed: 100,
  xp_per_streak_day: 25,
  daily_login_reward_xp: 10
};

const settingSections: SettingSection[] = [
  { id: 'general', title: 'General', description: 'Platform name, contact info, maintenance', icon: Globe, color: 'blue' },
  { id: 'pricing', title: 'Pricing & Credits', description: 'Credit costs, referral rewards, purchases', icon: CreditCard, color: 'emerald' },
  { id: 'lessons', title: 'Lessons', description: 'Duration, booking rules, insights', icon: BookOpen, color: 'purple' },
  { id: 'notifications', title: 'Notifications', description: 'Email settings, reminders', icon: Bell, color: 'amber' },
  { id: 'video', title: 'Video & Recording', description: 'Provider settings, auto-recording', icon: Video, color: 'rose' },
  { id: 'gamification', title: 'Gamification', description: 'XP rewards, streak bonuses', icon: Shield, color: 'cyan' }
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('general');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Check if settings have changed
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  async function loadSettings() {
    try {
      // In a real app, you'd fetch this from a settings table
      // For now, we'll use default values
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();

      if (data) {
        setSettings(data);
        setOriginalSettings(data);
      }
    } catch (error) {
      // Platform settings table may not exist, using defaults
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      // In a real app, you'd save to a settings table
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 1, // Single row for platform settings
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setOriginalSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. The settings table may not exist yet.');
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    setSettings(originalSettings);
  }

  function updateSetting<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function toggleSection(sectionId: string) {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Platform Settings</h1>
            <p className="text-slate-400">Configure platform-wide settings and defaults</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={resetSettings}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={saveSettings}
              disabled={!hasChanges || saving}
              className={`px-6 py-2 rounded-lg font-semibold transition flex items-center space-x-2 ${
                hasChanges
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <p className="text-amber-400 text-sm">You have unsaved changes</p>
          </div>
        )}
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* General Settings */}
        <SettingsSection
          section={settingSections[0]}
          expanded={expandedSection === 'general'}
          onToggle={() => toggleSection('general')}
        >
          <div className="space-y-6">
            <SettingField label="Platform Name" description="The name displayed across the platform">
              <input
                type="text"
                value={settings.platform_name}
                onChange={(e) => updateSetting('platform_name', e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </SettingField>

            <SettingField label="Support Email" description="Email address for support inquiries">
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => updateSetting('support_email', e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </SettingField>

            <SettingField label="Maintenance Mode" description="Enable to show maintenance message to users">
              <ToggleSwitch
                enabled={settings.maintenance_mode}
                onChange={(val) => updateSetting('maintenance_mode', val)}
                danger
              />
            </SettingField>
          </div>
        </SettingsSection>

        {/* Pricing Settings */}
        <SettingsSection
          section={settingSections[1]}
          expanded={expandedSection === 'pricing'}
          onToggle={() => toggleSection('pricing')}
        >
          <div className="space-y-6">
            <SettingField label="Default Lesson Price" description="Credits required per lesson (can be overridden per teacher tier)">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.default_lesson_price_per_credit}
                  onChange={(e) => updateSetting('default_lesson_price_per_credit', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">credits per lesson</span>
              </div>
            </SettingField>

            <SettingField label="Referral Reward" description="Credits earned when a referred user completes their first lesson">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.referral_reward_credits}
                  onChange={(e) => updateSetting('referral_reward_credits', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">credits</span>
              </div>
            </SettingField>

            <SettingField label="Minimum Credit Purchase" description="Minimum credits a user can purchase at once">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.min_credits_purchase}
                  onChange={(e) => updateSetting('min_credits_purchase', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">credits</span>
              </div>
            </SettingField>
          </div>
        </SettingsSection>

        {/* Lessons Settings */}
        <SettingsSection
          section={settingSections[2]}
          expanded={expandedSection === 'lessons'}
          onToggle={() => toggleSection('lessons')}
        >
          <div className="space-y-6">
            <SettingField label="Default Lesson Duration" description="Standard duration for lessons">
              <select
                value={settings.default_lesson_duration}
                onChange={(e) => updateSetting('default_lesson_duration', parseInt(e.target.value))}
                className="w-40 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </SettingField>

            <SettingField label="Maximum Booking Ahead" description="How many days in advance users can book lessons">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.max_booking_days_ahead}
                  onChange={(e) => updateSetting('max_booking_days_ahead', parseInt(e.target.value) || 7)}
                  min={1}
                  max={90}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">days</span>
              </div>
            </SettingField>

            <SettingField label="Cancellation Window" description="Minimum hours before lesson start to allow free cancellation">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.cancellation_window_hours}
                  onChange={(e) => updateSetting('cancellation_window_hours', parseInt(e.target.value) || 24)}
                  min={1}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">hours</span>
              </div>
            </SettingField>

            <SettingField label="Auto-Generate Insights" description="Automatically generate AI insights after lessons">
              <ToggleSwitch
                enabled={settings.auto_generate_insights}
                onChange={(val) => updateSetting('auto_generate_insights', val)}
              />
            </SettingField>
          </div>
        </SettingsSection>

        {/* Notifications Settings */}
        <SettingsSection
          section={settingSections[3]}
          expanded={expandedSection === 'notifications'}
          onToggle={() => toggleSection('notifications')}
        >
          <div className="space-y-6">
            <SettingField label="Email Notifications" description="Send email notifications to users">
              <ToggleSwitch
                enabled={settings.email_notifications_enabled}
                onChange={(val) => updateSetting('email_notifications_enabled', val)}
              />
            </SettingField>

            <SettingField label="Lesson Reminder" description="How many hours before a lesson to send reminders">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.lesson_reminder_hours}
                  onChange={(e) => updateSetting('lesson_reminder_hours', parseInt(e.target.value) || 2)}
                  min={1}
                  max={48}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">hours before</span>
              </div>
            </SettingField>
          </div>
        </SettingsSection>

        {/* Video Settings */}
        <SettingsSection
          section={settingSections[4]}
          expanded={expandedSection === 'video'}
          onToggle={() => toggleSection('video')}
        >
          <div className="space-y-6">
            <SettingField label="Video Provider" description="Service used for video calls">
              <div className="flex items-center space-x-4">
                <span className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 font-medium">
                  100ms
                </span>
                <span className="text-slate-500 text-sm">Currently the only supported provider</span>
              </div>
            </SettingField>

            <SettingField label="Auto-Record Lessons" description="Automatically record all video lessons">
              <ToggleSwitch
                enabled={settings.auto_record_lessons}
                onChange={(val) => updateSetting('auto_record_lessons', val)}
              />
            </SettingField>

            <SettingField label="Recording Retention" description="How long to keep lesson recordings">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.recording_retention_days}
                  onChange={(e) => updateSetting('recording_retention_days', parseInt(e.target.value) || 30)}
                  min={7}
                  max={365}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">days</span>
              </div>
            </SettingField>
          </div>
        </SettingsSection>

        {/* Gamification Settings */}
        <SettingsSection
          section={settingSections[5]}
          expanded={expandedSection === 'gamification'}
          onToggle={() => toggleSection('gamification')}
        >
          <div className="space-y-6">
            <SettingField label="XP per Lesson" description="XP awarded for completing a lesson">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.xp_per_lesson_completed}
                  onChange={(e) => updateSetting('xp_per_lesson_completed', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">XP</span>
              </div>
            </SettingField>

            <SettingField label="Streak Bonus" description="Additional XP awarded for each day of streak">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.xp_per_streak_day}
                  onChange={(e) => updateSetting('xp_per_streak_day', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">XP per day</span>
              </div>
            </SettingField>

            <SettingField label="Daily Login Reward" description="XP awarded for logging in each day">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.daily_login_reward_xp}
                  onChange={(e) => updateSetting('daily_login_reward_xp', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-slate-400">XP</span>
              </div>
            </SettingField>
          </div>
        </SettingsSection>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <p className="text-slate-300 text-sm">
              These settings affect the entire platform. Changes will take effect immediately after saving.
              Some settings may require users to refresh their browsers to see the changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

interface SettingsSectionProps {
  section: SettingSection;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SettingsSection({ section, expanded, onToggle, children }: SettingsSectionProps) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' }
  };

  const colors = colorClasses[section.color];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition"
      >
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <section.icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">{section.title}</h3>
            <p className="text-sm text-slate-400">{section.description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-700/50">
          {children}
        </div>
      )}
    </div>
  );
}

interface SettingFieldProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingField({ label, description, children }: SettingFieldProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <label className="font-medium text-white">{label}</label>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}

function ToggleSwitch({ enabled, onChange, danger }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-14 h-8 rounded-full transition ${
        enabled
          ? danger
            ? 'bg-red-500'
            : 'bg-cyan-500'
          : 'bg-slate-600'
      }`}
    >
      <div
        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
