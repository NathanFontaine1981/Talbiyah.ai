import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Play, CheckCircle2, ChevronRight, BookOpen,
  Sparkles, Eye, ScrollText, Map,
  Handshake, Clock, Footprints, Scale, Heart, Globe, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import ExploreIntro from '../../components/explore/ExploreIntro';
import BiasBlur from '../../components/explore/BiasBlur';
import ChainOfCustody from '../../components/explore/ChainOfCustody';
import QuranWalkthrough from '../../components/explore/QuranWalkthrough';
import QuranWalkthroughLight from '../../components/explore/QuranWalkthroughLight';
import TheVoice from '../../components/explore/TheVoice';
import TheNames from '../../components/explore/TheNames';
import TheMercy from '../../components/explore/TheMercy';
import TheReconciliation from '../../components/explore/TheReconciliation';
import ProphetTimeline from '../../components/explore/ProphetTimeline';
import TheFirstStep from '../../components/explore/TheFirstStep';
import ExploreProgressBar from '../../components/explore/ExploreProgressBar';
import ChapterIntro from '../../components/explore/ChapterIntro';
import ChapterComplete from '../../components/explore/ChapterComplete';

const STORAGE_KEY = 'talbiyah_explore_progress';

// Stage order for the Explore journey - organized into 3 chapters
//
// Chapter 1: Open Mind - ~20 min
// - Intro - Reasoning, foundation truths, logic to Creator, court session (12 scenes)
// - BiasBlur - Where I started and why I looked further
// - ChainOfCustody - Document analysis: Bible vs Quran preservation
//
// Chapter 2: The Walkthrough - ~60 min (3 episodes)
// - QuranWalkthrough - Follow the Quran's narrative with inline evidence (31 scenes)
//
// Chapter 3: The Full Picture - ~20 min
// - TheVoice - How the Quran speaks, the declaration, the preservation promise
// - TheReconciliation - One message, why different religions, the invitation
// - ProphetTimeline - Visual timeline of prophets and their eras
// - TheNames - Allah/Alaha/Jesus/Isa linguistic connections, 23-year revelation
// - TheMercy - Mercy + reality of death
// - TheFirstStep - Shahada and next steps

type FlowStage =
  | 'menu'
  | 'chapter-1-intro' | 'intro' | 'bias' | 'chain-of-custody' | 'chapter-1-complete'
  | 'chapter-2-intro' | 'walkthrough-light' | 'walkthrough' | 'chapter-2-complete'
  | 'chapter-3-intro' | 'the-voice' | 'reconciliation' | 'prophet-timeline'
  | 'the-names' | 'the-mercy' | 'first-step';

// Order of stages for navigation (menu is separate, not in the flow)
const STAGE_ORDER: FlowStage[] = [
  'chapter-1-intro', 'intro', 'bias', 'chain-of-custody', 'chapter-1-complete',
  'chapter-2-intro', 'walkthrough-light', 'walkthrough', 'chapter-2-complete',
  'chapter-3-intro', 'the-voice', 'reconciliation', 'prophet-timeline',
  'the-names', 'the-mercy', 'first-step'
];

// Chapter definitions for navigation
const CHAPTER_STAGES: Record<number, { intro: FlowStage; stages: FlowStage[] }> = {
  1: { intro: 'chapter-1-intro', stages: ['intro', 'bias', 'chain-of-custody'] },
  2: { intro: 'chapter-2-intro', stages: ['walkthrough-light', 'walkthrough'] },
  3: { intro: 'chapter-3-intro', stages: ['the-voice', 'reconciliation', 'prophet-timeline', 'the-names', 'the-mercy', 'first-step'] },
};

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

