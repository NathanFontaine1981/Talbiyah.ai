import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Sparkles, TrendingUp, Check, Atom, Heart, Leaf, Clock } from 'lucide-react';

interface AuthorityMatchProps {
  agreedAxioms: string[];
  onComplete: () => void;
}

// Mapping of all 21 axiom IDs to their Quranic revelations
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
  },

  // HUMAN CONDITION
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
    ? Math.round((verifiedCount / (currentIndex + (showClimax ? 0 : 1))) * 100)
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

  // Intro screen - "Let's audit the track record"
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
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-blue-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-6">
              Checking the Past Scores
            </h1>

            <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8 text-left">
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                You've agreed to <span className="text-emerald-400 font-semibold">{agreedAxioms.length} undeniable facts</span> about reality.
              </p>

              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Now let's check: <span className="text-amber-400">Did the Almanac get these right?</span>
              </p>

              <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/50">
                <p className="text-blue-200 text-center">
                  For each fact, we'll show you what a 1,400-year-old book says.
                  <br />
                  <span className="font-semibold">You decide: Match or Miss?</span>
                </p>
              </div>
            </div>

            {/* Preview dashboard */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Predictive Accuracy</span>
                <span className="text-slate-500">Starting audit...</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full mt-2">
                <div className="h-full w-0 bg-emerald-500 rounded-full" />
              </div>
            </div>

            <button
              onClick={() => setShowIntro(false)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Begin Verification
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Climax screen
  if (showClimax) {
    const finalAccuracy = Math.round((verifiedCount / matchedAxioms.length) * 100);

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
            {/* Accuracy Dashboard */}
            <div className="bg-slate-900/80 rounded-2xl p-8 border border-emerald-500/30 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl text-slate-300">Predictive Accuracy Report</h2>
              </div>

              <div className="text-7xl font-bold text-emerald-400 mb-2">
                {finalAccuracy}%
              </div>

              <p className="text-slate-400 mb-6">
                {verifiedCount} of {matchedAxioms.length} facts verified
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

            {/* The Revelation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-emerald-900/30 rounded-2xl p-8 border border-emerald-500/50 mb-8"
            >
              <h3 className="text-3xl font-serif text-white mb-4">
                The Almanac is Real
              </h3>

              <p className="text-xl text-emerald-200 leading-relaxed mb-4">
                A book from 1,400 years ago knew what humanity only discovered centuries later.
              </p>

              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <p className="text-amber-300 text-lg font-medium">
                  If it got the past right...
                </p>
                <p className="text-white text-xl font-serif mt-2">
                  Why not trust it for the future?
                </p>
              </div>
            </motion.div>

            {/* Next Step */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-slate-400 mb-4">
                Ready to use the Almanac's cheat codes for life?
              </p>
              <button
                onClick={onComplete}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                Show Me the Cheat Codes
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
              Checking: <span className="text-white font-semibold">{currentIndex + 1}</span> / {matchedAxioms.length}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 ${catStyles.bg} rounded-full border ${catStyles.border}`}>
              <span className={catStyles.text}>{categoryIcons[currentMatch.category]}</span>
              <span className={`${catStyles.text} text-sm capitalize`}>{currentMatch.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">{verifiedCount}</span>
            <span className="text-slate-500 text-sm">verified</span>
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
                {/* The Book (1400 years ago) */}
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
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-semibold">MATCH</span>
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
            </div>

            {/* The Question */}
            <div className="text-center mb-6">
              <p className="text-xl text-slate-300">
                Does this count as a match?
              </p>
            </div>

            {/* Response Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleVerified}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Yes, That's a Match
              </button>
              <button
                onClick={handleSkip}
                className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition"
              >
                Not Sure / Skip
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
