import { useEffect, useState } from 'react';
import {
  Award, CheckCircle, XCircle, Clock, FileText, Video,
  Mail, Calendar, Lock, Unlock, AlertCircle, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

interface PendingTeacher {
  id: string;
  user_id: string;
  bio: string;
  hourly_rate: number;
  video_intro_url: string;
  intro_video_url: string;
  education_level: string;
  islamic_learning_interests: string[];
  status: string;
  created_at: string;
  years_experience: number;
  english_level: string;
  has_ijazah: boolean;
  ijazah_type: string[];
  has_degree: boolean;
  degree_type: string;
  certificates: any[];
  interview_required: boolean;
  profiles: {
    full_name: string;
    email: string;
    phone_number: string;
  };
}

export default function TeacherReview() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPendingTeachers();
  }, []);

  async function loadPendingTeachers() {
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
          *,
          profiles:user_id(full_name, email, phone_number)
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingTeachers(data || []);
    } catch (err: any) {
      console.error('Error loading teachers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function calculateSuggestedTier(teacher: PendingTeacher): string {
    let score = 0;

    if (teacher.has_ijazah) score += 3;
    if (teacher.has_degree) score += 2;
    if (teacher.years_experience >= 5) score += 2;
    if (teacher.english_level === 'fluent' || teacher.english_level === 'native') score += 1;

    if (score >= 7) return 'master';
    if (score >= 5) return 'expert';
    if (score >= 3) return 'skilled';
    if (score >= 1) return 'apprentice';
    return 'newcomer';
  }

  function getTierInfo(tier: string) {
    const tiers: Record<string, { icon: string; label: string; rate: number; studentPrice: number; color: string }> = {
      'newcomer': { icon: '🌱', label: 'Newcomer', rate: 5.00, studentPrice: 15.00, color: 'text-green-600 bg-green-50 border-green-200' },
      'apprentice': { icon: '📚', label: 'Apprentice', rate: 6.00, studentPrice: 15.00, color: 'text-blue-600 bg-blue-50 border-blue-200' },
      'skilled': { icon: '🎯', label: 'Skilled', rate: 7.00, studentPrice: 15.00, color: 'text-purple-600 bg-purple-50 border-purple-200' },
      'expert': { icon: '🏆', label: 'Expert', rate: 8.50, studentPrice: 16.50, color: 'text-amber-600 bg-amber-50 border-amber-200' },
      'master': { icon: '💎', label: 'Master', rate: 10.00, studentPrice: 18.00, color: 'text-pink-600 bg-pink-50 border-pink-200' }
    };
    return tiers[tier] || tiers['newcomer'];
  }

  async function approveTeacher(
    teacherId: string,
    selectedTier: string,
    lockTier: boolean,
    adminNotes: string,
    needsInterview: boolean
  ) {
    try {
      setProcessingId(teacherId);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tierInfo = getTierInfo(selectedTier);

      // Update teacher profile
      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({
          status: needsInterview ? 'pending_approval' : 'approved',
          current_tier: selectedTier,
          hourly_rate: tierInfo.rate,
          tier_assigned_by: user.id,
          tier_assigned_at: new Date().toISOString(),
          tier_locked: lockTier,
          interview_required: needsInterview,
          interview_notes: adminNotes
        })
        .eq('id', teacherId);

      if (updateError) throw updateError;

      // Record tier history
      const teacher = pendingTeachers.find(t => t.id === teacherId);
      if (teacher) {
        await supabase
          .from('teacher_tier_history')
          .insert({
            teacher_id: teacherId,
            from_tier: null,
            to_tier: selectedTier,
            promotion_type: 'manual',
            promoted_by: user.id,
            reason: `Initial tier assignment: ${adminNotes}`,
            stats_at_promotion: {
              years_experience: teacher.years_experience,
              has_ijazah: teacher.has_ijazah,
              has_degree: teacher.has_degree,
              english_level: teacher.english_level
            }
          });
      }

      setSuccessMessage(
        needsInterview
          ? `Interview scheduled for ${teacher?.profiles.full_name}`
          : `${teacher?.profiles.full_name} approved as ${tierInfo.label}!`
      );

      // Reload list
      await loadPendingTeachers();
    } catch (err: any) {
      console.error('Error approving teacher:', err);
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectTeacher(teacherId: string, reason: string) {
    try {
      setProcessingId(teacherId);
      setError('');

      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({
          status: 'rejected',
          interview_notes: reason
        })
        .eq('id', teacherId);

      if (updateError) throw updateError;

      const teacher = pendingTeachers.find(t => t.id === teacherId);
      setSuccessMessage(`Application from ${teacher?.profiles.full_name} has been rejected.`);

      await loadPendingTeachers();
    } catch (err: any) {
      console.error('Error rejecting teacher:', err);
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pending Teacher Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">{pendingTeachers.length} application(s) awaiting review</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {pendingTeachers.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Pending Applications</h3>
            <p className="text-gray-600 dark:text-gray-400">All teacher applications have been reviewed.</p>
          </div>
        )}

        <div className="space-y-6">
          {pendingTeachers.map(teacher => (
            <TeacherApplicationCard
              key={teacher.id}
              teacher={teacher}
              calculateSuggestedTier={calculateSuggestedTier}
              getTierInfo={getTierInfo}
              approveTeacher={approveTeacher}
              rejectTeacher={rejectTeacher}
              processing={processingId === teacher.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TeacherApplicationCardProps {
  teacher: PendingTeacher;
  calculateSuggestedTier: (teacher: PendingTeacher) => string;
  getTierInfo: (tier: string) => any;
  approveTeacher: (teacherId: string, tier: string, lock: boolean, notes: string, needsInterview: boolean) => void;
  rejectTeacher: (teacherId: string, reason: string) => void;
  processing: boolean;
}

function TeacherApplicationCard({
  teacher,
  calculateSuggestedTier,
  getTierInfo,
  approveTeacher,
  rejectTeacher,
  processing
}: TeacherApplicationCardProps) {
  const suggestedTier = calculateSuggestedTier(teacher);
  const [selectedTier, setSelectedTier] = useState(suggestedTier);
  const [lockTier, setLockTier] = useState(false);
  const [needsInterview, setNeedsInterview] = useState(teacher.interview_required);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const tierInfo = getTierInfo(selectedTier);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">{teacher.profiles.full_name}</h2>
            <p className="text-emerald-50 text-sm">{teacher.profiles.email}</p>
            <p className="text-emerald-50 text-sm">{teacher.profiles.phone_number || 'No phone'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-100 mb-1">Applied</p>
            <p className="font-semibold">{formatDistanceToNow(new Date(teacher.created_at), { addSuffix: true })}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Qualifications Summary */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-500" />
            <span>Qualifications Summary</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Experience</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {teacher.years_experience === 0 ? '< 1 year' : `${teacher.years_experience}+ years`}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">English Level</p>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">{teacher.english_level}</p>
            </div>

            <div className={`rounded-lg p-4 border-2 ${teacher.has_ijazah ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700'}`}>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ijazah</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {teacher.has_ijazah ? `✅ Yes (${teacher.ijazah_type?.join(', ')})` : '❌ No'}
              </p>
            </div>

            <div className={`rounded-lg p-4 border-2 ${teacher.has_degree ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700'}`}>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Degree</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {teacher.has_degree ? `✅ ${teacher.degree_type}` : '❌ No'}
              </p>
            </div>
          </div>
        </div>

        {/* Requested Rate */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>Requested Hourly Rate:</strong> £{teacher.hourly_rate.toFixed(2)}/hour
          </p>
        </div>

        {/* Certificates */}
        {teacher.certificates && teacher.certificates.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span>Uploaded Certificates ({teacher.certificates.length})</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {teacher.certificates.map((cert: any, i: number) => (
                <a
                  key={i}
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700 text-sm font-medium transition flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{cert.name || `Certificate ${i + 1}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Intro Video */}
        {(teacher.intro_video_url || teacher.video_intro_url) && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <Video className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span>Introduction Video</span>
            </h4>
            <video
              src={teacher.intro_video_url || teacher.video_intro_url}
              controls
              className="w-full max-w-2xl rounded-lg border border-gray-300 dark:border-gray-700"
            />
          </div>
        )}

        {/* Bio */}
        {teacher.bio && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About</h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-700">{teacher.bio}</p>
          </div>
        )}

        {/* Tier Assignment Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Assign Tier & Approve</h3>

          {/* Suggested Tier Badge */}
          <div className="mb-4 inline-block">
            <div className={`px-4 py-2 rounded-lg border-2 ${getTierInfo(suggestedTier).color}`}>
              <p className="text-xs font-medium mb-1">AI Suggested Tier:</p>
              <p className="text-lg font-bold">
                {getTierInfo(suggestedTier).icon} {getTierInfo(suggestedTier).label}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Select Tier:</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={processing}
              >
                <option value="newcomer">🌱 Newcomer (£5/hr → £15 student)</option>
                <option value="apprentice">📚 Apprentice (£6/hr → £15 student)</option>
                <option value="skilled">🎯 Skilled (£7/hr → £15 student)</option>
                <option value="expert">🏆 Expert (£8.50/hr → £16.50 student)</option>
                <option value="master">💎 Master (£10/hr → £18 student)</option>
              </select>
            </div>

            {/* Interview Required */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Interview Required?</label>
              <label className="flex items-center space-x-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={needsInterview}
                  onChange={(e) => setNeedsInterview(e.target.checked)}
                  className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 rounded"
                  disabled={processing}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Schedule interview before approval</span>
              </label>
            </div>

            {/* Lock Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Lock Tier?</label>
              <label className="flex items-center space-x-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={lockTier}
                  onChange={(e) => setLockTier(e.target.checked)}
                  className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 rounded"
                  disabled={processing}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                  {lockTier ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span>Prevent auto-promotion</span>
                </span>
              </label>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Admin Notes (internal):</label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Reason for tier assignment, observations, concerns..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              disabled={processing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => approveTeacher(teacher.id, selectedTier, lockTier, adminNotes, needsInterview)}
              disabled={processing}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {needsInterview ? (
                <>
                  <Calendar className="w-5 h-5" />
                  <span>Schedule Interview</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve as {tierInfo.label}</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={processing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <XCircle className="w-5 h-5" />
              <span>Reject Application</span>
            </button>

            <button
              disabled={processing}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Request More Info</span>
            </button>
          </div>

          {/* Reject Form */}
          {showRejectForm && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <label className="block text-sm font-medium text-red-900 dark:text-red-200 mb-2">
                Rejection Reason (will be sent to applicant):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                className="w-full px-4 py-3 border border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                disabled={processing}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => rejectTeacher(teacher.id, rejectReason)}
                  disabled={processing || !rejectReason}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
