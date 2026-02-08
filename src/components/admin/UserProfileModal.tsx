import { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Calendar, Clock, CreditCard, User, Users, GraduationCap, BookOpen, Award, Star, Gift, Shield, AlertTriangle, Copy, Check, ExternalLink, RefreshCw, MessageSquare, Activity, MousePointer, Eye, Smartphone, Monitor, Tablet } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

interface UserActivity {
  id: string;
  event_type: string;
  event_category: string;
  page_path: string;
  page_title: string;
  component: string | null;
  action: string | null;
  device_type: string;
  browser: string;
  created_at: string;
  duration_ms: number | null;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'credits' | 'activity'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<UserActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityStats, setActivityStats] = useState<{
    totalPageViews: number;
    totalFeatureUses: number;
    topPages: { page: string; count: number }[];
    topFeatures: { feature: string; count: number }[];
    deviceBreakdown: { device: string; count: number }[];
    lastActive: string | null;
  } | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchUserActivity();
    }
  }, [activeTab, userId]);

  async function fetchUserProfile() {
    setLoading(true);
    try {
      const { data: profileData, error } = await supabase.rpc('get_user_full_profile', {
        p_user_id: userId
      });

      if (error) throw error;
      setData(profileData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserActivity() {
    setActivityLoading(true);
    try {
      // Fetch recent activity
      const { data: activities, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityData(activities || []);

      // Calculate stats from activities
      if (activities && activities.length > 0) {
        const pageViews = activities.filter(a => a.event_type === 'page_view');
        const featureUses = activities.filter(a => a.event_type === 'feature_use');

        // Top pages
        const pageCounts: Record<string, number> = {};
        pageViews.forEach(pv => {
          const page = pv.page_path || '/unknown';
          pageCounts[page] = (pageCounts[page] || 0) + 1;
        });
        const topPages = Object.entries(pageCounts)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Top features
        const featureCounts: Record<string, number> = {};
        featureUses.forEach(fu => {
          const feature = fu.component || 'unknown';
          featureCounts[feature] = (featureCounts[feature] || 0) + 1;
        });
        const topFeatures = Object.entries(featureCounts)
          .map(([feature, count]) => ({ feature, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Device breakdown
        const deviceCounts: Record<string, number> = {};
        activities.forEach(a => {
          const device = a.device_type || 'unknown';
          deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });
        const deviceBreakdown = Object.entries(deviceCounts)
          .map(([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count);

        setActivityStats({
          totalPageViews: pageViews.length,
          totalFeatureUses: featureUses.length,
          topPages,
          topFeatures,
          deviceBreakdown,
          lastActive: activities[0]?.created_at || null
        });
      } else {
        setActivityStats(null);
      }
    } catch (err) {
      console.error('Error fetching user activity:', err);
    } finally {
      setActivityLoading(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  }

  function calculateAge(dob: string): number | null {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-gray-500">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-500">User not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const credits = data.credits;
  const age = calculateAge(profile.date_of_birth);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.full_name || 'Unnamed User'}</h2>
              <p className="text-white/80 text-sm">{profile.email}</p>
              <div className="flex gap-2 mt-2">
                {(profile.roles || []).map((role: string) => (
                  <span key={role} className="px-2 py-0.5 bg-white/20 text-white rounded text-xs capitalize">
                    {role}
                  </span>
                ))}
                {profile.is_admin && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs">Admin</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200 transition"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
          <button
            onClick={() => copyToClipboard(profile.id, 'id')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
          >
            {copiedField === 'id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy ID
          </button>
          <a
            href={`/admin/email?to=${profile.email}&name=${encodeURIComponent(profile.full_name || '')}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition"
          >
            <MessageSquare className="w-4 h-4" />
            Send Message
          </a>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 dark:border-gray-700 flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'lessons', label: 'Lessons' },
            { id: 'credits', label: 'Credits' },
            { id: 'activity', label: 'Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-500" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Full Name" value={profile.full_name} />
                  <InfoRow label="Email" value={profile.email} copyable onCopy={() => copyToClipboard(profile.email, 'email')} copied={copiedField === 'email'} />
                  <InfoRow label="Phone" value={profile.phone || profile.phone_number} copyable={!!profile.phone} onCopy={() => copyToClipboard(profile.phone, 'phone')} copied={copiedField === 'phone'} />
                  <InfoRow label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
                  <InfoRow
                    label="Date of Birth"
                    value={profile.date_of_birth ? `${format(new Date(profile.date_of_birth), 'dd MMM yyyy')} (${age} years old)` : null}
                  />
                  <InfoRow label="Location" value={profile.location} />
                  <InfoRow label="Timezone" value={profile.timezone} />
                  <InfoRow label="Preferred Contact" value={profile.preferred_contact} />
                  <InfoRow label="How Found Us" value={profile.how_heard_about_us} />
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Account Information
                </h3>
                <div className="space-y-3">
                  <InfoRow
                    label="User ID"
                    value={profile.id}
                    copyable
                    onCopy={() => copyToClipboard(profile.id, 'userId')}
                    copied={copiedField === 'userId'}
                    mono
                  />
                  <InfoRow
                    label="Account Created"
                    value={profile.created_at ? `${format(new Date(profile.created_at), 'dd MMM yyyy, HH:mm')} (${formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })})` : null}
                  />
                  <InfoRow
                    label="Last Sign In"
                    value={profile.last_sign_in_at ? `${format(new Date(profile.last_sign_in_at), 'dd MMM yyyy, HH:mm')} (${formatDistanceToNow(new Date(profile.last_sign_in_at), { addSuffix: true })})` : 'Never'}
                  />
                  <InfoRow
                    label="Email Verified"
                    value={profile.email_confirmed_at ? `Yes (${format(new Date(profile.email_confirmed_at), 'dd MMM yyyy')})` : 'No'}
                    highlight={!profile.email_confirmed_at}
                  />
                  <InfoRow label="Onboarding" value={profile.onboarding_completed ? 'Completed' : 'Not completed'} />
                  <InfoRow label="Email Notifications" value={profile.email_notifications === false ? 'Disabled' : 'Enabled'} />
                  <InfoRow label="Referral Code" value={profile.referral_code} copyable={!!profile.referral_code} onCopy={() => copyToClipboard(profile.referral_code, 'refCode')} copied={copiedField === 'refCode'} />
                </div>
              </div>

              {/* Credits & Balance */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border-2 border-emerald-200 dark:border-emerald-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Credits & Balance
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">{credits?.balance || 0}</p>
                    <p className="text-xs text-gray-500">Current Balance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-blue-600">{credits?.total_purchased || 0}</p>
                    <p className="text-xs text-gray-500">Total Purchased</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-orange-600">{credits?.total_used || 0}</p>
                    <p className="text-xs text-gray-500">Total Used</p>
                  </div>
                </div>
                {profile.unlimited_credits && (
                  <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-lg text-sm text-center">
                    ✨ Unlimited Credits Enabled
                  </div>
                )}
                {profile.is_legacy_student && (
                  <div className="mt-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-lg text-sm text-center">
                    🏆 Legacy Student (Grandfathered Pricing)
                  </div>
                )}
              </div>

              {/* Activity Stats */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  Activity Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{data.stats?.total_lessons_completed || 0}</p>
                    <p className="text-xs text-gray-500">Lessons Completed</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data.stats?.account_age_days || 0}</p>
                    <p className="text-xs text-gray-500">Days as Member</p>
                  </div>
                </div>

                {/* Referrals */}
                {data.referrals && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Referrals</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-900 dark:text-white">{data.referrals.total_referrals || 0} referred</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-900 dark:text-white">{data.referrals.credits_earned || 0} credits earned</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Diagnostic Assessment */}
              {data.diagnostic && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-500" />
                    Diagnostic Assessment
                  </h3>
                  <div className="space-y-2">
                    <InfoRow label="Overall Level" value={data.diagnostic.overall_level} />
                    <InfoRow label="Quran Reading" value={data.diagnostic.quran_reading_level} />
                    <InfoRow label="Tajweed" value={data.diagnostic.tajweed_level} />
                    <InfoRow label="Arabic" value={data.diagnostic.arabic_level} />
                    <InfoRow label="Assessed By" value={data.diagnostic.assessor_name} />
                    <InfoRow label="Completed" value={data.diagnostic.completed_at ? format(new Date(data.diagnostic.completed_at), 'dd MMM yyyy') : null} />
                  </div>
                  {data.diagnostic.recommendations && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Recommendations</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{data.diagnostic.recommendations}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Profile */}
              {data.teacher_profile && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    Teacher Profile
                  </h3>
                  <div className="space-y-2">
                    <InfoRow label="Status" value={data.teacher_profile.status} highlight={data.teacher_profile.status !== 'approved'} />
                    <InfoRow label="Hourly Rate" value={data.teacher_profile.hourly_rate ? `£${data.teacher_profile.hourly_rate}` : null} />
                    <InfoRow label="Hours Taught" value={data.teacher_profile.total_hours_taught?.toFixed(1)} />
                    <InfoRow label="Experience" value={data.teacher_profile.years_experience ? `${data.teacher_profile.years_experience} years` : null} />
                    <InfoRow label="Education" value={data.teacher_profile.education_level} />
                    <InfoRow label="Specializations" value={data.teacher_profile.specializations?.join(', ')} />
                    <InfoRow label="Languages" value={data.teacher_profile.languages?.join(', ')} />
                    {data.teacher_profile.is_legacy_teacher && (
                      <div className="mt-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-3 py-2 rounded-lg text-sm">
                        🏆 Legacy Teacher
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Learners (for parents) */}
              {data.learners && data.learners.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800 lg:col-span-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Children / Learners ({data.learners.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.learners.map((learner: any) => (
                      <div key={learner.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white">{learner.name}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <p className="text-gray-500">Age: <span className="text-gray-900 dark:text-white">{learner.age || 'N/A'}</span></p>
                          <p className="text-gray-500">Gender: <span className="text-gray-900 dark:text-white">{learner.gender || 'N/A'}</span></p>
                          <p className="text-gray-500">Quran: <span className="text-gray-900 dark:text-white">{learner.quran_level || 'N/A'}</span></p>
                          <p className="text-gray-500">Arabic: <span className="text-gray-900 dark:text-white">{learner.arabic_level || 'N/A'}</span></p>
                        </div>
                        {learner.learning_goals && (
                          <p className="mt-2 text-xs text-gray-500">Goals: {learner.learning_goals}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deleted Account Warning */}
              {profile.deleted_at && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border-2 border-red-300 dark:border-red-800 lg:col-span-2">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Account Deleted
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Deleted on: {format(new Date(profile.deleted_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                    {profile.deletion_reason && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Reason: {profile.deletion_reason}
                      </p>
                    )}
                    {profile.hard_delete_at && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Permanent deletion scheduled: {format(new Date(profile.hard_delete_at), 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lessons' && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Lessons</h3>
              {data.bookings && data.bookings.length > 0 ? (
                <div className="space-y-3">
                  {data.bookings.map((booking: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{booking.subject || 'Lesson'}</p>
                        <p className="text-sm text-gray-500">
                          {booking.scheduled_time ? format(new Date(booking.scheduled_time), 'dd MMM yyyy, HH:mm') : 'No date'}
                          {booking.duration_minutes && ` • ${booking.duration_minutes} min`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Teacher: {booking.teacher_name || 'N/A'}
                          {booking.learner_name && ` • Learner: ${booking.learner_name}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No lessons found</p>
              )}
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold text-emerald-600">{credits?.balance || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Current Balance</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold text-blue-600">{credits?.total_purchased || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Purchased</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold text-orange-600">{credits?.total_used || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Used</p>
                </div>
              </div>

              {credits?.last_purchase_at && (
                <p className="text-sm text-gray-500 text-center">
                  Last purchase: {format(new Date(credits.last_purchase_at), 'dd MMM yyyy, HH:mm')}
                </p>
              )}

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Account Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Unlimited Credits</span>
                    <span className={`px-2 py-1 rounded text-xs ${profile.unlimited_credits ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {profile.unlimited_credits ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Legacy Student</span>
                    <span className={`px-2 py-1 rounded text-xs ${profile.is_legacy_student ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {profile.is_legacy_student ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              {activityLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-gray-500">Loading activity...</span>
                </div>
              ) : activityStats ? (
                <>
                  {/* Activity Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                      <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{activityStats.totalPageViews}</p>
                      <p className="text-xs text-gray-500">Page Views</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                      <MousePointer className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{activityStats.totalFeatureUses}</p>
                      <p className="text-xs text-gray-500">Feature Uses</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                      <Activity className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-600">{activityData.length}</p>
                      <p className="text-xs text-gray-500">Total Events</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                      <Clock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-orange-600">
                        {activityStats.lastActive
                          ? formatDistanceToNow(new Date(activityStats.lastActive), { addSuffix: true })
                          : 'Never'}
                      </p>
                      <p className="text-xs text-gray-500">Last Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Pages */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-500" />
                        Most Visited Pages
                      </h4>
                      {activityStats.topPages.length > 0 ? (
                        <div className="space-y-2">
                          {activityStats.topPages.map((page, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                {page.page}
                              </span>
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {page.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No page views recorded</p>
                      )}
                    </div>

                    {/* Top Features */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MousePointer className="w-5 h-5 text-purple-500" />
                        Most Used Features
                      </h4>
                      {activityStats.topFeatures.length > 0 ? (
                        <div className="space-y-2">
                          {activityStats.topFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                {feature.feature}
                              </span>
                              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                {feature.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No feature usage recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Device Breakdown */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Devices Used</h4>
                    <div className="flex gap-4 flex-wrap">
                      {activityStats.deviceBreakdown.map((device, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2">
                          {device.device === 'mobile' ? (
                            <Smartphone className="w-4 h-4 text-emerald-500" />
                          ) : device.device === 'tablet' ? (
                            <Tablet className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Monitor className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{device.device}</span>
                          <span className="text-xs text-gray-500">({device.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity Timeline */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      Recent Activity
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {activityData.slice(0, 20).map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg p-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activity.event_type === 'page_view' ? 'bg-blue-100' :
                            activity.event_type === 'feature_use' ? 'bg-purple-100' :
                            activity.event_type === 'click' ? 'bg-emerald-100' :
                            'bg-gray-100'
                          }`}>
                            {activity.event_type === 'page_view' ? (
                              <Eye className="w-4 h-4 text-blue-600" />
                            ) : activity.event_type === 'feature_use' ? (
                              <MousePointer className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Activity className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {activity.event_type === 'page_view' ? (
                                <>Visited <span className="font-medium">{activity.page_path}</span></>
                              ) : activity.event_type === 'feature_use' ? (
                                <>Used <span className="font-medium">{activity.component}</span> - {activity.action}</>
                              ) : (
                                <>{activity.event_type}: {activity.component || activity.page_path}</>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(activity.created_at), 'dd MMM yyyy, HH:mm')}
                              {activity.duration_ms && ` • ${Math.round(activity.duration_ms / 1000)}s`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No activity recorded for this user yet</p>
                  <p className="text-sm text-gray-400 mt-1">Activity will appear once the user starts using the app</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({
  label,
  value,
  copyable,
  onCopy,
  copied,
  mono,
  highlight
}: {
  label: string;
  value: any;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  mono?: boolean;
  highlight?: boolean;
}) {
  if (!value && value !== 0) {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm text-gray-400 italic">Not provided</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${highlight ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-white'} ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </span>
        {copyable && (
          <button onClick={onCopy} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
          </button>
        )}
      </div>
    </div>
  );
}
