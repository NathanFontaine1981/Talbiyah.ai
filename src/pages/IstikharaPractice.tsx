/**
 * Istikhara Prayer Practice Page
 * Learn and practice Salatul Istikhara - the guidance prayer
 * Features: Step-by-step instructions, Arabic text, transliteration, translation, audio, PDF download
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTTSAudio } from '../lib/ttsHelper';
import {
  ChevronLeft,
  Volume2,
  Download,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Compass,
  CircleDot,
  Clock,
  Heart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// The Istikhara Dua - authentic version from Sahih al-Bukhari
const ISTIKHARA_DUA = {
  title: 'Dua al-Istikhara',
  titleArabic: 'دعاء الاستخارة',
  description: 'The supplication for seeking Allah\'s guidance when making important decisions, taught by the Prophet ﷺ',
  source: 'Sahih al-Bukhari (1162)',
  hadith: 'Jabir ibn Abdullah reported: The Prophet ﷺ used to teach us the Istikhara for all matters, just as he would teach us a Surah from the Quran.',

  // Full dua broken into sections for learning
  sections: [
    {
      id: 1,
      arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ',
      transliteration: 'Allāhumma innī astakhīruka bi-ʿilmik',
      english: 'O Allah, I seek Your guidance through Your knowledge',
      note: 'Beginning with acknowledgment of Allah\'s infinite knowledge'
    },
    {
      id: 2,
      arabic: 'وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ',
      transliteration: 'wa astaqdiruka bi-qudratik',
      english: 'and I seek ability through Your power',
      note: 'Acknowledging Allah\'s power to make things happen'
    },
    {
      id: 3,
      arabic: 'وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ',
      transliteration: 'wa asʾaluka min faḍlika al-ʿaẓīm',
      english: 'and I ask You from Your great bounty',
      note: 'Asking from Allah\'s limitless generosity'
    },
    {
      id: 4,
      arabic: 'فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ',
      transliteration: 'fa innaka taqdiru wa lā aqdir',
      english: 'For You have power and I have no power',
      note: 'Expressing complete reliance on Allah'
    },
    {
      id: 5,
      arabic: 'وَتَعْلَمُ وَلَا أَعْلَمُ',
      transliteration: 'wa taʿlamu wa lā aʿlam',
      english: 'and You know and I do not know',
      note: 'Acknowledging our limited knowledge'
    },
    {
      id: 6,
      arabic: 'وَأَنْتَ عَلَّامُ الْغُيُوبِ',
      transliteration: 'wa anta ʿallām al-ghuyūb',
      english: 'and You are the Knower of the unseen',
      note: 'Allah alone knows the future and hidden matters'
    },
    {
      id: 7,
      arabic: 'اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ',
      transliteration: 'Allāhumma in kunta taʿlamu anna hādhal-amr',
      english: 'O Allah, if You know that this matter',
      note: 'Here you should think about your specific matter/decision',
      isPlaceholder: true
    },
    {
      id: 8,
      arabic: 'خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي',
      transliteration: 'khayrun lī fī dīnī wa maʿāshī wa ʿāqibati amrī',
      english: 'is good for me in my religion, my livelihood, and the outcome of my affairs',
      note: 'Seeking what is best in all aspects of life'
    },
    {
      id: 9,
      arabic: 'فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ',
      transliteration: 'faqdurhu lī wa yassirhu lī thumma bārik lī fīh',
      english: 'then decree it for me, make it easy for me, and bless it for me',
      note: 'Asking Allah to facilitate what is good'
    },
    {
      id: 10,
      arabic: 'وَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ',
      transliteration: 'wa in kunta taʿlamu anna hādhal-amr',
      english: 'And if You know that this matter',
      note: 'Second part - if the matter is not good',
      isPlaceholder: true
    },
    {
      id: 11,
      arabic: 'شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي',
      transliteration: 'sharrun lī fī dīnī wa maʿāshī wa ʿāqibati amrī',
      english: 'is bad for me in my religion, my livelihood, and the outcome of my affairs',
      note: 'If it would harm any aspect of life'
    },
    {
      id: 12,
      arabic: 'فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ',
      transliteration: 'faṣrifhu ʿannī waṣrifnī ʿanh',
      english: 'then turn it away from me and turn me away from it',
      note: 'Asking Allah to remove harmful things from our path'
    },
    {
      id: 13,
      arabic: 'وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ',
      transliteration: 'waqdur liya al-khayra ḥaythu kān',
      english: 'and decree for me what is good, wherever it may be',
      note: 'Trusting Allah to guide to the best outcome'
    },
    {
      id: 14,
      arabic: 'ثُمَّ أَرْضِنِي بِهِ',
      transliteration: 'thumma arḍinī bih',
      english: 'and then make me content with it',
      note: 'Asking for contentment with Allah\'s decree'
    }
  ]
};

// Step-by-step instructions for performing Istikhara
const ISTIKHARA_STEPS = [
  {
    id: 1,
    title: 'Have a Clear Intention',
    description: 'Before praying, have a specific matter or decision in mind that you are seeking guidance for. Istikhara is for choices between permissible options, not for obligatory acts or sins.',
    icon: Heart
  },
  {
    id: 2,
    title: 'Perform Wudu (Ablution)',
    description: 'Ensure you are in a state of ritual purity by performing wudu, just as you would for any prayer.',
    icon: CircleDot
  },
  {
    id: 3,
    title: 'Pray Two Rak\'at',
    description: 'Pray two voluntary rak\'at (units) of prayer. It is recommended to recite Surah Al-Kafirun (109) after Al-Fatiha in the first rak\'ah, and Surah Al-Ikhlas (112) in the second, though any surah is acceptable.',
    icon: Clock
  },
  {
    id: 4,
    title: 'Recite the Istikhara Dua',
    description: 'After completing the prayer and saying the salam, recite the Istikhara dua. When you reach "this matter" (هذا الأمر), think about or mention your specific decision.',
    icon: BookOpen
  },
  {
    id: 5,
    title: 'Trust in Allah and Act',
    description: 'After making Istikhara, proceed with what you feel inclined toward. There\'s no need to wait for dreams or signs. If Allah guides you toward it, doors will open. If away from it, obstacles may arise.',
    icon: Compass
  }
];

// Common misconceptions about Istikhara
const MISCONCEPTIONS = [
  {
    myth: 'You must see a dream after Istikhara',
    reality: 'Dreams are not required. Guidance often comes through feelings, ease/difficulty in the matter, or events unfolding naturally.'
  },
  {
    myth: 'You can only pray Istikhara once for a matter',
    reality: 'You can repeat Istikhara as many times as you feel the need, especially if you\'re still uncertain.'
  },
  {
    myth: 'Istikhara can be prayed for someone else',
    reality: 'Istikhara is a personal prayer for your own decisions. However, you can make general dua for others.'
  },
  {
    myth: 'The dua must be recited in the prayer',
    reality: 'The dua is recited AFTER completing the two rak\'at, not during the prayer itself.'
  }
];

// Convert transliteration to PDF-safe ASCII characters
function toPdfSafeTransliteration(text: string): string {
  return text
    .replace(/ʿ/g, "'")
    .replace(/ʾ/g, "'")
    .replace(/ā/g, 'aa')
    .replace(/ī/g, 'ee')
    .replace(/ū/g, 'oo')
    .replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd')
    .replace(/ṣ/g, 's')
    .replace(/ẓ/g, 'z')
    .replace(/ḥ/g, 'h')
    .replace(/ḏ/g, 'dh')
    .replace(/ṯ/g, 'th')
    .replace(/ġ/g, 'gh');
}

// Arabic font loading for PDF
let arabicFontBase64: string | null = null;

async function loadArabicFontForPDF(): Promise<string | null> {
  if (arabicFontBase64) return arabicFontBase64;

  try {
    const fontUrls = [
      'https://fonts.gstatic.com/s/notonaskharabic/v33/RrQ5bpV-9Dd1b1OAGA6M9PkyDuVBePeKNaxcsss0Y7bwvc5krK0z9_Mnuw.ttf',
      'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf'
    ];

    for (const url of fontUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          arabicFontBase64 = btoa(binary);
          return arabicFontBase64;
        }
      } catch {
        // Try next font URL
      }
    }
    throw new Error('All font URLs failed');
  } catch (error) {
    console.error('Failed to load Arabic font:', error);
    return null;
  }
}

export default function IstikharaPractice() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'learn' | 'dua' | 'faq'>('learn');
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<number[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  // Audio state
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingSection, setCurrentPlayingSection] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // PDF state
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const getFullArabicText = () => {
    return ISTIKHARA_DUA.sections.map(s => s.arabic).join('\n');
  };

  const toggleNote = (id: number) => {
    setExpandedNotes(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const handleGenerateAudio = async (text: string, sectionId?: number) => {
    setGeneratingAudio(true);
    if (sectionId !== undefined) {
      setCurrentPlayingSection(sectionId);
    }

    try {
      const response = await generateTTSAudio(text, 'arabic');

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingSection(null);
      };
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      await audio.play();

      toast.success('Playing audio');
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingSection(null);
  };

  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const fontData = await loadArabicFontForPDF();
      if (fontData) {
        doc.addFileToVFS('NotoNaskhArabic-Regular.ttf', fontData);
        doc.addFont('NotoNaskhArabic-Regular.ttf', 'NotoNaskhArabic', 'normal');
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Salatul Istikhara', pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('The Guidance Prayer', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Steps section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('How to Perform Istikhara:', margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      ISTIKHARA_STEPS.forEach((step, index) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${step.title}`, margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(step.description, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 5;
      });

      // New page for dua
      doc.addPage();
      y = margin;

      // Dua Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Dua al-Istikhara', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Source
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Source: ${ISTIKHARA_DUA.source}`, pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Dua sections
      ISTIKHARA_DUA.sections.forEach((section) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = margin;
        }

        // Arabic
        if (fontData) {
          doc.setFont('NotoNaskhArabic', 'normal');
          doc.setFontSize(16);
          doc.text(section.arabic, pageWidth - margin, y, { align: 'right' });
        }
        y += 10;

        // Transliteration
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text(toPdfSafeTransliteration(section.transliteration), margin, y);
        y += 6;

        // English
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const engLines = doc.splitTextToSize(section.english, pageWidth - margin * 2);
        doc.text(engLines, margin, y);
        y += engLines.length * 4 + 8;
      });

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Generated by Talbiyah.ai', pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save('istikhara-prayer-guide.pdf');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-blue-100 hover:text-white mb-4"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Compass className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Salatul Istikhara</h1>
              <p className="text-blue-200 text-lg font-arabic">صلاة الاستخارة</p>
            </div>
          </div>

          <p className="text-blue-100 mt-2">
            The prayer for seeking Allah's guidance in making decisions
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => handleGenerateAudio(getFullArabicText())}
              disabled={generatingAudio}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              {generatingAudio && !currentPlayingSection ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying && !currentPlayingSection ? (
                <Volume2 size={18} className="animate-pulse" />
              ) : (
                <Volume2 size={18} />
              )}
              {isPlaying ? 'Playing...' : 'Play Full Dua'}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              {generatingPdf ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Download PDF
            </button>

            {isPlaying && (
              <button
                onClick={stopPlayback}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 bg-blue-700/50 rounded-lg p-1">
            {[
              { id: 'learn' as const, label: 'How to Pray', icon: BookOpen },
              { id: 'dua' as const, label: 'The Dua', icon: Heart },
              { id: 'faq' as const, label: 'FAQ', icon: HelpCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700'
                    : 'text-blue-100 hover:bg-blue-600/50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Learn Tab - Step by Step Instructions */}
        {activeTab === 'learn' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">When to Pray Istikhara?</h3>
              <p className="text-blue-700 text-sm">
                Pray Istikhara when you need to make a decision between permissible options and feel uncertain about which is best for you.
                It can be prayed for marriage, jobs, moving, purchases, or any lawful matter where you seek Allah's guidance.
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Step-by-Step Guide</h2>

            {ISTIKHARA_STEPS.map((step) => (
              <div
                key={step.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold">{step.id}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  {expandedStep === step.id ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </button>

                {expandedStep === step.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="ml-14 pl-4 border-l-2 border-blue-200">
                      <p className="text-gray-700">{step.description}</p>

                      {step.id === 3 && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Recommended Surahs:</strong><br />
                            1st Rak'ah: Al-Fatiha + Al-Kafirun (109)<br />
                            2nd Rak'ah: Al-Fatiha + Al-Ikhlas (112)
                          </p>
                        </div>
                      )}

                      {step.id === 4 && (
                        <button
                          onClick={() => setActiveTab('dua')}
                          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                        >
                          <BookOpen size={16} />
                          View the Dua
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Important Note */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-6">
              <div className="flex gap-3">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-emerald-800 mb-1">After Istikhara</h3>
                  <p className="text-emerald-700 text-sm">
                    After making Istikhara, proceed with what you feel inclined toward and trust in Allah.
                    If the matter is good for you, Allah will make it easy. If not, He will turn you away from it
                    or put obstacles in your path. Have full trust in His wisdom.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dua Tab */}
        {activeTab === 'dua' && (
          <div className="space-y-4">
            {/* Display options */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setShowTransliteration(!showTransliteration)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  showTransliteration
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Transliteration
              </button>
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  showTranslation
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Translation
              </button>
            </div>

            {/* Hadith source */}
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600 italic">"{ISTIKHARA_DUA.hadith}"</p>
              <p className="text-xs text-gray-500 mt-2">— {ISTIKHARA_DUA.source}</p>
            </div>

            {/* Dua sections */}
            <div className="space-y-3">
              {ISTIKHARA_DUA.sections.map((section) => (
                <div
                  key={section.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    section.isPlaceholder ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    {/* Arabic */}
                    <p className="text-2xl font-arabic text-right leading-loose text-gray-900 mb-3" dir="rtl">
                      {section.arabic}
                    </p>

                    {/* Transliteration */}
                    {showTransliteration && (
                      <p className="text-gray-600 italic mb-2">{section.transliteration}</p>
                    )}

                    {/* English */}
                    {showTranslation && (
                      <p className="text-gray-800">{section.english}</p>
                    )}

                    {/* Note */}
                    {section.note && (
                      <button
                        onClick={() => toggleNote(section.id)}
                        className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        {expandedNotes.includes(section.id) ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        {section.isPlaceholder ? 'Important' : 'Note'}
                      </button>
                    )}

                    {expandedNotes.includes(section.id) && section.note && (
                      <p className={`mt-2 text-sm p-2 rounded ${
                        section.isPlaceholder ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {section.note}
                      </p>
                    )}
                  </div>

                  {/* Play button for this section */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleGenerateAudio(section.arabic, section.id)}
                      disabled={generatingAudio}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                    >
                      {generatingAudio && currentPlayingSection === section.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : currentPlayingSection === section.id && isPlaying ? (
                        <Volume2 size={14} className="animate-pulse" />
                      ) : (
                        <Volume2 size={14} />
                      )}
                      Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Common Questions</h2>

            {/* Misconceptions */}
            <div className="space-y-3">
              {MISCONCEPTIONS.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Myth: {item.myth}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-gray-700">Reality: {item.reality}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional FAQs */}
            <div className="mt-6 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">What if I still feel uncertain after Istikhara?</h3>
                <p className="text-gray-700 text-sm">
                  You can repeat Istikhara multiple times. Some scholars recommend praying it for 7 days if still uncertain.
                  Eventually, proceed with what seems most reasonable and trust in Allah's plan.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Can I pray Istikhara for marriage?</h3>
                <p className="text-gray-700 text-sm">
                  Yes, Istikhara is highly recommended for major life decisions like marriage.
                  Pray it when considering a potential spouse, asking Allah to guide you to what is best.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">When is the best time to pray Istikhara?</h3>
                <p className="text-gray-700 text-sm">
                  Istikhara can be prayed at any time except the forbidden times for prayer.
                  However, the last third of the night (before Fajr) is considered especially blessed for all supplications.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Should I pray Istikhara before or after researching my options?</h3>
                <p className="text-gray-700 text-sm">
                  It's recommended to research and gather information first, then pray Istikhara.
                  Use both the means Allah has given you (knowledge, consultation) and spiritual guidance (Istikhara).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentPlayingSection(null);
          }}
          className="hidden"
        />
      )}
    </div>
  );
}
