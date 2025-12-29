import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Shield,
  Star,
  Anchor,
  X,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { tajPrinciples, calculateCompoundProbability, getFormattedProbability } from '../../data/certaintyData';
import { supabase } from '../../lib/supabaseClient';
import FaithTower from '../../components/anchor/FaithTower';
import LifeManual from '../../components/explore/LifeManual';

const STORAGE_KEY = 'talbiyah_anchor_progress';

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  prophecy: <Star className="w-6 h-6" />,
  preservation: <Shield className="w-6 h-6" />,
  historical: <BookOpen className="w-6 h-6" />,
  mathematical: <Sparkles className="w-6 h-6" />,
  linguistic: <BookOpen className="w-6 h-6" />,
};

export default function NewMuslimPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [factsVerified, setFactsVerified] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [showLifeManual, setShowLifeManual] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Load progress from localStorage or database
  useEffect(() => {
    const loadProgress = async () => {
      // Check for user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Try to load from localStorage first
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { step, verified, introSeen } = JSON.parse(saved);
          setCurrentStep(step || 0);
          setFactsVerified(verified || []);
          if (introSeen) setShowIntro(false);
        } catch (e) {
          console.error('Error loading progress:', e);
        }
      }
    };
    loadProgress();
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (!showIntro) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        step: currentStep,
        verified: factsVerified,
        introSeen: true
      }));
    }
  }, [currentStep, factsVerified, showIntro]);

  const currentFact = tajPrinciples[currentStep];
  const progress = ((currentStep) / tajPrinciples.length) * 100;

  const handleVerify = () => {
    if (!factsVerified.includes(currentFact.id)) {
      setFactsVerified([...factsVerified, currentFact.id]);
    }

    if (currentStep < tajPrinciples.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleSkip = () => {
    if (currentStep < tajPrinciples.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartJourney = () => {
    setShowIntro(false);
  };

  const handleComplete = () => {
    // Clear progress and redirect to signup
    localStorage.removeItem(STORAGE_KEY);
    navigate('/signup');
  };

  // Life Manual Modal
  if (showLifeManual) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="relative">
          <button
            onClick={() => setShowLifeManual(false)}
            className="absolute -top-2 -right-2 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <LifeManual onClose={() => setShowLifeManual(false)} />
        </div>
      </div>
    );
  }

  // Intro Screen
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Close button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mb-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Anchor className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-4">
              New to Islam
            </h1>
            <p className="text-xl text-emerald-200 mb-2">
              The Anchor Journey
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-700 mb-8">
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Welcome to Islam. This journey will help you build unshakeable faith
              through verifiable facts and evidence—each one strengthening your certainty.
            </p>
            <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
              <p className="text-emerald-200 text-sm">
                As you verify each fact, your certainty compounds. By the end,
                you'll see why this faith is built on solid foundations.
              </p>
            </div>
          </div>

          {/* Two paths */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleStartJourney}
              className="p-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition flex flex-col items-center gap-3"
            >
              <Anchor className="w-8 h-8" />
              <span className="font-semibold text-lg">Build Your Anchor</span>
              <span className="text-emerald-200 text-sm">
                Strengthen faith with evidence
              </span>
            </button>
            <button
              onClick={() => setShowLifeManual(true)}
              className="p-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-600 transition flex flex-col items-center gap-3"
            >
              <BookOpen className="w-8 h-8 text-emerald-400" />
              <span className="font-semibold text-lg">Life Manual</span>
              <span className="text-slate-400 text-sm">
                Quranic guidance for life challenges
              </span>
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition text-sm"
          >
            Return Home
          </button>

          <p className="text-sm text-slate-500 mt-8">
            {tajPrinciples.length} foundational facts to discover
          </p>
        </motion.div>
      </div>
    );
  }

  // Completion Screen
  if (isComplete) {
    const finalProbability = calculateCompoundProbability(factsVerified);
    const percentageStr = (finalProbability * 100).toFixed(1);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl w-full"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - FaithTower visualization */}
            <div className="hidden lg:block">
              <FaithTower
                facts={tajPrinciples}
                verifiedIds={factsVerified}
              />
            </div>

            {/* Right - Completion message */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6">
                  <Anchor className="w-12 h-12 text-emerald-400" />
                </div>
                <h1 className="text-4xl font-serif text-white mb-4">
                  Your Anchor is Set
                </h1>
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 mb-6">
                {/* Probability Meter */}
                <div className="mb-4">
                  <p className="text-slate-400 mb-2">Your Certainty Level</p>
                  <div className="text-5xl font-bold text-emerald-400 mb-2">
                    {percentageStr}%
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${finalProbability * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>

                <p className="text-slate-300 text-sm">
                  You verified {factsVerified.length} of {tajPrinciples.length} foundational facts
                </p>
              </div>

              <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50 mb-6">
                <p className="text-emerald-200 leading-relaxed">
                  Your faith now has an anchor built on evidence, not just emotion.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold transition flex items-center justify-center gap-2"
                >
                  Create Your Account
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowLifeManual(true)}
                  className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full transition flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Explore Life Manual
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="text-slate-400 hover:text-white transition text-sm"
                >
                  Return Home
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Fact Display with FaithTower
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 right-6 text-slate-400 hover:text-white transition z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Life Manual button */}
      <button
        onClick={() => setShowLifeManual(true)}
        className="fixed top-6 right-16 text-slate-400 hover:text-emerald-400 transition z-50 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Life Manual</span>
      </button>

      {/* Step counter and probability */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-4">
        <div className="text-slate-400">
          <span className="text-emerald-400 font-semibold">{currentStep + 1}</span>
          <span> / {tajPrinciples.length}</span>
        </div>
        {factsVerified.length > 0 && (
          <div className="bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-700/50">
            <span className="text-emerald-400 font-semibold">
              {getFormattedProbability(factsVerified)}
            </span>
            <span className="text-slate-400 text-sm ml-1">certainty</span>
          </div>
        )}
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
        <div className="max-w-5xl w-full grid lg:grid-cols-3 gap-8 items-start">
          {/* FaithTower - Left side on large screens */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <FaithTower
                facts={tajPrinciples}
                verifiedIds={factsVerified}
                currentFactId={currentFact.id}
              />
            </div>
          </div>

          {/* Main Content - spans 2 columns */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFact.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Category Badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                    {categoryIcons[currentFact.category]}
                    <span className="text-emerald-300 font-medium capitalize">
                      {currentFact.category}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-4xl font-serif text-white text-center mb-8">
                  {currentFact.title}
                </h2>

                {/* Description */}
                <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-700 mb-6">
                  <p className="text-lg text-slate-200 leading-relaxed">
                    {currentFact.description}
                  </p>
                </div>

                {/* Evidence */}
                <div className="bg-emerald-900/30 rounded-2xl p-6 border border-emerald-700/50 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-200 mb-2">
                        Evidence
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {currentFact.evidence}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification Question */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-slate-800/50 rounded-xl px-6 py-4 border border-slate-700">
                    <p className="text-slate-300 italic">
                      {currentFact.verificationQuestion}
                    </p>
                  </div>
                </div>

                {/* Response Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleVerify}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Yes, I Understand
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition"
                  >
                    Skip for Now
                  </button>
                </div>

                {/* Navigation */}
                {currentStep > 0 && (
                  <div className="text-center mt-6">
                    <button
                      onClick={handleBack}
                      className="text-slate-400 hover:text-slate-200 transition flex items-center gap-2 mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous Fact
                    </button>
                  </div>
                )}

                {/* Probability Impact */}
                {!factsVerified.includes(currentFact.id) && (
                  <div className="text-center mt-6">
                    <p className="text-sm text-slate-500">
                      Verifying this adds{' '}
                      <span className="text-emerald-400 font-semibold">
                        +{(currentFact.probabilityWeight * 100).toFixed(0)}%
                      </span>{' '}
                      to your certainty
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