// Episodes organized by chapter
const EPISODES: Episode[] = [
  // Chapter 1: Open Mind
  { id: 'intro', episode: 1, title: 'The Beginning', description: 'From reasoning to the Creator', duration: '15 min', icon: <Sparkles className="w-6 h-6" />, color: 'amber' },
  { id: 'bias', episode: 2, title: 'Clear Vision', description: 'Where I started and why I looked further', duration: '2 min', icon: <Eye className="w-6 h-6" />, color: 'amber' },
  { id: 'chain-of-custody', episode: 3, title: 'Chain of Custody', description: 'Examining how scriptures were preserved', duration: '5 min', icon: <ScrollText className="w-6 h-6" />, color: 'amber' },
  // Chapter 2: The Walkthrough
  { id: 'walkthrough-light', episode: 4, title: 'The Quick Version', description: 'Signs, purpose, and the Almanac moment', duration: '15 min', icon: <Sparkles className="w-6 h-6" />, color: 'emerald' },
  { id: 'walkthrough', episode: 5, title: 'The Deep Dive', description: 'Full inline evidence, authorship elimination', duration: '60 min', icon: <Map className="w-6 h-6" />, color: 'emerald' },
  // Chapter 3: The Full Picture
  { id: 'the-voice', episode: 6, title: 'The Voice', description: 'How the Quran speaks and its promise', duration: '3 min', icon: <MessageSquare className="w-6 h-6" />, color: 'purple' },
  { id: 'reconciliation', episode: 7, title: 'One Message', description: 'The connection between all faiths', duration: '4 min', icon: <Handshake className="w-6 h-6" />, color: 'purple' },
  { id: 'prophet-timeline', episode: 8, title: 'The Timeline', description: 'Journey through prophetic history', duration: '5 min', icon: <Clock className="w-6 h-6" />, color: 'purple' },
  { id: 'the-names', episode: 9, title: 'The Names', description: 'Linguistic connections across faiths', duration: '3 min', icon: <Globe className="w-6 h-6" />, color: 'purple' },
  { id: 'the-mercy', episode: 10, title: 'The Mercy', description: 'Mercy, reality, and what comes next', duration: '3 min', icon: <Heart className="w-6 h-6" />, color: 'purple' },
  { id: 'first-step', episode: 11, title: 'The First Step', description: 'Where do we go from here?', duration: '3 min', icon: <Footprints className="w-6 h-6" />, color: 'purple' },
];

// Helper to get chapter number for an episode
const getEpisodeChapter = (episodeId: FlowStage): number => {
  if (['intro', 'bias', 'chain-of-custody', 'chapter-1-intro', 'chapter-1-complete'].includes(episodeId)) return 1;
  if (['walkthrough-light', 'walkthrough', 'chapter-2-intro', 'chapter-2-complete'].includes(episodeId)) return 2;
  return 3;
};

