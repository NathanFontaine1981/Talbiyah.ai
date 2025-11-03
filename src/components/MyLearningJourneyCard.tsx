import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Languages, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CourseProgress {
  name: string;
  progress: number;
  icon: any;
  color: string;
  bgColor: string;
  route: string;
  action: string;
}

export default function MyLearningJourneyCard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      let quranProgress = 0;
      let arabicProgress = 0;
      let islamicProgress = 0;

      if (learner) {
        const { data: quranData } = await supabase
          .from('lesson_progress_tracker')
          .select('understanding_complete, fluency_complete, memorization_complete')
          .eq('learner_id', learner.id)
          .like('topic', 'Surah%');

        if (quranData && quranData.length > 0) {
          const totalSurahs = 114;
          const completedCount = quranData.filter(
            s => s.understanding_complete && s.fluency_complete && s.memorization_complete
          ).length;
          quranProgress = Math.round((completedCount / totalSurahs) * 100);
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
            .eq('learner_id', learner.id)
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
            .eq('learner_id', learner.id)
            .eq('subject_id', islamicSubject.id);

          if (islamicData && islamicData.length > 0) {
            const completed = islamicData.filter(d => d.understanding_complete).length;
            islamicProgress = Math.round((completed / islamicData.length) * 100);
          }
        }
      }

      const coursesData: CourseProgress[] = [
        {
          name: "Qur'an with Understanding",
          progress: quranProgress,
          icon: BookOpen,
          color: 'text-emerald-400',
          bgColor: 'from-emerald-500/20 to-green-500/20',
          route: '/progress/quran',
          action: quranProgress > 0 ? 'Continue' : 'Start Learning'
        },
        {
          name: 'Arabic Language',
          progress: arabicProgress,
          icon: Languages,
          color: 'text-cyan-400',
          bgColor: 'from-cyan-500/20 to-blue-500/20',
          route: '/courses/arabic',
          action: arabicProgress > 0 ? 'Continue' : 'Start Learning'
        },
        {
          name: 'Islamic Studies',
          progress: islamicProgress,
          icon: Star,
          color: 'text-purple-400',
          bgColor: 'from-purple-500/20 to-pink-500/20',
          route: '/courses/islamic-studies',
          action: islamicProgress > 0 ? 'Continue' : 'Explore'
        }
      ];

      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-48"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4">My Learning Journey</h3>

      <div className="space-y-4">
        {courses.map((course, index) => (
          <div key={index} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${course.bgColor} rounded-lg flex items-center justify-center border border-slate-700/30`}>
                  <course.icon className={`w-5 h-5 ${course.color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{course.name}</h4>
                  <p className={`text-xs ${course.color} font-medium`}>{course.progress}% Complete</p>
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

            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
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
