import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  Download,
  Copy,
  Check,
  Clock,
  Users,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { downloadKhutbaPDF } from '../utils/generateKhutbaPDF';

// Khutba Structure Types
interface KhutbaSection {
  type: 'arabic' | 'text' | 'verse' | 'hadith';
  arabic?: string;
  transliteration?: string;
  translation?: string;
  reference?: string;
  explanation?: string;
}

interface KhutbaContent {
  title: string;
  duration: 'short' | 'medium' | 'long';
  audience: string;
  first_khutbah: {
    opening: KhutbaSection[];
    main_content: {
      introduction: string;
      quran_evidence: KhutbaSection[];
      hadith_evidence: KhutbaSection[];
      practical_application: string[];
      call_to_action: string;
    };
    closing: KhutbaSection;
  };
  second_khutbah: {
    opening: KhutbaSection;
    reminder: string;
    dua: KhutbaSection[];
    salawat: KhutbaSection;
  };
  sources: string[];
}

// Topic categories
const TOPIC_CATEGORIES = {
  seasonal: {
    label: 'Seasonal & Calendar',
    topics: [
      'Preparing for Ramadan',
      'Lessons from Hajj',
      'The Blessed Month of Muharram',
      'Welcoming the Month of Rajab',
      'The Night of Isra and Miraj',
      'Significance of Shaban'
    ]
  },
  youth: {
    label: 'Youth & Students',
    topics: [
      'Dealing with Peer Pressure',
      'Social Media and Islam',
      'Balancing Deen and Dunya',
      'Respect for Parents and Teachers',
      'Finding Purpose as a Young Muslim',
      'Avoiding Haram Relationships'
    ]
  },
  fundamental: {
    label: 'Fundamental Topics',
    topics: [
      'The Importance of Salah',
      'Understanding Tawheed',
      'The Dangers of Shirk',
      'Character of the Prophet ﷺ',
      'The Five Pillars of Islam',
      'Seeking Knowledge in Islam'
    ]
  },
  family: {
    label: 'Family & Community',
    topics: [
      'Raising Righteous Children',
      'Rights of Spouses in Islam',
      'Caring for Elderly Parents',
      'Brotherhood and Sisterhood',
      'Rights of Neighbors',
      'Unity of the Ummah'
    ]
  },
  character: {
    label: 'Character & Ethics',
    topics: [
      'The Virtue of Patience (Sabr)',
      'Gratitude and Thankfulness (Shukr)',
      'Truthfulness and Honesty',
      'Avoiding Backbiting (Gheebah)',
      'Controlling Anger',
      'Humility in Islam'
    ]
  },
  current: {
    label: 'Contemporary Issues',
    topics: [
      'Mental Health in Islam',
      'Environmental Responsibility',
      'Financial Ethics and Riba',
      'Justice and Oppression',
      'Supporting the Oppressed',
      'Islam in the Modern World'
    ]
  }
};

const DURATION_OPTIONS = [
  { value: 'short', label: 'Short (3-5 min)', description: 'For school Jummah, youth groups' },
  { value: 'medium', label: 'Medium (7-10 min)', description: 'Standard Friday khutbah' },
  { value: 'long', label: 'Long (12-15 min)', description: 'Detailed topic exploration' }
];

const AUDIENCE_OPTIONS = [
  { value: 'youth', label: 'Youth/Students', description: 'School-aged to young adults' },
  { value: 'general', label: 'General Community', description: 'Mixed audience of all ages' },
  { value: 'new_muslims', label: 'New Muslims', description: 'Reverts and those new to Islam' }
];

