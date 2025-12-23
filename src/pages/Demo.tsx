import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Brain, Lightbulb, FileText, CheckCircle, HelpCircle, Bookmark, ChevronDown, ChevronUp, Layers, Languages, BookMarked, ScrollText } from 'lucide-react';

// FlipCard component for vocabulary flashcards
function FlipCard({ word }: { word: { arabic: string; transliteration: string; meaning: string } }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="cursor-pointer h-32 perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front - Arabic */}
        <div
          className="absolute w-full h-full bg-white rounded-xl p-4 border-2 border-emerald-200 hover:border-emerald-400 transition flex flex-col items-center justify-center shadow-sm"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-4xl font-arabic text-emerald-700 mb-1 text-center leading-relaxed" dir="rtl">{word.arabic}</p>
          <p className="text-sm text-gray-500 italic">{word.transliteration}</p>
          <p className="text-xs text-gray-400 mt-2">Tap to flip</p>
        </div>

        {/* Back - English */}
        <div
          className="absolute w-full h-full bg-emerald-50 rounded-xl p-4 border-2 border-emerald-300 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-lg font-medium text-emerald-800 text-center">{word.meaning}</p>
          <p className="text-sm text-gray-600 italic mt-1">{word.transliteration}</p>
        </div>
      </div>
    </div>
  );
}

type CourseType = 'quran' | 'arabic' | null;

