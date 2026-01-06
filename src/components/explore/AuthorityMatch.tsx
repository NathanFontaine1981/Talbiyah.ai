import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Sparkles, TrendingUp, Check, Atom, Heart, Leaf, Clock, Lightbulb, Gavel, Scale } from 'lucide-react';

interface AuthorityMatchProps {
  agreedAxioms: string[];
  onComplete: () => void;
}

// Mapping of all axiom IDs to their Quranic revelations
const axiomToQuran: Record<string, {
  verse: string;
  surah: string;
  ayah: string;
  arabicText: string;
  translation: string;
  factStatement: string;
  yearRevealed: number;
  yearDiscovered: number;
  category: 'cosmic' | 'biological' | 'natural' | 'human';
  contemplation: string; // A thought-provoking question to pause and reflect
}> = {
  // COSMIC REALITY
  'big-bang': {
    verse: '21:30',
    surah: 'Al-Anbiya',
    ayah: '30',
    arabicText: 'أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا',
    translation: 'Have those who disbelieved not considered that the heavens and the earth were a joined entity, and We separated them?',
    factStatement: 'The universe had a beginning (the Big Bang)',
    yearRevealed: 610,
    yearDiscovered: 1927,
    category: 'cosmic',
    contemplation: 'No human witnessed this. Yet the author states it with absolute confidence—boldly, as fact. Over 1,400 years ago, making such a claim risked being proven wrong. A human would hedge. The Creator would not.',
  },
  'universe-expansion': {
    verse: '51:47',
    surah: 'Adh-Dhariyat',
    ayah: '47',
    arabicText: 'وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ',
    translation: 'And the heaven We constructed with strength, and indeed, We are [its] expander.',
    factStatement: 'The universe is expanding',
    yearRevealed: 610,
    yearDiscovered: 1929,
    category: 'cosmic',
    contemplation: 'Edwin Hubble needed a telescope to discover this in 1929. What telescope was available in 610 CE?',
  },
  'earth-sphere': {
    verse: '39:5',
    surah: 'Az-Zumar',
    ayah: '5',
    arabicText: 'يُكَوِّرُ اللَّيْلَ عَلَى النَّهَارِ وَيُكَوِّرُ النَّهَارَ عَلَى اللَّيْلِ',
    translation: 'He wraps the night over the day and wraps the day over the night.',
    factStatement: 'The Earth is spherical',
    yearRevealed: 610,
    yearDiscovered: 1522,
    category: 'cosmic',
    contemplation: 'The Arabic word "yukawwir" means to coil or wrap around a sphere. You can only wrap day over night on a ball. Why use this word?',
  },
  'sun-moon-light': {
    verse: '10:5',
    surah: 'Yunus',
    ayah: '5',
    arabicText: 'هُوَ الَّذِي جَعَلَ الشَّمْسَ ضِيَاءً وَالْقَمَرَ نُورًا',
    translation: 'It is He who made the sun a shining light and the moon a derived light.',
    factStatement: 'The Sun generates light; the Moon reflects it',
    yearRevealed: 610,
    yearDiscovered: 1609,
    category: 'cosmic',
    contemplation: 'Arabic uses "diya" (self-generating light) for the sun and "noor" (reflected light) for the moon. This distinction predates Galileo by 1,000 years.',
  },
  'day-night': {
    verse: '36:40',
    surah: 'Ya-Sin',
    ayah: '40',
    arabicText: 'لَا الشَّمْسُ يَنبَغِي لَهَا أَن تُدْرِكَ الْقَمَرَ وَلَا اللَّيْلُ سَابِقُ النَّهَارِ',
    translation: 'It is not for the sun to catch up with the moon, nor does the night outstrip the day.',
    factStatement: 'Day and night alternate with precision',
    yearRevealed: 610,
    yearDiscovered: 1543,
    category: 'cosmic',
    contemplation: 'This verse describes celestial bodies moving in precise orbits—never colliding, never overtaking. How would an illiterate merchant know orbital mechanics?',
  },
  'water-life': {
    verse: '21:30',
    surah: 'Al-Anbiya',
    ayah: '30',
    arabicText: 'وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ',
    translation: 'And We made from water every living thing.',
    factStatement: 'Water is essential for all life',
    yearRevealed: 610,
    yearDiscovered: 1930,
    category: 'cosmic',
    contemplation: 'Today we search for water on other planets to find life. This verse makes an absolute claim: ALL living things are from water. Biology confirms this.',
  },

  // BIOLOGICAL REALITY
  'born-helpless': {
    verse: '16:78',
    surah: 'An-Nahl',
    ayah: '78',
    arabicText: 'وَاللَّهُ أَخْرَجَكُم مِّن بُطُونِ أُمَّهَاتِكُمْ لَا تَعْلَمُونَ شَيْئًا',
    translation: 'And Allah brought you out of the wombs of your mothers not knowing a thing.',
    factStatement: 'We are born helpless',
    yearRevealed: 610,
    yearDiscovered: 1800,
    category: 'biological',
    contemplation: 'Many animals walk within hours of birth. Humans are uniquely helpless for years. This verse highlights human exceptionalism—designed for learning.',
  },
  'death-certain': {
    verse: '3:185',
    surah: 'Aal-Imran',
    ayah: '185',
    arabicText: 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ',
    translation: 'Every soul will taste death.',
    factStatement: 'Death is inevitable',
    yearRevealed: 610,
    yearDiscovered: 0,
    category: 'biological',
    contemplation: 'If death is certain, why do we live as if it will never come? What would change if you truly believed this applied to you?',
  },
  'embryo-stages': {
    verse: '23:14',
    surah: 'Al-Muminun',
    ayah: '14',
    arabicText: 'ثُمَّ خَلَقْنَا النُّطْفَةَ عَلَقَةً فَخَلَقْنَا الْعَلَقَةَ مُضْغَةً فَخَلَقْنَا الْمُضْغَةَ عِظَامًا فَكَسَوْنَا الْعِظَامَ لَحْمًا',
    translation: 'Then We made the sperm-drop into a clinging clot, and We made the clot into a lump, and We made the lump into bones, and We covered the bones with flesh.',
    factStatement: 'Human formation follows specific stages in the womb',
    yearRevealed: 610,
    yearDiscovered: 1940,
    category: 'biological',
    contemplation: 'Professor Keith Moore, a leading embryologist, was so convinced by the Quran\'s accuracy that he added Islamic references to his textbook. He stated: "It is clear to me that these statements must have come to Muhammad from God, because almost all of this knowledge was not discovered until many centuries later."',
  },
  'body-heals': {
    verse: '26:80',
    surah: 'Ash-Shuara',
    ayah: '80',
    arabicText: 'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ',
    translation: 'And when I am ill, it is He who cures me.',
    factStatement: 'The body heals itself',
    yearRevealed: 610,
    yearDiscovered: 1858,
    category: 'biological',
    contemplation: 'Your body right now is fighting bacteria, repairing cells, and healing wounds—without any conscious effort from you. Who programmed this?',
  },
  'fingerprints': {
    verse: '75:4',
    surah: 'Al-Qiyamah',
    ayah: '4',
    arabicText: 'بَلَىٰ قَادِرِينَ عَلَىٰ أَن نُّسَوِّيَ بَنَانَهُ',
    translation: 'Yes, We are able to put together in perfect order the very tips of his fingers.',
    factStatement: 'Every human has unique fingerprints',
    yearRevealed: 610,
    yearDiscovered: 1892,
    category: 'biological',
    contemplation: 'Of all body parts to mention for resurrection, why fingertips? In 610 CE, nobody knew fingerprints were unique. But the Creator did.',
  },
  'skin-pain': {
    verse: '4:56',
    surah: 'An-Nisa',
    ayah: '56',
    arabicText: 'كُلَّمَا نَضِجَتْ جُلُودُهُم بَدَّلْنَاهُمْ جُلُودًا غَيْرَهَا لِيَذُوقُوا الْعَذَابَ',
    translation: 'Every time their skins are roasted through We will replace them with other skins so they may taste the punishment.',
    factStatement: 'Pain receptors are located in the skin',
    yearRevealed: 610,
    yearDiscovered: 1880,
    category: 'biological',
    contemplation: 'The people hearing this verse in the 7th century had no idea how powerful this statement was. They knew nothing about pain receptors. It was only in 1906 that science discovered pain receptors are in the skin—not deeper tissue. The verse implies that once skin is destroyed, pain stops—unless skin is replaced. How would the author know this?',
  },

  // NATURAL ORDER
  'male-female': {
    verse: '53:45',
    surah: 'An-Najm',
    ayah: '45',
    arabicText: 'وَأَنَّهُ خَلَقَ الزَّوْجَيْنِ الذَّكَرَ وَالْأُنثَىٰ',
    translation: 'And that He creates the two mates - the male and female.',
    factStatement: 'Reproduction requires male and female',
    yearRevealed: 610,
    yearDiscovered: 0,
    category: 'natural',
    contemplation: 'The Quran presents male and female as a deliberate design, not random chance. Two complementary halves that create new life. Design implies a Designer.',
  },
  'plants-male-female': {
    verse: '36:36',
    surah: 'Ya-Sin',
    ayah: '36',
    arabicText: 'سُبْحَانَ الَّذِي خَلَقَ الْأَزْوَاجَ كُلَّهَا مِمَّا تُنبِتُ الْأَرْضُ وَمِنْ أَنفُسِهِمْ وَمِمَّا لَا يَعْلَمُونَ',
    translation: 'Exalted is He who created all pairs - from what the earth grows and from themselves and from that which they do not know.',
    factStatement: 'Plants have male and female parts',
    yearRevealed: 610,
    yearDiscovered: 1694,
    category: 'natural',
    contemplation: 'Plant sexuality wasn\'t scientifically established until 1694. This verse claims even plants exist in pairs—and "things you do not know." What else remains undiscovered?',
  },
  'mountains-pegs': {
    verse: '78:7',
    surah: 'An-Naba',
    ayah: '7',
    arabicText: 'وَالْجِبَالَ أَوْتَادًا',
    translation: 'And the mountains as stakes.',
    factStatement: 'Mountains have deep roots extending into the Earth',
    yearRevealed: 610,
    yearDiscovered: 1855,
    category: 'natural',
    contemplation: 'Like tent pegs, mountains have roots far deeper than what\'s visible. This stabilizes tectonic plates. How would a 7th-century person know what\'s underground?',
  },
  'lowest-land': {
    verse: '30:2-3',
    surah: 'Ar-Rum',
    ayah: '2-3',
    arabicText: 'غُلِبَتِ الرُّومُ فِي أَدْنَى الْأَرْضِ',
    translation: 'The Romans have been defeated in the lowest land.',
    factStatement: 'The Dead Sea area is the lowest point on Earth',
    yearRevealed: 610,
    yearDiscovered: 1837,
    category: 'natural',
    contemplation: 'The battle occurred near the Dead Sea—the lowest point on Earth at 430m below sea level. "Adna" in Arabic means both "lowest" and "nearest." Both are correct.',
  },
  'female-bees': {
    verse: '16:68-69',
    surah: 'An-Nahl',
    ayah: '68-69',
    arabicText: 'وَأَوْحَىٰ رَبُّكَ إِلَى النَّحْلِ أَنِ اتَّخِذِي مِنَ الْجِبَالِ بُيُوتًا وَمِنَ الشَّجَرِ وَمِمَّا يَعْرِشُونَ ثُمَّ كُلِي مِن كُلِّ الثَّمَرَاتِ فَاسْلُكِي',
    translation: 'And your Lord inspired the bee: "Build (اتَّخِذِي - feminine) homes in the mountains... then eat (كُلِي - feminine) from fruits and follow (فَاسْلُكِي - feminine) the ways of your Lord." All verbs are feminine—addressing female bees.',
    factStatement: 'Only female bees make honey',
    yearRevealed: 610,
    yearDiscovered: 1609,
    category: 'natural',
    contemplation: 'Arabic distinguishes masculine and feminine verb forms. The word "bee" (نحل) is grammatically masculine. Yet every verb here is feminine. A grammatical "error"—unless you know only female bees do this work.',
  },
  'two-seas': {
    verse: '55:19-20',
    surah: 'Ar-Rahman',
    ayah: '19-20',
    arabicText: 'مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ',
    translation: 'He released the two seas, meeting [side by side]. Between them is a barrier [so] neither of them transgresses.',
    factStatement: 'Fresh and salt water meet but don\'t mix',
    yearRevealed: 610,
    yearDiscovered: 1942,
    category: 'natural',
    contemplation: 'At river estuaries, fresh and salt water meet but don\'t mix due to density differences. An invisible barrier keeps them separate. Who could see this underwater phenomenon in 610 CE?',
  },
  'iron-sent-down': {
    verse: '57:25',
    surah: 'Al-Hadid',
    ayah: '25',
    arabicText: 'وَأَنزَلْنَا الْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ وَمَنَافِعُ لِلنَّاسِ',
    translation: 'And We sent down iron, wherein is great military might and benefits for the people.',
    factStatement: 'Iron came from outer space',
    yearRevealed: 610,
    yearDiscovered: 1920,
    category: 'cosmic',
    contemplation: 'Iron requires supernova-level energy to form—impossible on Earth. All iron on Earth came from meteorites. "Sent down" is scientifically accurate. How would they know?',
  },
  'baby-instinct': {
    verse: '28:7',
    surah: 'Al-Qasas',
    ayah: '7',
    arabicText: 'وَأَوْحَيْنَا إِلَىٰ أُمِّ مُوسَىٰ أَنْ أَرْضِعِيهِ',
    translation: 'And We inspired to the mother of Moses, "Suckle him."',
    factStatement: 'Babies instinctively know how to nurse',
    yearRevealed: 610,
    yearDiscovered: 1950,
    category: 'natural',
    contemplation: 'Newborns automatically root and latch without being taught. This "inspiration" is built-in. Who installed these instincts in every human baby?',
  },
  'parent-protection': {
    verse: '31:14',
    surah: 'Luqman',
    ayah: '14',
    arabicText: 'حَمَلَتْهُ أُمُّهُ وَهْنًا عَلَىٰ وَهْنٍ',
    translation: 'His mother carried him, [increasing her] in weakness upon weakness.',
    factStatement: 'Parents have an innate drive to protect their young',
    yearRevealed: 610,
    yearDiscovered: 1870,
    category: 'natural',
    contemplation: 'A mother\'s body literally weakens to nurture her child. This sacrifice is built into our biology. Random evolution, or intentional design?',
  },
  'seasons-cycle': {
    verse: '30:19',
    surah: 'Ar-Rum',
    ayah: '19',
    arabicText: 'يُخْرِجُ الْحَيَّ مِنَ الْمَيِّتِ وَيُخْرِجُ الْمَيِّتَ مِنَ الْحَيِّ وَيُحْيِي الْأَرْضَ بَعْدَ مَوْتِهَا',
    translation: 'He brings the living out of the dead and brings the dead out of the living and brings to life the earth after its lifelessness.',
    factStatement: 'Nature follows cycles of life, death, and resurrection',
    yearRevealed: 610,
    yearDiscovered: 0,
    category: 'natural',
    contemplation: 'Seeds "die" in winter and "resurrect" in spring. The Earth demonstrates this pattern constantly. If nature can be resurrected, why not humans?',
  },
  'animal-intelligence': {
    verse: '27:18',
    surah: 'An-Naml',
    ayah: '18',
    arabicText: 'قَالَتْ نَمْلَةٌ يَا أَيُّهَا النَّمْلُ ادْخُلُوا مَسَاكِنَكُمْ',
    translation: 'An ant said, "O ants, enter your dwellings so that Solomon and his soldiers do not crush you."',
    factStatement: 'Animals have complex intelligence',
    yearRevealed: 610,
    yearDiscovered: 1870,
    category: 'natural',
    contemplation: 'This verse shows ants communicating, recognizing danger, and warning others. Science now confirms ants use pheromones for complex communication. How would a desert dweller know this?',
  },

  // HUMAN CONDITION
  'pharaoh-preserved': {
    verse: '10:92',
    surah: 'Yunus',
    ayah: '92',
    arabicText: 'فَالْيَوْمَ نُنَجِّيكَ بِبَدَنِكَ لِتَكُونَ لِمَنْ خَلْفَكَ آيَةً',
    translation: 'Today We will preserve your body so that you may become a sign for those who come after you.',
    factStatement: 'Pharaoh\'s body was preserved against all odds',
    yearRevealed: 610,
    yearDiscovered: 1881,
    category: 'human',
    contemplation: 'The Pharaoh who chased Moses drowned. This verse promises his body will be preserved as a sign. In 1881, his mummy was found. You can see it today in Cairo Museum.',
  },
  'moral-compass': {
    verse: '91:8',
    surah: 'Ash-Shams',
    ayah: '8',
    arabicText: 'فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَاهَا',
    translation: 'And [He] inspired it [with discernment of] its wickedness and its righteousness.',
    factStatement: 'We have an innate sense of fairness',
    yearRevealed: 610,
    yearDiscovered: 1970,
    category: 'human',
    contemplation: 'Even children who\'ve never been taught know when something is unfair. This moral compass is pre-installed. Who programmed our conscience?',
  },
  'emotions-real': {
    verse: '3:134',
    surah: 'Aal-Imran',
    ayah: '134',
    arabicText: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
    translation: 'Who restrain anger and who pardon the people.',
    factStatement: 'Emotions are real but not physical',
    yearRevealed: 610,
    yearDiscovered: 1890,
    category: 'human',
    contemplation: 'You can\'t weigh anger on a scale or see forgiveness under a microscope. Yet they\'re undeniably real. The Quran addresses the unseen reality within us.',
  },
  'organs-purpose': {
    verse: '32:9',
    surah: 'As-Sajdah',
    ayah: '9',
    arabicText: 'وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ',
    translation: 'And He made for you hearing and vision and hearts.',
    factStatement: 'Every organ has a purpose',
    yearRevealed: 610,
    yearDiscovered: 1628,
    category: 'human',
    contemplation: 'Each organ—eyes, ears, heart—is specifically designed for a function. Purpose implies a Purpose-giver. Random chance doesn\'t create cameras with auto-focus.',
  },
  'conscious-will': {
    verse: '76:3',
    surah: 'Al-Insan',
    ayah: '3',
    arabicText: 'إِنَّا هَدَيْنَاهُ السَّبِيلَ إِمَّا شَاكِرًا وَإِمَّا كَفُورًا',
    translation: 'Indeed, We guided him to the way, be he grateful or be he ungrateful.',
    factStatement: 'We can choose to defy our instincts',
    yearRevealed: 610,
    yearDiscovered: 1960,
    category: 'human',
    contemplation: 'Unlike animals driven purely by instinct, humans can choose gratitude or ingratitude, obedience or rebellion. This free will is what makes the test meaningful.',
  },
};

