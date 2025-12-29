import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Atom, Heart, Leaf, Sparkles, ChevronRight, BookOpen, TrendingUp, DollarSign, Brain, Zap, Clock, ExternalLink, Play } from 'lucide-react';

interface AxiomCheckProps {
  onComplete: (agreedAxioms: string[]) => void;
}

// Categories of undeniable knowledge
const categories = [
  {
    id: 'cosmic',
    name: 'The Cosmic Reality',
    subtitle: 'The Stage',
    icon: <Atom className="w-6 h-6" />,
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
  },
  {
    id: 'biological',
    name: 'The Biological Reality',
    subtitle: 'The Machine',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
  },
  {
    id: 'natural',
    name: 'The Natural Order',
    subtitle: 'The Ecosystem',
    icon: <Leaf className="w-6 h-6" />,
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
  },
  {
    id: 'human',
    name: 'The Human Condition',
    subtitle: 'The Soul',
    icon: <Heart className="w-6 h-6" />,
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-400',
  },
];

// The Axioms - Undeniable facts organized by category
const axioms = [
  // COSMIC REALITY
  {
    id: 'big-bang',
    category: 'cosmic',
    fact: 'The universe had a beginning',
    detail: 'The Big Bang: Everything emerged from a single point. The universe was not always here.',
    discoveredYear: 1927,
    discoveredBy: 'Georges Lemaître',
    discoveryNote: 'Belgian physicist proposed the "primeval atom" theory, later confirmed by Hubble\'s observations.',
  },
  {
    id: 'universe-expansion',
    category: 'cosmic',
    fact: 'The universe is expanding',
    detail: 'Space itself is stretching. Galaxies are moving apart from each other.',
    discoveredYear: 1929,
    discoveredBy: 'Edwin Hubble',
    discoveryNote: 'Observed redshift in distant galaxies, proving the universe is expanding in all directions.',
  },
  {
    id: 'earth-sphere',
    category: 'cosmic',
    fact: 'The Earth is spherical',
    detail: 'Not flat. Observable from space and through physics.',
    discoveredYear: -330,
    discoveredBy: 'Aristotle (confirmed)',
    discoveryNote: 'Ancient Greeks observed ships disappearing hull-first over the horizon. Confirmed by Magellan\'s voyage (1522).',
  },
  {
    id: 'sun-moon-light',
    category: 'cosmic',
    fact: 'The Sun generates light; the Moon reflects it',
    detail: 'The Sun is a source of heat and light. The Moon has no light of its own.',
    discoveredYear: -450,
    discoveredBy: 'Anaxagoras',
    discoveryNote: 'Greek philosopher first proposed the Moon reflects sunlight. Galileo confirmed via telescope (1609).',
  },
  {
    id: 'day-night',
    category: 'cosmic',
    fact: 'Day and night alternate with precision',
    detail: 'This cycle is predictable and mathematically precise.',
    discoveredYear: -3000,
    discoveredBy: 'Ancient civilizations',
    discoveryNote: 'Egyptians, Babylonians tracked cycles. Earth\'s rotation proven by Foucault pendulum (1851).',
  },
  {
    id: 'water-life',
    category: 'cosmic',
    fact: 'Water is essential for all life',
    detail: 'Every known living thing requires water to survive.',
    discoveredYear: 1930,
    discoveredBy: 'Modern biochemistry',
    discoveryNote: 'NASA\'s "follow the water" strategy. All known life requires liquid water for biochemical reactions.',
  },

  // BIOLOGICAL REALITY
  {
    id: 'born-helpless',
    category: 'biological',
    fact: 'We are born helpless',
    detail: 'Humans did not create themselves. We arrive completely dependent.',
    discoveredYear: 1944,
    discoveredBy: 'Adolf Portmann',
    discoveryNote: 'Swiss zoologist documented "physiological prematurity" - humans are born 12 months early compared to other primates.',
  },
  {
    id: 'death-certain',
    category: 'biological',
    fact: 'Death is inevitable',
    detail: 'Every living thing dies. No exceptions.',
    discoveredYear: 1961,
    discoveredBy: 'Leonard Hayflick',
    discoveryNote: 'Discovered the "Hayflick limit" - human cells can only divide 40-60 times before death.',
  },
  {
    id: 'embryo-stages',
    category: 'biological',
    fact: 'Human formation follows specific stages in the womb',
    detail: 'Drop of fluid → clinging substance → lump → bones → flesh covers bones.',
    discoveredYear: 1940,
    discoveredBy: 'Keith Moore',
    discoveryNote: 'Modern embryology confirmed: zygote → blastocyst → embryo with somites → skeleton → muscles cover bones.',
    videoUrl: 'https://archive.org/details/EmbryologyInTheQuranByDr.KeithL.MooreYouTube',
    videoTitle: 'Dr. Keith Moore on Embryology in the Quran',
  },
  {
    id: 'body-heals',
    category: 'biological',
    fact: 'The body heals itself',
    detail: 'Cuts clot, bones knit, cells regenerate—without conscious command.',
    discoveredYear: 1882,
    discoveredBy: 'Élie Metchnikoff',
    discoveryNote: 'Discovered phagocytosis - immune cells automatically engulf pathogens. Won Nobel Prize 1908.',
  },
  {
    id: 'fingerprints',
    category: 'biological',
    fact: 'Every human has unique fingerprints',
    detail: 'No two people share the same fingerprint pattern.',
    discoveredYear: 1892,
    discoveredBy: 'Sir Francis Galton',
    discoveryNote: 'Proved fingerprint uniqueness statistically. Even identical twins have different fingerprints.',
  },
  {
    id: 'skin-pain',
    category: 'biological',
    fact: 'Pain receptors are located in the skin',
    detail: 'When skin is destroyed (3rd-degree burns), we feel no pain there.',
    discoveredYear: 1906,
    discoveredBy: 'Charles Sherrington',
    discoveryNote: 'Mapped nociceptors (pain receptors) in skin. Deep burns destroy these receptors, causing numbness.',
  },

  // NATURAL ORDER
  {
    id: 'male-female',
    category: 'natural',
    fact: 'Reproduction requires male and female',
    detail: 'The human race continues through this duality.',
    discoveredYear: 1677,
    discoveredBy: 'Antonie van Leeuwenhoek',
    discoveryNote: 'First observed sperm cells under microscope. Egg cell discovered by Karl Ernst von Baer (1827).',
  },
  {
    id: 'baby-instinct',
    category: 'natural',
    fact: 'Babies instinctively know how to nurse',
    detail: 'No one teaches them—they know immediately after birth.',
    discoveredYear: 1952,
    discoveredBy: 'Konrad Lorenz',
    discoveryNote: 'Documented innate behaviors in newborns. Rooting and sucking reflexes are hardwired at birth.',
  },
  {
    id: 'parent-protection',
    category: 'natural',
    fact: 'Parents have an innate drive to protect their young',
    detail: 'This is hormonal and instinctive, seen across all mammals.',
    discoveredYear: 1979,
    discoveredBy: 'C. Sue Carter',
    discoveryNote: 'Discovered oxytocin\'s role in parent-child bonding and protective instincts.',
  },
  {
    id: 'seasons-cycle',
    category: 'natural',
    fact: 'Nature follows cycles of life, death, and resurrection',
    detail: 'Spring → Summer → Autumn → Winter → Spring again.',
    discoveredYear: 1543,
    discoveredBy: 'Copernicus',
    discoveryNote: 'Earth\'s axial tilt (23.5°) causes seasons. Plants die and regenerate annually.',
  },
  {
    id: 'animal-intelligence',
    category: 'natural',
    fact: 'Animals have complex intelligence',
    detail: 'Ants build colonies. Bees communicate through dance. Many exceed human senses.',
    discoveredYear: 1973,
    discoveredBy: 'Karl von Frisch',
    discoveryNote: 'Won Nobel Prize for decoding bee "waggle dance" communication. Ants farm fungi, wage wars.',
  },

  // HUMAN CONDITION
  {
    id: 'moral-compass',
    category: 'human',
    fact: 'We have an innate sense of fairness',
    detail: 'Even children feel anger at injustice. We know right from wrong.',
    discoveredYear: 2007,
    discoveredBy: 'Yale Infant Cognition Center',
    discoveryNote: 'Babies as young as 3 months prefer "helper" puppets over "hinderers" - morality is innate.',
  },
  {
    id: 'emotions-real',
    category: 'human',
    fact: 'Emotions are real but not physical',
    detail: 'Love, anger, jealousy, mercy—states of the soul, not objects.',
    discoveredYear: 1884,
    discoveredBy: 'William James',
    discoveryNote: 'Proposed emotions are subjective experiences. Neuroscience confirms emotions aren\'t locatable in one brain region.',
  },
  {
    id: 'organs-purpose',
    category: 'human',
    fact: 'Every organ has a purpose',
    detail: 'Eyes to see, ears to hear. If parts have purpose, the whole must too.',
    discoveredYear: 1859,
    discoveredBy: 'Charles Darwin',
    discoveryNote: 'Natural selection explains organ function. Even "vestigial" organs (appendix) now known to have immune function.',
  },
  {
    id: 'conscious-will',
    category: 'human',
    fact: 'We can choose to defy our instincts',
    detail: 'Unlike animals, we can fast when hungry, stay awake when tired.',
    discoveredYear: 1983,
    discoveredBy: 'Benjamin Libet',
    discoveryNote: 'Experiments showed humans can "veto" unconscious urges. Free will operates in the conscious override.',
  },
];

