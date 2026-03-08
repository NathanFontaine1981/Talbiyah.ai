import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lightbulb, User, Scale, Gavel, Compass, BookOpen, Brain, Search, Heart, CheckCircle2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import ReasoningTest from './ReasoningTest';
import { supabase } from '../../lib/supabaseClient';

interface ExploreIntroProps {
  onComplete: () => void;
}

// ========== All 8 foundation truths (single flow) ==========
const foundationTruths = [
  {
    id: 1,
    text: 'We are human beings, and we are alive',
    reflection: 'You are here, reading this, breathing. Nobody can deny their own existence.',
  },
  {
    id: 2,
    text: 'We had a beginning — we were born',
    reflection: 'We can see the evidence — babies are born from the womb every single day. We all came into this world the same way.',
  },
  {
    id: 3,
    text: "We are going to die one day — we don't know when or where",
    reflection: 'We see it with our own eyes. People around us pass away. Everyone who came before us lived and died. The evidence is undeniable.',
  },
  {
    id: 4,
    text: 'We are intelligent beings',
    reflection: "You're reading, understanding, and processing this right now. That's intelligence in action.",
  },
  {
    id: 5,
    text: 'We are the most intelligent beings on earth — we can outsmart, capture, and contain any animal no matter how big or dangerous',
    reflection: 'The evidence is all around us. Animals far bigger and stronger exist — lions, sharks, elephants — yet we have the intelligence to trap and contain them all. We are the caretakers of this earth.',
  },
  {
    id: 6,
    text: 'Our bodies work automatically — heart beats, we heal when cut, hair grows, all without us choosing',
    reflection: "It happens whether we like it or not. Laws of nature — things we can see happening around us without any input from us.",
  },
  {
    id: 7,
    text: 'We just have to think something and our body does it — move your little toe, pick something up, it just happens',
    reflection: 'All you have to do is think it and it happens. The connection between thought and action is instant — no wires, no manual, no setup.',
  },
  {
    id: 8,
    text: "There was a beginning to the universe — it hasn't always existed",
    reflection: "Through observation, scientists found the universe is ever-expanding. Rewind that — it keeps contracting. It must have started as one piece. It had a beginning.",
  },
];

// ========== Phase definitions ==========
interface Phase {
  id: string;
  name: string;
  startScene: number;
  endScene: number;
}

const phases: Phase[] = [
  { id: 'A', name: 'What We Know For Sure', startScene: 0, endScene: 4 },
  { id: 'B', name: 'Apply Your Logic', startScene: 5, endScene: 11 },
];

function getCurrentPhase(sceneIndex: number): Phase {
  return phases.find(p => sceneIndex >= p.startScene && sceneIndex <= p.endScene) || phases[0];
}

// ========== Scene definitions ==========
interface IntroScene {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode | null;
  isInteractive?: boolean;
  interactiveType?: 'foundation' | 'reasoning-test';
  voiceSource?: 'nathan' | 'daniel' | 'none';
}

