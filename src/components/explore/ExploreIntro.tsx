import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lightbulb, User, Scale, Gavel, HelpCircle, Compass, BookOpen, TrendingUp, Users, Frame, Brain, Search, Heart, Smartphone, Zap, CheckCircle2, Eye, TreePine } from 'lucide-react';
import AlmanacGame from './AlmanacGame';
import ReasoningTest from './ReasoningTest';

interface ExploreIntroProps {
  onComplete: () => void;
}

// Foundation truths for the interactive builder
const foundationTruthsPart1 = [
  {
    id: 1,
    text: 'We are human beings, and we are alive',
    reflection: 'Can you truly deny that you exist and are alive right now?',
  },
  {
    id: 2,
    text: 'We had a beginning — we were born',
    reflection: 'There was a time when you didn\'t exist. Then you were brought into being.',
  },
  {
    id: 3,
    text: 'We are going to die one day — we don\'t know when or where',
    reflection: 'Every human who has ever lived has died, or will die. This is undeniable.',
  },
  {
    id: 4,
    text: 'We are intelligent beings',
    reflection: 'You\'re reading, understanding, and processing this right now. That\'s intelligence.',
  },
];

const foundationTruthsPart2 = [
  {
    id: 5,
    text: 'We are the most intelligent beings on earth — we can outsmart, capture, and contain any animal no matter how big or dangerous',
    reflection: 'Lions, sharks, elephants — we can contain them all. No other creature rules like we do.',
  },
  {
    id: 6,
    text: 'Our bodies work automatically — heart beats, we heal when cut, hair grows, all without us choosing',
    reflection: 'You didn\'t tell your heart to beat today. You don\'t choose to heal. It just happens.',
  },
  {
    id: 7,
    text: 'We just have to think something and our body does it — move your little toe, pick something up, it just happens',
    reflection: 'Think about moving your finger. It moves. The connection between thought and action is instant.',
  },
  {
    id: 8,
    text: 'There was a beginning to the universe — it hasn\'t always existed',
    reflection: 'Science confirms this. The Big Bang. Before that — nothing. It had a start.',
  },
];

interface IntroScene {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode | null;
  commentary?: string;
  isInteractive?: boolean;
  interactiveType?: 'foundation-1' | 'foundation-2' | 'reasoning-test' | 'almanac';
}