// Story scenes for the Almanac intro
const storyScenes = [
  {
    id: 'scene1',
    title: 'The Sports Almanac',
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Remember <span className="text-amber-400 font-semibold">Back to the Future II</span>?
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Biff steals a book from the future: <span className="text-amber-400 font-semibold">"Grays Sports Almanac: 1950-2000"</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          It doesn't <span className="italic">predict</span> anything. It simply <span className="text-white font-semibold">records facts</span>—every score, every winner, every result.
          <span className="text-slate-500 italic"> Because for the book, it already happened.</span>
        </p>
      </>
    ),
  },
  {
    id: 'scene2',
    title: 'Building Belief',
    icon: <TrendingUp className="w-12 h-12" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You find the book. At first, <span className="text-white font-semibold">you have 0% belief</span>. Why would you?
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          But then you test it...
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Result 1 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[10%] h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm">10%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Result 5 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[40%] h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm">40%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Result 20 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[75%] h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Result 50 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm font-bold">99%</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Each correct result <span className="text-emerald-400 font-semibold">compounds your certainty</span>.
          The only thing that would break it? <span className="text-rose-400">A single wrong result.</span>
        </p>
      </>
    ),
  },
  {
    id: 'scene3',
    title: 'The Point of Certainty',
    icon: <Brain className="w-12 h-12" />,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          After 50 verified results with <span className="text-white font-semibold">zero errors</span>, something shifts in your mind.
        </p>
        <div className="space-y-3 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-amber-500">
            <p className="text-amber-200 italic">"This isn't luck. This isn't coincidence."</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-blue-500">
            <p className="text-blue-200 italic">"These aren't predictions—they're recorded facts."</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-emerald-500">
            <p className="text-emerald-200 italic">"The book knows what happens before I witness it."</p>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          You've reached <span className="text-purple-400 font-semibold">the point of certainty</span>—not blind faith, but
          <span className="text-white font-semibold"> earned conviction</span> built on verified evidence.
        </p>
      </>
    ),
  },
  {
    id: 'scene4',
    title: 'Munich, 1958',
    icon: <Clock className="w-12 h-12" />,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You turn to February 6th, 1958. <span className="text-white font-semibold">Manchester United's Busby Babes</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The book records: <span className="text-slate-400 italic">"Match result: Drew 3-3 in Belgrade. United through 5-4 on aggregate."</span>
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Then you see the next entry: <span className="text-rose-400 font-semibold">"Flight 609 crashed on takeoff from Munich. 23 dead."</span>
        </p>
        <div className="bg-rose-900/30 rounded-xl p-5 border border-rose-700/50 mb-4">
          <p className="text-xl text-white font-medium mb-3">
            Now ask yourself honestly:
          </p>
          <p className="text-rose-200 text-lg">
            If you were there—and this book had been <span className="font-bold">100% accurate</span> on everything—
            <br /><br />
            <span className="text-white font-semibold">Would you get on that plane?</span>
          </p>
        </div>
        <p className="text-slate-400 text-sm italic">
          The book isn't predicting. It's stating what already happened—you just haven't witnessed it yet.
        </p>
      </>
    ),
  },
  {
    id: 'scene5',
    title: 'The Logic of Belief',
    icon: <Zap className="w-12 h-12" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          This is the logic: If a source is <span className="text-emerald-400 font-semibold">100% accurate about everything you can verify</span>...
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          ...what rational reason do you have to doubt what it says about things <span className="text-white font-semibold">you haven't witnessed yet?</span>
        </p>
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-4">
          <p className="text-slate-300 mb-3">
            <span className="text-emerald-400">✓</span> Correct about the past → <span className="text-white">Verified</span>
          </p>
          <p className="text-slate-300 mb-3">
            <span className="text-emerald-400">✓</span> Correct about the present (which becomes past) → <span className="text-white">Verified</span>
          </p>
          <p className="text-slate-300">
            <span className="text-blue-400">?</span> What it says about the future → <span className="text-white font-semibold">Why would you doubt it?</span>
          </p>
        </div>
        <p className="text-lg text-blue-200 leading-relaxed">
          This is <span className="text-white font-semibold">belief in the unseen</span>—not blind faith, but certainty built on a foundation of verified truth.
        </p>
      </>
    ),
  },
  {
    id: 'scene6',
    title: 'The Claim',
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          There is <span className="text-white font-semibold">one book</span> that claims to be <span className="text-amber-400 font-semibold">directly from the One who created everything</span>—including you.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          It claims to be <span className="text-blue-400 font-semibold">the Manual for human beings</span>.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-3">It claims to tell you:</p>
          <ul className="space-y-2 text-white text-sm">
            <li>• <span className="text-purple-300">Why</span> you were created</li>
            <li>• <span className="text-blue-300">How</span> you were created</li>
            <li>• <span className="text-emerald-300">What</span> exists in the world around you</li>
            <li>• That every soul <span className="text-rose-300">will taste death</span></li>
            <li>• What happens <span className="text-amber-300">after</span>—the next stage, the Day of Judgment</li>
          </ul>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Your past. Your present. <span className="text-white font-semibold">Your future.</span>
          <br />
          <span className="text-slate-400 italic">It's not the end. There's a reason you exist.</span>
        </p>
      </>
    ),
  },
  {
    id: 'scene7',
    title: 'Back to Zero',
    icon: <TrendingUp className="w-12 h-12" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Right now, you're back at <span className="text-white font-semibold">0% belief</span>. And that's fine.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          We're going to look at a number of <span className="text-emerald-400 font-semibold">undeniable facts about reality</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Then ask yourself: <span className="text-white font-semibold">who could have known these facts 1,400 years ago?</span>
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-3">What are the options?</p>
          <div className="space-y-3">
            <p className="text-slate-300">• A <span className="text-white font-medium">single human</span>?</p>
            <p className="text-slate-300">• A <span className="text-white font-medium">group of humans</span>?</p>
            <p className="text-slate-300">• Or <span className="text-amber-400 font-medium">the Creator</span> of it all?</p>
          </div>
        </div>
        <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/50">
          <p className="text-blue-200">
            Then you'll know for certain: <span className="text-white font-semibold">the One who made you is communicating with you.</span>
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'scene8',
    title: 'The Stakes',
    icon: <Zap className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Once you <span className="text-white font-semibold">know</span> it's from your Creator...
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          It doesn't matter what you <span className="italic">think</span> anymore. What matters is <span className="text-amber-400 font-semibold">reality</span>.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-4">
          <p className="text-white font-medium mb-3">The reality is:</p>
          <p className="text-slate-300 mb-2">• You are in a <span className="text-amber-300 font-semibold">test</span></p>
          <p className="text-slate-300 mb-2">• There are <span className="text-blue-300 font-semibold">rules</span> to pass</p>
          <p className="text-slate-300">• You have a <span className="text-emerald-300 font-semibold">choice</span></p>
        </div>
        <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 mb-4">
          <p className="text-xl text-white font-medium mb-2">
            Two options:
          </p>
          <p className="text-amber-200 mb-2">
            <span className="font-bold">Option A:</span> This life <span className="text-emerald-400">+ the next life</span>
          </p>
          <p className="text-amber-200">
            <span className="font-bold">Option B:</span> Just this life
          </p>
        </div>
        <p className="text-lg text-white font-semibold text-center">
          You choose.
        </p>
      </>
    ),
  },
  {
    id: 'scene9',
    title: 'Let\'s Begin',
    icon: <ArrowRight className="w-12 h-12" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          We'll start with <span className="text-white font-semibold">{axioms.length} facts</span> about reality that you already accept.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Facts about <span className="text-blue-300">the cosmos</span>, <span className="text-purple-300">biology</span>, <span className="text-emerald-300">nature</span>, and <span className="text-rose-300">the human condition</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-6">
          Then we'll check the Book's accuracy—just like checking the Sports Almanac.
        </p>
        <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
          <p className="text-xl text-white font-medium mb-2">
            Ready to test the Almanac?
          </p>
          <p className="text-emerald-200">
            Let's see if your certainty compounds... or breaks.
          </p>
        </div>
      </>
    ),
  },
];

