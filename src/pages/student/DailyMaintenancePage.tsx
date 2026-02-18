import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  CheckCircle,
  Trophy,
  Calendar,
  ChevronRight,
  ChevronDown,
  Headphones,
  Target,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Eye,
  RefreshCw,
  Brain,
  Lock,
  Mic
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DashboardHeader from '../../components/DashboardHeader';
import { getFirstWordsForAyahs, getChapterInfo, FirstWordData } from '../../utils/quranApi';
import { useSelfLearner } from '../../hooks/useSelfLearner';
import WordMatchingQuiz from '../../components/WordMatchingQuiz';
import { SURAH_VOCABULARY, SURAH_THEMES } from './SmartHomeworkPage';
import { buildPassageList, PassageUnit } from '../../lib/quranPassages';
import { SURAH_AYAH_COUNTS as FULL_SURAH_AYAH_COUNTS } from '../../lib/quranData';

interface SelfAssessment {
  smooth: boolean;
  weakMemorisation: boolean;
  weakFluency: boolean;
  weakUnderstanding: boolean;
}

interface SurahReview {
  surah: number;
  surahName: string;
  surahNameArabic: string;
  startAyah?: number;
  endAyah?: number;
  passageLabel?: string;
  listenCount: number;
  reciteCount: number;
  selfAssessment: SelfAssessment | null;
  memorisationPracticeDone: boolean;
  fluencyPracticeDone: boolean;
  understandingPracticeDone: boolean;
  quality: number;
}

function isPassageComplete(p: SurahReview): boolean {
  return p.listenCount >= 3 && p.reciteCount >= 3 && p.selfAssessment !== null;
}

function hasWeakAreas(p: SurahReview): boolean {
  if (!p.selfAssessment) return false;
  return p.selfAssessment.weakMemorisation || p.selfAssessment.weakFluency || p.selfAssessment.weakUnderstanding;
}

interface DailySession {
  id: string;
  sessionDate: string;
  surahsReviewed: SurahReview[];
  tasksCompleted: number;
  totalTasks: number;
  status: 'in_progress' | 'completed' | 'partial';
  completedAt: string | null;
}

interface LearnerStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  lastMaintenanceDate: string | null;
}