const introScenes: IntroScene[] = [
  // ========== PHASE A: "What We Know For Sure" (Scenes 0-4) ==========
  {
    id: 'welcome',
    title: "A Message From The Founder",
    icon: 'founder-image',
    content: (
      <>
        {/* Founder Image */}
        <div className="flex justify-center mb-6 -mt-2">
          <img
            src="/founder-nathan.jpg"
            alt="Nathan Ellington - Founder of Talbiyah"
            className="w-full max-w-sm rounded-xl shadow-lg"
          />
        </div>
        <div className="space-y-4">
          <p className="text-xl text-white font-medium leading-relaxed">
            My duty is to convey the message that I found.
          </p>

          {/* Ayah */}
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
    commentary: "I'm not here to convince you. I'm here to share what I discovered. The rest is between you and your Creator.",
  },
  {
    id: 'what-we-know',
    title: 'What Do We All Know For Sure?',
    icon: 'lightbulb',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-xl text-white font-medium leading-relaxed">
            Before I share anything with you, let's start with what every single human being on this earth already knows.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            Not opinions. Not beliefs. Not theories.
          </p>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed text-lg">
              <span className="text-white font-semibold">Facts</span> that no one — regardless of their religion, culture, or background — can deny.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            I want to build a <span className="text-emerald-400 font-medium">foundation</span> with you. Things we both agree on. Things that will never change.
          </p>

          <p className="text-slate-400 leading-relaxed">
            Once we have that foundation, everything else becomes clearer.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'foundation-part-1',
    title: 'The Foundation — Part 1',
    icon: 'foundation',
    content: null,
    isInteractive: true,
    interactiveType: 'foundation-1',
  },
  {
    id: 'foundation-part-2',
    title: 'The Foundation — Part 2',
    icon: 'foundation',
    content: null,
    isInteractive: true,
    interactiveType: 'foundation-2',
  },
  {
    id: 'your-foundation',
    title: 'Your Foundation',
    icon: 'check',
    content: null, // Rendered dynamically to show all 8 truths
  },

  // ========== PHASE B: "Test Your Thinking" (Scenes 5-7) ==========
  {
    id: 'reasoning-setup',
    title: 'Test Your Thinking',
    icon: 'brain',
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
    content: null,
    isInteractive: true,
    interactiveType: 'reasoning-test',
  },
  {
    id: 'you-proved-something',
    title: 'You Just Proved Something',
    icon: 'brain',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-xl text-white font-medium leading-relaxed">
            You didn't guess. You didn't go with your feelings.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            You used <span className="text-amber-400 font-semibold">evidence</span> to eliminate the impossible and narrow down to what's possible.
          </p>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed text-lg text-center">
              This is exactly how we should approach the biggest question of all:
            </p>
            <p className="text-3xl text-white font-bold text-center mt-3">
              Why are we here?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            You've already agreed that you exist, you had a beginning, and you're going to die. You've just proved you can think critically.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              Now let's apply the <span className="text-white font-semibold">same brain</span> you just used to life's biggest question.
            </p>
          </div>
        </div>
      </>
    ),
  },

  // ========== PHASE C: "Apply Your Logic" (Scenes 8-15) ==========
  {
    id: 'something-brought-us-here',
    title: 'Something Brought Us Here',
    icon: 'lightbulb',
    content: (
      <>
        <div className="space-y-5">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Remember, you agreed:</p>
            <p className="text-white leading-relaxed">
              We exist. We had a beginning. We didn't choose to be here.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            So <span className="text-white font-medium">something</span> must have brought us into existence. Because it's impossible for nothing to create something.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center">
            <p className="text-4xl text-white font-bold mb-2">
              0 + 0 = 0
            </p>
            <p className="text-slate-400 text-sm">
              Nothing plus nothing equals nothing.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            So how can <span className="text-amber-400 font-medium">no intelligence</span> create <span className="text-white font-medium">intelligence</span>?
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            Surely something <span className="text-emerald-400 font-semibold">more intelligent</span> created all the intelligence and sophistication we see around us.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'phone-in-desert',
    title: 'The Phone in the Desert',
    icon: 'smartphone',
    content: null, // Rendered dynamically for interactivity
  },
  {
    id: 'body-evidence',
    title: 'The Evidence Within You',
    icon: 'user',
    content: (
      <>
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

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
              <span className="text-2xl">👁️</span> Your Eyes
            </h3>
            <p className="text-slate-300 leading-relaxed">
              576 megapixels. Auto-focus in milliseconds. Self-cleaning. Adjusts to light instantly. Works for <span className="text-white font-medium">80+ years</span> without replacement.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              No camera company has come close. And we have two of them.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
              <span className="text-2xl">🩹</span> Your Body
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Cut yourself—it heals. Break a bone—it repairs. Get sick—your immune system <span className="text-white font-medium">fights back automatically</span>.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              No machine fixes itself. Your body does it without you even thinking.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
              <span className="text-2xl">🧠</span> Your Brain
            </h3>
            <p className="text-slate-300 leading-relaxed">
              86 billion neurons. Stores a lifetime of memories. Processes emotions, language, creativity, and <span className="text-white font-medium">consciousness itself</span>.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              The most powerful supercomputers still can't replicate what sits between your ears.
            </p>
          </div>

          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              All of this... by <span className="text-white font-medium">accident</span>? Or by <span className="text-emerald-400 font-semibold">design</span>?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            The evidence points to a <span className="text-white font-medium">system</span>. Order. Precision. Purpose.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'what-we-observe',
    title: 'What We See Around Us',
    icon: 'tree',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            It's not just our bodies. Look at the <span className="text-amber-400 font-medium">world around you</span>:
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-white font-medium mb-1">Day and Night</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every ~24 hours, like clockwork. The sun rises, the sun sets. Light, then dark. Calculated. Precise. Never misses.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-white font-medium mb-1">The Seasons</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Summer — things grow, blossom, come alive. Winter — leaves fall, things appear dead. But they're not gone forever. When it warms up again, it all comes back. A cycle. Designed.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-white font-medium mb-1">Reproduction</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                A baby comes from a man and a woman. It grows inside the mother through stages — from nothing visible to a full human being. We didn't design this process. It just works.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-white font-medium mb-1">Ecosystems</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Communities of bees, colonies of ants — each with roles, systems, order. The entire natural world runs with a precision that we observe but didn't create.
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Through <span className="text-white font-medium">observation</span>, we collect data, we understand patterns. That's what we do as intelligent beings — we observe and we work things out.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              And everything we observe points to <span className="text-white font-semibold">order</span>, <span className="text-white font-semibold">systems</span>, and <span className="text-white font-semibold">design</span>. Not chaos. Not randomness.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'something-different',
    title: 'Something Different About Us',
    icon: 'heart',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Animals live by <span className="text-amber-400 font-medium">survival of the fittest</span>. Kill or be killed. The lion doesn't feel guilt after a hunt. It's just survival.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            But human beings? We're <span className="text-white font-medium">different</span>.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-white font-medium text-lg mb-3">We have things inside us that animals don't:</p>
            <div className="space-y-2">
              <p className="text-slate-300 leading-relaxed">
                A sense of <span className="text-amber-400 font-medium">justice</span> — we know when something is wrong, even when it doesn't affect us personally.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <span className="text-amber-400 font-medium">Love</span> — not just instinct, but deep, conscious love for people.
              </p>
              <p className="text-slate-300 leading-relaxed">
                A desire to be <span className="text-amber-400 font-medium">good</span> — to help, to be fair, to be kind. Why? Where does that come from?
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            We see injustice happen around the world — people harmed for no reason, property taken, the powerful exploiting the weak — and something <span className="text-white font-medium">inside us</span> says: <span className="text-amber-400 font-medium">"That's wrong."</span>
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            Where did that come from? How do we just <span className="text-white font-medium">have</span> justice inside of us? How do we just <span className="text-white font-medium">have</span> love?
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              There are so many things <span className="text-white font-semibold">common between all human beings</span> — across every culture, every continent, every era. We all share a sense of right and wrong. That's not random. That's built in.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'creator-vs-creation',
    title: 'Creator vs Creation',
    icon: 'scale',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Science tells us the universe had a <span className="text-amber-400 font-medium">beginning</span>.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed">
              The Big Bang. A moment when space, time, and matter came into existence. Before that—<span className="text-white font-medium">nothing</span>.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            If the universe was <span className="text-amber-400 font-medium">brought into existence</span>, then it is a <span className="text-white font-medium">creation</span>.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            And every creation needs something to create it—something that was <span className="text-emerald-400 font-medium">already there</span>.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              The universe didn't create itself. It couldn't have—because it didn't exist yet.
            </p>
            <p className="text-emerald-300 mt-3">
              Something <span className="text-white font-semibold">outside</span> the universe must have brought it into being.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Whatever that something is, must be the <span className="text-emerald-400 font-semibold">Creator</span>.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'the-question-redundant',
    title: 'Who Created the Creator?',
    icon: 'question',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Some ask: <span className="text-amber-400 font-medium">"If everything needs a creator, who created the Creator?"</span>
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            But I came to the conclusion that this question misunderstands what "Creator" means. Let me define two words:
          </p>

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

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed mb-3">
              Asking "who created the Creator" is like asking a man: <span className="text-white font-medium">"When did you give birth to your child?"</span>
            </p>
            <p className="text-slate-400 text-sm">
              The question doesn't apply. Men don't give birth. Creators aren't created.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            The question "who created the Creator" is really asking about <span className="text-amber-400 font-medium">creation</span>—not the Creator.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'picture-on-wall',
    title: 'The Picture on the Wall',
    icon: 'frame',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Imagine you need to hang a <span className="text-white font-medium">picture on the wall</span>, but you can't do it alone.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
            <p className="text-slate-300 leading-relaxed">
              You ask <span className="text-amber-400">Person A</span> for help. They say: "I can help, but only if someone helps me first."
            </p>
            <p className="text-slate-300 leading-relaxed">
              So you ask <span className="text-amber-400">Person B</span>. Same answer: "I can help, but only if someone helps me first."
            </p>
            <p className="text-slate-300 leading-relaxed">
              And <span className="text-amber-400">Person C</span>... and <span className="text-amber-400">Person D</span>... all the same.
            </p>
          </div>

          <p className="text-lg text-white font-medium leading-relaxed">
            If this chain goes on forever, the picture would never get on the wall.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed mb-3">
              But the picture <span className="text-white font-bold">is</span> on the wall. The universe <span className="text-white font-bold">does</span> exist.
            </p>
            <p className="text-emerald-300 leading-relaxed">
              That means at some point, there must be someone who <span className="text-white font-medium">doesn't need help</span>—someone self-sufficient who can act without depending on another.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            That is the <span className="text-emerald-400 font-semibold">Creator</span>. Otherwise, you're forever relying on creation—and the picture never goes up.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'what-are-you-for',
    title: 'But What Are You For?',
    icon: 'user',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Ask yourself about any body part and you know the answer:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
              <p className="text-white text-sm font-medium">Feet</p>
              <p className="text-slate-500 text-xs">To walk</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
              <p className="text-white text-sm font-medium">Eyes</p>
              <p className="text-slate-500 text-xs">To see</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
              <p className="text-white text-sm font-medium">Ears</p>
              <p className="text-slate-500 text-xs">To hear</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
              <p className="text-white text-sm font-medium">Hands</p>
              <p className="text-slate-500 text-xs">To feel and hold</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
              <p className="text-white text-sm font-medium">Nose</p>
              <p className="text-slate-500 text-xs">To smell</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-center">
              <p className="text-white text-sm font-medium">Lungs</p>
              <p className="text-slate-500 text-xs">To breathe</p>
            </div>
          </div>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 text-center">
            <p className="text-amber-200 leading-relaxed text-xl font-medium">
              But what are <span className="text-white font-bold">you</span> for?
            </p>
            <p className="text-amber-300 mt-2">
              What are we doing here? Why do we have all these faculties?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            We didn't make our own faculties. We didn't design our eyes or choose to have a heartbeat. <span className="text-white font-medium">Something gave us all of this.</span>
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed mb-3">
              Imagine a <span className="text-white font-medium">Boeing 747</span>. All those buttons, the engines, the fuel system. It tells you exactly how far it can fly, what fuel it takes, how long before it needs refuelling.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Would you ever believe the wind blew, the sand shifted, metal dropped from the sky, and it just <span className="text-amber-400 font-medium">assembled itself</span> into a working aeroplane?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            You'd say that's <span className="text-white font-medium">impossible</span>. And you'd be right. We never come to that conclusion in <span className="text-amber-400 font-medium">any</span> area of life. So why would we think differently about ourselves?
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              That's why the majority of human beings throughout history have come to the same conclusion: <span className="text-white font-semibold">something created us</span>.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'the-plane',
    title: 'The Plane',
    icon: 'compass',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            We find ourselves living in this world. We <span className="text-amber-400 font-medium">didn't decide</span> to be here. We <span className="text-amber-400 font-medium">didn't choose</span> to be here. But here we are.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            And we know one thing for sure: one day, we are going to <span className="text-white font-medium">pass away</span>. We don't know when—but it's certain.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            So the question is: <span className="text-amber-400 font-medium">is that the end?</span> Do we just live, do what we want, die, and that's it — nothing afterwards? Or does what we do in our lives actually <span className="text-white font-medium">matter</span>?
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed mb-3">
              Imagine you <span className="text-white font-medium">wake up on a plane</span>. You don't know how you got there.
            </p>
            <p className="text-slate-300 leading-relaxed">
              What would you immediately think?
            </p>
            <ul className="mt-3 space-y-2 text-slate-400">
              <li>• What am I doing on this plane?</li>
              <li>• Where is it heading?</li>
              <li>• How did I get on here?</li>
            </ul>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            It would be <span className="text-amber-400 font-medium">strange</span> to just turn on the TV, order some food, and enjoy yourself—without knowing what's happening or where you're going.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed text-lg">
              <span className="text-white font-semibold">This is us.</span>
            </p>
            <p className="text-emerald-300 mt-3 leading-relaxed">
              We're on a journey we didn't choose, heading towards an end we can't escape. Every part of us has <span className="text-white font-medium">clear purpose</span>. So surely the whole of us has a purpose too.
            </p>
            <p className="text-emerald-200 mt-3 leading-relaxed">
              The answer <span className="text-white font-semibold">must exist</span>. It's up to us to find it.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'answer-must-exist',
    title: 'The Answer Must Exist',
    icon: 'lightbulb',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            So if we establish that something <span className="text-white font-medium">more intelligent than us</span> created us and this universe, for a <span className="text-amber-400 font-medium">reason</span>...
          </p>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed text-lg">
              Would it really create us and then <span className="text-white font-semibold">not tell us why</span>?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            That doesn't make sense. If something created you with <span className="text-white font-medium">purpose-built parts</span> — eyes to see, ears to hear, a brain to think, a heart that beats on its own — it clearly had a plan.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            And if it had a plan, it must have <span className="text-amber-400 font-medium">communicated</span> that plan. Otherwise, what's the point?
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              The <span className="text-white font-semibold">answer must be here</span> — somewhere in the world. It's up to us to find it. And that's exactly what I set out to do.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'invitation',
    title: 'The Claim',
    icon: 'book',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            So I did some <span className="text-amber-400 font-medium">investigating</span>. And I found a claim.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            There is one source — the <span className="text-white font-semibold">Quran</span> — that claims to be from the One who created us. And it doesn't just say "believe." It says: <span className="text-amber-400 font-medium">here's why you're here, here's what happens when you die, and here's how to live</span>.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-white font-medium mb-3">It claims to contain:</p>
            <div className="space-y-2 text-slate-300 text-sm">
              <p>• Why you were created and your purpose</p>
              <p>• What happened to people before us</p>
              <p>• What happens when you die — and what comes after</p>
              <p>• How the world was created</p>
              <p>• Laws for living — inheritance, family, food, business</p>
              <p>• Morals, justice, how to treat your parents and spouse</p>
              <p>• A complete <span className="text-amber-400 font-medium">code of life</span></p>
            </div>
          </div>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed text-lg">
              That's a bold claim. So we need to <span className="text-white font-semibold">examine it</span>.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'examine-the-claim',
    title: 'Where Did This Book Come From?',
    icon: 'search',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            If you find a <span className="text-white font-medium">book on the floor</span>, there are only a few possibilities for where it came from:
          </p>

          <div className="space-y-2">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-300 text-sm"><span className="text-amber-400 font-medium">Option 1:</span> One human being wrote it</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-300 text-sm"><span className="text-amber-400 font-medium">Option 2:</span> A group of human beings wrote it</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-300 text-sm"><span className="text-amber-400 font-medium">Option 3:</span> It came from something else — the Creator</p>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Now consider this: the Quran came over <span className="text-white font-medium">1,400 years ago</span>.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed mb-3">
              Imagine someone from back then hearing a conversation from today — phones, AI, flying across the world in hours. They wouldn't understand a word.
            </p>
            <p className="text-slate-400 text-sm">
              <span className="text-white">"I'll fly to that country and be there in half an hour"</span> — they'd say: "Only birds fly. How can humans fly?"
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            So if this book from 1,400 years ago contains information that <span className="text-amber-400 font-medium">couldn't have been known</span> at that time — but we've since discovered to be true — that tells us something.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              Let's <span className="text-white font-semibold">cross-check</span> what it says with what we now know for sure. Let's see if this book really talks as if its Author <span className="text-white font-semibold">knows everything</span> — or if it makes mistakes along the way.
            </p>
          </div>

          <p className="text-slate-400 leading-relaxed">
            All I ask is an <span className="text-white font-medium">open mind</span>. Not blind acceptance. Not stubborn rejection. Just honest examination of the evidence.
          </p>
        </div>
      </>
    ),
  },

  // ========== PHASE D: "The Evidence Begins" (Scenes 16-19) ==========
  {
    id: 'almanac',
    title: 'The Almanac Moment',
    icon: 'book',
    isInteractive: true,
    interactiveType: 'almanac',
    content: null,
    commentary: "It felt like reading tomorrow's sports results. How could someone know this before it was discovered?",
  },
  {
    id: 'beliefs-change',
    title: 'Beliefs Change With Evidence',
    icon: 'trending',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Think about it—<span className="text-white font-medium">we update our beliefs all the time</span> when new evidence comes in.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-sm">
                <span className="text-white">Before telephones:</span> "Talk to someone miles away? Impossible."
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-sm">
                <span className="text-white">Before planes:</span> "Humans flying through the sky? Ridiculous."
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-sm">
                <span className="text-white">Before Concorde:</span> "London to New York in 3 hours? Unbelievable."
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            The <span className="text-amber-400 font-medium">impossible</span> became <span className="text-emerald-400 font-medium">possible</span>. Then it became <span className="text-white">normal</span>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            We all carry beliefs right now. The question is—are we willing to examine them when evidence is presented?
          </p>
        </div>
      </>
    ),
    commentary: "What we believe today might change tomorrow—if we're honest enough to look at the evidence.",
  },
  {
    id: 'court-session',
    title: 'Court Is Now In Session',
    icon: 'gavel',
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
        <p className="text-lg text-slate-300 leading-relaxed">
          You are the <span className="text-amber-400 font-semibold">judge and jury</span>. I will present evidence. You will decide.
        </p>
      </>
    ),
    commentary: "Every person should examine the evidence for themselves. Today, you're the jury.",
  },
  {
    id: 'rules',
    title: 'The Process',
    icon: 'scale',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          I will present <span className="text-emerald-400 font-semibold">exhibits</span>—facts that I believe everyone should agree on. Then the Quran's statements on each.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Your duty: examine each piece of evidence with an <span className="text-blue-400 font-semibold">open mind</span>. Accept what convinces you. Question what doesn't.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          At the end, you will deliver your verdict. <span className="text-amber-400 font-medium">Is this book from the Creator—or isn't it?</span>
        </p>
      </>
    ),
    commentary: "I genuinely believe I found something life-changing. Let's begin.",
  },
];

