import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Languages, Star, TrendingUp, Award, Image as ImageIcon, User } from 'lucide-react';
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
  shadowColor: string;
  imageUrl?: string;
}

interface ChildData {
  id: string;
  child_name: string;
  child_age: number | null;
}

export default function CoursesOverview() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParent, setIsParent] = useState(false);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedView, setSelectedView] = useState<'parent' | string>('parent');

  useEffect(() => {
    window.scrollTo(0, 0);
    checkParentStatusAndLoadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCourseProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedView]);

  async function checkParentStatusAndLoadChildren() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a parent
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .maybeSingle();

      const userIsParent = profile?.user_role === 'Parent';
      setIsParent(userIsParent);

      // If parent, load their children
      if (userIsParent) {
        const { data: childrenData } = await supabase
          .from('parent_children')
          .select('id, child_name, child_age')
          .eq('parent_id', user.id)
          .order('child_name');

        setChildren(childrenData || []);
      }
    } catch (error) {
      console.error('Error checking parent status:', error);
    }
  }

  async function loadCourseProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      let learner = null;

      if (selectedView === 'parent') {
        // Load parent's own learner data
        const { data: parentLearner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .maybeSingle();

        learner = parentLearner;
      } else {
        // Load child's learner data
        const childId = selectedView;

        // First, verify this child belongs to the current user
        const { data: parentChild } = await supabase
          .from('parent_children')
          .select('id, child_name, child_age, child_gender, has_account, account_id')
          .eq('id', childId)
          .eq('parent_id', user.id)
          .maybeSingle();

        if (!parentChild) {
          console.error('Child not found or access denied');
          return;
        }

        // If child has a full account, load their learner data
        if (parentChild.has_account && parentChild.account_id) {
          const { data: childLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', parentChild.account_id)
            .maybeSingle();

          learner = childLearner;
        } else {
          // For lightweight children, check if learner exists
          const { data: existingLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', user.id)
            .eq('name', parentChild.child_name)
            .maybeSingle();

          if (existingLearner) {
            learner = existingLearner;
          } else {
            // Create a learner record for lightweight child
            const { data: newLearner } = await supabase
              .from('learners')
              .insert({
                parent_id: user.id,
                name: parentChild.child_name,
                age: parentChild.child_age,
                gender: parentChild.child_gender,
                gamification_points: 0
              })
              .select('id')
              .single();

            learner = newLearner;
          }
        }
      }

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
          bgGradient: 'from-emerald-500 to-teal-600',
          shadowColor: 'emerald-500',
          imageUrl: '/qurancourse.jpg'
        },
        {
          courseId: 'arabic',
          courseName: 'Arabic Language',
          progressPercentage: arabicProgress,
          icon: Languages,
          description: 'Learn Classical Arabic to understand the Quran in its original language',
          route: '/course/arabic-language',
          color: 'text-blue-600',
          bgGradient: 'from-blue-500 to-cyan-600',
          shadowColor: 'blue-500',
          imageUrl: '/arabiccourse.jpg'
        },
        {
          courseId: 'islamic',
          courseName: 'Islamic Studies',
          progressPercentage: islamicProgress,
          icon: Star,
          description: 'Deepen your knowledge of Islamic theology, history, and jurisprudence',
          route: '/courses/islamic-studies',
          color: 'text-purple-600',
          bgGradient: 'from-purple-500 to-pink-600',
          shadowColor: 'purple-500',
          imageUrl: '/islamicstudies.jpg'
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Award className="w-6 h-6 text-emerald-400" />
              <span>My Learning Paths</span>
            </h1>

            <div className="w-40"></div>
          </div>
        </div>
      </header>

      {/* Child Selector Tabs (Only for Parents) */}
      {isParent && children.length > 0 && (
        <div className="bg-slate-900/50 border-b border-slate-800">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {/* My Progress Tab */}
              <button
                onClick={() => setSelectedView('parent')}
                className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center space-x-2 ${
                  selectedView === 'parent'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Progress</span>
              </button>

              {/* Child Tabs */}
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedView(child.id)}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center space-x-2 ${
                    selectedView === child.id
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                    {child.child_name[0]}
                  </div>
                  <span>{child.child_name}</span>
                  {child.child_age && (
                    <span className="text-xs opacity-75">({child.child_age})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
              {selectedView === 'parent'
                ? 'Choose Your Learning Path'
                : `${children.find(c => c.id === selectedView)?.child_name}'s Learning Path`
              }
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Track {selectedView === 'parent' ? 'your' : 'their'} progress across all three comprehensive Islamic learning courses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => (
            <button
              key={course.courseId}
              onClick={() => navigate(course.route)}
              className="group relative bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-800 hover:border-slate-700 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-3xl blur-xl transition-all duration-500" style={{
                backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
              }}></div>

              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${course.bgGradient} rounded-2xl flex items-center justify-center shadow-lg shadow-${course.shadowColor}/50 group-hover:scale-110 transition-transform duration-300`}>
                    <course.icon className="w-8 h-8 text-white" />
                  </div>

                  {course.progressPercentage > 0 && (
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-2xl font-bold text-emerald-400">
                        {course.progressPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                <div className={`bg-gradient-to-br ${course.bgGradient} rounded-xl p-1 mb-6 shadow-lg`}>
                  <div className="bg-slate-800 rounded-lg h-48 overflow-hidden">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.courseName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-20 h-20 text-slate-600 mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-slate-500 font-medium">Course Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition">
                  {course.courseName}
                </h3>

                <p className="text-slate-300 mb-6 leading-relaxed">
                  {course.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium">Overall Progress</span>
                    <span className="font-semibold text-emerald-400">
                      {course.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full bg-gradient-to-r ${course.bgGradient} transition-all duration-500`}
                      style={{ width: `${course.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">
                    {course.progressPercentage === 0 ? 'Not started' :
                     course.progressPercentage === 100 ? 'Completed!' : 'In progress'}
                  </span>
                  <span className="text-cyan-400 group-hover:translate-x-2 transition-transform duration-300 text-xl">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Your Learning Journey</h3>
              <p className="text-slate-300 leading-relaxed">
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
