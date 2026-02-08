import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Compass, GraduationCap, ChevronRight, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ExploreProgress {
  highestStage: string;
  completedCount: number;
}

export default function ExplorerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [exploreProgress, setExploreProgress] = useState<ExploreProgress | null>(null);
  const [loading, setLoading] = useState(true);

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
          // If they're a student, redirect to regular dashboard
          if (profileData.roles?.includes('student')) {
            navigate('/dashboard');
            return;
          }
        }

        // Load explore progress from localStorage (will update to DB later)
        const savedProgress = localStorage.getItem('talbiyah_explore_progress');
        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
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
      // Update roles to include student
      const newRoles = [...(profile?.roles || []), 'student'].filter((v, i, a) => a.indexOf(v) === i);

      await supabase
        .from('profiles')
        .update({ roles: newRoles })
        .eq('id', user.id);

      // Navigate to welcome flow
      navigate('/welcome');
    } catch (error) {
      console.error('Error upgrading to student:', error);
    }
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
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Explorer'}
          </h2>
          <p className="text-slate-300 text-lg">
            Continue your journey of discovery
          </p>
        </motion.div>

        {/* Main Actions */}
        <div className="space-y-4 mb-12">
          {/* Exploring Islam */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/explore')}
            className="w-full group bg-gradient-to-r from-indigo-900/50 to-purple-900/30 hover:from-indigo-800/50 hover:to-purple-800/30 rounded-2xl p-6 border border-indigo-700/50 hover:border-indigo-600 transition-all text-left"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">Exploring Islam</h3>
                <p className="text-slate-300">
                  {exploreProgress && exploreProgress.completedCount > 0
                    ? `${exploreProgress.completedCount} of 13 episodes completed`
                    : 'A journey of discovery in 13 episodes'}
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </div>
            {exploreProgress && exploreProgress.completedCount > 0 && (
              <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${(exploreProgress.completedCount / 13) * 100}%` }}
                />
              </div>
            )}
          </motion.button>

          {/* Unshakeable Foundations */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/new-muslim')}
            className="w-full group bg-gradient-to-r from-emerald-900/50 to-teal-900/30 hover:from-emerald-800/50 hover:to-teal-800/30 rounded-2xl p-6 border border-emerald-700/50 hover:border-emerald-600 transition-all text-left"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">Unshakeable Foundations</h3>
                <p className="text-slate-300">
                  Build your Islamic knowledge from the ground up
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>

        {/* Upgrade CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
