import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Languages, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CourseProgress {
  name: string;
  progress: number;
  subtitle?: string;
  icon: any;
  color: string;
  bgColor: string;
  route: string;
  action: string;
}

interface MyLearningJourneyCardProps {
  learnerId?: string;
}

export default function MyLearningJourneyCard({ learnerId }: MyLearningJourneyCardProps) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [learnerId]);

  async function loadProgress() {
    // Default courses to show even if no learner data exists
    const defaultCourses: CourseProgress[] = [
      {
        name: "Qur'an with Understanding",
        progress: 0,
        icon: BookOpen,
        color: 'text-emerald-400',
        bgColor: 'from-emerald-500/20 to-green-500/20',
        route: '/progress/quran',
        action: 'Start Learning'
      },
      {
        name: 'Arabic Language',
        progress: 0,
        icon: Languages,
        color: 'text-emerald-600',
        bgColor: 'from-emerald-500/20 to-blue-500/20',
        route: '/courses/arabic-progress',
        action: 'Start Learning'
      },
      {
        name: 'Islamic Studies',
        progress: 0,
        icon: Star,
        color: 'text-purple-400',
        bgColor: 'from-purple-500/20 to-purple-600/20',
        route: '/courses/islamic-studies',
        action: 'Explore'
      }
    ];

    try {
      let targetLearnerId = learnerId;

      // If no learnerId provided, get current user's learner
      if (!targetLearnerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // No user - still show default courses
          setCourses(defaultCourses);
          setLoading(false);
          return;
        }

        // First try to find learner where user is the parent
        const { data: learner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .maybeSingle();

        if (learner) {
          targetLearnerId = learner.id;
        } else {
          // For parents with children in parent_children table, get first child's learner
          const { data: children } = await supabase
            .from('parent_children')
            .select('child_id')
            .eq('parent_id', user.id)
            .limit(1);

          if (children && children.length > 0) {
            targetLearnerId = children[0].child_id;
          } else {
            // Fallback: check if user has memorization data directly (student account)
            const { count: directCount } = await supabase
              .from('surah_retention_tracker')
              .select('id', { count: 'exact', head: true })
              .eq('learner_id', user.id);

            if (directCount && directCount > 0) {
              targetLearnerId = user.id;
            }
          }
        }
      }

      let quranProgress = 0;
      let memorizedCount = 0;
      let arabicProgress = 0;
      let islamicProgress = 0;

      if (targetLearnerId) {
        // Get memorized surahs from surah_retention_tracker
        const { data: memorizedSurahs, count } = await supabase
          .from('surah_retention_tracker')
          .select('surah_number', { count: 'exact' })
          .eq('learner_id', targetLearnerId)
          .eq('memorization_status', 'memorized');

        if (count && count > 0) {
          const totalSurahs = 114;
          memorizedCount = count;
          quranProgress = Math.round((count / totalSurahs) * 100);
        }

        const { data: arabicSubject } = await supabase
          .from('subjects')
          .select('id')
          .eq('name', 'Arabic Language')
          .maybeSingle();

        if (arabicSubject) {
          const { data: arabicData } = await supabase
            .from('lesson_progress_tracker')
            .select('understanding_complete')
            .eq('learner_id', targetLearnerId)
            .eq('subject_id', arabicSubject.id);

          if (arabicData && arabicData.length > 0) {
            const completed = arabicData.filter(d => d.understanding_complete).length;
            arabicProgress = Math.round((completed / arabicData.length) * 100);
          }
        }

        const { data: islamicSubject } = await supabase
          .from('subjects')
          .select('id')
          .eq('name', 'Islamic Studies')
          .maybeSingle();

        if (islamicSubject) {
          const { data: islamicData } = await supabase
            .from('lesson_progress_tracker')
            .select('understanding_complete')
            .eq('learner_id', targetLearnerId)
            .eq('subject_id', islamicSubject.id);

          if (islamicData && islamicData.length > 0) {
            const completed = islamicData.filter(d => d.understanding_complete).length;
            islamicProgress = Math.round((completed / islamicData.length) * 100);
          }
        }
      }

      const coursesData: CourseProgress[] = [
        {
          name: "Qur'an Memorisation",
          progress: quranProgress,
          icon: BookOpen,
          color: 'text-emerald-400',
          bgColor: 'from-emerald-500/20 to-green-500/20',
          route: '/my-memorization',
          action: quranProgress > 0 ? 'Manage' : 'Set Up'
        },
        {
          name: 'Arabic Language',
          progress: arabicProgress,
          icon: Languages,
          color: 'text-emerald-600',
          bgColor: 'from-emerald-500/20 to-blue-500/20',
          route: '/courses/arabic-progress',
          action: arabicProgress > 0 ? 'Continue' : 'Start Learning'
        },
        {
          name: 'Islamic Studies',
          progress: islamicProgress,
          icon: Star,
          color: 'text-purple-400',
          bgColor: 'from-purple-500/20 to-purple-600/20',
          route: '/courses/islamic-studies',
          action: islamicProgress > 0 ? 'Continue' : 'Explore'
        }
      ];

      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading progress:', error);
      // Still show default courses on error
      setCourses(defaultCourses);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-48"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">My Learning Journey</h3>

      <div className="space-y-4">
        {courses.map((course, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${course.bgColor} rounded-lg flex items-center justify-center border border-gray-200`}>
                  <course.icon className={`w-5 h-5 ${course.color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{course.name}</h4>
                  <p className={`text-xs ${course.color} font-medium`}>
                    {course.subtitle || `${course.progress}% Complete`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(course.route)}
                className={`px-4 py-2 bg-gradient-to-r ${course.bgColor.replace('/20', '')} rounded-lg font-semibold text-sm transition hover:scale-105 flex items-center space-x-2 text-white`}
              >
                <span>{course.action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${course.bgColor.replace('/20', '')} transition-all duration-500`}
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
