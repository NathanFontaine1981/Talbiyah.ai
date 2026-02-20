/**
 * Qunut Dua Practice Page
 * Learn and practice the Qunut dua for Witr prayer
 * Features: Arabic text, transliteration, translation, audio, PDF download
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTTSAudio } from '../lib/ttsHelper';
import {
  ChevronLeft,
  Volume2,
  Pause,
  Play,
  Download,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Repeat,
  Loader2,
  Check,
  Moon,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// The Qunut Dua - authentic version from the Sunnah
const QUNUT_DUA = {
  title: 'Dua al-Qunut',
  titleArabic: 'دعاء القنوت',
  description: 'The supplication recited during Witr prayer, taught by the Prophet ﷺ to his grandson Al-Hasan ibn Ali',
  source: 'Sunan Abu Dawud, Sunan An-Nasa\'i, Sunan At-Tirmidhi',

  // Full dua broken into sections for learning
  sections: [
    {
      id: 1,
      arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ',
      transliteration: 'Allāhumma-hdinī fīman hadayt',
      english: 'O Allah, guide me among those You have guided',
      note: 'Asking Allah for guidance'
    },
    {
      id: 2,
      arabic: 'وَعَافِنِي فِيمَنْ عَافَيْتَ',
      transliteration: 'wa ʿāfinī fīman ʿāfayt',
      english: 'and grant me well-being among those You have granted well-being',
      note: 'Asking for protection from harm'
    },
    {
      id: 3,
      arabic: 'وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ',
      transliteration: 'wa tawallanī fīman tawallayt',
      english: 'and take me into Your care among those You have taken into Your care',
      note: 'Asking for Allah\'s guardianship'
    },
    {
      id: 4,
      arabic: 'وَبَارِكْ لِي فِيمَا أَعْطَيْتَ',
      transliteration: 'wa bārik lī fīmā aʿṭayt',
      english: 'and bless me in what You have given',
      note: 'Asking for barakah in provisions'
    },
    {
      id: 5,
      arabic: 'وَقِنِي شَرَّ مَا قَضَيْتَ',
      transliteration: 'wa qinī sharra mā qaḍayt',
      english: 'and protect me from the evil of what You have decreed',
      note: 'Seeking protection from harm in destiny'
    },
    {
      id: 6,
      arabic: 'فَإِنَّكَ تَقْضِي وَلَا يُقْضَىٰ عَلَيْكَ',
      transliteration: 'fa innaka taqḍī wa lā yuqḍā ʿalayk',
      english: 'For indeed, You decree and none can decree over You',
      note: 'Affirming Allah\'s absolute authority'
    },
    {
      id: 7,
      arabic: 'وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ',
      transliteration: 'wa innahu lā yadhillu man wālayt',
      english: 'Indeed, none whom You have taken as an ally can be humiliated',
      note: 'The honor of being allied with Allah'
    },
    {
      id: 8,
      arabic: 'وَلَا يَعِزُّ مَنْ عَادَيْتَ',
      transliteration: 'wa lā yaʿizzu man ʿādayt',
      english: 'and none whom You have taken as an enemy can be honored',
      note: 'The disgrace of opposing Allah'
    },
    {
      id: 9,
      arabic: 'تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ',
      transliteration: 'tabārakta rabbanā wa taʿālayt',
      english: 'Blessed are You, our Lord, and Exalted',
      note: 'Praising and glorifying Allah'
    }
  ],

  // Additional parts that can be added
  additions: [
    {
      id: 'salawat',
      arabic: 'وَصَلَّى اللهُ عَلَى النَّبِيِّ مُحَمَّدٍ',
      transliteration: 'wa ṣallallāhu ʿalan-nabiyyi Muḥammad',
      english: 'And may Allah send blessings upon the Prophet Muhammad',
      note: 'Some scholars recommend adding this at the end'
    }
  ]
};

// Convert transliteration to PDF-safe ASCII characters
// The special Unicode characters (ʿ, ā, ī, ṭ, etc.) don't render in Helvetica font
function toPdfSafeTransliteration(text: string): string {
  return text
    // Ayn and hamza
    .replace(/ʿ/g, "'")
    .replace(/ʾ/g, "'")
    // Long vowels
    .replace(/ā/g, 'aa')
    .replace(/ī/g, 'ee')
    .replace(/ū/g, 'oo')
    // Emphatic consonants
    .replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd')
    .replace(/ṣ/g, 's')
    .replace(/ẓ/g, 'z')
    .replace(/ḥ/g, 'h')
    // Other special characters
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

export default function QunutPractice() {
  const navigate = useNavigate();
  const [practiceMode, setPracticeMode] = useState<'full' | 'line-by-line'>('full');
  const [currentLine, setCurrentLine] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [includeAdditions, setIncludeAdditions] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<number[]>([]);

  // Audio state
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingSection, setCurrentPlayingSection] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // PDF state
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const allSections = includeAdditions
    ? [...QUNUT_DUA.sections, ...QUNUT_DUA.additions.map((a, i) => ({ ...a, id: 100 + i }))]
    : QUNUT_DUA.sections;

  const getFullArabicText = () => {
    return allSections.map(s => s.arabic).join('\n');
  };

  const getFullTransliteration = () => {
    return allSections.map(s => s.transliteration).join('\n');
  };

  const getFullEnglish = () => {
    return allSections.map(s => s.english).join('\n');
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

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
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

      // Load Arabic font
      const fontData = await loadArabicFontForPDF();
      if (fontData) {
        doc.addFileToVFS('NotoNaskhArabic-Regular.ttf', fontData);
        doc.addFont('NotoNaskhArabic-Regular.ttf', 'NotoNaskhArabic', 'normal');
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 25;

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Dua al-Qunut', pageWidth / 2, y, { align: 'center' });
      y += 8;

      // Arabic title
      if (fontData) {
        doc.setFont('NotoNaskhArabic', 'normal');
        doc.setFontSize(20);
        doc.text('دعاء القنوت', pageWidth / 2, y, { align: 'center' });
      }
      y += 10;

      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('For Witr Prayer - Taught by Prophet Muhammad ﷺ', pageWidth / 2, y, { align: 'center' });
      y += 15;

      doc.setTextColor(0, 0, 0);

      // Each section
      allSections.forEach((section, index) => {
        // Check if we need a new page
        if (y > 260) {
          doc.addPage();
          y = 25;
        }

        // Section number
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); // emerald color
        doc.text(`${index + 1}.`, margin, y);

        // Arabic text
        if (fontData) {
          doc.setFont('NotoNaskhArabic', 'normal');
          doc.setFontSize(16);
          doc.setTextColor(0, 0, 0);
          doc.text(section.arabic, pageWidth - margin, y, { align: 'right' });
        }
        y += 10;

        // Transliteration (converted to PDF-safe ASCII)
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(toPdfSafeTransliteration(section.transliteration), margin, y);
        y += 7;

        // English
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const englishLines = doc.splitTextToSize(section.english, pageWidth - margin * 2);
        doc.text(englishLines, margin, y);
        y += englishLines.length * 5 + 10;
      });

      // Footer
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Source: ${QUNUT_DUA.source}`, margin, y);
      y += 5;
      doc.text('Generated by Talbiyah.ai', margin, y);

      // Save
      doc.save('qunut-dua-witr-prayer.pdf');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const goToNextLine = () => {
    if (currentLine < allSections.length - 1) {
      setCurrentLine(currentLine + 1);
    }
  };

  const goToPrevLine = () => {
    if (currentLine > 0) {
      setCurrentLine(currentLine - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg"
      >
        Skip to dua content
      </a>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <Moon className="text-amber-600" size={20} />
              <span className="font-semibold text-gray-900">Witr Prayer</span>
            </div>
            <div className="w-16" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-sm mb-4">
            <Star size={14} />
            Essential Dua for Witr Prayer
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{QUNUT_DUA.title}</h1>
          <p className="text-2xl font-arabic text-amber-600 mb-4">{QUNUT_DUA.titleArabic}</p>
          <p className="text-gray-500 max-w-2xl mx-auto">{QUNUT_DUA.description}</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Mode Toggle */}
            <div className="flex gap-2" role="group" aria-label="Practice mode">
              <button
                onClick={() => setPracticeMode('full')}
                aria-pressed={practiceMode === 'full'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  practiceMode === 'full'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BookOpen size={16} className="inline mr-2" />
                Full View
              </button>
              <button
                onClick={() => setPracticeMode('line-by-line')}
                aria-pressed={practiceMode === 'line-by-line'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  practiceMode === 'line-by-line'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Repeat size={16} className="inline mr-2" />
                Line by Line
              </button>
            </div>

            {/* Options */}
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTransliteration}
                  onChange={(e) => setShowTransliteration(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-amber-500 focus:ring-amber-500"
                />
                Transliteration
              </label>
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTranslation}
                  onChange={(e) => setShowTranslation(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-amber-500 focus:ring-amber-500"
                />
                Translation
              </label>
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAdditions}
                  onChange={(e) => setIncludeAdditions(e.target.checked)}
                  className="rounded border-gray-300 bg-white text-amber-500 focus:ring-amber-500"
                />
                Include Salawat
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => handleGenerateAudio(getFullArabicText())}
            disabled={generatingAudio}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {generatingAudio && !currentPlayingSection ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isPlaying && !currentPlayingSection ? (
              <Pause size={18} />
            ) : (
              <Volume2 size={18} />
            )}
            {isPlaying && !currentPlayingSection ? 'Playing...' : 'Play Full Dua'}
          </button>

          {isPlaying && (
            <button
              onClick={stopPlayback}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Stop
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {generatingPdf ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download PDF
          </button>
        </div>

        {/* Full View Mode */}
        {practiceMode === 'full' && (
          <div className="space-y-4">
            {allSections.map((section, index) => (
              <div
                key={section.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-3">
                    {/* Arabic */}
                    <p className="text-2xl font-arabic text-gray-900 text-right leading-loose" dir="rtl">
                      {section.arabic}
                    </p>

                    {/* Transliteration */}
                    {showTransliteration && (
                      <p className="text-gray-500 italic">{section.transliteration}</p>
                    )}

                    {/* Translation */}
                    {showTranslation && (
                      <p className="text-gray-700">{section.english}</p>
                    )}

                    {/* Note toggle */}
                    {'note' in section && section.note && (
                      <button
                        onClick={() => toggleNote(section.id as number)}
                        aria-expanded={expandedNotes.includes(section.id as number)}
                        className="text-sm text-amber-600 hover:text-amber-500 flex items-center gap-1"
                      >
                        {expandedNotes.includes(section.id as number) ? (
                          <>
                            <ChevronUp size={14} /> Hide explanation
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> Show explanation
                          </>
                        )}
                      </button>
                    )}

                    {expandedNotes.includes(section.id as number) && 'note' in section && (
                      <p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-3">
                        {section.note}
                      </p>
                    )}
                  </div>

                  {/* Play this line */}
                  <button
                    onClick={() => handleGenerateAudio(section.arabic, section.id as number)}
                    disabled={generatingAudio}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    aria-label={`Play line ${index + 1} audio`}
                  >
                    {generatingAudio && currentPlayingSection === section.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : currentPlayingSection === section.id && isPlaying ? (
                      <Pause size={18} className="text-emerald-600" />
                    ) : (
                      <Volume2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Line by Line Mode */}
        {practiceMode === 'line-by-line' && (
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-500 text-sm">
                Line {currentLine + 1} of {allSections.length}
              </span>
              <div className="flex gap-1" role="group" aria-label="Line navigation">
                {allSections.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentLine(i)}
                    aria-label={`Go to line ${i + 1}${i === currentLine ? ' (current)' : i < currentLine ? ' (completed)' : ''}`}
                    aria-current={i === currentLine ? 'step' : undefined}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i === currentLine
                        ? 'bg-amber-500'
                        : i < currentLine
                        ? 'bg-emerald-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Current Line */}
            <div className="text-center space-y-6 py-8">
              <p className="text-3xl md:text-4xl font-arabic text-gray-900 leading-loose" dir="rtl">
                {allSections[currentLine].arabic}
              </p>

              {showTransliteration && (
                <p className="text-xl text-gray-500 italic">
                  {allSections[currentLine].transliteration}
                </p>
              )}

              {showTranslation && (
                <p className="text-lg text-gray-700">
                  {allSections[currentLine].english}
                </p>
              )}

              {/* Play current line */}
              <button
                onClick={() => handleGenerateAudio(allSections[currentLine].arabic, allSections[currentLine].id as number)}
                disabled={generatingAudio}
                className="mx-auto flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {generatingAudio ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Volume2 size={20} />
                )}
                Play This Line
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={goToPrevLine}
                disabled={currentLine === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              {currentLine === allSections.length - 1 ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check size={20} />
                  Complete!
                </div>
              ) : (
                <button
                  onClick={goToNextLine}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400"
                >
                  Next
                  <ChevronLeft size={20} className="rotate-180" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Source & Info */}
        <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
          <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
            <FileText size={18} className="text-amber-600" />
            About Dua al-Qunut
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong className="text-gray-800">When to recite:</strong> The Qunut dua is recited during Witr prayer,
              either before or after the ruku' (bowing) in the final rak'ah. Most scholars recommend raising the hands while reciting it.
            </p>
            <p>
              <strong className="text-gray-800">Source:</strong> {QUNUT_DUA.source}
            </p>
            <p>
              <strong className="text-gray-800">Tip:</strong> Start by memorizing one line at a time.
              Use the "Line by Line" mode to practice each phrase with its meaning.
            </p>
          </div>
        </div>
      </main>

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
