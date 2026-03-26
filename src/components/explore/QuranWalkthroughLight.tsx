import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ChevronRight, ChevronLeft, Globe, Dna, Droplets, Mountain,
  Fingerprint, Heart, Brain, Clock, Target, Zap,
  BookOpen, Microscope, Bug, Milk, Leaf,
  CheckCircle2, AlertTriangle, ArrowRight, UserX, X,
  HelpCircle, Crown, Send, Shield, Compass,
} from 'lucide-react';
import AlmanacGame from './AlmanacGame';

interface QuranWalkthroughLightProps {
  onComplete: () => void;
  onGoDeeper?: () => void;
}

// ── Sign data ─────────────────────────────────────────────────────────────

interface Sign {
  icon: React.ReactNode;
  title: string;
  verse: string;
  verseRef: string;
  arabicVerse: string;
  fact: string;
  discoveredBy?: string;
}

// Phase 1: Where did the universe begin?
const COSMOLOGY_SIGNS: Sign[] = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'The Big Bang',
    verse: 'Do not the disbelievers see that the heavens and the earth were a joined entity, and then We separated them?',
    arabicVerse: 'أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا',
    verseRef: 'Al-Anbiya 21:30',
    fact: 'The universe began as a single point that expanded outward. Confirmed by Georges Lemaitre in 1927.',
    discoveredBy: '1,300 years before modern cosmology',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'The Expanding Universe',
    verse: 'And the heaven We constructed with strength, and indeed, We are its expander.',
    arabicVerse: 'وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ',
    verseRef: 'Adh-Dhariyat 51:47',
    fact: 'Edwin Hubble discovered the universe is expanding in 1929. The Quran stated it 1,300 years earlier.',
    discoveredBy: '1,300 years before Hubble',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Orbital Motion',
    verse: 'Each in an orbit is swimming.',
    arabicVerse: 'كُلٌّ فِي فَلَكٍ يَسْبَحُونَ',
    verseRef: 'Al-Anbiya 21:33',
    fact: 'The Arabic word "yasbahoon" means "swimming" — perfectly describing smooth, continuous orbital motion through space.',
    discoveredBy: '977 years before Kepler',
  },
];

// Phase 2: Where did YOU come from?
const CREATION_SIGNS: Sign[] = [
  {
    icon: <Dna className="w-5 h-5" />,
    title: 'Embryonic Stages',
    verse: 'Then We made the sperm-drop into a clinging clot, and We made the clot into a lump, and We made from the lump bones, and We covered the bones with flesh.',
    arabicVerse: 'ثُمَّ خَلَقْنَا النُّطْفَةَ عَلَقَةً فَخَلَقْنَا الْعَلَقَةَ مُضْغَةً فَخَلَقْنَا الْمُضْغَةَ عِظَامًا فَكَسَوْنَا الْعِظَامَ لَحْمًا',
    verseRef: 'Al-Mu\'minun 23:14',
    fact: 'Modern embryology confirms this exact sequence. Prof. Keith Moore, author of the standard university textbook on embryology, published a special edition acknowledging the Quran\'s accuracy.',
    discoveredBy: '1,195 years before modern embryology',
  },
  {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Life from Water',
    verse: 'And We made from water every living thing.',
    arabicVerse: 'وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ',
    verseRef: 'Al-Anbiya 21:30',
    fact: 'Every living organism is water-based. The human body is ~60% water. No life exists without it. Stated in a desert 1,400 years ago.',
    discoveredBy: 'Confirmed by modern biology',
  },
];

// Phase 3: He knows His creation
const KNOWLEDGE_SIGNS: Sign[] = [
  {
    icon: <Milk className="w-5 h-5" />,
    title: 'Milk from Between Blood and Digested Food',
    verse: 'We produce for you from what is within their bellies — from between excretions and blood — pure milk, palatable to drinkers.',
    arabicVerse: 'نُّسْقِيكُم مِّمَّا فِي بُطُونِهِ مِن بَيْنِ فَرْثٍ وَدَمٍ لَّبَنًا خَالِصًا سَائِغًا لِّلشَّارِبِينَ',
    verseRef: 'An-Nahl 16:66',
    fact: 'Milk is produced in mammary glands from nutrients absorbed from digested food (chyme) carried by the blood. Pure milk emerging from between these two — exactly as described.',
    discoveredBy: 'Confirmed by modern physiology',
  },
  {
    icon: <Bug className="w-5 h-5" />,
    title: 'The Female Bee',
    verse: 'And your Lord inspired the bee: "Build homes in mountains and trees and in what they construct. Then eat from all fruits and follow the pathways of your Lord."',
    arabicVerse: 'وَأَوْحَىٰ رَبُّكَ إِلَى النَّحْلِ أَنِ اتَّخِذِي مِنَ الْجِبَالِ بُيُوتًا',
    verseRef: 'An-Nahl 16:68-69',
    fact: 'The Arabic uses FEMININE verb forms — "ittakhithi", "kuli", "fasluki". Only female bees build hives, forage, and produce honey. This wasn\'t known until modern entomology.',
    discoveredBy: 'Linguistic precision impossible to guess',
  },
  {
    icon: <Bug className="w-5 h-5" />,
    title: 'Honey as Medicine',
    verse: 'There emerges from their bellies a drink of varying colours, in which there is healing for people.',
    arabicVerse: 'يَخْرُجُ مِن بُطُونِهَا شَرَابٌ مُّخْتَلِفٌ أَلْوَانُهُ فِيهِ شِفَاءٌ لِّلنَّاسِ',
    verseRef: 'An-Nahl 16:69',
    fact: 'Modern medicine confirms honey has antibacterial, anti-inflammatory, and wound-healing properties. It\'s used in clinical wound dressings worldwide.',
    discoveredBy: 'Confirmed by modern medicine',
  },
  {
    icon: <Leaf className="w-5 h-5" />,
    title: 'Animal Communities',
    verse: 'There is no creature on earth, nor any bird that flies with its wings, but they are communities like you.',
    arabicVerse: 'وَمَا مِن دَابَّةٍ فِي الْأَرْضِ وَلَا طَائِرٍ يَطِيرُ بِجَنَاحَيْهِ إِلَّا أُمَمٌ أَمْثَالُكُمْ',
    verseRef: 'Al-An\'am 6:38',
    fact: 'Modern zoology confirms animals live in structured communities with social hierarchies, communication systems, and cooperative behaviour — just like humans.',
    discoveredBy: 'Confirmed by modern zoology',
  },
  {
    icon: <Droplets className="w-5 h-5" />,
    title: 'The Barrier Between Two Seas',
    verse: 'He released the two seas, meeting side by side. Between them is a barrier so neither of them transgresses.',
    arabicVerse: 'مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ',
    verseRef: 'Ar-Rahman 55:19-20',
    fact: 'Where fresh and salt water meet, a halocline forms — a visible barrier. The waters don\'t mix due to density differences.',
    discoveredBy: '1,271 years before modern oceanography',
  },
  {
    icon: <Mountain className="w-5 h-5" />,
    title: 'Mountains as Pegs',
    verse: 'Have We not made the earth a resting place? And the mountains as stakes?',
    arabicVerse: 'أَلَمْ نَجْعَلِ الْأَرْضَ مِهَادًا وَالْجِبَالَ أَوْتَادًا',
    verseRef: 'An-Naba 78:6-7',
    fact: 'Mountains have deep roots extending into the mantle — like pegs stabilising tectonic plates. Confirmed by geology.',
    discoveredBy: '1,223 years before George Airy',
  },
  {
    icon: <Fingerprint className="w-5 h-5" />,
    title: 'Unique Fingerprints',
    verse: 'Yes, We are able to put together in perfect order the very tips of his fingers.',
    arabicVerse: 'بَلَىٰ قَادِرِينَ عَلَىٰ أَن نُّسَوِّيَ بَنَانَهُ',
    verseRef: 'Al-Qiyamah 75:3-4',
    fact: 'Every human has unique fingerprints — even identical twins. Highlighted 1,300 years before forensic science.',
    discoveredBy: '1,260 years before Sir Francis Galton',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Pain Receptors in Skin',
    verse: 'Every time their skins are roasted through, We will replace them with other skins so they may taste the punishment.',
    arabicVerse: 'كُلَّمَا نَضِجَتْ جُلُودُهُم بَدَّلْنَاهُمْ جُلُودًا غَيْرَهَا لِيَذُوقُوا الْعَذَابَ',
    verseRef: 'An-Nisa 4:56',
    fact: 'Pain receptors (nociceptors) are concentrated in the skin. Burns destroy them, stopping pain. Replacing skin resets the ability to feel.',
    discoveredBy: '1,274 years before Charles Sherrington',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Iron Sent Down',
    verse: 'And We sent down iron, wherein is great military might and benefits for the people.',
    arabicVerse: 'وَأَنزَلْنَا الْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ وَمَنَافِعُ لِلنَّاسِ',
    verseRef: 'Al-Hadid 57:25',
    fact: 'Iron cannot form inside our sun — it requires a supernova. All iron on Earth literally came from outer space. The Quran says "sent down" — not "created from the earth".',
    discoveredBy: 'Confirmed by astrophysics',
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Pharaoh\'s Body Preserved',
    verse: 'Today We will preserve your body so you can be a sign for those who come after you.',
    arabicVerse: 'فَالْيَوْمَ نُنَجِّيكَ بِبَدَنِكَ لِتَكُونَ لِمَنْ خَلْفَكَ آيَةً',
    verseRef: 'Yunus 10:92',
    fact: 'Pharaoh drowned — yet his mummy was found intact in 1898. Salt deposits confirmed drowning in seawater. It sits in Cairo Museum to this day.',
    discoveredBy: 'Body discovered 1898',
  },
];

