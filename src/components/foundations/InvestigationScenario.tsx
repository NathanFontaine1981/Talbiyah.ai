import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronRight, CheckCircle, XCircle, BookOpen, Eye,
  Microscope, Shield, Scale, Globe, Link, MessageCircle, Users,
  Lightbulb, Heart, Settings, History, Sparkles, ArrowRight
} from 'lucide-react';
import { type InvestigationScenario as ScenarioType, getScenarioForPillar } from '../../data/investigationScenarios';
import { supabase } from '../../lib/supabaseClient';
import TextToSpeechButton from '../shared/TextToSpeechButton';

type Step = 'hook' | 'evidence' | 'elimination' | 'conclusion';

interface Props {
  pillarSlug: string;
  onComplete: () => void;
  onBack: () => void;
  isCompleted: boolean;
}

// Map icon string names to components
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Eye, Microscope, Shield, Scale, Globe, Link,
  MessageCircle, Users, Lightbulb, Heart, Settings,
  History, Sparkles, Search
};

function getIcon(name: string) {
  return iconComponents[name] || BookOpen;
}

export default function InvestigationScenario({ pillarSlug, onComplete, onBack, isCompleted }: Props) {
  const scenario = getScenarioForPillar(pillarSlug);
  const [step, setStep] = useState<Step>('hook');
  const [examinedEvidence, setExaminedEvidence] = useState<Set<string>>(new Set());
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [eliminatedPossibilities, setEliminatedPossibilities] = useState<Set<string>>(new Set());
  const [incorrectAttempt, setIncorrectAttempt] = useState<string | null>(null);
  const [foundCorrect, setFoundCorrect] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset when pillar changes
  useEffect(() => {
    setStep('hook');
    setExaminedEvidence(new Set());
    setExpandedEvidence(null);
    setEliminatedPossibilities(new Set());
    setIncorrectAttempt(null);
    setFoundCorrect(false);
  }, [pillarSlug]);

  if (!scenario) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">No investigation available for this pillar yet.</p>
        <button onClick={onBack} className="mt-4 text-amber-600 hover:text-amber-700 font-medium">
          Go back
        </button>
      </div>
    );
  }

  const allEvidenceExamined = examinedEvidence.size === scenario.evidence.length;

  function toggleEvidence(id: string) {
    setExpandedEvidence(prev => prev === id ? null : id);
    setExaminedEvidence(prev => new Set(prev).add(id));
  }

  function handleEliminate(possibilityId: string) {
    const possibility = scenario!.possibilities.find(p => p.id === possibilityId);
    if (!possibility) return;

    if (possibility.isCorrect) {
      // Gently redirect — can't eliminate the correct answer
      setIncorrectAttempt(possibilityId);
      setTimeout(() => setIncorrectAttempt(null), 2000);
      return;
    }

    setEliminatedPossibilities(prev => new Set(prev).add(possibilityId));

    // Check if only the correct one remains
    const remaining = scenario!.possibilities.filter(
      p => !eliminatedPossibilities.has(p.id) && p.id !== possibilityId
    );
    if (remaining.length === 1 && remaining[0].isCorrect) {
      setFoundCorrect(true);
    }
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('investigation_progress')
          .upsert({
            user_id: user.id,
            pillar_slug: pillarSlug,
            completed: true,
            completed_at: new Date().toISOString(),
            step_reached: 'conclusion',
            evidence_examined: Array.from(examinedEvidence)
          }, { onConflict: 'user_id,pillar_slug' });
      } else {
        // Save to localStorage
        const key = 'talbiyah_foundation_progress';
        const saved = localStorage.getItem(key);
        if (saved) {
          const progress = JSON.parse(saved);
          if (!progress.completedInvestigations) progress.completedInvestigations = [];
          if (!progress.completedInvestigations.includes(pillarSlug)) {
            progress.completedInvestigations.push(pillarSlug);
          }
          localStorage.setItem(key, JSON.stringify(progress));
        }
      }
    } catch (err) {
      console.error('Error saving investigation progress:', err);
    } finally {
      setSaving(false);
      onComplete();
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {/* ── Step 1: Hook ─────────────────────────────── */}
        {step === 'hook' && (
          <motion.div
            key="hook"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-4 uppercase tracking-wider">
                <Search className="w-4 h-4" />
                Case File #{scenario.id.replace(/-/g, '').slice(0, 6).toUpperCase()}
              </div>

              <h2 className="text-3xl font-bold mb-3">{scenario.title}</h2>

              <p className="text-2xl font-light text-amber-300 mb-6 leading-relaxed">
                {scenario.hookQuestion}
              </p>

              <p className="text-slate-300 leading-relaxed mb-8">
                {scenario.hookDescription}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep('evidence')}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-bold transition"
                >
                  <Search className="w-5 h-5" />
                  Open Case File
                </button>
                <button
                  onClick={onBack}
                  className="text-slate-400 hover:text-white text-sm transition"
                >
                  Back to pillar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Evidence Examination ──────────────── */}
        {step === 'evidence' && (
          <motion.div
            key="evidence"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Examine the Evidence</h2>
              <p className="text-gray-500">
                Tap each piece of evidence to review it. Examine all {scenario.evidence.length} pieces before proceeding.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(examinedEvidence.size / scenario.evidence.length) * 100}%` }}
                  />
                </div>
                <span className="text-gray-500 font-medium">{examinedEvidence.size}/{scenario.evidence.length}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-8">
              {scenario.evidence.map((ev) => {
                const Icon = getIcon(ev.icon);
                const isExamined = examinedEvidence.has(ev.id);
                const isExpanded = expandedEvidence === ev.id;

                return (
                  <motion.div
                    key={ev.id}
                    layout
                    className={`${isExpanded ? 'sm:col-span-2' : ''}`}
                  >
                    <button
                      onClick={() => toggleEvidence(ev.id)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition ${
                        isExpanded
                          ? 'border-amber-400 bg-amber-50 shadow-md'
                          : isExamined
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isExpanded ? 'bg-amber-200 text-amber-800' :
                          isExamined ? 'bg-emerald-100 text-emerald-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {isExamined && !isExpanded ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ev.category}</span>
                          </div>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3"
                            >
                              <p className="text-gray-700 leading-relaxed text-sm">{ev.content}</p>
                              <div className="mt-3">
                                <TextToSpeechButton
                                  text={ev.content}
                                  sectionId={`evidence-${ev.id}`}
                                  label={ev.title}
                                  variant="button"
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('hook')}
                className="text-gray-500 hover:text-gray-700 text-sm transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep('elimination')}
                disabled={!allEvidenceExamined}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
                  allEvidenceExamined
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Evaluate Possibilities
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Elimination ──────────────────────── */}
        {step === 'elimination' && (
          <motion.div
            key="elimination"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Eliminate the Impossible</h2>
              <p className="text-gray-500">
                Based on the evidence, eliminate the explanations that don't hold up. Tap to eliminate.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {scenario.possibilities.map((poss) => {
                const isEliminated = eliminatedPossibilities.has(poss.id);
                const isIncorrectAttempt = incorrectAttempt === poss.id;
                const isRevealed = foundCorrect && poss.isCorrect;

                return (
                  <motion.div
                    key={poss.id}
                    layout
                    animate={isIncorrectAttempt ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                    transition={isIncorrectAttempt ? { duration: 0.4 } : {}}
                  >
                    <button
                      onClick={() => !isEliminated && !foundCorrect && handleEliminate(poss.id)}
                      disabled={isEliminated || foundCorrect}
                      className={`w-full text-left rounded-xl border-2 p-5 transition ${
                        isRevealed
                          ? 'border-emerald-400 bg-emerald-50 shadow-lg'
                          : isEliminated
                          ? 'border-gray-200 bg-gray-50 opacity-50'
                          : isIncorrectAttempt
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isRevealed ? 'bg-emerald-500 text-white' :
                          isEliminated ? 'bg-gray-200 text-gray-400' :
                          isIncorrectAttempt ? 'bg-red-100 text-red-500' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {isRevealed ? <CheckCircle className="w-5 h-5" /> :
                           isEliminated ? <XCircle className="w-5 h-5" /> :
                           <span className="text-sm font-bold">?</span>}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            isEliminated ? 'line-through text-gray-400' :
                            isRevealed ? 'text-emerald-800' :
                            'text-gray-900'
                          }`}>
                            {poss.label}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            isEliminated ? 'text-gray-400' :
                            isRevealed ? 'text-emerald-600' :
                            'text-gray-500'
                          }`}>
                            {poss.description}
                          </p>

                          {isEliminated && poss.evidenceAgainst.length > 0 && (
                            <div className="mt-2 text-xs text-gray-400">
                              Contradicted by: {poss.evidenceAgainst.map(eId =>
                                scenario!.evidence.find(e => e.id === eId)?.title
                              ).filter(Boolean).join(', ')}
                            </div>
                          )}

                          {isIncorrectAttempt && (
                            <p className="mt-2 text-sm text-red-600 font-medium">
                              The evidence supports this — review the case file again.
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('evidence')}
                className="text-gray-500 hover:text-gray-700 text-sm transition"
              >
                Review Evidence
              </button>
              {foundCorrect && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setStep('conclusion')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition"
                >
                  See the Conclusion
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Conclusion + Reflection ──────────── */}
        {step === 'conclusion' && (
          <motion.div
            key="conclusion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Conclusion Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold mb-4 uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" />
                Case Closed
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">{scenario.conclusionTitle}</h2>

              <div className="prose prose-emerald max-w-none">
                {scenario.conclusionText.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">{paragraph}</p>
                ))}
              </div>

              <div className="mt-4">
                <TextToSpeechButton
                  text={scenario.conclusionText}
                  sectionId={`conclusion-${scenario.id}`}
                  label="Conclusion"
                  variant="button"
                />
              </div>
            </div>

            {/* Reflections */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-gray-900">Reflect</h3>
              {scenario.reflections.map((ref, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-gray-800 font-medium mb-2">{ref.question}</p>
                  {ref.quranicReference && (
                    <p className="text-amber-700 text-sm italic bg-amber-50 rounded-lg p-3 mt-3">
                      {ref.quranicReference}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : `Continue to ${scenario.nextStepText}`}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
