import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Award, Image as ImageIcon, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TalbiyahBot from '../components/TalbiyahBot';

interface CourseProgress {
  courseId: string;
  courseName: string;
  progressPercentage: number;
  iconSrc: string;
  description: string;
  progressRoute: string;
  infoRoute: string;
  color: string;
  bgGradient: string;
  shadowColor: string;
  imageUrl?: string;
  comingSoon?: boolean;
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
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const userIsParent = profile?.role === 'parent';
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
          iconSrc: '/images/icons/icon-understanding.png',
          description: 'Master Tajweed, understand meanings, and memorize with confidence',
          progressRoute: '/courses/quran-progress',
          infoRoute: '/course/quran-understanding',
          color: 'text-emerald-600',
          bgGradient: 'from-emerald-500 to-teal-600',
          shadowColor: 'emerald-500',
          imageUrl: '/qurancourse.jpg'
        },
        {
          courseId: 'arabic',
          courseName: 'Arabic Language',
          progressPercentage: arabicProgress,
          iconSrc: '/images/icons/icon-arabic.png',
          description: 'Learn Classical Arabic to understand the Quran in its original language',
          progressRoute: '/courses/arabic-progress',
          infoRoute: '/course/arabic-language',
          color: 'text-blue-600',
          bgGradient: 'from-blue-500 to-emerald-600',
          shadowColor: 'blue-500',
          imageUrl: '/arabiccourse.jpg'
        },
        {
          courseId: 'islamic',
          courseName: 'Islamic Studies',
          progressPercentage: islamicProgress,
          iconSrc: '/images/icons/icon-hadith.png',
          description: 'Deepen your knowledge of Islamic theology, history, and jurisprudence',
          progressRoute: '/courses/islamic-studies',
          infoRoute: '/courses/islamic-studies',
          color: 'text-purple-600',
          bgGradient: 'from-purple-500 to-pink-600',
          shadowColor: 'purple-500',
          imageUrl: '/islamicstudies.jpg',
          comingSoon: true
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Award className="w-6 h-6 text-emerald-400" />
              <span>My Learning Paths</span>
            </h1>

            <div className="w-40"></div>
          </div>
        </div>
      </header>

      {/* Child Selector Tabs (Only for Parents) */}
      {isParent && children.length > 0 && (
        <div className="bg-white/50 border-b border-gray-200">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {/* My Progress Tab */}
              <button
                onClick={() => setSelectedView('parent')}
                className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center space-x-2 ${
                  selectedView === 'parent'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              {selectedView === 'parent'
                ? 'Choose Your Learning Path'
                : `${children.find(c => c.id === selectedView)?.child_name}'s Learning Path`
              }
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track {selectedView === 'parent' ? 'your' : 'their'} progress across all three comprehensive Islamic learning courses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {courses.map((course) => (
            <div
              key={course.courseId}
              className={`group relative rounded-3xl overflow-hidden transition-all duration-300 text-left ${
                course.comingSoon
                  ? 'opacity-75'
                  : 'hover:shadow-2xl hover:scale-[1.02]'
              }`}
            >
              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${course.bgGradient} rounded-3xl`}></div>

              {/* Inner White Card */}
              <div className="relative m-[3px] bg-white rounded-[21px] overflow-hidden">
                {/* Coming Soon Badge */}
                {course.comingSoon && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg">
                      <span className="text-gray-900 font-bold text-sm">Coming Soon</span>
                    </div>
                  </div>
                )}

                {/* Top Gradient Accent Bar */}
                <div className={`h-2 bg-gradient-to-r ${course.bgGradient}`}></div>

                <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 ${!course.comingSoon && 'group-hover:scale-110'} transition-transform duration-300`}>
                    <img src={course.iconSrc} alt={course.courseName} className="w-full h-full object-contain" />
                  </div>

                  {course.progressPercentage > 0 && !course.comingSoon && (
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-2xl font-bold text-emerald-400">
                        {course.progressPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Clickable image - goes to info page */}
                <div
                  onClick={() => !course.comingSoon && navigate(course.infoRoute)}
                  className={`bg-gradient-to-br ${course.bgGradient} rounded-xl p-1 mb-6 shadow-lg relative ${!course.comingSoon ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <div className="bg-gray-100 rounded-lg h-48 overflow-hidden">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.courseName}
                        className={`w-full h-full object-cover ${course.comingSoon ? 'grayscale' : 'hover:scale-105'} transition-transform duration-300`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-20 h-20 text-gray-600 mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-gray-500 font-medium">Course Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clickable title - goes to info page */}
                <h3
                  onClick={() => !course.comingSoon && navigate(course.infoRoute)}
                  className={`text-2xl font-bold text-gray-900 mb-3 ${!course.comingSoon && 'hover:text-emerald-600 cursor-pointer'} transition`}
                >
                  {course.courseName}
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {course.description}
                </p>

                {course.comingSoon ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-gray-500 font-medium">This course is under development</p>
                    <p className="text-gray-500 text-sm mt-1">Check back soon for updates!</p>
                  </div>
                ) : (
                  /* Clickable progress section - goes to progress tracker */
                  <div
                    onClick={() => navigate(course.progressRoute)}
                    className="cursor-pointer hover:bg-gray-50 rounded-xl p-3 -mx-3 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Overall Progress</span>
                        <span className="font-semibold text-emerald-400">
                          {course.progressPercentage}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                        <div
                          className={`h-full bg-gradient-to-r ${course.bgGradient} transition-all duration-500`}
                          style={{ width: `${course.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">
                        {course.progressPercentage === 0 ? 'Not started' :
                         course.progressPercentage === 100 ? 'Completed!' : 'In progress'}
                      </span>
                      <span className="text-emerald-600 hover:translate-x-2 transition-transform duration-300 text-xl">→</span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Learning Journey</h3>
              <p className="text-gray-600 leading-relaxed">
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