export const AxiomCheck = ({ onComplete }: AxiomCheckProps) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [agreedAxioms, setAgreedAxioms] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [introScene, setIntroScene] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [expandedAxiom, setExpandedAxiom] = useState<string | null>(null);

  const currentCategory = categories[currentCategoryIndex];
  const categoryAxioms = axioms.filter(a => a.category === currentCategory?.id);

  // Check if all axioms in current category are agreed
  const allCategoryAxiomsAgreed = categoryAxioms.every(
    a => agreedAxioms.includes(a.id)
  );

  const handleAgreeAxiom = (axiomId: string) => {
    if (!agreedAxioms.includes(axiomId)) {
      setAgreedAxioms(prev => [...prev, axiomId]);
    }
  };

  const handleMoveToNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      setExpandedAxiom(null);
    } else {
      setIsComplete(true);
    }
  };

  const formatYear = (year: number) => {
    if (year < 0) return `${Math.abs(year)} BC`;
    return `${year} AD`;
  };

  const progress = ((currentCategoryIndex) / categories.length) * 100;

  // Intro screen with Almanac story scenes
  if (showIntro) {
    const currentScene = storyScenes[introScene];
    const isLastScene = introScene === storyScenes.length - 1;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex flex-col"
      >
        {/* Progress dots */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
          {storyScenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIntroScene(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === introScene
                  ? 'bg-blue-500 w-6'
                  : i < introScene
                  ? 'bg-blue-500/50'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center p-4 pt-16">
          <div className="max-w-2xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Scene Icon */}
                <div className={`w-24 h-24 ${currentScene.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <div className={currentScene.iconColor}>
                    {currentScene.icon}
                  </div>
                </div>

                {/* Scene Title */}
                <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">
                  {currentScene.title}
                </h1>
                <p className="text-slate-500 text-sm mb-8">
                  Scene {introScene + 1} of {storyScenes.length}
                </p>

                {/* Scene Content */}
                <div className="bg-slate-900/70 rounded-2xl p-6 sm:p-8 border border-slate-700 mb-8 text-left">
                  {currentScene.content}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4">
                  {introScene > 0 && (
                    <button
                      onClick={() => setIntroScene(prev => prev - 1)}
                      className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full transition"
                    >
                      Back
                    </button>
                  )}

                  {isLastScene ? (
                    <button
                      onClick={() => setShowIntro(false)}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      Begin the Test
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIntroScene(prev => prev + 1)}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Skip option */}
                {!isLastScene && (
                  <button
                    onClick={() => setShowIntro(false)}
                    className="mt-6 text-slate-500 hover:text-slate-300 text-sm transition"
                  >
                    Skip story →
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  // Completion - transition to Almanac verification
  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>

            <h2 className="text-3xl font-serif text-white mb-4">
              We Agree on {agreedAxioms.length} Facts
            </h2>

            <p className="text-slate-300 text-lg mb-6">
              These are undeniable truths about reality—the <span className="text-blue-400">stable floor</span> we both stand on.
            </p>

            {/* Category summary */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {categories.map(cat => {
                const catAxioms = axioms.filter(a => a.category === cat.id);
                const agreedCount = catAxioms.filter(a => agreedAxioms.includes(a.id)).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      {cat.icon}
                      <span className="text-sm">{cat.subtitle}</span>
                    </div>
                    <p className="text-white font-semibold">
                      {agreedCount}/{catAxioms.length} agreed
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 mb-8">
              <p className="text-amber-200 text-lg">
                Now, let's check the "Almanac."
                <br />
                <span className="text-white font-semibold">
                  A 1,400-year-old book claims to know all of this.
                </span>
              </p>
            </div>

            <button
              onClick={() => onComplete(agreedAxioms)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Verify the Almanac
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Category view with all axioms
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-blue-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Category tabs */}
      <div className="pt-8 px-4">
        <div className="flex justify-center gap-2 mb-4">
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => index <= currentCategoryIndex && setCurrentCategoryIndex(index)}
              disabled={index > currentCategoryIndex}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                index === currentCategoryIndex
                  ? 'bg-blue-600 text-white'
                  : index < currentCategoryIndex
                  ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {cat.subtitle}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategory.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-2xl w-full"
          >
            {/* Category Header */}
            <div className="text-center mb-8">
              <div className={`w-16 h-16 ${currentCategory.bgClass} rounded-full flex items-center justify-center mx-auto mb-4 ${currentCategory.textClass}`}>
                {currentCategory.icon}
              </div>
              <h2 className="text-2xl font-serif text-white mb-1">
                {currentCategory.name}
              </h2>
              <p className="text-slate-400">{currentCategory.subtitle}</p>
            </div>

            {/* Axioms List */}
            <div className="space-y-3 mb-6">
              {categoryAxioms.map((axiom, index) => {
                const isExpanded = expandedAxiom === axiom.id;
                const isAgreed = agreedAxioms.includes(axiom.id);

                return (
                  <motion.div
                    key={axiom.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-slate-900/70 rounded-xl border transition-colors ${
                      isAgreed ? 'border-emerald-700/50' : 'border-slate-700'
                    }`}
                  >
                    {/* Main axiom row */}
                    <div
                      onClick={() => setExpandedAxiom(isExpanded ? null : axiom.id)}
                      className="p-4 cursor-pointer hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isAgreed ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}>
                          {isAgreed ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <span className="text-xs text-slate-400">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium mb-1">{axiom.fact}</p>
                          <p className="text-slate-400 text-sm">{axiom.detail}</p>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Expanded discovery info */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-slate-700 pt-4">
                            {/* Discovery info */}
                            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/30 mb-4">
                              <p className="text-blue-300 text-xs font-medium mb-2">
                                📚 When was this discovered?
                              </p>
                              <div className="flex items-center gap-4 mb-2">
                                <div>
                                  <p className="text-white font-semibold">{formatYear(axiom.discoveredYear)}</p>
                                  <p className="text-slate-400 text-xs">Year discovered</p>
                                </div>
                                <div>
                                  <p className="text-white font-semibold">{axiom.discoveredBy}</p>
                                  <p className="text-slate-400 text-xs">Discovered by</p>
                                </div>
                              </div>
                              <p className="text-slate-300 text-sm">{axiom.discoveryNote}</p>

                              {/* Video link if available */}
                              {'videoUrl' in axiom && axiom.videoUrl && (
                                <a
                                  href={axiom.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 rounded-lg text-red-300 hover:text-red-200 text-sm transition"
                                >
                                  <Play className="w-4 h-4" />
                                  Watch: {(axiom as any).videoTitle || 'See the evidence'}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {/* Agree/Disagree buttons */}
                            {!isAgreed && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAgreeAxiom(axiom.id);
                                  }}
                                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Yes, this is fact
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Just collapse - they can't disagree with undeniable facts
                                    setExpandedAxiom(null);
                                  }}
                                  className="px-4 py-2 border border-slate-600 text-slate-400 hover:bg-slate-800 rounded-lg font-medium transition text-sm"
                                >
                                  I need more info
                                </button>
                              </div>
                            )}
                            {isAgreed && (
                              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                <Check className="w-4 h-4" />
                                You agreed this is an undeniable fact
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Continue button - only shows when all agreed */}
            <div className="text-center">
              {allCategoryAxiomsAgreed ? (
                <button
                  onClick={handleMoveToNext}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
                >
                  {currentCategoryIndex < categories.length - 1 ? (
                    <>
                      Continue to {categories[currentCategoryIndex + 1].subtitle}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      All Facts Agreed - Verify the Almanac
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <div>
                  <p className="text-slate-400 text-sm mb-2">
                    Click each fact to learn when it was discovered
                  </p>
                  <p className="text-slate-500 text-xs">
                    {agreedAxioms.filter(id => categoryAxioms.some(a => a.id === id)).length} of {categoryAxioms.length} facts agreed
                  </p>
                </div>
              )}
              <p className="text-slate-500 text-xs mt-4">
                {currentCategoryIndex + 1} of {categories.length} categories
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AxiomCheck;
