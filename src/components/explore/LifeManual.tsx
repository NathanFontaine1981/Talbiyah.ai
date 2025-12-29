import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Heart, Shield, Coins, Users, Brain, Sparkles } from 'lucide-react';

interface Solution {
  id: string;
  problem: string;
  keywords: string[];
  category: 'emotional' | 'financial' | 'relationships' | 'spiritual' | 'practical';
  verse: string;
  surah: string;
  arabicText: string;
  translation: string;
  practicalAdvice: string;
}

const solutions: Solution[] = [
  {
    id: 'anxiety',
    problem: 'Anxiety & Worry',
    keywords: ['anxiety', 'worry', 'stress', 'fear', 'nervous', 'panic', 'overwhelmed'],
    category: 'emotional',
    verse: '13:28',
    surah: 'Ar-Ra\'d',
    arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Verily, in the remembrance of Allah do hearts find rest.',
    practicalAdvice: 'Practice dhikr (remembrance of Allah) daily. Start with "SubhanAllah, Alhamdulillah, Allahu Akbar" 33 times each after prayer.'
  },
  {
    id: 'debt',
    problem: 'Debt & Financial Hardship',
    keywords: ['debt', 'money', 'broke', 'poor', 'financial', 'bills', 'loan'],
    category: 'financial',
    verse: '2:280',
    surah: 'Al-Baqarah',
    arabicText: 'وَإِن كَانَ ذُو عُسْرَةٍ فَنَظِرَةٌ إِلَىٰ مَيْسَرَةٍ',
    translation: 'And if someone is in hardship, then let there be postponement until a time of ease.',
    practicalAdvice: 'Islam encourages debt relief and patience. Make dua for provision, give sadaqah even if small, and trust Allah\'s timing.'
  },
  {
    id: 'anger',
    problem: 'Anger & Frustration',
    keywords: ['anger', 'angry', 'frustrated', 'mad', 'rage', 'temper', 'irritated'],
    category: 'emotional',
    verse: '3:134',
    surah: 'Aal-Imran',
    arabicText: 'الَّذِينَ يُنفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
    translation: 'Those who spend in prosperity and adversity, who restrain anger, and who pardon the people—Allah loves the doers of good.',
    practicalAdvice: 'When angry: 1) Say "A\'udhu billahi min ash-shaytan ir-rajim", 2) If standing, sit down, 3) Make wudu with cold water.'
  },
  {
    id: 'loneliness',
    problem: 'Loneliness & Isolation',
    keywords: ['lonely', 'alone', 'isolated', 'no friends', 'depressed', 'sad'],
    category: 'emotional',
    verse: '2:186',
    surah: 'Al-Baqarah',
    arabicText: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
    translation: 'And when My servants ask you concerning Me, indeed I am near.',
    practicalAdvice: 'Allah is always with you. Talk to Him in sujood, attend the masjid for community, and remember: the Prophet ﷺ said "A Muslim is the brother of a Muslim."'
  },
  {
    id: 'fear-future',
    problem: 'Fear of the Future',
    keywords: ['future', 'scared', 'uncertain', 'what if', 'tomorrow', 'career', 'job'],
    category: 'spiritual',
    verse: '65:3',
    surah: 'At-Talaq',
    arabicText: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translation: 'And whoever relies upon Allah—then He is sufficient for him.',
    practicalAdvice: 'Tawakkul (trust in Allah) means doing your best then trusting the outcome to Allah. Plan, prepare, then let go of anxiety about results.'
  },
  {
    id: 'family-conflict',
    problem: 'Family Conflicts',
    keywords: ['family', 'parents', 'siblings', 'relatives', 'argument', 'fight', 'conflict'],
    category: 'relationships',
    verse: '4:36',
    surah: 'An-Nisa',
    arabicText: 'وَبِالْوَالِدَيْنِ إِحْسَانًا وَبِذِي الْقُرْبَىٰ',
    translation: 'And to parents do good, and to relatives.',
    practicalAdvice: 'Maintaining family ties is obligatory even when difficult. Be the first to reconcile, give gifts, and speak kindly even when wronged.'
  },
  {
    id: 'bad-habits',
    problem: 'Breaking Bad Habits',
    keywords: ['addiction', 'habit', 'sin', 'struggling', 'can\'t stop', 'relapse', 'temptation'],
    category: 'spiritual',
    verse: '39:53',
    surah: 'Az-Zumar',
    arabicText: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah.',
    practicalAdvice: 'Every fall is a chance to rise. Make sincere tawbah, replace bad habits with good ones, and keep good company who remind you of Allah.'
  },
  {
    id: 'self-doubt',
    problem: 'Self-Doubt & Low Confidence',
    keywords: ['doubt', 'confidence', 'insecure', 'worthless', 'failure', 'can\'t do it', 'imposter'],
    category: 'emotional',
    verse: '94:5-6',
    surah: 'Ash-Sharh',
    arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'For indeed, with hardship comes ease. Indeed, with hardship comes ease.',
    practicalAdvice: 'Allah created you with purpose. Hardship is temporary and builds character. Remember: you are a khalifah (vicegerent) on this earth.'
  },
  {
    id: 'gratitude',
    problem: 'Feeling Ungrateful',
    keywords: ['ungrateful', 'complaining', 'never enough', 'jealous', 'envy', 'comparing'],
    category: 'spiritual',
    verse: '14:7',
    surah: 'Ibrahim',
    arabicText: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    translation: 'If you are grateful, I will surely increase you [in favor].',
    practicalAdvice: 'Start a gratitude journal. Say "Alhamdulillah" for 3 specific things each morning. Look at those with less, not more.'
  },
  {
    id: 'patience',
    problem: 'Losing Patience',
    keywords: ['patience', 'impatient', 'waiting', 'taking too long', 'frustrated', 'when'],
    category: 'spiritual',
    verse: '2:153',
    surah: 'Al-Baqarah',
    arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    translation: 'O you who believe, seek help through patience and prayer.',
    practicalAdvice: 'Sabr (patience) is mentioned 90+ times in the Quran. It\'s a muscle—train it with small tests. Know that Allah\'s timing is perfect.'
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  emotional: <Heart className="w-5 h-5" />,
  financial: <Coins className="w-5 h-5" />,
  relationships: <Users className="w-5 h-5" />,
  spiritual: <Sparkles className="w-5 h-5" />,
  practical: <Brain className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  emotional: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
  financial: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  relationships: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  spiritual: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
  practical: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
};

interface LifeManualProps {
  onClose?: () => void;
}

export const LifeManual = ({ onClose }: LifeManualProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);

  const filteredSolutions = useMemo(() => {
    if (!searchQuery.trim()) return solutions.slice(0, 4); // Show first 4 by default

    const query = searchQuery.toLowerCase();
    return solutions.filter(solution =>
      solution.problem.toLowerCase().includes(query) ||
      solution.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-emerald-500/30 max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-2xl font-serif text-white">The Life Manual</h3>
          <p className="text-slate-400 text-sm">Search for guidance on any life challenge</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="How do I deal with anxiety, debt, anger..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800 text-white pl-12 pr-4 py-4 rounded-xl
            focus:ring-2 ring-emerald-500 focus:outline-none
            placeholder-slate-500 text-lg"
        />
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {selectedSolution ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Back button */}
            <button
              onClick={() => setSelectedSolution(null)}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition"
            >
              ← Back to results
            </button>

            {/* Solution Card */}
            <div className={`bg-gradient-to-br ${categoryColors[selectedSolution.category]} rounded-xl p-6 border`}>
              <div className="flex items-center gap-2 mb-4">
                {categoryIcons[selectedSolution.category]}
                <span className="text-white font-medium">{selectedSolution.problem}</span>
              </div>

              {/* Arabic Text */}
              <div className="text-center mb-4">
                <p className="text-2xl text-amber-300 font-arabic leading-loose" dir="rtl">
                  {selectedSolution.arabicText}
                </p>
              </div>

              {/* Translation */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <p className="text-white text-lg italic mb-2">
                  "{selectedSolution.translation}"
                </p>
                <p className="text-slate-400 text-sm">
                  — Surah {selectedSolution.surah}, Verse {selectedSolution.verse}
                </p>
              </div>

              {/* Practical Advice */}
              <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-700/50">
                <h4 className="text-emerald-300 font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Practical Application
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedSolution.practicalAdvice}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredSolutions.length > 0 ? (
              filteredSolutions.map((solution) => (
                <motion.button
                  key={solution.id}
                  onClick={() => setSelectedSolution(solution)}
                  className={`w-full bg-gradient-to-r ${categoryColors[solution.category]}
                    rounded-xl p-4 border text-left hover:scale-[1.02] transition-transform`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900/50 rounded-full flex items-center justify-center">
                        {categoryIcons[solution.category]}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{solution.problem}</h4>
                        <p className="text-slate-400 text-sm">
                          Surah {solution.surah} • {solution.verse}
                        </p>
                      </div>
                    </div>
                    <div className="text-slate-400">→</div>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No specific guidance found for "{searchQuery}"</p>
                <p className="text-sm mt-2">Try different keywords like "stress", "money", or "family"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer hint */}
      {!selectedSolution && (
        <p className="text-center text-slate-500 text-sm mt-6">
          {solutions.length} life solutions available
        </p>
      )}
    </div>
  );
};

export default LifeManual;