// ========== Foundation Builder Component ==========
function FoundationBuilder({
  truths,
  previousTruths,
  onComplete,
}: {
  truths: typeof foundationTruthsPart1;
  previousTruths: typeof foundationTruthsPart1;
  onComplete: () => void;
}) {
  const [agreedTruths, setAgreedTruths] = useState<number[]>([]);
  const [currentTruthIndex, setCurrentTruthIndex] = useState(0);
  const [showReflection, setShowReflection] = useState(false);

  const currentTruth = truths[currentTruthIndex];
  const allAgreed = agreedTruths.length === truths.length;

  const handleAgree = () => {
    setAgreedTruths(prev => [...prev, currentTruth.id]);
    setShowReflection(false);
    if (currentTruthIndex < truths.length - 1) {
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
          <h1 className="text-3xl font-serif text-white mb-2">
            {previousTruths.length > 0 ? 'The Foundation — Part 2' : 'The Foundation — Part 1'}
          </h1>
          <p className="text-slate-400 text-sm">
            {agreedTruths.length + previousTruths.length} of {truths.length + previousTruths.length} truths confirmed
          </p>
        </div>

        {/* Foundation stack — previously agreed truths */}
        {previousTruths.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {previousTruths.map((truth) => (
              <motion.div
                key={truth.id}
                className="bg-emerald-900/15 rounded-lg px-4 py-2 border border-emerald-800/30 flex items-center gap-2 opacity-60"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-400/70 text-sm">{truth.text}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Foundation stack — current round agreed truths */}
        <div className="mb-6 space-y-2">
          {truths
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
                  <span className="text-emerald-400 font-medium">#{previousTruths.length + index + 1}:</span> {truth.text}
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
                Truth #{previousTruths.length + currentTruthIndex + 1}
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

        {/* All agreed — continue */}
        {allAgreed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mb-6">
              <p className="text-emerald-200 text-lg leading-relaxed">
                {previousTruths.length > 0
                  ? "You've confirmed all 8 truths. Your foundation is complete."
                  : "Great. Let's keep building."}
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

// ========== Phone in Desert Interactive Scene ==========
function PhoneInDesert({ onComplete }: { onComplete: () => void }) {
  const [answered, setAnswered] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <p className="text-slate-400 text-sm mb-1">Remember, you agreed:</p>
        <p className="text-white leading-relaxed">
          Our bodies work automatically. We think and our body acts. We heal without choosing to.
        </p>
      </div>

      <p className="text-lg text-slate-300 leading-relaxed">
        Imagine you're walking through a <span className="text-amber-400 font-medium">desert</span>. Nothing around for miles. Just sand.
      </p>

      <p className="text-lg text-slate-300 leading-relaxed">
        Then you find a <span className="text-white font-medium">smartphone</span> lying on the ground.
      </p>

      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
        <Smartphone className="w-16 h-16 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-300 text-sm">
          Calendars. Messages. A camera with incredible clarity. Apps. Precision engineering.
        </p>
      </div>

      {!answered ? (
        <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
          <p className="text-amber-200 leading-relaxed text-lg text-center mb-4">
            Did this phone design itself?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setAnswered(true); onComplete(); }}
              className="px-6 py-3 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 rounded-xl font-medium transition"
            >
              No, obviously not
            </button>
            <button
              onClick={() => { setAnswered(true); onComplete(); }}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition"
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed text-lg">
              Exactly. Whenever you see <span className="text-white font-semibold">design</span>, you know there's a <span className="text-white font-semibold">designer</span>.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            That phone is <span className="text-amber-400 font-medium">infinitely less complex</span> than the human eye alone. Let alone the entire human body.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            So why would we look at something <span className="text-white font-medium">far more sophisticated</span>—a body that heals itself, a brain that thinks, eyes that see—and conclude it has <span className="text-amber-400 font-medium">no designer</span>?
          </p>

          <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed">
              If every <span className="text-white font-medium">part</span> of you was created for a reason... doesn't it make sense that the <span className="text-white font-medium">whole</span> of you was created for a reason too?
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ========== Your Foundation Recap Scene ==========
function FoundationRecap({ onComplete }: { onComplete: () => void }) {
  const allTruths = [...foundationTruthsPart1, ...foundationTruthsPart2];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-3xl font-serif text-white text-center mb-8">Your Foundation</h1>

        <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-700 mb-6">
          <div className="space-y-2">
            {allTruths.map((truth, index) => (
              <motion.div
                key={truth.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-700/40 flex items-start gap-3"
              >
                <span className="text-emerald-400 font-bold text-sm mt-0.5 flex-shrink-0">#{truth.id}</span>
                <p className="text-emerald-200 text-sm leading-relaxed">{truth.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-700 mb-8">
          <p className="text-white text-lg leading-relaxed mb-2">
            These are things you've confirmed you know to be true.
          </p>
          <p className="text-slate-300 leading-relaxed">
            They will never change. You can always stand on them.
          </p>
          <p className="text-amber-400 leading-relaxed mt-3 font-medium">
            Now... let's put your thinking to the test.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onComplete}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== Main ExploreIntro Component ==========
export const ExploreIntro = ({ onComplete }: ExploreIntroProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [phoneAnswered, setPhoneAnswered] = useState(false);
  const scene = introScenes[currentScene];
  const isLastScene = currentScene === introScenes.length - 1;
  const isFirstScene = currentScene === 0;

  const handleNext = useCallback(() => {
    if (isLastScene) {
      onComplete();
    } else {
      setCurrentScene(prev => prev + 1);
    }
  }, [isLastScene, onComplete]);

  const handleBack = () => {
    if (!isFirstScene) {
      // Skip back over interactive scenes to their preceding scene
      const prevIndex = currentScene - 1;
      const prevScene = introScenes[prevIndex];
      if (prevScene?.isInteractive) {
        // Go back one more to the scene before the interactive
        setCurrentScene(Math.max(0, prevIndex - 1));
      } else {
        setCurrentScene(prevIndex);
      }
    }
  };

  // Handle interactive scenes
  if (scene.isInteractive) {
    if (scene.interactiveType === 'foundation-1') {
      return (
        <div className="relative">
          <div className="fixed top-20 left-6 z-40">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>
          <FoundationBuilder
            truths={foundationTruthsPart1}
            previousTruths={[]}
            onComplete={handleNext}
          />
        </div>
      );
    }

    if (scene.interactiveType === 'foundation-2') {
      return (
        <div className="relative">
          <div className="fixed top-20 left-6 z-40">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>
          <FoundationBuilder
            truths={foundationTruthsPart2}
            previousTruths={foundationTruthsPart1}
            onComplete={handleNext}
          />
        </div>
      );
    }

    if (scene.interactiveType === 'reasoning-test') {
      return (
        <div className="relative">
          <div className="fixed top-20 left-6 z-40">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>
          <ReasoningTest onComplete={handleNext} />
        </div>
      );
    }

    if (scene.interactiveType === 'almanac') {
      return (
        <div className="relative">
          <div className="fixed top-20 left-6 z-40">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>
          <AlmanacGame onComplete={handleNext} />
        </div>
      );
    }
  }

  // Handle "Your Foundation" recap scene
  if (scene.id === 'your-foundation') {
    return (
      <div className="relative">
        <div className="fixed top-20 left-6 z-40">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>
        <FoundationRecap onComplete={handleNext} />
      </div>
    );
  }

  // Handle "Phone in Desert" interactive scene
  const isPhoneScene = scene.id === 'phone-in-desert';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Progress indicator */}
      <div className="fixed top-20 left-6 z-40">
        <div className="bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-1.5">
            {introScenes.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i <= currentScene ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
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
            {/* Icon */}
            {scene.icon !== 'founder-image' && (
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                  {scene.icon === 'welcome' && <Heart className="w-10 h-10 text-emerald-400" />}
                  {scene.icon === 'question' && <HelpCircle className="w-10 h-10 text-purple-400" />}
                  {scene.icon === 'user' && <User className="w-10 h-10 text-emerald-400" />}
                  {scene.icon === 'compass' && <Compass className="w-10 h-10 text-blue-400" />}
                  {scene.icon === 'book' && <BookOpen className="w-10 h-10 text-amber-400" />}
                  {scene.icon === 'trending' && <TrendingUp className="w-10 h-10 text-emerald-400" />}
                  {scene.icon === 'users' && <Users className="w-10 h-10 text-cyan-400" />}
                  {scene.icon === 'gavel' && <Gavel className="w-10 h-10 text-amber-400" />}
                  {scene.icon === 'scale' && <Scale className="w-10 h-10 text-blue-400" />}
                  {scene.icon === 'lightbulb' && <Lightbulb className="w-10 h-10 text-amber-400" />}
                  {scene.icon === 'frame' && <Frame className="w-10 h-10 text-teal-400" />}
                  {scene.icon === 'brain' && <Brain className="w-10 h-10 text-purple-400" />}
                  {scene.icon === 'search' && <Search className="w-10 h-10 text-amber-400" />}
                  {scene.icon === 'smartphone' && <Smartphone className="w-10 h-10 text-slate-400" />}
                  {scene.icon === 'check' && <CheckCircle2 className="w-10 h-10 text-emerald-400" />}
                  {scene.icon === 'zap' && <Zap className="w-10 h-10 text-amber-400" />}
                  {scene.icon === 'heart' && <Heart className="w-10 h-10 text-rose-400" />}
                  {scene.icon === 'tree' && <TreePine className="w-10 h-10 text-emerald-400" />}
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-serif text-white text-center mb-8">
              {scene.title}
            </h1>

            {/* Content */}
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
              {isPhoneScene ? (
                <PhoneInDesert onComplete={() => setPhoneAnswered(true)} />
              ) : (
                scene.content
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed bottom navigation bar */}
      {(
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
              disabled={isPhoneScene && !phoneAnswered}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition ${
                isPhoneScene && !phoneAnswered
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isLastScene ? "Let's Begin" : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ExploreIntro;
