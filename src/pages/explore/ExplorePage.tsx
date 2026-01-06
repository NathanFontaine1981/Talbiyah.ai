import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Play, CheckCircle2, ChevronRight, BookOpen,
  Sparkles, Eye, ScrollText, Microscope, BarChart3,
  Dices, PauseCircle, HelpCircle, MessageSquare,
  Handshake, Clock, Lightbulb, Footprints
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import ExploreIntro from '../../components/explore/ExploreIntro';
import BiasBlur from '../../components/explore/BiasBlur';
import ChainOfCustody from '../../components/explore/ChainOfCustody';
import AxiomCheck from '../../components/explore/AxiomCheck';
import AuthorityMatch from '../../components/explore/AuthorityMatch';
import ProbabilityMoment from '../../components/explore/ProbabilityMoment';
import ConvictionCheckpoint from '../../components/explore/ConvictionCheckpoint';
import TheQuestion from '../../components/explore/TheQuestion';
import TheReconciliation from '../../components/explore/TheReconciliation';
import ProphetTimeline from '../../components/explore/ProphetTimeline';
import CheatCodes from '../../components/explore/CheatCodes';
import TheFirstStep from '../../components/explore/TheFirstStep';
import TheVoice from '../../components/explore/TheVoice';
import ExploreProgressBar from '../../components/explore/ExploreProgressBar';

const STORAGE_KEY = 'talbiyah_explore_progress';

// Stage order for the Explore journey (The Almanac)
// 0. Menu - Episode overview showing all sections
// 1. Intro - Personal introduction, what I discovered
// 2. BiasBlur - Acknowledge biases before exploring
// 3. ChainOfCustody - Document analysis: Bible vs Quran preservation
// 4. AxiomCheck - Present undeniable facts user already accepts (The Data)
// 5. AuthorityMatch - Show Quran verses matching agreed facts (Past Scores)
// 6. ProbabilityMoment - Visual probability dropping, forced pause
// 7. Checkpoint - Ask if convinced, offer to show more evidence
// 8. TheQuestion - Ask where they think the knowledge came from
// 9. TheVoice - The Quran's divine voice and the choice
// 10. TheReconciliation - Explain how all Abrahamic religions are one
// 11. ProphetTimeline - Visual timeline of prophets and their eras
// 12. CheatCodes - Life guidance from the Quran (Cheat Codes)
// 13. TheFirstStep - Soft shahada (Tawhid) and next steps
type FlowStage = 'menu' | 'intro' | 'bias' | 'chain-of-custody' | 'axiom-check' | 'authority-match' | 'probability-moment' | 'checkpoint' | 'the-question' | 'the-voice' | 'reconciliation' | 'prophet-timeline' | 'cheat-codes' | 'first-step';

// Order of stages for navigation (menu is separate, not in the flow)
const STAGE_ORDER: FlowStage[] = ['intro', 'bias', 'chain-of-custody', 'axiom-check', 'authority-match', 'probability-moment', 'checkpoint', 'the-question', 'the-voice', 'reconciliation', 'prophet-timeline', 'cheat-codes', 'first-step'];

// Episode definitions for the menu
interface Episode {
  id: FlowStage;
  episode: number;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
}

