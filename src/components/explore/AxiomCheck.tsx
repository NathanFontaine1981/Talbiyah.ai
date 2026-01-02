import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Atom, Heart, Leaf, Sparkles, ChevronRight, BookOpen, TrendingUp, DollarSign, Brain, Zap, Clock, ExternalLink, Play, FileText, Gavel } from 'lucide-react';

interface AxiomCheckProps {
  onComplete: (agreedAxioms: string[]) => void;
}

// Categories of undeniable knowledge - presented as court exhibits
const categories = [
  {
    id: 'cosmic',
    name: 'Exhibit A: Cosmic Evidence',
    subtitle: 'The Universe',
    icon: <Atom className="w-6 h-6" />,
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    exhibitLabel: 'Exhibit A',
  },
  {
    id: 'biological',
    name: 'Exhibit B: Biological Evidence',
    subtitle: 'The Human Body',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    exhibitLabel: 'Exhibit B',
  },
  {
    id: 'natural',
    name: 'Exhibit C: Natural Evidence',
    subtitle: 'The Ecosystem',
    icon: <Leaf className="w-6 h-6" />,
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    exhibitLabel: 'Exhibit C',
  },
  {
    id: 'human',
    name: 'Exhibit D: Human Evidence',
    subtitle: 'The Soul',
    icon: <Heart className="w-6 h-6" />,
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-400',
    exhibitLabel: 'Exhibit D',
  },
];