// Phase 5: What is coming — future events described in past tense
interface FutureSign {
  title: string;
  verse: string;
  arabicVerse: string;
  verseRef: string;
  arabicNote: string;
}

const FUTURE_SIGNS: FutureSign[] = [
  {
    title: 'The Earth Shaken',
    verse: 'When the earth is shaken with its final earthquake, and the earth discharges its burdens, and man says, "What is wrong with it?"',
    arabicVerse: 'إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا وَأَخْرَجَتِ الْأَرْضُ أَثْقَالَهَا وَقَالَ الْإِنسَانُ مَا لَهَا',
    verseRef: 'Az-Zalzalah 99:1-3',
    arabicNote: '"Zulzilat" — past tense. As if it has already happened.',
  },
  {
    title: 'The Sun Wrapped Up',
    verse: 'When the sun is wrapped up, when the stars fall and scatter, when the mountains are moved away...',
    arabicVerse: 'إِذَا الشَّمْسُ كُوِّرَتْ وَإِذَا النُّجُومُ انكَدَرَتْ وَإِذَا الْجِبَالُ سُيِّرَتْ',
    verseRef: 'At-Takwir 81:1-3',
    arabicNote: '"Kuwwirat" — past tense. The sun folded up, as though it\'s done.',
  },
  {
    title: 'The Sky Split Apart',
    verse: 'When the sky breaks apart, and when the stars are scattered, and when the seas are erupted...',
    arabicVerse: 'إِذَا السَّمَاءُ انفَطَرَتْ وَإِذَا الْكَوَاكِبُ انتَثَرَتْ وَإِذَا الْبِحَارُ فُجِّرَتْ',
    verseRef: 'Al-Infitar 82:1-3',
    arabicNote: '"Infatarat" — past tense. The sky already broken.',
  },
  {
    title: 'The Striking Calamity',
    verse: 'The Striking Calamity — what is the Striking Calamity? And what can make you know what the Striking Calamity is?',
    arabicVerse: 'الْقَارِعَةُ مَا الْقَارِعَةُ وَمَا أَدْرَاكَ مَا الْقَارِعَةُ',
    verseRef: 'Al-Qari\'ah 101:1-3',
    arabicNote: 'A direct address — "What can make YOU know?" — speaking to you personally.',
  },
  {
    title: 'The Weighing of Deeds',
    verse: 'Then as for he whose scales are heavy — he will be in a pleasant life. But as for he whose scales are light — his refuge will be the Abyss.',
    arabicVerse: 'فَأَمَّا مَن ثَقُلَتْ مَوَازِينُهُ فَهُوَ فِي عِيشَةٍ رَّاضِيَةٍ وَأَمَّا مَنْ خَفَّتْ مَوَازِينُهُ فَأُمُّهُ هَاوِيَةٌ',
    verseRef: 'Al-Qari\'ah 101:6-9',
    arabicNote: '"Thaqulat", "khaffat" — past tense. Already weighed. Already decided.',
  },
];

// ── Origin story — the inner conversation ──────────────────────────────

interface OriginStep {
  question: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  verses: {
    arabic: string;
    english: string;
    ref: string;
  }[];
  reflection: string;
}