// Fixed Arabic text components for khutba structure
const KHUTBA_ARABIC = {
  opening_praise: {
    arabic: 'الحمد لله نحمده ونستعينه ونستغفره، ونعوذ بالله من شرور أنفسنا ومن سيئات أعمالنا، من يهده الله فلا مضل له، ومن يضلل فلا هادي له',
    transliteration: 'Alhamdulillah, nahmaduhu wa nasta\'eenahu wa nastaghfiruhu, wa na\'oodhu billahi min shuroori anfusina wa min sayyi\'aati a\'maalina. Man yahdihillahu fala mudilla lah, wa man yudlil fala haadiya lah.',
    translation: 'All praise is due to Allah. We praise Him, seek His help and His forgiveness. We seek refuge in Allah from the evil of our souls and from our bad deeds. Whomever Allah guides, no one can misguide, and whomever Allah leaves astray, no one can guide.'
  },
  testimony: {
    arabic: 'وأشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمداً عبده ورسوله',
    transliteration: 'Wa ashhadu an la ilaha illallah wahdahu la shareeka lah, wa ashhadu anna Muhammadan \'abduhu wa rasooluh.',
    translation: 'I bear witness that there is no deity worthy of worship except Allah alone, with no partners, and I bear witness that Muhammad is His slave and messenger.'
  },
  opening_verse: {
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
    transliteration: 'Ya ayyuhallatheena aamanuttaqullaha haqqa tuqaatihi wa la tamootunna illa wa antum muslimoon.',
    translation: 'O you who believe! Fear Allah as He should be feared, and die not except in a state of Islam.',
    reference: 'Aal-Imran 3:102'
  },
  first_khutbah_closing: {
    arabic: 'أقول قولي هذا وأستغفر الله لي ولكم ولسائر المسلمين من كل ذنب فاستغفروه إنه هو الغفور الرحيم',
    transliteration: 'Aqoolu qawli hadha wa astaghfirullaha li wa lakum wa lisa\'iril muslimeena min kulli dhanbin fastaghfiroohu innahu huwal ghafoorur raheem.',
    translation: 'I say these words and I seek forgiveness from Allah for myself, for you, and for all Muslims from every sin. So seek His forgiveness; indeed He is the Most Forgiving, Most Merciful.'
  },
  second_opening: {
    arabic: 'الحمد لله رب العالمين، والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين',
    transliteration: 'Alhamdulillahi rabbil \'aalameen, wassalatu wassalamu \'ala nabiyyina Muhammad wa \'ala aalihi wa sahbihi ajma\'een.',
    translation: 'All praise is due to Allah, Lord of the worlds, and may Allah\'s peace and blessings be upon our Prophet Muhammad, his family, and all his companions.'
  },
  dua_ummah: {
    arabic: 'اللهم أعز الإسلام والمسلمين، وأذل الشرك والمشركين، ودمر أعداء الدين',
    transliteration: 'Allahumma a\'izzal Islama wal Muslimeen, wa adhillash shirka wal mushrikeen, wa dammir a\'daa\'ad deen.',
    translation: 'O Allah, grant honor to Islam and the Muslims, and humiliate shirk and the mushrikeen, and destroy the enemies of the religion.'
  },
  dua_oppressed: {
    arabic: 'اللهم انصر إخواننا المستضعفين في كل مكان',
    transliteration: 'Allahumman-sur ikhwananal mustad\'afeena fi kulli makaan.',
    translation: 'O Allah, grant victory to our oppressed brothers and sisters everywhere.'
  },
  salawat: {
    arabic: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا',
    transliteration: 'Innallaha wa mala\'ikatahu yusalloona \'alan nabiyy. Ya ayyuhallatheena aamanu sallu \'alayhi wa sallimu tasleema.',
    translation: 'Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, send blessings upon him and greet him with peace.',
    reference: 'Al-Ahzab 33:56'
  }
};