// The Axioms - Undeniable facts organised by category
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
    videoUrl: 'https://www.youtube.com/watch?v=dr6nNvw55C4',
    videoTitle: 'TED: What Was There Before the Big Bang?',
  },
  {
    id: 'universe-expansion',
    category: 'cosmic',
    fact: 'The universe is expanding',
    detail: 'Space itself is stretching. Galaxies are moving apart from each other.',
    discoveredYear: 1929,
    discoveredBy: 'Edwin Hubble',
    discoveryNote: 'Observed redshift in distant galaxies, proving the universe is expanding in all directions.',
    videoUrl: 'https://www.youtube.com/watch?v=dr6nNvw55C4',
    videoTitle: 'TED: What Was There Before the Big Bang? (first 1 min)',
  },
  {
    id: 'earth-sphere',
    category: 'cosmic',
    fact: 'The Earth is spherical',
    detail: 'Not flat. Observable from space and through physics.',
    discoveredYear: -330,
    discoveredBy: 'Aristotle (confirmed)',
    discoveryNote: 'Ancient Greeks observed ships disappearing hull-first over the horizon. Confirmed by Magellan\'s voyage (1522).',
    videoUrl: 'https://www.youtube.com/watch?v=VNqNnUJVcVs',
    videoTitle: 'Vsauce: Is Earth Actually Flat?',
  },
  {
    id: 'sun-moon-light',
    category: 'cosmic',
    fact: 'The Sun generates light; the Moon reflects it',
    detail: 'For years people thought the moon had its own light. The Sun is a source of heat and light. The Moon has no light of its own—it only reflects sunlight.',
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
    discoveredBy: 'Ancient civilisations',
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
    videoUrl: 'https://www.youtube.com/watch?v=fKyljukBE70',
    videoTitle: 'TED: Conception to Birth - Visualised',
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
    videoUrl: 'https://www.youtube.com/watch?v=lXfEK8G8CUI',
    videoTitle: 'Kurzgesagt: How Your Immune System Works',
  },
  {
    id: 'fingerprints',
    category: 'biological',
    fact: 'Every human has unique fingerprints',
    detail: 'No two people share the same fingerprint pattern.',
    discoveredYear: 1892,
    discoveredBy: 'Sir Francis Galton',
    discoveryNote: 'Proved fingerprint uniqueness statistically. Even identical twins have different fingerprints.',
    videoUrl: 'https://www.youtube.com/watch?v=6Yc7SbKqpj4',
    videoTitle: 'TED-Ed: Why Are Fingerprints Unique?',
  },
  {
    id: 'skin-pain',
    category: 'biological',
    fact: 'Pain receptors are located in the skin',
    detail: 'When skin is destroyed (3rd-degree burns), we feel no pain there.',
    discoveredYear: 1906,
    discoveredBy: 'Charles Sherrington',
    discoveryNote: 'Mapped nociceptors (pain receptors) in skin. Deep burns destroy these receptors, causing numbness.',
    videoUrl: 'https://www.youtube.com/watch?v=HN6hP0QQ_K8',
    videoTitle: 'TED-Ed: How Does Your Body Sense Pain?',
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
    id: 'plants-male-female',
    category: 'natural',
    fact: 'Plants have male and female parts',
    detail: 'Even flowers have male (stamens) and female (pistils) parts. Bees carry pollen from male to female parts to enable reproduction.',
    discoveredYear: 1694,
    discoveredBy: 'Rudolf Camerarius',
    discoveryNote: 'German botanist provided first scientific proof of plant sexuality. Cross-pollination by insects documented by Sprengel (1793).',
  },
  {
    id: 'mountains-pegs',
    category: 'natural',
    fact: 'Mountains have deep roots extending into the Earth',
    detail: 'Mountains are not just sitting on the surface—they have deep foundations like pegs or stakes anchoring them.',
    discoveredYear: 1855,
    discoveredBy: 'George Airy',
    discoveryNote: 'Proposed the theory of isostasy—mountains have deep "roots" extending into the mantle. Confirmed by seismology in the 20th century.',
  },
  {
    id: 'lowest-land',
    category: 'natural',
    fact: 'The Dead Sea area is the lowest point on Earth',
    detail: 'At 430 meters below sea level, this is where the Romans were defeated by the Persians—"in the lowest land."',
    discoveredYear: 1837,
    discoveredBy: 'Modern surveying',
    discoveryNote: 'Accurate altitude measurement became possible with barometric and trigonometric surveying. The Dead Sea was confirmed as Earth\'s lowest point on land.',
    videoUrl: 'https://www.youtube.com/watch?v=6EfRHTJ0TzU',
    videoTitle: 'Rick Steves: The Dead Sea - Lowest Place on Earth',
  },
  {
    id: 'baby-instinct',
    category: 'natural',
    fact: 'Babies instinctively know how to nurse',
    detail: 'No one teaches them—they know immediately after birth.',
    discoveredYear: 1952,
    discoveredBy: 'Konrad Lorenz',
    discoveryNote: 'Documented innate behaviours in newborns. Rooting and sucking reflexes are hardwired at birth.',
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
    videoUrl: 'https://www.youtube.com/watch?v=H6u0VBqNBQ8',
    videoTitle: 'Kurzgesagt: Are Animals Conscious?',
  },
  {
    id: 'female-bees',
    category: 'natural',
    fact: 'Only female bees make honey',
    detail: 'Male bees (drones) do not produce honey or collect nectar. Only female worker bees do.',
    discoveredYear: 1609,
    discoveredBy: 'Charles Butler',
    discoveryNote: 'Discovered the queen bee is female. Jan Swammerdam (1673) confirmed only female workers make honey.',
  },
  {
    id: 'two-seas',
    category: 'natural',
    fact: 'Fresh and salt water meet but don\'t mix',
    detail: 'Where rivers meet the ocean, there is an invisible barrier. The waters stay separate.',
    discoveredYear: 1942,
    discoveredBy: 'Modern oceanography',
    discoveryNote: 'Haloclines—density barriers between fresh and salt water—were discovered through oceanographic research.',
    videoUrl: 'https://www.youtube.com/watch?v=CmxgRg9Xauw',
    videoTitle: 'NOAA: What is an Estuary?',
  },
  {
    id: 'iron-sent-down',
    category: 'cosmic',
    fact: 'Iron came from outer space',
    detail: 'Iron is not native to Earth. It was "sent down" via meteorites and formed in dying stars.',
    discoveredYear: 1920,
    discoveredBy: 'Cecilia Payne-Gaposchkin',
    discoveryNote: 'Stellar nucleosynthesis proved iron forms in supernova explosions and arrives on Earth via meteorites.',
    videoUrl: 'https://www.youtube.com/watch?v=2GBq0ClRKoA',
    videoTitle: 'Smithsonian: Meteorites - Rocks from Space',
  },

  // HUMAN CONDITION
  {
    id: 'pharaoh-preserved',
    category: 'human',
    fact: 'Pharaoh\'s body was preserved against all odds',
    detail: 'Bodies decay rapidly—especially in water, where they decompose within days. Yet the Pharaoh who drowned chasing Moses still has his hair, skin, and features intact thousands of years later.',
    discoveredYear: 1881,
    discoveredBy: 'Gaston Maspero',
    discoveryNote: 'Mummy now displayed in Cairo\'s Egyptian Museum. Despite drowning in the sea, the body is remarkably preserved—a phenomenon that defies normal decomposition. Salt water typically accelerates decay.',
    videoUrl: 'https://www.youtube.com/watch?v=06OP7Xq493w',
    videoTitle: 'Pharaoh\'s Body in the Egyptian Museum',
  },
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

