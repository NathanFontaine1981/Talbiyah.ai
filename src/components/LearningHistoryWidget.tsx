import { useEffect, useState } from 'react';
import { BookOpen, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes } from 'date-fns';

interface LessonHistory {
  id: string;
  subject_name: string;
  teacher_name: string;
  scheduled_time: string;
  duration_minutes: number;
  has_insights: boolean;
}

export default function LearningHistoryWidget() {
  const [lessons, setLessons] = useState<LessonHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessonHistory();
  }, []);

  async function loadLessonHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (!learner) {
        setLoading(false);
        return;
      }

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_profiles!inner(
            user_id,
            profiles!inner(
              full_name
            )
          ),
          subjects!inner(
            name
          ),
          talbiyah_insights(id)
        `)
        .eq('learner_id', learner.id)
        .in('status', ['completed', 'in_progress'])
        .order('scheduled_time', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (lessonsData) {
        const formattedLessons: LessonHistory[] = lessonsData.map((lesson: any) => ({
          id: lesson.id,
          subject_name: lesson.subjects.name,
          teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes || 30,
          has_insights: lesson.talbiyah_insights && lesson.talbiyah_insights.length > 0
        }));
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading lesson history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span>My Learning History</span>
        </h3>
        {lessons.length > 0 && (
          <button className="text-sm text-emerald-600 hover:text-cyan-300 font-medium transition">
            View All
          </button>
        )}
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-500 mb-4">No completed lessons yet</p>
          <a
            href="/teachers"
            className="inline-block px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 font-medium rounded-lg transition border border-emerald-500/30"
          >
            Start Learning
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const isQuran = lesson.subject_name.toLowerCase().includes('quran');
            const lessonEndTime = new Date(parseISO(lesson.scheduled_time).getTime() + lesson.duration_minutes * 60 * 1000);
            const minutesSinceEnd = differenceInMinutes(new Date(), lessonEndTime);
            const processingWindowMins = Math.max(30, lesson.duration_minutes * 2);
            const isProcessing = !lesson.has_insights && minutesSinceEnd < processingWindowMins;

            return (
              <div
                key={lesson.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition border border-gray-200 group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-semibold text-gray-900 mb-1 transition ${
                      isQuran ? 'group-hover:text-emerald-600' : 'group-hover:text-blue-600'
                    }`}>
                      {lesson.subject_name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">with {lesson.teacher_name}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{format(parseISO(lesson.scheduled_time), 'MMM d, yyyy')}</span>
                      {lesson.has_insights && (
                        <span className={`flex items-center space-x-1 ${
                          isQuran ? 'text-emerald-600' : 'text-blue-600'
                        }`}>
                          <FileText className="w-3 h-3" />
                          <span>Insights Available</span>
                        </span>
                      )}
                      {isProcessing && (
                        <span className="flex items-center space-x-1 text-amber-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Processing...</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button className={`p-2 text-gray-500 transition ${
                    isQuran ? 'group-hover:text-emerald-600' : 'group-hover:text-blue-600'
                  }`}>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {lesson.has_insights && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button className={`text-sm font-medium flex items-center space-x-2 transition ${
                      isQuran
                        ? 'text-emerald-600 hover:text-emerald-700'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}>
                      <FileText className="w-4 h-4" />
                      <span>View Talbiyah Insights</span>
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-amber-600 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating insights from your lesson...</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