// First ayah (opening words) of each surah for the First Word Prompter - All 114 Surahs
const SURAH_FIRST_WORDS: { [key: number]: { arabic: string; transliteration: string; translation: string } } = {
  1: { arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Bismillahir Rahmanir Raheem', translation: 'In the name of Allah, the Most Gracious, the Most Merciful' },
  2: { arabic: 'الم', transliteration: 'Alif Laam Meem', translation: 'Alif Laam Meem' },
  3: { arabic: 'الم', transliteration: 'Alif Laam Meem', translation: 'Alif Laam Meem' },
  4: { arabic: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ', transliteration: 'Yaa ayyuhan naasut taqoo rabbakum', translation: 'O mankind, fear your Lord' },
  5: { arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ', transliteration: 'Yaa ayyuhal ladheena aamanoo awfoo bil-uqood', translation: 'O you who have believed, fulfill [all] contracts' },
  6: { arabic: 'الْحَمْدُ لِلَّهِ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ', transliteration: 'Alhamdu lillahil ladhee khalaqas samaawaati wal-ard', translation: 'Praise be to Allah, who created the heavens and the earth' },
  7: { arabic: 'المص', transliteration: 'Alif Laam Meem Saad', translation: 'Alif Laam Meem Saad' },
  8: { arabic: 'يَسْأَلُونَكَ عَنِ الْأَنفَالِ', transliteration: "Yas'aloonaka 'anil anfaal", translation: 'They ask you about the bounties [of war]' },
  9: { arabic: 'بَرَاءَةٌ مِّنَ اللَّهِ وَرَسُولِهِ', transliteration: "Baraa'atum minallaahi wa rasoolih", translation: '[This is a declaration of] disassociation from Allah and His Messenger' },
  10: { arabic: 'الر', transliteration: 'Alif Laam Raa', translation: 'Alif Laam Raa' },
  11: { arabic: 'الر', transliteration: 'Alif Laam Raa', translation: 'Alif Laam Raa' },
  12: { arabic: 'الر', transliteration: 'Alif Laam Raa', translation: 'Alif Laam Raa' },
  13: { arabic: 'المر', transliteration: 'Alif Laam Meem Raa', translation: 'Alif Laam Meem Raa' },
  14: { arabic: 'الر', transliteration: 'Alif Laam Raa', translation: 'Alif Laam Raa' },
  15: { arabic: 'الر', transliteration: 'Alif Laam Raa', translation: 'Alif Laam Raa' },
  16: { arabic: 'أَتَىٰ أَمْرُ اللَّهِ فَلَا تَسْتَعْجِلُوهُ', transliteration: 'Ataa amrullaahi falaa tastajiloohu', translation: 'The command of Allah is coming, so be not impatient for it' },
  17: { arabic: 'سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا', transliteration: "Subhaanal ladhee asraa bi'abdihee layla", translation: 'Exalted is He who took His Servant by night' },
  18: { arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ', transliteration: "Alhamdu lillaahil ladheee anzala 'alaa 'abdihil kitaab", translation: 'Praise be to Allah, who has sent down upon His Servant the Book' },
  19: { arabic: 'كهيعص', transliteration: 'Kaaf Haa Yaa Ayn Saad', translation: 'Kaaf Haa Yaa Ayn Saad' },
  20: { arabic: 'طه', transliteration: 'Taa Haa', translation: 'Taa Haa' },
  21: { arabic: 'اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ', transliteration: 'Iqtaraba linnaasi hisaabuhum', translation: 'Drawn near for mankind is their account' },
  22: { arabic: 'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمْ', transliteration: 'Yaa ayyuhan naasut taqoo rabbakum', translation: 'O mankind, fear your Lord' },
  23: { arabic: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ', transliteration: "Qad aflahal mu'minoon", translation: 'Certainly will the believers have succeeded' },
  24: { arabic: 'سُورَةٌ أَنزَلْنَاهَا وَفَرَضْنَاهَا', transliteration: 'Sooratun anzalnaahaa wa faradnaahaa', translation: '[This is] a surah which We have sent down and made obligatory' },
  25: { arabic: 'تَبَارَكَ الَّذِي نَزَّلَ الْفُرْقَانَ عَلَىٰ عَبْدِهِ', transliteration: "Tabaarakal ladhee nazzalal furqaana 'alaa 'abdih", translation: 'Blessed is He who sent down the Criterion upon His Servant' },
  26: { arabic: 'طسم', transliteration: 'Taa Seen Meem', translation: 'Taa Seen Meem' },
  27: { arabic: 'طس', transliteration: 'Taa Seen', translation: 'Taa Seen' },
  28: { arabic: 'طسم', transliteration: 'Taa Seen Meem', translation: 'Taa Seen Meem' },
  29: { arabic: 'الم', transliteration: 'Alif Laam Meem', translation: 'Alif Laam Meem' },
  30: { arabic: 'الم', transliteration: 'Alif Laam Meem', translation: 'Alif Laam Meem' },
  31: { arabic: 'الم', transliteration: 'Alif Laam Meem', translation: 'Alif Laam Meem' },
  32: { arabic: 'الم', transliteration: 'Alif Laam Meem', translation: 'Alif Laam Meem' },
  33: { arabic: 'يَا أَيُّهَا النَّبِيُّ اتَّقِ اللَّهَ', transliteration: 'Yaa ayyuhan nabiyyut taqillaah', translation: 'O Prophet, fear Allah' },
  34: { arabic: 'الْحَمْدُ لِلَّهِ الَّذِي لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', transliteration: 'Alhamdu lillaahil ladhee lahoo maa fis samaawaati wa maa fil ard', translation: 'Praise be to Allah, to whom belongs whatever is in the heavens and earth' },
  35: { arabic: 'الْحَمْدُ لِلَّهِ فَاطِرِ السَّمَاوَاتِ وَالْأَرْضِ', transliteration: 'Alhamdu lillaahi faatiris samaawaati wal-ard', translation: 'Praise be to Allah, Creator of the heavens and the earth' },
  36: { arabic: 'يس', transliteration: 'Yaa Seen', translation: 'Yaa Seen' },
  37: { arabic: 'وَالصَّافَّاتِ صَفًّا', transliteration: 'Was-saaffaati saffa', translation: 'By those [angels] lined up in rows' },
  38: { arabic: 'ص وَالْقُرْآنِ ذِي الذِّكْرِ', transliteration: 'Saad wal-Quraani dhidh-dhikr', translation: 'Saad. By the Quran containing reminder' },
  39: { arabic: 'تَنزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْحَكِيمِ', transliteration: 'Tanzeelul kitaabi minallaahil azeezil hakeem', translation: 'The revelation of the Quran is from Allah, the Exalted in Might, the Wise' },
  40: { arabic: 'حم', transliteration: 'Haa Meem', translation: 'Haa Meem' },
  41: { arabic: 'حم', transliteration: 'Haa Meem', translation: 'Haa Meem' },
  42: { arabic: 'حم', transliteration: 'Haa Meem', translation: 'Haa Meem' },
  43: { arabic: 'حم', transliteration: 'Haa Meem', translation: 'Haa Meem' },
  44: { arabic: 'حم', transliteration: 'Haa Meem', translation: 'Haa Meem' },
  45: { arabic: 'حم', transliteration: 'Haa Meem', translation: 'Haa Meem' },
  46: { arabic: 'حم', transliteration: 'Haa Meem', translation: 'Haa Meem' },
  47: { arabic: 'الَّذِينَ كَفَرُوا وَصَدُّوا عَن سَبِيلِ اللَّهِ', transliteration: 'Alladheena kafaroo wa saddoo an sabeelillaah', translation: 'Those who disbelieve and avert [people] from the way of Allah' },
  48: { arabic: 'إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا', transliteration: 'Innaa fatahnaa laka fatham mubeena', translation: 'Indeed, We have given you a clear conquest' },
  49: { arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تُقَدِّمُوا بَيْنَ يَدَيِ اللَّهِ وَرَسُولِهِ', transliteration: 'Yaa ayyuhal ladheena aamanoo laa tuqaddimoo bayna yadayil laahi wa rasoolih', translation: 'O you who have believed, do not put [yourselves] before Allah and His Messenger' },
  50: { arabic: 'ق وَالْقُرْآنِ الْمَجِيدِ', transliteration: 'Qaaf wal-Quraanil majeed', translation: 'Qaaf. By the honored Quran' },
  51: { arabic: 'وَالذَّارِيَاتِ ذَرْوًا', transliteration: 'Wadh-dhaariyaati dharwa', translation: 'By those [winds] scattering [dust]' },
  52: { arabic: 'وَالطُّورِ', transliteration: 'Wat-toor', translation: 'By the mount' },
  53: { arabic: 'وَالنَّجْمِ إِذَا هَوَىٰ', transliteration: 'Wan-najmi idhaa hawaa', translation: 'By the star when it descends' },
  54: { arabic: 'اقْتَرَبَتِ السَّاعَةُ وَانشَقَّ الْقَمَرُ', transliteration: 'Iqtarabatis saa-atu wanshaq-qal qamar', translation: 'The Hour has come near, and the moon has split' },
  55: { arabic: 'الرَّحْمَٰنُ', transliteration: 'Ar-Rahmaan', translation: 'The Most Merciful' },
  56: { arabic: 'إِذَا وَقَعَتِ الْوَاقِعَةُ', transliteration: "Idhaa waqa'atil waaqi'ah", translation: 'When the Occurrence occurs' },
  57: { arabic: 'سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ', transliteration: 'Sabbaha lillaahi maa fis samaawaati wal-ard', translation: 'Whatever is in the heavens and earth exalts Allah' },
  58: { arabic: 'قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي تُجَادِلُكَ فِي زَوْجِهَا', transliteration: "Qad sami'allaahu qawlal latee tujaadiluka fee zawjihaa", translation: 'Certainly has Allah heard the speech of the one who argues with you concerning her husband' },
  59: { arabic: 'سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', transliteration: 'Sabbaha lillaahi maa fis samaawaati wa maa fil ard', translation: 'Whatever is in the heavens and whatever is on the earth exalts Allah' },
  60: { arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَتَّخِذُوا عَدُوِّي وَعَدُوَّكُمْ أَوْلِيَاءَ', transliteration: 'Yaa ayyuhal ladheena aamanoo laa tattakhidhoo aduwwee wa aduwwakum awliyaa', translation: 'O you who have believed, do not take My enemies and your enemies as allies' },
  61: { arabic: 'سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', transliteration: 'Sabbaha lillaahi maa fis samaawaati wa maa fil ard', translation: 'Whatever is in the heavens and whatever is on the earth exalts Allah' },
  62: { arabic: 'يُسَبِّحُ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', transliteration: 'Yusabbihu lillaahi maa fis samaawaati wa maa fil ard', translation: 'Whatever is in the heavens and whatever is on the earth is exalting Allah' },
  63: { arabic: 'إِذَا جَاءَكَ الْمُنَافِقُونَ', transliteration: "Idhaa jaa'akal munaafiqoon", translation: 'When the hypocrites come to you' },
  64: { arabic: 'يُسَبِّحُ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ', transliteration: 'Yusabbihu lillaahi maa fis samaawaati wa maa fil ard', translation: 'Whatever is in the heavens and whatever is on the earth is exalting Allah' },
  65: { arabic: 'يَا أَيُّهَا النَّبِيُّ إِذَا طَلَّقْتُمُ النِّسَاءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ', transliteration: "Yaa ayyuhan nabiyyu idhaa tallaqtumun nisaa'a fatalliqoohunna li'iddatihinn", translation: 'O Prophet, when you [Muslims] divorce women, divorce them for [the commencement of] their waiting period' },
  66: { arabic: 'يَا أَيُّهَا النَّبِيُّ لِمَ تُحَرِّمُ مَا أَحَلَّ اللَّهُ لَكَ', transliteration: 'Yaa ayyuhan nabiyyu lima tuharrimu maa ahallallaahu lak', translation: 'O Prophet, why do you prohibit [yourself from] what Allah has made lawful for you' },
  67: { arabic: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ', transliteration: 'Tabaarakal ladhee biyadihil mulk', translation: 'Blessed is He in whose hand is dominion' },
  68: { arabic: 'ن وَالْقَلَمِ وَمَا يَسْطُرُونَ', transliteration: 'Noon wal-qalami wa maa yasturooon', translation: 'Noon. By the pen and what they inscribe' },
  69: { arabic: 'الْحَاقَّةُ', transliteration: 'Al-Haaqqah', translation: 'The Inevitable Reality' },
  70: { arabic: 'سَأَلَ سَائِلٌ بِعَذَابٍ وَاقِعٍ', transliteration: "Sa'ala saa'ilum bi'adhaabiw waaqi'", translation: 'A supplicant asked for a punishment bound to happen' },
  71: { arabic: 'إِنَّا أَرْسَلْنَا نُوحًا إِلَىٰ قَوْمِهِ', transliteration: 'Innaa arsalnaa Noohan ilaa qawmih', translation: 'Indeed, We sent Noah to his people' },
  72: { arabic: 'قُلْ أُوحِيَ إِلَيَّ أَنَّهُ اسْتَمَعَ نَفَرٌ مِّنَ الْجِنِّ', transliteration: "Qul oohiya ilayya annahus tama'a nafarum minal jinn", translation: 'Say, "It has been revealed to me that a group of the jinn listened"' },
  73: { arabic: 'يَا أَيُّهَا الْمُزَّمِّلُ', transliteration: 'Yaa ayyuhal muzzammil', translation: 'O you who wraps himself [in clothing]' },
  74: { arabic: 'يَا أَيُّهَا الْمُدَّثِّرُ', transliteration: 'Yaa ayyuhal muddaththir', translation: 'O you who covers himself [with a garment]' },
  75: { arabic: 'لَا أُقْسِمُ بِيَوْمِ الْقِيَامَةِ', transliteration: 'Laa uqsimu biyawmil qiyaamah', translation: 'I swear by the Day of Resurrection' },
  76: { arabic: 'هَلْ أَتَىٰ عَلَى الْإِنسَانِ حِينٌ مِّنَ الدَّهْرِ', transliteration: "Hal ataa 'alal insaani heenun minad-dahr", translation: 'Has there [not] come upon man a period of time' },
  77: { arabic: 'وَالْمُرْسَلَاتِ عُرْفًا', transliteration: "Wal-mursalaati 'urfa", translation: 'By those [winds] sent forth in gusts' },
  78: { arabic: 'عَمَّ يَتَسَاءَلُونَ', transliteration: "'Amma yatasaa'aloon", translation: 'About what are they asking one another?' },
  79: { arabic: 'وَالنَّازِعَاتِ غَرْقًا', transliteration: "Wan-naazi'aati gharqa", translation: 'By those [angels] who extract with violence' },
  80: { arabic: 'عَبَسَ وَتَوَلَّىٰ', transliteration: "'Abasa wa tawallaa", translation: 'He frowned and turned away' },
  81: { arabic: 'إِذَا الشَّمْسُ كُوِّرَتْ', transliteration: 'Idhash-shamsu kuwwirat', translation: 'When the sun is wrapped up [in darkness]' },
  82: { arabic: 'إِذَا السَّمَاءُ انفَطَرَتْ', transliteration: 'Idhas-samaa-unfatarat', translation: 'When the sky breaks apart' },
  83: { arabic: 'وَيْلٌ لِّلْمُطَفِّفِينَ', transliteration: 'Waylul-lil-mutaffifeen', translation: 'Woe to those who give less [than due]' },
  84: { arabic: 'إِذَا السَّمَاءُ انشَقَّتْ', transliteration: 'Idhas-samaa-un-shaqqat', translation: 'When the sky has split [open]' },
  85: { arabic: 'وَالسَّمَاءِ ذَاتِ الْبُرُوجِ', transliteration: "Was-samaa'i dhaatil-burooj", translation: 'By the sky containing great stars' },
  86: { arabic: 'وَالسَّمَاءِ وَالطَّارِقِ', transliteration: "Was-samaa'i wat-taariq", translation: 'By the sky and the night comer' },
  87: { arabic: 'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى', transliteration: "Sabbihisma rabbikal-a'laa", translation: 'Exalt the name of your Lord, the Most High' },
  88: { arabic: 'هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ', transliteration: 'Hal ataaka hadeethul-ghaashiyah', translation: 'Has there reached you the report of the Overwhelming?' },
  89: { arabic: 'وَالْفَجْرِ', transliteration: 'Wal-fajr', translation: 'By the dawn' },
  90: { arabic: 'لَا أُقْسِمُ بِهَٰذَا الْبَلَدِ', transliteration: 'Laa uqsimu bi-haadhal-balad', translation: 'I swear by this city' },
  91: { arabic: 'وَالشَّمْسِ وَضُحَاهَا', transliteration: 'Wash-shamsi wa duhaahaa', translation: 'By the sun and its brightness' },
  92: { arabic: 'وَاللَّيْلِ إِذَا يَغْشَىٰ', transliteration: 'Wal-layli idhaa yaghshaa', translation: 'By the night when it covers' },
  93: { arabic: 'وَالضُّحَىٰ', transliteration: 'Wad-duhaa', translation: 'By the morning brightness' },
  94: { arabic: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', transliteration: 'Alam nashrah laka sadrak', translation: 'Did We not expand for you your breast?' },
  95: { arabic: 'وَالتِّينِ وَالزَّيْتُونِ', transliteration: 'Wat-teeni waz-zaytoon', translation: 'By the fig and the olive' },
  96: { arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', transliteration: "Iqra' bismi rabbikal-ladhee khalaq", translation: 'Read in the name of your Lord who created' },
  97: { arabic: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ', transliteration: 'Innaa anzalnaahu fee laylatil-qadr', translation: 'Indeed, We sent it down during the Night of Decree' },
  98: { arabic: 'لَمْ يَكُنِ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ', transliteration: 'Lam yakunil-ladheena kafaroo min ahlil-kitaab', translation: 'Those who disbelieved among the People of the Scripture' },
  99: { arabic: 'إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا', transliteration: 'Idhaa zulzilatil-ardu zilzaalahaa', translation: 'When the earth is shaken with its [final] earthquake' },
  100: { arabic: 'وَالْعَادِيَاتِ ضَبْحًا', transliteration: "Wal-'aadiyaati dabha", translation: 'By the racers, panting' },
  101: { arabic: 'الْقَارِعَةُ', transliteration: "Al-Qaari'ah", translation: 'The Striking Calamity' },
  102: { arabic: 'أَلْهَاكُمُ التَّكَاثُرُ', transliteration: 'Alhaakumut-takaathur', translation: 'Competition in [worldly] increase diverts you' },
  103: { arabic: 'وَالْعَصْرِ', transliteration: "Wal-'asr", translation: 'By time' },
  104: { arabic: 'وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ', transliteration: 'Waylul-likulli humazatil-lumazah', translation: 'Woe to every scorner and mocker' },
  105: { arabic: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ', transliteration: "Alam tara kayfa fa'ala rabbuka bi-ashaabil-feel", translation: 'Have you not considered how your Lord dealt with the companions of the elephant?' },
  106: { arabic: 'لِإِيلَافِ قُرَيْشٍ', transliteration: "Li-eelaafi quraysh", translation: 'For the accustomed security of the Quraysh' },
  107: { arabic: 'أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ', transliteration: "Ara'aytal-ladhee yukadhdhibu bid-deen", translation: 'Have you seen the one who denies the Recompense?' },
  108: { arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', transliteration: "Innaa a'taynakal-kawthar", translation: 'Indeed, We have granted you Al-Kawthar' },
  109: { arabic: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ', transliteration: 'Qul yaa ayyuhal-kaafiroon', translation: 'Say, "O disbelievers"' },
  110: { arabic: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ', transliteration: "Idhaa jaa'a nasrullaahi wal-fath", translation: 'When the victory of Allah has come and the conquest' },
  111: { arabic: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ', transliteration: 'Tabbat yadaaa abee lahabinw-wa-tabb', translation: 'May the hands of Abu Lahab be ruined, and ruined is he' },
  112: { arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', transliteration: 'Qul huwallaahu ahad', translation: 'Say, "He is Allah, [who is] One"' },
  113: { arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', transliteration: "Qul a'oodhu birabbil-falaq", translation: 'Say, "I seek refuge in the Lord of daybreak"' },
  114: { arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', transliteration: "Qul a'oodhu birabbin-naas", translation: 'Say, "I seek refuge in the Lord of mankind"' },
};

// All 114 Surah names
const SURAH_NAMES: { [key: number]: { english: string; arabic: string } } = {
  1: { english: 'Al-Fatihah', arabic: 'الفاتحة' },
  2: { english: 'Al-Baqarah', arabic: 'البقرة' },
  3: { english: "Ali 'Imran", arabic: 'آل عمران' },
  4: { english: 'An-Nisa', arabic: 'النساء' },
  5: { english: "Al-Ma'idah", arabic: 'المائدة' },
  6: { english: "Al-An'am", arabic: 'الأنعام' },
  7: { english: "Al-A'raf", arabic: 'الأعراف' },
  8: { english: 'Al-Anfal', arabic: 'الأنفال' },
  9: { english: 'At-Tawbah', arabic: 'التوبة' },
  10: { english: 'Yunus', arabic: 'يونس' },
  11: { english: 'Hud', arabic: 'هود' },
  12: { english: 'Yusuf', arabic: 'يوسف' },
  13: { english: "Ar-Ra'd", arabic: 'الرعد' },
  14: { english: 'Ibrahim', arabic: 'إبراهيم' },
  15: { english: 'Al-Hijr', arabic: 'الحجر' },
  16: { english: 'An-Nahl', arabic: 'النحل' },
  17: { english: 'Al-Isra', arabic: 'الإسراء' },
  18: { english: 'Al-Kahf', arabic: 'الكهف' },
  19: { english: 'Maryam', arabic: 'مريم' },
  20: { english: 'Ta-Ha', arabic: 'طه' },
  21: { english: 'Al-Anbiya', arabic: 'الأنبياء' },
  22: { english: 'Al-Hajj', arabic: 'الحج' },
  23: { english: "Al-Mu'minun", arabic: 'المؤمنون' },
  24: { english: 'An-Nur', arabic: 'النور' },
  25: { english: 'Al-Furqan', arabic: 'الفرقان' },
  26: { english: "Ash-Shu'ara", arabic: 'الشعراء' },
  27: { english: 'An-Naml', arabic: 'النمل' },
  28: { english: 'Al-Qasas', arabic: 'القصص' },
  29: { english: 'Al-Ankabut', arabic: 'العنكبوت' },
  30: { english: 'Ar-Rum', arabic: 'الروم' },
  31: { english: 'Luqman', arabic: 'لقمان' },
  32: { english: 'As-Sajdah', arabic: 'السجدة' },
  33: { english: 'Al-Ahzab', arabic: 'الأحزاب' },
  34: { english: 'Saba', arabic: 'سبأ' },
  35: { english: 'Fatir', arabic: 'فاطر' },
  36: { english: 'Ya-Sin', arabic: 'يس' },
  37: { english: 'As-Saffat', arabic: 'الصافات' },
  38: { english: 'Sad', arabic: 'ص' },
  39: { english: 'Az-Zumar', arabic: 'الزمر' },
  40: { english: 'Ghafir', arabic: 'غافر' },
  41: { english: 'Fussilat', arabic: 'فصلت' },
  42: { english: 'Ash-Shura', arabic: 'الشورى' },
  43: { english: 'Az-Zukhruf', arabic: 'الزخرف' },
  44: { english: 'Ad-Dukhan', arabic: 'الدخان' },
  45: { english: 'Al-Jathiyah', arabic: 'الجاثية' },
  46: { english: 'Al-Ahqaf', arabic: 'الأحقاف' },
  47: { english: 'Muhammad', arabic: 'محمد' },
  48: { english: 'Al-Fath', arabic: 'الفتح' },
  49: { english: 'Al-Hujurat', arabic: 'الحجرات' },
  50: { english: 'Qaf', arabic: 'ق' },
  51: { english: 'Adh-Dhariyat', arabic: 'الذاريات' },
  52: { english: 'At-Tur', arabic: 'الطور' },
  53: { english: 'An-Najm', arabic: 'النجم' },
  54: { english: 'Al-Qamar', arabic: 'القمر' },
  55: { english: 'Ar-Rahman', arabic: 'الرحمن' },
  56: { english: "Al-Waqi'ah", arabic: 'الواقعة' },
  57: { english: 'Al-Hadid', arabic: 'الحديد' },
  58: { english: 'Al-Mujadila', arabic: 'المجادلة' },
  59: { english: 'Al-Hashr', arabic: 'الحشر' },
  60: { english: 'Al-Mumtahanah', arabic: 'الممتحنة' },
  61: { english: 'As-Saff', arabic: 'الصف' },
  62: { english: "Al-Jumu'ah", arabic: 'الجمعة' },
  63: { english: 'Al-Munafiqun', arabic: 'المنافقون' },
  64: { english: 'At-Taghabun', arabic: 'التغابن' },
  65: { english: 'At-Talaq', arabic: 'الطلاق' },
  66: { english: 'At-Tahrim', arabic: 'التحريم' },
  67: { english: 'Al-Mulk', arabic: 'الملك' },
  68: { english: 'Al-Qalam', arabic: 'القلم' },
  69: { english: 'Al-Haqqah', arabic: 'الحاقة' },
  70: { english: "Al-Ma'arij", arabic: 'المعارج' },
  71: { english: 'Nuh', arabic: 'نوح' },
  72: { english: 'Al-Jinn', arabic: 'الجن' },
  73: { english: 'Al-Muzzammil', arabic: 'المزمل' },
  74: { english: 'Al-Muddaththir', arabic: 'المدثر' },
  75: { english: 'Al-Qiyamah', arabic: 'القيامة' },
  76: { english: 'Al-Insan', arabic: 'الإنسان' },
  77: { english: 'Al-Mursalat', arabic: 'المرسلات' },
  78: { english: "An-Naba'", arabic: 'النبأ' },
  79: { english: "An-Nazi'at", arabic: 'النازعات' },
  80: { english: 'Abasa', arabic: 'عبس' },
  81: { english: 'At-Takwir', arabic: 'التكوير' },
  82: { english: 'Al-Infitar', arabic: 'الانفطار' },
  83: { english: 'Al-Mutaffifin', arabic: 'المطففين' },
  84: { english: 'Al-Inshiqaq', arabic: 'الانشقاق' },
  85: { english: 'Al-Buruj', arabic: 'البروج' },
  86: { english: 'At-Tariq', arabic: 'الطارق' },
  87: { english: "Al-A'la", arabic: 'الأعلى' },
  88: { english: 'Al-Ghashiyah', arabic: 'الغاشية' },
  89: { english: 'Al-Fajr', arabic: 'الفجر' },
  90: { english: 'Al-Balad', arabic: 'البلد' },
  91: { english: 'Ash-Shams', arabic: 'الشمس' },
  92: { english: 'Al-Layl', arabic: 'الليل' },
  93: { english: 'Ad-Duhaa', arabic: 'الضحى' },
  94: { english: 'Ash-Sharh', arabic: 'الشرح' },
  95: { english: 'At-Tin', arabic: 'التين' },
  96: { english: "Al-'Alaq", arabic: 'العلق' },
  97: { english: 'Al-Qadr', arabic: 'القدر' },
  98: { english: 'Al-Bayyinah', arabic: 'البينة' },
  99: { english: 'Az-Zalzalah', arabic: 'الزلزلة' },
  100: { english: "Al-'Adiyat", arabic: 'العاديات' },
  101: { english: "Al-Qari'ah", arabic: 'القارعة' },
  102: { english: 'At-Takathur', arabic: 'التكاثر' },
  103: { english: "Al-'Asr", arabic: 'العصر' },
  104: { english: 'Al-Humazah', arabic: 'الهمزة' },
  105: { english: 'Al-Fil', arabic: 'الفيل' },
  106: { english: 'Quraysh', arabic: 'قريش' },
  107: { english: "Al-Ma'un", arabic: 'الماعون' },
  108: { english: 'Al-Kawthar', arabic: 'الكوثر' },
  109: { english: 'Al-Kafirun', arabic: 'الكافرون' },
  110: { english: 'An-Nasr', arabic: 'النصر' },
  111: { english: 'Al-Masad', arabic: 'المسد' },
  112: { english: 'Al-Ikhlas', arabic: 'الإخلاص' },
  113: { english: 'Al-Falaq', arabic: 'الفلق' },
  114: { english: 'An-Nas', arabic: 'الناس' },
};

// Self-assessment multi-select card shown after reciting x3
function SelfAssessmentCard({ passageIndex, onSubmit }: { passageIndex: number; onSubmit: (index: number, assessment: SelfAssessment) => void }) {
  const [smooth, setSmooth] = useState(false);
  const [weakMem, setWeakMem] = useState(false);
  const [weakFlu, setWeakFlu] = useState(false);
  const [weakUnd, setWeakUnd] = useState(false);

  const anySelected = smooth || weakMem || weakFlu || weakUnd;

  function handleSmooth() {
    setSmooth(true);
    setWeakMem(false);
    setWeakFlu(false);
    setWeakUnd(false);
  }

  function handleWeakness(setter: (v: boolean) => void, current: boolean) {
    if (!current) setSmooth(false);
    setter(!current);
  }

  return (
    <div className="rounded-lg p-3 border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20">
      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">Step 3: How did it go?</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={handleSmooth}
          className={`p-2.5 rounded-lg border-2 text-sm text-left transition ${
            smooth
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-300'
          }`}
        >
          {smooth ? <CheckCircle className="w-4 h-4 text-emerald-600 inline mr-1" /> : null}
          Smooth — I'm confident
        </button>
        <button
          onClick={() => handleWeakness(setWeakMem, weakMem)}
          className={`p-2.5 rounded-lg border-2 text-sm text-left transition ${
            weakMem
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-300'
          }`}
        >
          {weakMem ? <CheckCircle className="w-4 h-4 text-amber-600 inline mr-1" /> : null}
          Struggled to recall verses
        </button>
        <button
          onClick={() => handleWeakness(setWeakFlu, weakFlu)}
          className={`p-2.5 rounded-lg border-2 text-sm text-left transition ${
            weakFlu
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-300'
          }`}
        >
          {weakFlu ? <CheckCircle className="w-4 h-4 text-amber-600 inline mr-1" /> : null}
          Struggled with pronunciation
        </button>
        <button
          onClick={() => handleWeakness(setWeakUnd, weakUnd)}
          className={`p-2.5 rounded-lg border-2 text-sm text-left transition ${
            weakUnd
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-300'
          }`}
        >
          {weakUnd ? <CheckCircle className="w-4 h-4 text-amber-600 inline mr-1" /> : null}
          Didn't understand meaning
        </button>
      </div>
      <button
        onClick={() => onSubmit(passageIndex, { smooth, weakMemorisation: weakMem, weakFluency: weakFlu, weakUnderstanding: weakUnd })}
        disabled={!anySelected}
        className={`w-full py-2.5 rounded-lg font-medium text-sm transition ${
          anySelected
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </div>
  );
}

export default function DailyMaintenancePage() {
  const navigate = useNavigate();
  const { learnerId: selfLearnerId, loading: learnerLoading } = useSelfLearner();
  const [loading, setLoading] = useState(true);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [learnerStats, setLearnerStats] = useState<LearnerStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    lastMaintenanceDate: null
  });
  const [todaySession, setTodaySession] = useState<DailySession | null>(null);
  const [memorizedSurahs, setMemorizedSurahs] = useState<number[]>([]);
  const [passageList, setPassageList] = useState<PassageUnit[]>([]);

  // Expanded practice sections per passage (keyed by passage index)
  const [expandedPractice, setExpandedPractice] = useState<{ [key: number]: Set<string> }>({});

  // First Word Prompter bonus tool state
  const [showFirstWordPrompter, setShowFirstWordPrompter] = useState(false);
  const [selectedPromptSurah, setSelectedPromptSurah] = useState<number | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [prompterScore, setPrompterScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  // Ayah-level testing state (for First Word Prompter bonus + memorisation practice)
  const [fluencyAyahs, setFluencyAyahs] = useState<number[]>([]);
  const [ayahFirstWords, setAyahFirstWords] = useState<FirstWordData[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [testingMode, setTestingMode] = useState<'surah' | 'ayah'>('surah');

  // Memorisation practice game state (inline per passage)
  const [gameAyahFirstWords, setGameAyahFirstWords] = useState<FirstWordData[]>([]);
  const [gameAyahIndex, setGameAyahIndex] = useState(0);
  const [gameRevealed, setGameRevealed] = useState(false);
  const [gameScore, setGameScore] = useState({ correct: 0, total: 0 });
  const [loadingGame, setLoadingGame] = useState(false);
  const [activeMemPracticeIndex, setActiveMemPracticeIndex] = useState<number | null>(null);

  // Fluency read-along counts per passage
  const [readAlongCounts, setReadAlongCounts] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (learnerLoading) return;
    if (selfLearnerId) {
      setLearnerId(selfLearnerId);
      loadData(selfLearnerId);
    } else {
      setLoading(false);
    }
  }, [selfLearnerId, learnerLoading]);

  async function loadData(targetLearnerId: string) {
    try {
      // Load learner stats + rotation index
      const { data: learner } = await supabase
        .from('learners')
        .select('current_streak, longest_streak, total_maintenance_sessions, last_maintenance_date, daily_review_rotation_index')
        .eq('id', targetLearnerId)
        .maybeSingle();

      if (learner) {
        setLearnerStats({
          currentStreak: learner.current_streak || 0,
          longestStreak: learner.longest_streak || 0,
          totalSessions: learner.total_maintenance_sessions || 0,
          lastMaintenanceDate: learner.last_maintenance_date
        });
      }

      const rotationIndex = learner?.daily_review_rotation_index || 0;

      // Load memorized surahs sorted by surah_number ascending
      const { data: trackedSurahs } = await supabase
        .from('surah_retention_tracker')
        .select('surah_number')
        .eq('learner_id', targetLearnerId)
        .eq('memorization_status', 'memorized')
        .order('surah_number', { ascending: true });

      const allMemorized = trackedSurahs && trackedSurahs.length > 0
        ? trackedSurahs.map(s => s.surah_number)
        : [1, 112, 113, 114];

      setMemorizedSurahs(allMemorized);

      // Build passage list (splits long surahs at juz boundaries)
      const passages = buildPassageList(allMemorized, SURAH_NAMES);
      setPassageList(passages);

      // Check for today's session
      const today = new Date().toISOString().split('T')[0];

      const { data: existingSession } = await supabase
        .from('daily_maintenance_sessions')
        .select('*')
        .eq('learner_id', targetLearnerId)
        .eq('session_date', today)
        .maybeSingle();

      let needsNewSession = !existingSession;

      if (existingSession) {
        const isOldFormat = (existingSession.surahs_reviewed || []).some((s: any) => 'memorisation' in s && !('listenCount' in s));

        if (isOldFormat && existingSession.status !== 'completed') {
          // Old-format in-progress session: delete and recreate with new format
          await supabase.from('daily_maintenance_sessions').delete().eq('id', existingSession.id);
          needsNewSession = true;
        } else if (isOldFormat) {
          // Old-format completed session: map to new fields as done
          const refreshedSurahs: SurahReview[] = (existingSession.surahs_reviewed || []).map((s: any) => ({
            surah: s.surah,
            surahName: SURAH_NAMES[s.surah]?.english || s.surahName || `Surah ${s.surah}`,
            surahNameArabic: SURAH_NAMES[s.surah]?.arabic || s.surahNameArabic || '',
            startAyah: s.startAyah ?? undefined,
            endAyah: s.endAyah ?? undefined,
            passageLabel: s.passageLabel ?? undefined,
            listenCount: 3,
            reciteCount: 3,
            selfAssessment: {
              smooth: s.memorisation === 'strong' && s.fluency === 'strong' && s.understanding === 'strong',
              weakMemorisation: s.memorisation === 'weak',
              weakFluency: s.fluency === 'weak',
              weakUnderstanding: s.understanding === 'weak',
            },
            memorisationPracticeDone: s.memorisationDone ?? false,
            fluencyPracticeDone: s.fluencyDone ?? false,
            understandingPracticeDone: s.understandingDone ?? false,
            quality: s.quality ?? 5,
          }));

          setTodaySession({
            id: existingSession.id,
            sessionDate: existingSession.session_date,
            surahsReviewed: refreshedSurahs,
            tasksCompleted: existingSession.tasks_completed,
            totalTasks: existingSession.total_tasks,
            status: existingSession.status,
            completedAt: existingSession.completed_at
          });
        } else {
          // New format session: resume as-is
          const refreshedSurahs: SurahReview[] = (existingSession.surahs_reviewed || []).map((s: any) => ({
            surah: s.surah,
            surahName: SURAH_NAMES[s.surah]?.english || s.surahName || `Surah ${s.surah}`,
            surahNameArabic: SURAH_NAMES[s.surah]?.arabic || s.surahNameArabic || '',
            startAyah: s.startAyah ?? undefined,
            endAyah: s.endAyah ?? undefined,
            passageLabel: s.passageLabel ?? undefined,
            listenCount: s.listenCount ?? 0,
            reciteCount: s.reciteCount ?? 0,
            selfAssessment: s.selfAssessment ?? null,
            memorisationPracticeDone: s.memorisationPracticeDone ?? false,
            fluencyPracticeDone: s.fluencyPracticeDone ?? false,
            understandingPracticeDone: s.understandingPracticeDone ?? false,
            quality: s.quality ?? 0,
          }));

          setTodaySession({
            id: existingSession.id,
            sessionDate: existingSession.session_date,
            surahsReviewed: refreshedSurahs,
            tasksCompleted: existingSession.tasks_completed,
            totalTasks: existingSession.total_tasks,
            status: existingSession.status,
            completedAt: existingSession.completed_at
          });
        }
      }

      if (needsNewSession) {
        // Create new session - pick 3 consecutive passages using ordered rotation
        const numToReview = Math.min(3, passages.length);
        const passagesToUse: PassageUnit[] = [];
        for (let i = 0; i < numToReview; i++) {
          passagesToUse.push(passages[(rotationIndex + i) % passages.length]);
        }

        const initialSurahs: SurahReview[] = passagesToUse.map(p => ({
          surah: p.surah,
          surahName: p.surahName,
          surahNameArabic: p.surahNameArabic,
          startAyah: p.startAyah,
          endAyah: p.endAyah,
          passageLabel: p.passageLabel || undefined,
          listenCount: 0,
          reciteCount: 0,
          selfAssessment: null,
          memorisationPracticeDone: false,
          fluencyPracticeDone: false,
          understandingPracticeDone: false,
          quality: 0
        }));

        const { data: newSession, error: insertError } = await supabase
          .from('daily_maintenance_sessions')
          .insert({
            learner_id: targetLearnerId,
            session_date: today,
            surahs_reviewed: initialSurahs,
            tasks_completed: 0,
            total_tasks: numToReview,
            status: 'in_progress'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to create session:', insertError);
        }

        if (newSession) {
          setTodaySession({
            id: newSession.id,
            sessionDate: newSession.session_date,
            surahsReviewed: initialSurahs,
            tasksCompleted: 0,
            totalTasks: numToReview,
            status: 'in_progress',
            completedAt: null
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load ayahs for a surah and fetch their first word data from API
  // First tries fluency-tracked ayahs, then falls back to ALL ayahs in the surah
  async function loadFluencyAyahsForSurah(surahNumber: number) {
    setLoadingAyahs(true);
    setAyahFirstWords([]);
    setCurrentAyahIndex(0);

    try {
      let ayahNumbers: number[] = [];

      // Try to get fluency-tracked ayahs from database first (if user is logged in)
      if (learnerId) {
        const { data: progressData } = await supabase
          .from('quran_progress')
          .select('ayah_number')
          .eq('student_id', learnerId)
          .eq('surah_number', surahNumber)
          .eq('fluency_completed', true)
          .order('ayah_number', { ascending: true });

        if (progressData && progressData.length > 0) {
          ayahNumbers = progressData.map(p => p.ayah_number);
        }
      }

      // If no fluency data, get ALL ayahs in the surah
      if (ayahNumbers.length === 0) {
        // Get surah info to know how many ayahs it has
        const chapterInfo = await getChapterInfo(surahNumber);
        const totalAyahs = chapterInfo?.verses_count || SURAH_AYAH_COUNTS[surahNumber] || 7;

        // Create array of all ayah numbers [1, 2, 3, ..., totalAyahs]
        ayahNumbers = Array.from({ length: totalAyahs }, (_, i) => i + 1);
      }

      setFluencyAyahs(ayahNumbers);

      // Fetch first word data from Quran.com API for all ayahs
      const firstWordsData = await getFirstWordsForAyahs(surahNumber, 1, Math.max(...ayahNumbers));

      // Filter to only include ayahs we want to test
      const filteredFirstWords = firstWordsData.filter(fw => ayahNumbers.includes(fw.ayahNumber));

      if (filteredFirstWords.length > 0) {
        setAyahFirstWords(filteredFirstWords);
        setTestingMode('ayah');
      } else {
        // API failed - fall back to static data
        setTestingMode('surah');
      }
    } catch (error) {
      console.error('Error loading ayahs:', error);
      setTestingMode('surah');
    } finally {
      setLoadingAyahs(false);
    }
  }

  // Fallback ayah counts for common surahs (used if API fails)
  const SURAH_AYAH_COUNTS: { [key: number]: number } = {
    1: 7, 2: 286, 3: 200, 36: 83, 55: 78, 56: 96, 67: 30, 78: 40, 79: 46, 80: 42,
    81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
    91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
    101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
    111: 5, 112: 4, 113: 5, 114: 6
  };

  // Toggle listen count for a passage (tap to mark done, tap again to undo)
  async function toggleListen(passageIndex: number, n: number) {
    if (!todaySession) return;
    const passage = todaySession.surahsReviewed[passageIndex];

    // If tapping an already-done button, undo back to n-1
    const newCount = passage.listenCount >= n ? n - 1 : n;

    // If reducing listen count, also reset recite and assessment if they depend on it
    const updatedSurahs = todaySession.surahsReviewed.map((s, i) => {
      if (i !== passageIndex) return s;
      const updated = { ...s, listenCount: newCount };
      // If listen is no longer complete, reset recite and assessment
      if (newCount < 3) {
        updated.reciteCount = Math.min(updated.reciteCount, 0);
        updated.selfAssessment = null;
      }
      return updated;
    });
    await saveSession(updatedSurahs);
  }

  // Toggle recite count for a passage
  async function toggleRecite(passageIndex: number, n: number) {
    if (!todaySession) return;
    const passage = todaySession.surahsReviewed[passageIndex];
    if (passage.listenCount < 3) return;

    // If tapping an already-done button, undo back to n-1
    const newCount = passage.reciteCount >= n ? n - 1 : n;

    const updatedSurahs = todaySession.surahsReviewed.map((s, i) => {
      if (i !== passageIndex) return s;
      const updated = { ...s, reciteCount: newCount };
      // If recite is no longer complete, reset assessment
      if (newCount < 3) {
        updated.selfAssessment = null;
      }
      return updated;
    });
    await saveSession(updatedSurahs);
  }

  // Submit self-assessment for a passage
  async function submitAssessment(passageIndex: number, assessment: SelfAssessment) {
    if (!todaySession) return;

    // Determine quality: 5 if smooth, 3 if weak areas
    const quality = assessment.smooth ? 5 : 3;

    const updatedSurahs = todaySession.surahsReviewed.map((s, i) =>
      i === passageIndex ? { ...s, selfAssessment: assessment, quality } : s
    );

    const completedCount = updatedSurahs.filter(s => isPassageComplete(s)).length;
    await saveSession(updatedSurahs, completedCount);
  }

  // Mark a practice section as done and update quality
  async function markPracticeDone(passageIndex: number, practiceType: 'memorisation' | 'fluency' | 'understanding') {
    if (!todaySession) return;

    const doneKey = `${practiceType}PracticeDone` as keyof SurahReview;

    const updatedSurahs = todaySession.surahsReviewed.map((s, i) => {
      if (i !== passageIndex) return s;
      const updated = { ...s, [doneKey]: true };
      // If any practice done, bump quality from 3 to 4
      if (updated.memorisationPracticeDone || updated.fluencyPracticeDone || updated.understandingPracticeDone) {
        updated.quality = Math.max(updated.quality, 4);
      }
      return updated;
    });

    await saveSession(updatedSurahs);
  }

  // Toggle expanded practice section
  function togglePracticeSection(passageIndex: number, section: string) {
    setExpandedPractice(prev => {
      const current = prev[passageIndex] || new Set<string>();
      const next = new Set(current);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return { ...prev, [passageIndex]: next };
    });
  }

  // Start memorisation practice for a passage
  async function startMemPractice(passageIndex: number) {
    if (!todaySession) return;
    const passage = todaySession.surahsReviewed[passageIndex];

    setActiveMemPracticeIndex(passageIndex);
    setGameScore({ correct: 0, total: 0 });
    setGameAyahIndex(0);
    setGameRevealed(false);
    setLoadingGame(true);
    setGameAyahFirstWords([]);

    try {
      const totalAyahs = passage.endAyah ?? (FULL_SURAH_AYAH_COUNTS[passage.surah] || 7);
      const firstWordsData = await getFirstWordsForAyahs(passage.surah, passage.startAyah ?? 1, totalAyahs);
      if (firstWordsData.length > 0) {
        setGameAyahFirstWords(firstWordsData);
      }
    } catch (error) {
      console.error('Error loading game ayahs:', error);
    } finally {
      setLoadingGame(false);
    }
  }

  // Finish the entire review session
  async function finishReview() {
    if (!todaySession || !learnerId) return;

    const updatedSurahs = todaySession.surahsReviewed.map(s => ({ ...s }));
    await saveSession(updatedSurahs, updatedSurahs.length, true);

    // Update retention tracker for all surahs
    for (const s of updatedSurahs) {
      await supabase
        .from('surah_retention_tracker')
        .upsert({
          learner_id: learnerId,
          surah_number: s.surah,
          last_reviewed_at: new Date().toISOString(),
          memorization_status: 'memorized'
        }, { onConflict: 'learner_id,surah_number' });
    }
  }

  // Helper: save session to DB and update state
  async function saveSession(updatedSurahs: SurahReview[], tasksCompleted?: number, allComplete?: boolean) {
    if (!todaySession || !learnerId) return;

    const completed = tasksCompleted ?? todaySession.tasksCompleted;
    const isComplete = allComplete ?? false;
    const newStatus = isComplete ? 'completed' : todaySession.status;

    const { error } = await supabase
      .from('daily_maintenance_sessions')
      .update({
        surahs_reviewed: updatedSurahs,
        tasks_completed: completed,
        status: newStatus,
        completed_at: isComplete ? new Date().toISOString() : null
      })
      .eq('id', todaySession.id);

    if (!error) {
      setTodaySession({
        ...todaySession,
        surahsReviewed: updatedSurahs,
        tasksCompleted: completed,
        status: newStatus,
        completedAt: isComplete ? new Date().toISOString() : null
      });

      // If all complete, update streak and advance rotation
      if (isComplete && todaySession.status !== 'completed') {
        // Find the passage index of the last reviewed item for rotation advancement
        const lastItem = updatedSurahs[updatedSurahs.length - 1];
        const lastIdx = passageList.findIndex(p =>
          p.surah === lastItem?.surah &&
          p.startAyah === (lastItem?.startAyah ?? 1)
        );
        const newRotationIndex = ((lastIdx === -1 ? 0 : lastIdx) + 1) % (passageList.length || 1);

        await supabase
          .from('learners')
          .update({
            current_streak: learnerStats.currentStreak + 1,
            longest_streak: Math.max(learnerStats.longestStreak, learnerStats.currentStreak + 1),
            last_maintenance_date: new Date().toISOString().split('T')[0],
            total_maintenance_sessions: learnerStats.totalSessions + 1,
            daily_review_rotation_index: newRotationIndex
          })
          .eq('id', learnerId);

        setLearnerStats(prev => ({
          ...prev,
          currentStreak: prev.currentStreak + 1,
          longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
          totalSessions: prev.totalSessions + 1
        }));
      }
    }
  }

  const completedCount = todaySession
    ? todaySession.surahsReviewed.filter(s => isPassageComplete(s)).length
    : 0;
  const allPassagesDone = todaySession
    ? todaySession.surahsReviewed.every(s => isPassageComplete(s))
    : false;
  const progressPercent = todaySession
    ? Math.round((completedCount / todaySession.totalTasks) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => {
            if (selectedPromptSurah) {
              setSelectedPromptSurah(null);
              setRevealedAnswer(false);
              setCurrentAyahIndex(0);
              setAyahFirstWords([]);
            } else if (showFirstWordPrompter) {
              setShowFirstWordPrompter(false);
            } else {
              navigate('/dashboard');
            }
          }}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {selectedPromptSurah ? 'Back to Surah Selection' : showFirstWordPrompter ? 'Back' : 'Back to Dashboard'}
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-3xl">📖</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Daily Quran Review</h1>
              <p className="text-white/80 text-sm">Keep your memorisation strong with daily practice</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-4xl font-arabic text-white/90">حَافِظُوا عَلَى الْقُرْآن</span>
          </div>
          <p className="text-white/70 text-xs mt-1">Guard the Quran (through regular review)</p>
        </div>

        {/* Streak and Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                learnerStats.currentStreak > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Flame className={`w-6 h-6 ${learnerStats.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{learnerStats.currentStreak}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's Progress</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {completedCount}/{todaySession?.totalTasks || 0} passages
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{learnerStats.longestStreak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Best Streak</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{learnerStats.totalSessions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{todaySession?.surahsReviewed.length || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Passages Today</p>
          </div>
        </div>

        {/* Completion celebration */}
        {todaySession?.status === 'completed' && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-2xl p-6 mb-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">Today's Review Complete!</h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Excellent work! You've maintained your {learnerStats.currentStreak}-day streak.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Come back tomorrow to keep your streak going!
            </p>
          </div>
        )}

        {/* Passage Review Cards */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Today's Passages
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Listen 3 times, recite 3 times from memory, then assess yourself.
          </p>

          {todaySession?.surahsReviewed.map((passage, index) => {
            const complete = isPassageComplete(passage);
            const listenDone = passage.listenCount >= 3;
            const reciteDone = passage.reciteCount >= 3;
            const assessed = passage.selfAssessment !== null;
            const weakAreas = hasWeakAreas(passage);
            const expanded = expandedPractice[index] || new Set<string>();

            return (
              <div
                key={`${passage.surah}-${passage.startAyah ?? 1}`}
                className={`rounded-xl border-2 transition-all ${
                  complete
                    ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {/* Passage header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      complete ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {complete ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{passage.surah}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {passage.surahName}
                        <span className="text-lg font-arabic text-gray-500 dark:text-gray-400 ml-2" dir="rtl">
                          {passage.surahNameArabic}
                        </span>
                      </p>
                      {passage.passageLabel && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{passage.passageLabel}</p>
                      )}
                    </div>
                    {complete && !weakAreas && (
                      <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">Smooth</span>
                    )}
                    {complete && weakAreas && (
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">Reviewed</span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Step 1: Listen x3 */}
                  <div className={`rounded-lg p-3 border ${listenDone ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {listenDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                      <p className={`text-sm font-medium ${listenDone ? 'text-emerald-800 dark:text-emerald-200' : 'text-blue-900 dark:text-blue-100'}`}>
                        Step 1: Listen to this passage 3 times
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        {[1, 2, 3].map(n => (
                          <button
                            key={n}
                            onClick={() => {
                              if (todaySession?.status === 'completed') return;
                              if (passage.listenCount >= n) { toggleListen(index, n); }
                              else if (passage.listenCount === n - 1) { toggleListen(index, n); }
                            }}
                            disabled={todaySession?.status === 'completed' || (passage.listenCount < n - 1)}
                            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition ${
                              passage.listenCount >= n
                                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                                : passage.listenCount === n - 1
                                  ? 'border-blue-400 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer'
                                  : 'border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600'
                            }`}
                          >
                            {passage.listenCount >= n ? <CheckCircle className="w-4 h-4" /> : n}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 ml-auto">
                        <a href={`https://quran.com/${passage.surah}/${passage.startAyah ?? 1}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition border border-blue-200 dark:border-blue-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Quran.com
                        </a>
                        <a href="https://tarteel.ai" target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-100 dark:hover:bg-blue-800 transition border border-blue-200 dark:border-blue-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Tarteel AI
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Recite x3 */}
                  <div className={`rounded-lg p-3 border ${
                    reciteDone
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                      : listenDone
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {reciteDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : listenDone ? (
                        <Mic className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      )}
                      <p className={`text-sm font-medium ${
                        reciteDone ? 'text-emerald-800 dark:text-emerald-200' : listenDone ? 'text-orange-900 dark:text-orange-100' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        Step 2: Recite from memory 3 times (no mushaf)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(n => (
                        <button
                          key={n}
                          onClick={() => {
                            if (todaySession?.status === 'completed') return;
                            if (passage.reciteCount >= n) { toggleRecite(index, n); }
                            else if (listenDone && passage.reciteCount === n - 1) { toggleRecite(index, n); }
                          }}
                          disabled={todaySession?.status === 'completed' || (!listenDone || (passage.reciteCount < n - 1))}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition ${
                            passage.reciteCount >= n
                              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                              : listenDone && passage.reciteCount === n - 1
                                ? 'border-orange-400 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer'
                                : 'border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          {passage.reciteCount >= n ? <CheckCircle className="w-4 h-4" /> : n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Self-Assessment */}
                  {reciteDone && !assessed && todaySession?.status !== 'completed' && (
                    <SelfAssessmentCard
                      passageIndex={index}
                      onSubmit={submitAssessment}
                    />
                  )}

                  {/* Show assessment result */}
                  {assessed && (
                    <div className={`rounded-lg p-3 border ${
                      passage.selfAssessment?.smooth
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${passage.selfAssessment?.smooth ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <p className={`text-sm font-medium ${passage.selfAssessment?.smooth ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
                          {passage.selfAssessment?.smooth
                            ? 'Smooth - confident!'
                            : `Areas to work on: ${[
                                passage.selfAssessment?.weakMemorisation && 'Memorisation',
                                passage.selfAssessment?.weakFluency && 'Fluency',
                                passage.selfAssessment?.weakUnderstanding && 'Understanding',
                              ].filter(Boolean).join(', ')}`
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Weak Area Practice (optional, inline, collapsible) */}
                  {assessed && weakAreas && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recommended Practice (optional)
                      </p>

                      {/* Memorisation Practice */}
                      {passage.selfAssessment?.weakMemorisation && (
                        <div className="rounded-lg border border-purple-200 dark:border-purple-700 overflow-hidden">
                          <button
                            onClick={() => togglePracticeSection(index, 'memorisation')}
                            className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                          >
                            <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-medium text-purple-900 dark:text-purple-100 flex-1 text-left">
                              First Word Prompter
                            </span>
                            {passage.memorisationPracticeDone && (
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">Done</span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform ${expanded.has('memorisation') ? 'rotate-180' : ''}`} />
                          </button>
                          {expanded.has('memorisation') && (
                            <div className="p-4 border-t border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
                              {activeMemPracticeIndex === index && gameAyahFirstWords.length > 0 ? (
                                <div className="text-center">
                                  <div className="mb-3 flex items-center justify-between">
                                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full text-sm">
                                      Ayah {gameAyahIndex + 1} of {gameAyahFirstWords.length}
                                    </span>
                                    <span className="text-sm text-gray-500">Score: {gameScore.correct}/{gameScore.total}</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300" style={{ width: `${((gameAyahIndex + 1) / gameAyahFirstWords.length) * 100}%` }} />
                                  </div>
                                  <div className={`rounded-xl p-6 mb-4 transition-all ${gameRevealed ? 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-300' : 'bg-white dark:bg-gray-800 border-2 border-purple-200'}`}>
                                    {!gameRevealed ? (
                                      <div className="py-2">
                                        <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">First word of Ayah {gameAyahFirstWords[gameAyahIndex]?.ayahNumber}:</p>
                                        <p className="text-4xl font-arabic text-purple-900 dark:text-purple-100 mb-2" dir="rtl" style={{ lineHeight: '1.8' }}>{gameAyahFirstWords[gameAyahIndex]?.firstWord}</p>
                                        <p className="text-sm text-purple-700 italic">{gameAyahFirstWords[gameAyahIndex]?.transliteration}</p>
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="text-sm text-emerald-600 mb-3">Full ayah:</p>
                                        <p className="text-2xl font-arabic text-gray-900 dark:text-white mb-3" dir="rtl" style={{ lineHeight: '2' }}>{gameAyahFirstWords[gameAyahIndex]?.fullVerseUthmani}</p>
                                        {gameAyahFirstWords[gameAyahIndex]?.fullVerseTranslation && (
                                          <p className="text-sm text-amber-700 dark:text-amber-200">"{gameAyahFirstWords[gameAyahIndex].fullVerseTranslation}"</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-3 justify-center flex-wrap">
                                    {!gameRevealed ? (
                                      <button onClick={() => setGameRevealed(true)} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2 font-medium">
                                        <Eye className="w-5 h-5" /> Reveal Full Ayah
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            const newScore = { correct: gameScore.correct + 1, total: gameScore.total + 1 };
                                            setGameScore(newScore);
                                            if (gameAyahIndex < gameAyahFirstWords.length - 1) { setGameAyahIndex(prev => prev + 1); setGameRevealed(false); }
                                            else { markPracticeDone(index, 'memorisation'); setActiveMemPracticeIndex(null); setGameAyahFirstWords([]); }
                                          }}
                                          className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2"
                                        >
                                          <CheckCircle className="w-5 h-5" />
                                          {gameAyahIndex < gameAyahFirstWords.length - 1 ? 'Correct - Next' : 'Correct - Finish'}
                                        </button>
                                        <button
                                          onClick={() => {
                                            const newScore = { correct: gameScore.correct, total: gameScore.total + 1 };
                                            setGameScore(newScore);
                                            if (gameAyahIndex < gameAyahFirstWords.length - 1) { setGameAyahIndex(prev => prev + 1); setGameRevealed(false); }
                                            else { markPracticeDone(index, 'memorisation'); setActiveMemPracticeIndex(null); setGameAyahFirstWords([]); }
                                          }}
                                          className="px-5 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition flex items-center gap-2"
                                        >
                                          <RefreshCw className="w-5 h-5" />
                                          {gameAyahIndex < gameAyahFirstWords.length - 1 ? 'Need Practice - Next' : 'Need Practice - Finish'}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : loadingGame && activeMemPracticeIndex === index ? (
                                <div className="text-center py-6">
                                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4" />
                                  <p className="text-purple-700 dark:text-purple-300">Loading ayahs...</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Test your recall: see the first word, try to finish the ayah.</p>
                                  <button
                                    onClick={() => startMemPractice(index)}
                                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
                                  >
                                    Start First Word Prompter
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fluency Practice */}
                      {passage.selfAssessment?.weakFluency && (
                        <div className="rounded-lg border border-blue-200 dark:border-blue-700 overflow-hidden">
                          <button
                            onClick={() => togglePracticeSection(index, 'fluency')}
                            className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          >
                            <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100 flex-1 text-left">
                              Listen + Read-Along
                            </span>
                            {passage.fluencyPracticeDone && (
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">Done</span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${expanded.has('fluency') ? 'rotate-180' : ''}`} />
                          </button>
                          {expanded.has('fluency') && (
                            <div className="p-4 border-t border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Follow along with the audio while reading the Arabic text. Focus on flow and speed — try to match the reciter's pace.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={`https://quran.com/${passage.surah}/${passage.startAyah ?? 1}?wbw=true`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-800 transition border border-blue-200 dark:border-blue-600 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Quran.com Word-by-Word
                                </a>
                                <a
                                  href="https://tarteel.ai"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-800 transition border border-blue-200 dark:border-blue-600 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Tarteel AI
                                </a>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Read-along attempts:</p>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                      key={n}
                                      onClick={() => setReadAlongCounts(prev => ({ ...prev, [index]: Math.max(prev[index] || 0, n) }))}
                                      disabled={(readAlongCounts[index] || 0) >= n}
                                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition ${
                                        (readAlongCounts[index] || 0) >= n
                                          ? 'bg-blue-600 border-blue-600 text-white'
                                          : (readAlongCounts[index] || 0) === n - 1
                                            ? 'border-blue-400 text-blue-600 hover:bg-blue-100 cursor-pointer'
                                            : 'border-gray-200 text-gray-300'
                                      }`}
                                    >
                                      {(readAlongCounts[index] || 0) >= n ? <CheckCircle className="w-3.5 h-3.5" /> : n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {!passage.fluencyPracticeDone && (
                                <button
                                  onClick={() => markPracticeDone(index, 'fluency')}
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                  Mark Fluency Practice Done
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Understanding Practice */}
                      {passage.selfAssessment?.weakUnderstanding && (
                        <div className="rounded-lg border border-teal-200 dark:border-teal-700 overflow-hidden">
                          <button
                            onClick={() => togglePracticeSection(index, 'understanding')}
                            className="w-full flex items-center gap-3 p-3 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
                          >
                            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span className="text-sm font-medium text-teal-900 dark:text-teal-100 flex-1 text-left">
                              Vocabulary + Translations
                            </span>
                            {passage.understandingPracticeDone && (
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">Done</span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-teal-600 transition-transform ${expanded.has('understanding') ? 'rotate-180' : ''}`} />
                          </button>
                          {expanded.has('understanding') && (
                            <div className="p-4 border-t border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 space-y-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Learn the meaning of the words you just recited.
                              </p>
                              {SURAH_VOCABULARY[passage.surah] && SURAH_VOCABULARY[passage.surah].length >= 4 ? (
                                <WordMatchingQuiz
                                  words={SURAH_VOCABULARY[passage.surah].slice(0, 8).map(w => ({ arabic: w.arabic, english: w.english, transliteration: w.transliteration }))}
                                  lessonId={`daily-review-${passage.surah}`}
                                  onComplete={() => { if (!passage.understandingPracticeDone) markPracticeDone(index, 'understanding'); }}
                                />
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                  No vocabulary data available for this surah yet.
                                </p>
                              )}
                              {/* Key verse translations */}
                              {SURAH_THEMES[passage.surah] && (
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-teal-200 dark:border-teal-700">
                                  <p className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">Theme</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{SURAH_THEMES[passage.surah].theme}</p>
                                  {SURAH_THEMES[passage.surah].keyTopics.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {SURAH_THEMES[passage.surah].keyTopics.map((topic, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-300 rounded-full text-xs">{topic}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {!passage.understandingPracticeDone && (
                                <button
                                  onClick={() => markPracticeDone(index, 'understanding')}
                                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
                                >
                                  Mark Understanding Practice Done
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Review Button */}
        {todaySession && todaySession.status !== 'completed' && (
          <div className="mb-6">
            <button
              onClick={finishReview}
              disabled={!allPassagesDone}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 ${
                allPassagesDone
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-6 h-6" />
              {allPassagesDone ? "Complete Today's Review" : `Listen + Recite + Assess all passages first (${completedCount}/${todaySession.totalTasks})`}
            </button>
          </div>
        )}

        {/* Recommended Apps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Recommended Apps</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Use these apps for listening and recitation:</p>
              <div className="flex flex-wrap gap-2">
                <a href="https://tarteel.ai" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 transition">Tarteel AI</a>
                <a href="https://quranic.app" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 transition">Quranic</a>
                <a href="https://quran.com/1?wbw=true" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 transition">Quran by Word</a>
              </div>
            </div>
          </div>
        </div>

        {/* First Word Prompter (bonus tool) */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-700 overflow-hidden mb-6">
          <button
            onClick={() => setShowFirstWordPrompter(!showFirstWordPrompter)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">First Word Prompter</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">Bonus: Test your ability to start any surah</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform ${showFirstWordPrompter ? 'rotate-180' : ''}`} />
          </button>

          {showFirstWordPrompter && (
            <div className="p-4 pt-0 border-t border-purple-200 dark:border-purple-700">
              {/* Score display */}
              {prompterScore.total > 0 && (
                <div className="mb-4 flex items-center justify-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full">
                    Score: {prompterScore.correct}/{prompterScore.total}
                  </span>
                </div>
              )}

              {!selectedPromptSurah ? (
                /* Surah selector */
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3 text-center">
                    Select a surah to test your recall of every fluent ayah:
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                    {memorizedSurahs
                      .filter(num => SURAH_FIRST_WORDS[num])
                      .sort((a, b) => b - a) // Show from An-Nas to Al-Fatihah
                      .map(surahNum => (
                        <button
                          key={surahNum}
                          onClick={() => {
                            setSelectedPromptSurah(surahNum);
                            setRevealedAnswer(false);
                            loadFluencyAyahsForSurah(surahNum);
                          }}
                          className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all text-center"
                        >
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{surahNum}</span>
                          <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                            {SURAH_NAMES[surahNum]?.english}
                          </span>
                        </button>
                      ))}
                  </div>
                  {memorizedSurahs.filter(num => SURAH_FIRST_WORDS[num]).length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No surahs with first word data available yet.
                    </p>
                  )}
                </div>
              ) : loadingAyahs ? (
                /* Loading state */
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-purple-700 dark:text-purple-300">Loading fluent ayahs...</p>
                </div>
              ) : testingMode === 'ayah' && ayahFirstWords.length > 0 ? (
                /* Ayah-level testing - test each fluent ayah in sequence */
                <div className="text-center">
                  {/* Progress indicator */}
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-full text-sm">
                      Ayah {currentAyahIndex + 1} of {ayahFirstWords.length}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({SURAH_NAMES[selectedPromptSurah]?.english})
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6 mx-4">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${((currentAyahIndex + 1) / ayahFirstWords.length) * 100}%` }}
                    />
                  </div>

                  {/* Prompt - show first word, user tries to finish */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Surah {SURAH_NAMES[selectedPromptSurah]?.english}, Ayah {ayahFirstWords[currentAyahIndex]?.ayahNumber}
                    </p>
                    <h4 className="text-lg font-medium text-purple-700 dark:text-purple-300">
                      Test your ability to finish the ayah
                    </h4>
                  </div>

                  {/* First word prompt area */}
                  <div className={`rounded-xl p-6 mb-4 transition-all ${
                    revealedAnswer
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-300 dark:border-emerald-600'
                      : 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700'
                  }`}>
                    {!revealedAnswer && ayahFirstWords[currentAyahIndex] ? (
                      /* Show first word as prompt */
                      <div className="py-4">
                        <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">First word:</p>
                        <p className="text-4xl md:text-5xl font-arabic text-purple-900 dark:text-purple-100 mb-3" dir="rtl" style={{ lineHeight: '1.8' }}>
                          {ayahFirstWords[currentAyahIndex].firstWord}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300 italic">
                          {ayahFirstWords[currentAyahIndex].transliteration}
                        </p>
                      </div>
                    ) : revealedAnswer && ayahFirstWords[currentAyahIndex] ? (
                      /* Show full verse */
                      <div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">Full ayah:</p>
                        <p className="text-2xl md:text-3xl font-arabic text-gray-900 dark:text-white mb-4" dir="rtl" style={{ lineHeight: '2' }}>
                          {ayahFirstWords[currentAyahIndex].fullVerseUthmani}
                        </p>
                        <p className="text-base text-amber-700 dark:text-amber-200">
                          "{ayahFirstWords[currentAyahIndex].fullVerseTranslation}"
                        </p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-3 justify-center flex-wrap">
                    {!revealedAnswer ? (
                      <button
                        onClick={() => setRevealedAnswer(true)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2 font-medium"
                      >
                        <Eye className="w-5 h-5" />
                        Reveal Full Ayah
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPrompterScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
                            // Move to next ayah or finish
                            if (currentAyahIndex < ayahFirstWords.length - 1) {
                              setCurrentAyahIndex(prev => prev + 1);
                              setRevealedAnswer(false);
                            } else {
                              // Finished all ayahs
                              setSelectedPromptSurah(null);
                              setRevealedAnswer(false);
                              setCurrentAyahIndex(0);
                              setAyahFirstWords([]);
                            }
                          }}
                          className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {currentAyahIndex < ayahFirstWords.length - 1 ? 'Correct - Next' : 'Correct - Finish'}
                        </button>
                        <button
                          onClick={() => {
                            setPrompterScore(prev => ({ ...prev, total: prev.total + 1 }));
                            // Move to next ayah or finish
                            if (currentAyahIndex < ayahFirstWords.length - 1) {
                              setCurrentAyahIndex(prev => prev + 1);
                              setRevealedAnswer(false);
                            } else {
                              // Finished all ayahs
                              setSelectedPromptSurah(null);
                              setRevealedAnswer(false);
                              setCurrentAyahIndex(0);
                              setAyahFirstWords([]);
                            }
                          }}
                          className="px-5 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition flex items-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                          {currentAyahIndex < ayahFirstWords.length - 1 ? 'Need Practice - Next' : 'Need Practice - Finish'}
                        </button>
                      </>
                    )}
                    </div>
                    {/* Back to surah selection */}
                    <button
                      onClick={() => {
                        setSelectedPromptSurah(null);
                        setRevealedAnswer(false);
                        setCurrentAyahIndex(0);
                        setAyahFirstWords([]);
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                    >
                      ← Choose different surah
                    </button>
                  </div>
                </div>
              ) : (
                /* Fallback: Surah-level testing (first ayah only) - used when no fluent ayahs found */
                <div className="text-center">
                  {/* Info message */}
                  {testingMode === 'surah' && fluencyAyahs.length === 0 && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        No fluent ayahs tracked for this surah yet. Testing first ayah only.
                      </p>
                    </div>
                  )}

                  {/* Surah name and prompt */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {SURAH_NAMES[selectedPromptSurah]?.english} - {SURAH_NAMES[selectedPromptSurah]?.arabic}
                    </p>
                    <h4 className="text-lg font-medium text-purple-700 dark:text-purple-300">
                      Test your ability to finish the surah
                    </h4>
                  </div>

                  {/* First word prompt area */}
                  <div className={`rounded-xl p-6 mb-4 transition-all ${
                    revealedAnswer
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-300 dark:border-emerald-600'
                      : 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700'
                  }`}>
                    {!revealedAnswer && SURAH_FIRST_WORDS[selectedPromptSurah] ? (
                      /* Show first word as prompt */
                      <div className="py-4">
                        <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">First word:</p>
                        <p className="text-4xl md:text-5xl font-arabic text-purple-900 dark:text-purple-100 mb-3" dir="rtl" style={{ lineHeight: '1.8' }}>
                          {SURAH_FIRST_WORDS[selectedPromptSurah].arabic.split(' ')[0]}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300 italic">
                          {SURAH_FIRST_WORDS[selectedPromptSurah].transliteration.split(' ')[0]}
                        </p>
                      </div>
                    ) : revealedAnswer && SURAH_FIRST_WORDS[selectedPromptSurah] ? (
                      /* Show full opening verse */
                      <div>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">Full opening:</p>
                        <p className="text-2xl md:text-3xl font-arabic text-gray-900 dark:text-white mb-4" dir="rtl" style={{ lineHeight: '2' }}>
                          {SURAH_FIRST_WORDS[selectedPromptSurah].arabic}
                        </p>
                        <p className="text-lg text-purple-700 dark:text-purple-300 italic mb-2">
                          {SURAH_FIRST_WORDS[selectedPromptSurah].transliteration}
                        </p>
                        <p className="text-base text-amber-700 dark:text-amber-200">
                          "{SURAH_FIRST_WORDS[selectedPromptSurah].translation}"
                        </p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 justify-center">
                    {!revealedAnswer ? (
                      <button
                        onClick={() => setRevealedAnswer(true)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2 font-medium"
                      >
                        <Eye className="w-5 h-5" />
                        Reveal Full Verse
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPrompterScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
                            setSelectedPromptSurah(null);
                            setRevealedAnswer(false);
                          }}
                          className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          I knew it!
                        </button>
                        <button
                          onClick={() => {
                            setPrompterScore(prev => ({ ...prev, total: prev.total + 1 }));
                            setSelectedPromptSurah(null);
                            setRevealedAnswer(false);
                          }}
                          className="px-5 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition flex items-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                          Need practice
                        </button>
                      </>
                    )}
                  </div>

                  {/* Back button */}
                  <button
                    onClick={() => {
                      setSelectedPromptSurah(null);
                      setRevealedAnswer(false);
                    }}
                    className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    ← Choose different surah
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Link to homework */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Want more practice?
              </h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                Try our Smart Homework to strengthen vocabulary
              </p>
            </div>
            <button
              onClick={() => navigate('/homework')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              Start Homework
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
