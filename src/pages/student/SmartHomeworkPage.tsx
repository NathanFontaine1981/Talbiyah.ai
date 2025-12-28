import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Brain,
  Target,
  Trophy,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  BookOpen,
  Lightbulb,
  ExternalLink,
  Clock,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Flame,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../../lib/supabaseClient';
import DashboardHeader from '../../components/DashboardHeader';
import WordMatchingQuiz from '../../components/WordMatchingQuiz';

// Celebration effects
function triggerConfetti(intensity: 'small' | 'medium' | 'large' = 'small') {
  const config = {
    small: { particleCount: 30, spread: 50, origin: { y: 0.7 } },
    medium: { particleCount: 80, spread: 70, origin: { y: 0.6 } },
    large: { particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#8B5CF6', '#6366F1', '#10B981', '#F59E0B'] }
  };
  confetti(config[intensity]);
}

function triggerStreakConfetti() {
  // Fire confetti from both sides
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ['#8B5CF6', '#6366F1', '#F59E0B']
  });
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ['#8B5CF6', '#6366F1', '#F59E0B']
  });
}

interface KnowledgeGap {
  id: string;
  category: string;
  subcategory: string | null;
  severity: 'minor' | 'moderate' | 'major';
  confidenceScore: number;
  timesTargeted: number;
}

interface VocabularyWord {
  arabic: string;
  english: string;
  transliteration: string;
  surah?: number;
}

interface HomeworkGame {
  type: 'flashcard' | 'matching' | 'multiple_choice' | 'fill_blank' | 'english_to_arabic' | 'transliteration' | 'surah_themes';
  title: string;
  description: string;
  questions: any[];
  targetGaps: string[];
  completed: boolean;
  score: number;
  maxScore: number;
}

interface SurahInfo {
  number: number;
  name: string;
  arabicName: string;
  theme: string;
  keyTopics: string[];
  verseCount: number;
}

