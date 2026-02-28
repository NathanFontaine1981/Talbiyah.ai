import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lightbulb, User, Scale, Gavel, Compass, BookOpen, Brain, Search, Heart, CheckCircle2, Volume2, VolumeX, Stethoscope, Leaf, Waves, Sparkles } from 'lucide-react';
import AlmanacGame from './AlmanacGame';
import ReasoningTest from './ReasoningTest';
import QuranExhibits from './QuranExhibits';
import AuthorshipElimination from './AuthorshipElimination';
import { supabase } from '../../lib/supabaseClient';

interface ExploreIntroProps {
  onComplete: () => void;
}

// ========== All 8 foundation truths (single flow) ==========
const foundationTruths = [
  {
    id: 1,
    text: 'We are human beings, and we are alive',
    reflection: 'Can you truly deny that you exist and are alive right now?',
  },
  {
    id: 2,
    text: 'We had a beginning — we were born',
    reflection: "There was a time when you didn't exist. Then you were brought into being.",
  },
  {
    id: 3,
    text: "We are going to die one day — we don't know when or where",
    reflection: 'Every human who has ever lived has died, or will die. This is undeniable.',
  },
  {
    id: 4,
    text: 'We are intelligent beings',
    reflection: "You're reading, understanding, and processing this right now. That's intelligence.",
  },
  {
    id: 5,
    text: 'We are the most intelligent beings on earth — we can outsmart, capture, and contain any animal no matter how big or dangerous',
    reflection: 'Lions, sharks, elephants — we can contain them all. No other creature rules like we do.',
  },
  {
    id: 6,
    text: 'Our bodies work automatically — heart beats, we heal when cut, hair grows, all without us choosing',
    reflection: "You didn't tell your heart to beat today. You don't choose to heal. It just happens.",
  },
  {
    id: 7,
    text: 'We just have to think something and our body does it — move your little toe, pick something up, it just happens',
    reflection: 'Think about moving your finger. It moves. The connection between thought and action is instant.',
  },
  {
    id: 8,
    text: "There was a beginning to the universe — it hasn't always existed",
    reflection: "Science confirms this. The Big Bang. Before that — nothing. It had a start.",
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
  { id: 'B', name: 'Apply Your Logic', startScene: 5, endScene: 10 },
  { id: 'C', name: 'The Evidence', startScene: 11, endScene: 16 },
  { id: 'D', name: 'The Closing', startScene: 17, endScene: 21 },
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
  interactiveType?: 'foundation' | 'reasoning-test' | 'almanac' | 'quran-exhibits' | 'authorship-elimination';
  voiceSource?: 'nathan' | 'daniel' | 'none';
}

const introScenes: IntroScene[] = [
  // ===== PHASE A: "What We Know For Sure" (Scenes 0-4) ~5 min =====
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
            <p className="text-white font-medium text-lg mb-2">Let me give you a quick test.</p>
            <p className="text-slate-400 leading-relaxed">
              Nothing complicated. Just see if your brain is doing what it should be doing.
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

  // ===== PHASE B: "Apply Your Logic" (Scenes 5-10) ~8 min =====
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

  // ===== PHASE C: "The Evidence" (Scenes 11-16) ~10 min =====
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
  {
    id: 'back-in-time',
    title: 'Put Yourself Back in Time',
    icon: 'compass',
    voiceSource: 'daniel',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Before we look at the evidence, you have to <span className="text-amber-400 font-medium">put yourself back in that time</span> and understand what life was like.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-white font-medium mb-3">7th Century Arabia</p>
            <div className="space-y-2 text-slate-300 text-sm">
              <p>No technology. No electricity. No printing press.</p>
              <p>Barefooted Bedouins of the desert.</p>
              <p>Most people couldn't read or write.</p>
              <p>They had the most eloquent poetry — but <span className="text-white">no science, no medicine, no astronomy</span>.</p>
            </div>
          </div>

          <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed">
              <span className="text-white font-medium">"I'll fly to that country and be there in half an hour"</span> — they'd say: <span className="text-amber-300">"Only birds fly. How can a human fly?"</span>
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            That's the <span className="text-white font-medium">gap</span> between what they knew then and what we know now. Keep that in mind as we look at what this book says.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'the-specialist',
    title: 'The Specialist',
    icon: 'brain',
    voiceSource: 'daniel',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Think about the <span className="text-amber-400 font-medium">best people in the world</span> in their respective areas:
          </p>

          {/* Specialist cards */}
          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-start gap-3">
              <div className="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">A Cardiologist</p>
                <p className="text-slate-400 text-sm">Spent their entire life becoming an expert in <span className="text-white">one area of the body</span> — the heart.</p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">David Attenborough</p>
                <p className="text-slate-400 text-sm">Everyone knows him for <span className="text-white">observing nature</span>. A <span className="text-white">lifetime</span> of doing just that.</p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Waves className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">An Oceanologist</p>
                <p className="text-slate-400 text-sm">Spent their career studying <span className="text-white">the ocean</span>. One subject, one lifetime.</p>
              </div>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Yet the Quran — from <span className="text-white font-medium">1400 years ago</span> — covers the human body, the ocean, the mountains, embryology, the universe, law, and history.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            And gets <span className="text-amber-400 font-medium">nothing wrong</span>. From a man who couldn't read or write.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed text-lg">
              <span className="text-white font-semibold">How?</span>
            </p>
            <p className="text-emerald-300 mt-2 leading-relaxed">
              The author seems to know <span className="text-white font-semibold">everything about everything</span>.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'the-claim',
    title: 'The Claim',
    icon: 'book',
    voiceSource: 'daniel',
    content: (
      <>
        <div className="space-y-5">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-amber-700/50">
            <p className="text-white/70 font-arabic text-lg text-center leading-loose mb-3" dir="rtl">
              ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ
            </p>
            <p className="text-white text-center text-xl font-medium italic leading-relaxed">
              "This is the Book about which there is <span className="text-amber-400 font-bold">no doubt</span>, a guidance for those who are mindful of God."
            </p>
            <p className="text-amber-400/70 text-center text-xs mt-2">
              — Al-Baqarah 2:2 — The very beginning of the Quran
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Think about that claim. This book opens by saying there is <span className="text-white font-medium">no doubt</span> in it.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            Not "a wise man once said..." Not "according to so-and-so..." Not "he said that God said..."
          </p>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed text-lg text-center">
              This claims to be the <span className="text-white font-semibold">direct, verbatim words</span> of your Creator — speaking to <span className="text-white font-semibold">you</span>, in first person.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Is there another book on Earth that makes that claim? Not a book <span className="text-white">about</span> God. Not a book of stories <span className="text-white">attributed</span> to God. A book that says: these are <span className="text-amber-400 font-medium">My words, directly to you, unchanged</span>.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed text-lg text-center font-medium">
              That's a bold claim. So let's test it.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'quran-exhibits',
    title: 'The Exhibits',
    icon: 'search',
    voiceSource: 'none',
    isInteractive: true,
    interactiveType: 'quran-exhibits',
    content: null,
  },
  {
    id: 'the-verdict',
    title: 'No Contradictions. One Book.',
    icon: 'check',
    voiceSource: 'daniel',
    content: null, // Rendered dynamically with stats counter animation
  },

  // ===== PHASE D: "The Closing" (Scenes 17-19) ~3 min =====
  {
    id: 'prove-it',
    title: 'Prove It',
    icon: 'sparkles',
    voiceSource: 'daniel',
    content: null, // Rendered dynamically with animated checklist
  },
  {
    id: 'the-author',
    title: 'The Author',
    icon: 'scale',
    voiceSource: 'none',
    isInteractive: true,
    interactiveType: 'authorship-elimination',
    content: null,
  },
  {
    id: 'the-almanac',
    title: 'The Almanac Moment',
    icon: 'book',
    voiceSource: 'none',
    isInteractive: true,
    interactiveType: 'almanac',
    content: null,
  },
  {
    id: 'your-verdict',
    title: 'Your Verdict',
    icon: 'heart',
    voiceSource: 'nathan',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-xl text-white font-medium leading-relaxed">
            You've seen it for yourself. Not because I told you — because you examined the evidence.
          </p>

          <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 text-center">
            <p className="text-2xl text-white font-bold">
              Where do you think this book came from?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Whatever you decide, I respect it.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'begin',
    title: "Let's Begin",
    icon: 'compass',
    voiceSource: 'none', // Audio combined with your-verdict recording
    content: (
      <>
        <div className="space-y-5">
          <p className="text-xl text-white font-medium leading-relaxed text-center">
            This was just the introduction.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-6 border border-emerald-700/50 text-center">
            <p className="text-emerald-200 leading-relaxed text-lg">
              What comes next goes deeper — into the Quran itself, its language, its message, and what it asks of you.
            </p>
            <p className="text-emerald-300 mt-3">
              Take your time. Come back whenever you're ready.
            </p>
          </div>
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
    { words: 'Facts that no one — regardless of their religion, culture, or background — can deny.'.split(' '), delay: 0 },
    { words: 'I want to build a foundation with you. Things we both agree on. Things that will never change.'.split(' '), delay: 0 },
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
          const isHighlighted = word === 'Facts' || word === 'foundation';
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
  const [showCounter, setShowCounter] = useState(false);
  const [counterStep, setCounterStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCounter(true), 800);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!showCounter || counterStep >= 3) return;
    const timer = setTimeout(() => setCounterStep(prev => prev + 1), 600);
    return () => clearTimeout(timer);
  }, [showCounter, counterStep]);

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <p className="text-slate-400 text-sm mb-1">Remember, you agreed:</p>
        <p className="text-white leading-relaxed">
          We exist. We had a beginning. We didn't choose to be here.
        </p>
      </div>

      <p className="text-lg text-slate-300 leading-relaxed">
        So <span className="text-white font-medium">something</span> must have brought us into existence. Because zero plus zero will always equal zero.
      </p>

      {/* Animated counter */}
      {showCounter && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center"
        >
          <div className="flex items-center justify-center gap-3 text-4xl font-bold text-white">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: counterStep >= 0 ? 1 : 0 }}
            >0</motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: counterStep >= 1 ? 1 : 0 }}
              className="text-slate-500"
            >+</motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: counterStep >= 1 ? 1 : 0 }}
            >0</motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: counterStep >= 2 ? 1 : 0 }}
              className="text-slate-500"
            >=</motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: counterStep >= 2 ? 1 : 0 }}
              className="text-amber-400"
            >0</motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: counterStep >= 3 ? 1 : 0 }}
            className="text-slate-400 text-sm mt-2"
          >
            Nothing plus nothing equals nothing.
          </motion.p>
        </motion.div>
      )}

      <p className="text-lg text-slate-300 leading-relaxed">
        So how can <span className="text-amber-400 font-medium">no intelligence</span> create <span className="text-white font-medium">intelligence</span>?
      </p>

      {/* Phone in desert concept */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <p className="text-slate-300 leading-relaxed mb-3">
          Imagine you're walking through a <span className="text-amber-400 font-medium">desert</span>. Nothing around for miles. Then you find a <span className="text-white font-medium">smartphone</span> lying on the ground.
        </p>
        <p className="text-slate-300 text-sm leading-relaxed mb-3">
          Calendars. Messages. A camera with incredible clarity. Precision engineering.
        </p>
        <p className="text-amber-200 font-medium">
          Did this phone design itself?
        </p>
      </div>

      <p className="text-lg text-slate-300 leading-relaxed">
        You'd say <span className="text-white font-medium">no, obviously not</span>. So why would we look at something far more complex — the human body — and think differently?
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

// ========== Stats Counter for "The Verdict" scene ==========
function VerdictScene() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 3) return;
    const timer = setTimeout(() => setStep(prev => prev + 1), 1000);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="space-y-5">
      <p className="text-lg text-slate-300 leading-relaxed">
        Consider what we've just seen. The Quran was revealed over 23 years — in bits and pieces, across completely different situations — and yet:
      </p>

      {/* Animated stats */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : -20 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center"
        >
          <p className="text-4xl font-bold text-white">23 years</p>
          <p className="text-slate-400 text-sm mt-1">of revelation</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: step >= 2 ? 1 : 0, x: step >= 2 ? 0 : -20 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center"
        >
          <p className="text-4xl font-bold text-emerald-400">0 contradictions</p>
          <p className="text-slate-400 text-sm mt-1">over 1400 years of scrutiny</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: step >= 3 ? 1 : 0, x: step >= 3 ? 0 : -20 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center"
        >
          <p className="text-4xl font-bold text-amber-400">1 version</p>
          <p className="text-slate-400 text-sm mt-1">every copy on earth is identical</p>
        </motion.div>
      </div>

      {/* Al-Baqarah 2:2 */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <p className="text-white/80 font-arabic text-lg text-center mb-3 leading-loose" dir="rtl">
          ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ
        </p>
        <p className="text-white leading-relaxed text-center italic">
          "This is the Book about which there is no doubt — a guidance for those who are mindful of God."
        </p>
        <p className="text-amber-400/70 text-center text-xs mt-2">
          — Al-Baqarah 2:2
        </p>
      </div>
    </div>
  );
}

