import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Languages, Star, TrendingUp, Award, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TalbiyahBot from '../components/TalbiyahBot';

interface CourseProgress {
  courseId: string;
  courseName: string;
  progressPercentage: number;
  icon: any;
  description: string;
  route: string;
  color: string;
  bgGradient: string;
}

export default function CoursesOverview() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCourseProgress();
  }, []);

  async function loadCourseProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

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
          courseId: 'quran',
          courseName: "Qur'an with Understanding",
          progressPercentage: quranProgress,
          icon: BookOpen,
          description: 'Master Tajweed, understand meanings, and memorize with confidence',
          route: '/course/quran-understanding',
          color: 'text-emerald-600',
          bgGradient: 'from-emerald-500 to-teal-600'
        },
        {
          courseId: 'arabic',
          courseName: 'Arabic Language',
          progressPercentage: arabicProgress,
          icon: Languages,
          description: 'Learn Classical Arabic to understand the Quran in its original language',
          route: '/course/arabic-language',
          color: 'text-blue-600',
          bgGradient: 'from-blue-500 to-cyan-600'
        },
        {
          courseId: 'islamic',
          courseName: 'Islamic Studies',
          progressPercentage: islamicProgress,
          icon: Star,
          description: 'Deepen your knowledge of Islamic theology, history, and jurisprudence',
          route: '/courses/islamic-studies',
          color: 'text-purple-600',
          bgGradient: 'from-purple-500 to-pink-600'
        }
      ];

      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading course progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-6 h-6 text-emerald-600" />
              <span>My Learning Paths</span>
            </h1>

            <div className="w-40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Choose Your Learning Path
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Track your progress across all three comprehensive Islamic learning courses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => (
            <button
              key={course.courseId}
              onClick={() => navigate(course.route)}
              className="group relative bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden hover:border-slate-300 hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${course.bgGradient} rounded-2xl flex items-center justify-center border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <course.icon className="w-8 h-8 text-white" />
                  </div>

                  {course.progressPercentage > 0 && (
                    <div className="flex items-center space-x-2">
                      <TrendingUp className={`w-5 h-5 ${course.color}`} />
                      <span className={`text-2xl font-bold ${course.color}`}>
                        {course.progressPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                <div className={`bg-gradient-to-br ${course.bgGradient} rounded-xl p-1 mb-6 shadow-lg`}>
                  <div className="bg-slate-100 rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className={`w-20 h-20 ${course.color} mx-auto mb-3 opacity-50`} />
                      <p className="text-sm text-slate-500 font-medium">Course Image</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition">
                  {course.courseName}
                </h3>

                <p className="text-slate-600 mb-6 leading-relaxed">
                  {course.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Overall Progress</span>
                    <span className={`font-semibold ${course.color}`}>
                      {course.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
                    <div
                      className={`h-full bg-gradient-to-r ${course.bgGradient} transition-all duration-500`}
                      style={{ width: `${course.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-slate-500 font-medium">
                    {course.progressPercentage === 0 ? 'Not started' :
                     course.progressPercentage === 100 ? 'Completed!' : 'In progress'}
                  </span>
                  <span className={`${course.color} group-hover:translate-x-2 transition-transform duration-300 text-xl`}>→</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-300 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your Learning Journey</h3>
              <p className="text-slate-600 leading-relaxed">
                Each course is designed to provide comprehensive knowledge and practical skills.
                Track your progress, complete lessons with qualified teachers, and earn achievements
                as you advance through your Islamic education journey.
              </p>
            </div>
          </div>
        </div>
      </main>
      <TalbiyahBot />
    </div>
  );
}