export default function ExplorePage() {
  const navigate = useNavigate();
  const [flowStage, setFlowStage] = useState<FlowStage>('menu');
  const [highestStageReached, setHighestStageReached] = useState<FlowStage>('chapter-1-intro');
  const [user, setUser] = useState<any>(null);

  // Load progress from database (if logged in) or localStorage
  useEffect(() => {
    const loadProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('explore_progress')
            .eq('id', session.user.id)
            .single();

          if (profile?.explore_progress && Object.keys(profile.explore_progress).length > 0) {
            const { highestStage } = profile.explore_progress;
            if (highestStage) setHighestStageReached(highestStage);
            return;
          }
        } catch (e) {
          console.error('Error loading progress from database:', e);
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { highestStage } = JSON.parse(saved);
          if (highestStage) setHighestStageReached(highestStage);
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
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));

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
  }, [flowStage, highestStageReached, user]);

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

  // Chapter intro handlers
  const handleChapter1IntroBegin = () => advanceToStage('intro');
  const handleChapter2IntroBegin = () => advanceToStage('walkthrough-light');
  const handleChapter3IntroBegin = () => advanceToStage('the-voice');

  // Stage handlers
  const handleIntroComplete = () => advanceToStage('bias');
  const handleBiasComplete = () => advanceToStage('chain-of-custody');
  const handleChainOfCustodyComplete = () => advanceToStage('chapter-1-complete');
  const handleWalkthroughComplete = () => advanceToStage('chapter-2-complete');
  const handleVoiceComplete = () => advanceToStage('reconciliation');
  const handleReconciliationComplete = () => advanceToStage('prophet-timeline');
  const handleProphetTimelineComplete = () => advanceToStage('the-names');
  const handleNamesComplete = () => advanceToStage('the-mercy');
  const handleMercyComplete = () => advanceToStage('first-step');

  // Chapter completion handlers
  const handleChapter1Complete = () => advanceToStage('chapter-2-intro');
  const handleChapter1TakeBreak = () => setFlowStage('menu');
  const handleChapter2Complete = () => advanceToStage('chapter-3-intro');
  const handleChapter2TakeBreak = () => setFlowStage('menu');

  const handleFirstStepTakeStep = () => {
    localStorage.removeItem(STORAGE_KEY);
    markExploreCompleted();
    navigate('/dashboard');
  };

  const handleFirstStepNeedMoreTime = () => {
    setFlowStage('the-mercy');
  };

  const handleFirstStepLearnMore = () => {
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

  // Reset journey to the beginning
  const handleResetJourney = () => {
    setHighestStageReached('chapter-1-intro');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('explore_intro_scene');
    localStorage.removeItem('explore_walkthrough_scene');

    if (user) {
      supabase
        .from('profiles')
        .update({ explore_progress: null })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error resetting progress:', error);
        });
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
      <button
        onClick={() => setFlowStage('menu')}
        className={`fixed ${showProgress ? 'top-20 md:top-16' : 'top-6'} left-6 text-slate-300 hover:text-white transition z-40 flex items-center gap-2 text-sm bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-600/50 shadow-lg`}
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden md:inline">Episodes</span>
      </button>
      <button
        onClick={() => navigate('/explorer')}
        className={`fixed ${showProgress ? 'top-20 md:top-16' : 'top-6'} right-6 text-slate-300 hover:text-white transition z-40 bg-slate-800/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-600/50 shadow-lg`}
      >
        <X className="w-5 h-5" />
      </button>
    </>
  );

  // All episodes are accessible
  const isEpisodeCompleted = (episodeId: FlowStage) => {
    const episodeIndex = STAGE_ORDER.indexOf(episodeId);
    const highestIndex = STAGE_ORDER.indexOf(highestStageReached);
    return episodeIndex < highestIndex;
  };

  const getNextEpisode = () => {
    return highestStageReached;
  };

  // ─── Menu: Episode Overview ─────────────────────────────────────────────
  if (flowStage === 'menu') {
    const totalDuration = EPISODES.reduce((acc, ep) => acc + parseInt(ep.duration), 0);
    const completedCount = EPISODES.filter(ep => isEpisodeCompleted(ep.id)).length;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-60 h-60 bg-amber-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100/30 rounded-full blur-3xl" />
        </div>

        <button
          onClick={() => navigate('/explorer')}
          className="fixed top-6 right-6 text-slate-400 hover:text-slate-700 transition z-50 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow-md border border-slate-200/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-w-3xl mx-auto px-4 py-16 relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 shadow-xl shadow-emerald-200/40 ring-4 ring-white"
            >
              <img
                src="/qurancourse.jpg"
                alt="Quran"
                className="w-full h-full object-cover rounded-2xl"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3"
            >
              Interactive Experience
            </motion.p>
            <div className="inline-block px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
              For non-Muslims &amp; anyone curious
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Exploring Islam
            </h1>
            <p className="text-slate-500 text-lg mb-2 max-w-lg mx-auto leading-relaxed">
              An honest, guided journey through what Muslims actually believe &mdash; no preaching, just discovery.
            </p>
            <p className="text-slate-400 text-base mb-6 max-w-md mx-auto">
              {EPISODES.length} interactive episodes covering evidence, history, and what the Quran really says.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-slate-400" />
                ~{totalDuration} min
              </span>
              <span className="flex items-center gap-2 text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4 text-amber-400" />
                No account needed
              </span>
            </div>
          </motion.div>

          {/* Progress summary */}
          {completedCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 p-5 bg-white border border-emerald-100 rounded-2xl text-center shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-700 font-medium">Your Progress</p>
                <p className="text-emerald-600 font-semibold">
                  {completedCount} / {EPISODES.length}
                </p>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / EPISODES.length) * 100}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                />
              </div>
            </motion.div>
          )}

          {/* Continue and Reset buttons if progress exists */}
          {highestStageReached !== 'intro' && highestStageReached !== 'chapter-1-intro' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 space-y-3"
            >
              <button
                onClick={() => setFlowStage(getNextEpisode())}
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl transition-all group shadow-xl shadow-emerald-200/40 hover:shadow-emerald-300/50 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-lg block">Continue Journey</span>
                    <span className="text-emerald-100 text-sm">Pick up where you left off</span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleResetJourney}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all border border-slate-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Start From Beginning</span>
              </button>
            </motion.div>
          )}

          {/* Chapter cards with episodes */}
          <div className="space-y-6">
            {/* Chapter 1: Open Mind */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setFlowStage('chapter-1-intro')}
                className="w-full p-5 flex items-center gap-4 hover:bg-amber-50/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-amber-600 text-xs font-semibold uppercase tracking-wide mb-1">Chapter 1</p>
                  <h3 className="text-xl font-bold text-slate-900">Open Mind</h3>
                  <p className="text-slate-500 text-sm">Reasoning to the Creator &bull; ~20 min</p>
                </div>
                <div className="text-amber-500">
                  <Play className="w-6 h-6" />
                </div>
              </button>

              <div className="px-4 pb-4 space-y-2">
                {EPISODES.filter(ep => getEpisodeChapter(ep.id) === 1).map((episode) => {
                  const isCompleted = isEpisodeCompleted(episode.id);
                  const isCurrent = episode.id === highestStageReached;
                  return (
                    <button
                      key={episode.id}
                      onClick={() => setFlowStage(episode.id)}
                      className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isCompleted
                          ? 'bg-emerald-50 hover:bg-emerald-100'
                          : isCurrent
                            ? 'bg-amber-50 ring-1 ring-amber-300'
                            : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="text-amber-600 text-sm font-bold">{episode.episode}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 text-sm">{episode.title}</h4>
                        <p className="text-slate-500 text-xs">{episode.duration}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Chapter 2: The Walkthrough */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setFlowStage('chapter-2-intro')}
                className="w-full p-5 flex items-center gap-4 hover:bg-emerald-50/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wide mb-1">Chapter 2</p>
                  <h3 className="text-xl font-bold text-slate-900">The Walkthrough</h3>
                  <p className="text-slate-500 text-sm">Follow the Quran's story &bull; ~60 min &bull; 3 episodes</p>
                </div>
                <div className="text-emerald-500">
                  <Play className="w-6 h-6" />
                </div>
              </button>

              <div className="px-4 pb-4 space-y-2">
                {EPISODES.filter(ep => getEpisodeChapter(ep.id) === 2).map((episode) => {
                  const isCompleted = isEpisodeCompleted(episode.id);
                  const isCurrent = episode.id === highestStageReached;
                  return (
                    <button
                      key={episode.id}
                      onClick={() => setFlowStage(episode.id)}
                      className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isCompleted
                          ? 'bg-emerald-50 hover:bg-emerald-100'
                          : isCurrent
                            ? 'bg-emerald-50 ring-1 ring-emerald-300'
                            : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-100' : 'bg-emerald-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="text-emerald-600 text-sm font-bold">{episode.episode}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 text-sm">{episode.title}</h4>
                        <p className="text-slate-500 text-xs">{episode.duration}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Chapter 3: The Full Picture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setFlowStage('chapter-3-intro')}
                className="w-full p-5 flex items-center gap-4 hover:bg-purple-50/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-200/50">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-purple-600 text-xs font-semibold uppercase tracking-wide mb-1">Chapter 3</p>
                  <h3 className="text-xl font-bold text-slate-900">The Full Picture</h3>
                  <p className="text-slate-500 text-sm">One message through history &bull; ~20 min</p>
                </div>
                <div className="text-purple-500">
                  <Play className="w-6 h-6" />
                </div>
              </button>

              <div className="px-4 pb-4 space-y-2">
                {EPISODES.filter(ep => getEpisodeChapter(ep.id) === 3).map((episode) => {
                  const isCompleted = isEpisodeCompleted(episode.id);
                  const isCurrent = episode.id === highestStageReached;
                  return (
                    <button
                      key={episode.id}
                      onClick={() => setFlowStage(episode.id)}
                      className={`group w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isCompleted
                          ? 'bg-emerald-50 hover:bg-emerald-100'
                          : isCurrent
                            ? 'bg-purple-50 ring-1 ring-purple-300'
                            : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-100' : 'bg-purple-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="text-purple-600 text-sm font-bold">{episode.episode}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 text-sm">{episode.title}</h4>
                        <p className="text-slate-500 text-xs">{episode.duration}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isCompleted ? 'text-emerald-500' : 'text-slate-400'} group-hover:translate-x-0.5 transition-transform`} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Start button if no progress */}
          {(highestStageReached === 'intro' || highestStageReached === 'chapter-1-intro') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12 text-center"
            >
              <button
                onClick={() => setFlowStage('chapter-1-intro')}
                className="group inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-semibold text-lg transition-all shadow-xl shadow-emerald-200/40 hover:shadow-emerald-300/50 hover:scale-[1.02] hover:-translate-y-0.5"
              >
                <Play className="w-6 h-6" />
                Begin Your Journey
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="mt-4 text-slate-400 text-sm">Free &bull; No account required</p>
            </motion.div>
          )}

          {/* Sign up prompt */}
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm"
            >
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Save Your Progress
                </h3>
                <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
                  Create a free account to sync your progress across devices and continue anytime.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/signup?type=explorer')}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition shadow-sm"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl font-medium transition border border-slate-200"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center"
            >
              <p className="text-emerald-700 text-sm font-medium mb-1">Interested in going deeper?</p>
              <p className="text-emerald-600 text-xs mb-3">Live lessons, Quran reading, and daily practice tools are available for Students.</p>
              <button
                onClick={() => navigate('/compare-plans')}
                className="text-emerald-700 hover:text-emerald-800 text-sm font-medium underline underline-offset-2 transition"
              >
                Compare Explorer vs Student
              </button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-10 text-center text-slate-400 text-sm space-y-1"
          >
            <p>Best experienced in order. Take your time with each episode.</p>
            <p>No commitment required — just curiosity.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Chapter 1 ────────────────────────────────────────────────────────

  if (flowStage === 'chapter-1-intro') {
    return (
      <ChapterIntro
        chapterNumber={1}
        title="Open Mind"
        subtitle="Reasoning to the Creator"
        description="Let's start with what we all agree on, reason through it together, then examine the Quran's preservation."
        bulletPoints={[
          'Build foundations from shared truths',
          'Reason logically to the Creator',
          'Examine how scriptures were preserved',
        ]}
        duration="20 min"
        episodeCount={3}
        icon={<Eye className="w-10 h-10" />}
        color="amber"
        onBegin={handleChapter1IntroBegin}
        onBack={() => setFlowStage('menu')}
      />
    );
  }

  if (flowStage === 'intro') {
    return (
      <div className="relative">
        <NavWithProgress showProgress={false} />
        <ExploreIntro onComplete={handleIntroComplete} />
      </div>
    );
  }

  if (flowStage === 'bias') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <BiasBlur onComplete={handleBiasComplete} onBack={() => setFlowStage('intro')} />
        </div>
      </div>
    );
  }

  if (flowStage === 'chain-of-custody') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <ChainOfCustody
            onComplete={handleChainOfCustodyComplete}
            onBack={() => setFlowStage('bias')}
          />
        </div>
      </div>
    );
  }

  if (flowStage === 'chapter-1-complete') {
    return (
      <ChapterComplete
        chapterNumber={1}
        chapterTitle="Open Mind"
        nextChapterTitle="The Walkthrough"
        nextChapterNumber={2}
        icon={<Eye className="w-8 h-8" />}
        color="amber"
        onContinue={handleChapter1Complete}
        onTakeBreak={handleChapter1TakeBreak}
      />
    );
  }

  // ─── Chapter 2 ────────────────────────────────────────────────────────

  if (flowStage === 'chapter-2-intro') {
    return (
      <ChapterIntro
        chapterNumber={2}
        title="The Walkthrough"
        subtitle="Follow the Quran's story of existence step by step"
        description="Start with the Quick Version (~15 min) — signs, purpose, and the Almanac moment. Then go deeper if you want the full inline evidence and authorship elimination."
        bulletPoints={[
          'Quick Version: Signs across every field, rapid-fire',
          'Purpose of life and what is coming next',
          'The Almanac moment — connects it all',
        ]}
        duration="15-60 min"
        episodeCount={2}
        icon={<Scale className="w-10 h-10" />}
        color="emerald"
        onBegin={handleChapter2IntroBegin}
        onBack={() => setFlowStage('menu')}
      />
    );
  }

  if (flowStage === 'walkthrough-light') {
    return (
      <div className="relative">
        <NavWithProgress />
        <QuranWalkthroughLight
          onComplete={handleWalkthroughComplete}
          onGoDeeper={() => advanceToStage('walkthrough')}
        />
      </div>
    );
  }

  if (flowStage === 'walkthrough') {
    return (
      <div className="relative">
        <NavWithProgress />
        <QuranWalkthrough onComplete={handleWalkthroughComplete} onTakeBreak={() => setFlowStage('menu')} />
      </div>
    );
  }

  if (flowStage === 'chapter-2-complete') {
    return (
      <ChapterComplete
        chapterNumber={2}
        chapterTitle="The Walkthrough"
        nextChapterTitle="The Full Picture"
        nextChapterNumber={3}
        icon={<Scale className="w-8 h-8" />}
        color="emerald"
        onContinue={handleChapter2Complete}
        onTakeBreak={handleChapter2TakeBreak}
      />
    );
  }

  // ─── Chapter 3 ────────────────────────────────────────────────────────

  if (flowStage === 'chapter-3-intro') {
    return (
      <ChapterIntro
        chapterNumber={3}
        title="The Full Picture"
        subtitle="One message through history"
        description="Now that you've seen the evidence, discover the full picture — the prophets, the one message, and the invitation."
        bulletPoints={[
          'Hear how the Quran speaks as God',
          'Understand the connection between all faiths',
          'Journey through prophetic history',
        ]}
        duration="20 min"
        episodeCount={6}
        icon={<Heart className="w-10 h-10" />}
        color="purple"
        onBegin={handleChapter3IntroBegin}
        onBack={() => setFlowStage('menu')}
      />
    );
  }

  if (flowStage === 'the-voice') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheVoice
            onComplete={handleVoiceComplete}
            onBack={() => setFlowStage('chapter-3-intro')}
          />
        </div>
      </div>
    );
  }

  if (flowStage === 'reconciliation') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheReconciliation onComplete={handleReconciliationComplete} onBack={() => setFlowStage('the-voice')} />
        </div>
      </div>
    );
  }

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

  if (flowStage === 'the-names') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheNames
            onComplete={handleNamesComplete}
            onBack={() => setFlowStage('prophet-timeline')}
          />
        </div>
      </div>
    );
  }

  if (flowStage === 'the-mercy') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheMercy
            onComplete={handleMercyComplete}
            onBack={() => setFlowStage('the-names')}
          />
        </div>
      </div>
    );
  }

  if (flowStage === 'first-step') {
    return (
      <div className="relative">
        <NavWithProgress />
        <div className="pt-16 md:pt-14">
          <TheFirstStep
            onTakeStep={handleFirstStepTakeStep}
            onNeedMoreTime={handleFirstStepNeedMoreTime}
            onLearnMore={handleFirstStepLearnMore}
            onBack={() => setFlowStage('the-mercy')}
          />
        </div>
      </div>
    );
  }

  return null;
}
