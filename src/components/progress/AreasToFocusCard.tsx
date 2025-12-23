import { useState, useEffect } from 'react';
import { Target, ChevronRight, Lightbulb, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface FeedbackItem {
  id: string;
  lesson_id: string;
  areas_for_improvement: string | null;
  recommended_focus: string | null;
  strengths_observed: string | null;
  created_at: string;
  subject_name: string;
  scheduled_time: string;
}

interface AreasToFocusCardProps {
  studentId?: string;
}

export default function AreasToFocusCard({ studentId }: AreasToFocusCardProps) {
  const [loading, setLoading] = useState(true);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [studentId]);

  async function loadFeedback() {
    try {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }
      if (!targetId) {
        setLoading(false);
        return;
      }

      // Get all learner IDs associated with this user (as parent or as self)
      const learnerIds: string[] = [targetId];

      // Check if user has learners as a parent
      const { data: learners, error: learnersError } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', targetId);

      if (learners) {
        learners.forEach(l => learnerIds.push(l.id));
      }

      const feedbackItems: FeedbackItem[] = [];

      // Try to get feedback from lesson_details table first
      const { data: lessonDetails, error: detailsError } = await supabase
        .from('lesson_details')
        .select(`
          id,
          lesson_id,
          areas_for_improvement,
          recommended_focus,
          strengths_observed,
          created_at,
          lessons!inner(
            scheduled_time,
            learner_id,
            subjects(name)
          )
        `)
        .not('areas_for_improvement', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!detailsError && lessonDetails) {
        // Filter by learner_id in code - check against all learner IDs
        lessonDetails.forEach((ld: any) => {
          if (learnerIds.includes(ld.lessons?.learner_id)) {
            feedbackItems.push({
              id: ld.id,
              lesson_id: ld.lesson_id,
              areas_for_improvement: ld.areas_for_improvement,
              recommended_focus: ld.recommended_focus,
              strengths_observed: ld.strengths_observed,
              created_at: ld.created_at,
              subject_name: ld.lessons?.subjects?.name || 'Lesson',
              scheduled_time: ld.lessons?.scheduled_time || ld.created_at,
            });
          }
        });
      }

      // Also check lesson_insights for AI-extracted feedback
      const { data: insights, error: insightsError } = await supabase
        .from('lesson_insights')
        .select(`
          id,
          lesson_id,
          title,
          detailed_insights,
          created_at,
          lessons!inner(
            scheduled_time,
            learner_id,
            subjects(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!insightsError && insights) {
        insights.forEach((insight: any) => {
          // Check if this insight is for any of the user's learners
          if (learnerIds.includes(insight.lessons?.learner_id) && insight.detailed_insights) {
            // Extract homework/reflection from detailed_insights if present
            const content = insight.detailed_insights.content || '';

            // Look for homework section in the insights
            const homeworkMatch = content.match(/\*\*9\. Homework.*?\*\*([\s\S]*?)(?:\n---|\n\*\*10)/i);
            const reflectionMatch = content.match(/\*\*6\. Reflection Questions\*\*([\s\S]*?)(?:\n---|\n\*\*7)/i);

            // Only add if we don't already have feedback for this lesson
            const alreadyHasFeedback = feedbackItems.some(f => f.lesson_id === insight.lesson_id);

            if (!alreadyHasFeedback && (homeworkMatch || reflectionMatch)) {
              feedbackItems.push({
                id: insight.id,
                lesson_id: insight.lesson_id,
                areas_for_improvement: homeworkMatch ? homeworkMatch[1].trim().slice(0, 300) : null,
                recommended_focus: reflectionMatch ? reflectionMatch[1].trim().slice(0, 300) : null,
                strengths_observed: null,
                created_at: insight.created_at,
                subject_name: insight.lessons?.subjects?.name || insight.title?.split(':')[0] || 'Lesson',
                scheduled_time: insight.lessons?.scheduled_time || insight.created_at,
              });
            }
          }
        });
      }

      // Sort by date and limit
      feedbackItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentFeedback(feedbackItems.slice(0, 5));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      </div>
    );
  }

  // No feedback yet
  if (recentFeedback.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Areas to Focus</h3>
            <p className="text-sm text-gray-500">Teacher feedback from lessons</p>
          </div>
        </div>
        <p className="text-gray-500 text-sm text-center py-4">
          Your teacher will provide personalised feedback after your lessons.
        </p>
      </div>
    );
  }

  const latestFeedback = recentFeedback[0];
  const displayedFeedback = expanded ? recentFeedback : [latestFeedback];

  // Get color scheme based on subject name
  const getSubjectColors = (subjectName: string | null | undefined) => {
    const lowerName = (subjectName || '').toLowerCase();
    if (lowerName.includes('quran') || lowerName.includes('qur\'an') || lowerName.includes('hifz') || lowerName.includes('tajweed')) {
      return {
        border: 'border-emerald-400',
        bg: 'bg-emerald-100',
        icon: 'text-emerald-600',
        text: 'text-emerald-700',
        button: 'text-emerald-600 hover:text-emerald-700'
      };
    } else if (lowerName.includes('arabic') || lowerName.includes('nahw') || lowerName.includes('sarf')) {
      return {
        border: 'border-blue-400',
        bg: 'bg-blue-100',
        icon: 'text-blue-600',
        text: 'text-blue-700',
        button: 'text-blue-600 hover:text-blue-700'
      };
    }
    // Default amber for other subjects
    return {
      border: 'border-amber-400',
      bg: 'bg-amber-100',
      icon: 'text-amber-600',
      text: 'text-amber-700',
      button: 'text-amber-600 hover:text-amber-700'
    };
  };

  // Determine primary color based on most recent feedback subject
  const primaryColors = getSubjectColors(latestFeedback.subject_name);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${primaryColors.bg} rounded-lg flex items-center justify-center`}>
            <Target className={`w-5 h-5 ${primaryColors.icon}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Areas to Focus</h3>
            <p className="text-sm text-gray-500">From your recent lessons</p>
          </div>
        </div>
        {recentFeedback.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`${primaryColors.button} text-sm font-medium flex items-center gap-1`}
          >
            {expanded ? 'Show less' : `View all (${recentFeedback.length})`}
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {displayedFeedback.map((feedback) => {
          const colors = getSubjectColors(feedback.subject_name);
          return (
            <div key={feedback.id} className={`border-l-4 ${colors.border} pl-4 py-2`}>
              {/* Areas for Improvement */}
              {feedback.areas_for_improvement && (
                <div className="mb-3">
                  <div className={`flex items-center gap-2 ${colors.text} text-sm font-medium mb-1`}>
                    <Target className="w-4 h-4" />
                    <span>Work on:</span>
                  </div>
                  <p className="text-gray-700 text-sm">{feedback.areas_for_improvement}</p>
                </div>
              )}

              {/* Recommended Focus */}
              {feedback.recommended_focus && (
                <div className="mb-3">
                  <div className={`flex items-center gap-2 ${colors.text} text-sm font-medium mb-1`}>
                    <Lightbulb className="w-4 h-4" />
                    <span>Next lesson focus:</span>
                  </div>
                  <p className="text-gray-700 text-sm">{feedback.recommended_focus}</p>
                </div>
              )}

              {/* Strengths */}
              {feedback.strengths_observed && (
                <div className="bg-emerald-50 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Strengths:</span>
                  </div>
                  <p className="text-emerald-700 text-sm">{feedback.strengths_observed}</p>
                </div>
              )}

              {/* Lesson info */}
              <div className="mt-2 text-xs text-gray-400">
                {feedback.subject_name} • {new Date(feedback.scheduled_time).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