const ORIGIN_STEPS: OriginStep[] = [
  {
    question: 'Where did I come from?',
    subtitle: 'The first question every soul asks',
    icon: <HelpCircle className="w-6 h-6" />,
    iconBg: 'bg-[#2a3a5c]/60',
    verses: [
      {
        arabic: 'الَّذِي أَحْسَنَ كُلَّ شَيْءٍ خَلَقَهُ ۖ وَبَدَأَ خَلْقَ الْإِنسَانِ مِن طِينٍ ثُمَّ جَعَلَ نَسْلَهُ مِن سُلَالَةٍ مِّن مَّاءٍ مَّهِينٍ ثُمَّ سَوَّاهُ وَنَفَخَ فِيهِ مِن رُّوحِهِ',
        english: 'He who perfected everything He created, and began the creation of man from clay. Then He made his posterity from an extract of a humble fluid. Then He proportioned him and breathed into him from His soul.',
        ref: 'As-Sajdah 32:7-9',
      },
    ],
    reflection: 'You weren\'t an accident. You were designed — shaped, proportioned, and given a soul breathed into you by your Creator.',
  },
  {
    question: 'What makes me special?',
    subtitle: 'Why you — out of all creation',
    icon: <Crown className="w-6 h-6" />,
    iconBg: 'bg-[#3d2e1a]/60',
    verses: [
      {
        arabic: 'وَإِذْ قَالَ رَبُّكَ لِلْمَلَائِكَةِ إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً',
        english: 'And when your Lord said to the angels, "Indeed, I will make upon the earth a successive authority."',
        ref: 'Al-Baqarah 2:30',
      },
      {
        arabic: 'وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ',
        english: 'And We have certainly honoured the children of Adam.',
        ref: 'Al-Isra 17:70',
      },
    ],
    reflection: 'God announced your coming to the angels. You were placed on this earth with purpose — as His representative, honoured above the rest of creation.',
  },
  {
    question: 'Why was I sent to this world?',
    subtitle: 'The descent — and the reason behind it',
    icon: <Send className="w-6 h-6" />,
    iconBg: 'bg-[#1a2744]/60',
    verses: [
      {
        arabic: 'قُلْنَا اهْبِطُوا مِنْهَا جَمِيعًا',
        english: '"Go down from it, all of you."',
        ref: 'Al-Baqarah 2:38',
      },
      {
        arabic: 'قَالَ اهْبِطَا مِنْهَا جَمِيعًا ۖ بَعْضُكُمْ لِبَعْضٍ عَدُوٌّ',
        english: '"Descend from it, all of you. Some of you will be enemies to others."',
        ref: 'Ta-Ha 20:123',
      },
    ],
    reflection: 'You were sent here. This world is not your home — it\'s your test. A temporary place with a permanent consequence.',
  },
  {
    question: 'Do you think you were created without purpose?',
    subtitle: 'The question that confronts you',
    icon: <Target className="w-6 h-6" />,
    iconBg: 'bg-[#2e2215]/60',
    verses: [
      {
        arabic: 'أَفَحَسِبْتُمْ أَنَّمَا خَلَقْنَاكُمْ عَبَثًا وَأَنَّكُمْ إِلَيْنَا لَا تُرْجَعُونَ',
        english: '"Did you think that We created you without purpose, and that to Us you would not be returned?"',
        ref: 'Al-Mu\'minun 23:115',
      },
      {
        arabic: 'أَيَحْسَبُ الْإِنسَانُ أَن يُتْرَكَ سُدًى',
        english: '"Does man think he will be left alone without being tested?"',
        ref: 'Al-Qiyamah 75:36',
      },
      {
        arabic: 'اعْلَمُوا أَنَّمَا الْحَيَاةُ الدُّنْيَا لَعِبٌ وَلَهْوٌ وَزِينَةٌ',
        english: '"Know that the life of this world is but amusement, diversion, and adornment."',
        ref: 'Al-Hadid 57:20',
      },
    ],
    reflection: 'He\'s speaking directly to you. This life — the distractions, the entertainment, the status — it\'s temporary. You were created with purpose and you will be returned to Him.',
  },
  {
    question: 'Will I be left alone?',
    subtitle: 'The promise that changes everything',
    icon: <Shield className="w-6 h-6" />,
    iconBg: 'bg-[#132e2a]/60',
    verses: [
      {
        arabic: 'فَإِمَّا يَأْتِيَنَّكُم مِّنِّي هُدًى فَمَن تَبِعَ هُدَايَ فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ',
        english: '"When guidance comes to you from Me, whoever follows My guidance — there will be no fear upon them, nor will they grieve."',
        ref: 'Al-Baqarah 2:38',
      },
      {
        arabic: 'فَمَنِ اتَّبَعَ هُدَايَ فَلَا يَضِلُّ وَلَا يَشْقَىٰ',
        english: '"Whoever follows My guidance will neither go astray nor suffer."',
        ref: 'Ta-Ha 20:123',
      },
    ],
    reflection: 'He didn\'t send you here and abandon you. He promised guidance — a book, messengers, signs — so you could find your way back.',
  },
];

// ── Phase type ──────────────────────────────────────────────────────────

type LightPhase =
  | 'intro' | 'origin'
  | 'cosmology' | 'creation' | 'knowledge' | 'purpose' | 'the-way' | 'future-intro' | 'future-events'
  | 'who-wrote-it' | 'the-concept' | 'almanac'
  | 'go-deeper';

// ── Sign Card Component ─────────────────────────────────────────────────