// Story scenes for the Almanac intro - TRIMMED to 5 essential scenes
const storyScenes = [
  {
    id: 'scene1',
    title: 'Exhibit Alpha: The Analogy',
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          In <span className="text-blue-400 font-semibold">Back to the Future Part II</span>, a character gets hold of a Sports Almanac from the future.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
          <p className="text-amber-300 text-lg italic mb-2">
            "This book records every sports result from 1950 to 2000."
          </p>
          <p className="text-white font-medium">
            He takes it back in time. Every bet wins. He becomes a billionaire.
          </p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          It doesn't <span className="italic">predict</span> anything. It simply <span className="text-white font-semibold">records facts</span> about events that haven't happened yet.
        </p>
      </>
    ),
  },
  {
    id: 'scene2',
    title: 'The Burden of Proof',
    icon: <TrendingUp className="w-12 h-12" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Imagine you find this book. At first, <span className="text-white font-semibold">0% belief</span>. Why would you trust it?
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Evidence 1 verified</span>
              <span className="text-emerald-400 text-sm">Interesting...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Evidence 10 verified</span>
              <span className="text-emerald-400 text-sm">Wait...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Evidence 50 verified, 0 false</span>
              <span className="text-emerald-400 text-sm font-bold">This is real.</span>
            </div>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Each verified piece of evidence <span className="text-emerald-400 font-semibold">strengthens the case</span>. The only thing that would overturn it? <span className="text-rose-400">A single false claim.</span>
        </p>
      </>
    ),
  },
  {
    id: 'scene3',
    title: 'A Hypothetical for the Jury',
    icon: <Clock className="w-12 h-12" />,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You check the book for February 6th, 1958. It says:
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          <span className="text-rose-400 font-semibold">"Flight 609 crashed on takeoff from Munich. 23 dead."</span>
        </p>
        <div className="bg-rose-900/30 rounded-xl p-5 border border-rose-700/50 mb-4">
          <p className="text-xl text-white font-medium mb-3">
            If this source has been 100% accurate on everything...
          </p>
          <p className="text-rose-200 text-lg">
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
    id: 'scene4',
    title: 'The Logical Conclusion',
    icon: <Gavel className="w-12 h-12" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          If a source is <span className="text-emerald-400 font-semibold">100% accurate about everything you can verify</span>...
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          ...what rational reason do you have to doubt what it says about things <span className="text-white font-semibold">you haven't witnessed yet?</span>
        </p>
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-4">
          <p className="text-slate-300 mb-2">
            <span className="text-emerald-400">✓</span> Evidence of the past → <span className="text-white">Verified</span>
          </p>
          <p className="text-slate-300 mb-2">
            <span className="text-emerald-400">✓</span> Evidence of the present → <span className="text-white">Verified</span>
          </p>
          <p className="text-slate-300">
            <span className="text-blue-400">?</span> Claims about the unseen → <span className="text-white font-semibold">What's the reasonable verdict?</span>
          </p>
        </div>
        <p className="text-lg text-blue-200 leading-relaxed">
          This is <span className="text-white font-semibold">belief in the unseen</span>—not blind faith, but conviction built on verified evidence.
        </p>
      </>
    ),
  },
  {
    id: 'scene5',
    title: "The Evidence Will Be Presented",
    icon: <FileText className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          There's an over 1,400-year-old book that claims to be <span className="text-amber-400 font-semibold">directly from the Creator</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The prosecution will present <span className="text-white font-semibold">undeniable facts about reality</span> that you already accept. Then we'll cross-examine: <span className="text-emerald-400">does the Quran match?</span>
        </p>
        <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
          <p className="text-xl text-white font-medium mb-2">
            Same standard of evidence as the Sports Almanac.
          </p>
          <p className="text-amber-200">
            Let's see if the case holds... or falls apart.
          </p>
        </div>
      </>
    ),
  },
];

