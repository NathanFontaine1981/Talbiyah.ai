import { useState, useEffect } from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Student {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface Milestone {
  id: string;
  name: string;
  name_arabic?: string;
  description?: string;
  pillar?: 'fahm' | 'itqan' | 'hifz';
  verification_criteria?: string;
  stage?: {
    name: string;
    phase?: {
      name: string;
    };
  };
}

interface MilestoneProgress {
  id: string;
  student_id: string;
  milestone_id: string;
  status: 'not_started' | 'in_progress' | 'pending_verification' | 'verified' | 'mastered';
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  verification_notes?: string;
  student?: Student;
  milestone?: Milestone;
}

const pillarConfig = {
  fahm: { label: 'Understanding', color: 'text-blue-600', bg: 'bg-blue-100' },
  itqan: { label: 'Fluency', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  hifz: { label: 'Memorization', color: 'text-purple-600', bg: 'bg-purple-100' },
};

interface VerificationCardProps {
  progress: MilestoneProgress;
  onVerify: (progressId: string, notes: string) => Promise<void>;
  onReject: (progressId: string, notes: string) => Promise<void>;
}

function VerificationCard({ progress, onVerify, onReject }: VerificationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const milestone = progress.milestone;
  const student = progress.student;
  const pillar = milestone?.pillar ? pillarConfig[milestone.pillar] : null;

  const handleVerify = async () => {
    setSubmitting(true);
    await onVerify(progress.id, notes);
    setSubmitting(false);
  };

  const handleReject = async () => {
    setSubmitting(true);
    await onReject(progress.id, notes);
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {student?.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{student?.full_name}</h3>
              <p className="text-sm text-gray-500">
                Requesting verification for milestone
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-700">
            Pending Review
          </span>
        </div>
      </div>

      {/* Milestone info */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h4 className="font-medium text-gray-900">{milestone?.name}</h4>
            </div>
            {milestone?.name_arabic && (
              <p className="font-arabic text-gray-600 mt-1">{milestone.name_arabic}</p>
            )}
            {milestone?.stage && (
              <p className="text-xs text-gray-500 mt-1">
                {milestone.stage.phase?.name} → {milestone.stage.name}
              </p>
            )}
          </div>
          {pillar && (
            <span className={`text-xs font-medium px-2 py-1 rounded ${pillar.bg} ${pillar.color}`}>
              {pillar.label}
            </span>
          )}
        </div>

        {milestone?.description && (
          <p className="text-sm text-gray-600 mt-3">{milestone.description}</p>
        )}
      </div>

      {/* Expandable verification section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>Verification Details</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Verification criteria */}
          {milestone?.verification_criteria && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-700 mb-1">Verification Criteria</p>
              <p className="text-sm text-blue-600">{milestone.verification_criteria}</p>
            </div>
          )}

          {/* Notes input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this verification..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? 'Verifying...' : 'Verify Milestone'}
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Needs More Work
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface MilestoneVerificationProps {
  variant?: 'full' | 'compact' | 'dashboard';
}

// Feature flag - set to true when curriculum tables are created in the database
const CURRICULUM_FEATURE_ENABLED = false;

export default function MilestoneVerification({ variant = 'full' }: MilestoneVerificationProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<MilestoneProgress[]>([]);
  const [recentVerifications, setRecentVerifications] = useState<MilestoneProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerifications() {
      // Skip entirely if curriculum feature is not enabled
      if (!CURRICULUM_FEATURE_ENABLED) {
        setLoading(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      try {
        // First get teacher's students (those who have had lessons with them)
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!teacherProfile) {
          setLoading(false);
          return;
        }

        // Get unique student IDs from lessons
        const { data: lessons } = await supabase
          .from('lessons')
          .select('learner_id')
          .eq('teacher_id', teacherProfile.id)
          .eq('status', 'completed');

        const studentIds = [...new Set((lessons || []).map((l) => l.learner_id))];

        if (studentIds.length === 0) {
          setLoading(false);
          return;
        }

        // Try to fetch pending verifications - this table may not exist yet
        try {
          const { data: pending, error: pendingError } = await supabase
            .from('student_milestone_progress')
            .select(`
              *,
              student:profiles!student_milestone_progress_student_id_fkey(id, full_name, avatar_url),
              milestone:curriculum_milestones(
                id, name, name_arabic, description, pillar, verification_criteria,
                stage:curriculum_stages(
                  name,
                  phase:curriculum_phases(name)
                )
              )
            `)
            .in('student_id', studentIds)
            .eq('status', 'pending_verification')
            .order('updated_at', { ascending: false });

          // Only set if no error (table exists)
          if (!pendingError) {
            setPendingVerifications(pending || []);
          }
        } catch {
          // Table doesn't exist yet - silently ignore
        }

        // Try to fetch recent verifications (last 7 days)
        try {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: recent, error: recentError } = await supabase
            .from('student_milestone_progress')
            .select(`
              *,
              student:profiles!student_milestone_progress_student_id_fkey(id, full_name, avatar_url),
              milestone:curriculum_milestones(id, name, pillar)
            `)
            .in('student_id', studentIds)
            .eq('status', 'verified')
            .gte('verified_at', sevenDaysAgo.toISOString())
            .order('verified_at', { ascending: false })
            .limit(5);

          // Only set if no error (table exists)
          if (!recentError) {
            setRecentVerifications(recent || []);
          }
        } catch {
          // Table doesn't exist yet - silently ignore
        }
      } catch (error) {
        // Silently ignore errors - curriculum tables may not exist yet
      } finally {
        setLoading(false);
      }
    }

    fetchVerifications();
  }, []);

  const handleVerify = async (progressId: string, notes: string) => {
    try {
      await supabase
        .from('student_milestone_progress')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: userId,
          verification_notes: notes || null,
        })
        .eq('id', progressId);

      // Move from pending to recent
      const verified = pendingVerifications.find((p) => p.id === progressId);
      if (verified) {
        setPendingVerifications((prev) => prev.filter((p) => p.id !== progressId));
        setRecentVerifications((prev) => [{ ...verified, status: 'verified' }, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error('Error verifying milestone:', error);
    }
  };

  const handleReject = async (progressId: string, notes: string) => {
    try {
      await supabase
        .from('student_milestone_progress')
        .update({
          status: 'in_progress',
          verification_notes: notes || 'Needs more practice before verification.',
        })
        .eq('id', progressId);

      setPendingVerifications((prev) => prev.filter((p) => p.id !== progressId));
    } catch (error) {
      console.error('Error rejecting milestone:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (variant === 'dashboard') {
    if (pendingVerifications.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
          <p className="font-medium">No pending verifications</p>
          <p className="text-sm">All caught up!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-2 bg-amber-50 text-amber-700 rounded-lg text-sm">
          <Clock className="w-4 h-4" />
          <span>{pendingVerifications.length} milestone{pendingVerifications.length > 1 ? 's' : ''} awaiting verification</span>
        </div>
        {pendingVerifications.slice(0, 2).map((progress) => (
          <div
            key={progress.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {progress.student?.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {progress.milestone?.name}
              </p>
            </div>
            <Circle className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
        ))}
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-8">
      {/* Pending Verifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pending Verifications</h2>
            <p className="text-sm text-gray-500">
              Students awaiting milestone verification
            </p>
          </div>
          {pendingVerifications.length > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
              {pendingVerifications.length} pending
            </span>
          )}
        </div>

        {pendingVerifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="font-medium text-gray-900">All caught up!</p>
            <p className="text-sm text-gray-500">
              No milestones are currently pending verification
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingVerifications.map((progress) => (
              <VerificationCard
                key={progress.id}
                progress={progress}
                onVerify={handleVerify}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Verifications */}
      {recentVerifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-900">Recently Verified</h3>
          <div className="space-y-2">
            {recentVerifications.map((progress) => {
              const pillar = progress.milestone?.pillar
                ? pillarConfig[progress.milestone.pillar]
                : null;

              return (
                <div
                  key={progress.id}
                  className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {progress.student?.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Verified: {progress.milestone?.name}
                    </p>
                  </div>
                  {pillar && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${pillar.bg} ${pillar.color}`}>
                      {pillar.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick verify button for use in lesson cards
export function QuickVerifyButton({
  studentId,
  milestoneId,
  milestoneName,
  onVerified,
}: {
  studentId: string;
  milestoneId: string;
  milestoneName: string;
  onVerified?: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Check if progress exists
      const { data: existing } = await supabase
        .from('student_milestone_progress')
        .select('id')
        .eq('student_id', studentId)
        .eq('milestone_id', milestoneId)
        .single();

      if (existing) {
        await supabase
          .from('student_milestone_progress')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by: currentUserId,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('student_milestone_progress').insert({
          student_id: studentId,
          milestone_id: milestoneId,
          status: 'verified',
          progress_percentage: 100,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          verified_by: currentUserId,
        });
      }

      setVerified(true);
      onVerified?.();
    } catch (error) {
      console.error('Error verifying milestone:', error);
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle className="w-3 h-3" />
        Verified
      </span>
    );
  }

  return (
    <button
      onClick={handleVerify}
      disabled={verifying}
      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
    >
      {verifying ? (
        <>
          <Clock className="w-3 h-3 animate-spin" />
          Verifying...
        </>
      ) : (
        <>
          <Award className="w-3 h-3" />
          Verify
        </>
      )}
    </button>
  );
}
