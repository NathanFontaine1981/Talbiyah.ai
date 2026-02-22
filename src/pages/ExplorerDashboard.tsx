import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Compass, GraduationCap, ChevronRight, ChevronDown, LogOut, Moon, Layers } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ExploreProgress {
  highestStage: string;
  completedCount: number;
}

interface SalahProgress {
  completedPositions: string[];
}

interface FoundationProgress {
  watchedVideos: string[];
}

const METHODOLOGY_PRINCIPLES = [
  {
    title: 'Knowledge needs structure',
    body: "We learn Islam from the Qur'an & Sunnah, through the understanding of the Prophet \u03C6, his companions, and the two generations after them (the Salaf). This isn't one opinion among many \u2014 it's the methodology the Prophet \u03C6 himself endorsed.",
  },
  {
    title: 'The Prophet \u03C6 is the living example',
    body: "He is the most documented person in history. Hadith science uses strict chain-of-narration verification and authenticity grading \u2014 every statement traced back link by link, narrator by narrator.",
  },
  {
    title: 'The golden rule in dunya',
    body: "Everything in worldly life is halal (permissible) except what Allah has made haram. Eat, drink, do anything \u2014 except what\u2019s been explicitly prohibited.",
  },
  {
    title: 'Worship is the opposite',
    body: "Every act of worship is haram unless prescribed by Qur'an or Sunnah. Nothing counts on your scales unless it has evidence. Find proof for everything you do \u2014 it\u2019s easy to fall into customs and culture thinking it\u2019s religion.",
  },
  {
    title: 'Beware of innovation',
    body: '\u201CBeware of newly invented matters in the religion, every innovation is misguidance and every misguidance is in the Fire.\u201D \u2014 the imam\u2019s Friday reminder (Sahih Muslim 867)',
  },
];

const JOURNEY_STEPS = [
  {
    step: 1,
    title: 'Exploring Islam',
    subtitle: 'The proof',
    description: 'The proofs and evidences \u2014 remind yourself or show others',
    route: '/explore',
    icon: BookOpen,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    border: 'border-indigo-700/50 hover:border-indigo-600',
    bg: 'from-indigo-900/50 to-purple-900/30 hover:from-indigo-800/50 hover:to-purple-800/30',
    badge: 'bg-indigo-500',
    chevron: 'text-indigo-400',
    bar: 'from-indigo-500 to-purple-500',
    totalItems: 13,
    unit: 'episodes',
  },
  {
    step: 2,
    title: 'Learn Salah',
    subtitle: 'The rope to Allah',
    description: 'The rope between you and Allah \u2014 build up to 5 daily prayers',
    route: '/salah',
    icon: Moon,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-700/50 hover:border-emerald-600',
    bg: 'from-emerald-900/50 to-teal-900/30 hover:from-emerald-800/50 hover:to-teal-800/30',
    badge: 'bg-emerald-500',
    chevron: 'text-emerald-400',
    bar: 'from-emerald-500 to-teal-500',
    totalItems: 24,
    unit: 'positions',
  },
  {
    step: 3,
    title: 'Unshakable Foundations',
    subtitle: 'Built on firm ground',
    description: 'Like a house built on firm ground \u2014 takes the longest, holds everything up',
    route: '/new-muslim',
    icon: Layers,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    border: 'border-amber-700/50 hover:border-amber-600',
    bg: 'from-amber-900/50 to-orange-900/30 hover:from-amber-800/50 hover:to-orange-800/30',
    badge: 'bg-amber-500',
    chevron: 'text-amber-400',
    bar: 'from-amber-500 to-orange-500',
    totalItems: 0, // dynamic from localStorage
    unit: 'videos',
  },
];