// ========== Animated Checklist for "Prove It" scene ==========
function ProveItScene() {
  const [visibleChecks, setVisibleChecks] = useState(0);

  const checks = [
    'We examined what the Quran says about the human body — confirmed by modern science',
    'We examined what it says about the universe — confirmed by modern science',
    'We examined what it says about the natural world — confirmed by modern science',
    'Zero contradictions over 1400 years — confirmed',
    'One version, unchanged — confirmed',
  ];

  useEffect(() => {
    if (visibleChecks >= checks.length) return;
    const timer = setTimeout(() => setVisibleChecks(prev => prev + 1), 600);
    return () => clearTimeout(timer);
  }, [visibleChecks, checks.length]);

  return (
    <div className="space-y-5">
      <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 text-center">
        <p className="text-2xl text-white font-bold mb-2">
          "You claim to be my Creator?"
        </p>
        <p className="text-amber-200 text-lg">
          Prove it. Show me. Give me evidence.
        </p>
      </div>

      <p className="text-lg text-slate-300 leading-relaxed">
        And that's <span className="text-white font-medium">exactly what we just did</span>.
      </p>

      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <div className="space-y-3">
          {checks.map((check, idx) => (
            <motion.p
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: idx < visibleChecks ? 1 : 0,
                x: idx < visibleChecks ? 0 : -10,
              }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2 text-slate-300 text-sm"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: idx < visibleChecks ? 1 : 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                className="text-emerald-400 mt-0.5 flex-shrink-0"
              >
                &#10003;
              </motion.span>
              {check}
            </motion.p>
          ))}
        </div>
      </div>

      <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
        <p className="text-emerald-200 leading-relaxed text-lg">
          The evidence has been presented.
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
    }

    // Don't play for interactive scenes or scenes with no audio
    if (scene.isInteractive || scene.voiceSource === 'none') return;
    if (audioMuted) return;

    const audio = new Audio(getAudioUrl(scene.id, scene.voiceSource));
    audioRef.current = audio;

    const onPlay = () => setAudioPlaying(true);
    const onEnd = () => setAudioPlaying(false);
    const onPause = () => setAudioPlaying(false);
    const onError = () => setAudioPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    const timer = setTimeout(() => {
      audio.play().catch(() => setAudioPlaying(false));
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

    if (scene.interactiveType === 'quran-exhibits') {
      return (
        <div className="relative">
          {backButton}
          <QuranExhibits onComplete={handleNext} />
        </div>
      );
    }

    if (scene.interactiveType === 'almanac') {
      return (
        <div className="relative">
          {backButton}
          <AlmanacGame onComplete={handleNext} />
        </div>
      );
    }

    if (scene.interactiveType === 'authorship-elimination') {
      return (
        <div className="relative">
          {backButton}
          <AuthorshipElimination onComplete={handleNext} />
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
      case 'the-verdict':
        return <VerdictScene />;
      case 'prove-it':
        return <ProveItScene />;
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
            audioPlaying ? 'text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
          title={audioMuted ? 'Unmute narration' : 'Mute narration'}
        >
          {audioMuted ? (
            <VolumeX className="w-5 h-5" />
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