const introScenes: IntroScene[] = [
  // ===== PHASE A: "What We Know For Sure" (Scenes 0-4) ~8 min =====
  {
    id: 'welcome',
    title: 'A Message From The Founder',
    icon: 'founder-image',
    voiceSource: 'nathan',
    content: (
      <>
        <div className="flex justify-center mb-6 -mt-2">
          <div className="relative">
            <img
              src="/founder-nathan.jpg"
              alt="Nathan Ellington - Founder of Talbiyah"
              className="w-full max-w-sm rounded-xl shadow-lg"
            />
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xl text-white font-medium leading-relaxed">
            My duty is to convey the message that I found.
          </p>
          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-200 text-center font-arabic text-lg mb-2">
              مَّا عَلَى الرَّسُولِ إِلَّا الْبَلَاغُ
            </p>
            <p className="text-emerald-300 text-center text-sm italic">
              "The duty of the Messenger is only to convey the message."
            </p>
            <p className="text-emerald-400/70 text-center text-xs mt-1">
              — Quran 5:99
            </p>
          </div>
          <p className="text-lg text-slate-300 leading-relaxed">
            I want to share what I found—in full detail—and take you through <span className="text-amber-400 font-medium">my journey, from my lenses</span>.
          </p>
          <p className="text-slate-400 leading-relaxed">
            Take your time. There's no rush. Digest each point before moving on.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'what-we-know',
    title: 'What Do We All Know For Sure?',
    icon: 'lightbulb',
    voiceSource: 'nathan',
    content: null, // Rendered dynamically with word-reveal animation
  },
  {
    id: 'foundation',
    title: 'The Foundation',
    icon: 'foundation',
    voiceSource: 'daniel',
    content: null,
    isInteractive: true,
    interactiveType: 'foundation',
  },
  {
    id: 'reasoning-setup',
    title: 'Test Your Thinking',
    icon: 'brain',
    voiceSource: 'daniel',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            We all judge things against what we already know. If new information <span className="text-amber-400 font-medium">contradicts</span> something you know for sure, you can rule it out.
          </p>
          <p className="text-lg text-slate-300 leading-relaxed">
            That's how your brain works. Evidence in, conclusion out.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-white font-medium text-lg mb-2">Let me give you an example.</p>
            <p className="text-slate-400 leading-relaxed">
              Nothing complicated — just so it's easier to see this in action.
            </p>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Ready?
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'reasoning-test',
    title: 'The Reasoning Test',
    icon: 'search',
    voiceSource: 'none',
    content: null,
    isInteractive: true,
    interactiveType: 'reasoning-test',
  },

  // ===== PHASE B: "Apply Your Logic" (Scenes 5-11) ~12 min =====
  {
    id: 'something-created-us',
    title: 'Something Created Us',
    icon: 'lightbulb',
    voiceSource: 'nathan',
    content: null, // Rendered dynamically with counter animation + phone-in-desert
  },
  {
    id: 'the-evidence-within',
    title: 'The Evidence Within You',
    icon: 'user',
    voiceSource: 'daniel',
    content: null, // Rendered dynamically with body diagram animation
  },
  {
    id: 'the-creator',
    title: 'The Creator',
    icon: 'scale',
    voiceSource: 'daniel',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Science tells us the universe had a <span className="text-amber-400 font-medium">beginning</span>. The Big Bang. Before that—<span className="text-white font-medium">nothing</span>.
          </p>

          {/* Creator vs Creation split cards */}
          <div className="grid gap-4">
            <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
              <h3 className="text-amber-300 font-bold mb-1">Creation</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Has a <span className="text-amber-400">beginning</span></li>
                <li>• Is <span className="text-amber-400">in need</span> of something else to exist</li>
                <li>• Cannot bring itself into existence</li>
              </ul>
            </div>
            <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
              <h3 className="text-emerald-300 font-bold mb-1">Creator</h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Has <span className="text-emerald-400">no beginning</span>—always existed</li>
                <li>• Is <span className="text-emerald-400">self-sufficient</span>—not in need of anything</li>
                <li>• By definition, is <span className="text-emerald-400">uncreated</span></li>
              </ul>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Some ask: <span className="text-amber-400 font-medium">"Who created the Creator?"</span> — but that's like asking a man when he gave birth to his child. The question doesn't apply.
          </p>

          {/* Picture on the Wall concept */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-white font-medium mb-3">The Picture on the Wall</p>
            <p className="text-slate-300 leading-relaxed text-sm mb-2">
              You need to hang a picture but can't do it alone. You ask Person A — they say "I can help, but only if someone helps me first." Person B says the same. And C. And D.
            </p>
            <p className="text-white font-medium leading-relaxed text-sm">
              If this chain goes on forever, the picture never gets on the wall.
            </p>
          </div>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed mb-2">
              But the picture <span className="text-white font-bold">is</span> on the wall. The universe <span className="text-white font-bold">does</span> exist.
            </p>
            <p className="text-emerald-300 leading-relaxed">
              There must be someone who <span className="text-white font-medium">doesn't need help</span>—self-sufficient, uncreated. That is the <span className="text-emerald-400 font-semibold">Creator</span>.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'what-are-you-for',
    title: 'What Are You For?',
    icon: 'compass',
    voiceSource: 'nathan',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Ask yourself about any body part and you know the answer:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { part: 'Feet', purpose: 'To walk' },
              { part: 'Eyes', purpose: 'To see' },
              { part: 'Ears', purpose: 'To hear' },
              { part: 'Hands', purpose: 'To hold' },
              { part: 'Nose', purpose: 'To smell' },
              { part: 'Lungs', purpose: 'To breathe' },
            ].map(item => (
              <div key={item.part} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700 text-center">
                <p className="text-white text-sm font-medium">{item.part}</p>
                <p className="text-slate-500 text-xs">{item.purpose}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 text-center">
            <p className="text-amber-200 leading-relaxed text-xl font-medium">
              But what are <span className="text-white font-bold">you</span> for?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            We didn't make our own faculties. We didn't design our eyes or choose to have a heartbeat. <span className="text-white font-medium">Something gave us all of this.</span>
          </p>

          {/* The Plane metaphor */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed mb-3">
              Imagine you <span className="text-white font-medium">wake up on a plane</span>. You don't know how you got there. What would you immediately think?
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>• What am I doing on this plane?</li>
              <li>• Where is it heading?</li>
              <li>• How did I get here?</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-3">
              It would be <span className="text-amber-400 font-medium">strange</span> to just turn on the TV, order some food, and enjoy yourself—without knowing what's happening or where you're going.
            </p>
          </div>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed text-lg">
              <span className="text-white font-semibold">This is us.</span>
            </p>
            <p className="text-emerald-300 mt-3 leading-relaxed">
              We're on a journey we didn't choose, heading towards an end we can't escape. The answer <span className="text-white font-semibold">must exist</span>. And that's exactly what I set out to find.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'the-answer',
    title: 'The Answer Must Exist',
    icon: 'book',
    voiceSource: 'daniel',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            If something <span className="text-white font-medium">more intelligent than us</span> created us and this universe, for a <span className="text-amber-400 font-medium">reason</span>... would it really create us and then <span className="text-white font-semibold">not tell us why</span>?
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            That doesn't make sense. If something designed you with <span className="text-white font-medium">this level of precision</span> — intelligence, awareness, a body that maintains itself — it clearly had a plan. And it must have <span className="text-amber-400 font-medium">communicated</span> that plan.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-white font-medium mb-3">There is one source — the Quran — that claims:</p>
            <div className="space-y-2 text-slate-300 text-sm">
              <p>• Why you were created and your purpose</p>
              <p>• What happened to people before us</p>
              <p>• What happens when you die — and what comes after</p>
              <p>• Laws for living — inheritance, family, food, business</p>
              <p>• A complete <span className="text-amber-400 font-medium">code of life</span></p>
            </div>
          </div>

          {/* Glowing book visual */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full" />
              <div className="relative bg-amber-900/30 rounded-xl p-8 border border-amber-700/50 text-center">
                <BookOpen className="w-16 h-16 text-amber-400 mx-auto mb-3" />
                <p className="text-amber-200 leading-relaxed text-lg">
                  That's a bold claim. So we need to <span className="text-white font-semibold">examine it</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'my-discovery',
    title: 'What I Found',
    icon: 'heart',
    voiceSource: 'nathan',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-xl text-white font-medium leading-relaxed">
            When I started looking into this — genuinely looking, not just hearing what people say — something shifted.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            I wasn't expecting to find what I found.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            The more I examined, the more I couldn't walk away. Piece after piece after piece. And at some point, it stopped being about "maybe" and became...
          </p>

          <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 text-center">
            <p className="text-2xl text-white font-bold">
              I can't deny this.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            I want to show you what I found. And I want you to <span className="text-amber-400 font-medium">judge for yourself</span>.
          </p>
        </div>
      </>
    ),
  },

  // Scene 11: Court session — bridge to Chapter 2
  {
    id: 'court-session',
    title: 'Court Is Now In Session',
    icon: 'gavel',
    voiceSource: 'nathan',
    content: (
      <>
        <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50 mb-6 text-center">
          <p className="text-amber-200 font-serif text-lg">
            THE CASE OF
          </p>
          <p className="text-2xl text-white font-bold mt-1">
            The Quran vs. Reasonable Doubt
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-lg text-slate-300 leading-relaxed">
            You are the <span className="text-amber-400 font-semibold">judge and jury</span>. I will present evidence. You will decide.
          </p>
          <p className="text-lg text-slate-300 leading-relaxed">
            Examine each piece of evidence with an <span className="text-blue-400 font-semibold">open mind</span>. Accept what convinces you. Question what doesn't.
          </p>
          <p className="text-lg text-slate-300 leading-relaxed">
            At the end — <span className="text-amber-400 font-medium">you deliver the verdict</span>.
          </p>
        </div>
      </>
    ),
  },
];

// ========== Foundation Builder Component (all 8 truths, single flow) ==========
function FoundationBuilder({ onComplete }: { onComplete: () => void }) {
  const [agreedTruths, setAgreedTruths] = useState<number[]>([]);
  const [currentTruthIndex, setCurrentTruthIndex] = useState(0);
  const [showReflection, setShowReflection] = useState(false);

  const currentTruth = foundationTruths[currentTruthIndex];
  const allAgreed = agreedTruths.length === foundationTruths.length;

  const handleAgree = () => {
    setAgreedTruths(prev => [...prev, currentTruth.id]);
    setShowReflection(false);
    if (currentTruthIndex < foundationTruths.length - 1) {
      setCurrentTruthIndex(prev => prev + 1);
    }
  };

  const handleNotSure = () => {
    setShowReflection(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-serif text-white mb-2">The Foundation</h1>
          <p className="text-slate-400 text-sm">
            {agreedTruths.length} of {foundationTruths.length} truths confirmed
          </p>
        </div>

        {/* Foundation stack — agreed truths */}
        <div className="mb-6 space-y-2">
          {foundationTruths
            .filter(t => agreedTruths.includes(t.id))
            .map((truth, index) => (
              <motion.div
                key={truth.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-700/40 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-300 text-sm leading-relaxed">
                  <span className="text-emerald-400 font-medium">#{index + 1}:</span> {truth.text}
                </p>
              </motion.div>
            ))}
        </div>

        {/* Current truth to agree on */}
        {!allAgreed && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTruth.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-700 mb-6"
            >
              <p className="text-amber-400 text-sm font-medium mb-3">
                Truth #{currentTruthIndex + 1}
              </p>
              <p className="text-xl text-white font-medium leading-relaxed mb-6">
                {currentTruth.text}
              </p>

              {showReflection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/30 mb-4"
                >
                  <p className="text-amber-200 text-sm leading-relaxed">
                    {currentTruth.reflection}
                  </p>
                </motion.div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAgree}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  I agree
                </button>
                {!showReflection && (
                  <button
                    onClick={handleNotSure}
                    className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition text-sm"
                  >
                    I'm not sure
                  </button>
                )}
                {showReflection && (
                  <button
                    onClick={handleAgree}
                    className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition text-sm"
                  >
                    I'll consider it
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* All agreed — gold border glow + continue */}
        {allAgreed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-emerald-900/30 rounded-xl p-5 border-2 border-amber-500/50 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <p className="text-emerald-200 text-lg leading-relaxed">
                You've confirmed all 8 truths. Your foundation is complete.
              </p>
              <p className="text-amber-400 leading-relaxed mt-2 font-medium">
                Now... let's put your thinking to the test.
              </p>
            </div>
            <button
              onClick={onComplete}
              className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ========== Word Reveal Animation for "What We Know" scene ==========
function WordRevealScene() {
  const [visibleWords, setVisibleWords] = useState(0);

  const paragraphs = [
    { words: 'Before I share anything with you, let\'s start with what every single human being on this earth already knows.'.split(' '), delay: 0 },
    { words: 'Not opinions. Not beliefs. Not theories.'.split(' '), delay: 0 },
    { words: 'Established facts — things any sane person would agree on, because we can see the evidence with our own eyes.'.split(' '), delay: 0 },
    { words: 'I want to build a foundation with you. Universal truths that we all agree on.'.split(' '), delay: 0 },
  ];

  const allWords = paragraphs.flatMap(p => [...p.words, '||']); // || = paragraph break

  useEffect(() => {
    if (visibleWords >= allWords.length) return;
    const timer = setTimeout(() => {
      setVisibleWords(prev => prev + 1);
    }, 80);
    return () => clearTimeout(timer);
  }, [visibleWords, allWords.length]);

  let wordIndex = 0;

  return (
    <div className="space-y-5">
      {paragraphs.map((para, pIdx) => {
        const paraWords = para.words.map((word, wIdx) => {
          const globalIdx = wordIndex;
          wordIndex++;
          const isVisible = globalIdx < visibleWords;
          const isHighlighted = word === 'Established' || word === 'Universal' || word === 'foundation';
          return (
            <motion.span
              key={`${pIdx}-${wIdx}`}
              initial={{ opacity: 0, y: 5 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              className={`inline ${isHighlighted ? 'text-amber-400 font-semibold' : pIdx === 0 ? 'text-xl text-white font-medium' : pIdx === 1 ? 'text-lg text-slate-300' : pIdx === 2 ? 'text-lg text-slate-300' : 'text-slate-400'}`}
            >
              {word}{' '}
            </motion.span>
          );
        });
        wordIndex++; // skip the || separator
        return (
          <p key={pIdx} className="leading-relaxed">
            {paraWords}
          </p>
        );
      })}
    </div>
  );
}

// ========== Counter Animation for "Something Created Us" scene ==========
function SomethingCreatedUsScene() {
  return (
    <div className="space-y-5">
      <p className="text-lg text-slate-300 leading-relaxed">
        The universe <span className="text-amber-400 font-medium">had a beginning</span>. It didn't exist, then it did. So — <span className="text-white font-medium">what brought it into being?</span>
      </p>

      <p className="text-lg text-slate-300 leading-relaxed">
        Nothing can't create something. And if you keep asking <em>"well what created that?"</em> — you'd go back forever and never reach a starting point.
      </p>

      <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
        <p className="text-emerald-200 leading-relaxed">
          But we're already here. So <span className="text-white font-medium">something uncreated must have always existed</span> — self-sufficient, needing nothing — to bring everything else into being.
        </p>
      </div>

      <p className="text-lg text-slate-300 leading-relaxed">
        And we're <span className="text-white font-medium">intelligent beings</span>. So whatever created us must be <span className="text-amber-400 font-medium">more intelligent than us</span> — and must know best about how this universe works.
      </p>
    </div>
  );
}

// ========== Body Diagram Animation for "Evidence Within" scene ==========
function EvidenceWithinScene() {
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const bodyParts = [
    { name: 'Your Eyes', icon: '👁️', detail: '576 megapixels. Auto-focus in milliseconds. Self-cleaning. Works for 80+ years without replacement.', sub: 'No camera company has come close.' },
    { name: 'Your Body', icon: '🩹', detail: 'Cut yourself—it heals. Break a bone—it repairs. Get sick—your immune system fights back automatically.', sub: 'No machine fixes itself.' },
    { name: 'Your Brain', icon: '🧠', detail: '86 billion neurons. Stores a lifetime of memories. Processes emotions, language, creativity, and consciousness itself.', sub: 'The most powerful supercomputers still can\'t replicate it.' },
  ];

  useEffect(() => {
    if (highlightIndex >= bodyParts.length - 1) return;
    const timer = setTimeout(() => {
      setHighlightIndex(prev => prev + 1);
    }, highlightIndex < 0 ? 1000 : 2000);
    return () => clearTimeout(timer);
  }, [highlightIndex, bodyParts.length]);

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <p className="text-slate-400 text-sm mb-1">Remember, you agreed:</p>
        <p className="text-white leading-relaxed">
          Our bodies work automatically. We think something and our body does it.
        </p>
      </div>

      <p className="text-lg text-slate-300 leading-relaxed">
        Let's look closer at the <span className="text-amber-400 font-medium">evidence you carry with you</span> every single day:
      </p>

      {bodyParts.map((part, idx) => (
        <motion.div
          key={part.name}
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: idx <= highlightIndex ? 1 : 0.3,
            borderColor: idx === highlightIndex ? 'rgba(245, 158, 11, 0.5)' : 'rgba(51, 65, 85, 1)',
          }}
          transition={{ duration: 0.5 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700"
        >
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <span className="text-2xl">{part.icon}</span> {part.name}
          </h3>
          <p className="text-slate-300 leading-relaxed">{part.detail}</p>
          <p className="text-slate-400 text-sm mt-2">{part.sub}</p>
        </motion.div>
      ))}

      <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
        <p className="text-emerald-200 leading-relaxed">
          All of this... by <span className="text-white font-medium">accident</span>? Or by <span className="text-emerald-400 font-semibold">design</span>?
        </p>
      </div>
    </div>
  );
}

// ========== Phase Progress Indicator ==========
function PhaseProgressBar({ currentScene }: { currentScene: number }) {
  const phase = getCurrentPhase(currentScene);
  const scenesInPhase = phase.endScene - phase.startScene + 1;
  const sceneWithinPhase = currentScene - phase.startScene + 1;
  const progressPercent = (sceneWithinPhase / scenesInPhase) * 100;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/50">
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-xs font-medium whitespace-nowrap">
          Phase {phase.id}: {phase.name}
        </span>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden min-w-[60px]">
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-slate-500 text-xs whitespace-nowrap">
          {sceneWithinPhase}/{scenesInPhase}
        </span>
      </div>
    </div>
  );
}

// ========== Audio playback helper ==========
function getAudioUrl(sceneId: string, voiceSource?: string): string {
  // Nathan's recordings take priority
  if (voiceSource === 'nathan') {
    const { data } = supabase.storage.from('explore-audio').getPublicUrl(`nathan-${sceneId}.mp3`);
    return data.publicUrl;
  }
  // Daniel (AI) narrations
  const { data } = supabase.storage.from('explore-audio').getPublicUrl(`${sceneId}.mp3`);
  return data.publicUrl;
}

// ========== Main ExploreIntro Component ==========
export const ExploreIntro = ({ onComplete }: ExploreIntroProps) => {
  const [currentScene, setCurrentScene] = useState(() => {
    const saved = localStorage.getItem('explore_intro_scene');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [audioMuted, setAudioMuted] = useState(() => {
    return localStorage.getItem('explore_audio_muted') === 'true';
  });
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scene = introScenes[currentScene];
  const isLastScene = currentScene === introScenes.length - 1;
  const isFirstScene = currentScene === 0;

  // Save progress on scene change
  useEffect(() => {
    localStorage.setItem('explore_intro_scene', String(currentScene));
  }, [currentScene]);

  // Auto-play audio when scene changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAudioPlaying(false);
      setAudioLoading(false);
    }

    // Don't play for interactive scenes or scenes with no audio
    if (scene.isInteractive || scene.voiceSource === 'none') return;
    if (audioMuted) return;

    setAudioLoading(true);
    const audio = new Audio(getAudioUrl(scene.id, scene.voiceSource));
    audioRef.current = audio;

    const onPlay = () => { setAudioPlaying(true); setAudioLoading(false); };
    const onEnd = () => setAudioPlaying(false);
    const onPause = () => setAudioPlaying(false);
    const onError = () => { setAudioPlaying(false); setAudioLoading(false); };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    const timer = setTimeout(() => {
      audio.play().catch(() => { setAudioPlaying(false); setAudioLoading(false); });
    }, 600);

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [currentScene, audioMuted, scene.id, scene.isInteractive, scene.voiceSource]);

  const toggleMute = () => {
    setAudioMuted(prev => {
      const next = !prev;
      localStorage.setItem('explore_audio_muted', String(next));
      if (next && audioRef.current) {
        audioRef.current.pause();
      }
      return next;
    });
  };

  const handleNext = useCallback(() => {
    if (isLastScene) {
      localStorage.removeItem('explore_intro_scene');
      onComplete();
    } else {
      setCurrentScene(prev => prev + 1);
    }
  }, [isLastScene, onComplete]);

  const handleBack = () => {
    if (!isFirstScene) {
      const prevIndex = currentScene - 1;
      const prevScene = introScenes[prevIndex];
      if (prevScene?.isInteractive) {
        setCurrentScene(Math.max(0, prevIndex - 1));
      } else {
        setCurrentScene(prevIndex);
      }
    }
  };

  // ===== Handle interactive scenes =====
  if (scene.isInteractive) {
    const backButton = (
      <div className="fixed top-20 left-6 z-40">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>
    );

    if (scene.interactiveType === 'foundation') {
      return (
        <div className="relative">
          {backButton}
          <FoundationBuilder onComplete={handleNext} />
        </div>
      );
    }

    if (scene.interactiveType === 'reasoning-test') {
      return (
        <div className="relative">
          {backButton}
          <ReasoningTest onComplete={handleNext} />
        </div>
      );
    }

  }

  // ===== Render dynamic content for specific scenes =====
  const renderSceneContent = () => {
    switch (scene.id) {
      case 'what-we-know':
        return <WordRevealScene />;
      case 'something-created-us':
        return <SomethingCreatedUsScene />;
      case 'the-evidence-within':
        return <EvidenceWithinScene />;
      default:
        return scene.content;
    }
  };

  // ===== Icon renderer =====
  const renderIcon = () => {
    if (scene.icon === 'founder-image') return null;
    const iconMap: Record<string, React.ReactNode> = {
      lightbulb: <Lightbulb className="w-10 h-10 text-amber-400" />,
      brain: <Brain className="w-10 h-10 text-purple-400" />,
      search: <Search className="w-10 h-10 text-amber-400" />,
      user: <User className="w-10 h-10 text-emerald-400" />,
      scale: <Scale className="w-10 h-10 text-blue-400" />,
      compass: <Compass className="w-10 h-10 text-blue-400" />,
      book: <BookOpen className="w-10 h-10 text-amber-400" />,
      gavel: <Gavel className="w-10 h-10 text-amber-400" />,
      heart: <Heart className="w-10 h-10 text-rose-400" />,
      check: <CheckCircle2 className="w-10 h-10 text-emerald-400" />,
      sparkles: <Sparkles className="w-10 h-10 text-amber-400" />,
    };
    const icon = iconMap[scene.icon];
    if (!icon) return null;
    return (
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Phase progress indicator + audio toggle */}
      <div className="fixed top-20 left-6 right-6 z-40 flex items-center justify-between gap-3">
        <PhaseProgressBar currentScene={currentScene} />
        <button
          onClick={toggleMute}
          className={`bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg border border-slate-700/50 transition flex-shrink-0 ${
            audioPlaying ? 'text-amber-400' : audioLoading ? 'text-slate-500' : 'text-slate-400 hover:text-white'
          }`}
          title={audioMuted ? 'Unmute narration' : audioLoading ? 'Loading audio...' : 'Mute narration'}
        >
          {audioMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : audioLoading ? (
            <Volume2 className="w-5 h-5 animate-pulse opacity-50" />
          ) : (
            <Volume2 className={`w-5 h-5 ${audioPlaying ? 'animate-pulse' : ''}`} />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-2xl w-full pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {renderIcon()}

            <h1 className="text-3xl sm:text-4xl font-serif text-white text-center mb-8">
              {scene.title}
            </h1>

            <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
              {renderSceneContent()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-sm border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isFirstScene}
            className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition ${
              isFirstScene
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition bg-amber-600 hover:bg-amber-500 text-white"
          >
            {isLastScene ? "Let's Begin" : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ExploreIntro;
