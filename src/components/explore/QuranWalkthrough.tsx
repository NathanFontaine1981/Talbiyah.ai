import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Sparkles, Clock, Globe, User, Microscope,
  ChevronRight, ChevronLeft, Dna, Droplets, Mountain,
  Fingerprint, Heart, Brain, MapPin, Crown,
  Target, Zap, Scale, Gift, Sunrise, AlertTriangle,
  CheckCircle2, Volume2, VolumeX,
  Flame, Compass, Building2, Users, Gamepad2, Banknote, ShieldAlert, Hourglass,
} from 'lucide-react';
import InlineEvidence from './InlineEvidence';
import AuthorshipElimination from './AuthorshipElimination';
import AlmanacGame from './AlmanacGame';
import ImagePlaceholder from './ImagePlaceholder';
import EpisodeBreakScreen from './EpisodeBreakScreen';

interface QuranWalkthroughProps {
  onComplete: () => void;
  onTakeBreak?: () => void;
}

interface WalkthroughScene {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  isInteractive?: boolean;
  interactiveType?: 'inline-evidence' | 'quick-fire-evidence' | 'authorship-elimination' | 'almanac';
  content?: React.ReactNode;
}

// ─── Exhibit data for inline evidence scenes ────────────────────────────────

const EXHIBITS = {
  bigBang: {
    verse: "Do not the disbelievers see that the heavens and the earth were a joined entity, and then We separated them?",
    arabicVerse: "أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا",
    verseRef: "Al-Anbiya 21:30",
    whatWasKnown: "In the 7th century, the idea that the entire universe was once a single mass was inconceivable. Most civilisations believed the world had always existed as it was — fixed and eternal.",
    modernDiscovery: "In 1927, Georges Lemaître proposed the Big Bang theory — that the universe began as a single, incredibly dense point that expanded outward. This is now the foundational model of modern cosmology. The Quran described this over 1,300 years earlier.",
    discoveredBy: "Georges Lemaître, 1927",
    yearsBefore: 1295,
  },
  expansion: {
    verse: "And the heaven We constructed with strength, and indeed, We are its expander.",
    arabicVerse: "وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ",
    verseRef: "Adh-Dhariyat 51:47",
    whatWasKnown: "Until 1929, even the most advanced scientists believed the universe was static and unchanging. An expanding universe was unthinkable.",
    modernDiscovery: "Edwin Hubble discovered in 1929 that the universe is expanding. This is now one of the foundational facts of modern cosmology. The Quran stated this over 1,400 years earlier.",
    discoveredBy: "Edwin Hubble, 1929",
    yearsBefore: 1297,
  },
  orbits: {
    verse: "It is He who created the night and the day, and the sun and the moon; each in an orbit is swimming.",
    arabicVerse: "وَهُوَ الَّذِي خَلَقَ اللَّيْلَ وَالنَّهَارَ وَالشَّمْسَ وَالْقَمَرَ ۖ كُلٌّ فِي فَلَكٍ يَسْبَحُونَ",
    verseRef: "Al-Anbiya 21:33",
    whatWasKnown: "Ancient people believed the sun and moon were simply lights in the sky. Most thought the Earth was the centre of everything and celestial bodies were fixed.",
    modernDiscovery: "Modern astronomy confirms the sun orbits the centre of the Milky Way at ~828,000 km/h, and the moon orbits the Earth. The Arabic word 'yasbahoon' means 'swimming' — perfectly describing smooth, continuous orbital motion through space.",
    discoveredBy: "Johannes Kepler, 1609",
    yearsBefore: 977,
  },
  twoSeas: {
    verse: "He released the two seas, meeting side by side. Between them is a barrier so neither of them transgresses.",
    arabicVerse: "مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ",
    verseRef: "Ar-Rahman 55:19-20",
    whatWasKnown: "No underwater exploration existed. No knowledge of water density, salinity barriers, or what happens where rivers meet the ocean.",
    modernDiscovery: "Modern oceanography confirms that where fresh and salt water meet, a visible barrier called a halocline forms. The waters don't fully mix due to differences in density and salinity — exactly as the Quran described.",
    discoveredBy: "Knudsen & Ekman, 1903",
    yearsBefore: 1271,
  },
  embryology: {
    verse: "We created man from an extract of clay. Then We placed him as a sperm-drop in a firm lodging. Then We made the sperm-drop into a clinging clot, and We made the clot into a lump, and We made from the lump bones, and We covered the bones with flesh.",
    arabicVerse: "وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ ثُمَّ جَعَلْنَاهُ نُطْفَةً فِي قَرَارٍ مَّكِينٍ",
    verseRef: "Al-Mu'minun 23:12-14",
    whatWasKnown: "No microscopes existed. The stages of embryonic development were completely unknown. Many believed babies were preformed miniature humans from the start.",
    modernDiscovery: "Modern embryology confirms the exact sequence: fertilisation, implantation, embryo resembling a clinging clot, lump-like stage, skeleton formation, then muscles wrapping around bones. The Quran described this process with remarkable accuracy.",
    discoveredBy: "Karl Ernst von Baer, 1827",
    yearsBefore: 1195,
  },
};

const QUICK_FIRE_SIGNS = [
  {
    icon: <Mountain className="w-5 h-5" />,
    title: "Mountains as Pegs",
    verse: "Have We not made the earth a resting place? And the mountains as stakes?",
    ref: "An-Naba 78:6-7",
    fact: "Modern geology confirms mountains have deep roots extending into the earth's mantle — like pegs stabilising tectonic plates.",
    year: "George Airy, 1855",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Pain Receptors in Skin",
    verse: "Every time their skins are roasted through, We will replace them with other skins so they may taste the punishment.",
    ref: "An-Nisa 4:56",
    fact: "Pain receptors (nociceptors) are concentrated in the skin. Third-degree burns destroy these nerve endings, stopping pain. Replacing skin resets the ability to feel.",
    year: "Charles Sherrington, 1906",
  },
  {
    icon: <Fingerprint className="w-5 h-5" />,
    title: "Unique Fingerprints",
    verse: "Yes, We are able to put together in perfect order the very tips of his fingers.",
    ref: "Al-Qiyamah 75:3-4",
    fact: "Every human has unique fingerprints — even identical twins. The Quran highlighted fingertips over 1,300 years before forensic science confirmed their uniqueness.",
    year: "Sir Francis Galton, 1892",
  },
  {
    icon: <Crown className="w-5 h-5" />,
    title: "Pharaoh's Body Preserved",
    verse: "Today We will preserve your body so you can be a sign for those who come after you.",
    ref: "Yunus 10:92",
    fact: "Pharaoh drowned in the sea — yet his mummy was discovered remarkably intact in 1898. Salt deposits confirmed drowning in seawater. It sits in Cairo museum to this day.",
    year: "Loret / Bucaille, 1898",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: "The Lowest Land",
    verse: "The Romans have been defeated in the lowest land.",
    ref: "Ar-Rum 30:2-4",
    fact: "The Dead Sea region — where the Romans were defeated — is the lowest point on Earth at ~430m below sea level. The Arabic 'adna' means both 'nearest' and 'lowest.'",
    year: "Satellite altimetry, 1958",
  },
];

// ─── Scene content components ───────────────────────────────────────────────

