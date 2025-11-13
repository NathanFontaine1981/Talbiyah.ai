import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Download,
  Printer,
  Star,
  ArrowLeft,
  Video,
  Loader,
  AlertTriangle,
  CheckCircle,
  Book,
  Target,
  Lightbulb,
  TrendingUp,
  BookMarked,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

interface LessonInsight {
  id: string;
  lesson_id: string;
  insight_type: string;
  title: string;
  summary: string;
  detailed_insights: {
    content: string;
    subject: string;
    metadata: {
      surah_name?: string;
      surah_number?: number;
      ayah_range?: string;
      teacher_name: string;
      student_names: string[];
      lesson_date: string;
      duration_minutes?: number;
    };
  };
  viewed_by_student: boolean;
  student_rating: number | null;
  created_at: string;
}

interface Lesson {
  scheduled_time: string;
  duration_minutes: number;
  subjects: { name: string };
  teacher_profiles: {
    profiles: { full_name: string };
  };
}

// Quiz interfaces
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct answer
}

interface QuizSection {
  title: string;
  questions: QuizQuestion[];
}

// Helper function to parse quiz questions from markdown
function parseQuizQuestions(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const lines = content.split('\n');
  let currentQuestion: { question: string; options: string[]; correctAnswer: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for question (starts with **Q)
    if (line.match(/^\*\*Q\d+\.\*\*/)) {
      // Save previous question
      if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
      }

      // Extract question text - everything before the first option (A), B), C), or D))
      let questionMatch = line.match(/^\*\*Q\d+\.\*\*\s*(.+?)(?=\s*[A-D]\))/);
      let questionText = questionMatch ? questionMatch[1].trim() : line.replace(/^\*\*Q\d+\.\*\*\s*/, '');

      currentQuestion = {
        question: questionText,
        options: [],
        correctAnswer: -1
      };

      // Check if options are on the same line (inline format)
      const inlineOptionsMatch = line.match(/[A-D]\)[^A-D]+/g);
      if (inlineOptionsMatch && inlineOptionsMatch.length > 0) {
        inlineOptionsMatch.forEach((optMatch) => {
          const optionText = optMatch.replace(/^[A-D]\)\s*/, '');
          const hasCheckmark = optionText.includes('✅');
          const cleanText = optionText.replace(/\s*✅\s*$/, '').trim();

          if (hasCheckmark) {
            currentQuestion!.correctAnswer = currentQuestion!.options.length;
          }

          currentQuestion!.options.push(cleanText);
        });
      }
    }
    // Check for option on separate line (starts with -)
    else if (line.match(/^-\s+[A-D]\)/) && currentQuestion) {
      const optionText = line.replace(/^-\s+[A-D]\)\s*/, '');
      const hasCheckmark = optionText.includes('✅');
      const cleanText = optionText.replace(/\s*✅\s*$/, '').trim();

      if (hasCheckmark) {
        currentQuestion.correctAnswer = currentQuestion.options.length;
      }

      currentQuestion.options.push(cleanText);
    }
    // Check for inline options on next line (without dashes)
    else if (line.match(/^[A-D]\)/) && currentQuestion && currentQuestion.options.length === 0) {
      const inlineOptionsMatch = line.match(/[A-D]\)[^A-D]+/g);
      if (inlineOptionsMatch) {
        inlineOptionsMatch.forEach((optMatch) => {
          const optionText = optMatch.replace(/^[A-D]\)\s*/, '');
          const hasCheckmark = optionText.includes('✅');
          const cleanText = optionText.replace(/\s*✅\s*$/, '').trim();

          if (hasCheckmark) {
            currentQuestion!.correctAnswer = currentQuestion!.options.length;
          }

          currentQuestion!.options.push(cleanText);
        });
      }
    }
  }

  // Add last question
  if (currentQuestion && currentQuestion.options.length > 0) {
    questions.push(currentQuestion);
  }

  return questions;
}

