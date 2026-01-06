import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
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
  icon: string;
}

const EPISODES: Episode[] = [
  { id: 'intro', episode: 1, title: 'The Beginning', description: 'A personal journey of discovery', duration: '3 min', icon: '🌟' },
  { id: 'bias', episode: 2, title: 'Clear Vision', description: 'Acknowledge biases before exploring truth', duration: '2 min', icon: '👁️' },
  { id: 'chain-of-custody', episode: 3, title: 'Chain of Custody', description: 'Examining how scriptures were preserved', duration: '5 min', icon: '📜' },
  { id: 'axiom-check', episode: 4, title: 'The Data', description: 'Facts we can all agree on', duration: '4 min', icon: '🔬' },
  { id: 'authority-match', episode: 5, title: 'Past Scores', description: 'Ancient texts meet modern knowledge', duration: '5 min', icon: '📊' },
  { id: 'probability-moment', episode: 6, title: 'The Odds', description: 'What are the chances?', duration: '3 min', icon: '🎲' },
  { id: 'checkpoint', episode: 7, title: 'Checkpoint', description: 'A moment to reflect', duration: '2 min', icon: '⏸️' },
  { id: 'the-question', episode: 8, title: 'The Question', description: 'Where did this knowledge come from?', duration: '3 min', icon: '❓' },
  { id: 'the-voice', episode: 9, title: 'The Voice', description: 'Who is speaking in the Quran?', duration: '4 min', icon: '🗣️' },
  { id: 'reconciliation', episode: 10, title: 'One Message', description: 'The connection between all faiths', duration: '4 min', icon: '🤝' },
  { id: 'prophet-timeline', episode: 11, title: 'The Timeline', description: 'Journey through prophetic history', duration: '5 min', icon: '📅' },
  { id: 'cheat-codes', episode: 12, title: 'Life Guidance', description: 'Practical wisdom for daily life', duration: '5 min', icon: '💡' },
  { id: 'first-step', episode: 13, title: 'The First Step', description: 'Where do we go from here?', duration: '3 min', icon: '🚶' },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [flowStage, setFlowStage] = useState<FlowStage>('menu');
  const [highestStageReached, setHighestStageReached] = useState<FlowStage>('intro');
  const [agreedAxioms, setAgreedAxioms] = useState<string[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [beliefChoice, setBeliefChoice] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Load progress from localStorage
  useEffect(() => {
    const loadProgress = async () => {
      // Check for user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Try to load from localStorage first
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { stage, highestStage, axioms, verified, belief } = JSON.parse(saved);
          if (stage) setFlowStage(stage);
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

  // Save progress to localStorage
  useEffect(() => {
    if (flowStage !== 'menu' && flowStage !== 'intro') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stage: flowStage,
        highestStage: highestStageReached,
        axioms: agreedAxioms,
        verified: verifiedCount,
        belief: beliefChoice
      }));
    }
  }, [flowStage, highestStageReached, agreedAxioms, verifiedCount, beliefChoice]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
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
            className="text-center mb-10"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Exploring Islam
            </h1>
            <p className="text-slate-400 text-lg">
              A journey of discovery in {EPISODES.length} episodes
            </p>
            <p className="text-slate-500 text-sm mt-2">
              ~{totalDuration} minutes total • Take breaks anytime
            </p>
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
                className="w-full flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition group"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5" />
                  <span className="font-medium">Continue where you left off</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* Episode list */}
          <div className="space-y-3">
            {EPISODES.map((episode, index) => {
              const isCompleted = isEpisodeCompleted(episode.id);
              const isCurrent = episode.id === highestStageReached;

              return (
                <motion.button
                  key={episode.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setFlowStage(episode.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition text-left ${
                    isCompleted
                      ? 'bg-emerald-900/20 border-emerald-700/30 hover:border-emerald-600/50'
                      : isCurrent
                        ? 'bg-indigo-900/30 border-indigo-600/50 hover:border-indigo-500'
                        : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {/* Episode icon/number */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-800/50'
                      : isCurrent
                        ? 'bg-indigo-800/50'
                        : 'bg-slate-800/50'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <span className="text-2xl">{episode.icon}</span>
                    )}
                  </div>

                  {/* Episode info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${
                        isCompleted ? 'text-emerald-400' : isCurrent ? 'text-indigo-400' : 'text-slate-500'
                      }`}>
                        Episode {episode.episode}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-500">{episode.duration}</span>
                    </div>
                    <h3 className="font-medium text-white">
                      {episode.title}
                    </h3>
                    <p className="text-sm truncate text-slate-400">
                      {episode.description}
                    </p>
                  </div>

                  {/* Action indicator */}
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                    isCompleted ? 'text-emerald-500' : isCurrent ? 'text-indigo-400' : 'text-slate-500'
                  }`} />
                </motion.button>
              );
            })}
          </div>

          {/* Start button if no progress */}
          {highestStageReached === 'intro' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => setFlowStage('intro')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition"
              >
                <Play className="w-5 h-5" />
                Start the Journey
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
                <p className="text-slate-400 text-sm mb-4">
                  Create a free account to save your progress and continue your journey anytime.
                  Your progress is currently only saved on this device.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/register?type=explorer')}
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
            className="mt-8 text-center text-slate-500 text-sm"
          >
            <p>
              Explore at your own pace. Choose any episode that interests you.
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