export default function Demo() {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<CourseType>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['verses', 'flashcards', 'lessons', 'tafsir']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Course Selection Screen
  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-gray-900">Talbiyah Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              See the Smart-Track Engine in Action
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose a subject to see real AI-generated study notes from actual lessons
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Quran Option */}
            <button
              onClick={() => setSelectedCourse('quran')}
              className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-emerald-500 transition-all duration-300 text-left hover:shadow-lg"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition">
                <BookMarked className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Qur'an with Tafsir</h2>
              <p className="text-gray-600 mb-4">
                Surah An-Naziat (79) - The Extractors
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Verses</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Tafsir</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Tadabbur</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Vocabulary</span>
              </div>
            </button>

            {/* Arabic Option */}
            <button
              onClick={() => setSelectedCourse('arabic')}
              className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 text-left hover:shadow-lg"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition">
                <Languages className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Arabic Language</h2>
              <p className="text-gray-600 mb-4">
                Conversational Arabic - Daily Activities
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Grammar</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Vocabulary</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Conversation</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Practice</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quran Demo (An-Naziat)
  if (selectedCourse === 'quran') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Selection</span>
              </button>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-gray-900">Talbiyah Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-medium">
              Sample Study Notes from a Real Lesson on Surah An-Naziat
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Title Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Qur'an Insights: An-Naziat (1-14)</h1>
                <p className="text-gray-500">Surah 79 - The Extractors (النَّازِعَات)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Teacher</p>
                <p className="font-medium text-gray-900">Abdullah Abbass</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Student</p>
                <p className="font-medium text-gray-900">Nathan Fontaine</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Class Type</p>
                <p className="font-medium text-gray-900">Tafsir & Tadabbur</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                <p className="font-medium text-gray-900">Dec 15, 2025</p>
              </div>
            </div>
          </div>

          {/* Verses Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <button
              onClick={() => toggleSection('verses')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Verses Covered (Arabic & Translation)</span>
              </div>
              {expandedSections.includes('verses') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.includes('verses') && (
              <div className="p-6 space-y-4">
                {[
                  { num: 1, arabic: 'وَٱلنَّـٰزِعَـٰتِ غَرْقًا', translation: 'By those [angels] who extract with violence' },
                  { num: 2, arabic: 'وَٱلنَّـٰشِطَـٰتِ نَشْطًا', translation: 'And [by] those who remove with ease' },
                  { num: 3, arabic: 'وَٱلسَّـٰبِحَـٰتِ سَبْحًا', translation: 'And [by] those who glide [as if] swimming' },
                  { num: 4, arabic: 'فَٱلسَّـٰبِقَـٰتِ سَبْقًا', translation: 'And those who race each other in a race' },
                  { num: 5, arabic: 'فَٱلْمُدَبِّرَٰتِ أَمْرًا', translation: 'And those who arrange [each] matter' },
                  { num: 6, arabic: 'يَوْمَ تَرْجُفُ ٱلرَّاجِفَةُ', translation: 'On the Day the blast [of the Horn] will convulse [creation]' },
                  { num: 7, arabic: 'تَتْبَعُهَا ٱلرَّادِفَةُ', translation: 'There will follow it the subsequent [one]' },
                ].map((verse) => (
                  <div key={verse.num} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {verse.num}
                      </span>
                      <div className="flex-1">
                        <p className="text-xl sm:text-2xl text-right font-arabic leading-loose text-gray-900 mb-3" dir="rtl">
                          {verse.arabic}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {verse.translation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-gray-400 text-sm">... and 7 more verses in the full notes</p>
              </div>
            )}
          </div>

          {/* Tafsir Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-purple-200 mb-6 overflow-hidden">
            <button
              onClick={() => toggleSection('tafsir')}
              className="w-full px-6 py-4 flex items-center justify-between bg-purple-50 hover:bg-purple-100 transition"
            >
              <div className="flex items-center space-x-3">
                <ScrollText className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Tafsir & Context</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Scholar Insights</span>
              </div>
              {expandedSections.includes('tafsir') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.includes('tafsir') && (
              <div className="p-6 space-y-6">
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <h4 className="font-semibold text-purple-800 mb-3">Historical Context</h4>
                  <p className="text-gray-700 leading-relaxed">
                    Surah An-Naziat was revealed in the early Meccan period when the disbelievers denied the concept of resurrection. The surah presents powerful imagery of the Day of Judgment to awaken hearts to the reality of the Hereafter.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Verses 1-5: The Oaths</h4>
                  <div className="bg-white border border-purple-100 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed mb-3">
                      <strong>Ibn Kathir explains:</strong> These verses describe the angels who extract the souls of the disbelievers with difficulty (النَّازِعَات), compared to pulling something deeply embedded. In contrast, the angels gently remove the souls of the believers (النَّاشِطَات).
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>As-Sa'di notes:</strong> The "swimming" (السَّابِحَات) refers to angels descending swiftly through the heavens, and "racing" (السَّابِقَات) describes their eagerness to fulfill Allah's commands.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Verses 6-7: The Two Blasts</h4>
                  <div className="bg-white border border-purple-100 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">
                      <strong>The Rajifa and Radifa:</strong> These refer to the two blasts of the trumpet. The first blast (الرَّاجِفَة) causes all creation to die, while the second (الرَّادِفَة) resurrects all for judgment. Ibn Abbas reported this is the same as mentioned in Surah Az-Zumar: "And the Horn will be blown, and whoever is in the heavens and whoever is on the earth will fall dead."
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-amber-800 text-sm">
                    <strong>Teacher's Note:</strong> The powerful imagery in these verses is designed to shake the heart from heedlessness. Reflect on how these descriptions prepare us mentally for the reality of the Day of Judgment.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Flashcards */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 mb-6 overflow-hidden">
            <button
              onClick={() => toggleSection('flashcards')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">Focus Words</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">6 words</span>
              </div>
              {expandedSections.includes('flashcards') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.includes('flashcards') && (
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Tap any card to reveal the English meaning. Great for memorization practice!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { arabic: 'النَّازِعَات', transliteration: 'an-nāzi\'āt', meaning: 'Those who extract (angels)' },
                    { arabic: 'غَرْقًا', transliteration: 'gharqan', meaning: 'With violence/deeply' },
                    { arabic: 'النَّاشِطَات', transliteration: 'an-nāshiṭāt', meaning: 'Those who remove gently' },
                    { arabic: 'السَّابِحَات', transliteration: 'as-sābiḥāt', meaning: 'Those who glide/swim' },
                    { arabic: 'الرَّاجِفَة', transliteration: 'ar-rājifah', meaning: 'The convulsion (first blast)' },
                    { arabic: 'الرَّادِفَة', transliteration: 'ar-rādifah', meaning: 'The subsequent (second blast)' },
                  ].map((word, i) => (
                    <FlipCard key={i} word={word} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lessons & Tadabbur */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <button
              onClick={() => toggleSection('lessons')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center space-x-3">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-gray-900">Lessons & Tadabbur Points</span>
              </div>
              {expandedSections.includes('lessons') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.includes('lessons') && (
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    "The manner of death reflects the state of the soul - The violent extraction for disbelievers vs. gentle removal for believers should motivate us to prepare our souls.",
                    "Angels are busy servants of Allah - They race to fulfill His commands without delay or hesitation, teaching us about obedience and eagerness in worship.",
                    "The Day of Judgment is a certainty - The detailed description of the two blasts serves as a powerful reminder that resurrection is not a myth.",
                    "Allah swears by His creation to emphasize truth - When Allah takes oaths by His creation, it draws our attention to reflect on their significance.",
                    "Fear of the Hereafter should lead to action - This surah was revealed to shake the hearts of the deniers and guide them to the truth.",
                  ].map((lesson, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 leading-relaxed">{lesson}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reflection Questions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <button
              onClick={() => toggleSection('reflection')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Reflection Questions</span>
              </div>
              {expandedSections.includes('reflection') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.includes('reflection') && (
              <div className="p-6">
                <div className="space-y-3">
                  {[
                    "How am I preparing my soul for the moment the angel comes to extract it?",
                    "Do I approach my acts of worship with the same eagerness as the angels racing to obey Allah?",
                    "When I hear about the Day of Judgment, does it create genuine fear and urgency in my heart?",
                    "What practical changes can I make today knowing that the two blasts are inevitable?",
                  ].map((question, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-gray-700">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* First Word Prompter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <button
              onClick={() => toggleSection('prompter')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center space-x-3">
                <Bookmark className="w-5 h-5 text-rose-500" />
                <span className="font-semibold text-gray-900">First Word Prompter (Memorization Aid)</span>
              </div>
              {expandedSections.includes('prompter') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.includes('prompter') && (
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4">
                  Use this for memorization practice - see the first word and try to recall the complete ayah!
                </p>
                <div className="grid gap-2">
                  {[
                    { num: 1, word: 'وَٱلنَّـٰزِعَـٰتِ', trans: 'wan-nāzi\'āt', hint: 'By those who extract...' },
                    { num: 2, word: 'وَٱلنَّـٰشِطَـٰتِ', trans: 'wan-nāshiṭāt', hint: 'And those who remove...' },
                    { num: 3, word: 'وَٱلسَّـٰبِحَـٰتِ', trans: 'was-sābiḥāt', hint: 'And those who glide...' },
                    { num: 4, word: 'فَٱلسَّـٰبِقَـٰتِ', trans: 'fas-sābiqāt', hint: 'And those who race...' },
                    { num: 5, word: 'فَٱلْمُدَبِّرَٰتِ', trans: 'fal-mudabbirāt', hint: 'And those who arrange...' },
                  ].map((item) => (
                    <div key={item.num} className="flex items-center gap-4 p-3 bg-rose-50 rounded-lg border border-rose-100">
                      <span className="w-8 h-8 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {item.num}
                      </span>
                      <span className="text-xl font-arabic text-rose-800">{item.word}</span>
                      <span className="text-gray-500 text-sm italic">{item.trans}</span>
                      <span className="text-gray-400 text-sm ml-auto">{item.hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">Get Your Own Personalised Notes</h2>
            <p className="text-emerald-100 mb-6 max-w-md mx-auto">
              Every lesson you take generates study notes tailored to your actual conversation with your teacher.
            </p>
            <button
              onClick={() => navigate('/diagnostic')}
              className="px-8 py-3 bg-white text-emerald-600 rounded-full font-semibold hover:bg-emerald-50 transition shadow-lg"
            >
              Start Your Free Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Arabic Demo
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedCourse(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Selection</span>
            </button>
            <div className="flex items-center space-x-2">
              <Languages className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Talbiyah Insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-medium">
            Sample Study Notes from a Real Arabic Language Lesson
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Title Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Languages className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Arabic Language: Daily Activities</h1>
              <p className="text-gray-500">Conversational Arabic - Present Tense Verbs</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Teacher</p>
              <p className="font-medium text-gray-900">Ustadh Ahmad</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Student</p>
              <p className="font-medium text-gray-900">Sarah Johnson</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Level</p>
              <p className="font-medium text-gray-900">Intermediate</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
              <p className="font-medium text-gray-900">Dec 18, 2025</p>
            </div>
          </div>
        </div>

        {/* Grammar Focus Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('grammar')}
            className="w-full px-6 py-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition"
          >
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Grammar Focus</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Present Tense</span>
            </div>
            {expandedSections.includes('grammar') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.includes('grammar') && (
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3">Today's Grammar: Present Tense (المضارع)</h4>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The present tense in Arabic is formed by adding prefixes to the root. The pattern يَفْعَلُ (yaf'alu) is used for Form I verbs.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Conjugation Pattern for "to write" (كَتَبَ):</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">I write:</span><span className="font-arabic text-blue-800">أَكْتُبُ</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">You (m) write:</span><span className="font-arabic text-blue-800">تَكْتُبُ</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">You (f) write:</span><span className="font-arabic text-blue-800">تَكْتُبِينَ</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">He writes:</span><span className="font-arabic text-blue-800">يَكْتُبُ</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">She writes:</span><span className="font-arabic text-blue-800">تَكْتُبُ</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">We write:</span><span className="font-arabic text-blue-800">نَكْتُبُ</span></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Key Grammar Points Covered:</h4>
                {[
                  "Present tense prefixes: أ (I), ت (you/she), ي (he), ن (we)",
                  "The sukoon on the middle letter indicates Form I pattern",
                  "Adding ين (-īn) at the end makes it feminine 'you'",
                  "Context determines whether تَكْتُبُ means 'you write' or 'she writes'"
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vocabulary Flashcards */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('flashcards')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-900">New Vocabulary</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">8 words</span>
            </div>
            {expandedSections.includes('flashcards') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.includes('flashcards') && (
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Tap any card to reveal the English meaning. Great for memorization practice!
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { arabic: 'يَأْكُلُ', transliteration: "ya'kulu", meaning: 'He eats' },
                  { arabic: 'يَشْرَبُ', transliteration: 'yashrabu', meaning: 'He drinks' },
                  { arabic: 'يَنَامُ', transliteration: 'yanāmu', meaning: 'He sleeps' },
                  { arabic: 'يَذْهَبُ', transliteration: 'yadhhabu', meaning: 'He goes' },
                  { arabic: 'يَقْرَأُ', transliteration: "yaqra'u", meaning: 'He reads' },
                  { arabic: 'يَكْتُبُ', transliteration: 'yaktubu', meaning: 'He writes' },
                  { arabic: 'يَتَكَلَّمُ', transliteration: 'yatakallamu', meaning: 'He speaks' },
                  { arabic: 'يَسْمَعُ', transliteration: "yasma'u", meaning: 'He hears' },
                ].map((word, i) => (
                  <FlipCard key={i} word={word} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversation Practice */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('conversation')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">Conversation Practice</span>
            </div>
            {expandedSections.includes('conversation') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.includes('conversation') && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">Practice these dialogues from today's lesson:</p>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded font-semibold">A</span>
                    <div>
                      <p className="font-arabic text-lg text-gray-900" dir="rtl">ماذا تَفْعَلُ كُلَّ يَوْم؟</p>
                      <p className="text-sm text-gray-600 italic">What do you do every day?</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded font-semibold">B</span>
                    <div>
                      <p className="font-arabic text-lg text-gray-900" dir="rtl">أَذْهَبُ إلى العَمَل وأَقْرَأُ الكُتُب</p>
                      <p className="text-sm text-gray-600 italic">I go to work and I read books</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded font-semibold">A</span>
                    <div>
                      <p className="font-arabic text-lg text-gray-900" dir="rtl">هَلْ تَتَكَلَّمُ العَرَبِيَّة؟</p>
                      <p className="text-sm text-gray-600 italic">Do you speak Arabic?</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded font-semibold">B</span>
                    <div>
                      <p className="font-arabic text-lg text-gray-900" dir="rtl">نَعَم، أَتَعَلَّمُ العَرَبِيَّة كُلَّ أُسْبوع</p>
                      <p className="text-sm text-gray-600 italic">Yes, I learn Arabic every week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lessons Learned */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('lessons')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-gray-900">Key Takeaways</span>
            </div>
            {expandedSections.includes('lessons') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.includes('lessons') && (
            <div className="p-6">
              <div className="space-y-4">
                {[
                  "Mastered the present tense conjugation for 8 common verbs of daily activities",
                  "Can now form basic questions using هَل (hal) and ماذا (mādhā)",
                  "Learned to connect sentences using و (and) for more complex descriptions",
                  "Practiced pronunciation focus: distinguishing ع from ء in يَسْمَعُ and يَقْرَأُ",
                  "Built vocabulary around daily routine: eating, sleeping, going, reading, writing",
                ].map((lesson, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 leading-relaxed">{lesson}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Homework */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection('homework')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <Bookmark className="w-5 h-5 text-rose-500" />
              <span className="font-semibold text-gray-900">Homework Assignments</span>
            </div>
            {expandedSections.includes('homework') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.includes('homework') && (
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { task: "Write 5 sentences describing your daily routine using present tense verbs", type: "Writing" },
                  { task: "Practice conjugating يَذْهَبُ for all pronouns (I, you, he, she, we, they)", type: "Grammar" },
                  { task: "Record yourself reading the conversation dialogues out loud", type: "Speaking" },
                  { task: "Create flashcards for the 8 vocabulary words and review daily", type: "Vocabulary" },
                  { task: "Listen to the audio recording of the lesson at least 3 times", type: "Listening" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center">
                      <span className="text-rose-700 font-bold text-sm">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{item.task}</p>
                    </div>
                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full">{item.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Get Your Own Personalised Notes</h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Every lesson you take generates study notes tailored to your actual conversation with your teacher.
          </p>
          <button
            onClick={() => navigate('/diagnostic')}
            className="px-8 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition shadow-lg"
          >
            Start Your Free Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