function QuickFireScene({ onAllRevealed }: { onAllRevealed: () => void }) {
  const [revealed, setRevealed] = useState<number[]>([]);

  const revealSign = (index: number) => {
    if (!revealed.includes(index)) {
      const next = [...revealed, index];
      setRevealed(next);
      if (next.length === QUICK_FIRE_SIGNS.length) {
        onAllRevealed();
      }
    }
  };

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <p className="text-slate-400 text-center text-sm mb-4">Tap each sign to reveal the evidence</p>
      {QUICK_FIRE_SIGNS.map((sign, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <button
            onClick={() => revealSign(i)}
            className={`w-full text-left rounded-xl border transition-all ${
              revealed.includes(i)
                ? 'bg-emerald-900/20 border-emerald-700/40 p-4'
                : 'bg-slate-800/50 border-slate-700/50 p-4 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                revealed.includes(i) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
              }`}>
                {revealed.includes(i) ? <CheckCircle2 className="w-5 h-5" /> : sign.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm">{sign.title}</h4>
                <p className="text-amber-300/80 text-xs italic mt-1">"{sign.verse}" — {sign.ref}</p>
                <AnimatePresence>
                  {revealed.includes(i) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 pt-2 border-t border-slate-700/50"
                    >
                      <p className="text-slate-300 text-sm">{sign.fact}</p>
                      <p className="text-emerald-400 text-xs mt-1 font-medium">{sign.year}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}

function RunningTotalScene() {
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState(0);
  const total = 10; // 5 inline + 5 quick-fire

  useEffect(() => {
    const timer = setTimeout(() => setCounting(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!counting || count >= total) return;
    const timer = setTimeout(() => setCount(c => c + 1), 200);
    return () => clearTimeout(timer);
  }, [counting, count, total]);

  return (
    <div className="text-center space-y-6 max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40"
      >
        <span className="text-5xl font-bold text-emerald-400">{count}</span>
      </motion.div>
      <div className="space-y-2">
        <p className="text-white text-lg font-medium">
          Verified claims across cosmology, biology, geology, anatomy, and history.
        </p>
        <p className="text-slate-400">
          Each one stated in a book from 7th century Arabia — by a man who could not read or write.
        </p>
      </div>
      {count >= total && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/60 rounded-xl p-4 border border-slate-700"
        >
          <p className="text-amber-300 font-medium mb-1">The odds of coincidence?</p>
          <p className="text-white text-2xl font-bold">1 in 10,000,000,000</p>
          <p className="text-slate-500 text-sm mt-1">One in ten billion.</p>
        </motion.div>
      )}
    </div>
  );
}

function ProveItScene() {
  const [visibleItems, setVisibleItems] = useState(0);
  const items = [
    'Big Bang — described 1,300 years before Lemaître',
    'Expanding universe — stated 1,300 years before Hubble',
    'Orbital motion — the Arabic word means "swimming"',
    'Barrier between seas — haloclines confirmed',
    'Embryonic stages — exact sequence, no microscopes',
    'Mountains as pegs — geological roots confirmed',
    'Pain receptors in skin — nociceptors discovered 1906',
    'Unique fingerprints — forensics confirmed 1892',
    'Pharaoh\'s body — preserved against all odds',
    'Lowest land on Earth — satellite altimetry confirmed',
    'Zero contradictions across 6,236 verses',
    'Delivered by an illiterate man over 23 years',
  ];

  useEffect(() => {
    if (visibleItems < items.length) {
      const timer = setTimeout(() => setVisibleItems(v => v + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [visibleItems, items.length]);

  return (
    <div className="max-w-lg mx-auto space-y-2">
      {items.slice(0, visibleItems).map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-3 py-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span className="text-slate-200 text-sm">{item}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

// ─── Episode break config ─────────────────────────────────────────────────

interface EpisodeBreakConfig {
  episodeNumber: number;
  episodeName: string;
  nextEpisodeName: string;
  summary: string[];
  reflectionPrompt: string;
}

const EPISODE_BREAKS: Record<number, EpisodeBreakConfig> = {
  9: {
    episodeNumber: 1,
    episodeName: 'The Evidence',
    nextEpisodeName: 'The Purpose',
    summary: [
      'Verified 10 scientific claims across cosmology, biology, geology, anatomy, and history',
      'Each stated 1,300+ years before modern discovery',
      'Odds of coincidence: 1 in 10 billion',
    ],
    reflectionPrompt: 'Take a moment to consider what you have just seen. These claims were made in a book from 7th century Arabia.',
  },
  20: {
    episodeNumber: 2,
    episodeName: 'The Proof',
    nextEpisodeName: 'The Deeper Reality',
    summary: [
      'Understood the purpose of life, rules, and bonus system',
      'Eliminated every possible human author one by one',
      'Experienced the Almanac moment — the Quran as a book of all knowledge',
    ],
    reflectionPrompt: 'This is the most important subject in your life. Take this seriously. Open your heart and honestly ask to be shown the truth.',
  },
};

const WALKTHROUGH_VERSION = 2;

export default function QuranWalkthrough({ onComplete, onTakeBreak }: QuranWalkthroughProps) {
  const [currentScene, setCurrentScene] = useState(() => {
    // Version migration: reset scene if walkthrough structure changed
    const version = localStorage.getItem('walkthrough_version');
    if (!version || parseInt(version, 10) < WALKTHROUGH_VERSION) {
      localStorage.setItem('walkthrough_version', String(WALKTHROUGH_VERSION));
      localStorage.removeItem('explore_walkthrough_scene');
      return 0;
    }
    const saved = localStorage.getItem('explore_walkthrough_scene');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [quickFireDone, setQuickFireDone] = useState(false);
  const [showingEpisodeBreak, setShowingEpisodeBreak] = useState<EpisodeBreakConfig | null>(null);
  const [audioMuted, setAudioMuted] = useState(() => {
    return localStorage.getItem('explore_audio_muted') === 'true';
  });
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Scene definitions ──────────────────────────────────────────────────

  const scenes: WalkthroughScene[] = [
    // ── The Claim (0-2) ──────────────────────────────────────────────────
    {
      id: 'the-claim',
      title: 'The Claim',
      icon: <BookOpen className="w-10 h-10 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto text-center">
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-blue-700/30">
            <p className="text-2xl font-arabic text-amber-100 leading-loose mb-4" dir="rtl">
              ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ
            </p>
            <p className="text-white text-lg italic leading-relaxed">
              "This is the Book about which there is no doubt, a guidance for those conscious of Allah."
            </p>
            <p className="text-slate-500 text-sm mt-2">— Surah Al-Baqarah, 2:2</p>
          </div>
          <p className="text-slate-300 leading-relaxed">
            No hedging. No hesitation. <span className="text-white font-semibold">Absolute certainty.</span>
          </p>
          <p className="text-slate-400">
            These are claimed to be the direct, verbatim words of the Creator of the universe.
            Not inspired by God. Not written about God. <span className="text-white font-semibold">Spoken by God.</span>
          </p>
          <p className="text-slate-400">
            That's a bold claim. Let's see if it holds up.
          </p>
        </div>
      ),
    },
    {
      id: 'the-specialist',
      title: 'The Specialist',
      icon: <User className="w-10 h-10 text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto">
          <p className="text-slate-300 leading-relaxed text-center">
            A cardiologist spends a <span className="text-white font-semibold">lifetime</span> studying the heart.
            An oceanologist dedicates decades to understanding the sea.
            An astronomer devotes their career to the cosmos.
          </p>
          <p className="text-slate-300 leading-relaxed text-center">
            Each one is a <span className="text-white font-semibold">specialist</span> — an expert in one narrow field.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Embryology', icon: <Dna className="w-5 h-5" />, color: 'text-rose-400 bg-rose-500/20' },
              { label: 'Oceanography', icon: <Droplets className="w-5 h-5" />, color: 'text-blue-400 bg-blue-500/20' },
              { label: 'Astronomy', icon: <Globe className="w-5 h-5" />, color: 'text-purple-400 bg-purple-500/20' },
              { label: 'Geology', icon: <Mountain className="w-5 h-5" />, color: 'text-amber-400 bg-amber-500/20' },
              { label: 'Anatomy', icon: <Heart className="w-5 h-5" />, color: 'text-pink-400 bg-pink-500/20' },
              { label: 'History', icon: <Clock className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/20' },
            ].map(field => (
              <div key={field.label} className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${field.color}`}>
                  {field.icon}
                </div>
                <span className="text-slate-300 text-xs font-medium">{field.label}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-300 leading-relaxed text-center">
            Now imagine <span className="text-amber-300 font-semibold">one man</span> — who could not read or write — making
            statements across <span className="text-white font-semibold">every one of these fields</span>...
            and getting them all right.
          </p>
        </div>
      ),
    },
    {
      id: 'back-in-time',
      title: 'Put Yourself Back in Time',
      icon: <Clock className="w-10 h-10 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto text-center">
          <p className="text-3xl font-bold text-white">7th Century Arabia</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              'No telescopes',
              'No microscopes',
              'No satellites',
              'No printing press',
              'No internet',
              'No laboratories',
            ].map(item => (
              <div key={item} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <p className="text-slate-400 text-sm">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-300 leading-relaxed">
            A desert civilisation. No technology. No equipment.
            And yet — a book emerges containing statements about the universe
            that <span className="text-white font-semibold">no human could have known</span>.
          </p>
          <p className="text-slate-400">
            Let's look at what it says.
          </p>
        </div>
      ),
    },

    // ── The Beginning (3-4) — inline evidence ────────────────────────────
    {
      id: 'the-beginning',
      title: 'The Beginning',
      icon: <Sparkles className="w-10 h-10 text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      isInteractive: true,
      interactiveType: 'inline-evidence',
    },
    {
      id: 'the-expansion',
      title: 'The Expansion',
      icon: <Globe className="w-10 h-10 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      isInteractive: true,
      interactiveType: 'inline-evidence',
    },

    // ── The Cosmos (5-6) — inline evidence ───────────────────────────────
    {
      id: 'the-cosmos',
      title: 'The Cosmos',
      icon: <Globe className="w-10 h-10 text-indigo-400" />,
      iconBg: 'bg-indigo-500/20',
      isInteractive: true,
      interactiveType: 'inline-evidence',
    },
    {
      id: 'the-waters',
      title: 'The Waters',
      icon: <Droplets className="w-10 h-10 text-cyan-400" />,
      iconBg: 'bg-cyan-500/20',
      isInteractive: true,
      interactiveType: 'inline-evidence',
    },

    // ── The Creation (7-8) — inline evidence + quick fire ────────────────
    {
      id: 'the-creation',
      title: 'The Creation',
      icon: <Dna className="w-10 h-10 text-rose-400" />,
      iconBg: 'bg-rose-500/20',
      isInteractive: true,
      interactiveType: 'inline-evidence',
    },
    {
      id: 'the-signs',
      title: 'The Signs',
      icon: <Microscope className="w-10 h-10 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20',
      isInteractive: true,
      interactiveType: 'quick-fire-evidence',
    },

    // ── Running Total (9) ────────────────────────────────────────────────
    {
      id: 'the-running-total',
      title: 'The Running Total',
      icon: <Target className="w-10 h-10 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20',
      content: <RunningTotalScene />,
    },

    // ── The Purpose (10-12) ──────────────────────────────────────────────
    {
      id: 'the-purpose',
      title: 'The Purpose',
      icon: <Target className="w-10 h-10 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto text-center">
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-amber-700/30">
            <p className="text-xl font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
              وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ
            </p>
            <p className="text-white text-lg italic">
              "And I did not create the jinn and mankind except to worship Me."
            </p>
            <p className="text-slate-500 text-sm mt-2">— Surah Adh-Dhariyat, 51:56</p>
          </div>
          <p className="text-slate-300 leading-relaxed">
            This is a claim you <span className="text-white font-semibold">cannot verify scientifically</span>.
            No microscope will show you purpose. No telescope will reveal meaning.
          </p>
          <p className="text-slate-300 leading-relaxed">
            But given everything this book got right about the <span className="text-emerald-400 font-semibold">physical world</span> —
            things no human could have known —
            what reason do you have to doubt what it says about the <span className="text-amber-300 font-semibold">unseen</span>?
          </p>
        </div>
      ),
    },
    {
      id: 'everything-is-muslim',
      title: 'Everything Is Muslim',
      icon: <Sunrise className="w-10 h-10 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto">
          <div className="text-center space-y-3">
            <p className="text-slate-300 leading-relaxed">
              The word <span className="text-amber-300 font-semibold">Islam</span> means submission.
              A <span className="text-amber-300 font-semibold">Muslim</span> is one who submits.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Your heart beats', detail: 'without you asking' },
              { label: 'Your cells heal', detail: 'without permission' },
              { label: 'Trees grow', detail: 'following their nature' },
              { label: 'Planets orbit', detail: 'in perfect paths' },
              { label: 'The sun rises', detail: 'every single day' },
              { label: 'Water flows', detail: 'obeying gravity' },
            ].map(item => (
              <div key={item.label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center">
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-slate-500 text-xs">{item.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-300 leading-relaxed text-center">
            Everything in creation submits. <span className="text-white font-semibold">Your body is already Muslim.</span>
          </p>
          <p className="text-slate-400 text-center">
            Only humans and jinn have been given the <span className="text-amber-300 font-semibold">choice</span>.
          </p>
        </div>
      ),
    },
    {
      id: 'the-souls-choice',
      title: "The Soul's Choice",
      icon: <Heart className="w-10 h-10 text-rose-400" />,
      iconBg: 'bg-rose-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto text-center">
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-rose-700/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
              إِنَّا هَدَيْنَاهُ السَّبِيلَ إِمَّا شَاكِرًا وَإِمَّا كَفُورًا
            </p>
            <p className="text-white italic">
              "We guided him to the way, be he grateful or ungrateful."
            </p>
            <p className="text-slate-500 text-sm mt-2">— Surah Al-Insan, 76:3</p>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Your body is Muslim whether you like it or not — you didn't choose to be here.
          </p>
          <p className="text-slate-300 leading-relaxed">
            The test is whether your <span className="text-white font-semibold">soul</span> will fall in line
            with the rest of creation.
          </p>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-2" dir="rtl">
              الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا
            </p>
            <p className="text-slate-300 italic text-sm">
              "He who created death and life to test which of you are best in deeds."
            </p>
            <p className="text-slate-500 text-xs mt-1">— Surah Al-Mulk, 67:2</p>
          </div>
        </div>
      ),
    },

    // ── The Game of Life (13-15) ─────────────────────────────────────────
    {
      id: 'the-rules',
      title: 'The Rules',
      icon: <Scale className="w-10 h-10 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto text-center">
          <p className="text-slate-300 leading-relaxed">
            Actions are based on <span className="text-white font-semibold">intentions</span>.
            Angels record <span className="text-white font-semibold">everything</span>.
          </p>
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-blue-700/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
              وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ
            </p>
            <p className="text-white italic">
              "We created man and know what his soul whispers to him. We are closer to him than his jugular vein."
            </p>
            <p className="text-slate-500 text-sm mt-2">— Surah Qaf, 50:16</p>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            The jugular vein is one of the closest major blood vessels to the surface of your body.
            Science confirmed this — the Quran used this specific metaphor for ultimate closeness.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Every daily action can be worship if done with the right intention.
            Eating, sleeping, working, smiling — all counted.
          </p>
        </div>
      ),
    },
    {
      id: 'the-bonus-system',
      title: 'The Bonus System',
      icon: <Gift className="w-10 h-10 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto text-center">
          <p className="text-slate-300 leading-relaxed">
            Allah created a <span className="text-emerald-400 font-semibold">reward multiplier</span> —
            like the most generous bonus system ever designed.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
              <p className="text-3xl font-bold text-emerald-400">10x</p>
              <p className="text-slate-400 text-xs mt-1">Minimum reward for every good deed</p>
            </div>
            <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
              <p className="text-3xl font-bold text-emerald-400">700x</p>
              <p className="text-slate-400 text-xs mt-1">Maximum multiplier</p>
            </div>
            <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-700/30">
              <p className="text-3xl font-bold text-rose-400">1x</p>
              <p className="text-slate-400 text-xs mt-1">Bad deed recorded as just one</p>
            </div>
            <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/30">
              <p className="text-3xl font-bold text-amber-400">&infin;</p>
              <p className="text-slate-400 text-xs mt-1">Ramadan & special night multipliers</p>
            </div>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Good deeds are multiplied <span className="text-white font-semibold">10x minimum</span>.
            Bad deeds are recorded as <span className="text-white font-semibold">just one</span>.
            And if you intended a bad deed but didn't act on it — it's not written at all.
          </p>
          <p className="text-slate-300 leading-relaxed">
            The mercy is <span className="text-emerald-400 font-semibold">built into the system</span>.
          </p>
        </div>
      ),
    },
    {
      id: 'two-destinations',
      title: 'Two Destinations',
      icon: <AlertTriangle className="w-10 h-10 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto text-center">
          <p className="text-slate-300 leading-relaxed">
            Every soul has an appointed time. You didn't choose to come here.
            You can't choose when you leave.
          </p>
          <div className="space-y-3">
            <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-700/30">
              <p className="text-lg font-arabic text-rose-200 leading-loose mb-2" dir="rtl">
                فَأَمَّا مَن طَغَىٰ وَآثَرَ الْحَيَاةَ الدُّنْيَا فَإِنَّ الْجَحِيمَ هِيَ الْمَأْوَىٰ
              </p>
              <p className="text-rose-300 italic text-sm">
                "As for he who transgressed and preferred the life of this world — Hellfire will be his refuge."
              </p>
            </div>
            <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
              <p className="text-lg font-arabic text-emerald-200 leading-loose mb-2" dir="rtl">
                وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِ وَنَهَى النَّفْسَ عَنِ الْهَوَىٰ فَإِنَّ الْجَنَّةَ هِيَ الْمَأْوَىٰ
              </p>
              <p className="text-emerald-300 italic text-sm">
                "But as for he who feared standing before his Lord and restrained himself — Paradise will be his refuge."
              </p>
            </div>
            <p className="text-slate-500 text-xs">— Surah An-Naziat, 79:37-41</p>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Follow guidance — paradise. Follow desires — the other.
            The game of life ends when you die.
          </p>
          <p className="text-slate-400 text-sm">
            Rejection after knowledge is different from ignorance. Only Allah knows your heart.
          </p>
        </div>
      ),
    },

    // ── Signs in Nature (16) ─────────────────────────────────────────────
    {
      id: 'signs-in-nature',
      title: 'Signs in Nature',
      icon: <Sunrise className="w-10 h-10 text-green-400" />,
      iconBg: 'bg-green-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto text-center">
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-green-700/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
              يُخْرِجُ الْحَيَّ مِنَ الْمَيِّتِ وَيُخْرِجُ الْمَيِّتَ مِنَ الْحَيِّ
            </p>
            <p className="text-white italic">
              "He brings the living out of the dead and the dead out of the living."
            </p>
            <p className="text-slate-500 text-sm mt-2">— Surah Ar-Rum, 30:19</p>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Flowers grow, die, and regrow. Seasons cycle. Nature shows you <span className="text-emerald-400 font-semibold">resurrection every spring</span>.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Your arm moves the instant you think it — who's doing that?
          </p>
          <p className="text-slate-300 leading-relaxed">
            You see a phone in the desert, you know someone intelligent made it.
            What about the universe? What about <span className="text-white font-semibold">you</span>?
          </p>
          <p className="text-amber-300 italic">
            "Do you think you were created for no reason?"
          </p>
        </div>
      ),
    },

    // ── The Unique Book (17) ─────────────────────────────────────────────
    {
      id: 'the-unique-book',
      title: 'The Unique Book',
      icon: <BookOpen className="w-10 h-10 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      content: (
        <div className="space-y-5 max-w-2xl mx-auto text-center">
          <p className="text-slate-300 leading-relaxed">
            The Quran isn't written like a human would write.
            No intro-body-conclusion. No chapters in chronological order.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Revealed over <span className="text-white font-semibold">23 years</span> in response to real situations —
            yet <span className="text-emerald-400 font-semibold">zero contradictions</span>.
            6,236 verses. Zero revisions.
          </p>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-700/30">
            <p className="text-amber-300 font-medium mb-3">Linguistic Precision</p>
            <div className="space-y-2 text-left">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                <p className="text-slate-300 text-sm">
                  Uses <span className="text-white font-medium">feminine verbs</span> for bees — modern science confirmed only females work
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                <p className="text-slate-300 text-sm">
                  <span className="text-white font-medium">"Adna"</span> means both "lowest" and "nearest" — Dead Sea is both
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                <p className="text-slate-300 text-sm">
                  <span className="text-white font-medium">"Yasbahoon"</span> means "swimming" — describes orbital motion perfectly
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 mt-2">
            <p className="text-amber-200 italic mb-1">
              "A Book whose verses have been perfected in detail and then presented, from One who is Wise and Aware."
            </p>
            <p className="text-slate-500 text-xs">— Surah Fussilat (41:3)</p>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm">
            Every word chosen with precision. Every verb form deliberate. Every dual meaning intentional.
            The work of the One who <span className="text-white font-medium">created language itself</span>.
          </p>
        </div>
      ),
    },

    // ── The Verdict (18-21) ──────────────────────────────────────────────
    {
      id: 'prove-it',
      title: 'Prove It',
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20',
      content: <ProveItScene />,
    },
    {
      id: 'the-author',
      title: 'The Author',
      icon: <User className="w-10 h-10 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      isInteractive: true,
      interactiveType: 'authorship-elimination',
    },
    {
      id: 'the-almanac',
      title: 'The Almanac Moment',
      icon: <BookOpen className="w-10 h-10 text-purple-400" />,
      iconBg: 'bg-purple-500/20',
      isInteractive: true,
      interactiveType: 'almanac',
    },
    // ── The Deeper Reality (21-23) ────────────────────────────────────────
    {
      id: 'the-crossroads',
      title: 'The Crossroads',
      icon: <Compass className="w-10 h-10 text-indigo-400" />,
      iconBg: 'bg-indigo-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto text-center">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-slate-800/60 rounded-2xl p-6 border border-indigo-700/30"
          >
            <p className="text-xl text-white font-semibold leading-relaxed mb-4">
              What you are exploring right now is the most important subject in your life.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Not your career. Not your relationships. Not your bank account.
              <span className="text-white font-semibold"> This.</span>
            </p>
          </motion.div>

          <ImagePlaceholder description="Person standing at a fork in the road, silhouetted at dusk" category="concept" src="/images/explore/fork-in-the-road.jpg" />

          <p className="text-slate-300 leading-relaxed">
            Open your heart. Be honest with yourself. Ask — sincerely —
            to be <span className="text-indigo-300 font-semibold">shown the truth</span>.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Accept what your brain tells you makes sense through the process of elimination.
            Do not be <span className="text-rose-300">arrogant</span>. Do not <span className="text-rose-300">dismiss</span>.
          </p>
          <p className="text-slate-400 leading-relaxed">
            Take your time. Come back tomorrow if you need to. There is no rush —
            but there is <span className="text-white font-medium">no subject more worthy of your attention</span>.
          </p>

          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="py-4"
          >
            <div className="w-3 h-3 rounded-full bg-indigo-400/60 mx-auto" />
          </motion.div>
        </div>
      ),
    },
    {
      id: 'signs-end-times',
      title: 'Signs of the End Times',
      icon: <Building2 className="w-10 h-10 text-orange-400" />,
      iconBg: 'bg-orange-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-slate-300 leading-relaxed">
              The Prophet Muhammad <span className="text-slate-500">(peace be upon him)</span> described
              <span className="text-white font-semibold"> signs of the Day of Judgement</span> — events that would happen before the end of time.
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-6 border border-orange-700/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3 text-center" dir="rtl">
              تَتَطَاوَلُونَ فِي الْبُنْيَانِ
            </p>
            <p className="text-white italic text-center mb-2">
              "The barefoot, naked, destitute shepherds will compete in constructing tall buildings."
            </p>
            <p className="text-slate-500 text-sm text-center">— Sahih Muslim</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ImagePlaceholder description="Dubai skyline — Burj Khalifa, desert skyscrapers" category="landscape" src="/images/explore/dubai-skyline.jpg" />
            <ImagePlaceholder description="Bedouin desert camp, simple tents — 7th century contrast" category="historical" src="/images/explore/bedouin-camp.jpg" />
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            In the 7th century, the Arabian Peninsula was <span className="text-white font-semibold">desert</span>.
            Shepherds. Tents. No buildings at all. The idea that these same people would
            one day compete in building the <span className="text-orange-300 font-semibold">tallest structures on Earth</span> was inconceivable.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-amber-300 font-medium text-sm mb-2">Other fulfilled signs:</p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Widespread literacy after centuries of illiteracy</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Time will pass quickly — years feeling like months</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Widespread dishonesty and breaking of trust</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Music and instruments becoming widespread</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30 text-center">
            <p className="text-emerald-300 leading-relaxed">
              If everything this book said about the <span className="text-white font-semibold">past</span> was accurate,
              and prophecies about the <span className="text-white font-semibold">future</span> are playing out today —
              why doubt what it says about <span className="text-emerald-200 font-semibold">what comes next</span>?
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'the-adversary',
      title: 'The Adversary',
      icon: <Flame className="w-10 h-10 text-red-400" />,
      iconBg: 'bg-red-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <ImagePlaceholder description="Dark silhouette vs radiant light — cosmic choice" category="concept" src="/images/explore/light-vs-darkness.jpg" />

          <div className="bg-slate-800/60 rounded-2xl p-6 border border-red-700/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3 text-center" dir="rtl">
              قَالَ أَنَا خَيْرٌ مِّنْهُ ۖ خَلَقْتَنِي مِن نَّارٍ وَخَلَقْتَهُ مِن طِينٍ
            </p>
            <p className="text-white italic text-center mb-2">
              "I am better than him. You created me from fire and created him from clay."
            </p>
            <p className="text-slate-500 text-sm text-center">— Al-A'raf 7:12</p>
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            Iblis (Shaytan) was created from fire. When Allah commanded him to bow to Adam,
            he <span className="text-rose-300 font-semibold">refused</span>.
            Not out of ignorance — out of <span className="text-rose-300 font-semibold">arrogance</span>.
          </p>

          <p className="text-slate-300 leading-relaxed text-center">
            He asked for respite until the Day of Judgement. It was granted.
          </p>

          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3 text-center" dir="rtl">
              ثُمَّ لَآتِيَنَّهُم مِّن بَيْنِ أَيْدِيهِمْ وَمِنْ خَلْفِهِمْ وَعَنْ أَيْمَانِهِمْ وَعَن شَمَائِلِهِمْ
            </p>
            <p className="text-white italic text-center text-sm">
              "I will come to them from before them and behind them, from their right and their left."
            </p>
            <p className="text-slate-500 text-xs text-center mt-1">— Al-A'raf 7:17</p>
            <p className="text-slate-400 text-sm text-center mt-3">
              Notice: he said from every direction — <span className="text-amber-300">but not from above</span>.
              He cannot come between you and Allah.
            </p>
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            He whispers. He exploits your existing weaknesses. Allah declares him
            <span className="text-white font-semibold"> an open enemy</span>.
          </p>

          <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-700/30 text-center">
            <p className="text-rose-200 leading-relaxed">
              Every decision you make is either from the <span className="text-white font-semibold">Party of Allah</span> or
              the <span className="text-rose-300 font-semibold">Party of Shaytan</span>.
              The story is there to warn you: <span className="text-white font-semibold">arrogance</span> was his downfall.
              You could be doing well and think you're better than others — that's exactly what destroyed Iblis.
            </p>
          </div>
        </div>
      ),
    },

    // ── The Way (24-25) ───────────────────────────────────────────────────
    {
      id: 'three-groups',
      title: 'Three Groups',
      icon: <Users className="w-10 h-10 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <ImagePlaceholder description="Celestial balance/scale — weighing of deeds" category="concept" src="/images/explore/celestial-scales.jpg" />

          <p className="text-slate-300 leading-relaxed text-center">
            On the Day of Judgement, people will be divided into <span className="text-white font-semibold">three groups</span>:
          </p>

          <div className="space-y-3">
            <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
              <p className="text-emerald-300 font-semibold mb-1">Those Foremost (As-Sabiqoon)</p>
              <p className="text-slate-300 text-sm">The ones closest to Allah — those who raced towards good.</p>
            </div>
            <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30">
              <p className="text-blue-300 font-semibold mb-1">People of the Right (As-hab al-Yameen)</p>
              <p className="text-slate-300 text-sm">The believers — their record given in their right hand.</p>
            </div>
            <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-700/30">
              <p className="text-rose-300 font-semibold mb-1">People of the Left (As-hab ash-Shimal)</p>
              <p className="text-slate-300 text-sm">Those who rejected — their record given in their left hand.</p>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-5 border border-blue-700/30">
            <p className="text-sm font-arabic text-amber-100 leading-loose mb-2 text-center" dir="rtl">
              وَكُنتُمْ أَزْوَاجًا ثَلَاثَةً
            </p>
            <p className="text-white italic text-center text-sm">
              "And you become three kinds."
            </p>
            <p className="text-slate-500 text-xs text-center mt-1">— Al-Waqi'ah 56:7</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-2" dir="rtl">
              وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ
            </p>
            <p className="text-slate-300 text-sm italic">
              "We are closer to him than his jugular vein."
            </p>
            <p className="text-slate-500 text-xs mt-1">— Qaf 50:16</p>
            <p className="text-slate-400 text-sm mt-3">
              Allah knows what goes on inside your brain. There is <span className="text-white font-medium">no way of outsmarting Him</span>.
              Every action, every intention — recorded.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'the-cheat-code',
      title: 'The Cheat Code',
      icon: <Gamepad2 className="w-10 h-10 text-violet-400" />,
      iconBg: 'bg-violet-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <ImagePlaceholder description="Retro video game level-up aesthetic" category="abstract" src="/images/explore/level-up.jpg" />

          <p className="text-slate-300 leading-relaxed text-center">
            Think of it like a game. Sonic the Hedgehog. Super Mario World.
          </p>
          <p className="text-slate-300 leading-relaxed text-center">
            You can run through the levels and just <span className="text-white font-medium">pass</span>.
            Or you can pass while gathering <span className="text-violet-300 font-semibold">all the rings, all the coins</span> —
            so much more reward.
          </p>

          <div className="bg-slate-800/60 rounded-2xl p-6 border border-violet-700/30 text-center">
            <p className="text-white text-lg font-semibold mb-3">The Cheat Code</p>
            <p className="text-slate-300 leading-relaxed">
              Read the manual. Not just read it — not just memorise it without knowing what it means —
              actually <span className="text-violet-300 font-semibold">learn it, contemplate it, implement it</span>.
            </p>
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            The Quran has <span className="text-white font-semibold">all the answers</span>.
            How to be successful. How to handle anxiety and stress.
            How to understand what this life is about.
          </p>

          <p className="text-slate-300 leading-relaxed text-center">
            How many self-help books do people read?
            The Quran covers <span className="text-emerald-400 font-semibold">everything</span> — and it's from the One who created you.
          </p>

          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30 text-center">
            <p className="text-emerald-300 leading-relaxed">
              In Jannah there are gardens under which rivers flow.
              The <span className="text-white font-semibold">higher you go</span>, the more incredible it is.
              The more you learn and implement, the <span className="text-emerald-200 font-semibold">higher you rise</span>.
            </p>
          </div>

          <p className="text-slate-400 text-sm text-center italic">
            Take a week to go through something properly.
            Don't rush — understand, reflect, and apply.
          </p>
        </div>
      ),
    },

    // ── The Warnings (26-27) ──────────────────────────────────────────────
    {
      id: 'warning-riba',
      title: 'Warning: Interest (Riba)',
      icon: <Banknote className="w-10 h-10 text-red-400" />,
      iconBg: 'bg-red-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <ImagePlaceholder description="Chain-linked coins — debt enslavement metaphor" category="concept" src="/images/explore/chains-debt.jpg" />

          <div className="bg-slate-800/60 rounded-2xl p-6 border border-red-700/30">
            <p className="text-white font-semibold mb-3 text-center">The Mathematical Impossibility</p>
            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <p>Say there's <span className="text-white font-medium">100 million</span> in circulation.</p>
              <p>100 people each borrow <span className="text-white font-medium">1 million</span>.</p>
              <p>They have to pay back <span className="text-rose-300 font-medium">1.3 million</span> each (30% interest).</p>
              <p>Total owed: <span className="text-rose-300 font-bold">130 million</span>.</p>
              <p>But only <span className="text-white font-bold">100 million exists</span>.</p>
            </div>
            <div className="bg-rose-900/30 rounded-lg p-3 mt-4 border border-rose-700/40">
              <p className="text-rose-200 text-center font-medium">
                It is mathematically impossible for everyone to pay back.
              </p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            People are <span className="text-rose-300 font-semibold">indebted forever</span>, enslaved — while the lenders
            sit and do nothing. This is <span className="text-white font-semibold">oppression</span>.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <p className="text-amber-300 font-medium mb-2 text-center">Trade vs Interest</p>
            <div className="space-y-3">
              <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700/30">
                <p className="text-emerald-300 text-sm font-medium">Trade (Halal)</p>
                <p className="text-slate-300 text-sm">Buy a house for 1M, sell for 1.3M — risk taken, real value exchanged, agreed price.</p>
              </div>
              <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700/30">
                <p className="text-rose-300 text-sm font-medium">Interest (Haram)</p>
                <p className="text-slate-300 text-sm">Adding 200K on top because you're paying over time — nothing real exists behind it.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-5 border border-amber-700/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-2 text-center" dir="rtl">
              وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا
            </p>
            <p className="text-white italic text-center text-sm">
              "Allah has permitted trade and forbidden interest."
            </p>
            <p className="text-slate-500 text-xs text-center mt-1">— Al-Baqarah 2:275</p>
          </div>

          <p className="text-slate-400 text-sm text-center">
            One of the worst sins — whether giving or taking.
            Anything that is harmful, we are not allowed to deal with it in any way.
          </p>
        </div>
      ),
    },
    {
      id: 'warning-bidah',
      title: "Warning: Innovations (Bid'ah)",
      icon: <ShieldAlert className="w-10 h-10 text-orange-400" />,
      iconBg: 'bg-orange-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <ImagePlaceholder description="Desert mirage dissolving — beautiful but empty" category="abstract" src="/images/explore/desert-mirage.jpg" />

          <p className="text-slate-300 leading-relaxed text-center">
            Things we've grown up thinking are normal.
            Things everyone does. But where do they come from?
          </p>

          <div className="bg-slate-800/60 rounded-2xl p-6 border border-orange-700/30">
            <p className="text-white font-semibold mb-3 text-center">Example: Birthday Celebrations</p>
            <p className="text-slate-300 leading-relaxed text-sm">
              The human examples — the prophets — <span className="text-white font-medium">none of them ever did this</span>.
              Look at the origin of candles on a cake — it goes back to defying death.
            </p>
            <p className="text-slate-300 leading-relaxed text-sm mt-3">
              You can't defy death. You're making everything centre around <span className="text-orange-300 font-medium">yourself</span>,
              worshipping yourself.
            </p>
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            If the prophets didn't do it, <span className="text-white font-semibold">where is it coming from?</span>
          </p>

          <p className="text-slate-300 leading-relaxed text-center">
            Remember: <span className="text-white font-medium">Party of Shaytan</span> or <span className="text-white font-medium">Party of Allah</span>.
            If an action isn't from Allah's guidance, it can only be from the other.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 text-center">
            <p className="text-slate-300 leading-relaxed">
              The way to validate your actions: only by doing it in accordance with what Allah said
              and how the Prophet <span className="text-slate-500">(peace be upon him)</span> practised it.
            </p>
          </div>

          <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-700/30 text-center">
            <p className="text-rose-200 leading-relaxed">
              Don't be surprised on the Day of Judgement — you've been doing something for years
              and it's <span className="text-white font-semibold">not on your scales</span>. You've been building a mirage.
            </p>
            <p className="text-rose-300 italic text-sm mt-2">
              "Every innovation is misguidance."
            </p>
          </div>
        </div>
      ),
    },

    // ── The Perspective (28-29) ───────────────────────────────────────────
    {
      id: 'the-temporary-life',
      title: 'The Temporary Life',
      icon: <Hourglass className="w-10 h-10 text-slate-300" />,
      iconBg: 'bg-slate-400/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <ImagePlaceholder description="Hourglass with cosmic backdrop, sand running out" category="abstract" src="/images/explore/hourglass-cosmic.jpg" />

          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-600/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3 text-center" dir="rtl">
              اعْلَمُوا أَنَّمَا الْحَيَاةُ الدُّنْيَا لَعِبٌ وَلَهْوٌ وَزِينَةٌ وَتَفَاخُرٌ بَيْنَكُمْ وَتَكَاثُرٌ فِي الْأَمْوَالِ وَالْأَوْلَادِ
            </p>
            <p className="text-white italic text-center text-sm">
              "Know that the life of this world is but amusement, diversion, adornment,
              boasting among you, and competition in wealth and children."
            </p>
            <p className="text-slate-500 text-xs text-center mt-1">— Al-Hadid 57:20</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-2 text-center" dir="rtl">
              قَالُوا لَبِثْنَا يَوْمًا أَوْ بَعْضَ يَوْمٍ
            </p>
            <p className="text-slate-300 italic text-center text-sm">
              On the Day of Judgement, people will be asked: "How long did you stay?"
              They'll say: <span className="text-white font-medium">"A day, or part of a day."</span>
            </p>
            <p className="text-slate-500 text-xs text-center mt-1">— Al-Mu'minun 23:112-113</p>
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            60-70 years — what's that compared to <span className="text-white font-semibold">infinity</span>?
            That's the trial.
          </p>

          <p className="text-slate-300 leading-relaxed text-center">
            Any hardship in this world is <span className="text-emerald-400 font-semibold">expiation</span> for what happens in the next.
            Any pain is expiation. If you <span className="text-white font-medium">try your best</span>, that's all that matters.
          </p>

          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30 text-center">
            <p className="text-emerald-300 leading-relaxed">
              Allah has the answers for anxiety, stress, success.
              How to handle calamities. Everything you need to know —
              it's all in the <span className="text-white font-semibold">manual</span>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'the-promise-paradise',
      title: 'The Promise: Paradise',
      icon: <Sparkles className="w-10 h-10 text-emerald-400" />,
      iconBg: 'bg-emerald-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <ImagePlaceholder description="Lush paradise garden, rivers, golden light" category="nature" src="/images/explore/paradise-garden.jpg" />

          <div className="bg-slate-800/60 rounded-2xl p-6 border border-emerald-700/30">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-3 text-center" dir="rtl">
              مَّثَلُ الْجَنَّةِ الَّتِي وُعِدَ الْمُتَّقُونَ ۖ فِيهَا أَنْهَارٌ مِّن مَّاءٍ غَيْرِ آسِنٍ وَأَنْهَارٌ مِّن لَّبَنٍ لَّمْ يَتَغَيَّرْ طَعْمُهُ وَأَنْهَارٌ مِّنْ خَمْرٍ لَّذَّةٍ لِّلشَّارِبِينَ وَأَنْهَارٌ مِّنْ عَسَلٍ مُّصَفًّى
            </p>
            <p className="text-white italic text-center text-sm leading-relaxed">
              "The description of Paradise: therein are rivers of water unaltered,
              rivers of milk whose taste never changes,
              rivers of wine delicious to those who drink,
              and rivers of purified honey."
            </p>
            <p className="text-slate-500 text-xs text-center mt-2">— Muhammad 47:15</p>
          </div>

          <p className="text-slate-300 leading-relaxed text-center">
            Fruits that look like what you had in this world — <span className="text-white font-medium">"This looks like banana,
            but it's not the same banana."</span> Infinitely better.
          </p>

          <div className="space-y-3">
            <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-700/30">
              <p className="text-emerald-300 font-semibold mb-1">Many Levels</p>
              <p className="text-slate-300 text-sm">
                The highest places for those who learned and implemented the most.
                Gardens under which rivers flow — and the view only gets better.
              </p>
            </div>
            <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/30">
              <p className="text-amber-300 font-semibold mb-1">No Pain, No Ageing, No End</p>
              <p className="text-slate-300 text-sm">
                No sickness, no sadness, no jealousy.
                Everything you desire — and more than you could ever imagine.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-5 border border-emerald-700/30 text-center">
            <p className="text-lg font-arabic text-amber-100 leading-loose mb-2" dir="rtl">
              وَالْآخِرَةُ خَيْرٌ وَأَبْقَىٰ
            </p>
            <p className="text-emerald-200 italic text-sm">
              "The next life is better and more everlasting."
            </p>
            <p className="text-slate-500 text-xs mt-1">— Al-A'la 87:17</p>
          </div>

          <p className="text-slate-400 text-center italic">
            This is the promise for those who submit.
          </p>
        </div>
      ),
    },

    // ── The Verdict (30) ──────────────────────────────────────────────────
    {
      id: 'your-verdict',
      title: 'Your Verdict',
      icon: <Scale className="w-10 h-10 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto text-center">
          <p className="text-xl text-white font-semibold leading-relaxed">
            Where do you think this book came from?
          </p>
          <p className="text-slate-300 leading-relaxed">
            A book that described the Big Bang, the expanding universe, embryonic development,
            unique fingerprints, ocean barriers, mountains as pegs — all in the 7th century.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Delivered by a man who could not read or write.
            In a desert with no technology.
            Over 23 years — with zero contradictions.
          </p>
          <p className="text-slate-300 leading-relaxed">
            We've eliminated every possible human author.
            Its prophecies about the future are unfolding before your eyes.
            It warns you of an enemy you cannot see.
            It explains the purpose of your existence, the rules, the rewards.
          </p>
          <p className="text-slate-300 leading-relaxed">
            It gives you practical guidance for anxiety, relationships, success, and calamity.
            It promises a paradise beyond imagination for those who submit.
          </p>
          <div className="bg-slate-800/60 rounded-2xl p-5 border border-amber-700/30">
            <p className="text-amber-300 font-medium mb-2">The evidence speaks for itself.</p>
            <p className="text-slate-400 text-sm">
              You've seen the claims. You've seen the science.
              You've seen the prophecies. You've heard the warnings.
              You've seen the promise.
              The verdict is yours.
            </p>
          </div>
        </div>
      ),
    },
  ];

  // ─── Phase definitions for progress ───────────────────────────────────

  const phaseDefinitions = [
    { id: 'A', name: 'The Claim', startScene: 0, endScene: 2 },
    { id: 'B', name: 'The Evidence', startScene: 3, endScene: 8 },
    { id: 'C', name: 'Running Total', startScene: 9, endScene: 9 },
    { id: 'D', name: 'The Purpose', startScene: 10, endScene: 12 },
    { id: 'E', name: 'The Game of Life', startScene: 13, endScene: 15 },
    { id: 'F', name: 'The Signs', startScene: 16, endScene: 17 },
    { id: 'G', name: 'The Proof', startScene: 18, endScene: 20 },
    { id: 'H', name: 'The Deeper Reality', startScene: 21, endScene: 23 },
    { id: 'I', name: 'The Way', startScene: 24, endScene: 25 },
    { id: 'J', name: 'The Warnings', startScene: 26, endScene: 27 },
    { id: 'K', name: 'The Perspective', startScene: 28, endScene: 29 },
    { id: 'L', name: 'The Verdict', startScene: 30, endScene: 30 },
  ];

  const getCurrentPhase = () => {
    return phaseDefinitions.find(p => currentScene >= p.startScene && currentScene <= p.endScene) || phaseDefinitions[0];
  };

  const scene = scenes[currentScene];
  const isLastScene = currentScene === scenes.length - 1;
  const isFirstScene = currentScene === 0;

  // ─── Navigation ───────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (isLastScene) {
      localStorage.removeItem('explore_walkthrough_scene');
      onComplete();
    } else {
      const nextScene = currentScene + 1;
      // Check if we're at an episode break point
      const breakConfig = EPISODE_BREAKS[currentScene];
      if (breakConfig) {
        setShowingEpisodeBreak(breakConfig);
      } else {
        setCurrentScene(nextScene);
        setQuickFireDone(false);
      }
    }
  }, [isLastScene, onComplete, currentScene]);

  const handleBack = () => {
    if (!isFirstScene) {
      // Skip back over interactive scenes to land on the last non-interactive one
      let target = currentScene - 1;
      while (target > 0 && scenes[target]?.isInteractive) {
        target--;
      }
      setCurrentScene(target);
    }
  };

  // ─── Persist scene ────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem('explore_walkthrough_scene', String(currentScene));
  }, [currentScene]);

  // ─── Audio ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAudioPlaying(false);
      setAudioLoading(false);
    }
    if (scene.isInteractive) return;
    if (audioMuted) return;

    setAudioLoading(true);
    const audioUrl = `/audio/walkthrough/${scene.id}-nathan.mp3`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onPlay = () => { setAudioPlaying(true); setAudioLoading(false); };
    const onEnd = () => setAudioPlaying(false);
    const onError = () => { setAudioPlaying(false); setAudioLoading(false); };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);

    const timer = setTimeout(() => {
      audio.play().catch(() => { setAudioPlaying(false); setAudioLoading(false); });
    }, 600);

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, [currentScene, audioMuted, scene.id, scene.isInteractive]);

  // ─── Map exhibit data to scene IDs ────────────────────────────────────

  const getExhibitForScene = (sceneId: string) => {
    switch (sceneId) {
      case 'the-beginning': return EXHIBITS.bigBang;
      case 'the-expansion': return EXHIBITS.expansion;
      case 'the-cosmos': return EXHIBITS.orbits;
      case 'the-waters': return EXHIBITS.twoSeas;
      case 'the-creation': return EXHIBITS.embryology;
      default: return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  const renderContent = () => {
    if (scene.isInteractive) {
      if (scene.interactiveType === 'inline-evidence') {
        const exhibit = getExhibitForScene(scene.id);
        if (!exhibit) return null;
        return (
          <InlineEvidence
            {...exhibit}
            onVerified={() => {/* enables continue */}}
          />
        );
      }
      if (scene.interactiveType === 'quick-fire-evidence') {
        return <QuickFireScene onAllRevealed={() => setQuickFireDone(true)} />;
      }
      if (scene.interactiveType === 'authorship-elimination') {
        return <AuthorshipElimination onComplete={handleNext} />;
      }
      if (scene.interactiveType === 'almanac') {
        return <AlmanacGame onComplete={handleNext} />;
      }
    }
    return scene.content;
  };

  // For inline evidence scenes, always show continue (user can verify at their own pace)
  // For authorship/almanac: show back-only nav (they handle their own forward completion)
  const showContinue = () => {
    if (scene.interactiveType === 'quick-fire-evidence') {
      return quickFireDone;
    }
    return true;
  };

  const isFullScreenInteractive = scene.interactiveType === 'authorship-elimination' || scene.interactiveType === 'almanac';

  const currentPhase = getCurrentPhase();
  const progress = ((currentScene + 1) / scenes.length) * 100;

  // ─── Episode break screen ──────────────────────────────────────────────

  if (showingEpisodeBreak) {
    return (
      <EpisodeBreakScreen
        episodeNumber={showingEpisodeBreak.episodeNumber}
        episodeName={showingEpisodeBreak.episodeName}
        nextEpisodeName={showingEpisodeBreak.nextEpisodeName}
        summary={showingEpisodeBreak.summary}
        reflectionPrompt={showingEpisodeBreak.reflectionPrompt}
        onContinue={() => {
          setShowingEpisodeBreak(null);
          setCurrentScene(prev => prev + 1);
          setQuickFireDone(false);
        }}
        onTakeBreak={() => {
          setShowingEpisodeBreak(null);
          if (onTakeBreak) onTakeBreak();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Inline progress indicator — below the parent's ExploreProgressBar */}
      <div className="bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-400 font-medium">{currentPhase.name}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">{currentScene + 1} / {scenes.length}</span>
          </div>
          <button
            onClick={() => {
              setAudioMuted(prev => {
                const next = !prev;
                localStorage.setItem('explore_audio_muted', String(next));
                if (next && audioRef.current) audioRef.current.pause();
                return next;
              });
            }}
            className={`transition p-1 ${audioPlaying ? 'text-amber-400' : audioLoading ? 'text-slate-500' : 'text-slate-400 hover:text-white'}`}
            title={audioMuted ? 'Unmute narration' : audioLoading ? 'Loading audio...' : 'Mute narration'}
          >
            {audioMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : audioLoading ? (
              <Volume2 className="w-4 h-4 animate-pulse opacity-50" />
            ) : (
              <Volume2 className={`w-4 h-4 ${audioPlaying ? 'animate-pulse' : ''}`} />
            )}
          </button>
        </div>
        <div className="h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="pb-32 px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            {/* Scene title */}
            {!scene.isInteractive && (
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${scene.iconBg} mb-4`}>
                  {scene.icon}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">{scene.title}</h2>
              </div>
            )}

            {/* Interactive scenes get their own title treatment */}
            {scene.isInteractive && scene.interactiveType !== 'authorship-elimination' && scene.interactiveType !== 'almanac' && (
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${scene.iconBg} mb-3`}>
                  {scene.icon}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{scene.title}</h2>
              </div>
            )}

            {/* Content */}
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation — full-screen interactive scenes get back-only nav */}
      {isFullScreenInteractive ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 transition text-sm"
            >
              Skip
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : showContinue() ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirstScene}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
                isFirstScene
                  ? 'text-slate-700 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all"
            >
              <span>{isLastScene ? 'Complete Chapter' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