// Interactive Quiz Component
function InteractiveQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});

  const handleAnswerClick = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    setShowResults(prev => ({ ...prev, [questionIndex]: true }));
  };

  const resetQuestion = (questionIndex: number) => {
    setSelectedAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionIndex];
      return newAnswers;
    });
    setShowResults(prev => {
      const newResults = { ...prev };
      delete newResults[questionIndex];
      return newResults;
    });
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qIndex) => {
        const selectedAnswer = selectedAnswers[qIndex];
        const isAnswered = showResults[qIndex];
        const isCorrect = selectedAnswer === q.correctAnswer;

        return (
          <div key={qIndex} className="space-y-3">
            <p className="font-semibold text-gray-900">
              <strong>Q{qIndex + 1}.</strong> {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((option, oIndex) => {
                const isSelected = selectedAnswer === oIndex;
                const isCorrectOption = oIndex === q.correctAnswer;

                let buttonClasses = "w-full text-left px-4 py-3 rounded-lg border-2 transition-all ";

                if (!isAnswered) {
                  // Before answering
                  buttonClasses += "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer";
                } else {
                  // After answering
                  if (isSelected) {
                    if (isCorrect) {
                      buttonClasses += "border-emerald-500 bg-emerald-50 text-emerald-900";
                    } else {
                      buttonClasses += "border-red-500 bg-red-50 text-red-900";
                    }
                  } else if (isCorrectOption) {
                    buttonClasses += "border-emerald-500 bg-emerald-50 text-emerald-900";
                  } else {
                    buttonClasses += "border-gray-200 bg-gray-50 text-gray-500";
                  }
                }

                return (
                  <button
                    key={oIndex}
                    onClick={() => !isAnswered && handleAnswerClick(qIndex, oIndex)}
                    disabled={isAnswered}
                    className={buttonClasses}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {String.fromCharCode(65 + oIndex)}) {option}
                      </span>
                      {isAnswered && isSelected && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      {isAnswered && !isSelected && isCorrectOption && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="flex items-center justify-between pt-2">
                <p className={`text-sm font-medium ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect - see the correct answer above'}
                </p>
                <button
                  onClick={() => resetQuestion(qIndex)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Helper function to get subject-specific theme
function getSubjectTheme(insightType: string) {
  if (insightType === 'quran_tadabbur') {
    return {
      icon: BookOpen,
      iconLabel: '🕌',
      gradient: 'from-emerald-600 to-teal-600',
      bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50',
      buttonColor: 'emerald',
      borderColor: 'emerald',
      title: 'Talbiyah Insights - Qur\'an with Tadabbur'
    };
  }
  // Arabic language
  return {
    icon: Book,
    iconLabel: '📚',
    gradient: 'from-blue-600 to-indigo-600',
    bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
    buttonColor: 'blue',
    borderColor: 'blue',
    title: 'Talbiyah Insights - Arabic Language'
  };
}

// Helper function to parse markdown content into sections
interface InsightSection {
  title: string;
  content: string;
  icon: any;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

function parseInsightSections(content: string, insightType: string): InsightSection[] {
  const sections: InsightSection[] = [];
  const lines = content.split('\n');
  let currentSection: { title: string; content: string[] } | null = null;

  // Define section configurations matching old platform style
  const sectionConfigs: Record<string, { icon: any; textColor: string; bgColor: string; borderColor: string }> = {
    'flow of meaning': { icon: BookMarked, textColor: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
    'tafseer': { icon: BookMarked, textColor: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
    'tafsīr': { icon: BookMarked, textColor: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
    'vocabulary': { icon: BookMarked, textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    'key terms': { icon: BookMarked, textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    'arabic words': { icon: BookMarked, textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    'grammar': { icon: Lightbulb, textColor: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    'grammatical': { icon: Lightbulb, textColor: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    'key lessons': { icon: Lightbulb, textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    'reflections': { icon: Lightbulb, textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    'tadabbur': { icon: Lightbulb, textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    'reflection questions': { icon: Target, textColor: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
    'questions': { icon: Target, textColor: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
    'mini quiz': { icon: Target, textColor: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    'quiz': { icon: Target, textColor: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    'comprehension': { icon: Target, textColor: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    'learning outcomes': { icon: TrendingUp, textColor: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
    'progress': { icon: TrendingUp, textColor: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
    'flashcard': { icon: Book, textColor: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    'homework': { icon: BookOpen, textColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    'practice': { icon: BookOpen, textColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    'next steps': { icon: BookOpen, textColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  };

  for (const line of lines) {
    // Check if this is a section header (## or ###)
    const headerMatch = line.match(/^#{2,3}\s+(.+)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection && currentSection.content.length > 0) {
        const titleLower = currentSection.title.toLowerCase();
        let config = sectionConfigs['key lessons']; // default to amber

        // Find matching config
        for (const [key, value] of Object.entries(sectionConfigs)) {
          if (titleLower.includes(key)) {
            config = value;
            break;
          }
        }

        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n').trim(),
          icon: config.icon,
          textColor: config.textColor,
          bgColor: config.bgColor,
          borderColor: config.borderColor
        });
      }

      // Start new section
      currentSection = {
        title: headerMatch[1],
        content: []
      };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  // Add last section
  if (currentSection && currentSection.content.length > 0) {
    const titleLower = currentSection.title.toLowerCase();
    let config = sectionConfigs['key lessons']; // default to amber

    for (const [key, value] of Object.entries(sectionConfigs)) {
      if (titleLower.includes(key)) {
        config = value;
        break;
      }
    }

    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n').trim(),
      icon: config.icon,
      textColor: config.textColor,
      bgColor: config.bgColor,
      borderColor: config.borderColor
    });
  }

  return sections;
}

export default function LessonInsights() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<LessonInsight | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [lessonId]);

  async function loadInsights() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view insights');
        setLoading(false);
        return;
      }

      // Get learner ID
      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .single();

      if (!learner) {
        setError('Learner profile not found');
        setLoading(false);
        return;
      }

      // Get lesson info
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          scheduled_time,
          duration_minutes,
          subjects(name),
          teacher_profiles!inner(
            profiles!inner(full_name)
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Get insights
      const { data: insightData, error: insightError } = await supabase
        .from('lesson_insights')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('learner_id', learner.id)
        .single();

      if (insightError) {
        if (insightError.code === 'PGRST116') {
          setError('Insights not yet generated for this lesson');
        } else {
          throw insightError;
        }
        setLoading(false);
        return;
      }

      setInsight(insightData);
      setRating(insightData.student_rating || 0);

      // Mark as viewed
      if (!insightData.viewed_by_student) {
        await supabase
          .from('lesson_insights')
          .update({
            viewed_by_student: true,
            student_viewed_at: new Date().toISOString()
          })
          .eq('id', insightData.id);
      }

    } catch (err: any) {
      console.error('Error loading insights:', err);
      setError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }

  async function submitRating(newRating: number) {
    if (!insight) return;

    try {
      setSubmittingRating(true);

      const { error } = await supabase
        .from('lesson_insights')
        .update({ student_rating: newRating })
        .eq('id', insight.id);

      if (error) throw error;

      setRating(newRating);
      setRatingSubmitted(true);
      setTimeout(() => setRatingSubmitted(false), 3000);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadPDF() {
    // For now, use print dialog - can enhance with PDF generation library later
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
            {error || 'Insights not available'}
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const metadata = insight.detailed_insights.metadata;
  const theme = getSubjectTheme(insight.insight_type);
  const IconComponent = theme.icon;

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Ensure colored headers print with background */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Add spacing between cards for print */
          .space-y-6 > * {
            margin-bottom: 1.5rem !important;
          }

          /* Optimize prose for print */
          .prose {
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient}`}>
      {/* Header */}
      <header className={`bg-white border-b border-${theme.borderColor}-100 shadow-sm print:hidden`}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center space-x-2 text-slate-600 hover:text-${theme.buttonColor}-600 transition`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className={`p-2 text-slate-600 hover:text-${theme.buttonColor}-600 transition`}
                title="Print"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownloadPDF}
                className={`p-2 text-slate-600 hover:text-${theme.buttonColor}-600 transition`}
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Card */}
        <div className={`bg-gradient-to-r ${theme.gradient} rounded-2xl p-8 mb-8 text-white shadow-xl`}>
          <div className="flex items-center space-x-3 mb-4">
            <IconComponent className="w-8 h-8" />
            <h1 className="text-3xl font-bold">{theme.title}</h1>
          </div>
          {insight.insight_type === 'quran_tadabbur' ? (
            <>
              <h2 className="text-2xl font-semibold mb-2">{metadata.surah_name} ({metadata.surah_number})</h2>
              <p className={`text-${theme.buttonColor}-100 text-lg`}>{metadata.ayah_range}</p>
            </>
          ) : (
            <h2 className="text-2xl font-semibold mb-2">Arabic Language Lesson</h2>
          )}
          <div className={`mt-4 flex flex-wrap gap-4 text-sm text-${theme.buttonColor}-100`}>
            <span>👨‍🏫 Teacher: {metadata.teacher_name}</span>
            <span>📅 {new Date(metadata.lesson_date).toLocaleDateString()}</span>
            {metadata.duration_minutes && <span>⏱️ {metadata.duration_minutes} minutes</span>}
          </div>
        </div>

        {/* Insights Content - Old Platform Style */}
        <div className="space-y-4 mb-8">
          {(() => {
            const sections = parseInsightSections(insight.detailed_insights.content, insight.insight_type);

            // If no sections were parsed, show all content in a single card
            if (sections.length === 0) {
              return (
                <div className="space-y-2 print:break-inside-avoid">
                  <div className={`flex items-center space-x-2 px-4 py-3 ${theme.bgGradient.replace('from-', 'bg-').split(' ')[0].replace('via-', '').replace('to-', '')} rounded-lg border ${theme.borderColor}`}>
                    <IconComponent className={`w-5 h-5 ${theme.buttonColor === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}`} />
                    <h3 className={`text-sm font-semibold ${theme.buttonColor === 'emerald' ? 'text-emerald-900' : 'text-blue-900'}`}>Lesson Insights</h3>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 ml-2">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <ReactMarkdown>{insight.detailed_insights.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            }

            // Otherwise, show parsed sections in old platform style
            return sections.map((section, index) => {
              const SectionIcon = section.icon;

              // Check if this is a quiz section
              const isQuizSection = section.title.toLowerCase().includes('quiz') ||
                                   section.title.toLowerCase().includes('comprehension');
              const quizQuestions = isQuizSection ? parseQuizQuestions(section.content) : [];

              return (
                <div key={index} className="space-y-2 print:break-inside-avoid">
                  {/* Section Header - Old Platform Style */}
                  <div className={`flex items-center space-x-2 px-4 py-3 ${section.bgColor} rounded-lg border ${section.borderColor}`}>
                    <SectionIcon className={`w-5 h-5 ${section.textColor}`} />
                    <h3 className={`text-sm font-semibold ${section.textColor.replace('-600', '-900')}`}>
                      {section.title}
                    </h3>
                  </div>

                  {/* Section Content - Old Platform Style */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 ml-2">
                    {isQuizSection && quizQuestions.length > 0 ? (
                      <InteractiveQuiz questions={quizQuestions} />
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Rating Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 print:hidden">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Was this helpful?</h3>
            <p className="text-sm text-gray-600 mb-4">Rate your learning experience</p>

            <div className="flex items-center justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  onClick={() => submitRating(starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={submittingRating}
                  className="transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Star
                    className={`w-8 h-8 ${
                      starValue <= (hoveredRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {ratingSubmitted && (
              <div className={`flex items-center justify-center space-x-2 text-${theme.buttonColor}-600`}>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Thank you for your feedback!</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>Generated by Talbiyah.ai • Islamic Learning Platform</p>
        </div>
      </main>
    </div>
    </>
  );
}
