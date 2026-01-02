import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
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
import ExploreProgressBar from '../../components/explore/ExploreProgressBar';

const STORAGE_KEY = 'talbiyah_explore_progress';

// Stage order for the Explore journey (The Almanac)
// 0. Intro - Personal introduction, what I discovered
// 1. BiasBlur - Acknowledge biases before exploring
// 2. ChainOfCustody - Document analysis: Bible vs Quran preservation (NEW)
// 3. AxiomCheck - Present undeniable facts user already accepts (The Data)
// 4. AuthorityMatch - Show Quran verses matching agreed facts (Past Scores)
// 5. ProbabilityMoment - Visual probability dropping, forced pause
// 6. Checkpoint - Ask if convinced, offer to show more evidence
// 7. TheQuestion - Ask where they think the knowledge came from
// 8. TheReconciliation - Explain how all Abrahamic religions are one
// 9. ProphetTimeline - Visual timeline of prophets and their eras
// 10. CheatCodes - Life guidance from the Quran (Cheat Codes)
// 11. TheFirstStep - Soft shahada (Tawhid) and next steps
type FlowStage = 'intro' | 'bias' | 'chain-of-custody' | 'axiom-check' | 'authority-match' | 'probability-moment' | 'checkpoint' | 'the-question' | 'reconciliation' | 'prophet-timeline' | 'cheat-codes' | 'first-step';

// Order of stages for navigation
const STAGE_ORDER: FlowStage[] = ['intro', 'bias', 'chain-of-custody', 'axiom-check', 'authority-match', 'probability-moment', 'checkpoint', 'the-question', 'reconciliation', 'prophet-timeline', 'cheat-codes', 'first-step'];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [flowStage, setFlowStage] = useState<FlowStage>('intro');
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
    if (flowStage !== 'intro') {
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
      <button
        onClick={() => navigate('/')}
        className={`fixed ${showProgress ? 'top-20 md:top-4' : 'top-6'} right-6 text-slate-400 hover:text-white transition z-50`}
      >
        <X className="w-6 h-6" />
      </button>
    </>
  );

  // Stage 0: Introduction (no progress bar yet)
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
          <ChainOfCustody onComplete={handleChainOfCustodyComplete} />
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

  // Stage 7: The Reconciliation - Explain how all Abrahamic religions are one
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