const EPISODES: Episode[] = [
  { id: 'intro', episode: 1, title: 'The Beginning', description: 'A personal journey of discovery', duration: '3 min', icon: <Sparkles className="w-6 h-6" />, color: 'amber' },
  { id: 'bias', episode: 2, title: 'Clear Vision', description: 'Acknowledge biases before exploring truth', duration: '2 min', icon: <Eye className="w-6 h-6" />, color: 'purple' },
  { id: 'chain-of-custody', episode: 3, title: 'Chain of Custody', description: 'Examining how scriptures were preserved', duration: '5 min', icon: <ScrollText className="w-6 h-6" />, color: 'orange' },
  { id: 'axiom-check', episode: 4, title: 'The Data', description: 'Facts we can all agree on', duration: '4 min', icon: <Microscope className="w-6 h-6" />, color: 'cyan' },
  { id: 'authority-match', episode: 5, title: 'Past Scores', description: 'Ancient texts meet modern knowledge', duration: '5 min', icon: <BarChart3 className="w-6 h-6" />, color: 'emerald' },
  { id: 'probability-moment', episode: 6, title: 'The Odds', description: 'What are the chances?', duration: '3 min', icon: <Dices className="w-6 h-6" />, color: 'pink' },
  { id: 'checkpoint', episode: 7, title: 'Checkpoint', description: 'A moment to reflect', duration: '2 min', icon: <PauseCircle className="w-6 h-6" />, color: 'slate' },
  { id: 'the-question', episode: 8, title: 'The Question', description: 'Where did this knowledge come from?', duration: '3 min', icon: <HelpCircle className="w-6 h-6" />, color: 'violet' },
  { id: 'the-voice', episode: 9, title: 'The Voice', description: 'Who is speaking in the Quran?', duration: '4 min', icon: <MessageSquare className="w-6 h-6" />, color: 'sky' },
  { id: 'reconciliation', episode: 10, title: 'One Message', description: 'The connection between all faiths', duration: '4 min', icon: <Handshake className="w-6 h-6" />, color: 'teal' },
  { id: 'prophet-timeline', episode: 11, title: 'The Timeline', description: 'Journey through prophetic history', duration: '5 min', icon: <Clock className="w-6 h-6" />, color: 'indigo' },
  { id: 'cheat-codes', episode: 12, title: 'Life Guidance', description: 'Practical wisdom for daily life', duration: '5 min', icon: <Lightbulb className="w-6 h-6" />, color: 'yellow' },
  { id: 'first-step', episode: 13, title: 'The First Step', description: 'Where do we go from here?', duration: '3 min', icon: <Footprints className="w-6 h-6" />, color: 'emerald' },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [flowStage, setFlowStage] = useState<FlowStage>('menu');
  const [highestStageReached, setHighestStageReached] = useState<FlowStage>('intro');
  const [agreedAxioms, setAgreedAxioms] = useState<string[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [beliefChoice, setBeliefChoice] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Load progress from database (if logged in) or localStorage
  useEffect(() => {
    const loadProgress = async () => {
      // Check for user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // If logged in, try to load from database first
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('explore_progress')
            .eq('id', session.user.id)
            .single();

          if (profile?.explore_progress && Object.keys(profile.explore_progress).length > 0) {
            const { highestStage, axioms, verified, belief } = profile.explore_progress;
            if (highestStage) setHighestStageReached(highestStage);
            if (axioms) setAgreedAxioms(axioms);
            if (verified) setVerifiedCount(verified);
            if (belief) setBeliefChoice(belief);
            return; // Don't fall through to localStorage
          }
        } catch (e) {
          console.error('Error loading progress from database:', e);
        }
      }

      // Fallback: load from localStorage (for anonymous users or if DB load failed)
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { highestStage, axioms, verified, belief } = JSON.parse(saved);
          // Always start at menu - let user choose where to go
          if (highestStage) setHighestStageReached(highestStage);
          if (axioms) setAgreedAxioms(axioms);
          if (verified) setVerifiedCount(verified);
          if (belief) setBeliefChoice(belief);
        } catch (e) {
          console.error('Error loading progress:', e);
        }
      }
    };
    loadProgress();
  }, []);

  // Save progress to localStorage and database (if logged in)
  useEffect(() => {
    if (flowStage !== 'menu' && flowStage !== 'intro') {
      const progressData = {
        stage: flowStage,
        highestStage: highestStageReached,
        axioms: agreedAxioms,
        verified: verifiedCount,
        belief: beliefChoice
      };

      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));

      // If logged in, also save to database
      if (user) {
        supabase
          .from('profiles')
          .update({ explore_progress: progressData })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) console.error('Error saving progress to database:', error);
          });
      }
    }
  }, [flowStage, highestStageReached, agreedAxioms, verifiedCount, beliefChoice, user]);

  // Helper to advance to a stage (updates highest if needed)
  const advanceToStage = (newStage: FlowStage) => {
    const newIndex = STAGE_ORDER.indexOf(newStage);
    const highestIndex = STAGE_ORDER.indexOf(highestStageReached);

    if (newIndex > highestIndex) {
      setHighestStageReached(newStage);
    }
    setFlowStage(newStage);
  };

  // Handler for progress bar clicks
  const handleProgressBarClick = (stage: FlowStage) => {
    setFlowStage(stage);
  };

  // Stage handlers
  const handleIntroComplete = () => {
    advanceToStage('bias');
  };

  const handleBiasComplete = () => {
    advanceToStage('chain-of-custody');
  };

  const handleChainOfCustodyComplete = () => {
    advanceToStage('axiom-check');
  };

  const handleChainOfCustodyBack = () => {
    setFlowStage('bias');
  };

  const handleAxiomCheckComplete = (axioms: string[]) => {
    setAgreedAxioms(axioms);
    setVerifiedCount(axioms.length);
    advanceToStage('authority-match');
  };

  const handleAuthorityMatchComplete = () => {
    advanceToStage('probability-moment');
  };

  const handleProbabilityMomentComplete = () => {
    advanceToStage('checkpoint');
  };

  const handleCheckpointConvinced = () => {
    // Fast track - they're convinced, skip to reconciliation
    advanceToStage('reconciliation');
  };

  const handleCheckpointShowMore = () => {
    // Continue the full journey
    advanceToStage('the-question');
  };

  const handleQuestionComplete = (belief: string) => {
    setBeliefChoice(belief);
    advanceToStage('the-voice');
  };

  const handleVoiceComplete = () => {
    advanceToStage('reconciliation');
  };

  const handleReconciliationComplete = () => {
    advanceToStage('prophet-timeline');
  };

  const handleProphetTimelineComplete = () => {
    advanceToStage('cheat-codes');
  };

  const handleCheatCodesComplete = () => {
    advanceToStage('first-step');
  };

  const handleFirstStepTakeStep = () => {
    // Return to dashboard
    localStorage.removeItem(STORAGE_KEY);
    markExploreCompleted();
    navigate('/dashboard');
  };

  const handleFirstStepNeedMoreTime = () => {
    // Go to practical guidance (cheat codes)
    setFlowStage('cheat-codes');
  };

  const handleFirstStepLearnMore = () => {
    // Go to new-muslim curriculum
    localStorage.removeItem(STORAGE_KEY);
    markExploreCompleted();
    navigate('/new-muslim');
  };

  // Mark explore as completed in profile if user is logged in
  const markExploreCompleted = async () => {
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ explore_completed: true })
          .eq('id', user.id);
      } catch (e) {
        console.error('Error marking explore completed:', e);
      }
    }
  };

  // Common nav component with progress bar
  const NavWithProgress = ({ showProgress = true }: { showProgress?: boolean }) => (
    <>
      {showProgress && (
        <ExploreProgressBar
          currentStage={flowStage}
          highestStageReached={highestStageReached}
          onStageClick={handleProgressBarClick}
        />
      )}
      {/* Back to episodes button */}
      <button
        onClick={() => setFlowStage('menu')}
        className={`fixed ${showProgress ? 'top-20 md:top-4' : 'top-6'} left-6 text-slate-400 hover:text-white transition z-50 flex items-center gap-2 text-sm`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="hidden md:inline">Episodes</span>
      </button>
      <button
        onClick={() => navigate('/')}
        className={`fixed ${showProgress ? 'top-20 md:top-4' : 'top-6'} right-6 text-slate-400 hover:text-white transition z-50`}
      >
        <X className="w-6 h-6" />
      </button>
    </>
  );

  // All episodes are accessible - users can explore freely
  const isEpisodeAccessible = (_episodeId: FlowStage) => {
    return true; // All episodes unlocked for free exploration
  };

  // Helper to check if an episode is completed
  const isEpisodeCompleted = (episodeId: FlowStage) => {
    const episodeIndex = STAGE_ORDER.indexOf(episodeId);
    const highestIndex = STAGE_ORDER.indexOf(highestStageReached);
    return episodeIndex < highestIndex;
  };

  // Get the next episode to continue from
  const getNextEpisode = () => {
    return highestStageReached;
  };

  // Menu: Episode Overview
  if (flowStage === 'menu') {
    const totalDuration = EPISODES.reduce((acc, ep) => acc + parseInt(ep.duration), 0);
    const completedCount = EPISODES.filter(ep => isEpisodeCompleted(ep.id)).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        {/* Close button */}
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-lg shadow-emerald-900/30"
            >
              <img
                src="/qurancourse.jpg"
                alt="Quran"
                className="w-full h-full object-cover rounded-xl"
              />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Exploring Islam
            </h1>
            <p className="text-slate-300 text-lg mb-2">
              A journey of discovery in {EPISODES.length} episodes
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-4 h-4" />
                ~{totalDuration} min
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Take breaks anytime</span>
            </div>
          </motion.div>

          {/* Progress summary */}
          {completedCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-xl text-center"
            >
              <p className="text-emerald-300">
                {completedCount} of {EPISODES.length} episodes completed
              </p>
              <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(completedCount / EPISODES.length) * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* Continue button if progress exists */}
          {highestStageReached !== 'intro' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <button
                onClick={() => setFlowStage(getNextEpisode())}
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl transition-all group shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Play className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-lg block">Continue Journey</span>
                    <span className="text-amber-100/80 text-sm">Pick up where you left off</span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* Episodes heading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6 mt-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white">Episodes</h2>
          </motion.div>

          {/* Episode list */}
          <div className="space-y-3">
            {EPISODES.map((episode, index) => {
              const isCompleted = isEpisodeCompleted(episode.id);
              const isCurrent = episode.id === highestStageReached;

              // Dynamic color classes based on episode color
              const getIconColorClass = () => {
                if (isCompleted) return 'text-emerald-400';
                const colorMap: Record<string, string> = {
                  amber: 'text-amber-400',
                  purple: 'text-purple-400',
                  orange: 'text-orange-400',
                  cyan: 'text-cyan-400',
                  emerald: 'text-emerald-400',
                  pink: 'text-pink-400',
                  slate: 'text-slate-400',
                  violet: 'text-violet-400',
                  sky: 'text-sky-400',
                  teal: 'text-teal-400',
                  indigo: 'text-indigo-400',
                  yellow: 'text-yellow-400',
                };
                return colorMap[episode.color] || 'text-slate-400';
              };

              const getIconBgClass = () => {
                if (isCompleted) return 'bg-emerald-900/50 border-emerald-700/30';
                if (isCurrent) return 'bg-amber-900/50 border-amber-600/30';
                const colorMap: Record<string, string> = {
                  amber: 'bg-amber-900/30 border-amber-700/20',
                  purple: 'bg-purple-900/30 border-purple-700/20',
                  orange: 'bg-orange-900/30 border-orange-700/20',
                  cyan: 'bg-cyan-900/30 border-cyan-700/20',
                  emerald: 'bg-emerald-900/30 border-emerald-700/20',
                  pink: 'bg-pink-900/30 border-pink-700/20',
                  slate: 'bg-slate-800/50 border-slate-700/20',
                  violet: 'bg-violet-900/30 border-violet-700/20',
                  sky: 'bg-sky-900/30 border-sky-700/20',
                  teal: 'bg-teal-900/30 border-teal-700/20',
                  indigo: 'bg-indigo-900/30 border-indigo-700/20',
                  yellow: 'bg-yellow-900/30 border-yellow-700/20',
                };
                return colorMap[episode.color] || 'bg-slate-800/50 border-slate-700/20';
              };

              return (
                <motion.button
                  key={episode.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setFlowStage(episode.id)}
                  className={`group w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left hover:scale-[1.01] ${
                    isCompleted
                      ? 'bg-emerald-900/20 border-emerald-700/30 hover:border-emerald-600/50 hover:bg-emerald-900/30'
                      : isCurrent
                        ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/20 border-amber-600/50 hover:border-amber-500 shadow-lg shadow-amber-900/20'
                        : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Episode icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110 ${getIconBgClass()}`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <div className={getIconColorClass()}>
                        {episode.icon}
                      </div>
                    )}
                  </div>

                  {/* Episode info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        isCompleted ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        Episode {episode.episode}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{episode.duration}</span>
                    </div>
                    <h3 className="font-semibold text-white text-lg mb-0.5">
                      {episode.title}
                    </h3>
                    <p className="text-sm text-slate-300">
                      {episode.description}
                    </p>
                  </div>

                  {/* Action indicator */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all group-hover:translate-x-1 ${
                    isCompleted
                      ? 'bg-emerald-800/30'
                      : isCurrent
                        ? 'bg-amber-800/30'
                        : 'bg-slate-800/50'
                  }`}>
                    <ChevronRight className={`w-5 h-5 ${
                      isCompleted ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-slate-500'
                    }`} />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Start button if no progress */}
          {highestStageReached === 'intro' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-10 text-center"
            >
              <button
                onClick={() => setFlowStage('intro')}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full font-semibold text-lg transition-all shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 hover:scale-105"
              >
                <Play className="w-6 h-6" />
                Start the Journey
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* Sign up prompt - only show if not logged in */}
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-10 p-6 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/30 rounded-2xl"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-amber-200 mb-2">
                  Save Your Progress
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  Create a free account to save your progress and continue your journey anytime.
                  Your progress is currently only saved on this device.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/signup?type=explorer')}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
                  >
                    Already have an account?
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info about what this journey is */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8 text-center text-slate-400 text-sm"
          >
            <p>
              Best experienced in order. Take your time with each episode.
            </p>
            <p className="mt-1">
              No commitment required - just curiosity.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Stage 1: Introduction (no progress bar yet)
  if (flowStage === 'intro') {
    return (
      <div className="relative">
        <NavWithProgress showProgress={false} />
        <ExploreIntro onComplete={handleIntroComplete} />
      </div>
    );
  }

  // Stage 1: Bias Blur
  if (flowStage === 'bias') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <BiasBlur onComplete={handleBiasComplete} />
        </div>
      </div>
    );
  }

  // Stage 2: Chain of Custody - Document analysis (Bible vs Quran preservation)
  if (flowStage === 'chain-of-custody') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <ChainOfCustody
            onComplete={handleChainOfCustodyComplete}
            onBack={handleChainOfCustodyBack}
          />
        </div>
      </div>
    );
  }

  // Stage 3: Axiom Check - Present undeniable facts (The Data)
  if (flowStage === 'axiom-check') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <AxiomCheck onComplete={handleAxiomCheckComplete} />
        </div>
      </div>
    );
  }

  // Stage 3: Authority Match - Show Quran verses matching agreed facts (Past Scores)
  if (flowStage === 'authority-match') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <AuthorityMatch
            agreedAxioms={agreedAxioms}
            onComplete={handleAuthorityMatchComplete}
          />
        </div>
      </div>
    );
  }

  // Stage 4: Probability Moment - Visual probability dropping, forced pause
  if (flowStage === 'probability-moment') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <ProbabilityMoment
            verifiedCount={verifiedCount}
            onComplete={handleProbabilityMomentComplete}
          />
        </div>
      </div>
    );
  }

  // Stage 5: Checkpoint - Ask if convinced, offer to show more evidence
  if (flowStage === 'checkpoint') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <ConvictionCheckpoint
            verifiedCount={verifiedCount}
            onConvinced={handleCheckpointConvinced}
            onShowMore={handleCheckpointShowMore}
          />
        </div>
      </div>
    );
  }

  // Stage 6: The Question - Ask where they think the knowledge came from
  if (flowStage === 'the-question') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheQuestion
            verifiedCount={verifiedCount}
            totalFacts={agreedAxioms.length}
            onComplete={handleQuestionComplete}
          />
        </div>
      </div>
    );
  }

  // Stage 7: The Voice - The Quran's divine voice and the choice
  if (flowStage === 'the-voice') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheVoice
            onComplete={handleVoiceComplete}
            onBack={() => setFlowStage('the-question')}
          />
        </div>
      </div>
    );
  }

  // Stage 8: The Reconciliation - Explain how all Abrahamic religions are one
  if (flowStage === 'reconciliation') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheReconciliation onComplete={handleReconciliationComplete} />
        </div>
      </div>
    );
  }

  // Stage 8: Prophet Timeline - Visual timeline of prophets and their eras
  if (flowStage === 'prophet-timeline') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <ProphetTimeline
            onComplete={handleProphetTimelineComplete}
            onBack={() => setFlowStage('reconciliation')}
          />
        </div>
      </div>
    );
  }

  // Stage 9: Cheat Codes - Life guidance from the Quran
  if (flowStage === 'cheat-codes') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <CheatCodes
            verifiedCount={verifiedCount}
            totalFacts={agreedAxioms.length}
            onComplete={handleCheatCodesComplete}
          />
        </div>
      </div>
    );
  }

  // Stage 9: The First Step - Soft shahada (Tawhid) and next steps
  if (flowStage === 'first-step') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheFirstStep
            onTakeStep={handleFirstStepTakeStep}
            onNeedMoreTime={handleFirstStepNeedMoreTime}
            onLearnMore={handleFirstStepLearnMore}
          />
        </div>
      </div>
    );
  }

  return null;
}