const categoryIcons: Record<string, React.ReactNode> = {
  cosmic: <Atom className="w-5 h-5" />,
  biological: <Sparkles className="w-5 h-5" />,
  natural: <Leaf className="w-5 h-5" />,
  human: <Heart className="w-5 h-5" />,
};

const categoryStyles: Record<string, { bg: string; border: string; text: string }> = {
  cosmic: { bg: 'bg-blue-900/50', border: 'border-blue-700/50', text: 'text-blue-400' },
  biological: { bg: 'bg-purple-900/50', border: 'border-purple-700/50', text: 'text-purple-400' },
  natural: { bg: 'bg-emerald-900/50', border: 'border-emerald-700/50', text: 'text-emerald-400' },
  human: { bg: 'bg-rose-900/50', border: 'border-rose-700/50', text: 'text-rose-400' },
};

const categoryClimaxStyles: Record<string, { bg: string; border: string }> = {
  cosmic: { bg: 'bg-blue-900/30', border: 'border-blue-700/50' },
  biological: { bg: 'bg-purple-900/30', border: 'border-purple-700/50' },
  natural: { bg: 'bg-emerald-900/30', border: 'border-emerald-700/50' },
  human: { bg: 'bg-rose-900/30', border: 'border-rose-700/50' },
};

export const AuthorityMatch = ({ agreedAxioms, onComplete }: AuthorityMatchProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showClimax, setShowClimax] = useState(false);

  // Get only the matched axioms that user agreed to
  const matchedAxioms = useMemo(() => {
    return agreedAxioms
      .filter(id => axiomToQuran[id])
      .map(id => ({ id, ...axiomToQuran[id] }));
  }, [agreedAxioms]);

  const currentMatch = matchedAxioms[currentIndex];
  const progress = ((currentIndex + 1) / matchedAxioms.length) * 100;
  const accuracyRate = matchedAxioms.length > 0
    ? Math.min(100, Math.round((verifiedCount / (currentIndex + (showClimax ? 0 : 1))) * 100))
    : 0;

  const handleVerified = () => {
    setVerifiedCount(prev => prev + 1);
    moveToNext();
  };

  const handleSkip = () => {
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex < matchedAxioms.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowClimax(true);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Intro screen - Cross-examination begins
  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gavel className="w-10 h-10 text-amber-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-6">
              Cross-Examination
            </h1>

            <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8 text-left">
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                The court has admitted <span className="text-emerald-400 font-semibold">{agreedAxioms.length} exhibits</span> as undeniable facts.
              </p>

              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Now we cross-examine: <span className="text-amber-400">Does the Quran match the evidence?</span>
              </p>

              <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
                <p className="text-amber-200 text-center">
                  For each exhibit, the Quran will testify.
                  <br />
                  <span className="font-semibold">You decide: Sustained <span className="text-amber-300/70 font-normal">(I accept this)</span> or Overruled <span className="text-amber-300/70 font-normal">(I reject this)</span>?</span>
                </p>
              </div>
            </div>

            {/* Preview dashboard */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Cross-Examination Progress</span>
                <span className="text-slate-500">Awaiting testimony...</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full mt-2">
                <div className="h-full w-0 bg-emerald-500 rounded-full" />
              </div>
            </div>

            <button
              onClick={() => setShowIntro(false)}
              className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Call the First Witness
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Climax screen - Verdict
  if (showClimax) {
    const finalAccuracy = Math.min(100, Math.round((verifiedCount / matchedAxioms.length) * 100));

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Verdict Dashboard */}
            <div className="bg-slate-900/80 rounded-2xl p-8 border border-emerald-500/30 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl text-slate-300">Cross-Examination Results</h2>
              </div>

              <div className="text-7xl font-bold text-emerald-400 mb-2">
                {finalAccuracy}%
              </div>

              <p className="text-slate-400 mb-6">
                {verifiedCount} of {matchedAxioms.length} testimonies sustained
              </p>

              {/* Category breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['cosmic', 'biological', 'natural', 'human'].map(cat => {
                  const catMatches = matchedAxioms.filter(m => m.category === cat);
                  const styles = categoryClimaxStyles[cat];
                  return catMatches.length > 0 && (
                    <div key={cat} className={`${styles.bg} rounded-lg p-3 border ${styles.border}`}>
                      <div className={`flex items-center gap-2 ${categoryStyles[cat].text} text-sm`}>
                        {categoryIcons[cat]}
                        <span className="capitalize">{cat}</span>
                      </div>
                      <p className="text-white font-semibold text-lg mt-1">
                        {catMatches.length} verified
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The Revelation - Fiction vs Reality */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              {/* The Fiction */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600 mb-4">
                <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">The Fiction</p>
                <h3 className="text-2xl font-serif text-white mb-3">
                  Grays Sports Almanac
                </h3>
                <p className="text-slate-300">
                  A made-up book from a movie. It recorded sports scores.
                  <br />
                  <span className="text-slate-500 italic">Biff used it to get rich.</span>
                </p>
              </div>

              {/* The Reality */}
              <div className="bg-emerald-900/30 rounded-2xl p-6 border border-emerald-500/50">
                <p className="text-emerald-400 text-sm uppercase tracking-wider mb-2">The Reality</p>
                <h3 className="text-3xl font-serif text-white mb-3">
                  The Quran
                </h3>
                <p className="text-emerald-200 text-lg leading-relaxed mb-4">
                  A <span className="text-white font-semibold">real book</span> from over 1,400 years ago that recorded facts about the universe, biology, nature, and humanity—
                  <span className="text-amber-300"> centuries before science discovered them</span>.
                </p>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-amber-300 text-lg font-medium">
                    The Almanac was fiction.
                  </p>
                  <p className="text-white text-xl font-serif mt-2">
                    The Quran is real. And you just verified it.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Next Step */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-slate-400 mb-4">
                If the Quran was right about all of this... what else does it say?
              </p>
              <button
                onClick={onComplete}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400">No matching verses for your agreed facts.</p>
          <button
            onClick={onComplete}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-full"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const catStyles = categoryStyles[currentMatch.category];
  const yearsAhead = currentMatch.yearDiscovered > 0
    ? currentMatch.yearDiscovered - currentMatch.yearRevealed
    : 'Always known';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-emerald-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header Dashboard */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur rounded-xl p-3 border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-slate-400 text-sm">
              Exhibit: <span className="text-white font-semibold">{currentIndex + 1}</span> / {matchedAxioms.length}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 ${catStyles.bg} rounded-full border ${catStyles.border}`}>
              <span className={catStyles.text}>{categoryIcons[currentMatch.category]}</span>
              <span className={`${catStyles.text} text-sm capitalize`}>{currentMatch.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">{verifiedCount}</span>
            <span className="text-slate-500 text-sm">sustained</span>
          </div>
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMatch.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl w-full"
          >
            {/* The Match Card - Three Column Layout */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-700 overflow-hidden mb-6">
              {/* Row 1: The Fact */}
              <div className="bg-slate-800/50 p-6 border-b border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>You agreed this is true:</span>
                </div>
                <p className="text-xl text-white font-medium">
                  {currentMatch.factStatement}
                </p>
              </div>

              {/* Row 2: The Comparison - Three Columns */}
              <div className="grid grid-cols-3 divide-x divide-slate-700">
                {/* The Book (over 1,400 years ago) */}
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-400 text-sm mb-3">
                    <BookOpen className="w-4 h-4" />
                    <span>The Book</span>
                  </div>
                  <p className="text-slate-500 text-xs mb-1">610 CE</p>
                  <p className="text-amber-300 font-arabic text-lg leading-relaxed" dir="rtl">
                    {currentMatch.arabicText.slice(0, 50)}...
                  </p>
                </div>

                {/* The Reality (Today) */}
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-400 text-sm mb-3">
                    <Atom className="w-4 h-4" />
                    <span>Science</span>
                  </div>
                  <p className="text-slate-500 text-xs mb-1">
                    {currentMatch.yearDiscovered > 0 ? `${currentMatch.yearDiscovered} CE` : 'Observable'}
                  </p>
                  <p className="text-blue-300 text-sm">
                    {currentMatch.factStatement}
                  </p>
                </div>

                {/* Status */}
                <div className="p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                    <Gavel className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-semibold">CORROBORATES</span>
                </div>
              </div>

              {/* Row 3: Full Verse */}
              <div className="p-6 bg-slate-800/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm">Surah {currentMatch.surah} ({currentMatch.verse})</span>
                  {typeof yearsAhead === 'number' && (
                    <div className="flex items-center gap-1.5 text-amber-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{yearsAhead} years before science</span>
                    </div>
                  )}
                </div>

                {/* Arabic text */}
                <p className="text-2xl text-amber-300 font-arabic leading-loose text-center mb-4" dir="rtl">
                  {currentMatch.arabicText}
                </p>

                {/* Translation */}
                <p className="text-lg text-slate-200 text-center italic">
                  "{currentMatch.translation}"
                </p>
              </div>

              {/* Row 4: Contemplation Point */}
              {currentMatch.contemplation && (
                <div className="p-5 bg-amber-900/20 border-t border-amber-700/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-amber-400 text-xs font-medium uppercase tracking-wide mb-1">
                        Pause & Reflect
                      </p>
                      <p className="text-amber-100 leading-relaxed">
                        {currentMatch.contemplation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* The Question */}
            <div className="text-center mb-6">
              <p className="text-xl text-slate-300">
                Does the testimony match the evidence?
              </p>
            </div>

            {/* Response Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleVerified}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Gavel className="w-5 h-5" />
                Sustained <span className="text-emerald-200 font-normal text-sm">(I accept)</span>
              </button>
              <button
                onClick={handleSkip}
                className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition"
              >
                Overruled <span className="text-slate-400 font-normal text-sm">(Not sure)</span>
              </button>
            </div>

            {/* Navigation */}
            {currentIndex > 0 && (
              <div className="text-center mt-6">
                <button
                  onClick={handleBack}
                  className="text-slate-400 hover:text-slate-200 transition flex items-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthorityMatch;