export default function ExplorerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [exploreProgress, setExploreProgress] = useState<ExploreProgress | null>(null);
  const [salahProgress, setSalahProgress] = useState<SalahProgress | null>(null);
  const [foundationProgress, setFoundationProgress] = useState<FoundationProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/');
        return;
      }

      setUser(session.user);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Check if user is actually an explorer
        if (!profileData.roles?.includes('explorer')) {
          if (profileData.roles?.includes('student')) {
            navigate('/dashboard');
            return;
          }
        }

        // Load explore progress
        const savedExplore = localStorage.getItem('talbiyah_explore_progress');
        if (savedExplore) {
          try {
            const parsed = JSON.parse(savedExplore);
            const stageOrder = ['intro', 'bias', 'chain-of-custody', 'axiom-check', 'authority-match', 'probability-moment', 'checkpoint', 'the-question', 'the-voice', 'reconciliation', 'prophet-timeline', 'cheat-codes', 'first-step'];
            const highestIndex = stageOrder.indexOf(parsed.highestStage || 'intro');
            setExploreProgress({
              highestStage: parsed.highestStage || 'intro',
              completedCount: highestIndex
            });
          } catch (e) {
            console.error('Error parsing explore progress:', e);
          }
        }

        // Load salah progress
        const savedSalah = localStorage.getItem('talbiyah_salah_progress');
        if (savedSalah) {
          try {
            const parsed = JSON.parse(savedSalah);
            setSalahProgress({
              completedPositions: parsed.completedPositions || []
            });
          } catch (e) {
            console.error('Error parsing salah progress:', e);
          }
        }

        // Load foundation progress
        const savedFoundation = localStorage.getItem('talbiyah_foundation_progress');
        if (savedFoundation) {
          try {
            const parsed = JSON.parse(savedFoundation);
            setFoundationProgress({
              watchedVideos: parsed.watchedVideos || []
            });
          } catch (e) {
            console.error('Error parsing foundation progress:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  async function handleUpgradeToStudent() {
    if (!user) return;

    try {
      const newRoles = [...(profile?.roles || []), 'student'].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

      await supabase
        .from('profiles')
        .update({ roles: newRoles })
        .eq('id', user.id);

      navigate('/welcome');
    } catch (error) {
      console.error('Error upgrading to student:', error);
    }
  }

  function getStepProgress(step: number): { completed: number; total: number } | null {
    if (step === 1) {
      if (!exploreProgress || exploreProgress.completedCount === 0) return null;
      return { completed: exploreProgress.completedCount, total: 13 };
    }
    if (step === 2) {
      if (!salahProgress || salahProgress.completedPositions.length === 0) return null;
      return { completed: salahProgress.completedPositions.length, total: 24 };
    }
    if (step === 3) {
      if (!foundationProgress || foundationProgress.watchedVideos.length === 0) return null;
      return { completed: foundationProgress.watchedVideos.length, total: foundationProgress.watchedVideos.length }; // total is dynamic
    }
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-indigo-500 focus:text-white focus:rounded-lg"
      >
        Skip to dashboard content
      </a>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Explorer</h1>
              <p className="text-slate-400 text-sm">{profile?.full_name || 'Welcome'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Explorer'}
          </h2>
          <p className="text-slate-400 text-lg">
            Follow the steps below &mdash; each builds on the last
          </p>
        </motion.div>

        {/* Methodology Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <button
            onClick={() => setMethodologyOpen(!methodologyOpen)}
            className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900/80 rounded-2xl border border-slate-700/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-slate-300" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-sm">Our Methodology</h3>
                <p className="text-slate-500 text-xs">Qur'an & Sunnah upon the understanding of the Salaf</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: methodologyOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {methodologyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  {METHODOLOGY_PRINCIPLES.map((principle, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/50"
                    >
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <h4 className="text-white font-medium text-sm mb-1">{principle.title}</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">{principle.body}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Journey Steps */}
        <div className="space-y-4 mb-12">
          {JOURNEY_STEPS.map((step, i) => {
            const Icon = step.icon;
            const progress = getStepProgress(step.step);

            return (
              <motion.button
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onClick={() => navigate(step.route)}
                className={`w-full group bg-gradient-to-r ${step.bg} rounded-2xl p-6 border ${step.border} transition-all text-left relative`}
              >
                {/* Step badge */}
                <div className={`absolute -top-2.5 left-5 ${step.badge} text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-lg`}>
                  Step {step.step}
                </div>

                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white mb-0.5">
                      {step.title}
                    </h3>
                    <p className="text-slate-500 text-sm italic mb-1">{step.subtitle}</p>
                    <p className="text-slate-300 text-sm">
                      {progress
                        ? `${progress.completed} of ${progress.total} ${step.unit} completed`
                        : step.description}
                    </p>
                  </div>
                  <ChevronRight className={`w-6 h-6 ${step.chevron} group-hover:translate-x-1 transition-transform flex-shrink-0`} />
                </div>

                {progress && (
                  <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${step.bar} rounded-full transition-all`}
                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Quran in English — Spotify recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <a
            href="https://open.spotify.com/playlist/320rmq3WLWuetaWh1mdRIq"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-r from-emerald-900/40 to-teal-900/30 hover:from-emerald-800/40 hover:to-teal-800/30 rounded-2xl p-6 border border-emerald-700/40 hover:border-emerald-600 transition-all group"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-white mb-1">
                  Listen to the Qur'an in English
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                  While you're still learning Arabic, listening to the Qur'an in English helps you understand Allah's words and connect with their meaning. Start here — the Arabic will come with time, in shaa Allah.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  Open on Spotify
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </a>
        </motion.div>

        {/* Upgrade CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 rounded-2xl p-8 border border-amber-700/30 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Ready to Learn More?</h3>
          <p className="text-slate-300 mb-6 max-w-md mx-auto">
            Become a student to access personalized Quran and Arabic lessons with expert tutors.
          </p>
          <button
            onClick={handleUpgradeToStudent}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-amber-900/30"
          >
            <GraduationCap className="w-5 h-5" />
            Become a Student
          </button>
        </motion.div>
      </main>
    </div>
  );
}
