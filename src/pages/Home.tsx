import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Users, Heart, CheckCircle2, Star, Shield, LogIn, LogOut, Play, ArrowRight, Sparkles, Target, Zap, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getDashboardRoute } from '../lib/authHelpers';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });

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
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-xl z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="hover:opacity-90 transition group">
            <div className="flex items-center space-x-2 mb-1">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/30 transition"></div>
                <BookOpen className="w-7 h-7 text-cyan-400 relative" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Talbiyah.ai</span>
            </div>
            <div className="text-left ml-9">
              <p className="text-xs text-slate-400 font-light italic">At Your Service</p>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">AI-POWERED ISLAMIC LEARNING</p>
            </div>
          </button>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate('/teachers')} className="text-slate-300 hover:text-white transition font-medium">Find a Teacher</button>
            <button onClick={() => navigate('/islamic-source-reference')} className="text-slate-300 hover:text-white transition font-medium">Islamic Sources</button>

            {user ? (
              <>
                {isTeacher ? (
                  <>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/25"
                    >
                      Go to Dashboard
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/apply-to-teach')}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/25"
                    >
                      Apply to Teach
                    </button>
                    <button
                      onClick={async () => {
                        const dashboardRoute = await getDashboardRoute();
                        navigate(dashboardRoute);
                      }}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition border border-slate-700"
                    >
                      Dashboard
                    </button>
                  </>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-5 py-2.5 border border-slate-700 rounded-lg hover:bg-slate-800 transition flex items-center space-x-2 text-slate-300 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="px-6 py-2.5 border border-slate-700 rounded-lg hover:bg-slate-800 transition flex items-center space-x-2 text-slate-300 hover:text-white font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/25"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 font-semibold text-sm">The Future of Islamic Learning</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">The Future of</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">Islamic Learning.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Talbiyah.ai is the <span className="text-white font-semibold">first Islamic learning hub</span> that uses AI to automatically create personalised study notes and quizzes from your live 1-to-1 lessons.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 mb-12">
              <button
                onClick={async () => {
                  if (user) {
                    const dashboardRoute = await getDashboardRoute();
                    navigate(dashboardRoute);
                  } else {
                    navigate('/signup');
                  }
                }}
                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xl font-bold transition shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/75 flex items-center justify-center space-x-2"
              >
                <span>{user ? 'Go to Dashboard' : 'Start Your Free 30-Minute Taster Session'}</span>
                <ArrowRight className="w-6 h-6" />
              </button>
              <p className="text-sm text-slate-400">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Your Three Steps to</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Better Learning</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white">Choose Your Lesson</h3>
                </div>
                <p className="text-slate-300 leading-relaxed flex-grow">
                  Select your subject: Qur'an with Understanding or Arabic Language. One-to-one personalised lessons.
                </p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white">Take Your Lesson</h3>
                </div>
                <p className="text-slate-300 leading-relaxed flex-grow">
                  Join your live 1-to-1 session with a qualified teacher.
                </p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white">Get Your AI Notes</h3>
                </div>
                <p className="text-slate-300 leading-relaxed flex-grow">
                  Receive your personalised Talbiyah Insights and quizzes immediately after class.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Master the </span>
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">Quran</span>
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">,</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Not Just Memorize It</span>
            </h2>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto mb-6 font-semibold">
              Track what truly matters - Understanding, Fluency, and Memorization
            </p>
            <div className="max-w-4xl mx-auto text-lg text-slate-400 leading-relaxed space-y-4">
              <p>
                Our unique 3-stage method ensures you <span className="text-white font-semibold">truly master the Quran</span>. Traditional methods focus on speed of memorization. We focus on deep comprehension and lasting transformation.
              </p>
              <div className="grid md:grid-cols-3 gap-4 pt-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="text-white font-semibold">Understand meanings and context</p>
                    <p className="text-sm text-slate-500">(Tafsir & Tadabbur)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="text-white font-semibold">Perfect recitation and tajweed</p>
                    <p className="text-sm text-slate-500">(Fluency)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="text-white font-semibold">Memorize with heart and mind</p>
                    <p className="text-sm text-slate-500">(Hifz)</p>
                  </div>
                </div>
              </div>
              <p className="text-cyan-300 font-medium pt-2">
                Track your progress through all 114 Surahs across all three dimensions.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/50">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="mb-4">
                  <span className="text-emerald-400 font-bold text-sm">STAGE 1</span>
                  <h3 className="text-2xl font-bold text-white mt-2">Understanding</h3>
                  <p className="text-xs text-slate-400 mt-1">(Tafsir & Tadabbur)</p>
                </div>
                <p className="text-slate-300 leading-relaxed flex-1">
                  Learn the meanings, context, and wisdom behind each verse. Understand what Allah is telling you before moving forward.
                </p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="mb-4">
                  <span className="text-cyan-400 font-bold text-sm">STAGE 2</span>
                  <h3 className="text-2xl font-bold text-white mt-2">Fluency</h3>
                  <p className="text-xs text-slate-400 mt-1">(Tajweed & Recitation)</p>
                </div>
                <p className="text-slate-300 leading-relaxed flex-1">
                  Master proper pronunciation and tajweed rules. Recite beautifully with confidence and correct articulation.
                </p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="mb-4">
                  <span className="text-purple-400 font-bold text-sm">STAGE 3</span>
                  <h3 className="text-2xl font-bold text-white mt-2">Memorization</h3>
                  <p className="text-xs text-slate-400 mt-1">(Hifz)</p>
                </div>
                <p className="text-slate-300 leading-relaxed flex-1">
                  Internalize the Quran in your heart. Memorization becomes natural when you understand and can recite with fluency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Finally, Study Notes</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">That Are 100% For You.</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Our AI isn't generic. It analyzes your <span className="text-white font-semibold italic">actual conversation</span>—the questions you asked and the answers your teacher gave—to build a perfect study guide.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl blur-2xl group-hover:blur-3xl transition"></div>
              <div className="relative aspect-video bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10"></div>
                <button className="relative z-10 w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/50 hover:scale-110 transition group">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">See Talbiyah Insights in action</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { icon: CheckCircle2, text: 'Your Questions', desc: 'Every question you asked, captured perfectly' },
                { icon: CheckCircle2, text: "Teacher's Answers", desc: 'Complete responses with context' },
                { icon: CheckCircle2, text: 'Key Concepts', desc: 'Core ideas automatically highlighted' },
                { icon: CheckCircle2, text: 'Homework Tasks', desc: 'Clear action items for your practice' }
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition">
                    <item.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{item.text}</h4>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Quality You</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Can Trust.</span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed mb-8">
                Every teacher on Talbiyah.ai is hand-picked, qualified, and monitored by our Supervisor team to ensure the highest quality of teaching.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Shield, label: 'Qualified', desc: 'Background checked' },
                { icon: Star, label: 'Rated', desc: 'Student reviews' },
                { icon: Users, label: 'Supervised', desc: 'Quality monitored' },
                { icon: Heart, label: 'Trusted', desc: 'Community approved' }
              ].map((item, i) => (
                <div key={i} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition text-center">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-4">
                      <item.icon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">{item.label}</h4>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-3xl blur-2xl group-hover:blur-3xl transition"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl border border-slate-700/50 hover:border-emerald-500/50 transition overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-12 items-center p-12">
                <div>
                  <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold text-sm">Islamic Sources</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Find Authentic Sources</span>
                  </h2>
                  <p className="text-xl text-slate-300 leading-relaxed mb-8">
                    Get help finding relevant ayahs from the Qur'an and authentic Hadith based on the understanding of the Salaf. A reference tool to guide your Islamic learning journey.
                  </p>
                  <div className="space-y-3 mb-8">
                    {[
                      'Quranic verses with context',
                      'Authentic Hadith references',
                      'Based on understanding of the Salaf',
                      'Available 24/7'
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-slate-300 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                    <p className="text-sm text-amber-200">
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
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/75"
                  >
                    <span>Find Islamic Sources</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-2xl blur-2xl"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold mb-1">Example Question:</p>
                          <p className="text-slate-400 text-sm">"What does the Quran say about patience?"</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold mb-1">Get References:</p>
                          <p className="text-slate-400 text-sm">Relevant ayahs and authentic Hadith with proper citations</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Shield className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold mb-1">Verify with Scholars:</p>
                          <p className="text-slate-400 text-sm">Take the references to your local imam or qualified scholar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 font-semibold text-sm">Transparent Pricing</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Flexible Pricing.</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Better Value.</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Pay as you go or save with credit packs. No subscriptions, cancel anytime.
            </p>
          </div>

          {/* Pay As You Go */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl border-2 border-slate-700/50 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 px-8 py-6 border-b border-slate-700/50">
                <h3 className="text-2xl font-bold text-white text-center">Pay As You Go</h3>
                <p className="text-center text-slate-400 mt-1">Book individual lessons when you need them</p>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 30-min lesson */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
                    <div className="relative bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold text-white">30-min Lesson</h4>
                          <p className="text-sm text-slate-400 mt-1">Perfect for younger learners</p>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">£7.50</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 60-min lesson */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
                    <div className="relative bg-gradient-to-br from-cyan-500/5 to-blue-600/5 backdrop-blur-sm p-6 rounded-2xl border-2 border-cyan-500/50 hover:border-cyan-400/70 transition">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold text-white">60-min Lesson</h4>
                          <p className="text-sm text-cyan-300 mt-1 font-semibold">Most popular</p>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">£15.00</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Packs */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 backdrop-blur-sm rounded-3xl border-2 border-emerald-500/30 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-8 py-6 border-b border-emerald-500/30">
                <h3 className="text-2xl font-bold text-white text-center">Credit Packs - Save More</h3>
                <p className="text-center text-emerald-300 mt-1 font-semibold">Buy in bulk and get better rates on every lesson</p>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {/* Starter Pack */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
                    <div className="relative bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition">
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-white mb-2">Starter Pack</h4>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">£58</span>
                          <span className="text-slate-400 line-through text-sm">£60</span>
                        </div>
                        <p className="text-emerald-400 text-sm font-semibold mt-1">£14.50 per lesson</p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-300">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>4 lesson credits (4 hours)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>8 x 30min sessions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>1 lesson/week for 1 month</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standard Pack - Most Popular */}
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-500/50 hover:border-emerald-400/70 transition">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="px-4 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                      <div className="mb-4 mt-2">
                        <h4 className="text-xl font-bold text-white mb-2">Standard Pack</h4>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">£108</span>
                          <span className="text-slate-400 line-through text-sm">£120</span>
                        </div>
                        <p className="text-emerald-400 text-sm font-semibold mt-1">£13.50 per lesson</p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-300">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>8 lesson credits (8 hours)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>16 x 30min sessions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>2 lessons/week for 1 month</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Intensive Pack */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
                    <div className="relative bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/50 transition">
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-white mb-2">Intensive Pack</h4>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">£208</span>
                          <span className="text-slate-400 line-through text-sm">£240</span>
                        </div>
                        <p className="text-emerald-400 text-sm font-semibold mt-1">£13 per lesson</p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-300">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>16 lesson credits (16 hours)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>32 x 30min sessions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>4 lessons/week for 1 month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits list */}
                <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      'Credits never expire',
                      'Use for 30 or 60-min lessons',
                      'Share with family members',
                      'Cancel unused anytime',
                      'No subscription fees',
                      'First trial still FREE'
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-slate-300 font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-sm p-8 rounded-2xl border border-amber-500/30">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Sadaqah Jariyah - Ongoing Reward</h3>
                  <p className="text-slate-200 leading-relaxed text-lg">
                    By referring others to Talbiyah.ai, you gain the rewards of every hour they learn.
                    This blessing continues even after you pass away, continuously filling your book of deeds
                    with ongoing rewards for facilitating Islamic education.
                  </p>
                  <button
                    onClick={() => navigate('/referral')}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-semibold transition shadow-lg"
                  >
                    <Heart className="w-5 h-5" />
                    Start Earning Rewards
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 font-semibold text-sm">Our Story</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">From the Premier League to</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Serving Your Learning</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
            {/* Photo & Floating Cards */}
            <div className="relative">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl blur-2xl group-hover:blur-3xl transition"></div>
                <div className="relative aspect-[3/4] bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10"></div>
                  {/* Placeholder for founder photo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Users className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Founder Photo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Achievement Cards with Slow Scroll Animation */}
              <style>{`
                @keyframes slowFloat1 {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-20px); }
                }
                @keyframes slowFloat2 {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-15px); }
                }
                @keyframes slowFloat3 {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-25px); }
                }
                .float-card-1 {
                  animation: slowFloat1 8s ease-in-out infinite;
                }
                .float-card-2 {
                  animation: slowFloat2 10s ease-in-out infinite 2s;
                }
                .float-card-3 {
                  animation: slowFloat3 9s ease-in-out infinite 4s;
                }
              `}</style>

              <div className="float-card-1 absolute -right-4 top-1/4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/50 shadow-xl max-w-[200px] hidden lg:block transition-all duration-300 hover:scale-105">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-cyan-400">Bristol Rovers</span>
                </div>
                <p className="text-xs text-slate-300">2005-2007</p>
              </div>

              <div className="float-card-2 absolute -left-4 top-1/2 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-blue-500/50 shadow-xl max-w-[200px] hidden lg:block transition-all duration-300 hover:scale-105">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-blue-400">Wigan Athletic</span>
                </div>
                <p className="text-xs text-slate-300">2007-2010</p>
              </div>

              <div className="float-card-3 absolute -right-4 bottom-1/4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-purple-500/50 shadow-xl max-w-[200px] hidden lg:block transition-all duration-300 hover:scale-105">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-purple-400">West Bromwich Albion</span>
                </div>
                <p className="text-xs text-slate-300">2010-2012</p>
              </div>
            </div>

            {/* Story Content */}
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-slate-300 leading-relaxed">
                  My journey began on the football pitch—playing for <span className="text-cyan-400 font-semibold">Bristol Rovers</span>, <span className="text-blue-400 font-semibold">Wigan Athletic</span>, and <span className="text-purple-400 font-semibold">West Bromwich Albion</span>. But the most important goal I ever scored was finding Islam.
                </p>

                <div className="my-8 pl-6 border-l-4 border-cyan-500/50 bg-slate-800/30 p-6 rounded-r-xl">
                  <p className="text-xl text-white italic leading-relaxed">
                    "I embraced Islam the year of promotion to the Premier League with Wigan—a journey of enlightenment that transformed my life forever."
                  </p>
                </div>

                <p className="text-lg text-slate-300 leading-relaxed">
                  Over 20 years as a Muslim, I've dedicated my life to learning and sharing Islamic knowledge. After retiring from football, I founded <span className="text-cyan-400 font-semibold">Nexum Learning</span>, and now Talbiyah.ai represents the next evolution of that mission.
                </p>

                <p className="text-lg text-slate-300 leading-relaxed">
                  <span className="text-white font-semibold">At your service using the latest tech</span>—that's not just a tagline, it's a commitment. Just as I gave everything on the pitch, I'm now giving everything to help you and your family grow closer to Allah through proper Islamic education.
                </p>
              </div>

              {/* Why Different Section */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                  <span>Why Talbiyah.ai is Different</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { text: 'Built by someone who understands dedication and discipline', icon: Target },
                    { text: 'Combines traditional Islamic learning with modern technology', icon: Sparkles },
                    { text: 'Every feature designed as Sadaqah Jariyah for ongoing rewards', icon: Heart },
                    { text: 'Transparent, fair pricing that rewards quality teaching', icon: Shield }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">20+ Years</div>
              <p className="text-slate-300 font-medium">as a Muslim</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">Premier League</div>
              <p className="text-slate-300 font-medium">Journey</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-2">Sadaqah Jariyah</div>
              <p className="text-slate-300 font-medium">Ongoing Reward</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-lg font-bold transition shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/75 inline-flex items-center space-x-2"
            >
              <span>Start Learning Today</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/apply-to-teach')}
              className="px-10 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-cyan-500/50 hover:border-cyan-400/70 text-white rounded-xl text-lg font-bold transition inline-flex items-center space-x-2"
            >
              <span>Join Our Teaching Team</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">Start Your Journey to</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">Deeper Understanding.</span>
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join thousands of students transforming their Islamic education with AI-powered insights.
          </p>
          <button
            onClick={() => {
              if (user) {
                navigate('/teachers');
              } else {
                setShowSignInModal(true);
              }
            }}
            className="group px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xl font-bold transition shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/75 inline-flex items-center space-x-3"
          >
            <span>Find Your Teacher Now</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-800/50 py-12 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-1">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Talbiyah.ai</span>
              </div>
              <div className="text-left ml-8">
                <p className="text-xs text-slate-400 font-light italic">At Your Service</p>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">AI-POWERED ISLAMIC LEARNING</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <a href="#contact" className="hover:text-cyan-400 transition">Contact</a>
              <a href="#privacy" className="hover:text-cyan-400 transition">Privacy Policy</a>
              <a href="#terms" className="hover:text-cyan-400 transition">Terms of Service</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center text-slate-500 text-sm">
            <p>© 2025 Talbiyah.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showSignInModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-8 relative border border-slate-800">
            <button
              onClick={() => {
                setShowSignInModal(false);
                setAuthError('');
                setAuthForm({ email: '', password: '' });
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                  <BookOpen className="w-10 h-10 text-cyan-400 relative" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-slate-400">Sign in to continue your journey</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </div>
                </label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Password</span>
                  </div>
                </label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-end mb-2">
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
                      alert('Password reset email sent! Check your inbox.');
                    } catch (err: any) {
                      setAuthError(err.message || 'Failed to send reset email');
                    }
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center space-x-2"
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
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
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
