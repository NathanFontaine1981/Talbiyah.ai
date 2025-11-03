import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Users, Heart, CheckCircle2, Star, Shield, LogIn, LogOut, Play, ArrowRight, Sparkles, Target, Zap, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getDashboardRoute } from '../lib/authHelpers';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
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
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 hover:opacity-80 transition group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/30 transition"></div>
              <BookOpen className="w-7 h-7 text-cyan-400 relative" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Talbiyah.ai</span>
          </button>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate('/teachers')} className="text-slate-300 hover:text-white transition font-medium">Find a Teacher</button>
            <button onClick={() => navigate('/counselling')} className="text-slate-300 hover:text-white transition font-medium">Counselling</button>
            <button onClick={() => navigate('/matchmaking')} className="text-slate-300 hover:text-white transition font-medium">Matchmaking</button>

            {user ? (
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
              Talbiyah.ai is the <span className="text-white font-semibold">first Islamic learning hub</span> that uses AI to automatically create personalized study notes and quizzes from your live 1-to-1 lessons.
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
                  Select your subject: Qur'an with Understanding, Arabic Language, or Islamic Studies.
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
                  Join your live 1-to-1 session with a vetted teacher.
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
                  Receive your personalized Talbiyah Insights and quizzes immediately after class.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Track What Matters.</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Not Just Hours.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Our unique <span className="text-cyan-400 font-semibold">3-Stage Method</span> ensures you are truly mastering the Quran.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="mb-4">
                  <span className="text-cyan-400 font-bold text-sm">STAGE 1</span>
                  <h3 className="text-2xl font-bold text-white mt-2">Understanding</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Grasping the meaning and context of what you're learning.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="mb-4">
                  <span className="text-cyan-400 font-bold text-sm">STAGE 2</span>
                  <h3 className="text-2xl font-bold text-white mt-2">Fluency</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Mastering proper recitation with correct Tajweed rules.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 transition">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="mb-4">
                  <span className="text-cyan-400 font-bold text-sm">STAGE 3</span>
                  <h3 className="text-2xl font-bold text-white mt-2">Memorization</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Beginning Hifdh once the foundation is perfected.
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
                Every teacher on Talbiyah.ai is hand-picked, vetted, and monitored by our Supervisor team to ensure the highest quality of teaching.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Shield, label: 'Vetted', desc: 'Background checked' },
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
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Simple Pricing.</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">No Surprises.</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              No subscriptions. No hidden fees. You only pay for the lessons you book.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto items-center">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm p-10 rounded-2xl border border-slate-700/50 text-center">
                <div className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">£5-£20</div>
                <p className="text-slate-400 font-medium">Teacher Rate</p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <span className="text-3xl font-bold text-white">+</span>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition"></div>
              <div className="relative bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm p-10 rounded-2xl border border-cyan-500/50 text-center">
                <div className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">£10</div>
                <p className="text-slate-300 font-medium">Platform Fee</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-3 px-8 py-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <span className="text-2xl text-slate-400 font-bold">=</span>
              <span className="text-2xl font-bold text-white">Your Total Price</span>
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
            onClick={() => navigate('/teachers')}
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
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Talbiyah.ai</span>
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