export const AxiomCheck = ({ onComplete }: AxiomCheckProps) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [agreedAxioms, setAgreedAxioms] = useState<string[]>([]);
  const [reviewedAxioms, setReviewedAxioms] = useState<string[]>([]); // Tracks axioms user has interacted with (agree OR need more info)
  const [showIntro, setShowIntro] = useState(true);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [introScene, setIntroScene] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [expandedAxiom, setExpandedAxiom] = useState<string | null>(null);

  // Get the active categories (only the ones user selected)
  const activeCategories = selectedCategories.length > 0
    ? categories.filter(c => selectedCategories.includes(c.id))
    : categories;

  const currentCategory = activeCategories[currentCategoryIndex];
  const categoryAxioms = axioms.filter(a => a.category === currentCategory?.id);

  // Check if all axioms in current category have been reviewed (agreed OR marked as need more info)
  const allCategoryAxiomsReviewed = categoryAxioms.every(
    a => reviewedAxioms.includes(a.id)
  );

  const handleAgreeAxiom = (axiomId: string) => {
    // Add to agreed if not already
    if (!agreedAxioms.includes(axiomId)) {
      setAgreedAxioms(prev => [...prev, axiomId]);
    }
    // Mark as reviewed
    if (!reviewedAxioms.includes(axiomId)) {
      setReviewedAxioms(prev => [...prev, axiomId]);
    }
    setExpandedAxiom(null);
  };

  const handleNeedMoreInfo = (axiomId: string) => {
    // Remove from agreed if it was previously agreed (user changed their mind)
    if (agreedAxioms.includes(axiomId)) {
      setAgreedAxioms(prev => prev.filter(id => id !== axiomId));
    }
    // Mark as reviewed
    if (!reviewedAxioms.includes(axiomId)) {
      setReviewedAxioms(prev => [...prev, axiomId]);
    }
    setExpandedAxiom(null);
  };

  const handleMoveToNext = () => {
    if (currentCategoryIndex < activeCategories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      setExpandedAxiom(null);
    } else {
      setIsComplete(true);
    }
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleStartWithCategories = () => {
    setShowCategorySelect(false);
  };

  const formatYear = (year: number) => {
    if (year < 0) return `${Math.abs(year)} BC`;
    return `${year} AD`;
  };

  const progress = ((currentCategoryIndex) / activeCategories.length) * 100;

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
                      onClick={() => {
                        setShowIntro(false);
                        setShowCategorySelect(true);
                      }}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      Choose Your Categories
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
                    onClick={() => {
                      setShowIntro(false);
                      setShowCategorySelect(true);
                    }}
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

  // Category selection screen
  if (showCategorySelect) {
    const minCategories = 2;
    const canProceed = selectedCategories.length >= minCategories;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif text-white mb-3">
              Select Your Exhibits
            </h2>
            <p className="text-slate-400">
              Choose at least {minCategories} categories of evidence. Each contains facts you already accept as true.
            </p>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const catAxioms = axioms.filter(a => a.category === cat.id);

              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategorySelection(cat.id)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-12 h-12 ${cat.bgClass} rounded-xl flex items-center justify-center mb-3 ${cat.textClass}`}>
                    {cat.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-1">{cat.name}</h3>
                  <p className="text-slate-400 text-sm mb-2">{cat.subtitle}</p>
                  <p className="text-slate-500 text-xs">{catAxioms.length} pieces of evidence</p>

                  {isSelected && (
                    <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
                      <Check className="w-4 h-4" />
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selection count and proceed button */}
          <div className="text-center">
            <p className="text-slate-400 mb-4">
              {selectedCategories.length} of {minCategories} minimum selected
            </p>

            {canProceed ? (
              <button
                onClick={handleStartWithCategories}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                Start with {selectedCategories.length} Categories
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <p className="text-amber-400 text-sm">
                Select {minCategories - selectedCategories.length} more to continue
              </p>
            )}

            {/* Select all option */}
            <button
              onClick={() => setSelectedCategories(categories.map(c => c.id))}
              className="mt-4 text-slate-500 hover:text-slate-300 text-sm transition"
            >
              Select all categories
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Completion - transition to Almanac verification
  if (isComplete) {
    const totalReviewed = reviewedAxioms.length;
    const totalAgreed = agreedAxioms.length;
    const needMoreInfo = totalReviewed - totalAgreed;

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
              {totalAgreed === totalReviewed ? (
                <>Evidence Accepted: All {totalAgreed} Exhibits</>
              ) : (
                <>Evidence Accepted: {totalAgreed} of {totalReviewed} Exhibits</>
              )}
            </h2>

            <p className="text-slate-300 text-lg mb-6">
              {needMoreInfo > 0 ? (
                <>
                  <span className="text-amber-400">{needMoreInfo} exhibit{needMoreInfo > 1 ? 's' : ''}</span> marked for further review. The court will proceed with the <span className="text-emerald-400">{totalAgreed}</span> you accept.
                </>
              ) : (
                <>These are undeniable truths about reality—the <span className="text-blue-400">foundation</span> upon which the case will be built.</>
              )}
            </p>

            {/* Category summary */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {activeCategories.map(cat => {
                const catAxioms = axioms.filter(a => a.category === cat.id);
                const agreedCount = catAxioms.filter(a => agreedAxioms.includes(a.id)).length;
                const reviewedCount = catAxioms.filter(a => reviewedAxioms.includes(a.id)).length;
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
                      <span className="text-emerald-400">{agreedCount}</span>
                      {agreedCount < reviewedCount && (
                        <span className="text-amber-400"> + {reviewedCount - agreedCount}?</span>
                      )}
                      <span className="text-slate-400 text-sm"> / {catAxioms.length}</span>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Gavel className="w-5 h-5 text-amber-400" />
                <p className="text-amber-300 font-medium">Cross-Examination</p>
              </div>
              <p className="text-amber-200 text-lg">
                The court will now cross-examine <span className="text-white font-semibold">the Quran</span>.
                <br />
                <span className="text-slate-300">
                  An over 1,400-year-old book that claims to know {totalAgreed === totalReviewed ? 'all of this' : 'these facts'}.
                </span>
              </p>
            </div>

            <button
              onClick={() => onComplete(agreedAxioms)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Begin Cross-Examination
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
          {activeCategories.map((cat, index) => (
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
                      isAgreed
                        ? 'border-emerald-700/50'
                        : reviewedAxioms.includes(axiom.id)
                        ? 'border-amber-700/50'
                        : 'border-slate-700'
                    }`}
                  >
                    {/* Main axiom row */}
                    <div
                      onClick={() => setExpandedAxiom(isExpanded ? null : axiom.id)}
                      className="p-4 cursor-pointer hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isAgreed
                            ? 'bg-emerald-500'
                            : reviewedAxioms.includes(axiom.id)
                            ? 'bg-amber-500'
                            : 'bg-slate-800'
                        }`}>
                          {isAgreed ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : reviewedAxioms.includes(axiom.id) ? (
                            <span className="text-xs text-white font-bold">?</span>
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

                            {/* Agree/Need More Info buttons - always show so user can change answer */}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAgreeAxiom(axiom.id);
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                                  isAgreed
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-700'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                {isAgreed ? 'Agreed ✓' : 'Yes, this is fact'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNeedMoreInfo(axiom.id);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                                  !isAgreed && reviewedAxioms.includes(axiom.id)
                                    ? 'bg-amber-600 text-white'
                                    : 'border border-slate-600 text-slate-400 hover:bg-slate-800'
                                }`}
                              >
                                {!isAgreed && reviewedAxioms.includes(axiom.id) ? 'Need more info ?' : 'I need more info'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Continue button - shows when all reviewed (agreed or need more info) */}
            <div className="text-center">
              {allCategoryAxiomsReviewed ? (
                <button
                  onClick={handleMoveToNext}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
                >
                  {currentCategoryIndex < activeCategories.length - 1 ? (
                    <>
                      Proceed to {activeCategories[currentCategoryIndex + 1].exhibitLabel}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Begin Cross-Examination
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <div>
                  <p className="text-slate-400 text-sm mb-2">
                    Click each piece of evidence to review it
                  </p>
                  <p className="text-slate-500 text-xs">
                    {reviewedAxioms.filter(id => categoryAxioms.some(a => a.id === id)).length} of {categoryAxioms.length} reviewed
                  </p>
                </div>
              )}
              <p className="text-slate-500 text-xs mt-4">
                Exhibit {currentCategoryIndex + 1} of {activeCategories.length}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AxiomCheck;
