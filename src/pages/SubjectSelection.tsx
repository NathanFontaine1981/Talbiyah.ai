import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft, Languages, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TalbiyahBot from '../components/TalbiyahBot';

export default function SubjectSelection() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const courses = [
    {
      id: 'quran-understanding',
      title: "Qur'an with Understanding",
      subtitle: 'Recitation, Tajweed & Tafsir',
      description: 'Master Quranic recitation with proper Tajweed while understanding the profound meanings through expert guidance.',
      icon: BookOpen,
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'emerald-500',
      available: true,
      featured: true,
      subjectFilter: 'quran'
    },
    {
      id: 'arabic-language',
      title: 'Arabic Language',
      subtitle: 'Classical & Modern Standard Arabic',
      description: 'Learn the language of the Quran from basics to fluency. Understand classical texts and communicate confidently.',
      icon: Languages,
      gradient: 'from-blue-500 to-emerald-600',
      shadowColor: 'blue-500',
      available: true,
      featured: false,
      subjectFilter: 'arabic'
    }
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="fixed top-0 w-full bg-white backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span className="text-2xl font-bold">Talbiyah.ai</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            {user && (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-gray-900 rounded-lg font-medium transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                <Sparkles className="w-12 h-12 text-emerald-600 relative animate-pulse" />
              </div>
            </div>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <span className="text-emerald-600 font-semibold text-sm">Step 1 of 3: Choose Your Subject</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                Choose Your Path
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Start your Islamic learning journey with a <span className="text-emerald-600 font-semibold">free 30-minute taster session</span>
            </p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">30 Minutes Free • No Credit Card Required</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {courses.map((course) => {
              const Icon = course.icon;
              return (
                <div key={course.id} className="group relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${course.gradient} opacity-0 ${course.available ? 'group-hover:opacity-10' : ''} rounded-3xl blur-xl transition-all duration-500`}></div>

                  <div className={`relative h-full bg-white backdrop-blur-sm p-8 rounded-3xl border transition-all duration-300 ${
                    course.available
                      ? `border-gray-200 hover:border-${course.shadowColor}/50`
                      : 'border-gray-200/50 opacity-60'
                  }`}
                  >
                    {course.featured && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full text-sm font-bold shadow-lg">
                          Most Popular
                        </div>
                      </div>
                    )}

                    {!course.available && (
                      <div className="absolute -top-4 right-4">
                        <div className="px-4 py-1 bg-gray-200 border border-gray-300 rounded-full text-sm font-semibold text-gray-600">
                          Coming Soon
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col h-full">
                      <div className={`w-20 h-20 bg-gradient-to-br ${course.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg ${course.available ? `shadow-${course.shadowColor}/30` : 'shadow-gray-500/20'}`}>
                        <Icon className="w-10 h-10 text-gray-900" />
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-emerald-600 text-sm font-semibold mb-4">
                        {course.subtitle}
                      </p>
                      <p className="text-gray-600 leading-relaxed mb-6 flex-grow">
                        {course.description}
                      </p>

                      {course.available ? (
                        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              navigate(`/teachers?subject=${course.subjectFilter}`);
                              window.scrollTo(0, 0);
                            }}
                            className={`w-full px-6 py-3 bg-gradient-to-r ${course.gradient} hover:opacity-90 text-gray-900 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl group/btn`}
                          >
                            <span>Book Now</span>
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                          <button
                            onClick={() => {
                              const routeMap: Record<string, string> = {
                                'quran-understanding': '/course/quran-understanding',
                                'arabic-language': '/course/arabic-language',
                                'islamic-studies': '/courses/islamic-studies'
                              };
                              const route = routeMap[course.id];
                              navigate(route);
                              window.scrollTo(0, 0);
                            }}
                            className="w-full px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-xl font-medium transition-all duration-300 border border-gray-200"
                          >
                            Learn More
                          </button>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-gray-200">
                          <span className="text-sm text-gray-500 font-medium">Launching Soon</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 mb-4">
              Need help choosing? Our teachers can guide you
            </p>
            <button
              onClick={() => navigate('/teachers')}
              className="px-8 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-900 rounded-lg font-semibold transition"
            >
              Browse All Teachers
            </button>
          </div>
        </div>
      </div>

      <TalbiyahBot />
    </div>
  );
}