// Surah themes and information for exam questions - covers all 43 vocabulary surahs
const SURAH_THEMES: { [key: number]: SurahInfo } = {
  1: { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', theme: 'The Opening - essence of the Quran, prayer for guidance', keyTopics: ['Praise of Allah', 'Seeking guidance', 'The straight path'], verseCount: 7 },
  18: { number: 18, name: 'Al-Kahf', arabicName: 'الكهف', theme: 'The Cave - protection from trials and tests of faith', keyTopics: ['People of the Cave', 'Wealth and knowledge tests', 'Dhul-Qarnayn'], verseCount: 110 },
  36: { number: 36, name: 'Ya-Sin', arabicName: 'يس', theme: 'Ya-Sin - the heart of the Quran, resurrection proof', keyTopics: ['Messengers rejected', 'Signs in creation', 'Day of Judgment'], verseCount: 83 },
  55: { number: 55, name: 'Ar-Rahman', arabicName: 'الرحمن', theme: 'The Most Merciful - counting Allah\'s blessings', keyTopics: ['Which favor will you deny?', 'Creation of man and jinn', 'Gardens of Paradise'], verseCount: 78 },
  56: { number: 56, name: "Al-Waqi'ah", arabicName: 'الواقعة', theme: 'The Event - three groups on Day of Judgment', keyTopics: ['Forerunners to Paradise', 'People of the Right', 'People of the Left'], verseCount: 96 },
  67: { number: 67, name: 'Al-Mulk', arabicName: 'الملك', theme: 'The Dominion - Allah\'s sovereignty, protection from grave', keyTopics: ['Allah\'s perfect creation', 'Hellfire warnings', 'Trust in Allah alone'], verseCount: 30 },
  78: { number: 78, name: 'An-Naba', arabicName: 'النبأ', theme: 'The Great News - Day of Judgment certainty', keyTopics: ['Resurrection', 'Signs in creation', 'Paradise and Hell'], verseCount: 40 },
  79: { number: 79, name: "An-Nazi'at", arabicName: 'النازعات', theme: 'Those Who Pull Out - angels and resurrection', keyTopics: ['Angels taking souls', 'Story of Musa and Firawn', 'The Great Catastrophe'], verseCount: 46 },
  80: { number: 80, name: "'Abasa", arabicName: 'عبس', theme: 'He Frowned - treating all equally in dawah', keyTopics: ['The blind man incident', 'Quran is a reminder', 'Day of Judgment scenes'], verseCount: 42 },
  81: { number: 81, name: 'At-Takwir', arabicName: 'التكوير', theme: 'The Folding Up - cosmic events of Qiyamah', keyTopics: ['Sun folded up', 'Stars scattered', 'Quran from noble messenger'], verseCount: 29 },
  82: { number: 82, name: 'Al-Infitar', arabicName: 'الإنفطار', theme: 'The Cleaving - sky split apart on Judgment Day', keyTopics: ['Sky breaks apart', 'Recording angels', 'Reward and punishment'], verseCount: 19 },
  83: { number: 83, name: 'Al-Mutaffifin', arabicName: 'المطففين', theme: 'The Defrauders - warning against cheating in trade', keyTopics: ['Cheating in measures', 'Record of the wicked', 'Record of the righteous'], verseCount: 36 },
  84: { number: 84, name: 'Al-Inshiqaq', arabicName: 'الإنشقاق', theme: 'The Splitting - sky splits and obeys its Lord', keyTopics: ['Earth flattened', 'Books given right or behind', 'Gradual journey to Allah'], verseCount: 25 },
  85: { number: 85, name: 'Al-Buruj', arabicName: 'البروج', theme: 'The Great Stars - story of the people of the trench', keyTopics: ['Believers burned for faith', 'Allah witnesses all', 'Preserved Tablet'], verseCount: 22 },
  86: { number: 86, name: 'At-Tariq', arabicName: 'الطارق', theme: 'The Night Star - every soul has a protector', keyTopics: ['The piercing star', 'Creation from water', 'Quran is decisive'], verseCount: 17 },
  87: { number: 87, name: "Al-A'la", arabicName: 'الأعلى', theme: 'The Most High - glorifying Allah', keyTopics: ['Allah\'s creation', 'Quran preservation', 'Success through purification'], verseCount: 19 },
  88: { number: 88, name: 'Al-Ghashiyah', arabicName: 'الغاشية', theme: 'The Overwhelming - faces humbled and faces joyful', keyTopics: ['Descriptions of Hell', 'Descriptions of Paradise', 'Allah will judge'], verseCount: 26 },
  89: { number: 89, name: 'Al-Fajr', arabicName: 'الفجر', theme: 'The Dawn - destroyed nations and love of wealth', keyTopics: ['Ad, Thamud, Firawn', 'Test of wealth', 'Soul at peace'], verseCount: 30 },
  90: { number: 90, name: 'Al-Balad', arabicName: 'البلد', theme: 'The City - man created in hardship', keyTopics: ['Freeing slaves', 'Feeding the poor', 'Companions of right and left'], verseCount: 20 },
  91: { number: 91, name: 'Ash-Shams', arabicName: 'الشمس', theme: 'The Sun - success through purifying the soul', keyTopics: ['Oaths by creation', 'Soul purification', 'Thamud destroyed'], verseCount: 15 },
  92: { number: 92, name: 'Al-Layl', arabicName: 'الليل', theme: 'The Night - paths of ease and difficulty', keyTopics: ['Giving and fearing Allah', 'Withholding and denying', 'Guidance belongs to Allah'], verseCount: 21 },
  93: { number: 93, name: 'Ad-Duhaa', arabicName: 'الضحى', theme: 'The Morning Hours - Allah has not abandoned you', keyTopics: ['Comfort to Prophet', 'Orphan care', 'Proclaim blessings'], verseCount: 11 },
  94: { number: 94, name: 'Ash-Sharh', arabicName: 'الشرح', theme: 'The Relief - with hardship comes ease', keyTopics: ['Expanded chest', 'Burden removed', 'Ease after difficulty'], verseCount: 8 },
  95: { number: 95, name: 'At-Tin', arabicName: 'التين', theme: 'The Fig - man created in best form', keyTopics: ['Sacred places', 'Best of creation', 'Returned to lowest'], verseCount: 8 },
  96: { number: 96, name: "Al-'Alaq", arabicName: 'العلق', theme: 'The Clot - first revelation, command to read', keyTopics: ['Read in Allah\'s name', 'Man from a clot', 'Taught by the pen'], verseCount: 19 },
  97: { number: 97, name: 'Al-Qadr', arabicName: 'القدر', theme: 'The Night of Decree - Laylatul Qadr', keyTopics: ['Quran revelation', 'Better than 1000 months', 'Angels descend'], verseCount: 5 },
  98: { number: 98, name: 'Al-Bayyinah', arabicName: 'البينة', theme: 'The Clear Evidence - truth has come', keyTopics: ['Clear proof sent', 'Best of creation', 'Worst of creation'], verseCount: 8 },
  99: { number: 99, name: 'Az-Zalzalah', arabicName: 'الزلزلة', theme: 'The Earthquake - Day of Judgment signs', keyTopics: ['Earth\'s shaking', 'Deeds revealed', 'Atom\'s weight of good/evil'], verseCount: 8 },
  100: { number: 100, name: "Al-'Adiyat", arabicName: 'العاديات', theme: 'The War Horses - man\'s ingratitude to Allah', keyTopics: ['Charging horses', 'Man ungrateful', 'Hearts\' contents exposed'], verseCount: 11 },
  101: { number: 101, name: "Al-Qari'ah", arabicName: 'القارعة', theme: 'The Striking Hour - Day of Judgment terror', keyTopics: ['The calamity', 'Scales of deeds', 'Bottomless pit'], verseCount: 11 },
  102: { number: 102, name: 'At-Takathur', arabicName: 'التكاثر', theme: 'Competition for More - warning against materialism', keyTopics: ['Worldly competition', 'Visiting graves', 'Accountability for blessings'], verseCount: 8 },
  103: { number: 103, name: 'Al-Asr', arabicName: 'العصر', theme: 'Time - mankind is in loss except believers who do good', keyTopics: ['Value of time', 'Faith and good deeds', 'Mutual advice'], verseCount: 3 },
  104: { number: 104, name: 'Al-Humazah', arabicName: 'الهمزة', theme: 'The Slanderer - warning against backbiting', keyTopics: ['Backbiting and mockery', 'Hoarding wealth', 'Crushing Fire'], verseCount: 9 },
  105: { number: 105, name: 'Al-Fil', arabicName: 'الفيل', theme: 'The Elephant - Allah\'s protection of Kaaba', keyTopics: ['Abraha\'s army', 'Birds with stones', 'Divine protection'], verseCount: 5 },
  106: { number: 106, name: 'Quraysh', arabicName: 'قريش', theme: 'Quraysh - blessings upon the tribe', keyTopics: ['Trade journeys', 'Gratitude to Allah', 'Worship the Lord of Kaaba'], verseCount: 4 },
  107: { number: 107, name: "Al-Ma'un", arabicName: 'الماعون', theme: 'Small Kindnesses - warning against neglecting worship and charity', keyTopics: ['Denying religion', 'Neglecting orphans', 'Showing off in prayer'], verseCount: 7 },
  108: { number: 108, name: 'Al-Kawthar', arabicName: 'الكوثر', theme: 'Abundance - Allah\'s gift to the Prophet', keyTopics: ['Divine blessings', 'Prayer and sacrifice', 'Enemies cut off'], verseCount: 3 },
  109: { number: 109, name: 'Al-Kafirun', arabicName: 'الكافرون', theme: 'The Disbelievers - declaration of religious freedom', keyTopics: ['Separation of faiths', 'No compromise in belief', 'To you your religion'], verseCount: 6 },
  110: { number: 110, name: 'An-Nasr', arabicName: 'النصر', theme: 'Divine Support - victory and seeking forgiveness', keyTopics: ['Victory from Allah', 'People entering Islam', 'Seeking forgiveness'], verseCount: 3 },
  111: { number: 111, name: 'Al-Masad', arabicName: 'المسد', theme: 'Palm Fiber - warning against opposing truth', keyTopics: ['Abu Lahab\'s fate', 'Wealth cannot save', 'Punishment for enemies of Islam'], verseCount: 5 },
  112: { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', theme: 'Sincerity - pure monotheism, Allah\'s oneness', keyTopics: ['Tawheed', 'Allah is One', 'Allah is Eternal'], verseCount: 4 },
  113: { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', theme: 'The Daybreak - seeking refuge from evil', keyTopics: ['Protection from darkness', 'Protection from envy', 'Protection from magic'], verseCount: 5 },
  114: { number: 114, name: 'An-Nas', arabicName: 'الناس', theme: 'Mankind - seeking refuge from whispering evil', keyTopics: ['Allah as Lord, King, God', 'Evil whispers', 'Protection from Shaytan'], verseCount: 6 },
};

// Complete surah names for all surahs with vocabulary
const SURAH_NAMES: { [key: number]: { name: string; arabicName: string } } = {
  1: { name: 'Al-Fatihah', arabicName: 'الفاتحة' },
  18: { name: 'Al-Kahf', arabicName: 'الكهف' },
  36: { name: 'Ya-Sin', arabicName: 'يس' },
  55: { name: 'Ar-Rahman', arabicName: 'الرحمن' },
  56: { name: "Al-Waqi'ah", arabicName: 'الواقعة' },
  67: { name: 'Al-Mulk', arabicName: 'الملك' },
  78: { name: 'An-Naba', arabicName: 'النبأ' },
  79: { name: "An-Nazi'at", arabicName: 'النازعات' },
  80: { name: "'Abasa", arabicName: 'عبس' },
  81: { name: 'At-Takwir', arabicName: 'التكوير' },
  82: { name: 'Al-Infitar', arabicName: 'الإنفطار' },
  83: { name: 'Al-Mutaffifin', arabicName: 'المطففين' },
  84: { name: 'Al-Inshiqaq', arabicName: 'الإنشقاق' },
  85: { name: 'Al-Buruj', arabicName: 'البروج' },
  86: { name: 'At-Tariq', arabicName: 'الطارق' },
  87: { name: "Al-A'la", arabicName: 'الأعلى' },
  88: { name: 'Al-Ghashiyah', arabicName: 'الغاشية' },
  89: { name: 'Al-Fajr', arabicName: 'الفجر' },
  90: { name: 'Al-Balad', arabicName: 'البلد' },
  91: { name: 'Ash-Shams', arabicName: 'الشمس' },
  92: { name: 'Al-Layl', arabicName: 'الليل' },
  93: { name: 'Ad-Duhaa', arabicName: 'الضحى' },
  94: { name: 'Ash-Sharh', arabicName: 'الشرح' },
  95: { name: 'At-Tin', arabicName: 'التين' },
  96: { name: "Al-'Alaq", arabicName: 'العلق' },
  97: { name: 'Al-Qadr', arabicName: 'القدر' },
  98: { name: 'Al-Bayyinah', arabicName: 'البينة' },
  99: { name: 'Az-Zalzalah', arabicName: 'الزلزلة' },
  100: { name: "Al-'Adiyat", arabicName: 'العاديات' },
  101: { name: "Al-Qari'ah", arabicName: 'القارعة' },
  102: { name: 'At-Takathur', arabicName: 'التكاثر' },
  103: { name: 'Al-Asr', arabicName: 'العصر' },
  104: { name: 'Al-Humazah', arabicName: 'الهمزة' },
  105: { name: 'Al-Fil', arabicName: 'الفيل' },
  106: { name: 'Quraysh', arabicName: 'قريش' },
  107: { name: "Al-Ma'un", arabicName: 'الماعون' },
  108: { name: 'Al-Kawthar', arabicName: 'الكوثر' },
  109: { name: 'Al-Kafirun', arabicName: 'الكافرون' },
  110: { name: 'An-Nasr', arabicName: 'النصر' },
  111: { name: 'Al-Masad', arabicName: 'المسد' },
  112: { name: 'Al-Ikhlas', arabicName: 'الإخلاص' },
  113: { name: 'Al-Falaq', arabicName: 'الفلق' },
  114: { name: 'An-Nas', arabicName: 'الناس' },
};

interface HomeworkSession {
  id: string;
  sessionType: string;
  games: HomeworkGame[];
  currentGameIndex: number;
  totalScore: number;
  maxPossibleScore: number;
  accuracyPercentage: number;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  timeSpentSeconds: number;
  externalPracticeTips: ExternalPracticeTip[];
}

interface ExternalPracticeTip {
  category: string;
  appName: string;
  appUrl: string;
  task: string;
  icon: string;
}

// Comprehensive Surah vocabulary database - cumulative vocabulary pool
const SURAH_VOCABULARY: { [key: number]: VocabularyWord[] } = {
  1: [ // Al-Fatihah
    { arabic: 'بِسْمِ', english: 'In the name of', transliteration: 'Bismi' },
    { arabic: 'اللَّهِ', english: 'Allah', transliteration: 'Allah' },
    { arabic: 'الرَّحْمَٰنِ', english: 'The Most Gracious', transliteration: 'Ar-Rahman' },
    { arabic: 'الرَّحِيمِ', english: 'The Most Merciful', transliteration: 'Ar-Raheem' },
    { arabic: 'الْحَمْدُ', english: 'All praise', transliteration: 'Al-Hamd' },
    { arabic: 'رَبِّ', english: 'Lord', transliteration: 'Rabb' },
    { arabic: 'الْعَالَمِينَ', english: 'of the worlds', transliteration: "Al-'Alameen" },
    { arabic: 'مَالِكِ', english: 'Master/Owner', transliteration: 'Maliki' },
    { arabic: 'يَوْمِ', english: 'Day', transliteration: 'Yawm' },
    { arabic: 'الدِّينِ', english: 'of Judgment', transliteration: 'Ad-Deen' },
    { arabic: 'إِيَّاكَ', english: 'You alone', transliteration: 'Iyyaka' },
    { arabic: 'نَعْبُدُ', english: 'we worship', transliteration: "Na'budu" },
    { arabic: 'نَسْتَعِينُ', english: 'we seek help', transliteration: "Nasta'een" },
    { arabic: 'اهْدِنَا', english: 'Guide us', transliteration: 'Ihdina' },
    { arabic: 'الصِّرَاطَ', english: 'the path', transliteration: 'As-Sirat' },
    { arabic: 'الْمُسْتَقِيمَ', english: 'the straight', transliteration: 'Al-Mustaqeem' },
  ],
  112: [ // Al-Ikhlas
    { arabic: 'قُلْ', english: 'Say', transliteration: 'Qul' },
    { arabic: 'هُوَ', english: 'He is', transliteration: 'Huwa' },
    { arabic: 'أَحَدٌ', english: 'One', transliteration: 'Ahad' },
    { arabic: 'الصَّمَدُ', english: 'The Eternal', transliteration: 'As-Samad' },
    { arabic: 'لَمْ', english: 'Not', transliteration: 'Lam' },
    { arabic: 'يَلِدْ', english: 'He begets', transliteration: 'Yalid' },
    { arabic: 'يُولَدْ', english: 'He is begotten', transliteration: 'Yulad' },
    { arabic: 'وَلَمْ', english: 'And not', transliteration: 'Wa lam' },
    { arabic: 'يَكُن', english: 'there is', transliteration: 'Yakun' },
    { arabic: 'كُفُوًا', english: 'equivalent', transliteration: 'Kufuwan' },
  ],
  113: [ // Al-Falaq
    { arabic: 'أَعُوذُ', english: 'I seek refuge', transliteration: "A'udhu" },
    { arabic: 'بِرَبِّ', english: 'in the Lord', transliteration: 'Bi-Rabbi' },
    { arabic: 'الْفَلَقِ', english: 'of the daybreak', transliteration: 'Al-Falaq' },
    { arabic: 'مِن', english: 'from', transliteration: 'Min' },
    { arabic: 'شَرِّ', english: 'evil', transliteration: 'Sharri' },
    { arabic: 'مَا', english: 'what', transliteration: 'Ma' },
    { arabic: 'خَلَقَ', english: 'He created', transliteration: 'Khalaqa' },
    { arabic: 'غَاسِقٍ', english: 'darkness', transliteration: 'Ghasiq' },
    { arabic: 'وَقَبَ', english: 'when it settles', transliteration: 'Waqab' },
    { arabic: 'النَّفَّاثَاتِ', english: 'those who blow', transliteration: 'An-Naffathat' },
    { arabic: 'الْعُقَدِ', english: 'on knots', transliteration: "Al-'Uqad" },
    { arabic: 'حَاسِدٍ', english: 'an envier', transliteration: 'Hasid' },
    { arabic: 'حَسَدَ', english: 'when he envies', transliteration: 'Hasad' },
  ],
  114: [ // An-Nas
    { arabic: 'النَّاسِ', english: 'mankind', transliteration: 'An-Nas' },
    { arabic: 'مَلِكِ', english: 'King', transliteration: 'Malik' },
    { arabic: 'إِلَٰهِ', english: 'God', transliteration: 'Ilah' },
    { arabic: 'الْوَسْوَاسِ', english: 'the whisperer', transliteration: 'Al-Waswas' },
    { arabic: 'الْخَنَّاسِ', english: 'who withdraws', transliteration: 'Al-Khannas' },
    { arabic: 'يُوَسْوِسُ', english: 'whispers', transliteration: 'Yuwaswis' },
    { arabic: 'صُدُورِ', english: 'breasts/hearts', transliteration: 'Sudur' },
    { arabic: 'الْجِنَّةِ', english: 'the jinn', transliteration: 'Al-Jinnah' },
  ],
  111: [ // Al-Masad
    { arabic: 'تَبَّتْ', english: 'Perish', transliteration: 'Tabbat' },
    { arabic: 'يَدَا', english: 'the hands of', transliteration: 'Yada' },
    { arabic: 'أَبِي', english: 'father of', transliteration: 'Abi' },
    { arabic: 'لَهَبٍ', english: 'flame', transliteration: 'Lahab' },
    { arabic: 'وَتَبَّ', english: 'and perish', transliteration: 'Wa-tabb' },
    { arabic: 'أَغْنَىٰ', english: 'availed', transliteration: 'Aghna' },
    { arabic: 'مَالُهُ', english: 'his wealth', transliteration: 'Maluhu' },
    { arabic: 'كَسَبَ', english: 'he earned', transliteration: 'Kasab' },
    { arabic: 'سَيَصْلَىٰ', english: 'he will burn', transliteration: 'Sayasla' },
    { arabic: 'نَارًا', english: 'a fire', transliteration: 'Naran' },
    { arabic: 'ذَاتَ', english: 'of', transliteration: 'Dhata' },
    { arabic: 'امْرَأَتُهُ', english: 'his wife', transliteration: "Imra'atuhu" },
    { arabic: 'حَمَّالَةَ', english: 'carrier', transliteration: 'Hammalat' },
    { arabic: 'الْحَطَبِ', english: 'of firewood', transliteration: 'Al-Hatab' },
    { arabic: 'جِيدِهَا', english: 'her neck', transliteration: 'Jidiha' },
    { arabic: 'حَبْلٌ', english: 'a rope', transliteration: 'Habl' },
    { arabic: 'مَسَدٍ', english: 'of palm fiber', transliteration: 'Masad' },
  ],
  110: [ // An-Nasr
    { arabic: 'إِذَا', english: 'When', transliteration: 'Idha' },
    { arabic: 'جَاءَ', english: 'comes', transliteration: "Ja'a" },
    { arabic: 'نَصْرُ', english: 'the help', transliteration: 'Nasr' },
    { arabic: 'وَالْفَتْحُ', english: 'and the victory', transliteration: 'Wal-Fath' },
    { arabic: 'رَأَيْتَ', english: 'you see', transliteration: "Ra'ayta" },
    { arabic: 'يَدْخُلُونَ', english: 'entering', transliteration: 'Yadkhulun' },
    { arabic: 'دِينِ', english: 'religion', transliteration: 'Din' },
    { arabic: 'أَفْوَاجًا', english: 'in multitudes', transliteration: 'Afwaja' },
    { arabic: 'فَسَبِّحْ', english: 'then glorify', transliteration: 'Fa-sabbih' },
    { arabic: 'بِحَمْدِ', english: 'with praise', transliteration: 'Bi-hamdi' },
    { arabic: 'رَبِّكَ', english: 'your Lord', transliteration: 'Rabbika' },
    { arabic: 'وَاسْتَغْفِرْهُ', english: 'and seek forgiveness', transliteration: 'Wastaghfirhu' },
    { arabic: 'تَوَّابًا', english: 'accepting repentance', transliteration: 'Tawwaba' },
  ],
  109: [ // Al-Kafirun
    { arabic: 'الْكَافِرُونَ', english: 'O disbelievers', transliteration: 'Al-Kafirun' },
    { arabic: 'لَا', english: 'Not', transliteration: 'La' },
    { arabic: 'أَعْبُدُ', english: 'I worship', transliteration: "A'budu" },
    { arabic: 'تَعْبُدُونَ', english: 'you worship', transliteration: "Ta'budun" },
    { arabic: 'وَلَا', english: 'Nor', transliteration: 'Wa la' },
    { arabic: 'أَنتُمْ', english: 'you', transliteration: 'Antum' },
    { arabic: 'عَابِدُونَ', english: 'worshippers', transliteration: "'Abidun" },
    { arabic: 'عَابِدٌ', english: 'a worshipper', transliteration: "'Abid" },
    { arabic: 'عَبَدتُّمْ', english: 'what you worship', transliteration: "'Abadtum" },
    { arabic: 'دِينُكُمْ', english: 'your religion', transliteration: 'Dinukum' },
    { arabic: 'دِينِ', english: 'my religion', transliteration: 'Dini' },
  ],
  108: [ // Al-Kawthar
    { arabic: 'إِنَّا', english: 'Indeed, We', transliteration: 'Inna' },
    { arabic: 'أَعْطَيْنَاكَ', english: 'have given you', transliteration: "A'taynaka" },
    { arabic: 'الْكَوْثَرَ', english: 'Al-Kawthar', transliteration: 'Al-Kawthar' },
    { arabic: 'فَصَلِّ', english: 'So pray', transliteration: 'Fa-salli' },
    { arabic: 'لِرَبِّكَ', english: 'to your Lord', transliteration: 'Li-Rabbika' },
    { arabic: 'وَانْحَرْ', english: 'and sacrifice', transliteration: 'Wanhar' },
    { arabic: 'إِنَّ', english: 'Indeed', transliteration: 'Inna' },
    { arabic: 'شَانِئَكَ', english: 'your enemy', transliteration: "Shani'aka" },
    { arabic: 'الْأَبْتَرُ', english: 'the one cut off', transliteration: 'Al-Abtar' },
  ],
  103: [ // Al-Asr
    { arabic: 'وَالْعَصْرِ', english: 'By time', transliteration: "Wal-'Asr" },
    { arabic: 'الْإِنسَانَ', english: 'mankind', transliteration: 'Al-Insan' },
    { arabic: 'لَفِي', english: 'is in', transliteration: 'Lafi' },
    { arabic: 'خُسْرٍ', english: 'loss', transliteration: 'Khusr' },
    { arabic: 'إِلَّا', english: 'Except', transliteration: 'Illa' },
    { arabic: 'الَّذِينَ', english: 'those who', transliteration: 'Alladhina' },
    { arabic: 'آمَنُوا', english: 'believe', transliteration: 'Amanu' },
    { arabic: 'وَعَمِلُوا', english: 'and do', transliteration: "Wa'amilu" },
    { arabic: 'الصَّالِحَاتِ', english: 'righteous deeds', transliteration: 'As-Salihat' },
    { arabic: 'وَتَوَاصَوْا', english: 'and advise each other', transliteration: 'Watawasaw' },
    { arabic: 'بِالْحَقِّ', english: 'to truth', transliteration: 'Bil-Haqq' },
    { arabic: 'بِالصَّبْرِ', english: 'to patience', transliteration: 'Bis-Sabr' },
  ],
  36: [ // Ya-Sin
    { arabic: 'يس', english: 'Ya-Sin', transliteration: 'Ya-Sin' },
    { arabic: 'وَالْقُرْآنِ', english: 'By the Quran', transliteration: "Wal-Qur'an" },
    { arabic: 'الْحَكِيمِ', english: 'the Wise', transliteration: 'Al-Hakim' },
    { arabic: 'الْمُرْسَلِينَ', english: 'the messengers', transliteration: 'Al-Mursalin' },
    { arabic: 'صِرَاطٍ', english: 'a path', transliteration: 'Sirat' },
    { arabic: 'مُّسْتَقِيمٍ', english: 'straight', transliteration: 'Mustaqim' },
    { arabic: 'تَنزِيلَ', english: 'revelation', transliteration: 'Tanzil' },
    { arabic: 'الْعَزِيزِ', english: 'the Mighty', transliteration: "Al-'Aziz" },
    { arabic: 'لِتُنذِرَ', english: 'to warn', transliteration: 'Litundhir' },
    { arabic: 'قَوْمًا', english: 'a people', transliteration: 'Qawman' },
    { arabic: 'آبَاؤُهُمْ', english: 'their fathers', transliteration: "Aba'uhum" },
    { arabic: 'غَافِلُونَ', english: 'unaware', transliteration: 'Ghafilun' },
  ],
  67: [ // Al-Mulk
    { arabic: 'تَبَارَكَ', english: 'Blessed is', transliteration: 'Tabaraka' },
    { arabic: 'الَّذِي', english: 'He who', transliteration: 'Alladhi' },
    { arabic: 'بِيَدِهِ', english: 'in His hand', transliteration: 'Biyadihi' },
    { arabic: 'الْمُلْكُ', english: 'the dominion', transliteration: 'Al-Mulk' },
    { arabic: 'قَدِيرٌ', english: 'capable', transliteration: 'Qadir' },
    { arabic: 'خَلَقَ', english: 'created', transliteration: 'Khalaqa' },
    { arabic: 'الْمَوْتَ', english: 'death', transliteration: 'Al-Mawt' },
    { arabic: 'الْحَيَاةَ', english: 'life', transliteration: 'Al-Hayat' },
    { arabic: 'لِيَبْلُوَكُمْ', english: 'to test you', transliteration: 'Liyabluwakum' },
    { arabic: 'أَحْسَنُ', english: 'best', transliteration: 'Ahsan' },
    { arabic: 'عَمَلًا', english: 'in deed', transliteration: "'Amalan" },
    { arabic: 'الْغَفُورُ', english: 'the Forgiving', transliteration: 'Al-Ghafur' },
  ],
  18: [ // Al-Kahf
    { arabic: 'الْحَمْدُ', english: 'All praise', transliteration: 'Al-Hamd' },
    { arabic: 'لِلَّهِ', english: 'to Allah', transliteration: 'Lillah' },
    { arabic: 'أَنزَلَ', english: 'revealed', transliteration: 'Anzala' },
    { arabic: 'عَبْدِهِ', english: 'His servant', transliteration: "'Abdihi" },
    { arabic: 'الْكِتَابَ', english: 'the Book', transliteration: 'Al-Kitab' },
    { arabic: 'عِوَجًا', english: 'crookedness', transliteration: "'Iwajan" },
    { arabic: 'قَيِّمًا', english: 'straight', transliteration: 'Qayyiman' },
    { arabic: 'لِّيُنذِرَ', english: 'to warn', transliteration: 'Liyundhira' },
    { arabic: 'بَأْسًا', english: 'punishment', transliteration: "Ba'san" },
    { arabic: 'شَدِيدًا', english: 'severe', transliteration: 'Shadidan' },
    { arabic: 'وَيُبَشِّرَ', english: 'and give good tidings', transliteration: 'Wayubashshira' },
    { arabic: 'الْمُؤْمِنِينَ', english: 'the believers', transliteration: "Al-Mu'minin" },
  ],
  55: [ // Ar-Rahman
    { arabic: 'الرَّحْمَٰنُ', english: 'The Most Merciful', transliteration: 'Ar-Rahman' },
    { arabic: 'عَلَّمَ', english: 'taught', transliteration: "'Allama" },
    { arabic: 'الْقُرْآنَ', english: 'the Quran', transliteration: "Al-Qur'an" },
    { arabic: 'الْإِنسَانَ', english: 'mankind', transliteration: 'Al-Insan' },
    { arabic: 'الْبَيَانَ', english: 'eloquent speech', transliteration: 'Al-Bayan' },
    { arabic: 'الشَّمْسُ', english: 'the sun', transliteration: 'Ash-Shams' },
    { arabic: 'الْقَمَرُ', english: 'the moon', transliteration: 'Al-Qamar' },
    { arabic: 'بِحُسْبَانٍ', english: 'by calculation', transliteration: 'Bihusban' },
    { arabic: 'النَّجْمُ', english: 'the stars', transliteration: 'An-Najm' },
    { arabic: 'الشَّجَرُ', english: 'the trees', transliteration: 'Ash-Shajar' },
    { arabic: 'يَسْجُدَانِ', english: 'prostrate', transliteration: 'Yasjudan' },
    { arabic: 'السَّمَاءَ', english: 'the heaven', transliteration: "As-Sama'" },
  ],
  56: [ // Al-Waqi'ah
    { arabic: 'الْوَاقِعَةُ', english: 'The Inevitable', transliteration: "Al-Waqi'ah" },
    { arabic: 'وَقَعَتْ', english: 'has occurred', transliteration: "Waqa'at" },
    { arabic: 'لَيْسَ', english: 'there is not', transliteration: 'Laysa' },
    { arabic: 'كَاذِبَةٌ', english: 'denial', transliteration: 'Kadhibah' },
    { arabic: 'خَافِضَةٌ', english: 'bringing down', transliteration: 'Khafidah' },
    { arabic: 'رَّافِعَةٌ', english: 'raising up', transliteration: "Rafi'ah" },
    { arabic: 'رُجَّتِ', english: 'is shaken', transliteration: 'Rujjat' },
    { arabic: 'الْأَرْضُ', english: 'the earth', transliteration: 'Al-Ard' },
    { arabic: 'رَجًّا', english: 'with convulsion', transliteration: 'Rajjan' },
    { arabic: 'بُسَّتِ', english: 'are crumbled', transliteration: 'Bussat' },
    { arabic: 'الْجِبَالُ', english: 'the mountains', transliteration: 'Al-Jibal' },
    { arabic: 'بَسًّا', english: 'crumbling', transliteration: 'Bassan' },
  ],
  78: [ // An-Naba
    { arabic: 'عَمَّ', english: 'About what', transliteration: "'Amma" },
    { arabic: 'يَتَسَاءَلُونَ', english: 'they are asking', transliteration: "Yatasa'alun" },
    { arabic: 'النَّبَإِ', english: 'the news', transliteration: "An-Naba'" },
    { arabic: 'الْعَظِيمِ', english: 'the great', transliteration: "Al-'Azim" },
    { arabic: 'مُخْتَلِفُونَ', english: 'they disagree', transliteration: 'Mukhtalifun' },
    { arabic: 'كَلَّا', english: 'No!', transliteration: 'Kalla' },
    { arabic: 'سَيَعْلَمُونَ', english: 'they will know', transliteration: "Saya'lamun" },
    { arabic: 'الْأَرْضَ', english: 'the earth', transliteration: 'Al-Arda' },
    { arabic: 'مِهَادًا', english: 'a bed', transliteration: 'Mihadan' },
    { arabic: 'الْجِبَالَ', english: 'the mountains', transliteration: 'Al-Jibala' },
    { arabic: 'أَوْتَادًا', english: 'as stakes', transliteration: 'Awtadan' },
    { arabic: 'أَزْوَاجًا', english: 'in pairs', transliteration: 'Azwajan' },
  ],
  87: [ // Al-A'la
    { arabic: 'سَبِّحِ', english: 'Exalt', transliteration: 'Sabbih' },
    { arabic: 'اسْمَ', english: 'the name', transliteration: 'Isma' },
    { arabic: 'رَبِّكَ', english: 'of your Lord', transliteration: 'Rabbika' },
    { arabic: 'الْأَعْلَى', english: 'the Most High', transliteration: "Al-A'la" },
    { arabic: 'خَلَقَ', english: 'created', transliteration: 'Khalaqa' },
    { arabic: 'فَسَوَّىٰ', english: 'and proportioned', transliteration: 'Fasawwa' },
    { arabic: 'قَدَّرَ', english: 'destined', transliteration: 'Qaddara' },
    { arabic: 'فَهَدَىٰ', english: 'and guided', transliteration: 'Fahada' },
    { arabic: 'أَخْرَجَ', english: 'brought out', transliteration: 'Akhraja' },
    { arabic: 'الْمَرْعَىٰ', english: 'the pasture', transliteration: "Al-Mar'a" },
    { arabic: 'فَجَعَلَهُ', english: 'then made it', transliteration: "Faja'alahu" },
    { arabic: 'غُثَاءً', english: 'black stubble', transliteration: "Ghutha'an" },
  ],
  99: [ // Az-Zalzalah
    { arabic: 'زُلْزِلَتِ', english: 'is shaken', transliteration: 'Zulzilat' },
    { arabic: 'الْأَرْضُ', english: 'the earth', transliteration: 'Al-Ardu' },
    { arabic: 'زِلْزَالَهَا', english: 'its earthquake', transliteration: 'Zilzalaha' },
    { arabic: 'أَخْرَجَتِ', english: 'brings forth', transliteration: 'Akhrajat' },
    { arabic: 'أَثْقَالَهَا', english: 'its burdens', transliteration: 'Athqalaha' },
    { arabic: 'قَالَ', english: 'says', transliteration: 'Qala' },
    { arabic: 'الْإِنسَانُ', english: 'man', transliteration: 'Al-Insanu' },
    { arabic: 'مَا', english: 'what', transliteration: 'Ma' },
    { arabic: 'لَهَا', english: 'is with it', transliteration: 'Laha' },
    { arabic: 'يَوْمَئِذٍ', english: 'that Day', transliteration: "Yawma'idhin" },
    { arabic: 'تُحَدِّثُ', english: 'it will report', transliteration: 'Tuhaddith' },
    { arabic: 'أَخْبَارَهَا', english: 'its news', transliteration: 'Akhbaraha' },
  ],
  97: [ // Al-Qadr
    { arabic: 'أَنزَلْنَاهُ', english: 'We sent it down', transliteration: 'Anzalnahu' },
    { arabic: 'لَيْلَةِ', english: 'the Night', transliteration: 'Laylat' },
    { arabic: 'الْقَدْرِ', english: 'of Decree', transliteration: 'Al-Qadr' },
    { arabic: 'أَدْرَاكَ', english: 'make you know', transliteration: 'Adraka' },
    { arabic: 'خَيْرٌ', english: 'better', transliteration: 'Khayr' },
    { arabic: 'أَلْفِ', english: 'a thousand', transliteration: 'Alf' },
    { arabic: 'شَهْرٍ', english: 'months', transliteration: 'Shahr' },
    { arabic: 'تَنَزَّلُ', english: 'descend', transliteration: 'Tanazzal' },
    { arabic: 'الْمَلَائِكَةُ', english: 'the angels', transliteration: "Al-Mala'ikah" },
    { arabic: 'الرُّوحُ', english: 'the Spirit', transliteration: 'Ar-Ruh' },
    { arabic: 'سَلَامٌ', english: 'Peace', transliteration: 'Salam' },
    { arabic: 'مَطْلَعِ', english: 'the emergence', transliteration: "Matla'" },
    { arabic: 'الْفَجْرِ', english: 'of dawn', transliteration: 'Al-Fajr' },
  ],
  79: [ // An-Nazi'at
    { arabic: 'وَالنَّازِعَاتِ', english: 'By those who extract', transliteration: "Wan-Nazi'at" },
    { arabic: 'غَرْقًا', english: 'with violence', transliteration: 'Gharqan' },
    { arabic: 'وَالنَّاشِطَاتِ', english: 'And those who draw out', transliteration: 'Wan-Nashitat' },
    { arabic: 'نَشْطًا', english: 'gently', transliteration: 'Nashtan' },
    { arabic: 'وَالسَّابِحَاتِ', english: 'And those who glide', transliteration: 'Was-Sabihat' },
    { arabic: 'سَبْحًا', english: 'swiftly', transliteration: 'Sabhan' },
    { arabic: 'فَالسَّابِقَاتِ', english: 'And those who race', transliteration: 'Fas-Sabiqat' },
    { arabic: 'سَبْقًا', english: 'racing', transliteration: 'Sabqan' },
    { arabic: 'فَالْمُدَبِّرَاتِ', english: 'And those who arrange', transliteration: 'Fal-Mudabbirat' },
    { arabic: 'أَمْرًا', english: 'affairs', transliteration: 'Amran' },
    { arabic: 'تَرْجُفُ', english: 'will tremble', transliteration: 'Tarjuf' },
    { arabic: 'الرَّاجِفَةُ', english: 'the quaking', transliteration: 'Ar-Rajifah' },
  ],
  80: [ // 'Abasa
    { arabic: 'عَبَسَ', english: 'He frowned', transliteration: "'Abasa" },
    { arabic: 'وَتَوَلَّىٰ', english: 'and turned away', transliteration: 'Watawalla' },
    { arabic: 'جَاءَهُ', english: 'came to him', transliteration: "Ja'ahu" },
    { arabic: 'الْأَعْمَىٰ', english: 'the blind man', transliteration: "Al-A'ma" },
    { arabic: 'يُدْرِيكَ', english: 'make you know', transliteration: 'Yudrika' },
    { arabic: 'لَعَلَّهُ', english: 'perhaps he', transliteration: "La'allahu" },
    { arabic: 'يَزَّكَّىٰ', english: 'might be purified', transliteration: 'Yazzakka' },
    { arabic: 'يَذَّكَّرُ', english: 'or be reminded', transliteration: 'Yadhdhakkar' },
    { arabic: 'فَتَنفَعَهُ', english: 'and benefit him', transliteration: "Fatanfa'ahu" },
    { arabic: 'الذِّكْرَىٰ', english: 'the reminder', transliteration: 'Adh-Dhikra' },
    { arabic: 'اسْتَغْنَىٰ', english: 'considers himself free', transliteration: 'Istaghna' },
    { arabic: 'تَصَدَّىٰ', english: 'you give attention', transliteration: 'Tasadda' },
  ],
  81: [ // At-Takwir
    { arabic: 'كُوِّرَتْ', english: 'is wrapped up', transliteration: 'Kuwwirat' },
    { arabic: 'الشَّمْسُ', english: 'the sun', transliteration: 'Ash-Shams' },
    { arabic: 'انكَدَرَتْ', english: 'fall/scatter', transliteration: 'Inkadarat' },
    { arabic: 'النُّجُومُ', english: 'the stars', transliteration: 'An-Nujum' },
    { arabic: 'سُيِّرَتْ', english: 'are moved', transliteration: 'Suyyirat' },
    { arabic: 'الْجِبَالُ', english: 'the mountains', transliteration: 'Al-Jibal' },
    { arabic: 'عُطِّلَتْ', english: 'are left untended', transliteration: "'Uttilat" },
    { arabic: 'الْعِشَارُ', english: 'the she-camels', transliteration: "Al-'Ishar" },
    { arabic: 'حُشِرَتْ', english: 'are gathered', transliteration: 'Hushirat' },
    { arabic: 'الْوُحُوشُ', english: 'the wild beasts', transliteration: 'Al-Wuhush' },
    { arabic: 'سُجِّرَتْ', english: 'are filled', transliteration: 'Sujjirat' },
    { arabic: 'الْبِحَارُ', english: 'the seas', transliteration: 'Al-Bihar' },
  ],
  82: [ // Al-Infitar
    { arabic: 'انفَطَرَتْ', english: 'splits open', transliteration: 'Infatarat' },
    { arabic: 'السَّمَاءُ', english: 'the sky', transliteration: "As-Sama'" },
    { arabic: 'انتَثَرَتْ', english: 'are scattered', transliteration: 'Intatharat' },
    { arabic: 'الْكَوَاكِبُ', english: 'the stars', transliteration: 'Al-Kawakib' },
    { arabic: 'فُجِّرَتْ', english: 'are burst forth', transliteration: 'Fujjirat' },
    { arabic: 'بُعْثِرَتْ', english: 'are scattered', transliteration: "Bu'thirat" },
    { arabic: 'الْقُبُورُ', english: 'the graves', transliteration: 'Al-Qubur' },
    { arabic: 'عَلِمَتْ', english: 'will know', transliteration: "'Alimat" },
    { arabic: 'نَفْسٌ', english: 'a soul', transliteration: 'Nafs' },
    { arabic: 'قَدَّمَتْ', english: 'has put forth', transliteration: 'Qaddamat' },
    { arabic: 'أَخَّرَتْ', english: 'and kept back', transliteration: 'Akhkharat' },
    { arabic: 'غَرَّكَ', english: 'deceived you', transliteration: 'Gharraka' },
  ],
  83: [ // Al-Mutaffifin
    { arabic: 'وَيْلٌ', english: 'Woe', transliteration: 'Wayl' },
    { arabic: 'لِّلْمُطَفِّفِينَ', english: 'to those who cheat', transliteration: 'Lil-Mutaffifin' },
    { arabic: 'اكْتَالُوا', english: 'they measure', transliteration: 'Iktalu' },
    { arabic: 'يَسْتَوْفُونَ', english: 'they take in full', transliteration: 'Yastawfun' },
    { arabic: 'كَالُوهُمْ', english: 'they give by measure', transliteration: 'Kaluhum' },
    { arabic: 'وَّزَنُوهُمْ', english: 'or weigh for them', transliteration: 'Wazanuhum' },
    { arabic: 'يُخْسِرُونَ', english: 'give less', transliteration: 'Yukhsirun' },
    { arabic: 'مَّبْعُوثُونَ', english: 'will be resurrected', transliteration: "Mab'uthun" },
    { arabic: 'عَظِيمٍ', english: 'tremendous', transliteration: "'Azim" },
    { arabic: 'يَقُومُ', english: 'will stand', transliteration: 'Yaqum' },
    { arabic: 'سِجِّينٍ', english: 'Sijjin (prison)', transliteration: 'Sijjin' },
    { arabic: 'مَّرْقُومٌ', english: 'inscribed', transliteration: 'Marqum' },
  ],
  84: [ // Al-Inshiqaq
    { arabic: 'انشَقَّتْ', english: 'splits open', transliteration: 'Inshaqqat' },
    { arabic: 'وَأَذِنَتْ', english: 'and has listened', transliteration: "Wa'adhinat" },
    { arabic: 'لِرَبِّهَا', english: 'to its Lord', transliteration: 'Lirabbiha' },
    { arabic: 'وَحُقَّتْ', english: 'and was obligated', transliteration: 'Wahuqqat' },
    { arabic: 'مُدَّتْ', english: 'is spread out', transliteration: 'Muddat' },
    { arabic: 'وَأَلْقَتْ', english: 'and has cast out', transliteration: "Wa'alqat" },
    { arabic: 'تَخَلَّتْ', english: 'and relinquished', transliteration: 'Takhallat' },
    { arabic: 'كَادِحٌ', english: 'laboring hard', transliteration: 'Kadih' },
    { arabic: 'كَدْحًا', english: 'with exertion', transliteration: 'Kadhan' },
    { arabic: 'فَمُلَاقِيهِ', english: 'then meeting it', transliteration: 'Famulaqih' },
    { arabic: 'يَمِينِهِ', english: 'his right hand', transliteration: 'Yaminih' },
    { arabic: 'ظَهْرِهِ', english: 'his back', transliteration: 'Zahrih' },
  ],
  85: [ // Al-Buruj
    { arabic: 'وَالسَّمَاءِ', english: 'By the sky', transliteration: "Was-Sama'" },
    { arabic: 'ذَاتِ', english: 'containing', transliteration: 'Dhat' },
    { arabic: 'الْبُرُوجِ', english: 'great stars', transliteration: 'Al-Buruj' },
    { arabic: 'وَالْيَوْمِ', english: 'And the Day', transliteration: 'Wal-Yawm' },
    { arabic: 'الْمَوْعُودِ', english: 'Promised', transliteration: "Al-Maw'ud" },
    { arabic: 'وَشَاهِدٍ', english: 'And a witness', transliteration: 'Wa-Shahid' },
    { arabic: 'وَمَشْهُودٍ', english: 'and witnessed', transliteration: 'Wa-Mashhud' },
    { arabic: 'قُتِلَ', english: 'Destroyed were', transliteration: 'Qutila' },
    { arabic: 'أَصْحَابُ', english: 'the companions of', transliteration: 'Ashab' },
    { arabic: 'الْأُخْدُودِ', english: 'the trench', transliteration: 'Al-Ukhdud' },
    { arabic: 'النَّارِ', english: 'the fire', transliteration: 'An-Nar' },
    { arabic: 'الْوَقُودِ', english: 'full of fuel', transliteration: 'Al-Waqud' },
  ],
  86: [ // At-Tariq
    { arabic: 'وَالسَّمَاءِ', english: 'By the sky', transliteration: "Was-Sama'" },
    { arabic: 'وَالطَّارِقِ', english: 'and the night comer', transliteration: 'Wat-Tariq' },
    { arabic: 'النَّجْمُ', english: 'the star', transliteration: 'An-Najm' },
    { arabic: 'الثَّاقِبُ', english: 'piercing', transliteration: 'Ath-Thaqib' },
    { arabic: 'كُلُّ', english: 'every', transliteration: 'Kull' },
    { arabic: 'نَفْسٍ', english: 'soul', transliteration: 'Nafs' },
    { arabic: 'لَّمَّا', english: 'surely', transliteration: 'Lamma' },
    { arabic: 'حَافِظٌ', english: 'a protector', transliteration: 'Hafiz' },
    { arabic: 'فَلْيَنظُرِ', english: 'So let man look', transliteration: 'Falyanzur' },
    { arabic: 'خُلِقَ', english: 'he was created', transliteration: 'Khuliqa' },
    { arabic: 'مَّاءٍ', english: 'water', transliteration: "Ma'" },
    { arabic: 'دَافِقٍ', english: 'gushing', transliteration: 'Dafiq' },
  ],
  88: [ // Al-Ghashiyah
    { arabic: 'هَلْ', english: 'Has', transliteration: 'Hal' },
    { arabic: 'أَتَاكَ', english: 'there reached you', transliteration: 'Ataka' },
    { arabic: 'حَدِيثُ', english: 'the report', transliteration: 'Hadith' },
    { arabic: 'الْغَاشِيَةِ', english: 'of the Overwhelming', transliteration: 'Al-Ghashiyah' },
    { arabic: 'وُجُوهٌ', english: 'Faces', transliteration: 'Wujuh' },
    { arabic: 'يَوْمَئِذٍ', english: 'that Day', transliteration: "Yawma'idhin" },
    { arabic: 'خَاشِعَةٌ', english: 'humbled', transliteration: "Khashi'ah" },
    { arabic: 'عَامِلَةٌ', english: 'working hard', transliteration: "'Amilah" },
    { arabic: 'نَّاصِبَةٌ', english: 'exhausted', transliteration: 'Nasibah' },
    { arabic: 'تَصْلَىٰ', english: 'will burn in', transliteration: 'Tasla' },
    { arabic: 'حَامِيَةً', english: 'blazing', transliteration: 'Hamiyah' },
    { arabic: 'تُسْقَىٰ', english: 'given to drink', transliteration: 'Tusqa' },
  ],
  89: [ // Al-Fajr
    { arabic: 'وَالْفَجْرِ', english: 'By the dawn', transliteration: 'Wal-Fajr' },
    { arabic: 'وَلَيَالٍ', english: 'And nights', transliteration: 'Wa Layalin' },
    { arabic: 'عَشْرٍ', english: 'ten', transliteration: "'Ashr" },
    { arabic: 'وَالشَّفْعِ', english: 'And the even', transliteration: "Wash-Shaf'" },
    { arabic: 'وَالْوَتْرِ', english: 'and the odd', transliteration: 'Wal-Watr' },
    { arabic: 'وَاللَّيْلِ', english: 'And the night', transliteration: 'Wal-Layl' },
    { arabic: 'يَسْرِ', english: 'when it passes', transliteration: 'Yasri' },
    { arabic: 'قَسَمٌ', english: 'an oath', transliteration: 'Qasam' },
    { arabic: 'لِّذِي', english: 'for one of', transliteration: 'Lidhi' },
    { arabic: 'حِجْرٍ', english: 'understanding', transliteration: 'Hijr' },
    { arabic: 'أَلَمْ', english: 'Have you not', transliteration: 'Alam' },
    { arabic: 'تَرَ', english: 'seen', transliteration: 'Tara' },
  ],
  90: [ // Al-Balad
    { arabic: 'أُقْسِمُ', english: 'I swear', transliteration: 'Uqsimu' },
    { arabic: 'الْبَلَدِ', english: 'this city', transliteration: 'Al-Balad' },
    { arabic: 'حِلٌّ', english: 'free of restriction', transliteration: 'Hill' },
    { arabic: 'وَوَالِدٍ', english: 'And a father', transliteration: 'Wa Walid' },
    { arabic: 'وَمَا', english: 'and that which', transliteration: 'Wa ma' },
    { arabic: 'وَلَدَ', english: 'he fathered', transliteration: 'Walad' },
    { arabic: 'لَقَدْ', english: 'We have certainly', transliteration: 'Laqad' },
    { arabic: 'كَبَدٍ', english: 'hardship', transliteration: 'Kabad' },
    { arabic: 'أَيَحْسَبُ', english: 'Does he think', transliteration: 'Ayahsab' },
    { arabic: 'لَن', english: 'never', transliteration: 'Lan' },
    { arabic: 'يَقْدِرَ', english: 'will have power', transliteration: 'Yaqdira' },
    { arabic: 'أَحَدٌ', english: 'anyone', transliteration: 'Ahad' },
  ],
  91: [ // Ash-Shams
    { arabic: 'وَالشَّمْسِ', english: 'By the sun', transliteration: 'Wash-Shams' },
    { arabic: 'وَضُحَاهَا', english: 'and its brightness', transliteration: 'Waduhaha' },
    { arabic: 'وَالْقَمَرِ', english: 'And the moon', transliteration: 'Wal-Qamar' },
    { arabic: 'تَلَاهَا', english: 'when it follows', transliteration: 'Talaha' },
    { arabic: 'وَالنَّهَارِ', english: 'And the day', transliteration: 'Wan-Nahar' },
    { arabic: 'جَلَّاهَا', english: 'when it displays', transliteration: 'Jallaha' },
    { arabic: 'وَاللَّيْلِ', english: 'And the night', transliteration: 'Wal-Layl' },
    { arabic: 'يَغْشَاهَا', english: 'when it covers', transliteration: 'Yaghshaha' },
    { arabic: 'بَنَاهَا', english: 'He built it', transliteration: 'Banaha' },
    { arabic: 'طَحَاهَا', english: 'He spread it out', transliteration: 'Tahaha' },
    { arabic: 'سَوَّاهَا', english: 'He proportioned it', transliteration: 'Sawwaha' },
    { arabic: 'فُجُورَهَا', english: 'its wickedness', transliteration: 'Fujuraha' },
  ],
  92: [ // Al-Layl
    { arabic: 'وَاللَّيْلِ', english: 'By the night', transliteration: 'Wal-Layl' },
    { arabic: 'يَغْشَىٰ', english: 'when it covers', transliteration: 'Yaghsha' },
    { arabic: 'وَالنَّهَارِ', english: 'And the day', transliteration: 'Wan-Nahar' },
    { arabic: 'تَجَلَّىٰ', english: 'when it appears', transliteration: 'Tajalla' },
    { arabic: 'الذَّكَرَ', english: 'the male', transliteration: 'Adh-Dhakar' },
    { arabic: 'وَالْأُنثَىٰ', english: 'and the female', transliteration: 'Wal-Untha' },
    { arabic: 'سَعْيَكُمْ', english: 'your efforts', transliteration: "Sa'yakum" },
    { arabic: 'لَشَتَّىٰ', english: 'are diverse', transliteration: 'Lashatta' },
    { arabic: 'أَعْطَىٰ', english: 'gives', transliteration: "A'ta" },
    { arabic: 'وَاتَّقَىٰ', english: 'and fears Allah', transliteration: 'Wattaqa' },
    { arabic: 'وَصَدَّقَ', english: 'and believes in', transliteration: 'Wasaddaqa' },
    { arabic: 'الْحُسْنَىٰ', english: 'the best reward', transliteration: 'Al-Husna' },
  ],
  93: [ // Ad-Duhaa
    { arabic: 'وَالضُّحَىٰ', english: 'By the morning brightness', transliteration: 'Wad-Duha' },
    { arabic: 'سَجَىٰ', english: 'when it is still', transliteration: 'Saja' },
    { arabic: 'وَدَّعَكَ', english: 'has abandoned you', transliteration: "Wadda'aka" },
    { arabic: 'رَبُّكَ', english: 'your Lord', transliteration: 'Rabbuka' },
    { arabic: 'وَمَا', english: 'nor', transliteration: 'Wama' },
    { arabic: 'قَلَىٰ', english: 'has He detested', transliteration: 'Qala' },
    { arabic: 'وَلَلْآخِرَةُ', english: 'And the Hereafter', transliteration: 'Walal-Akhirah' },
    { arabic: 'الْأُولَىٰ', english: 'than the first', transliteration: 'Al-Ula' },
    { arabic: 'وَلَسَوْفَ', english: 'And soon', transliteration: 'Walasawfa' },
    { arabic: 'يُعْطِيكَ', english: 'will give you', transliteration: "Yu'tika" },
    { arabic: 'فَتَرْضَىٰ', english: 'and you will be satisfied', transliteration: 'Fatarda' },
    { arabic: 'يَتِيمًا', english: 'an orphan', transliteration: 'Yatiman' },
  ],
  94: [ // Ash-Sharh
    { arabic: 'أَلَمْ', english: 'Did We not', transliteration: 'Alam' },
    { arabic: 'نَشْرَحْ', english: 'expand', transliteration: 'Nashrah' },
    { arabic: 'صَدْرَكَ', english: 'your breast', transliteration: 'Sadraka' },
    { arabic: 'وَوَضَعْنَا', english: 'And We removed', transliteration: "Wawada'na" },
    { arabic: 'عَنكَ', english: 'from you', transliteration: "'Anka" },
    { arabic: 'وِزْرَكَ', english: 'your burden', transliteration: 'Wizraka' },
    { arabic: 'أَنقَضَ', english: 'which had weighed upon', transliteration: 'Anqada' },
    { arabic: 'ظَهْرَكَ', english: 'your back', transliteration: 'Zahraka' },
    { arabic: 'وَرَفَعْنَا', english: 'And We raised high', transliteration: "Warafa'na" },
    { arabic: 'ذِكْرَكَ', english: 'your reputation', transliteration: 'Dhikraka' },
    { arabic: 'يُسْرًا', english: 'ease', transliteration: 'Yusra' },
    { arabic: 'عُسْرًا', english: 'hardship', transliteration: "'Usra" },
  ],
  95: [ // At-Tin
    { arabic: 'وَالتِّينِ', english: 'By the fig', transliteration: 'Wat-Tin' },
    { arabic: 'وَالزَّيْتُونِ', english: 'and the olive', transliteration: 'Waz-Zaytun' },
    { arabic: 'وَطُورِ', english: 'And Mount', transliteration: 'Wa Tur' },
    { arabic: 'سِينِينَ', english: 'Sinai', transliteration: 'Sinin' },
    { arabic: 'وَهَٰذَا', english: 'And this', transliteration: 'Wa Hadha' },
    { arabic: 'الْأَمِينِ', english: 'secure', transliteration: 'Al-Amin' },
    { arabic: 'أَحْسَنِ', english: 'the best', transliteration: 'Ahsan' },
    { arabic: 'تَقْوِيمٍ', english: 'stature', transliteration: 'Taqwim' },
    { arabic: 'رَدَدْنَاهُ', english: 'We return him', transliteration: 'Radadnahu' },
    { arabic: 'أَسْفَلَ', english: 'the lowest', transliteration: 'Asfal' },
    { arabic: 'سَافِلِينَ', english: 'of the low', transliteration: 'Safilin' },
    { arabic: 'غَيْرُ', english: 'never ending', transliteration: 'Ghayr' },
  ],
  96: [ // Al-'Alaq
    { arabic: 'اقْرَأْ', english: 'Read', transliteration: "Iqra'" },
    { arabic: 'بِاسْمِ', english: 'in the name', transliteration: 'Bismi' },
    { arabic: 'خَلَقَ', english: 'who created', transliteration: 'Khalaqa' },
    { arabic: 'عَلَقٍ', english: 'a clinging substance', transliteration: "'Alaq" },
    { arabic: 'الْأَكْرَمُ', english: 'the Most Generous', transliteration: 'Al-Akram' },
    { arabic: 'عَلَّمَ', english: 'He taught', transliteration: "'Allama" },
    { arabic: 'بِالْقَلَمِ', english: 'by the pen', transliteration: 'Bil-Qalam' },
    { arabic: 'يَعْلَمْ', english: 'he knew', transliteration: "Ya'lam" },
    { arabic: 'كَلَّا', english: 'No!', transliteration: 'Kalla' },
    { arabic: 'لَيَطْغَىٰ', english: 'transgresses', transliteration: 'Layatgha' },
    { arabic: 'اسْتَغْنَىٰ', english: 'self-sufficient', transliteration: 'Istaghna' },
    { arabic: 'الرُّجْعَىٰ', english: 'the return', transliteration: "Ar-Ruj'a" },
  ],
  98: [ // Al-Bayyinah
    { arabic: 'لَمْ', english: 'Not', transliteration: 'Lam' },
    { arabic: 'يَكُنِ', english: 'did', transliteration: 'Yakun' },
    { arabic: 'كَفَرُوا', english: 'those who disbelieved', transliteration: 'Kafaru' },
    { arabic: 'أَهْلِ', english: 'People of', transliteration: 'Ahl' },
    { arabic: 'الْكِتَابِ', english: 'the Scripture', transliteration: 'Al-Kitab' },
    { arabic: 'الْمُشْرِكِينَ', english: 'the polytheists', transliteration: 'Al-Mushrikin' },
    { arabic: 'مُنفَكِّينَ', english: 'to be parted', transliteration: 'Munfakkin' },
    { arabic: 'تَأْتِيَهُمُ', english: 'there came to them', transliteration: "Ta'tiyahum" },
    { arabic: 'الْبَيِّنَةُ', english: 'clear evidence', transliteration: 'Al-Bayyinah' },
    { arabic: 'رَسُولٌ', english: 'a Messenger', transliteration: 'Rasul' },
    { arabic: 'يَتْلُو', english: 'reciting', transliteration: 'Yatlu' },
    { arabic: 'صُحُفًا', english: 'scriptures', transliteration: 'Suhufan' },
  ],
  100: [ // Al-'Adiyat
    { arabic: 'وَالْعَادِيَاتِ', english: 'By the racers', transliteration: "Wal-'Adiyat" },
    { arabic: 'ضَبْحًا', english: 'panting', transliteration: 'Dabhan' },
    { arabic: 'فَالْمُورِيَاتِ', english: 'And the producers of sparks', transliteration: 'Fal-Muriyat' },
    { arabic: 'قَدْحًا', english: 'striking', transliteration: 'Qadhan' },
    { arabic: 'فَالْمُغِيرَاتِ', english: 'And the chargers', transliteration: 'Fal-Mughirat' },
    { arabic: 'صُبْحًا', english: 'at dawn', transliteration: 'Subhan' },
    { arabic: 'فَأَثَرْنَ', english: 'stirring up', transliteration: "Fa'atharna" },
    { arabic: 'نَقْعًا', english: 'clouds of dust', transliteration: "Naq'an" },
    { arabic: 'فَوَسَطْنَ', english: 'arriving thereby', transliteration: 'Fawasatna' },
    { arabic: 'جَمْعًا', english: 'in the center', transliteration: "Jam'an" },
    { arabic: 'لَكَنُودٌ', english: 'ungrateful', transliteration: 'Lakanud' },
    { arabic: 'لَشَهِيدٌ', english: 'a witness', transliteration: 'Lashahid' },
  ],
  101: [ // Al-Qari'ah
    { arabic: 'الْقَارِعَةُ', english: 'The Striking Calamity', transliteration: "Al-Qari'ah" },
    { arabic: 'مَا', english: 'What is', transliteration: 'Ma' },
    { arabic: 'أَدْرَاكَ', english: 'can make you know', transliteration: 'Adraka' },
    { arabic: 'يَوْمَ', english: 'the Day', transliteration: 'Yawm' },
    { arabic: 'يَكُونُ', english: 'will be', transliteration: 'Yakunu' },
    { arabic: 'كَالْفَرَاشِ', english: 'like moths', transliteration: 'Kal-Farash' },
    { arabic: 'الْمَبْثُوثِ', english: 'dispersed', transliteration: 'Al-Mabthuth' },
    { arabic: 'كَالْعِهْنِ', english: 'like wool', transliteration: "Kal-'Ihn" },
    { arabic: 'الْمَنفُوشِ', english: 'fluffed up', transliteration: 'Al-Manfush' },
    { arabic: 'ثَقُلَتْ', english: 'are heavy', transliteration: 'Thaqulat' },
    { arabic: 'مَوَازِينُهُ', english: 'his scales', transliteration: 'Mawazinuh' },
    { arabic: 'خَفَّتْ', english: 'are light', transliteration: 'Khaffat' },
  ],
  102: [ // At-Takathur
    { arabic: 'أَلْهَاكُمُ', english: 'has distracted you', transliteration: 'Alhakum' },
    { arabic: 'التَّكَاثُرُ', english: 'The competition', transliteration: 'At-Takathur' },
    { arabic: 'حَتَّىٰ', english: 'Until', transliteration: 'Hatta' },
    { arabic: 'زُرْتُمُ', english: 'you visit', transliteration: 'Zurtum' },
    { arabic: 'الْمَقَابِرَ', english: 'the graveyards', transliteration: 'Al-Maqabir' },
    { arabic: 'كَلَّا', english: 'No!', transliteration: 'Kalla' },
    { arabic: 'سَوْفَ', english: 'You will', transliteration: 'Sawfa' },
    { arabic: 'تَعْلَمُونَ', english: 'know', transliteration: "Ta'lamun" },
    { arabic: 'ثُمَّ', english: 'Then', transliteration: 'Thumma' },
    { arabic: 'عِلْمَ', english: 'knowledge', transliteration: "'Ilm" },
    { arabic: 'الْيَقِينِ', english: 'of certainty', transliteration: 'Al-Yaqin' },
    { arabic: 'لَتَرَوُنَّ', english: 'You will see', transliteration: 'Latarawunna' },
  ],
  104: [ // Al-Humazah
    { arabic: 'وَيْلٌ', english: 'Woe', transliteration: 'Wayl' },
    { arabic: 'لِّكُلِّ', english: 'to every', transliteration: 'Likulli' },
    { arabic: 'هُمَزَةٍ', english: 'scorner', transliteration: 'Humazah' },
    { arabic: 'لُّمَزَةٍ', english: 'backbiter', transliteration: 'Lumazah' },
    { arabic: 'جَمَعَ', english: 'He collected', transliteration: "Jama'a" },
    { arabic: 'مَالًا', english: 'wealth', transliteration: 'Malan' },
    { arabic: 'وَعَدَّدَهُ', english: 'and counted it', transliteration: "Wa'addadah" },
    { arabic: 'يَحْسَبُ', english: 'He thinks', transliteration: 'Yahsab' },
    { arabic: 'أَخْلَدَهُ', english: 'will make him immortal', transliteration: 'Akhladah' },
    { arabic: 'كَلَّا', english: 'No!', transliteration: 'Kalla' },
    { arabic: 'لَيُنبَذَنَّ', english: 'He will be thrown', transliteration: 'Layunbadhanna' },
    { arabic: 'الْحُطَمَةِ', english: 'the Crusher', transliteration: 'Al-Hutamah' },
  ],
  105: [ // Al-Fil
    { arabic: 'أَلَمْ', english: 'Have you not', transliteration: 'Alam' },
    { arabic: 'تَرَ', english: 'seen', transliteration: 'Tara' },
    { arabic: 'كَيْفَ', english: 'how', transliteration: 'Kayfa' },
    { arabic: 'فَعَلَ', english: 'dealt', transliteration: "Fa'ala" },
    { arabic: 'رَبُّكَ', english: 'your Lord', transliteration: 'Rabbuka' },
    { arabic: 'بِأَصْحَابِ', english: 'with the companions', transliteration: "Bi'ashab" },
    { arabic: 'الْفِيلِ', english: 'of the elephant', transliteration: 'Al-Fil' },
    { arabic: 'أَلَمْ', english: 'Did He not', transliteration: 'Alam' },
    { arabic: 'يَجْعَلْ', english: 'make', transliteration: "Yaj'al" },
    { arabic: 'كَيْدَهُمْ', english: 'their plan', transliteration: 'Kaydahum' },
    { arabic: 'تَضْلِيلٍ', english: 'into misguidance', transliteration: 'Tadlil' },
    { arabic: 'أَبَابِيلَ', english: 'in flocks', transliteration: 'Ababil' },
  ],
  106: [ // Quraysh
    { arabic: 'لِإِيلَافِ', english: 'For the accustomed', transliteration: "Li'ilaf" },
    { arabic: 'قُرَيْشٍ', english: 'security of Quraysh', transliteration: 'Quraysh' },
    { arabic: 'إِيلَافِهِمْ', english: 'Their accustomed', transliteration: 'Ilafihim' },
    { arabic: 'رِحْلَةَ', english: 'journey', transliteration: 'Rihlat' },
    { arabic: 'الشِّتَاءِ', english: 'winter', transliteration: 'Ash-Shita' },
    { arabic: 'وَالصَّيْفِ', english: 'and summer', transliteration: 'Was-Sayf' },
    { arabic: 'فَلْيَعْبُدُوا', english: 'Let them worship', transliteration: "Falya'budu" },
    { arabic: 'هَٰذَا', english: 'this', transliteration: 'Hadha' },
    { arabic: 'الْبَيْتِ', english: 'House', transliteration: 'Al-Bayt' },
    { arabic: 'أَطْعَمَهُم', english: 'Who has fed them', transliteration: "At'amahum" },
    { arabic: 'جُوعٍ', english: 'hunger', transliteration: "Ju'" },
    { arabic: 'وَآمَنَهُم', english: 'and made them safe', transliteration: "Wa'amanahum" },
  ],
  107: [ // Al-Ma'un
    { arabic: 'أَرَأَيْتَ', english: 'Have you seen', transliteration: "Ara'ayta" },
    { arabic: 'يُكَذِّبُ', english: 'denies', transliteration: 'Yukadhdhibu' },
    { arabic: 'الدِّينِ', english: 'the Recompense', transliteration: 'Ad-Din' },
    { arabic: 'فَذَٰلِكَ', english: 'For that is', transliteration: 'Fadhalika' },
    { arabic: 'يَدُعُّ', english: 'who drives away', transliteration: "Yadu'u" },
    { arabic: 'الْيَتِيمَ', english: 'the orphan', transliteration: 'Al-Yatim' },
    { arabic: 'وَلَا', english: 'And does not', transliteration: 'Wala' },
    { arabic: 'يَحُضُّ', english: 'encourage', transliteration: 'Yahuddu' },
    { arabic: 'طَعَامِ', english: 'feeding', transliteration: "Ta'am" },
    { arabic: 'الْمِسْكِينِ', english: 'the poor', transliteration: 'Al-Miskin' },
    { arabic: 'سَاهُونَ', english: 'heedless', transliteration: 'Sahun' },
    { arabic: 'الْمَاعُونَ', english: 'small kindnesses', transliteration: "Al-Ma'un" },
  ],
};

// External app recommendations
const EXTERNAL_APPS: ExternalPracticeTip[] = [
  {
    category: 'Pronunciation',
    appName: 'Tarteel AI',
    appUrl: 'https://tarteel.ai',
    task: 'Practice reciting with AI feedback',
    icon: '🎙️'
  },
  {
    category: 'Memorisation',
    appName: 'Quran.com',
    appUrl: 'https://quran.com',
    task: 'Listen to professional reciters',
    icon: '📖'
  },
  {
    category: 'Vocabulary',
    appName: 'Quranic',
    appUrl: 'https://quranic.app',
    task: 'Learn word-by-word meanings',
    icon: '📚'
  }
];

export default function SmartHomeworkPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson');

  const [loading, setLoading] = useState(true);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [session, setSession] = useState<HomeworkSession | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [currentGame, setCurrentGame] = useState<HomeworkGame | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [memorizedSurahCount, setMemorizedSurahCount] = useState(0);
  const [vocabularyPoolSize, setVocabularyPoolSize] = useState(0);
  const [masteredWordsCount, setMasteredWordsCount] = useState(0);
  const [vocabularyMasteryPercent, setVocabularyMasteryPercent] = useState(0);

  // Surah selection state
  const [showSurahSelector, setShowSurahSelector] = useState(true);
  const [availableSurahs, setAvailableSurahs] = useState<number[]>([]);
  const [selectedSurahs, setSelectedSurahs] = useState<number[]>([]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !isPaused && session?.status === 'in_progress') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, isPaused, session?.status]);

  useEffect(() => {
    loadData();
  }, [lessonId]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get learner
      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      const targetLearnerId = learner?.id || user.id;
      setLearnerId(targetLearnerId);

      // Load knowledge gaps
      const { data: gaps } = await supabase
        .from('knowledge_gaps')
        .select('*')
        .eq('learner_id', targetLearnerId)
        .eq('status', 'active')
        .order('severity', { ascending: false })
        .limit(5);

      if (gaps) {
        setKnowledgeGaps(gaps.map(g => ({
          id: g.id,
          category: g.category,
          subcategory: g.subcategory,
          severity: g.severity,
          confidenceScore: g.confidence_score,
          timesTargeted: g.times_targeted
        })));
      }

      // CUMULATIVE VOCABULARY: Fetch ALL memorized surahs
      const { data: memorizedSurahs } = await supabase
        .from('surah_retention_tracker')
        .select('surah_number')
        .eq('learner_id', targetLearnerId)
        .eq('memorization_status', 'memorized');

      // Build list of available surahs (that have vocabulary)
      const surahsWithVocab = memorizedSurahs
        ?.filter(s => SURAH_VOCABULARY[s.surah_number])
        .map(s => s.surah_number) || [];

      // Add default surahs if none memorized
      if (surahsWithVocab.length === 0) {
        surahsWithVocab.push(1, 112, 113, 114); // Fatihah and last 3 surahs
      }

      setAvailableSurahs(surahsWithVocab);
      setSelectedSurahs(surahsWithVocab); // Select all by default

      // Build cumulative vocabulary pool from all memorized surahs
      let vocabularyPool: VocabularyWord[] = [];

      if (memorizedSurahs && memorizedSurahs.length > 0) {
        setMemorizedSurahCount(memorizedSurahs.length);

        memorizedSurahs.forEach(({ surah_number }) => {
          const surahVocab = SURAH_VOCABULARY[surah_number];
          if (surahVocab) {
            vocabularyPool = vocabularyPool.concat(
              surahVocab.map(word => ({ ...word, surah: surah_number }))
            );
          }
        });
      } else {
        // Default to Al-Fatihah if no surahs tracked yet
        vocabularyPool = SURAH_VOCABULARY[1]?.map(word => ({ ...word, surah: 1 })) || [];
        setMemorizedSurahCount(1);
      }

      setVocabularyPoolSize(vocabularyPool.length);

      // Load mastered words from localStorage
      const masteredWordsKey = `vocab_mastered_${targetLearnerId}`;
      const masteredWords = JSON.parse(localStorage.getItem(masteredWordsKey) || '{}');
      const masteredCount = Object.keys(masteredWords).filter(key => masteredWords[key] === true).length;
      setMasteredWordsCount(masteredCount);

      // Calculate mastery percentage (only count words that are in current vocabulary pool)
      if (vocabularyPool.length > 0) {
        // Only count mastered words that exist in current vocabulary pool
        const poolWords = new Set(vocabularyPool.map(w => w.arabic));
        const relevantMasteredCount = Object.keys(masteredWords)
          .filter(key => masteredWords[key] === true && poolWords.has(key))
          .length;
        const masteryPercent = Math.min(100, Math.round((relevantMasteredCount / vocabularyPool.length) * 100));
        setVocabularyMasteryPercent(masteryPercent);
        setMasteredWordsCount(relevantMasteredCount);
      }

      // Check for existing session or create new one
      const today = new Date().toISOString().split('T')[0];
      const { data: existingSession } = await supabase
        .from('homework_sessions')
        .select('*')
        .eq('learner_id', targetLearnerId)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession && existingSession.status !== 'completed') {
        // Resume existing session - skip surah selector
        setShowSurahSelector(false);
        setSession({
          id: existingSession.id,
          sessionType: existingSession.session_type,
          games: existingSession.games || [],
          currentGameIndex: existingSession.current_game_index,
          totalScore: existingSession.total_score,
          maxPossibleScore: existingSession.max_possible_score,
          accuracyPercentage: existingSession.accuracy_percentage || 0,
          status: existingSession.status,
          startedAt: existingSession.started_at,
          completedAt: existingSession.completed_at,
          timeSpentSeconds: existingSession.time_spent_seconds,
          externalPracticeTips: existingSession.external_practice_tips || EXTERNAL_APPS
        });
        if (existingSession.games?.length > 0) {
          setCurrentGame(existingSession.games[existingSession.current_game_index]);
        }
      }
      // If no existing session, keep showSurahSelector=true so user can select surahs first
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Start homework with selected surahs
  async function startWithSelectedSurahs() {
    if (!learnerId || selectedSurahs.length === 0) return;

    // Build vocabulary pool from selected surahs only
    let vocabularyPool: VocabularyWord[] = [];
    selectedSurahs.forEach(surahNum => {
      const surahVocab = SURAH_VOCABULARY[surahNum];
      if (surahVocab) {
        vocabularyPool = vocabularyPool.concat(
          surahVocab.map(word => ({ ...word, surah: surahNum }))
        );
      }
    });

    setVocabularyPoolSize(vocabularyPool.length);
    setShowSurahSelector(false);
    await generateHomework(learnerId, knowledgeGaps, vocabularyPool, selectedSurahs);
  }

  async function generateHomework(learnerId: string, gaps: any[], vocabularyPool: VocabularyWord[], surahNumbers: number[] = []) {
    // Shuffle and select words from the cumulative vocabulary pool
    const shuffledVocab = [...vocabularyPool].sort(() => Math.random() - 0.5);

    // Select words for different games
    const matchingWords = shuffledVocab.slice(0, Math.min(6, shuffledVocab.length));
    const flashcardWords = shuffledVocab.slice(0, Math.min(10, shuffledVocab.length));
    const arabicToEnglishWords = shuffledVocab.slice(0, Math.min(5, shuffledVocab.length));
    const englishToArabicWords = shuffledVocab.slice(5, Math.min(10, shuffledVocab.length));
    const transliterationWords = shuffledVocab.slice(0, Math.min(5, shuffledVocab.length));

    // Generate surah theme questions from selected surahs
    const surahThemeQuestions = generateSurahThemeQuiz(surahNumbers);

    const games: HomeworkGame[] = [
      {
        type: 'matching',
        title: 'Word Matching',
        description: `Match Arabic words with English meanings`,
        questions: matchingWords,
        targetGaps: gaps.filter(g => g.category === 'vocabulary').map(g => g.id),
        completed: false,
        score: 0,
        maxScore: matchingWords.length
      },
      {
        type: 'multiple_choice',
        title: 'Arabic → English',
        description: 'What does this Arabic word mean?',
        questions: generateMultipleChoice(arabicToEnglishWords, shuffledVocab),
        targetGaps: gaps.filter(g => g.category === 'vocabulary').map(g => g.id),
        completed: false,
        score: 0,
        maxScore: arabicToEnglishWords.length
      },
      {
        type: 'english_to_arabic',
        title: 'English → Arabic',
        description: 'Select the correct Arabic word',
        questions: generateEnglishToArabicQuiz(englishToArabicWords.length > 0 ? englishToArabicWords : arabicToEnglishWords, shuffledVocab),
        targetGaps: gaps.filter(g => g.category === 'vocabulary').map(g => g.id),
        completed: false,
        score: 0,
        maxScore: (englishToArabicWords.length > 0 ? englishToArabicWords : arabicToEnglishWords).length
      },
      {
        type: 'transliteration',
        title: 'Pronunciation Practice',
        description: 'Match the transliteration to the Arabic',
        questions: generateTransliterationQuiz(transliterationWords, shuffledVocab),
        targetGaps: gaps.filter(g => g.category === 'pronunciation').map(g => g.id),
        completed: false,
        score: 0,
        maxScore: transliterationWords.length
      },
    ];

    // Add surah themes exam if we have questions
    if (surahThemeQuestions.length > 0) {
      games.push({
        type: 'surah_themes',
        title: 'Surah Themes Exam',
        description: 'Test your understanding of what each Surah is about',
        questions: surahThemeQuestions,
        targetGaps: [],
        completed: false,
        score: 0,
        maxScore: surahThemeQuestions.length
      });
    }

    // Add flashcard review at the end
    games.push({
      type: 'flashcard',
      title: 'Vocabulary Review',
      description: 'Review all vocabulary with flashcards',
      questions: flashcardWords,
      targetGaps: gaps.filter(g => g.category === 'vocabulary').map(g => g.id),
      completed: false,
      score: 0,
      maxScore: flashcardWords.length
    });

    // Only include lesson_id if it exists
    const insertData: Record<string, unknown> = {
      learner_id: learnerId,
      session_type: 'adaptive',
      games,
      current_game_index: 0,
      total_games: games.length,
      games_completed: 0,
      total_score: 0,
      max_possible_score: games.reduce((sum, g) => sum + g.maxScore, 0),
      weak_areas_targeted: gaps.map(g => g.id),
      external_practice_tips: EXTERNAL_APPS,
      status: 'pending'
    };
    if (lessonId) {
      insertData.lesson_id = lessonId;
    }

    // Try to save session to database (may fail due to RLS for student accounts)
    let sessionId = crypto.randomUUID();

    const { data: newSession, error } = await supabase
      .from('homework_sessions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.warn('Could not save homework session to database (running locally):', error.message);
      // Continue with local session - games still work without persistence
    } else if (newSession) {
      sessionId = newSession.id;
    }

    // Set up session (works with or without database persistence)
    setSession({
      id: sessionId,
      sessionType: 'adaptive',
      games,
      currentGameIndex: 0,
      totalScore: 0,
      maxPossibleScore: games.reduce((sum, g) => sum + g.maxScore, 0),
      accuracyPercentage: 0,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      timeSpentSeconds: 0,
      externalPracticeTips: EXTERNAL_APPS
    });
    setCurrentGame(games[0]);
  }

  function generateMultipleChoice(vocabulary: VocabularyWord[], fullPool: VocabularyWord[]) {
    return vocabulary.map((word) => {
      // Get wrong answers from the full vocabulary pool
      const otherWords = fullPool.filter(w => w.english !== word.english);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.english);

      const options = [word.english, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        question: `What does "${word.arabic}" mean?`,
        arabic: word.arabic,
        correctAnswer: word.english,
        options,
        surah: word.surah
      };
    });
  }

  function generateEnglishToArabicQuiz(vocabulary: VocabularyWord[], fullPool: VocabularyWord[]) {
    return vocabulary.map((word) => {
      // Get wrong Arabic answers from the full vocabulary pool
      const otherWords = fullPool.filter(w => w.arabic !== word.arabic);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.arabic);

      const options = [word.arabic, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        question: `Which Arabic word means "${word.english}"?`,
        english: word.english,
        correctAnswer: word.arabic,
        options,
        surah: word.surah
      };
    });
  }

  function generateTransliterationQuiz(vocabulary: VocabularyWord[], fullPool: VocabularyWord[]) {
    return vocabulary.map((word) => {
      // Get wrong transliterations from the full vocabulary pool
      const otherWords = fullPool.filter(w => w.transliteration !== word.transliteration);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.transliteration);

      const options = [word.transliteration, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        question: `How is "${word.arabic}" pronounced?`,
        arabic: word.arabic,
        english: word.english,
        correctAnswer: word.transliteration,
        options,
        surah: word.surah
      };
    });
  }

  function generateSurahThemeQuiz(surahNumbers: number[]) {
    const questions: any[] = [];
    const allSurahInfos = Object.values(SURAH_THEMES);

    surahNumbers.forEach(surahNum => {
      const surahInfo = SURAH_THEMES[surahNum];
      if (!surahInfo) return;

      // Question 1: What is this Surah about?
      const otherThemes = allSurahInfos
        .filter(s => s.number !== surahNum)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(s => s.theme.split(' - ')[1] || s.theme);

      const correctTheme = surahInfo.theme.split(' - ')[1] || surahInfo.theme;
      const themeOptions = [correctTheme, ...otherThemes].sort(() => Math.random() - 0.5);

      questions.push({
        question: `What is Surah ${surahInfo.name} (${surahInfo.arabicName}) about?`,
        surahName: surahInfo.name,
        arabicName: surahInfo.arabicName,
        correctAnswer: correctTheme,
        options: themeOptions,
        surah: surahNum
      });

      // Question 2: Key topic identification (if surah has key topics)
      if (surahInfo.keyTopics.length > 0) {
        const correctTopic = surahInfo.keyTopics[Math.floor(Math.random() * surahInfo.keyTopics.length)];
        const otherTopics = allSurahInfos
          .filter(s => s.number !== surahNum)
          .flatMap(s => s.keyTopics)
          .filter(t => !surahInfo.keyTopics.includes(t))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        if (otherTopics.length >= 3) {
          const topicOptions = [correctTopic, ...otherTopics].sort(() => Math.random() - 0.5);

          questions.push({
            question: `Which topic is discussed in Surah ${surahInfo.name}?`,
            surahName: surahInfo.name,
            arabicName: surahInfo.arabicName,
            correctAnswer: correctTopic,
            options: topicOptions,
            surah: surahNum
          });
        }
      }

      // Question 3: Verse count (occasionally)
      if (Math.random() > 0.5) {
        const otherCounts = [3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 40]
          .filter(c => c !== surahInfo.verseCount)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const countOptions = [surahInfo.verseCount.toString(), ...otherCounts.map(c => c.toString())].sort(() => Math.random() - 0.5);

        questions.push({
          question: `How many verses are in Surah ${surahInfo.name}?`,
          surahName: surahInfo.name,
          arabicName: surahInfo.arabicName,
          correctAnswer: surahInfo.verseCount.toString(),
          options: countOptions,
          surah: surahNum
        });
      }
    });

    // Shuffle and limit questions
    return questions.sort(() => Math.random() - 0.5).slice(0, 10);
  }

  async function startSession() {
    if (!session) return;

    setGameStarted(true);
    const now = new Date().toISOString();

    await supabase
      .from('homework_sessions')
      .update({
        status: 'in_progress',
        started_at: now
      })
      .eq('id', session.id);

    setSession({
      ...session,
      status: 'in_progress',
      startedAt: now
    });
  }

  async function handleGameComplete(score: number, maxScore: number) {
    if (!session || !currentGame) return;

    const updatedGames = session.games.map((g, i) =>
      i === session.currentGameIndex
        ? { ...g, completed: true, score }
        : g
    );

    const newTotalScore = session.totalScore + score;
    const nextIndex = session.currentGameIndex + 1;
    const isComplete = nextIndex >= session.games.length;

    const updateData: any = {
      games: updatedGames,
      current_game_index: nextIndex,
      games_completed: nextIndex,
      total_score: newTotalScore,
      time_spent_seconds: timer
    };

    if (isComplete) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      updateData.accuracy_percentage = Math.round((newTotalScore / session.maxPossibleScore) * 100);
    }

    await supabase
      .from('homework_sessions')
      .update(updateData)
      .eq('id', session.id);

    setSession({
      ...session,
      games: updatedGames,
      currentGameIndex: nextIndex,
      totalScore: newTotalScore,
      status: isComplete ? 'completed' : 'in_progress',
      completedAt: isComplete ? new Date().toISOString() : null,
      accuracyPercentage: isComplete ? Math.round((newTotalScore / session.maxPossibleScore) * 100) : session.accuracyPercentage,
      timeSpentSeconds: timer
    });

    if (!isComplete) {
      setCurrentGame(updatedGames[nextIndex]);
    } else {
      setCurrentGame(null);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Save mastered words to localStorage
  function saveMasteredWords(words: VocabularyWord[]) {
    if (!learnerId) return;
    const masteredWordsKey = `vocab_mastered_${learnerId}`;
    const existingMastered = JSON.parse(localStorage.getItem(masteredWordsKey) || '{}');

    words.forEach(word => {
      const wordKey = `${word.arabic}_${word.english}`;
      existingMastered[wordKey] = true;
    });

    localStorage.setItem(masteredWordsKey, JSON.stringify(existingMastered));

    // Update state
    const masteredCount = Object.keys(existingMastered).filter(key => existingMastered[key] === true).length;
    setMasteredWordsCount(masteredCount);
    if (vocabularyPoolSize > 0) {
      setVocabularyMasteryPercent(Math.round((masteredCount / vocabularyPoolSize) * 100));
    }
  }

  const progressPercent = session
    ? Math.round((session.currentGameIndex / session.games.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Vocabulary Builder
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Strengthen your Quranic vocabulary
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                  {memorizedSurahCount} Surah{memorizedSurahCount > 1 ? 's' : ''}
                </span>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
                  {vocabularyPoolSize} words
                </span>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {masteredWordsCount} mastered ({vocabularyMasteryPercent}%)
                </span>
              </div>
            </div>
            {gameStarted && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-mono text-xl text-gray-900 dark:text-white">{formatTime(timer)}</span>
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  {isPaused ? <Play className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Pause className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {session && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span>{session.currentGameIndex}/{session.games.length} games</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Surah Selection */}
        {showSurahSelector && !session && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Choose Surahs to Practice
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select Surahs to build vocabulary and test comprehension
                </p>
              </div>
            </div>

            {availableSurahs.length > 0 ? (
              <>
                {/* Selection count badge */}
                <div className="flex items-center justify-between mb-4 mt-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedSurahs.length} of {availableSurahs.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSurahs(availableSurahs)}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedSurahs([])}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Surah Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                  {availableSurahs.map(surahNum => {
                    const surahName = SURAH_NAMES[surahNum];
                    const isSelected = selectedSurahs.includes(surahNum);
                    return (
                      <button
                        key={surahNum}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSurahs(selectedSurahs.filter(s => s !== surahNum));
                          } else {
                            setSelectedSurahs([...selectedSurahs, surahNum]);
                          }
                        }}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-500 shadow-md transform scale-[1.02]'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:shadow-md hover:scale-[1.02]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <span className="text-3xl font-arabic leading-none" dir="rtl">{surahName?.arabicName || ''}</span>
                        <div className="text-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{surahNum}.</span>
                          <span className={`text-sm font-medium ml-1 ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                            {surahName?.name || `Surah ${surahNum}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Start Button */}
                <button
                  onClick={startWithSelectedSurahs}
                  disabled={selectedSurahs.length === 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                    selectedSurahs.length > 0
                      ? 'bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Zap className={`w-6 h-6 ${selectedSurahs.length > 0 ? 'animate-pulse' : ''}`} />
                  <span>Start Vocabulary Exam</span>
                  {selectedSurahs.length > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                      {selectedSurahs.length} Surah{selectedSurahs.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Surahs Available</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Mark some Surahs as memorized to practice their vocabulary and test your understanding.
                </p>
                <button
                  onClick={() => navigate('/my-memorization')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
                >
                  Go to My Memorisation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vocabulary Mastery Progress Card */}
        {!showSurahSelector && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Vocabulary Mastery</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {masteredWordsCount} of {vocabularyPoolSize} words learned
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{vocabularyMasteryPercent}%</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">complete</p>
            </div>
          </div>
          <div className="h-4 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${vocabularyMasteryPercent}%` }}
            />
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            Goal: Learn 100% of vocabulary from your {selectedSurahs.length} selected Surah{selectedSurahs.length !== 1 ? 's' : ''}
          </p>
        </div>
        )}

        {/* Cumulative info banner */}
        {!showSurahSelector && session?.status === 'pending' && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Cumulative Vocabulary</h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  As you memorise more Surahs, your homework variety automatically increases!
                  Words are pulled from <strong>all</strong> your memorised Surahs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Not started state */}
        {session?.status === 'pending' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Practice?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              We've prepared {session.games.length} activities using vocabulary from your {memorizedSurahCount} memorized Surah{memorizedSurahCount > 1 ? 's' : ''}.
            </p>

            {/* Games preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {session.games.map((game, index) => (
                <div key={index} className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    {game.type === 'matching' && <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                    {game.type === 'flashcard' && <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                    {game.type === 'multiple_choice' && <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                    <span className="font-medium text-purple-900 dark:text-purple-100">{game.title}</span>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{game.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={startSession}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center gap-2 mx-auto"
            >
              <Zap className="w-5 h-5" />
              Start Homework
            </button>
          </div>
        )}

        {/* Game in progress */}
        {session?.status === 'in_progress' && currentGame && !isPaused && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentGame.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">{currentGame.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Game {session.currentGameIndex + 1} of {session.games.length}</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">+{currentGame.maxScore} points</p>
              </div>
            </div>

            {/* Render game based on type */}
            {currentGame.type === 'matching' && (
              <WordMatchingQuiz
                words={currentGame.questions}
                lessonId={lessonId || 'homework'}
                onComplete={(score, total) => handleGameComplete(score, currentGame.maxScore)}
              />
            )}

            {currentGame.type === 'flashcard' && (
              <FlashcardGame
                vocabulary={currentGame.questions}
                onComplete={(score) => handleGameComplete(score, currentGame.maxScore)}
                onMasteredWords={saveMasteredWords}
              />
            )}

            {currentGame.type === 'multiple_choice' && (
              <MultipleChoiceGame
                questions={currentGame.questions}
                onComplete={(score) => handleGameComplete(score, currentGame.maxScore)}
                onMasteredWords={saveMasteredWords}
              />
            )}

            {currentGame.type === 'english_to_arabic' && (
              <MultipleChoiceGame
                questions={currentGame.questions}
                onComplete={(score) => handleGameComplete(score, currentGame.maxScore)}
                onMasteredWords={saveMasteredWords}
                isArabicOptions={true}
              />
            )}

            {currentGame.type === 'transliteration' && (
              <MultipleChoiceGame
                questions={currentGame.questions}
                onComplete={(score) => handleGameComplete(score, currentGame.maxScore)}
                onMasteredWords={saveMasteredWords}
              />
            )}

            {currentGame.type === 'surah_themes' && (
              <MultipleChoiceGame
                questions={currentGame.questions}
                onComplete={(score) => handleGameComplete(score, currentGame.maxScore)}
              />
            )}
          </div>
        )}

        {/* Paused state */}
        {isPaused && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Pause className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Paused</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Take your time! Click resume when you're ready.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              Resume
            </button>
          </div>
        )}

        {/* Completed state */}
        {session?.status === 'completed' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-2xl p-8 text-center">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">Homework Complete!</h2>
              <p className="text-yellow-700 dark:text-yellow-300 mb-6">
                Great work! You've practiced vocabulary from {memorizedSurahCount} Surah{memorizedSurahCount > 1 ? 's' : ''}.
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{session.totalScore}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{session.accuracyPercentage}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatTime(timer)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
              >
                Back to Dashboard
              </button>
            </div>

            {/* External practice recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Continue Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                These apps can help you practice more:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXTERNAL_APPS.map((app, index) => (
                  <a
                    key={index}
                    href={app.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{app.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {app.appName}
                      </span>
                      <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{app.task}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Flashcard Game Component
function FlashcardGame({
  vocabulary,
  onComplete,
  onMasteredWords
}: {
  vocabulary: VocabularyWord[];
  onComplete: (score: number) => void;
  onMasteredWords?: (words: VocabularyWord[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scores, setScores] = useState<boolean[]>([]);
  const [masteredInSession, setMasteredInSession] = useState<VocabularyWord[]>([]);

  const currentWord = vocabulary[currentIndex];
  const isComplete = currentIndex >= vocabulary.length;

  function handleKnew(knew: boolean) {
    const newScores = [...scores, knew];
    setScores(newScores);
    setFlipped(false);

    // Trigger confetti on correct answer
    if (knew) {
      triggerConfetti('small');

      // Count consecutive correct answers
      const consecutiveCorrect = newScores.slice().reverse().findIndex(s => !s);
      const streak = consecutiveCorrect === -1 ? newScores.length : consecutiveCorrect;

      // Extra celebration for streaks
      if (streak >= 3 && streak % 3 === 0) {
        setTimeout(() => triggerStreakConfetti(), 300);
      }
    }

    // Track mastered words
    let newMastered = masteredInSession;
    if (knew && currentWord) {
      newMastered = [...masteredInSession, currentWord];
      setMasteredInSession(newMastered);
    }

    if (currentIndex + 1 >= vocabulary.length) {
      const finalScore = newScores.filter(Boolean).length;
      if (onMasteredWords && newMastered.length > 0) {
        onMasteredWords(newMastered);
      }
      onComplete(finalScore);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  if (isComplete) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Card {currentIndex + 1} of {vocabulary.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {vocabulary.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < currentIndex
                    ? scores[i]
                      ? 'bg-emerald-500'
                      : 'bg-red-400'
                    : i === currentIndex
                    ? 'bg-purple-500 w-4'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="relative h-72 cursor-pointer group"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front - Arabic */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-2xl p-8 flex flex-col items-center justify-center text-white shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute inset-0 bg-white/5 rounded-2xl" />
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white/70" />
            </div>
            <p className="text-6xl font-arabic mb-6 drop-shadow-lg" dir="rtl">{currentWord.arabic}</p>
            <p className="text-lg text-purple-200 font-medium">{currentWord.transliteration}</p>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-purple-200/70 text-sm flex items-center justify-center gap-2">
                <span className="inline-block w-8 h-0.5 bg-purple-300/50 rounded"></span>
                Tap to reveal
                <span className="inline-block w-8 h-0.5 bg-purple-300/50 rounded"></span>
              </p>
            </div>
          </div>

          {/* Back - English */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-8 flex flex-col items-center justify-center text-white shadow-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute inset-0 bg-white/5 rounded-2xl" />
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white/70" />
            </div>
            <p className="text-4xl font-bold mb-4 drop-shadow-lg text-center">{currentWord.english}</p>
            <div className="px-4 py-2 bg-white/10 rounded-full">
              <p className="text-emerald-100 text-lg">{currentWord.transliteration}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Buttons */}
      <div className={`flex justify-center gap-4 transition-all duration-300 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <button
          onClick={() => handleKnew(false)}
          className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3"
        >
          <XCircle className="w-6 h-6" />
          Didn't Know
        </button>
        <button
          onClick={() => handleKnew(true)}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3"
        >
          <CheckCircle className="w-6 h-6" />
          Knew It!
        </button>
      </div>
    </div>
  );
}

// Multiple Choice Game Component
function MultipleChoiceGame({
  questions,
  onComplete,
  onMasteredWords,
  isArabicOptions = false
}: {
  questions: any[];
  onComplete: (score: number) => void;
  onMasteredWords?: (words: VocabularyWord[]) => void;
  isArabicOptions?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [masteredInSession, setMasteredInSession] = useState<VocabularyWord[]>([]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  function handleAnswer(answer: string) {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === currentQuestion.correctAnswer) {
      const newScore = score + 1;
      setScore(newScore);

      // Trigger confetti on correct answer
      triggerConfetti('small');

      // Extra celebration for streaks (3+ in a row)
      if (newScore >= 3 && newScore === currentIndex + 1) {
        setTimeout(() => triggerStreakConfetti(), 300);
      }

      // Track mastered word
      const masteredWord: VocabularyWord = {
        arabic: currentQuestion.arabic || currentQuestion.correctAnswer,
        english: currentQuestion.english || currentQuestion.correctAnswer,
        transliteration: '',
        surah: currentQuestion.surah
      };
      setMasteredInSession(prev => [...prev, masteredWord]);
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      const finalScore = score + (isCorrect ? 1 : 0);
      if (onMasteredWords && masteredInSession.length > 0) {
        onMasteredWords(masteredInSession);
      }
      onComplete(finalScore);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>Score: {score}/{currentIndex}</span>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6">
        {currentQuestion.arabic && (
          <p className="text-4xl font-arabic text-center mb-4" dir="rtl">
            {currentQuestion.arabic}
          </p>
        )}
        <p className="text-center text-gray-700 dark:text-gray-300 text-lg">{currentQuestion.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.options.map((option: string, index: number) => {
          let buttonClass = 'p-4 rounded-xl border-2 transition font-medium ';
          buttonClass += isArabicOptions ? 'text-center text-2xl font-arabic ' : 'text-left ';

          if (showResult) {
            if (option === currentQuestion.correctAnswer) {
              buttonClass += 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-200';
            } else if (option === selectedAnswer) {
              buttonClass += 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200';
            } else {
              buttonClass += 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500';
            }
          } else {
            buttonClass += 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-900 dark:text-white';
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={buttonClass}
              dir={isArabicOptions ? 'rtl' : 'ltr'}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="flex justify-center">
          <button
            onClick={nextQuestion}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition flex items-center gap-2"
          >
            {currentIndex + 1 >= questions.length ? 'Finish' : 'Next Question'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