function SignCard({ sign, index, isRevealed, onReveal }: {
  sign: Sign;
  index: number;
  isRevealed: boolean;
  onReveal: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <button
        onClick={onReveal}
        className={`w-full text-left rounded-xl border transition-all ${
          isRevealed
            ? 'bg-[#132e2a]/50 border-[#1f5c4d]/40 p-4'
            : 'bg-[#1a2744]/60 border-[#2a3a5c]/50 p-4 hover:border-[#3a4f7a]/70'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isRevealed ? 'bg-teal-500/15 text-teal-300' : 'bg-[#253553] text-slate-400'
          }`}>
            {isRevealed ? <CheckCircle2 className="w-5 h-5" /> : sign.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold">{sign.title}</h4>
            <AnimatePresence>
              {isRevealed ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-3"
                >
                  {/* Arabic verse */}
                  <p className="text-xl sm:text-2xl font-arabic text-amber-100/90 leading-[2.2]" dir="rtl">
                    {sign.arabicVerse}
                  </p>
                  {/* English translation */}
                  <p className="text-amber-200/70 text-sm italic leading-relaxed">
                    "{sign.verse}"
                  </p>
                  <p className="text-slate-500 text-xs">— {sign.verseRef}</p>
                  {/* Science fact */}
                  <div className="pt-2 border-t border-[#2a3a5c]/40">
                    <p className="text-slate-300 text-sm leading-relaxed">{sign.fact}</p>
                    {sign.discoveredBy && (
                      <p className="text-teal-300/80 text-xs font-medium mt-1">{sign.discoveredBy}</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <p className="text-slate-400 text-sm mt-1">Tap to reveal</p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ── Rapid Fire Section ──────────────────────────────────────────────────

function RapidSignsSection({
  title,
  subtitle,
  signs,
  onAllRevealed,
}: {
  title: string;
  subtitle: string;
  signs: Sign[];
  onAllRevealed: () => void;
}) {
  const [revealed, setRevealed] = useState<number[]>([]);

  const revealSign = (index: number) => {
    if (!revealed.includes(index)) {
      const next = [...revealed, index];
      setRevealed(next);
      if (next.length === signs.length) {
        onAllRevealed();
      }
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif text-white mb-2">{title}</h2>
        <p className="text-slate-400">{subtitle}</p>
      </div>
      <p className="text-slate-500 text-center text-sm mb-2">Tap each sign to reveal</p>
      {signs.map((sign, i) => (
        <SignCard
          key={i}
          sign={sign}
          index={i}
          isRevealed={revealed.includes(i)}
          onReveal={() => revealSign(i)}
        />
      ))}
      {revealed.length === signs.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="inline-flex items-center gap-2 text-teal-300 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            All {signs.length} signs revealed
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export default function QuranWalkthroughLight({ onComplete, onGoDeeper }: QuranWalkthroughLightProps) {
  const [phase, setPhase] = useState<LightPhase>('intro');
  const [originStep, setOriginStep] = useState(0);
  const [originVerseRevealed, setOriginVerseRevealed] = useState(false);
  const [sectionsComplete, setSectionsComplete] = useState({
    cosmology: false,
    creation: false,
    knowledge: false,
  });
  const [totalSigns] = useState(
    COSMOLOGY_SIGNS.length + CREATION_SIGNS.length + KNOWLEDGE_SIGNS.length
  );
  const [futureRevealed, setFutureRevealed] = useState<number[]>([]);

  const advancePhase = useCallback((next: LightPhase) => {
    window.scrollTo(0, 0);
    setPhase(next);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a2e] via-[#162033] to-[#0f1a2e] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full py-8">
        <AnimatePresence mode="wait">

          {/* ── INTRO ──────────────────────────────────────────────────── */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#3d2e1a]/60 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-amber-300/80" />
                </div>
              </div>

              <h1 className="text-3xl font-serif text-white mb-4">The Quran</h1>

              <div className="bg-[#1a2744]/80 backdrop-blur rounded-2xl p-8 border border-[#2a3a5c]/60 mb-8 text-left space-y-4">
                <div className="bg-[#1e2d4a]/60 rounded-xl p-5 border border-amber-800/20">
                  <p className="text-xl font-arabic text-amber-100/90 leading-loose mb-3 text-center" dir="rtl">
                    ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ
                  </p>
                  <p className="text-white italic text-center">
                    "This is the Book about which there is no doubt."
                  </p>
                  <p className="text-slate-500 text-sm text-center mt-1">— Al-Baqarah 2:2</p>
                </div>

                <p className="text-slate-300 leading-relaxed text-center">
                  A book that claims to be the direct words of the <span className="text-white font-semibold">Creator of the universe</span>.
                </p>
                <p className="text-slate-300 leading-relaxed text-center">
                  Before we test that claim — let it speak to you. Let it answer the questions that sit quietly in every human heart.
                </p>
              </div>

              <button
                onClick={() => advancePhase('origin')}
                className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Begin
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── THE ORIGIN STORY — inner conversation ─────────────── */}
          {phase === 'origin' && (
            <motion.div
              key={`origin-${originStep}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {(() => {
                const step = ORIGIN_STEPS[originStep];
                const isLastStep = originStep === ORIGIN_STEPS.length - 1;

                return (
                  <>
                    {/* Step indicator */}
                    <div className="flex justify-center gap-2 mb-8">
                      {ORIGIN_STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-all duration-500 ${
                            i <= originStep ? 'w-8 bg-amber-400/70' : 'w-4 bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* The question — like a thought in the mind */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6"
                    >
                      <div className={`w-16 h-16 ${step.iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}>
                        <span className="text-amber-200/80">{step.icon}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2 italic">
                        "{step.question}"
                      </h2>
                      <p className="text-slate-500 text-sm">{step.subtitle}</p>
                    </motion.div>

                    {/* The Quran answers */}
                    {!originVerseRevealed ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8"
                      >
                        <button
                          onClick={() => setOriginVerseRevealed(true)}
                          className="px-6 py-3 bg-[#1e2d4a]/80 hover:bg-[#253553] border border-amber-800/20 hover:border-amber-700/30 rounded-full text-amber-200/80 transition flex items-center gap-2 mx-auto text-sm"
                        >
                          <BookOpen className="w-4 h-4" />
                          See what the Quran says
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-4 mt-6"
                      >
                        {step.verses.map((v, vi) => (
                          <motion.div
                            key={vi}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: vi * 0.3 }}
                            className="bg-[#1e2d4a]/60 rounded-xl p-5 border border-amber-800/20"
                          >
                            <p className="text-lg sm:text-xl font-arabic text-amber-100/90 leading-[2] mb-3" dir="rtl">
                              {v.arabic}
                            </p>
                            <p className="text-white italic leading-relaxed">
                              "{v.english}"
                            </p>
                            <p className="text-slate-500 text-sm mt-2">— {v.ref}</p>
                          </motion.div>
                        ))}

                        {/* Reflection */}
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: step.verses.length * 0.3 + 0.3 }}
                          className="text-slate-300 leading-relaxed px-2 pt-2"
                        >
                          {step.reflection}
                        </motion.p>

                        {/* Next button */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: step.verses.length * 0.3 + 0.8 }}
                          className="pt-4"
                        >
                          {isLastStep ? (
                            /* After the last origin step — bridge to the evidence */
                            <div className="space-y-5">
                              <div className="bg-[#132e2a]/30 rounded-xl p-5 border border-teal-800/20">
                                <p className="text-lg font-arabic text-amber-100/90 leading-loose mb-2" dir="rtl">
                                  ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ
                                </p>
                                <p className="text-white italic text-sm">
                                  "This is the Book about which there is no doubt, a guidance for those conscious of God."
                                </p>
                                <p className="text-slate-500 text-xs mt-1">— Al-Baqarah 2:2</p>
                              </div>

                              <p className="text-slate-300 leading-relaxed">
                                He told you where you came from, why you're here, and that guidance would come. <span className="text-white font-semibold">This book claims to be that guidance.</span>
                              </p>

                              <p className="text-slate-400 text-sm leading-relaxed">
                                Delivered in <span className="text-white">7th century Arabia</span> — no telescopes, no microscopes, no laboratories — by a man who <span className="text-white">could not read or write</span>.
                              </p>

                              <p className="text-slate-400 text-sm">
                                Let's test it.
                              </p>

                              <button
                                onClick={() => advancePhase('cosmology')}
                                className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                              >
                                Test the claim
                                <ArrowRight className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setOriginStep(s => s + 1);
                                setOriginVerseRevealed(false);
                              }}
                              className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                            >
                              {ORIGIN_STEPS[originStep + 1]?.question || 'Continue'}
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ── PHASE 1: WHERE DID THE UNIVERSE BEGIN? ──────────────── */}
          {phase === 'cosmology' && (
            <motion.div
              key="cosmology"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RapidSignsSection
                title="Where did the universe begin?"
                subtitle="The first question every human asks"
                signs={COSMOLOGY_SIGNS}
                onAllRevealed={() => setSectionsComplete(s => ({ ...s, cosmology: true }))}
              />
              {sectionsComplete.cosmology && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-8">
                  <button
                    onClick={() => advancePhase('creation')}
                    className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                  >
                    Where did WE come from?
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── PHASE 2: WHERE DID WE COME FROM? ───────────────────── */}
          {phase === 'creation' && (
            <motion.div
              key="creation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RapidSignsSection
                title="Where did WE come from?"
                subtitle="What this book says about your own creation"
                signs={CREATION_SIGNS}
                onAllRevealed={() => setSectionsComplete(s => ({ ...s, creation: true }))}
              />
              {sectionsComplete.creation && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-8">
                  <button
                    onClick={() => advancePhase('knowledge')}
                    className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                  >
                    Proof the Author knows His creation
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── PHASE 3: HE KNOWS HIS CREATION ────────────────────── */}
          {phase === 'knowledge' && (
            <motion.div
              key="knowledge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RapidSignsSection
                title="He knows His creation"
                subtitle="Details no human could have known — across every field"
                signs={KNOWLEDGE_SIGNS}
                onAllRevealed={() => setSectionsComplete(s => ({ ...s, knowledge: true }))}
              />
              {sectionsComplete.knowledge && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 mt-8">
                  {/* Running total */}
                  <div className="bg-[#132e2a]/40 rounded-xl p-5 border border-teal-800/25 text-center">
                    <p className="text-4xl font-bold text-teal-300 mb-1">{totalSigns}</p>
                    <p className="text-slate-300 text-sm">verified claims across cosmology, biology, geology, anatomy, and history</p>
                    <p className="text-slate-500 text-xs mt-1">Each one stated 1,400 years ago in a desert with no technology</p>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => advancePhase('purpose')}
                      className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                    >
                      So why are we here?
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── PHASE 4: THE PURPOSE ───────────────────────────────── */}
          {phase === 'purpose' && (
            <motion.div
              key="purpose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-serif text-white mb-2">So why are we here?</h2>
              <p className="text-slate-400 mb-8">Science can tell you <span className="text-slate-300">how</span> you got here. Only the Creator can tell you <span className="text-white">why</span>.</p>

              <div className="bg-[#1a2744]/80 backdrop-blur rounded-2xl p-8 border border-[#2a3a5c]/60 mb-6 text-left space-y-6">

                {/* The direct answer */}
                <div className="bg-[#1e2d4a]/60 rounded-xl p-5 border border-amber-800/20">
                  <p className="text-xl sm:text-2xl font-arabic text-amber-100/90 leading-[2.2] mb-3 text-center" dir="rtl">
                    وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ
                  </p>
                  <p className="text-white italic text-center leading-relaxed">
                    "I did not create jinn and mankind except to worship Me."
                  </p>
                  <p className="text-slate-500 text-sm text-center mt-1">— Adh-Dhariyat 51:56</p>
                </div>

                <p className="text-slate-300 leading-relaxed text-center">
                  Not rituals all day. The Arabic word <span className="text-amber-200/80 font-semibold">ya'budoon</span> means <span className="text-white font-semibold">living in conscious connection</span> with your Creator. Every action — eating, working, being kind — becomes worship when done with that awareness.
                </p>

                {/* This life vs the real life */}
                <div className="bg-[#2e2215]/40 rounded-xl p-5 border border-amber-800/20">
                  <p className="text-xl sm:text-2xl font-arabic text-amber-100/90 leading-[2.2] mb-3 text-center" dir="rtl">
                    اعْلَمُوا أَنَّمَا الْحَيَاةُ الدُّنْيَا لَعِبٌ وَلَهْوٌ وَزِينَةٌ وَتَفَاخُرٌ بَيْنَكُمْ وَتَكَاثُرٌ فِي الْأَمْوَالِ وَالْأَوْلَادِ
                  </p>
                  <p className="text-white italic text-center text-sm leading-relaxed">
                    "Know that the life of this world is but amusement, diversion, adornment, boasting among yourselves, and competition in wealth and children."
                  </p>
                  <p className="text-slate-500 text-xs text-center mt-1">— Al-Hadid 57:20</p>
                </div>

                <div className="bg-[#132e2a]/30 rounded-xl p-5 border border-teal-800/20">
                  <p className="text-xl sm:text-2xl font-arabic text-amber-100/90 leading-[2.2] mb-3 text-center" dir="rtl">
                    وَالْآخِرَةُ خَيْرٌ وَأَبْقَىٰ
                  </p>
                  <p className="text-white italic text-center text-sm leading-relaxed">
                    "And the Hereafter is better and more lasting."
                  </p>
                  <p className="text-slate-500 text-xs text-center mt-1">— Al-A'la 87:17</p>
                  <p className="text-slate-300 text-center text-sm mt-3">
                    60-70 years here. <span className="text-white font-semibold">Forever</span> there.
                  </p>
                </div>

                {/* The bonus system */}
                <div className="bg-[#132e2a]/30 rounded-xl p-5 border border-teal-800/20 space-y-3">
                  <p className="text-teal-200/80 text-center font-semibold">And the system is stacked in your favour:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1a3530]/40 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-teal-300">10x</p>
                      <p className="text-slate-400 text-xs">minimum for every good deed</p>
                    </div>
                    <div className="bg-[#1a3530]/40 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-teal-300">1x</p>
                      <p className="text-slate-400 text-xs">bad deed recorded as just one</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm text-center leading-relaxed">
                    Intend bad but don't act? <span className="text-white">Not written</span>. Intend good but can't do it? <span className="text-teal-200/80">Still rewarded</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => advancePhase('the-way')}
                className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                So what is "The Way"?
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── THE WAY — submission explained ─────────────────────── */}
          {phase === 'the-way' && (
            <motion.div
              key="the-way"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#3d2e1a]/60 rounded-full flex items-center justify-center">
                  <Compass className="w-10 h-10 text-amber-300/80" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-2">The Religion of Pure Submission</h2>
              <p className="text-slate-400 mb-8">One way. One message. From the first human to the last prophet.</p>

              <div className="bg-[#1a2744]/80 backdrop-blur rounded-2xl p-8 border border-[#2a3a5c]/60 mb-6 text-left space-y-6">

                {/* What the word means */}
                <p className="text-slate-300 leading-relaxed text-center">
                  Throughout history, the followers of every prophet were known as <span className="text-white font-semibold">the people of The Way</span> — people who gave up their own desires in favour of following the path their Creator set for them.
                </p>

                <p className="text-slate-300 leading-relaxed text-center">
                  But what <span className="text-white font-semibold">was</span> that way? In Arabic, it has a name — and the name tells you everything.
                </p>

                {/* Arabic language breakdown */}
                <div className="bg-[#1e2d4a]/60 rounded-xl p-5 border border-amber-800/20 space-y-4">
                  <p className="text-slate-400 text-sm text-center">In Arabic, adding <span className="text-amber-300 font-semibold">mu-</span> to a verb makes it "the one who does it" — just like adding <span className="text-amber-300 font-semibold">-er</span> in English:</p>
                  <div className="space-y-2">
                    {[
                      { en: 'Travel → Traveller', ar: 'Sāfar → Musāfir', arLabel: 'مُسَافِر' },
                      { en: 'Teach → Teacher', ar: 'ʿAllam → Muʿallim', arLabel: 'مُعَلِّم' },
                      { en: 'Submit → Submitter', ar: 'Aslam → Muslim', arLabel: 'مُسْلِم', highlight: true },
                    ].map(row => (
                      <div key={row.en} className={`grid grid-cols-2 gap-3 ${row.highlight ? 'ring-1 ring-amber-600/30 rounded-lg' : ''}`}>
                        <div className="bg-slate-700/50 rounded-lg px-3 py-2.5 text-center">
                          <p className="text-slate-300 text-sm">{row.en}</p>
                        </div>
                        <div className={`rounded-lg px-3 py-2.5 text-center ${row.highlight ? 'bg-amber-900/30' : 'bg-amber-900/20'}`}>
                          <p className="text-amber-200 text-sm">{row.ar}</p>
                          <p className="text-amber-400/60 text-xs font-arabic">{row.arLabel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#2a3a5c]/40 space-y-2">
                    <p className="text-white text-center font-medium">
                      Islam <span className="text-slate-400 font-normal">=</span> submission to the Creator, in peace
                    </p>
                    <p className="text-white text-center font-medium">
                      Muslim <span className="text-slate-400 font-normal">=</span> the one who submits
                    </p>
                  </div>
                </div>

                {/* The way defined */}
                <p className="text-slate-300 leading-relaxed text-center">
                  The way was always the same — <span className="text-white font-semibold">recognise that your Creator has a path He requires you to follow</span>, and choose it over your own desires. Not because you're forced — but because you <span className="text-amber-200/80 font-semibold">accept</span>.
                </p>

                {/* Two outcomes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#132e2a]/40 rounded-xl p-5 border border-teal-800/20">
                    <p className="text-teal-300/80 text-xs font-semibold uppercase tracking-wide mb-3">Those who try their best to follow</p>
                    <div className="bg-[#1a3530]/40 rounded-lg p-4 mb-3">
                      <p className="text-lg font-arabic text-amber-100/90 leading-[2]" dir="rtl">
                        مَن عَمِلَ صَالِحًا مِّن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً
                      </p>
                    </div>
                    <p className="text-white italic text-sm leading-relaxed">
                      "Whoever does righteousness, whether male or female, while being a believer — We will surely cause him to live a good life."
                    </p>
                    <p className="text-slate-500 text-xs mt-2">— An-Nahl 16:97</p>
                    <p className="text-teal-200/70 text-sm mt-3 font-medium">This life <span className="text-white">and</span> the next.</p>
                  </div>

                  <div className="bg-[#2e1515]/30 rounded-xl p-5 border border-rose-800/20">
                    <p className="text-rose-300/70 text-xs font-semibold uppercase tracking-wide mb-3">Those who reject</p>
                    <div className="bg-[#2a1a1a]/40 rounded-lg p-4 mb-3">
                      <p className="text-lg font-arabic text-amber-100/90 leading-[2]" dir="rtl">
                        وَمَنْ أَعْرَضَ عَن ذِكْرِي فَإِنَّ لَهُ مَعِيشَةً ضَنكًا
                      </p>
                    </div>
                    <p className="text-white italic text-sm leading-relaxed">
                      "And whoever turns away from My remembrance — indeed, he will have a depressed life."
                    </p>
                    <p className="text-slate-500 text-xs mt-2">— Ta-Ha 20:124</p>
                    <p className="text-rose-200/60 text-sm mt-3 font-medium">This life only — and even that, constrained.</p>
                  </div>
                </div>

                {/* The clear way */}
                <div className="bg-[#1e2d4a]/60 rounded-xl p-5 border border-amber-800/20">
                  <p className="text-xl sm:text-2xl font-arabic text-amber-100/90 leading-[2.2] mb-3 text-center" dir="rtl">
                    قَدْ جَاءَكُم مِّنَ اللَّهِ نُورٌ وَكِتَابٌ مُّبِينٌ يَهْدِي بِهِ اللَّهُ مَنِ اتَّبَعَ رِضْوَانَهُ سُبُلَ السَّلَامِ
                  </p>
                  <p className="text-white italic text-center leading-relaxed">
                    "There has come to you from Allah a light and a clear Book, by which Allah guides those who pursue His pleasure to the ways of peace."
                  </p>
                  <p className="text-slate-500 text-sm text-center mt-2">— Al-Ma'idah 5:15-16</p>
                </div>

                <p className="text-slate-300 leading-relaxed text-center">
                  Allah shows the clear path to success — and how to avoid the doom prepared for those who <span className="text-white font-semibold">purposely reject</span> after the evidence has reached them, or who worship the creation rather than the Creator.
                </p>

                {/* Every prophet was a Muslim */}
                <div className="bg-[#2e2215]/40 rounded-xl p-5 border border-amber-800/20 space-y-4">
                  <p className="text-slate-300 leading-relaxed text-center">
                    Every single prophet submitted to Allah in peace. Adam, Noah, Abraham, Moses, Jesus — by this meaning, every prophet was a <span className="text-amber-300 font-semibold">Muslim</span>.
                  </p>
                  <div className="bg-[#1e2d4a]/50 rounded-lg p-4">
                    <p className="text-lg sm:text-xl font-arabic text-amber-100/90 leading-[2.2] mb-2" dir="rtl">
                      مَا كَانَ إِبْرَاهِيمُ يَهُودِيًّا وَلَا نَصْرَانِيًّا وَلَـٰكِن كَانَ حَنِيفًا مُّسْلِمًا
                    </p>
                    <p className="text-white italic text-sm text-center leading-relaxed">
                      "Abraham was neither a Jew nor a Christian, but he was one inclining toward truth — a Muslim."
                    </p>
                    <p className="text-slate-500 text-xs text-center mt-1">— Aal-Imran 3:67</p>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-center">
                    Allah did not officially <span className="text-white font-semibold">name</span> the way of life until the final revelation:
                  </p>
                  <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700/30">
                    <p className="text-lg sm:text-xl font-arabic text-amber-100/90 leading-[2.2] mb-2" dir="rtl">
                      الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي وَرَضِيتُ لَكُمُ الْإِسْلَامَ دِينًا
                    </p>
                    <p className="text-white italic text-sm text-center leading-relaxed">
                      "Today I have perfected your religion for you, completed My favour upon you, and have chosen for you Islam as your way of life."
                    </p>
                    <p className="text-slate-500 text-xs text-center mt-1">— Al-Ma'idah 5:3</p>
                  </div>
                  <p className="text-slate-400 text-sm text-center leading-relaxed">
                    One message. One way. From the first human to the last prophet. The only thing that changed over time was the name — and God Himself chose it.
                  </p>
                </div>

                {/* Taghabun — the whole message in 18 verses */}
                <div className="bg-[#1e2d4a]/60 rounded-xl p-5 border border-[#2a3a5c]/40 space-y-4">
                  <p className="text-slate-300 leading-relaxed text-center">
                    Want the entire message in <span className="text-white font-semibold">one surah</span>? Surah At-Taghabun (64) — just 18 verses — covers it all:
                  </p>

                  <div className="bg-[#1a2744]/50 rounded-lg p-4">
                    <p className="text-lg sm:text-xl font-arabic text-amber-100/90 leading-[2.2] mb-2" dir="rtl">
                      هُوَ الَّذِي خَلَقَكُمْ فَمِنكُمْ كَافِرٌ وَمِنكُم مُّؤْمِنٌ ۚ وَاللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ
                    </p>
                    <p className="text-white italic text-sm text-center leading-relaxed">
                      "He is the One who created you, yet some of you disbelieve and some believe. And Allah is All-Seeing of what you do."
                    </p>
                    <p className="text-slate-500 text-xs text-center mt-1">— At-Taghabun 64:2</p>
                  </div>

                  <div className="bg-[#1a2744]/50 rounded-lg p-4">
                    <p className="text-lg sm:text-xl font-arabic text-amber-100/90 leading-[2.2] mb-2" dir="rtl">
                      يَوْمَ يَجْمَعُكُمْ لِيَوْمِ الْجَمْعِ ۖ ذَٰلِكَ يَوْمُ التَّغَابُنِ
                    </p>
                    <p className="text-white italic text-sm text-center leading-relaxed">
                      "The Day He will gather you for the Day of Assembly — that is the Day of Mutual Loss and Gain."
                    </p>
                    <p className="text-slate-500 text-xs text-center mt-1">— At-Taghabun 64:9</p>
                  </div>

                  <p className="text-slate-400 text-sm text-center leading-relaxed">
                    <span className="text-white font-medium">Taghabun</span> — the Day where the believer gains what the disbeliever lost, and the disbeliever realises what they traded away. Creation, choice, consequences — all in 18 verses.
                  </p>
                </div>
              </div>

              <button
                onClick={() => advancePhase('future-intro')}
                className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                But what is coming?
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── PHASE 5a: FUTURE INTRO ─────────────────────────────── */}
          {phase === 'future-intro' && (
            <motion.div
              key="future-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#3a2a1a]/50 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-orange-200/70/80" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-4">What Is Coming</h2>

              <div className="bg-[#1a2744]/80 backdrop-blur rounded-2xl p-8 border border-[#2a3a5c]/60 mb-8 text-left space-y-5">
                <p className="text-slate-300 leading-relaxed text-center">
                  The Quran doesn't just describe the <span className="text-white font-semibold">past</span>.
                  It describes events that <span className="text-orange-200/80 font-semibold">haven't happened yet</span>.
                </p>

                <p className="text-slate-300 leading-relaxed text-center">
                  But here's what's remarkable —
                </p>

                <div className="bg-[#2e2215]/50 rounded-xl p-5 border border-orange-800/25">
                  <p className="text-orange-100/80 leading-relaxed text-center text-lg">
                    It describes them in the <span className="text-white font-bold">past tense</span>.
                  </p>
                  <p className="text-orange-200/70 text-center mt-3 leading-relaxed">
                    As if they have <span className="text-white font-semibold">already happened</span>.
                  </p>
                </div>

                <div className="bg-[#1e2d4a]/50 rounded-xl p-5 border border-[#2a3a5c]/40">
                  <p className="text-slate-300 leading-relaxed text-center">
                    Why? Because the Author claims to have <span className="text-white font-semibold">created time itself</span> — and is not subject to it.
                  </p>
                  <div className="mt-4 bg-[#1a2744]/50 rounded-lg p-4">
                    <p className="text-lg font-arabic text-amber-100/90 leading-loose mb-2 text-center" dir="rtl">
                      يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ
                    </p>
                    <p className="text-white italic text-center text-sm">
                      "He knows what is before them and what is behind them."
                    </p>
                    <p className="text-slate-500 text-xs text-center mt-1">— Al-Baqarah 2:255</p>
                  </div>
                  <p className="text-slate-400 text-center mt-3 text-sm leading-relaxed">
                    He's not <span className="text-white">predicting</span>. He's <span className="text-amber-200/80 font-semibold">informing</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => advancePhase('future-events')}
                className="px-8 py-4 bg-[#9a6a35] hover:bg-[#b07a40] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                See what He describes
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── PHASE 5b: FUTURE EVENTS ────────────────────────────── */}
          {phase === 'future-events' && (
            <motion.div
              key="future-events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif text-white mb-2">Already Written</h2>
                <p className="text-slate-400 text-sm">Future events — described as though they've already occurred</p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-slate-500 text-center text-sm mb-2">Tap each to reveal</p>
                {FUTURE_SIGNS.map((sign, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <button
                      onClick={() => {
                        if (!futureRevealed.includes(i)) {
                          setFutureRevealed(prev => [...prev, i]);
                        }
                      }}
                      className={`w-full text-left rounded-xl border transition-all ${
                        futureRevealed.includes(i)
                          ? 'bg-[#2e2215]/40 border-orange-800/25 p-4'
                          : 'bg-slate-800/50 border-slate-700/50 p-4 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          futureRevealed.includes(i) ? 'bg-[#3a2a1a]/40 text-orange-300/70' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {futureRevealed.includes(i) ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold">{sign.title}</h4>
                          <AnimatePresence>
                            {futureRevealed.includes(i) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                              >
                                <p className="text-lg font-arabic text-amber-100/90 leading-loose mt-2" dir="rtl">
                                  {sign.arabicVerse}
                                </p>
                                <p className="text-amber-200/70 text-sm italic mt-1">
                                  "{sign.verse}"
                                </p>
                                <p className="text-slate-500 text-xs mt-1">— {sign.verseRef}</p>
                                <div className="mt-2 pt-2 border-t border-[#2a3a5c]/40">
                                  <p className="text-orange-200/70 text-sm font-medium">
                                    {sign.arabicNote}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}

                {futureRevealed.length === FUTURE_SIGNS.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 mt-6"
                  >
                    <div className="bg-[#1e2d4a]/50 rounded-xl p-5 border border-orange-800/20 text-center">
                      <p className="text-orange-100/80 leading-relaxed mb-3">
                        Every one of these is written in <span className="text-white font-bold">past tense</span> — as if describing yesterday's news.
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        Because for the One who <span className="text-white font-semibold">created time</span>, there is no "future". It has all already been determined.
                      </p>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => advancePhase('who-wrote-it')}
                        className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                      >
                        So who wrote this book?
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ALMANAC BRIDGE ─────────────────────────────────────── */}
          {phase === 'who-wrote-it' && (
            <motion.div
              key="who-wrote-it"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#2a1f3d]/50 rounded-full flex items-center justify-center">
                  <UserX className="w-10 h-10 text-purple-300/80" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-4">Who Wrote This Book?</h2>

              <div className="bg-[#1a2744]/80 backdrop-blur rounded-2xl p-8 border border-[#2a3a5c]/60 mb-8 text-left space-y-4">
                <p className="text-slate-300 leading-relaxed text-center">
                  Let's rule out every possible human author.
                </p>

                {[
                  {
                    suspect: 'Muhammad himself?',
                    ruling: 'Illiterate. No education, no tools, no instruments. Gained no wealth — died with almost nothing.',
                  },
                  {
                    suspect: 'Other Arab poets?',
                    ruling: 'The Quran challenged anyone to produce a single chapter like it. 1,400 years later — no one has. Not even AI.',
                  },
                  {
                    suspect: 'Later scholars edited it?',
                    ruling: 'Memorised word-for-word by thousands in his lifetime. Every copy on Earth is letter-for-letter identical. No opportunity to change it ever existed.',
                  },
                  {
                    suspect: 'Copied from the Bible?',
                    ruling: 'Muhammad was illiterate and the Bible wasn\'t in Arabic. The scientific knowledge in the Quran appears in no previous scripture.',
                  },
                  {
                    suspect: 'Lucky guesses?',
                    ruling: 'One guess is luck. Precise claims across embryology, cosmology, oceanography, geology, anatomy, and history — with zero errors across 6,236 verses — is not luck.',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-start gap-3 bg-[#1e2d4a]/40 rounded-xl p-4 border border-[#2a3a5c]/30"
                  >
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-4 h-4 text-rose-400/70" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{item.suspect}</p>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{item.ruling}</p>
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="bg-[#132e2a]/30 rounded-xl p-5 border border-teal-800/20 mt-2"
                >
                  <p className="text-teal-200/80 leading-relaxed text-center">
                    Every human possibility eliminated. The Quran's own claim remains: these are the words of <span className="text-white font-semibold">the Creator</span>.
                  </p>
                </motion.div>
              </div>

              <button
                onClick={() => advancePhase('the-concept')}
                className="px-8 py-4 bg-[#b08545] hover:bg-[#c4965a] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Now let me share something that made it click...
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── THE CONCEPT ────────────────────────────────────────── */}
          {phase === 'the-concept' && (
            <motion.div
              key="the-concept"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#2a1f3d]/50 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-purple-300/80" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-4">The Thought Experiment</h2>

              <div className="bg-[#1a2744]/80 backdrop-blur rounded-2xl p-8 border border-[#2a3a5c]/60 mb-8 text-left space-y-5">
                <div className="bg-[#2e2215]/40 rounded-xl p-5 border border-amber-800/25">
                  <p className="text-amber-100/90 leading-relaxed text-center text-lg">
                    Imagine you could go <span className="text-white font-semibold">forward in time</span>.
                  </p>
                  <p className="text-amber-100/90 leading-relaxed text-center mt-2">
                    See everything that's going to happen. Get all the information.
                  </p>
                  <p className="text-amber-100/90 leading-relaxed text-center mt-2">
                    Then come <span className="text-white font-semibold">back in time</span> with all of that knowledge.
                  </p>
                </div>

                <p className="text-slate-300 leading-relaxed text-center">
                  You'd have the ultimate advantage. You'd know every result before it happens.
                </p>

                <div className="bg-[#1e2d4a]/50 rounded-xl p-5 border border-[#2a3a5c]/40">
                  <p className="text-lg font-arabic text-amber-100/90 leading-loose mb-3 text-center" dir="rtl">
                    يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ
                  </p>
                  <p className="text-white italic text-center text-sm">
                    "He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills."
                  </p>
                  <p className="text-slate-500 text-xs text-center mt-1">— Al-Baqarah 2:255</p>
                </div>

                <p className="text-slate-300 leading-relaxed text-center">
                  Allah claims He <span className="text-white font-semibold">already knows</span> everything — past, present, and future. He created time. He is not subject to it.
                </p>

                <p className="text-slate-400 leading-relaxed text-center">
                  There's a movie that shows <span className="text-white">exactly this concept</span> — and it helped me understand what the Quran is actually doing.
                </p>
              </div>

              <button
                onClick={() => advancePhase('almanac')}
                className="px-8 py-4 bg-[#6b4fa0] hover:bg-[#7d5eb5] text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Show me the movie
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ── ALMANAC GAME ───────────────────────────────────────── */}
          {phase === 'almanac' && (
            <motion.div
              key="almanac"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AlmanacGame onComplete={() => advancePhase('go-deeper')} startPhase="movie-scene" />
            </motion.div>
          )}

          {/* ── GO DEEPER ──────────────────────────────────────────── */}
          {phase === 'go-deeper' && (
            <motion.div
              key="go-deeper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 bg-[#1a3530]/50 rounded-full flex items-center justify-center"
                >
                  <BookOpen className="w-10 h-10 text-teal-300/80" />
                </motion.div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-4">The Real Cheat Code</h2>

              <div className="bg-[#1a2744]/80 backdrop-blur rounded-2xl p-8 border border-[#2a3a5c]/60 mb-8 space-y-5">

                {/* The parallel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#1e2d4a]/50 rounded-xl p-5 border border-[#2a3a5c]/40">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">Fiction</p>
                    <p className="text-white font-semibold mb-2">The Almanac</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      A cheat code for <span className="text-slate-300">sports results</span> until the year 2000.
                    </p>
                    <p className="text-slate-500 text-xs mt-3">Made Biff a millionaire.</p>
                  </div>
                  <div className="bg-[#132e2a]/30 rounded-xl p-5 border border-teal-800/20">
                    <p className="text-teal-300/70 text-xs font-semibold uppercase tracking-wide mb-3">Reality</p>
                    <p className="text-white font-semibold mb-2">The Quran</p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      A cheat code for <span className="text-white">life itself</span> — your purpose, your decisions, and what comes after.
                    </p>
                    <p className="text-teal-200/60 text-xs mt-3">From the One who created time.</p>
                  </div>
                </div>

                <div className="bg-[#2e2215]/30 rounded-xl p-5 border border-amber-800/20">
                  <p className="text-amber-100/80 leading-relaxed text-center">
                    The Almanac knew the future because it <span className="text-white font-medium">came from</span> the future.
                  </p>
                  <p className="text-amber-100/80 leading-relaxed text-center mt-2">
                    The Quran knows the future because its Author <span className="text-white font-medium">created</span> the future — and the past, and you, and everything in between.
                  </p>
                </div>

                <p className="text-slate-300 leading-relaxed text-center">
                  Biff used his cheat code to win money. The Quran tells you how to win <span className="text-white font-semibold">the only game that actually matters</span>.
                </p>

                <p className="text-slate-400 leading-relaxed text-center text-sm">
                  And you've only seen <span className="text-white">{totalSigns} signs</span> — the tip of the iceberg.
                </p>

                <div className="space-y-3 pt-2">
                  {onGoDeeper && (
                    <button
                      onClick={onGoDeeper}
                      className="w-full bg-[#132e2a]/30 hover:bg-[#132e2a]/50 border border-teal-800/30 hover:border-teal-600/50 rounded-xl p-5 text-left transition group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1a3530]/50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#1a3530]/70 transition">
                          <Microscope className="w-6 h-6 text-teal-300" />
                        </div>
                        <div>
                          <p className="text-white font-semibold group-hover:text-teal-200 transition">Go Deeper — The Full Walkthrough</p>
                          <p className="text-slate-400 text-sm mt-0.5">Inline evidence, authorship elimination, the deeper reality</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-teal-300 transition ml-auto" />
                      </div>
                    </button>
                  )}

                  <button
                    onClick={onComplete}
                    className="w-full bg-[#2e2215]/30 hover:bg-[#2e2215]/50 border border-amber-800/25 hover:border-amber-700/40 rounded-xl p-5 text-left transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#3d2e1a]/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#3d2e1a]/60 transition">
                        <Heart className="w-6 h-6 text-amber-300/80" />
                      </div>
                      <div>
                        <p className="text-white font-semibold group-hover:text-amber-200 transition">Continue the Journey</p>
                        <p className="text-slate-400 text-sm mt-0.5">The voice of the Quran, the prophets, and your next step</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-300 transition ml-auto" />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Navigation (except almanac phase which has its own) ──── */}
        {phase !== 'almanac' && phase !== 'intro' && phase !== 'go-deeper' && (
          <div className="flex justify-between mt-8 px-4">
            <button
              onClick={() => {
                if (phase === 'origin' && originStep > 0) {
                  setOriginStep(s => s - 1);
                  setOriginVerseRevealed(false);
                  window.scrollTo(0, 0);
                  return;
                }
                const phases: LightPhase[] = ['intro', 'origin', 'cosmology', 'creation', 'knowledge', 'purpose', 'the-way', 'future-intro', 'future-events', 'who-wrote-it', 'the-concept', 'almanac', 'go-deeper'];
                const idx = phases.indexOf(phase);
                if (idx > 0) advancePhase(phases[idx - 1]);
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}