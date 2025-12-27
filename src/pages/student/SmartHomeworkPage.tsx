import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Brain,
  Target,
  Trophy,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Lightbulb,
  ExternalLink,
  Clock,
  Star,
  Zap,
  Play,
  Pause
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DashboardHeader from '../../components/DashboardHeader';
import WordMatchingQuiz from '../../components/WordMatchingQuiz';

interface KnowledgeGap {
  id: string;
  category: string;
  subcategory: string | null;
  severity: 'minor' | 'moderate' | 'major';
  confidenceScore: number;
  timesTargeted: number;
}

interface HomeworkGame {
  type: 'flashcard' | 'matching' | 'multiple_choice' | 'fill_blank';
  title: string;
  description: string;
  questions: any[];
  targetGaps: string[];
  completed: boolean;
  score: number;
  maxScore: number;
}

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

// Sample vocabulary for games (would come from lesson insights in production)
const SAMPLE_VOCABULARY = [
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
];

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
    category: 'Memorization',
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
      } else {
        // Generate new homework session
        await generateHomework(targetLearnerId, gaps || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateHomework(learnerId: string, gaps: any[]) {
    // Generate games based on gaps and vocabulary
    const games: HomeworkGame[] = [
      {
        type: 'matching',
        title: 'Word Matching',
        description: 'Match Arabic words with their English meanings',
        questions: SAMPLE_VOCABULARY.slice(0, 6),
        targetGaps: gaps.filter(g => g.category === 'vocabulary').map(g => g.id),
        completed: false,
        score: 0,
        maxScore: 6
      },
      {
        type: 'flashcard',
        title: 'Vocabulary Flashcards',
        description: 'Review key vocabulary from your lessons',
        questions: SAMPLE_VOCABULARY,
        targetGaps: gaps.filter(g => g.category === 'vocabulary').map(g => g.id),
        completed: false,
        score: 0,
        maxScore: 10
      },
      {
        type: 'multiple_choice',
        title: 'Comprehension Quiz',
        description: 'Test your understanding of meanings',
        questions: generateMultipleChoice(SAMPLE_VOCABULARY.slice(0, 5)),
        targetGaps: gaps.filter(g => g.category === 'comprehension').map(g => g.id),
        completed: false,
        score: 0,
        maxScore: 5
      }
    ];

    const { data: newSession, error } = await supabase
      .from('homework_sessions')
      .insert({
        learner_id: learnerId,
        lesson_id: lessonId,
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
      })
      .select()
      .single();

    if (newSession) {
      setSession({
        id: newSession.id,
        sessionType: newSession.session_type,
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
  }

  function generateMultipleChoice(vocabulary: typeof SAMPLE_VOCABULARY) {
    return vocabulary.map((word, index) => {
      const otherWords = vocabulary.filter((_, i) => i !== index);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.english);

      const options = [word.english, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        question: `What does "${word.arabic}" mean?`,
        arabic: word.arabic,
        correctAnswer: word.english,
        options
      };
    });
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

  const progressPercent = session
    ? Math.round((session.currentGameIndex / session.games.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-7 h-7" />
                Smart Homework
              </h1>
              <p className="text-purple-100 mt-1">Personalized practice based on your needs</p>
            </div>
            {gameStarted && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-xl">{formatTime(timer)}</span>
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {session && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{session.currentGameIndex}/{session.games.length} games</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Not started state */}
        {session?.status === 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Practice?</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We've prepared {session.games.length} activities targeting your weak areas.
              Complete them all to strengthen your understanding!
            </p>

            {/* Games preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {session.games.map((game, index) => (
                <div key={index} className="bg-purple-50 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    {game.type === 'matching' && <Target className="w-5 h-5 text-purple-600" />}
                    {game.type === 'flashcard' && <BookOpen className="w-5 h-5 text-purple-600" />}
                    {game.type === 'multiple_choice' && <Lightbulb className="w-5 h-5 text-purple-600" />}
                    <span className="font-medium text-purple-900">{game.title}</span>
                  </div>
                  <p className="text-sm text-purple-700">{game.description}</p>
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
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentGame.title}</h2>
                <p className="text-gray-600">{currentGame.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Game {session.currentGameIndex + 1} of {session.games.length}</p>
                <p className="text-lg font-bold text-purple-600">+{currentGame.maxScore} points</p>
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
              />
            )}

            {currentGame.type === 'multiple_choice' && (
              <MultipleChoiceGame
                questions={currentGame.questions}
                onComplete={(score) => handleGameComplete(score, currentGame.maxScore)}
              />
            )}
          </div>
        )}

        {/* Paused state */}
        {isPaused && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Pause className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paused</h2>
            <p className="text-gray-600 mb-6">Take your time! Click resume when you're ready.</p>
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
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-8 text-center">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-yellow-800 mb-2">Homework Complete!</h2>
              <p className="text-yellow-700 mb-6">
                Great work! You've finished all {session.games.length} activities.
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-3xl font-bold text-purple-600">{session.totalScore}</p>
                  <p className="text-sm text-gray-600">Points</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-3xl font-bold text-emerald-600">{session.accuracyPercentage}%</p>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-3xl font-bold text-blue-600">{formatTime(timer)}</p>
                  <p className="text-sm text-gray-600">Time</p>
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
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Continue Learning
              </h3>
              <p className="text-gray-600 mb-4">
                These apps can help you practice more:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXTERNAL_APPS.map((app, index) => (
                  <a
                    key={index}
                    href={app.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{app.icon}</span>
                      <span className="font-medium text-gray-900 group-hover:text-purple-600">
                        {app.appName}
                      </span>
                      <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                    </div>
                    <p className="text-sm text-gray-600">{app.task}</p>
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
  onComplete
}: {
  vocabulary: typeof SAMPLE_VOCABULARY;
  onComplete: (score: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scores, setScores] = useState<boolean[]>([]);

  const currentWord = vocabulary[currentIndex];
  const isComplete = currentIndex >= vocabulary.length;

  function handleKnew(knew: boolean) {
    setScores([...scores, knew]);
    setFlipped(false);

    if (currentIndex + 1 >= vocabulary.length) {
      const finalScore = [...scores, knew].filter(Boolean).length;
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
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Card {currentIndex + 1} of {vocabulary.length}</span>
        <span>Score: {scores.filter(Boolean).length}/{scores.length}</span>
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className={`relative h-64 rounded-2xl cursor-pointer transition-all duration-500 transform-style-3d ${
          flipped ? 'rotate-y-180' : ''
        }`}
        style={{ perspective: '1000px' }}
      >
        {/* Front - Arabic */}
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 flex flex-col items-center justify-center text-white backface-hidden ${
          flipped ? 'invisible' : ''
        }`}>
          <p className="text-5xl font-arabic mb-4" dir="rtl">{currentWord.arabic}</p>
          <p className="text-purple-200 text-sm">Tap to reveal meaning</p>
        </div>

        {/* Back - English */}
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 flex flex-col items-center justify-center text-white backface-hidden rotate-y-180 ${
          !flipped ? 'invisible' : ''
        }`}>
          <p className="text-3xl font-bold mb-2">{currentWord.english}</p>
          <p className="text-emerald-200">{currentWord.transliteration}</p>
        </div>
      </div>

      {flipped && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleKnew(false)}
            className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition flex items-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Didn't Know
          </button>
          <button
            onClick={() => handleKnew(true)}
            className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Knew It!
          </button>
        </div>
      )}
    </div>
  );
}

// Multiple Choice Game Component
function MultipleChoiceGame({
  questions,
  onComplete
}: {
  questions: any[];
  onComplete: (score: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  function handleAnswer(answer: string) {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      onComplete(score + (isCorrect ? 1 : 0));
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>Score: {score}/{currentIndex}</span>
      </div>

      <div className="bg-purple-50 rounded-xl p-6">
        <p className="text-4xl font-arabic text-center mb-4" dir="rtl">
          {currentQuestion.arabic}
        </p>
        <p className="text-center text-gray-700">{currentQuestion.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.options.map((option: string, index: number) => {
          let buttonClass = 'p-4 rounded-xl border-2 text-left transition font-medium ';

          if (showResult) {
            if (option === currentQuestion.correctAnswer) {
              buttonClass += 'bg-emerald-100 border-emerald-500 text-emerald-800';
            } else if (option === selectedAnswer) {
              buttonClass += 'bg-red-100 border-red-500 text-red-800';
            } else {
              buttonClass += 'bg-gray-50 border-gray-200 text-gray-400';
            }
          } else {
            buttonClass += 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50';
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={buttonClass}
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
