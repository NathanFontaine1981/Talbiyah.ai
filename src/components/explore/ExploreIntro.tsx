import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lightbulb, MessageCircle, User, Scale, Gavel, HelpCircle, Heart, Compass, BookOpen, TrendingUp, Users, Frame } from 'lucide-react';
import AlmanacGame from './AlmanacGame';

interface ExploreIntroProps {
  onComplete: () => void;
}

const introScenes = [
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
    id: 'first-things-first',
    title: 'First Things First',
    icon: 'lightbulb',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-xl text-white font-medium leading-relaxed">
            We exist.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            And we know there was a time when we <span className="text-amber-400 font-medium">didn't exist</span>.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed">
              I wasn't here 100 years ago. Neither were you. At some point, we were <span className="text-white font-medium">brought into being</span>.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            So something must have brought us into existence. Because it's <span className="text-white font-medium">impossible</span> for nothingness to create something.
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
    id: 'creator-vs-creation',
    title: 'Creator vs Creation',
    icon: 'scale',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Before we go further, let's define two important words:
          </p>

          <div className="grid gap-4">
            <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
              <h3 className="text-amber-300 font-bold text-lg mb-2">Creation</h3>
              <p className="text-slate-300 leading-relaxed mb-2">
                Anything that was <span className="text-white font-medium">brought into existence</span>.
              </p>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Has a <span className="text-amber-400">beginning</span></li>
                <li>• Is <span className="text-amber-400">in need</span> of something else to exist</li>
                <li>• Cannot bring itself into existence</li>
              </ul>
            </div>

            <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
              <h3 className="text-emerald-300 font-bold text-lg mb-2">Creator</h3>
              <p className="text-slate-300 leading-relaxed mb-2">
                The one who <span className="text-white font-medium">brings things into existence</span>.
              </p>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Has <span className="text-emerald-400">no beginning</span>—always existed</li>
                <li>• Is <span className="text-emerald-400">self-sufficient</span>—not in need of anything</li>
                <li>• Must have always been present</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-300 leading-relaxed">
              If the Creator had a beginning, the Creator would also be a creation—and would need <span className="text-white font-medium">its own</span> creator. But by definition, the Creator is <span className="text-emerald-400 font-medium">uncreated</span>.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Science tells us the universe had a <span className="text-amber-400 font-medium">beginning</span>. It was brought into existence. That means it must have been created by something that was <span className="text-white">already there</span>.
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
            But this question misunderstands what "Creator" means.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
            <p className="text-slate-300 leading-relaxed mb-3">
              It's like asking a man: <span className="text-white font-medium">"When did you give birth to your child?"</span>
            </p>
            <p className="text-slate-400 text-sm">
              The question doesn't apply. Men don't give birth.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Similarly, the Creator <span className="text-white font-medium">by definition</span> is not created. The Creator has no beginning—that's what makes the Creator different from creation.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              <span className="text-white font-medium">Creation</span> is in need. <span className="text-white font-medium">The Creator</span> is self-sufficient.
            </p>
            <p className="text-emerald-300 mt-2">
              The question "who created the Creator" is asking about creation—not the Creator.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            The very existence of the universe—something that began—is proof that something <span className="text-amber-400 font-medium">without a beginning</span> must exist.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'my-story',
    title: 'My Discovery',
    icon: 'user',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          I remember someone telling me: if you found an <span className="text-white font-medium">iPhone in the desert</span>, you would never think it's a product of nature that just came together on its own.
        </p>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-slate-400 text-sm leading-relaxed">
            Calendars. Messages. A camera with great clarity. <span className="text-white">Sophistication doesn't happen by accident.</span>
          </p>
        </div>

        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          So why is it that we look at the <span className="text-amber-400 font-semibold">human body</span> and think it came together without something having created it with thought and design?
        </p>

        <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50 mb-5">
          <p className="text-emerald-200 leading-relaxed">
            <span className="text-white font-medium">Eyes</span> exist to see. <span className="text-white font-medium">Ears</span> exist to hear. <span className="text-white font-medium">Lungs</span> exist to breathe.
          </p>
          <p className="text-emerald-300 leading-relaxed mt-2">
            Every part has a <span className="text-white font-medium">purpose</span>.
          </p>
        </div>

        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          If every <span className="text-amber-400 font-medium">part</span> of you was created for a reason... doesn't it make sense that the <span className="text-white font-medium">whole</span> of you was created for a reason too?
        </p>

        <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
          <p className="text-amber-200 leading-relaxed">
            Otherwise, we have purpose-built parts... assembled for <span className="text-white font-medium">no purpose</span>? That doesn't add up.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'body-evidence',
    title: 'The Evidence Within You',
    icon: 'user',
    content: (
      <>
        <div className="space-y-5">
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

          <p className="text-lg text-slate-300 leading-relaxed">
            You'd have <span className="text-white font-medium">no interest</span> in anything until you knew the destination and why you were on that plane.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              This life is <span className="text-white font-semibold">exactly the same</span>.
            </p>
            <p className="text-emerald-300 mt-2">
              We're on a journey. We need to know where it's heading and why we're here.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            And I found something that claims to be <span className="text-amber-400 font-medium">guidance</span> for us human beings...
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'invitation',
    title: 'The Invitation',
    icon: 'compass',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            So I did some <span className="text-amber-400 font-medium">investigating</span>. Some <span className="text-amber-400 font-medium">verifying</span>.
          </p>

          <p className="text-xl text-white font-medium leading-relaxed">
            And I discovered what I believe to be the answer to the big question—based upon <span className="text-emerald-400 font-semibold">certain knowledge</span>.
          </p>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed text-lg text-center">
              Why are we here?
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            All I ask is that you approach this with an <span className="text-white font-medium">open mind</span>. Not blind acceptance. Not stubborn rejection. Just honest consideration of the evidence.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              Let's examine the evidence together—and see if you come to the <span className="text-white font-semibold">same conclusion</span> as I did.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'almanac',
    title: 'The Almanac Moment',
    icon: 'book',
    isInteractive: true,
    content: null, // Will be rendered separately as interactive
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
    id: 'common-ground',
    title: 'Common Ground',
    icon: 'users',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Before we dive in, let's <span className="text-white font-medium">establish what we both agree on</span>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            I'm not going to bore you with everything. But I think there are certain facts about this world that everyone would have no problem agreeing with.
          </p>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed">
              Until we establish <span className="text-white font-semibold">common ground</span>, we can't really get anywhere.
            </p>
            <p className="text-amber-300 mt-2">
              Let's see if you agree with me on the points I'm about to make.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Then—and only then—can we examine what the Quran says about those very things.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-300 text-sm">
              <span className="text-white font-medium">One truth:</span> Either one religion is true and others are false—or none are true. Let's find out which.
            </p>
          </div>
        </div>
      </>
    ),
    commentary: "The truth reveals itself when you examine it. Falsehood crumbles. That's its nature.",
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
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You are the <span className="text-amber-400 font-semibold">judge and jury</span>. I will present evidence. You will decide.
        </p>
        <p className="text-slate-400 leading-relaxed">
          The claim: This book contains knowledge that could only come from the Creator. The burden of proof is on the Quran.
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
          I will present <span className="text-emerald-400 font-semibold">exhibits</span>—facts most people accept as true. Then the Quran's statements on each.
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

export const ExploreIntro = ({ onComplete }: ExploreIntroProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const scene = introScenes[currentScene];
  const isLastScene = currentScene === introScenes.length - 1;
  const isFirstScene = currentScene === 0;

  const handleNext = () => {
    if (isLastScene) {
      onComplete();
    } else {
      setCurrentScene(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstScene) {
      setCurrentScene(prev => prev - 1);
    }
  };

  // Handle interactive almanac scene
  if (scene.isInteractive && scene.id === 'almanac') {
    return (
      <div className="relative">
        {/* Back button for returning from interactive - positioned below Episodes button */}
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Back button and Progress dots - positioned below the Episodes button */}
      <div className="fixed top-20 left-6 flex items-center gap-4 z-40">
        {!isFirstScene && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        )}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700/50">
          {introScenes.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= currentScene ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Icon - hide for founder-image since image is in content */}
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
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-serif text-white text-center mb-8">
              {scene.title}
            </h1>

            {/* Content */}
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8">
              {scene.content}
            </div>

            {/* Continue button */}
            <div className="flex justify-center mb-6 md:mb-0">
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
              >
                {isLastScene ? "Let's Begin" : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ExploreIntro;
