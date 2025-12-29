import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import BiasBlur from '../../components/explore/BiasBlur';
import AxiomCheck from '../../components/explore/AxiomCheck';
import AuthorityMatch from '../../components/explore/AuthorityMatch';
import TheQuestion from '../../components/explore/TheQuestion';
import TheReconciliation from '../../components/explore/TheReconciliation';
import CheatCodes from '../../components/explore/CheatCodes';

const STORAGE_KEY = 'talbiyah_explore_progress';

// Stage order for the Explore journey (The Almanac)
// 1. BiasBlur - Acknowledge biases before exploring
// 2. AxiomCheck - Present undeniable facts user already accepts (The Data)
// 3. AuthorityMatch - Show Quran verses matching agreed facts (Past Scores)
// 4. TheQuestion - Ask where they think the knowledge came from
// 5. TheReconciliation - Explain how all Abrahamic religions are one
// 6. CheatCodes - Life guidance from the Quran (Cheat Codes)
type FlowStage = 'bias' | 'axiom-check' | 'authority-match' | 'the-question' | 'reconciliation' | 'cheat-codes';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [flowStage, setFlowStage] = useState<FlowStage>('bias');
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
          const { stage, axioms, verified, belief } = JSON.parse(saved);
          if (stage) setFlowStage(stage);
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
    if (flowStage !== 'bias') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stage: flowStage,
        axioms: agreedAxioms,
        verified: verifiedCount,
        belief: beliefChoice
      }));
    }
  }, [flowStage, agreedAxioms, verifiedCount, beliefChoice]);

  // Stage handlers
  const handleBiasComplete = () => {
    setFlowStage('axiom-check');
  };

  const handleAxiomCheckComplete = (axioms: string[]) => {
    setAgreedAxioms(axioms);
    setVerifiedCount(axioms.length);
    setFlowStage('authority-match');
  };

  const handleAuthorityMatchComplete = () => {
    setFlowStage('the-question');
  };

  const handleQuestionComplete = (belief: string) => {
    setBeliefChoice(belief);
    setFlowStage('reconciliation');
  };

  const handleReconciliationComplete = () => {
    setFlowStage('cheat-codes');
  };

  const handleCheatCodesComplete = () => {
    // Clear progress and redirect to dashboard (not new-muslim)
    localStorage.removeItem(STORAGE_KEY);
    markExploreCompleted();
    navigate('/dashboard');
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

  // Stage 1: Bias Blur
  if (flowStage === 'bias') {
    return (
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
        >
          <X className="w-6 h-6" />
        </button>
        <BiasBlur onComplete={handleBiasComplete} />
      </div>
    );
  }

  // Stage 2: Axiom Check - Present undeniable facts (The Data)
  if (flowStage === 'axiom-check') {
    return (
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
        >
          <X className="w-6 h-6" />
        </button>
        <AxiomCheck onComplete={handleAxiomCheckComplete} />
      </div>
    );
  }

  // Stage 3: Authority Match - Show Quran verses matching agreed facts (Past Scores)
  if (flowStage === 'authority-match') {
    return (
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
        >
          <X className="w-6 h-6" />
        </button>
        <AuthorityMatch
          agreedAxioms={agreedAxioms}
          onComplete={handleAuthorityMatchComplete}
        />
      </div>
    );
  }

  // Stage 4: The Question - Ask where they think the knowledge came from
  if (flowStage === 'the-question') {
    return (
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
        >
          <X className="w-6 h-6" />
        </button>
        <TheQuestion
          verifiedCount={verifiedCount}
          totalFacts={agreedAxioms.length}
          onComplete={handleQuestionComplete}
        />
      </div>
    );
  }

  // Stage 5: The Reconciliation - Explain how all Abrahamic religions are one
  if (flowStage === 'reconciliation') {
    return (
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
        >
          <X className="w-6 h-6" />
        </button>
        <TheReconciliation onComplete={handleReconciliationComplete} />
      </div>
    );
  }

  // Stage 6: Cheat Codes - Life guidance from the Quran
  if (flowStage === 'cheat-codes') {
    return (
      <div className="relative">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
        >
          <X className="w-6 h-6" />
        </button>
        <CheatCodes
          verifiedCount={verifiedCount}
          totalFacts={agreedAxioms.length}
          onComplete={handleCheatCodesComplete}
        />
      </div>
    );
  }

  return null;
}
