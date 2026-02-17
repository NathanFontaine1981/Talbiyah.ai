import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HMSPrebuilt } from '@100mslive/roomkit-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Star,
  Video,
  User,
  Mail,
  Globe,
  Languages,
  BookOpen,
  GraduationCap,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Save,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CandidateInfo {
  full_name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  country: string | null;
  languages: string[] | null;
  subjects: string[] | null;
  qualifications_summary: string | null;
  years_experience: number | null;
  education_level: string | null;
  bio: string | null;
}

interface InterviewData {
  id: string;
  candidate_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  room_code_admin: string | null;
  hms_room_id: string | null;
  interview_notes: string | null;
  teaching_demo_rating: number | null;
  communication_rating: number | null;
  knowledge_rating: number | null;
  personality_rating: number | null;
  overall_rating: number | null;
  ai_summary: string | null;
  completed_at: string | null;
  created_at: string | null;
  candidate: CandidateInfo;
}

// ---------------------------------------------------------------------------
// Inline StarRating component
// ---------------------------------------------------------------------------

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = hovered !== null ? star <= hovered : star <= (value ?? 0);
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-5 h-5 ${
                  filled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subject tag color helper
// ---------------------------------------------------------------------------

const SUBJECT_COLORS: Record<string, string> = {
  quran: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  arabic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  islamic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  tajweed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

function getSubjectColor(subject: string): string {
  const lower = subject.toLowerCase();
  for (const [key, cls] of Object.entries(SUBJECT_COLORS)) {
    if (lower.includes(key)) return cls;
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InterviewRoom() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state
  const [bioExpanded, setBioExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Ratings
  const [ratings, setRatings] = useState<{
    teaching_demo_rating: number | null;
    communication_rating: number | null;
    knowledge_rating: number | null;
    personality_rating: number | null;
    overall_rating: number | null;
  }>({
    teaching_demo_rating: null,
    communication_rating: null,
    knowledge_rating: null,
    personality_rating: null,
    overall_rating: null,
  });

  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (interviewId) {
      loadInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  async function loadInterview() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('recruitment_interviews')
        .select(
          `
          id,
          candidate_id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          status,
          room_code_admin,
          hms_room_id,
          interview_notes,
          teaching_demo_rating,
          communication_rating,
          knowledge_rating,
          personality_rating,
          overall_rating,
          ai_summary,
          completed_at,
          created_at,
          recruitment_pipeline!candidate_id (
            full_name,
            email,
            phone,
            nationality,
            country,
            languages,
            subjects,
            qualifications_summary,
            years_experience,
            education_level,
            bio
          )
        `
        )
        .eq('id', interviewId!)
        .single();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Interview not found.');
        return;
      }

      const candidate = Array.isArray(data.recruitment_pipeline)
        ? data.recruitment_pipeline[0]
        : data.recruitment_pipeline;

      if (!candidate) {
        setError('Candidate information not found.');
        return;
      }

      const interviewData: InterviewData = {
        id: data.id,
        candidate_id: data.candidate_id,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        duration_minutes: data.duration_minutes,
        status: data.status,
        room_code_admin: data.room_code_admin,
        hms_room_id: data.hms_room_id,
        interview_notes: data.interview_notes,
        teaching_demo_rating: data.teaching_demo_rating,
        communication_rating: data.communication_rating,
        knowledge_rating: data.knowledge_rating,
        personality_rating: data.personality_rating,
        overall_rating: data.overall_rating,
        ai_summary: data.ai_summary,
        completed_at: data.completed_at,
        created_at: data.created_at,
        candidate,
      };

      setInterview(interviewData);
      setNotes(data.interview_notes || '');
      setRatings({
        teaching_demo_rating: data.teaching_demo_rating,
        communication_rating: data.communication_rating,
        knowledge_rating: data.knowledge_rating,
        personality_rating: data.personality_rating,
        overall_rating: data.overall_rating,
      });
    } catch (err: any) {
      console.error('Error loading interview:', err);
      setError(err.message || 'Failed to load interview.');
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Rating save
  // -----------------------------------------------------------------------

  const saveRating = useCallback(
    async (field: string, value: number) => {
      if (!interview) return;
      try {
        const { error: updateError } = await supabase
          .from('recruitment_interviews')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('id', interview.id);

        if (updateError) throw updateError;
      } catch (err: any) {
        console.error('Failed to save rating:', err);
        toast.error('Failed to save rating');
      }
    },
    [interview]
  );

  function handleRatingChange(field: keyof typeof ratings, value: number) {
    setRatings((prev) => ({ ...prev, [field]: value }));
    saveRating(field, value);
  }

  // -----------------------------------------------------------------------
  // Notes auto-save (debounced on blur / 2s idle)
  // -----------------------------------------------------------------------

  const saveNotes = useCallback(
    async (text: string) => {
      if (!interview) return;
      setSavingNotes(true);
      try {
        const { error: updateError } = await supabase
          .from('recruitment_interviews')
          .update({ interview_notes: text, updated_at: new Date().toISOString() })
          .eq('id', interview.id);

        if (updateError) throw updateError;
      } catch (err: any) {
        console.error('Failed to save notes:', err);
        toast.error('Failed to save notes');
      } finally {
        setSavingNotes(false);
      }
    },
    [interview]
  );

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setNotes(text);

    // Debounce: save after 2s of idle typing
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    notesTimeoutRef.current = setTimeout(() => saveNotes(text), 2000);
  }

  function handleNotesBlur() {
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    saveNotes(notes);
  }

  // -----------------------------------------------------------------------
  // Status actions
  // -----------------------------------------------------------------------

  async function markCompleted() {
    if (!interview) return;
    try {
      const { error: updateError } = await supabase
        .from('recruitment_interviews')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', interview.id);

      if (updateError) throw updateError;

      setInterview((prev) =>
        prev
          ? { ...prev, status: 'completed', completed_at: new Date().toISOString() }
          : prev
      );
      toast.success('Interview marked as completed');
    } catch (err: any) {
      console.error('Error marking completed:', err);
      toast.error('Failed to update status');
    }
  }

  async function markNoShow() {
    if (!interview) return;
    try {
      const { error: updateError } = await supabase
        .from('recruitment_interviews')
        .update({
          status: 'no_show',
          updated_at: new Date().toISOString(),
        })
        .eq('id', interview.id);

      if (updateError) throw updateError;

      setInterview((prev) => (prev ? { ...prev, status: 'no_show' } : prev));
      toast.success('Interview marked as no show');
    } catch (err: any) {
      console.error('Error marking no show:', err);
      toast.error('Failed to update status');
    }
  }

  // -----------------------------------------------------------------------
  // AI Summary
  // -----------------------------------------------------------------------

  async function generateSummary() {
    if (!interview) return;
    setGeneratingSummary(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be signed in to generate a summary');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-interview-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ interview_id: interview.id }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate summary');
      }

      const result = await response.json();
      const summary = result.summary || result.ai_summary;

      setInterview((prev) => (prev ? { ...prev, ai_summary: summary } : prev));
      toast.success('AI summary generated');
    } catch (err: any) {
      console.error('Error generating summary:', err);
      toast.error(err.message || 'Failed to generate AI summary');
    } finally {
      setGeneratingSummary(false);
    }
  }

  // -----------------------------------------------------------------------
  // Status badge helper
  // -----------------------------------------------------------------------

  function statusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      scheduled: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      },
      no_show: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
      cancelled: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-300',
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
    };
    const style = map[status] || map.scheduled;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
      >
        {style.icon}
        {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
      </span>
    );
  }

  // -----------------------------------------------------------------------
  // Duration display
  // -----------------------------------------------------------------------

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  // -----------------------------------------------------------------------
  // Render: Loading
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading interview room...
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Error / not found
  // -----------------------------------------------------------------------

  if (error || !interview) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Interview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Interview not found.'}
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="w-full py-2 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Main layout
  // -----------------------------------------------------------------------

  const candidate = interview.candidate;
  const bioText = candidate.bio || '';
  const bioTruncated = bioText.length > 200 && !bioExpanded;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* ----------------------------------------------------------------- */}
      {/* LEFT: Video Panel                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex-1 bg-black relative">
        {/* Back button overlay */}
        <button
          onClick={() => navigate('/admin')}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {interview.room_code_admin ? (
          <HMSPrebuilt
            roomCode={interview.room_code_admin}
            options={{ userName: 'Nathan (Admin)' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Video Room Not Ready</h3>
              <p className="text-gray-400 text-sm">
                The 100ms room has not been created for this interview yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* RIGHT: Sidebar                                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="w-[420px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-600" />
              Interview Room
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(`${interview.scheduled_date}T${interview.scheduled_time}`), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        </div>

        {/* -------- Section 1: Candidate Info -------- */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {candidate.full_name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{candidate.email}</span>
              </div>
            </div>
          </div>

          {/* Phone */}
          {candidate.phone && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Phone: {candidate.phone}
            </p>
          )}

          {/* Nationality / Country */}
          {(candidate.nationality || candidate.country) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {[candidate.nationality, candidate.country].filter(Boolean).join(' / ')}
              </span>
            </div>
          )}

          {/* Languages */}
          {candidate.languages && candidate.languages.length > 0 && (
            <div className="flex items-start gap-1.5 mb-2">
              <Languages className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {candidate.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subjects */}
          {candidate.subjects && candidate.subjects.length > 0 && (
            <div className="flex items-start gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {candidate.subjects.map((subj) => (
                  <span
                    key={subj}
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${getSubjectColor(subj)}`}
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {candidate.years_experience != null && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Experience: {candidate.years_experience} years</span>
            </div>
          )}

          {/* Education */}
          {candidate.education_level && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{candidate.education_level}</span>
            </div>
          )}

          {/* Qualifications */}
          {candidate.qualifications_summary && (
            <div className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{candidate.qualifications_summary}</span>
            </div>
          )}

          {/* Bio */}
          {bioText && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {bioTruncated ? `${bioText.slice(0, 200)}...` : bioText}
              </p>
              {bioText.length > 200 && (
                <button
                  onClick={() => setBioExpanded((v) => !v)}
                  className="text-emerald-600 dark:text-emerald-400 text-xs font-medium mt-1 hover:underline"
                >
                  {bioExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* -------- Section 2: Interview Status -------- */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Interview Status
          </h4>

          <div className="flex items-center justify-between mb-3">
            {statusBadge(interview.status)}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDuration(interview.duration_minutes)}
            </span>
          </div>

          {interview.completed_at && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Completed: {format(new Date(interview.completed_at), 'MMM d, yyyy h:mm a')}
            </p>
          )}

          {interview.status === 'scheduled' && (
            <div className="flex gap-2">
              <button
                onClick={markCompleted}
                className="flex-1 py-2 rounded-lg font-medium text-sm bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Completed
              </button>
              <button
                onClick={markNoShow}
                className="flex-1 py-2 rounded-lg font-medium text-sm bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                No Show
              </button>
            </div>
          )}
        </div>

        {/* -------- Section 3: Ratings -------- */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Ratings
          </h4>
          <div className="space-y-2.5">
            <StarRating
              label="Teaching Demo"
              value={ratings.teaching_demo_rating}
              onChange={(v) => handleRatingChange('teaching_demo_rating', v)}
            />
            <StarRating
              label="Communication"
              value={ratings.communication_rating}
              onChange={(v) => handleRatingChange('communication_rating', v)}
            />
            <StarRating
              label="Knowledge"
              value={ratings.knowledge_rating}
              onChange={(v) => handleRatingChange('knowledge_rating', v)}
            />
            <StarRating
              label="Personality"
              value={ratings.personality_rating}
              onChange={(v) => handleRatingChange('personality_rating', v)}
            />
            <StarRating
              label="Overall"
              value={ratings.overall_rating}
              onChange={(v) => handleRatingChange('overall_rating', v)}
            />
          </div>
        </div>

        {/* -------- Section 4: Notes -------- */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Interview Notes
            </h4>
            {savingNotes && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Save className="w-3 h-3 animate-pulse" />
                Saving...
              </span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleNotesBlur}
            placeholder="Type your interview notes here..."
            className="w-full h-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-sm resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
            {notes.length} characters
          </p>
        </div>

        {/* -------- Section 5: AI Summary -------- */}
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            AI Summary
          </h4>

          {interview.ai_summary ? (
            <>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap mb-3">
                {interview.ai_summary}
              </div>
              <button
                onClick={generateSummary}
                disabled={generatingSummary}
                className="w-full py-2 rounded-lg font-medium text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {generatingSummary ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Regenerate Summary
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={generateSummary}
              disabled={generatingSummary}
              className="w-full py-2 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Summary
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
