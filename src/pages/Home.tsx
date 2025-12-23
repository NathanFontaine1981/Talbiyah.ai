import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Users, Heart, CheckCircle2, Star, Shield, LogIn, LogOut, ArrowRight, Sparkles, Target, Mail, Lock, Loader2, Menu, X, Clock, MessageSquare, BookMarked } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { getDashboardRoute } from '../lib/authHelpers';

// Custom Talbiyah Logo Component
const TalbiyahLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none">
    {/* Crescent moon shape */}
    <path
      d="M20 4C11.16 4 4 11.16 4 20s7.16 16 16 16c1.48 0 2.92-.2 4.28-.58-5.88-1.86-10.14-7.32-10.14-13.78s4.26-11.92 10.14-13.78C22.92 4.2 21.48 4 20 4z"
      fill="url(#gradient1)"
    />
    {/* Book/Quran shape */}
    <path
      d="M22 14v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V14c0-1.1-.9-2-2-2H24c-1.1 0-2 .9-2 2z"
      fill="url(#gradient2)"
      opacity="0.9"
    />
    {/* Book spine */}
    <path d="M27 12v16" stroke="#047857" strokeWidth="1.5"/>
    {/* Text lines on book */}
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

// Custom icon components for the stages
const OpenBookIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12">
    <path d="M32 12c-6-4-14-6-20-6v44c6 0 14 2 20 6 6-4 14-6 20-6V6c-6 0-14 2-20 6z" fill="none" stroke="#10b981" strokeWidth="2"/>
    <path d="M32 12v44" stroke="#10b981" strokeWidth="2"/>
    <path d="M16 20h8M16 28h8M16 36h8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
    <path d="M40 20h8M40 28h8M40 36h8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BirdIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12">
    <path d="M8 32c8-4 16-8 24-8s16 4 24 8" fill="none" stroke="#f59e0b" strokeWidth="2"/>
    <path d="M32 24c-2-4-1-8 2-10s8-2 10 1c-4 1-6 4-6 7" fill="none" stroke="#10b981" strokeWidth="2"/>
    <circle cx="42" cy="18" r="1.5" fill="#10b981"/>
    <path d="M20 36c4 8 16 12 24 8" fill="none" stroke="#10b981" strokeWidth="2"/>
  </svg>
);

const HeartGeometricIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12">
    <path d="M32 52L12 32c-4-4-4-12 0-16s12-4 16 0l4 4 4-4c4-4 12-4 16 0s4 12 0 16L32 52z" fill="none" stroke="#10b981" strokeWidth="2"/>
    <path d="M24 28l8 8 8-8M28 36l4 4 4-4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
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
    if ((location.state as any)?.showSignIn) {
      setShowSignInModal(true);
    }
  }, [location]);

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
      {/* Clean Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 hover:opacity-90 transition">
            <img src="/images/logo.png" alt="Talbiyah.ai" className="h-9 w-auto" />
            <span className="text-xl font-bold">
              <span className="text-gray-900 dark:text-white">Talbiyah</span>
              <span className="text-emerald-500">.ai</span>
            </span>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => navigate('/teachers')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition font-medium">Find a Teacher</button>
            <button onClick={() => navigate('/islamic-source-reference')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition font-medium">Islamic Sources</button>

            {user ? (
              <>
                {isTeacher ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/apply-to-teach')}
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition font-medium"
                    >
                      Apply to Teach
                    </button>
                    <button
                      onClick={async () => {
                        const dashboardRoute = await getDashboardRoute();
                        navigate(dashboardRoute);
                      }}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
                    >
                      Dashboard
                    </button>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => { navigate('/teachers'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition font-medium"
              >
                Find a Teacher
              </button>
              <button
                onClick={() => { navigate('/islamic-source-reference'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition font-medium"
              >
                Islamic Sources
              </button>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                {user ? (
                  <>
                    <button
                      onClick={async () => {
                        const dashboardRoute = await getDashboardRoute();
                        navigate(dashboardRoute);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition text-center mb-3"
                    >
                      Go to Dashboard
                    </button>
                    {!isTeacher && (
                      <button
                        onClick={() => { navigate('/apply-to-teach'); setMobileMenuOpen(false); }}
                        className="block w-full px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full font-semibold transition text-center mb-3"
                      >
                        Apply to Teach
                      </button>
                    )}
                    <button
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                      className="block w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition font-medium text-center"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setShowSignInModal(true); setMobileMenuOpen(false); }}
                      className="block w-full px-4 py-3 border border-emerald-500 text-emerald-600 rounded-full hover:bg-emerald-50 transition font-semibold text-center mb-3"
                    >
                      <LogIn className="w-4 h-4 inline mr-2" />
                      Sign In
                    </button>
                    <button
                      onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}
                      className="block w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition text-center"
                    >
                      Sign Up Free
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Clean Design with Quran Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Overlay for Contrast */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/90 via-gray-900/85 to-emerald-950/80" />

        {/* Subtle geometric pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 0l30 30-30 30L0 30 30 0zm0 10L10 30l20 20 20-20-20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-normal mb-8 leading-tight">
              <span className="text-white">Master Your Deen.</span>
              <br />
              <span className="text-emerald-400 italic">Zero Wasted Time.</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
              Live 1-on-1 expert teachers supercharged by AI. We track every letter and word you learn so you stop forgetting and start progressing.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <button
                onClick={async () => {
                  if (user) {
                    const dashboardRoute = await getDashboardRoute();
                    navigate(dashboardRoute);
                  } else {
                    navigate('/signup');
                  }
                }}
                className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-full text-lg font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-emerald-500/25"
              >
                <span>{user ? 'Go to Dashboard' : 'Book Free Assessment'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required</p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Enhanced Learning Banner - Moved to position 2 */}
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

      {/* Study Notes Section (Smart-Track Engine) - Moved to position 3 */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Text Content */}
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-900 dark:text-white mb-6 leading-tight">
                Meet Your
                <br />
                <span className="text-emerald-500 italic">'Smart-Track' Engine.</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Whether you are memorizing Surahs or learning Arabic conversation, the engine listens. It tracks your mistakes and vocabulary retention, generating custom homework to fix your specific gaps.
              </p>
              <button
                onClick={() => navigate('/demo')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                See Talbiyah Insights in action
              </button>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="space-y-4">
              {/* Your Questions */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-questions.png" alt="Questions" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-0.5">Your Questions</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Every question you asked, captured perfectly</p>
                </div>
              </div>

              {/* Teacher's Answers */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-answers.png" alt="Answers" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-0.5">Teacher's Answers</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Complete responses with context</p>
                </div>
              </div>

              {/* Key Concepts */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-concepts.png" alt="Concepts" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-0.5">Key Concepts</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Core ideas automatically highlighted</p>
                </div>
              </div>

              {/* Homework Tasks */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                <div className="w-14 h-14 flex-shrink-0">
                  <img src="/images/icons/icon-homework.png" alt="Homework" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-semibold mb-0.5">Homework Tasks</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Clear action items for your practice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Steps Section - Clean White Design */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-900 mb-4">
              Your Three Steps to
            </h2>
            <p className="text-4xl sm:text-5xl md:text-6xl font-serif italic text-emerald-500">
              Better Learning
            </p>
          </div>

          {/* Three Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              {/* Number Badge */}
              <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                1
              </div>
              {/* Icon */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img src="/images/icons/icon-availability.png" alt="Choose Lesson" className="w-full h-full object-contain" />
                </div>
              </div>
              {/* Content */}
              <h3 className="text-2xl font-serif font-semibold text-gray-900 text-center mb-4">
                Choose Your Lesson
              </h3>
              <p className="text-gray-500 text-center leading-relaxed">
                Select your subject: Qur'an with Understanding or Arabic Language. One-to-one personalised lessons.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              {/* Number Badge */}
              <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                2
              </div>
              {/* Icon */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img src="/images/icons/icon-conversation.png" alt="Take Lesson" className="w-full h-full object-contain" />
                </div>
              </div>
              {/* Content */}
              <h3 className="text-2xl font-serif font-semibold text-gray-900 text-center mb-4">
                Take Your Lesson
              </h3>
              <p className="text-gray-500 text-center leading-relaxed">
                Join your live 1-to-1 session with a qualified teacher.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              {/* Number Badge */}
              <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                3
              </div>
              {/* Icon */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img src="/images/icons/icon-personalize.png" alt="Lesson Notes" className="w-full h-full object-contain" />
                </div>
              </div>
              {/* Content */}
              <h3 className="text-2xl font-serif font-semibold text-gray-900 text-center mb-4">
                Get Your Lesson Notes
              </h3>
              <p className="text-gray-500 text-center leading-relaxed">
                Receive personalised study notes and quizzes based on your actual lesson conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stages Section - COMMENTED OUT FOR NEW FLOW
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl p-8 border-2 border-emerald-400 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <OpenBookIcon />
              </div>
              <p className="text-emerald-500 font-semibold text-sm tracking-wider text-center mb-3">
                STAGE 1
              </p>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 text-center mb-2">
                Understanding
              </h3>
              <p className="text-gray-400 text-sm text-center mb-4">
                (Tafsir & Tadabbur)
              </p>
              <p className="text-gray-500 text-center leading-relaxed">
                Learn the meanings, context, and wisdom behind each verse. Understand what Allah is telling you before moving forward.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border-2 border-emerald-400 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <BirdIcon />
              </div>
              <p className="text-emerald-500 font-semibold text-sm tracking-wider text-center mb-3">
                STAGE 2
              </p>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 text-center mb-2">
                Fluency
              </h3>
              <p className="text-gray-400 text-sm text-center mb-4">
                (Tajweed & Recitation)
              </p>
              <p className="text-gray-500 text-center leading-relaxed">
                Master proper pronunciation and tajweed rules. Recite beautifully with confidence and correct articulation.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 border-2 border-emerald-400 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <HeartGeometricIcon />
              </div>
              <p className="text-emerald-500 font-semibold text-sm tracking-wider text-center mb-3">
                STAGE 3
              </p>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 text-center mb-2">
                Memorisation
              </h3>
              <p className="text-gray-400 text-sm text-center mb-4">
                (Hifz)
              </p>
              <p className="text-gray-500 text-center leading-relaxed">
                Internalise the Quran in your heart. Memorisation becomes natural when you understand and can recite with fluency.
              </p>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Our Story Section - Clean Design (Moved before Quality for psychological flow) */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold text-sm tracking-wider uppercase mb-4">Our Story</p>
            <h2 className="text-4xl sm:text-5xl font-serif font-normal text-gray-900 mb-4">
              From the Premier League to
            </h2>
            <p className="text-4xl sm:text-5xl font-serif italic text-emerald-500">
              Serving Your Learning
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Photo */}
            <div className="relative">
              <div className="aspect-[3/4] bg-gray-200 rounded-3xl overflow-hidden">
                <img
                  src="/nathan-ellington.jpg"
                  alt="Nathan Ellington - Founder of Talbiyah.ai"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            {/* Story Content */}
            <div className="space-y-6">
              <p className="text-lg text-gray-600 leading-relaxed">
                My journey began on the football pitch—playing for Bristol Rovers, Wigan Athletic, and West Bromwich Albion. But the most important goal I ever scored was finding Islam.
              </p>

              <blockquote className="border-l-4 border-emerald-500 pl-6 py-4 bg-white rounded-r-xl">
                <p className="text-xl text-gray-900 italic leading-relaxed">
                  "I embraced Islam the year of promotion to the Premier League with Wigan—a journey of enlightenment that transformed my life forever."
                </p>
              </blockquote>

              <p className="text-lg text-gray-600 leading-relaxed">
                Over 20 years as a Muslim, I've dedicated my life to learning and sharing Islamic knowledge. After retiring from football, I founded Talbiyah.ai to make authentic Islamic education accessible to everyone, anywhere in the world.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition inline-flex items-center justify-center gap-2"
                >
                  <span>Start Learning Today</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/apply-to-teach')}
                  className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-full font-semibold transition inline-flex items-center justify-center gap-2"
                >
                  <span>Join Our Teaching Team</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Section - Clean White Design */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-900 mb-6 leading-tight">
                Quality You
                <br />
                <span className="text-emerald-500 italic">Can Trust.</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Every teacher on Talbiyah.ai is hand-picked, qualified, and monitored by our Supervisor team to ensure the highest quality of teaching.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-3">
                  <img src="/images/icons/icon-authentic.png" alt="Qualified" className="w-full h-full object-contain" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Qualified</h4>
                <p className="text-sm text-gray-500">Background checked</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-3">
                  <img src="/images/icons/icon-scholars.png" alt="Rated" className="w-full h-full object-contain" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Rated</h4>
                <p className="text-sm text-gray-500">Student reviews</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-3">
                  <img src="/images/icons/icon-mastery.png" alt="Supervised" className="w-full h-full object-contain" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Supervised</h4>
                <p className="text-sm text-gray-500">Quality monitored</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto mb-3">
                  <img src="/images/icons/icon-privacy.png" alt="Trusted" className="w-full h-full object-contain" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Trusted</h4>
                <p className="text-sm text-gray-500">Community approved</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Islamic Sources Section - COMMENTED OUT FOR NOW
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold text-sm">Islamic Sources</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 mb-6">
                  Find Authentic Sources
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed mb-6">
                  Get help finding relevant ayahs from the Qur'an and authentic Hadith based on the understanding of the Salaf.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    'Quranic verses with context',
                    'Authentic Hadith references',
                    'Based on understanding of the Salaf',
                    'Available 24/7'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                  <p className="text-sm text-emerald-800">
                    <strong>Important:</strong> This is a reference tool only. Always consult qualified scholars or imams for religious rulings.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (user) {
                      navigate('/islamic-source-reference');
                    } else {
                      navigate('/signup');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
                >
                  <span>Find Islamic Sources</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold mb-1">Example Question:</p>
                      <p className="text-gray-500 text-sm">"What does the Quran say about patience?"</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold mb-1">Get References:</p>
                      <p className="text-gray-500 text-sm">Relevant ayahs and authentic Hadith with proper citations</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold mb-1">Verify with Scholars:</p>
                      <p className="text-gray-500 text-sm">Take the references to your local imam or qualified scholar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Pricing Section - Clean White Design */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-gray-900 mb-4">
              Flexible Pricing.
            </h2>
            <p className="text-4xl sm:text-5xl md:text-6xl font-serif italic text-emerald-500 mb-6">
              Better Value.
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Pay as you go or save with credit packs. No subscriptions, cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* The Maintainer */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">The Maintainer</h3>
              <p className="text-sm text-gray-500 mb-3">For those keeping their skills sharp</p>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-4xl font-bold text-emerald-500">£58</span>
                <span className="text-gray-400 line-through">£60</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-emerald-600 text-sm font-medium">£14.50 per lesson</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Save £2</span>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>4 lesson credits (4 hours)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>8 x 30min sessions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>1 lesson/week for 1 month</span>
                </div>
              </div>
            </div>

            {/* The Steady Progress - Most Popular */}
            <div className="relative bg-emerald-50 rounded-3xl p-8 border-2 border-emerald-500 hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1 mt-2">The Steady Progress</h3>
              <p className="text-sm text-gray-500 mb-3">For committed learners building consistency</p>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-4xl font-bold text-emerald-500">£108</span>
                <span className="text-gray-400 line-through">£120</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-emerald-600 text-sm font-medium">£13.50 per lesson</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Save £12</span>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>8 lesson credits (8 hours)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>16 x 30min sessions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>2 lessons/week for 1 month</span>
                </div>
              </div>
            </div>

            {/* The Fast-Track */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">The Fast-Track</h3>
              <p className="text-sm text-gray-500 mb-3">For serious students accelerating their journey</p>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-4xl font-bold text-emerald-500">£208</span>
                <span className="text-gray-400 line-through">£240</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-emerald-600 text-sm font-medium">£13 per lesson</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Save £32</span>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>16 lesson credits (16 hours)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>32 x 30min sessions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>4 lessons/week for 1 month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {[
                'Credits never expire',
                'Use for 30 or 60-min lessons',
                'Share with family members',
                'No subscription fees',
                'First trial still FREE'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-600 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
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

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-white mb-6 leading-tight">
            Start Your Journey to
            <br />
            <span className="text-emerald-400 italic">Deeper Understanding.</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of students transforming their Islamic education with AI-powered insights.
          </p>
          <button
            onClick={() => {
              if (user) {
                navigate('/teachers');
              } else {
                navigate('/signup');
              }
            }}
            className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full text-lg font-semibold transition inline-flex items-center gap-2"
          >
            <span>Find Your Teacher Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer - Clean Design */}
      <footer className="border-t border-gray-100 dark:border-gray-700 py-12 px-4 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <TalbiyahLogo className="w-9 h-9" />
                <span className="text-xl font-bold">
                  <span className="text-gray-900 dark:text-white">Talbiyah</span>
                  <span className="text-emerald-500">.ai</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Premium Islamic education with vetted, gentle teachers.
              </p>
            </div>

            {/* Teachers */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Teachers</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="/teachers" className="hover:text-emerald-500 transition">Browse Teachers</a></li>
                <li><a href="/teachers/vetting-process" className="hover:text-emerald-500 transition">How We Vet Teachers</a></li>
                <li><a href="/apply-to-teach" className="hover:text-emerald-500 transition">Become a Teacher</a></li>
              </ul>
            </div>

            {/* Learn */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Learn</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="/diagnostic/start" className="hover:text-emerald-500 transition">Free Assessment</a></li>
                <li><a href="/subjects" className="hover:text-emerald-500 transition">Subjects</a></li>
                <li><a href="/about/islamic-source-reference" className="hover:text-emerald-500 transition">Islamic Source Reference</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#contact" className="hover:text-emerald-500 transition">Contact</a></li>
                <li><a href="#privacy" className="hover:text-emerald-500 transition">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-emerald-500 transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 dark:border-gray-700 text-center text-gray-400 text-sm">
            <p>© 2025 Talbiyah.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sign In Modal - Clean Design */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-8 relative shadow-2xl">
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
              <div className="inline-flex items-center space-x-2 mb-4">
                <TalbiyahLogo className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-serif font-semibold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Sign in to continue your journey</p>
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
                  autoComplete="email"
                  name="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
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
                  autoComplete="current-password"
                  name="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!authForm.email) {
                      setAuthError('Please enter your email address');
                      return;
                    }
                    try {
                      await supabase.auth.resetPasswordForEmail(authForm.email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      setAuthError('');
                      toast.success('Password reset email sent! Check your inbox.');
                    } catch (err: any) {
                      setAuthError(err.message || 'Failed to send reset email');
                    }
                  }}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Forgot Password?
                </button>
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
