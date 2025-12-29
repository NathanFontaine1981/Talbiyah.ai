import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import BiasBlur from '../../components/explore/BiasBlur';
import AxiomCheck from '../../components/explore/AxiomCheck';
import AuthorityMatch from '../../components/explore/AuthorityMatch';
import CheatCodes from '../../components/explore/CheatCodes';

const STORAGE_KEY = 'talbiyah_explore_progress';

// Stage order for the Explore journey (The Almanac)
// 1. BiasBlur - Acknowledge biases before exploring
// 2. AxiomCheck - Present undeniable facts user already accepts (Phase 0: The Data)
// 3. AuthorityMatch - Show Quran verses matching agreed facts (Phase 1: Past Scores)
// 4. CheatCodes - Life guidance from the Quran (Phase 2: Cheat Codes)
type FlowStage = 'bias' | 'axiom-check' | 'authority-match' | 'cheat-codes';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [flowStage, setFlowStage] = useState<FlowStage>('bias');
  const [agreedAxioms, setAgreedAxioms] = useState<string[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
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
          const { stage, axioms, verified } = JSON.parse(saved);
          if (stage) setFlowStage(stage);
          if (axioms) setAgreedAxioms(axioms);
          if (verified) setVerifiedCount(verified);
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
        verified: verifiedCount
      }));
    }
  }, [flowStage, agreedAxioms, verifiedCount]);

  // Stage handlers
  const handleBiasComplete = () => {
    setFlowStage('axiom-check');
  };

  const handleAxiomCheckComplete = (axioms: string[]) => {
    setAgreedAxioms(axioms);
    setFlowStage('authority-match');
  };

  const handleAuthorityMatchComplete = () => {
    setFlowStage('cheat-codes');
  };

  const handleCheatCodesComplete = () => {
    // Clear progress and redirect to New Muslim page
    localStorage.removeItem(STORAGE_KEY);
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

  // Stage 4: Cheat Codes - Life guidance from the Quran
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
          onComplete={() => {
            markExploreCompleted();
            handleCheatCodesComplete();
          }}
        />
      </div>
    );
  }

  return null;
}