export default function KhutbaCreator() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium');
  const [audience, setAudience] = useState('general');
  const [loading, setLoading] = useState(false);
  const [khutba, setKhutba] = useState<KhutbaContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    first_opening: true,
    first_content: true,
    first_closing: true,
    second_khutbah: true
  });
  const khutbaRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDownloadPDF = async () => {
    if (!khutba || downloadingPDF) return;

    setDownloadingPDF(true);
    try {
      await downloadKhutbaPDF(khutba);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  async function generateKhutba(selectedTopic?: string) {
    const topicToUse = selectedTopic || topic.trim();
    if (!topicToUse || loading) return;

    setLoading(true);
    setKhutba(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-khutba`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            topic: topicToUse,
            duration,
            audience,
            user_id: user?.id || null
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate khutba');
      }

      const result = await response.json();
      setKhutba(result);

      setTimeout(() => {
        khutbaRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error('Error generating khutba:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function copyKhutba() {
    if (!khutba) return;

    // Format khutba as text
    let text = `${khutba.title}\n${'='.repeat(50)}\n\n`;
    text += `Duration: ${duration} | Audience: ${audience}\n\n`;

    text += `FIRST KHUTBAH\n${'-'.repeat(30)}\n\n`;
    text += `Opening Praise:\n${KHUTBA_ARABIC.opening_praise.arabic}\n${KHUTBA_ARABIC.opening_praise.transliteration}\n${KHUTBA_ARABIC.opening_praise.translation}\n\n`;
    text += `Testimony of Faith:\n${KHUTBA_ARABIC.testimony.arabic}\n${KHUTBA_ARABIC.testimony.transliteration}\n${KHUTBA_ARABIC.testimony.translation}\n\n`;
    text += `Opening Verse (${KHUTBA_ARABIC.opening_verse.reference}):\n${KHUTBA_ARABIC.opening_verse.arabic}\n${KHUTBA_ARABIC.opening_verse.transliteration}\n${KHUTBA_ARABIC.opening_verse.translation}\n\n`;

    if (khutba.first_khutbah?.main_content) {
      text += `MAIN CONTENT\n${'-'.repeat(20)}\n\n`;
      text += `Introduction:\n${khutba.first_khutbah.main_content.introduction}\n\n`;

      if (khutba.first_khutbah.main_content.quran_evidence?.length > 0) {
        text += `Quranic Evidence:\n`;
        khutba.first_khutbah.main_content.quran_evidence.forEach((v: any) => {
          text += `${v.arabic || ''}\n${v.transliteration || ''}\n${v.translation || ''}\n(${v.reference || ''})\n\n`;
        });
      }

      if (khutba.first_khutbah.main_content.hadith_evidence?.length > 0) {
        text += `Hadith Evidence:\n`;
        khutba.first_khutbah.main_content.hadith_evidence.forEach((h: any) => {
          text += `${h.arabic || ''}\n${h.transliteration || ''}\n${h.translation || ''}\n(${h.reference || ''})\n\n`;
        });
      }

      if (khutba.first_khutbah.main_content.practical_application?.length > 0) {
        text += `Practical Application:\n`;
        khutba.first_khutbah.main_content.practical_application.forEach((p: string, i: number) => {
          text += `${i + 1}. ${p}\n`;
        });
        text += '\n';
      }

      text += `Call to Action:\n${khutba.first_khutbah.main_content.call_to_action}\n\n`;
    }

    text += `Closing of First Khutbah:\n${KHUTBA_ARABIC.first_khutbah_closing.arabic}\n${KHUTBA_ARABIC.first_khutbah_closing.transliteration}\n${KHUTBA_ARABIC.first_khutbah_closing.translation}\n\n`;

    text += `[KHATEEB SITS BRIEFLY]\n\n`;

    text += `SECOND KHUTBAH\n${'-'.repeat(30)}\n\n`;
    text += `Opening:\n${KHUTBA_ARABIC.second_opening.arabic}\n${KHUTBA_ARABIC.second_opening.transliteration}\n${KHUTBA_ARABIC.second_opening.translation}\n\n`;

    if (khutba.second_khutbah?.reminder) {
      text += `Reminder:\n${khutba.second_khutbah.reminder}\n\n`;
    }

    text += `Dua for the Ummah:\n${KHUTBA_ARABIC.dua_ummah.arabic}\n${KHUTBA_ARABIC.dua_ummah.transliteration}\n${KHUTBA_ARABIC.dua_ummah.translation}\n\n`;
    text += `${KHUTBA_ARABIC.dua_oppressed.arabic}\n${KHUTBA_ARABIC.dua_oppressed.transliteration}\n${KHUTBA_ARABIC.dua_oppressed.translation}\n\n`;

    text += `Final Salawat (${KHUTBA_ARABIC.salawat.reference}):\n${KHUTBA_ARABIC.salawat.arabic}\n${KHUTBA_ARABIC.salawat.transliteration}\n${KHUTBA_ARABIC.salawat.translation}\n\n`;

    text += `صلى الله عليه وسلم\nMay Allah's peace and blessings be upon him.\n\n`;

    if (khutba.sources?.length > 0) {
      text += `SOURCES\n${'-'.repeat(20)}\n`;
      khutba.sources.forEach(s => {
        text += `• ${s}\n`;
      });
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🕌</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Khutbah Creator</h1>
                <p className="text-xs text-slate-400">Generate Authentic Friday Khutbahs</p>
              </div>
            </div>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Create Your Friday Khutbah
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Generate complete, authentic khutbahs following the Quran and Sunnah.
            Perfect for school Jummah, youth groups, or community masajid.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 mb-8">
          {/* Step 1: Duration & Audience - FIRST */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
              <h3 className="text-lg font-semibold text-white">Choose Duration & Audience</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Duration */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as 'short' | 'medium' | 'long')}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-cyan-400" />
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                >
                  {AUDIENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Topic Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
              <h3 className="text-lg font-semibold text-white">Select or Enter Topic</h3>
            </div>

            {/* Topic Input */}
            <div className="mb-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The Importance of Prayer, Patience in Difficult Times..."
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Topic Suggestions */}
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-3">Or choose from suggested topics (will generate immediately):</p>
              <div className="space-y-4">
                {Object.entries(TOPIC_CATEGORIES).map(([key, category]) => (
                  <div key={key}>
                    <p className="text-xs text-cyan-400 font-medium mb-2">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.topics.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setTopic(suggestion);
                            generateKhutba(suggestion);
                          }}
                          disabled={loading}
                          className="px-3 py-1.5 bg-slate-700/50 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-full text-sm transition border border-slate-600/50 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => generateKhutba()}
            disabled={!topic.trim() || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating Khutbah...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generate Khutbah</span>
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 mb-8 text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Generating Your Khutbah</h3>
            <p className="text-slate-400">Finding authentic Quran verses and Hadith for your topic...</p>
            <p className="text-slate-500 text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Generated Khutba */}
        {khutba && (
          <div ref={khutbaRef} className="bg-slate-800/30 border border-cyan-500/30 rounded-2xl overflow-hidden">
            {/* Khutba Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 px-8 py-6 border-b border-cyan-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-cyan-400 text-sm font-medium mb-1">Friday Khutbah</p>
                  <h3 className="text-2xl font-bold text-white">{khutba.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {DURATION_OPTIONS.find(d => d.value === duration)?.label}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyKhutba}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-lg transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{downloadingPDF ? 'Generating...' : 'PDF'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Khutba Content */}
            <div className="p-8 space-y-8">
              {/* FIRST KHUTBAH */}
              <div>
                <h4 className="text-xl font-bold text-cyan-400 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  FIRST KHUTBAH
                </h4>

                {/* Opening Section */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('first_opening')}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-white">Opening</h5>
                    {expandedSections.first_opening ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {expandedSections.first_opening && (
                    <div className="space-y-6 pl-4 border-l-2 border-cyan-500/30">
                      {/* Opening Praise */}
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-xs text-cyan-400 font-medium mb-2">Opening Praise</p>
                        <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.opening_praise.arabic}
                        </p>
                        <p className="text-slate-400 italic text-sm mb-2">
                          {KHUTBA_ARABIC.opening_praise.transliteration}
                        </p>
                        <p className="text-slate-300">
                          {KHUTBA_ARABIC.opening_praise.translation}
                        </p>
                      </div>

                      {/* Testimony */}
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-xs text-cyan-400 font-medium mb-2">Testimony of Faith</p>
                        <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.testimony.arabic}
                        </p>
                        <p className="text-slate-400 italic text-sm mb-2">
                          {KHUTBA_ARABIC.testimony.transliteration}
                        </p>
                        <p className="text-slate-300">
                          {KHUTBA_ARABIC.testimony.translation}
                        </p>
                      </div>

                      {/* Opening Verse */}
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <p className="text-xs text-emerald-400 font-medium mb-2">Opening Verse ({KHUTBA_ARABIC.opening_verse.reference})</p>
                        <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.opening_verse.arabic}
                        </p>
                        <p className="text-slate-400 italic text-sm mb-2">
                          {KHUTBA_ARABIC.opening_verse.transliteration}
                        </p>
                        <p className="text-slate-300">
                          {KHUTBA_ARABIC.opening_verse.translation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('first_content')}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-white flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-amber-400" />
                      Main Content
                    </h5>
                    {expandedSections.first_content ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {expandedSections.first_content && khutba.first_khutbah?.main_content && (
                    <div className="space-y-6 pl-4 border-l-2 border-amber-500/30">
                      {/* Introduction */}
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-xs text-amber-400 font-medium mb-2">Introduction</p>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {khutba.first_khutbah.main_content.introduction}
                        </p>
                      </div>

                      {/* Quran Evidence */}
                      {khutba.first_khutbah.main_content.quran_evidence?.length > 0 && (
                        <div>
                          <p className="text-xs text-emerald-400 font-medium mb-3">Quranic Evidence</p>
                          <div className="space-y-4">
                            {khutba.first_khutbah.main_content.quran_evidence.map((verse: any, idx: number) => (
                              <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                {verse.arabic && (
                                  <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                                    {verse.arabic}
                                  </p>
                                )}
                                {verse.transliteration && (
                                  <p className="text-slate-400 italic text-sm mb-2">
                                    {verse.transliteration}
                                  </p>
                                )}
                                <p className="text-slate-200 mb-2">{verse.translation}</p>
                                {verse.reference && (
                                  <p className="text-emerald-400 text-sm font-medium">{verse.reference}</p>
                                )}
                                {verse.explanation && (
                                  <p className="text-slate-400 text-sm mt-2 pt-2 border-t border-emerald-500/20">
                                    {verse.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hadith Evidence */}
                      {khutba.first_khutbah.main_content.hadith_evidence?.length > 0 && (
                        <div>
                          <p className="text-xs text-amber-400 font-medium mb-3">Hadith Evidence</p>
                          <div className="space-y-4">
                            {khutba.first_khutbah.main_content.hadith_evidence.map((hadith: any, idx: number) => (
                              <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                {hadith.arabic && (
                                  <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                                    {hadith.arabic}
                                  </p>
                                )}
                                {hadith.transliteration && (
                                  <p className="text-slate-400 italic text-sm mb-2">
                                    {hadith.transliteration}
                                  </p>
                                )}
                                <p className="text-slate-200 mb-2">{hadith.translation}</p>
                                {hadith.reference && (
                                  <p className="text-amber-400 text-sm font-medium">{hadith.reference}</p>
                                )}
                                {hadith.explanation && (
                                  <p className="text-slate-400 text-sm mt-2 pt-2 border-t border-amber-500/20">
                                    {hadith.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Practical Application */}
                      {khutba.first_khutbah.main_content.practical_application?.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl p-4">
                          <p className="text-xs text-cyan-400 font-medium mb-3">Practical Application</p>
                          <ul className="space-y-2">
                            {khutba.first_khutbah.main_content.practical_application.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start text-slate-200">
                                <span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-cyan-400 text-sm">
                                  {idx + 1}
                                </span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Call to Action */}
                      {khutba.first_khutbah.main_content.call_to_action && (
                        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
                          <p className="text-xs text-cyan-400 font-medium mb-2">Call to Action</p>
                          <p className="text-slate-200 font-medium">
                            {khutba.first_khutbah.main_content.call_to_action}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* First Khutbah Closing */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('first_closing')}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-white">Closing of First Khutbah</h5>
                    {expandedSections.first_closing ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {expandedSections.first_closing && (
                    <div className="pl-4 border-l-2 border-cyan-500/30">
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.first_khutbah_closing.arabic}
                        </p>
                        <p className="text-slate-400 italic text-sm mb-2">
                          {KHUTBA_ARABIC.first_khutbah_closing.transliteration}
                        </p>
                        <p className="text-slate-300">
                          {KHUTBA_ARABIC.first_khutbah_closing.translation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sitting Moment */}
                <div className="bg-slate-700/30 rounded-xl p-4 text-center my-8">
                  <p className="text-slate-400 italic">[ KHATEEB SITS BRIEFLY ]</p>
                </div>
              </div>

              {/* SECOND KHUTBAH */}
              <div>
                <h4 className="text-xl font-bold text-blue-400 mb-6 flex items-center">
                  <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  SECOND KHUTBAH
                </h4>

                <div className="mb-6">
                  <button
                    onClick={() => toggleSection('second_khutbah')}
                    className="w-full flex items-center justify-between text-left mb-4"
                  >
                    <h5 className="text-lg font-semibold text-white">Content</h5>
                    {expandedSections.second_khutbah ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {expandedSections.second_khutbah && (
                    <div className="space-y-6 pl-4 border-l-2 border-blue-500/30">
                      {/* Opening */}
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-xs text-blue-400 font-medium mb-2">Opening Praise</p>
                        <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.second_opening.arabic}
                        </p>
                        <p className="text-slate-400 italic text-sm mb-2">
                          {KHUTBA_ARABIC.second_opening.transliteration}
                        </p>
                        <p className="text-slate-300">
                          {KHUTBA_ARABIC.second_opening.translation}
                        </p>
                      </div>

                      {/* Reminder */}
                      {khutba.second_khutbah?.reminder && (
                        <div className="bg-slate-800/50 rounded-xl p-4">
                          <p className="text-xs text-blue-400 font-medium mb-2">Brief Reminder</p>
                          <p className="text-slate-200 leading-relaxed">
                            {khutba.second_khutbah.reminder}
                          </p>
                        </div>
                      )}

                      {/* Duas */}
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <p className="text-xs text-purple-400 font-medium mb-3">Dua for the Ummah</p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xl md:text-2xl text-white font-arabic leading-relaxed text-right mb-2" dir="rtl">
                              {KHUTBA_ARABIC.dua_ummah.arabic}
                            </p>
                            <p className="text-slate-400 italic text-sm mb-1">
                              {KHUTBA_ARABIC.dua_ummah.transliteration}
                            </p>
                            <p className="text-slate-300 text-sm">
                              {KHUTBA_ARABIC.dua_ummah.translation}
                            </p>
                          </div>
                          <div>
                            <p className="text-xl md:text-2xl text-white font-arabic leading-relaxed text-right mb-2" dir="rtl">
                              {KHUTBA_ARABIC.dua_oppressed.arabic}
                            </p>
                            <p className="text-slate-400 italic text-sm mb-1">
                              {KHUTBA_ARABIC.dua_oppressed.transliteration}
                            </p>
                            <p className="text-slate-300 text-sm">
                              {KHUTBA_ARABIC.dua_oppressed.translation}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Salawat */}
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <p className="text-xs text-emerald-400 font-medium mb-2">Final Salawat ({KHUTBA_ARABIC.salawat.reference})</p>
                        <p className="text-2xl md:text-3xl text-white font-arabic leading-relaxed text-right mb-3" dir="rtl">
                          {KHUTBA_ARABIC.salawat.arabic}
                        </p>
                        <p className="text-slate-400 italic text-sm mb-2">
                          {KHUTBA_ARABIC.salawat.transliteration}
                        </p>
                        <p className="text-slate-300 mb-4">
                          {KHUTBA_ARABIC.salawat.translation}
                        </p>
                        <p className="text-3xl md:text-4xl text-white font-arabic text-center" dir="rtl">
                          صلى الله عليه وسلم
                        </p>
                        <p className="text-slate-300 text-center text-sm mt-1">
                          May Allah's peace and blessings be upon him.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sources */}
              {khutba.sources && khutba.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <h5 className="text-lg font-semibold text-white mb-4">Sources</h5>
                  <div className="flex flex-wrap gap-2">
                    {khutba.sources.map((source, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
