import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Heart, CheckCircle2, LogIn, LogOut, ArrowRight,
  Target, Mail, Lock, Loader2, Menu, X, Compass, GraduationCap,
  BookMarked, Languages, Play, Brain, Sparkles, ChevronRight,
  Star, Shield, Clock, Award
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { getDashboardRoute } from '../lib/authHelpers';

// Custom Talbiyah Logo Component
const TalbiyahLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none">
    <path
      d="M20 4C11.16 4 4 11.16 4 20s7.16 16 16 16c1.48 0 2.92-.2 4.28-.58-5.88-1.86-10.14-7.32-10.14-13.78s4.26-11.92 10.14-13.78C22.92 4.2 21.48 4 20 4z"
      fill="url(#gradient1)"
    />
    <path
      d="M22 14v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V14c0-1.1-.9-2-2-2H24c-1.1 0-2 .9-2 2z"
      fill="url(#gradient2)"
      opacity="0.9"
    />
    <path d="M27 12v16" stroke="#047857" strokeWidth="1.5"/>
    <path d="M29 16h4M29 19h4M29 22h3" stroke="#047857" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
    <defs>
      <linearGradient id="gradient1" x1="4" y1="4" x2="24" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981"/>
        <stop offset="1" stopColor="#047857"/>
      </linearGradient>
      <linearGradient id="gradient2" x1="22" y1="12" x2="36" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fbbf24"/>
        <stop offset="1" stopColor="#f59e0b"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function HomeLandingV2() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkTeacherStatus() {
      if (user) {
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();
        setIsTeacher(teacherProfile?.status === 'approved');
      } else {
        setIsTeacher(false);
      }
    }
    checkTeacherStatus();
  }, [user]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });
      if (error) throw error;
      setShowSignInModal(false);

      const dashboardRoute = await getDashboardRoute();
      navigate(dashboardRoute);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 hover:opacity-90 transition">
            <img src="/images/logo.png" alt="Talbiyah.ai" className="h-9 w-auto" />
            <span className="text-xl font-bold">
              <span className="text-gray-900 dark:text-white">Talbiyah</span>
              <span className="text-emerald-500">.ai</span>
            </span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => navigate('/explore')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition font-medium">Exploring Islam</button>
            <button onClick={() => navigate('/new-muslim')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition font-medium">Foundations</button>

            {user ? (
              <>
                <button
                  onClick={async () => {
                    const dashboardRoute = await getDashboardRoute();
                    navigate(dashboardRoute);
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2 text-gray-600 dark:text-gray-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2 text-gray-600 dark:text-gray-300 font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
                >
                  Start Free
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => { navigate('/explore'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition font-medium"
              >
                Exploring Islam
              </button>
              <button
                onClick={() => { navigate('/new-muslim'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition font-medium"
              >
                Foundations
              </button>
              <div className="border-t border-gray-100 pt-3 mt-3">
                {user ? (
                  <>
                    <button
                      onClick={async () => {
                        const dashboardRoute = await getDashboardRoute();
                        navigate(dashboardRoute);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 bg-emerald-500 text-white rounded-full font-semibold text-center mb-3"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                      className="block w-full px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-center"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setShowSignInModal(true); setMobileMenuOpen(false); }}
                      className="block w-full px-4 py-3 border border-emerald-500 text-emerald-600 rounded-full font-semibold text-center mb-3"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}
                      className="block w-full px-4 py-3 bg-emerald-500 text-white rounded-full font-semibold text-center"
                    >
                      Start Free
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Learning Hub Focus */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/90 via-gray-900/85 to-emerald-950/80" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 font-medium text-sm">Your Complete Islamic Learning Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-normal mb-6 leading-tight">
              <span className="text-white">Your Structured Path to</span>
              <br />
              <span className="text-emerald-400 italic">Islamic Mastery</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Build your foundations, master the Quran, learn Arabic - all in one place.
              Self-paced courses, interactive tools, and expert teachers when you need guidance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-full text-lg font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-emerald-500/25"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="px-8 py-4 border border-white/30 text-white rounded-full text-lg font-medium hover:bg-white/10 transition flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Explore Islam</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-6">Free courses available - no credit card required</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Every Lesson Multiplied Banner */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-emerald-600 to-emerald-500">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-white mb-4">
            Every Lesson <span className="italic">Multiplied.</span>
          </h2>
          <p className="text-base sm:text-lg text-emerald-100 mb-6 max-w-3xl mx-auto">
            With AI-powered study notes and interactive homework, one lesson here gives you the value of three.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-white text-sm sm:text-base">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Personalised study notes</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Interactive homework</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Lesson recordings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Unshakeable Foundations Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 mb-6">
              <span className="text-amber-700 font-medium text-sm">For New Muslims & Seekers of Knowledge</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-900 mb-4">
              Build Your
              <span className="text-emerald-500 italic"> Unshakeable Foundations</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-6">
              When you embrace Islam, your past is wiped clean - every sin transformed into good deeds.
              Now it's time to build knowledge that no one can shake.
            </p>
          </div>

          {/* Intro Message */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
              <p className="text-gray-600 leading-relaxed text-center">
                As a new Muslim, you need <span className="font-semibold text-gray-900">direction</span>.
                Without foundations, questions feel overwhelming and YouTube becomes your scattered teacher.
                Learn the <span className="font-semibold text-gray-900">6 essential pillars</span> below,
                and you'll stand on ground that cannot be shaken - able to answer questions, understand your faith deeply,
                and see how everything connects back to Allah.
              </p>
            </div>
          </div>

          {/* The 6 Foundation Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-12">
            {/* Pillar 1: Allah */}
            <button
              onClick={() => navigate('/foundations/allah')}
              className="group relative"
            >
              <div className="bg-gradient-to-b from-emerald-500 to-emerald-700 rounded-2xl p-4 sm:p-6 text-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-emerald-200 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between">
                {/* 3D Block Effect - Top */}
                <div className="absolute -top-2 left-2 right-2 h-4 bg-emerald-400 rounded-t-xl transform -skew-x-0" style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">﷽</span>
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">Allah</h3>
                  <p className="text-emerald-100 text-xs sm:text-sm">Names & Attributes</p>
                </div>

                <div className="mt-3 flex items-center justify-center text-white/80 text-xs">
                  <span>Learn</span>
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Pillar 2: Prophet Muhammad */}
            <button
              onClick={() => navigate('/foundations/muhammad')}
              className="group relative"
            >
              <div className="bg-gradient-to-b from-amber-500 to-amber-700 rounded-2xl p-4 sm:p-6 text-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-amber-200 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between">
                <div className="absolute -top-2 left-2 right-2 h-4 bg-amber-400 rounded-t-xl" style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3">
                    <img src="/images/icons/icon-seerah.png" alt="Prophet Muhammad" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">Muhammad ﷺ</h3>
                  <p className="text-amber-100 text-xs sm:text-sm">Meccan & Medinan Era</p>
                </div>

                <div className="mt-3 flex items-center justify-center text-white/80 text-xs">
                  <span>Learn</span>
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Pillar 3: The Prophets */}
            <button
              onClick={() => navigate('/foundations/prophets')}
              className="group relative"
            >
              <div className="bg-gradient-to-b from-blue-500 to-blue-700 rounded-2xl p-4 sm:p-6 text-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-200 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between">
                <div className="absolute -top-2 left-2 right-2 h-4 bg-blue-400 rounded-t-xl" style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3">
                    <img src="/images/icons/icon-scholars.png" alt="The Prophets" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">The Prophets</h3>
                  <p className="text-blue-100 text-xs sm:text-sm">Lives & Lessons</p>
                </div>

                <div className="mt-3 flex items-center justify-center text-white/80 text-xs">
                  <span>Learn</span>
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Pillar 4: Angels */}
            <button
              onClick={() => navigate('/foundations/angels')}
              className="group relative"
            >
              <div className="bg-gradient-to-b from-purple-500 to-purple-700 rounded-2xl p-4 sm:p-6 text-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-purple-200 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between">
                <div className="absolute -top-2 left-2 right-2 h-4 bg-purple-400 rounded-t-xl" style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3">
                    <img src="/images/icons/icon-authentic.png" alt="Angels" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">Angels</h3>
                  <p className="text-purple-100 text-xs sm:text-sm">The Unseen Realm</p>
                </div>

                <div className="mt-3 flex items-center justify-center text-white/80 text-xs">
                  <span>Learn</span>
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Pillar 5: Salah */}
            <button
              onClick={() => navigate('/salah')}
              className="group relative"
            >
              <div className="bg-gradient-to-b from-teal-500 to-teal-700 rounded-2xl p-4 sm:p-6 text-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-teal-200 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between">
                <div className="absolute -top-2 left-2 right-2 h-4 bg-teal-400 rounded-t-xl" style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3">
                    <img src="/images/icons/icon-mastery.png" alt="Salah" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">Salah</h3>
                  <p className="text-teal-100 text-xs sm:text-sm">How to Pray</p>
                </div>

                <div className="mt-3 flex items-center justify-center text-white/80 text-xs">
                  <span>Learn</span>
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Pillar 6: The Hereafter */}
            <button
              onClick={() => navigate('/foundations/hereafter')}
              className="group relative"
            >
              <div className="bg-gradient-to-b from-rose-500 to-rose-700 rounded-2xl p-4 sm:p-6 text-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-rose-200 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between">
                <div className="absolute -top-2 left-2 right-2 h-4 bg-rose-400 rounded-t-xl" style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3">
                    <img src="/images/icons/icon-understanding.png" alt="The Hereafter" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">The Hereafter</h3>
                  <p className="text-rose-100 text-xs sm:text-sm">Your Eternal Journey</p>
                </div>

                <div className="mt-3 flex items-center justify-center text-white/80 text-xs">
                  <span>Learn</span>
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {/* Bottom Message */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="flex -space-x-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
              </div>
              <span className="text-emerald-800 font-medium">Complete all 6 foundations → Stand on Unshakeable Ground</span>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate('/new-muslim')}
                className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg font-semibold transition-all inline-flex items-center gap-2"
              >
                <span>Start Building Your Foundations</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Tools Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-normal text-gray-900 mb-4">
              Tools to Accelerate
              <span className="text-emerald-500 italic"> Your Learning</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Interactive features designed to help you learn faster and retain more
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tool 1: Quran Progress Tracker */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12">
                  <img src="/images/icons/icon-memorisation.png" alt="Quran Progress" className="w-full h-full object-contain" />
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  Popular
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quran Progress Tracker</h3>
              <p className="text-gray-500 text-sm mb-4">
                Track every ayah across all 114 surahs. See your understanding, fluency, and memorisation progress at a glance.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Understanding</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Fluency</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Memorised</span>
                </span>
              </div>
            </div>

            {/* Tool 2: Salah Tutorial */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12">
                  <img src="/images/icons/icon-mastery.png" alt="Salah Tutorial" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Salah Guide</h3>
              <p className="text-gray-500 text-sm mb-4">
                Learn to pray with our 4-mode system: Learn positions, take quizzes, practice, then pray with guidance.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Learn</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Quiz</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Practice</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Pray Now</span>
              </div>
            </div>

            {/* Tool 3: Video Courses */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12">
                  <img src="/images/icons/icon-conversation.png" alt="Video Courses" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Courses with Exams</h3>
              <p className="text-gray-500 text-sm mb-4">
                Watch structured video lessons on Tawheed, Fiqh, and more. Take exams to verify your understanding.
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>70% pass score required</span>
              </div>
            </div>

            {/* Tool 4: AI Study Notes */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12">
                  <img src="/images/icons/icon-concepts.png" alt="AI Study Notes" className="w-full h-full object-contain" />
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  AI-Powered
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Study Notes</h3>
              <p className="text-gray-500 text-sm mb-4">
                After each lesson, AI generates personalised study notes, key concepts, and homework based on your conversation.
              </p>
            </div>

            {/* Tool 5: Homework System */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12">
                  <img src="/images/icons/icon-homework.png" alt="Homework System" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Homework</h3>
              <p className="text-gray-500 text-sm mb-4">
                Submit homework, get teacher feedback, and track your confidence levels as you progress.
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>Self-assessment tracking</span>
              </div>
            </div>

            {/* Tool 6: Exploring Islam */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12">
                  <img src="/images/icons/icon-authentic.png" alt="Exploring Islam" className="w-full h-full object-contain" />
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                  Free
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Exploring Islam Journey</h3>
              <p className="text-gray-500 text-sm mb-4">
                A 13-episode guided experience for those curious about Islam. Evidence-based, no pressure.
              </p>
              <button
                onClick={() => navigate('/explore')}
                className="text-teal-600 font-medium text-sm flex items-center space-x-1"
              >
                <span>Start Exploring</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Smart-Track Engine Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Text Content */}
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-900 mb-6 leading-tight">
                Meet Your
                <br />
                <span className="text-emerald-500 italic">'Smart-Track' Engine.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Whether you are memorizing Surahs or learning Arabic conversation, the engine listens. It tracks your mistakes and vocabulary retention, generating custom homework to fix your specific gaps.
              </p>
              <button
                onClick={() => navigate('/demo')}
                className="px-6 py-3 border border-gray-300 text-gray-900 rounded-full font-medium hover:bg-gray-100 transition"
              >
                See Talbiyah Insights in action
              </button>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="space-y-4">
              {/* Your Questions */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-questions.png" alt="Questions" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-semibold mb-0.5">Your Questions</h4>
                  <p className="text-gray-500 text-sm">Every question you asked, captured perfectly</p>
                </div>
              </div>

              {/* Teacher's Answers */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-answers.png" alt="Answers" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-semibold mb-0.5">Teacher's Answers</h4>
                  <p className="text-gray-500 text-sm">Complete responses with context</p>
                </div>
              </div>

              {/* Key Concepts */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-concepts.png" alt="Concepts" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-semibold mb-0.5">Key Concepts</h4>
                  <p className="text-gray-500 text-sm">Core ideas automatically highlighted</p>
                </div>
              </div>

              {/* Homework Tasks */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-homework.png" alt="Homework" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-semibold mb-0.5">Homework Tasks</h4>
                  <p className="text-gray-500 text-sm">Clear action items for your practice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Path Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-normal text-gray-900 mb-4">
              Choose Your Path
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Everyone's journey is different. Start where it makes sense for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Path 1: Curious */}
            <button
              onClick={() => navigate('/explore')}
              className="group text-left bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-8 text-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Compass className="w-8 h-8" />
                <span className="text-sm font-medium opacity-80">For the Curious</span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Exploring Islam</h3>
              <p className="text-white/80 mb-4">
                Not sure about Islam? Take our 13-episode journey. Evidence-based, no commitment required.
              </p>
              <div className="flex items-center space-x-2 text-white/90">
                <Clock className="w-4 h-4" />
                <span className="text-sm">~40 minutes total</span>
              </div>
            </button>

            {/* Path 2: New Muslim */}
            <button
              onClick={() => navigate('/new-muslim')}
              className="group text-left bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-8 h-8" />
                <span className="text-sm font-medium opacity-80">For New Muslims</span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Unshakeable Foundations</h3>
              <p className="text-white/80 mb-4">
                Build certainty in your faith. Learn the essentials every Muslim should know.
              </p>
              <div className="flex items-center space-x-2 text-white/90">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">6 foundational modules</span>
              </div>
            </button>

            {/* Path 3: Quran Journey */}
            <button
              onClick={() => navigate('/signup')}
              className="group text-left bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center space-x-3 mb-4">
                <BookOpen className="w-8 h-8" />
                <span className="text-sm font-medium opacity-80">For Quran Students</span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Quran Mastery</h3>
              <p className="text-white/80 mb-4">
                Understand, recite, and memorise the Quran with our structured 3-level approach.
              </p>
              <div className="flex items-center space-x-2 text-white/90">
                <Star className="w-4 h-4" />
                <span className="text-sm">Track all 114 surahs</span>
              </div>
            </button>

            {/* Path 4: Arabic */}
            <button
              onClick={() => navigate('/signup')}
              className="group text-left bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Languages className="w-8 h-8" />
                <span className="text-sm font-medium opacity-80">For Language Learners</span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Arabic Language</h3>
              <p className="text-white/80 mb-4">
                Unlock the original language of the Quran. From reading to conversation.
              </p>
              <div className="flex items-center space-x-2 text-white/90">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">Self-paced + live tutoring</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Quality Assurance - Condensed */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl p-8 border border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Expert Teachers When You Need Them</h3>
                <p className="text-gray-500">Every teacher is vetted, qualified, and supervised for quality.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-gray-600">Background Checked</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-gray-600">Student Rated</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-600">Supervised</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Same as original */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-serif font-normal text-gray-900 mb-4">
              Flexible Pricing
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Many features are free. Pay only for live teacher sessions when you need them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Free Tier */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Free Forever</h3>
              <p className="text-sm text-gray-500 mb-3">Self-paced learning</p>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-3xl font-bold text-emerald-500">£0</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Exploring Islam</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Foundation videos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Salah tutorial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Quran tracker</span>
                </div>
              </div>
            </div>

            {/* Single Lesson */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Single Lesson</h3>
              <p className="text-sm text-gray-500 mb-3">Pay as you go</p>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-3xl font-bold text-emerald-500">£15</span>
                <span className="text-gray-500 text-sm">/ lesson</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Everything in Free</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>1 hour live lesson</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>AI study notes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>No commitment</span>
                </div>
              </div>
            </div>

            {/* Steady Progress - Most Popular */}
            <div className="relative bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                  BEST VALUE
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 mt-2">Steady Progress</h3>
              <p className="text-sm text-gray-500 mb-3">8 lesson credits</p>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-3xl font-bold text-emerald-500">£108</span>
                <span className="text-gray-400 line-through text-sm">£120</span>
              </div>
              <p className="text-emerald-600 text-xs font-medium mb-4">£13.50/lesson - Save £12</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>8 hours of lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>AI notes & homework</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Lesson recordings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Credits never expire</span>
                </div>
              </div>
            </div>

            {/* Fast Track */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Fast-Track</h3>
              <p className="text-sm text-gray-500 mb-3">16 lesson credits</p>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-3xl font-bold text-emerald-500">£208</span>
                <span className="text-gray-400 line-through text-sm">£240</span>
              </div>
              <p className="text-emerald-600 text-xs font-medium mb-4">£13/lesson - Save £32</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>16 hours of lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Everything in Steady</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Best per-lesson rate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Share with family</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-gray-600">
              <span className="font-medium">Credits never expire</span> • Share with family • No subscriptions • First trial FREE
            </p>
          </div>

          {/* Sadaqah Jariyah */}
          <div className="mt-12 bg-emerald-50 rounded-3xl p-8 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sadaqah Jariyah - Ongoing Reward</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  By referring others to Talbiyah.ai, you gain the rewards of every hour they learn.
                  This blessing continues even after you pass away, continuously filling your book of deeds
                  with ongoing rewards for facilitating Islamic education.
                </p>
                <button
                  onClick={() => navigate('/referral-info')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition text-sm"
                >
                  <Heart className="w-4 h-4" />
                  Start Earning Rewards
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-serif font-normal text-white mb-6">
            Start Your Islamic Learning Journey Today
          </h2>
          <p className="text-lg text-emerald-100 mb-10 max-w-2xl mx-auto">
            Foundations. Quran. Arabic. All in one place - structured for your success.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="group px-8 py-4 bg-white text-emerald-700 rounded-full text-lg font-semibold transition hover:bg-emerald-50 inline-flex items-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-8 py-4 border border-white/30 text-white rounded-full text-lg font-medium hover:bg-white/10 transition"
            >
              Explore First
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <TalbiyahLogo className="w-9 h-9" />
                <span className="text-xl font-bold">
                  <span className="text-gray-900">Talbiyah</span>
                  <span className="text-emerald-500">.ai</span>
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Your complete Islamic learning hub.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Learn</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/explore" className="hover:text-emerald-500 transition">Exploring Islam</a></li>
                <li><a href="/new-muslim" className="hover:text-emerald-500 transition">Foundations</a></li>
                <li><a href="/signup" className="hover:text-emerald-500 transition">Quran Journey</a></li>
                <li><a href="/signup" className="hover:text-emerald-500 transition">Arabic Language</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Teachers</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/teachers" className="hover:text-emerald-500 transition">Browse Teachers</a></li>
                <li><a href="/apply-to-teach" className="hover:text-emerald-500 transition">Become a Teacher</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/about" className="hover:text-emerald-500 transition">About Us</a></li>
                <li><a href="#privacy" className="hover:text-emerald-500 transition">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-emerald-500 transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
            <p>© 2025 Talbiyah.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl">
            <button
              onClick={() => {
                setShowSignInModal(false);
                setAuthError('');
                setAuthForm({ email: '', password: '' });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <TalbiyahLogo className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-500">Sign in to continue your journey</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowSignInModal(false);
                  navigate('/signup');
                }}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
