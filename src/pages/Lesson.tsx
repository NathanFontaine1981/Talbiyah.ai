import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HMSPrebuilt } from '@100mslive/roomkit-react';
import { HMSRoomProvider, useHMSStore, useHMSActions, selectPeerCount, selectIsConnectedToRoom, selectLocalMediaSettings, selectConnectionQuality, selectRoom } from '@100mslive/react-sdk';
import {
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Smartphone,
  Laptop,
  Copy,
  CheckCircle,
  MessageCircle,
  X,
  PhoneOff,
  QrCode,
  ExternalLink,
  Book,
  Clock,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
import { supabase } from '../lib/supabaseClient';
import QuickLessonFeedback from '../components/QuickLessonFeedback';
import DetailedTeacherRating from '../components/DetailedTeacherRating';
import LessonMessaging from '../components/messaging/LessonMessaging';
import { PostLessonForm } from '../components/progress';

interface LessonData {
  id: string;
  teacher_id: string;
  learner_id: string;
  teacher_name: string;
  learner_name: string;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
  '100ms_room_id': string;
  room_code: string;
}

// PDF Materials Sidebar Component with Al-Arabi textbooks
function PdfMaterialsSidebar({ onClose, onPageChange }: { onClose: () => void; onPageChange?: (page: number, book: string) => void }) {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>('1');
  const [pdfError, setPdfError] = useState<boolean>(false);

  const textbooks = [
    {
      id: 'arabi-1a',
      title: 'العربية بين يديك - الجزء الأول (أ)',
      subtitle: 'Al-Arabi Bayna Yadayk - Book 1A',
      path: '/materials/Al-Arabi-bin-Yadik-1-A_compressed.pdf',
      color: 'emerald'
    },
    {
      id: 'arabi-1b',
      title: 'العربية بين يديك - الجزء الأول (ب)',
      subtitle: 'Al-Arabi Bayna Yadayk - Book 1B',
      path: '/materials/Al-Arabi-bin-Yadik-1-B_compressed.pdf',
      color: 'blue'
    }
  ];

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setPdfError(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setLoading(false);
    setPdfError(true);
  };

  const goToPage = (page: number) => {
    const newPage = Math.min(Math.max(1, page), numPages);
    setPageNumber(newPage);
    setPageInput(String(newPage));
    if (onPageChange) {
      onPageChange(newPage, selectedBook);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      setPageInput(String(pageNumber));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  const selectBook = (book: typeof textbooks[0]) => {
    setSelectedPdf(book.path);
    setSelectedBook(book.id);
    setPageNumber(1);
    setPageInput('1');
    setLoading(true);
    setPdfError(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* PDF Materials Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5" />
          <span className="font-semibold">Arabic Textbooks</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedPdf && (
            <button
              onClick={() => {
                setSelectedPdf(null);
                setSelectedBook('');
                setNumPages(0);
                setPageNumber(1);
              }}
              className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors text-white"
            >
              ← Back
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {selectedPdf ? (
        // PDF Viewer with react-pdf
        <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
          {/* Page Controls */}
          <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between gap-2">
            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">Page</span>
                <input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyDown={handlePageInputKeyDown}
                  className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm font-medium"
                />
                <span className="text-gray-500">of {numPages}</span>
              </div>

              <button
                onClick={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= numPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(s => Math.min(2, s + 0.25))}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* PDF Display */}
          <div className="flex-1 overflow-auto p-4 flex justify-center">
            {loading && !pdfError && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {pdfError ? (
              // Fallback: iframe embed when react-pdf fails
              <div className="w-full h-full flex flex-col">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-sm text-amber-800">
                  <p className="font-medium">Using embedded viewer</p>
                  <p className="text-xs mt-1">PDF viewer fallback mode - all features available</p>
                </div>
                <iframe
                  src={`${selectedPdf}#page=${pageNumber}`}
                  className="flex-1 w-full rounded-lg border border-gray-200"
                  title="PDF Viewer"
                />
              </div>
            ) : (
              <Document
                file={selectedPdf}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                />
              </Document>
            )}
          </div>
        </div>
      ) : (
        // Book Selection
        <div className="flex-1 bg-white p-4 overflow-y-auto">
          <p className="text-gray-600 text-sm mb-4">
            Select a textbook to view during the lesson. Share your screen to show pages to the student.
          </p>

          <div className="space-y-3">
            {textbooks.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectBook(book);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                  book.color === 'emerald'
                    ? 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/50'
                    : 'border-blue-200 hover:border-blue-400 bg-blue-50/50'
                }`}
              >
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                  book.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}>
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-arabic text-lg text-gray-900 mb-1">{book.title}</p>
                  <p className="text-sm text-gray-600">{book.subtitle}</p>
                </div>
                <ArrowRight className={`w-5 h-5 ${
                  book.color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'
                }`} />
              </button>
            ))}
          </div>

          {/* Open in new tab buttons */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">Or open in a new tab:</p>
            <div className="flex gap-2">
              {textbooks.map((book) => (
                <a
                  key={book.id}
                  href={book.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    book.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Book 1{book.id.includes('1a') ? 'A' : 'B'}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Page Indicator */}
      {selectedPdf && numPages > 0 && (
        <div className="bg-blue-600 px-4 py-2 text-white text-center">
          <p className="text-sm font-medium">
            📖 Currently on Page {pageNumber} of {numPages}
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 px-4 py-2 text-xs text-blue-800 border-t border-blue-100">
        <p><strong>Tip:</strong> Share your screen to show the textbook pages to your student!</p>
      </div>
    </div>
  );
}

// Wrapper component that provides HMS context
export default function Lesson() {
  return (
    <HMSRoomProvider>
      <LessonContent />
    </HMSRoomProvider>
  );
}

function LessonContent() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQuickFeedback, setShowQuickFeedback] = useState(false);
  const [showDetailedRating, setShowDetailedRating] = useState(false);
  const [milestoneData, setMilestoneData] = useState<{
    milestoneType: string;
    lessonCount: number;
  } | null>(null);
  const [showMessaging, setShowMessaging] = useState(true);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [showPostLessonForm, setShowPostLessonForm] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'messages' | 'quran' | 'pdf'>('messages');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [lessonStarted, setLessonStarted] = useState(false);

  // Use 100ms SDK to track peer count and recording
  const peerCount = useHMSStore(selectPeerCount);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const room = useHMSStore(selectRoom);
  const hmsActions = useHMSActions();
  const [recordingStarted, setRecordingStarted] = useState(false);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);
  const [lastConnectionCheck, setLastConnectionCheck] = useState<number>(Date.now());

  // Monitor connection quality and detect issues
  useEffect(() => {
    if (!isConnectedToRoom) return;

    const checkConnection = setInterval(() => {
      setLastConnectionCheck(Date.now());

      // If we haven't received updates in a while, show warning
      if (room?.isConnected === false) {
        setConnectionWarning('Connection lost. Attempting to reconnect...');
      } else {
        setConnectionWarning(null);
      }
    }, 5000);

    return () => clearInterval(checkConnection);
  }, [isConnectedToRoom, room]);

  // Refresh camera/media function
  const refreshMedia = async () => {
    try {
      setConnectionWarning('Refreshing camera and microphone...');
      // Toggle video off and on to refresh
      await hmsActions.setLocalVideoEnabled(false);
      await new Promise(resolve => setTimeout(resolve, 500));
      await hmsActions.setLocalVideoEnabled(true);
      setConnectionWarning(null);
    } catch (error) {
      console.error('Failed to refresh media:', error);
      setConnectionWarning('Failed to refresh. Try leaving and rejoining the room.');
    }
  };

  // Start timer when BOTH teacher and student are in the room
  useEffect(() => {
    if (!isConnectedToRoom || !lesson || lessonStarted) return;

    // Wait for at least 2 participants (teacher + student) before starting timer
    if (peerCount >= 2) {
      setLessonStarted(true);
      setSessionStartTime(new Date());

      // Start recording when both join (only if teacher/host)
      if (userRole === 'teacher' && !recordingStarted) {
        startBrowserRecording();
      }
    }
  }, [isConnectedToRoom, lesson, lessonStarted, userRole, recordingStarted, peerCount]);

  // Start browser recording
  const startBrowserRecording = async () => {
    try {
      await hmsActions.startRTMPOrRecording({
        record: true,
      });
      setRecordingStarted(true);
    } catch {
      // Recording might already be started by auto-start, that's OK
      setRecordingStarted(true);
    }
  };

  // Update isVideoReady when connected to room
  useEffect(() => {
    if (isConnectedToRoom && !isVideoReady) {
      setIsVideoReady(true);
    }
  }, [isConnectedToRoom, isVideoReady]);

  // Allow manual start of timer (fallback if auto-start doesn't work)
  const startLessonTimer = () => {
    if (!lessonStarted) {
      setLessonStarted(true);
      setSessionStartTime(new Date());
    }
  };

  // Timer effect - starts when lesson has started
  useEffect(() => {
    if (!lessonStarted || !sessionStartTime) return;

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [lessonStarted, sessionStartTime]);

  // Format elapsed time as HH:MM:SS or MM:SS
  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  async function loadLesson() {
    try {
      setLoading(true);

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        setError('Please sign in to join this lesson');
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          "100ms_room_id",
          teacher_room_code,
          student_room_code,
          teacher_id,
          learner_id,
          teacher_profiles!inner(
            user_id,
            profiles!inner(
              full_name
            )
          ),
          learners(
            name
          ),
          subjects!inner(
            name
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      if (!lessonData) {
        setError('Lesson not found');
        setLoading(false);
        return;
      }

      // Check if lesson has been completed (ended by teacher)
      if (lessonData.status === 'completed') {
        setError('This lesson has ended. The teacher has concluded the session.');
        setLoading(false);
        return;
      }

      // Check if user is teacher or student
      const teacherUserId = lessonData.teacher_profiles?.user_id;
      const isTeacher = teacherUserId === currentUser.id;
      setUserRole(isTeacher ? 'teacher' : 'student');

      // Get the appropriate room code based on user role
      const roomCode = isTeacher
        ? lessonData.teacher_room_code
        : lessonData.student_room_code;

      if (!roomCode) {
        setError(`Video room is not ready yet. Role: ${isTeacher ? 'teacher' : 'student'}, Teacher code: ${lessonData.teacher_room_code ? 'exists' : 'missing'}, Student code: ${lessonData.student_room_code ? 'exists' : 'missing'}`);
        setLoading(false);
        return;
      }

      setLesson({
        id: lessonData.id,
        teacher_id: lessonData.teacher_id,
        learner_id: lessonData.learner_id,
        teacher_name: lessonData.teacher_profiles.profiles.full_name || 'Teacher',
        learner_name: lessonData.learners?.name || 'Student',
        subject_name: lessonData.subjects.name,
        scheduled_time: lessonData.scheduled_time,
        duration_minutes: lessonData.duration_minutes,
        '100ms_room_id': lessonData['100ms_room_id'],
        room_code: roomCode
      });

      // Don't auto-open the room - let user choose how to join
      // isVideoReady will be set to true when user clicks "Join Now"

    } catch (error: any) {
      console.error('Error loading lesson:', error);
      setError(error.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }

  async function handleLessonEnd() {
    // When someone leaves the room (via onLeaveRoom callback)
    // For teachers: just navigate to dashboard (don't auto-mark as completed)
    // For students: show feedback if lesson is already completed

    if (userRole === 'teacher') {
      // Teacher just left - don't mark as completed automatically
      // They should use "End Session" button to properly end
      navigate('/dashboard');
      return;
    }

    // For students
    if (!lesson || !user) {
      navigate('/dashboard');
      return;
    }

    try {
      // Check if lesson is already completed (teacher ended it)
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('status')
        .eq('id', lesson.id)
        .single();

      if (lessonData?.status === 'completed') {
        // Show quick feedback
        setShowQuickFeedback(true);
      } else {
        // Lesson not completed yet, just leave
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error handling lesson end:', error);
      navigate('/dashboard');
    }
  }

  async function handleQuickFeedbackComplete() {
    setShowQuickFeedback(false);

    if (!lesson || !user) {
      navigate('/dashboard');
      return;
    }

    try {
      // Check if we should request detailed rating
      const { data, error } = await supabase
        .rpc('should_request_detailed_rating', {
          p_teacher_id: lesson.teacher_id,
          p_student_id: user.id
        });

      if (error) throw error;

      if (data && data.length > 0 && data[0].should_request) {
        // Show detailed rating at milestone
        setMilestoneData({
          milestoneType: data[0].milestone_type,
          lessonCount: data[0].lesson_count
        });
        setShowDetailedRating(true);
      } else {
        // No milestone, go to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking milestone:', error);
      navigate('/dashboard');
    }
  }

  function handleDetailedRatingComplete() {
    setShowDetailedRating(false);
    navigate('/dashboard');
  }

  function handleLeave() {
    navigate('/dashboard');
  }

  async function handleEndSession() {
    if (!lesson) return;

    setEndingSession(true);
    try {
      // First, try to end the 100ms room via edge function
      if (lesson['100ms_room_id']) {
        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/end-hms-room`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                roomId: lesson['100ms_room_id'],
                lessonId: lesson.id
              })
            }
          );
          // Room ended successfully
        } catch {
          // Continue anyway - we still want to mark lesson as completed
        }
      }

      // Mark lesson as completed in database
      await supabase
        .from('lessons')
        .update({
          status: 'completed'
        })
        .eq('id', lesson.id);

      // For teachers, show post-lesson form to capture feedback
      // For students, navigate to dashboard (they already see QuickLessonFeedback)
      if (userRole === 'teacher') {
        setShowPostLessonForm(true);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      // Still navigate even if update fails
      navigate('/dashboard');
    } finally {
      setEndingSession(false);
      setShowEndSessionConfirm(false);
    }
  }

  // Generate the 100ms joining link
  const joinLink = lesson?.room_code ? `https://talbiyah.app.100ms.live/meeting/${lesson.room_code}` : '';

  function copyRoomCode() {
    if (lesson?.room_code) {
      navigator.clipboard.writeText(lesson.room_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  const [copiedLink, setCopiedLink] = useState(false);
  function copyJoinLink() {
    if (joinLink) {
      navigator.clipboard.writeText(joinLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  function handleJoinWeb() {
    setShowMobileInstructions(false);
    setIsVideoReady(true);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md">
          <div className="w-20 h-20 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-3">Loading Lesson...</h2>
          <p className="text-emerald-200">Preparing your live Islamic learning session</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900 flex items-center justify-center z-50">
        <div
          role="alert"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Join Lesson
            </h2>

            <div className="text-gray-600 mb-6">
              <p className="mb-2">{error || 'An error occurred'}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={loadLesson}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={handleLeave}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVideoReady) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-gray-900 flex items-center justify-center z-50 p-6">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center text-white mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <BookOpen className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold">Talbiyah.ai</h1>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Join {lesson.subject_name}</h2>
            <p className="text-emerald-200">with {userRole === 'teacher' ? lesson.learner_name : lesson.teacher_name} • {lesson.duration_minutes} minutes</p>
            <div className="flex items-center justify-center space-x-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">LIVE SESSION</span>
            </div>
          </div>

          {/* Join Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Web Browser Option */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-400/30 hover:border-emerald-400/60 transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <Laptop className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Join via Web Browser</h3>
                <p className="text-emerald-200 text-sm mb-6">
                  Recommended for desktop and laptop computers
                </p>
                <button
                  onClick={handleJoinWeb}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
                >
                  <Laptop className="w-5 h-5" />
                  <span>Join Now</span>
                </button>
              </div>
            </div>

            {/* Mobile/Tablet App Option */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-400/30 hover:border-emerald-400/60 transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Join via Mobile App</h3>
                <p className="text-cyan-200 text-sm mb-6">
                  For tablets & phones - enables screen sharing
                </p>
                <button
                  onClick={() => setShowMobileInstructions(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>View Instructions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Instructions Modal */}
          {showMobileInstructions && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-instructions-title"
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full p-8 border border-emerald-400/30 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 id="mobile-instructions-title" className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Smartphone className="w-7 h-7 text-emerald-600" />
                    <span>Mobile/Tablet Join Instructions</span>
                  </h3>
                  <button
                    onClick={() => setShowMobileInstructions(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="bg-white/5 rounded-xl p-6 border border-emerald-400/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2">Download the 100ms App</h4>
                        <p className="text-cyan-200 text-sm mb-3">
                          Download the official 100ms app from your device's app store:
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <a
                            href="https://apps.apple.com/app/100ms-live/id1576541988"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                          >
                            📱 iOS App Store
                          </a>
                          <a
                            href="https://play.google.com/store/apps/details?id=live.100ms.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                          >
                            🤖 Google Play Store
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 - QR Code (Easiest) */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-500/20 rounded-xl p-6 border border-emerald-400/40">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-emerald-400" />
                          Scan QR Code (Easiest!)
                        </h4>
                        <p className="text-emerald-200 text-sm mb-4">
                          Open your phone's camera and scan this QR code to join instantly:
                        </p>
                        <div className="flex justify-center">
                          <div className="bg-white p-4 rounded-xl shadow-lg">
                            <QRCodeSVG
                              value={joinLink}
                              size={180}
                              level="H"
                              includeMargin={true}
                            />
                          </div>
                        </div>
                        <p className="text-emerald-300 text-xs mt-3 text-center">
                          📱 This will open the lesson directly in your browser or 100ms app
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 - Join Link (Alternative) */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl p-6 border border-emerald-400/40">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-3">Or Copy Joining Link</h4>
                        <div className="bg-white/10 rounded-lg p-4 border border-emerald-400/30 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-cyan-300 font-medium uppercase tracking-wider">
                              Joining Link for {userRole === 'teacher' ? 'Teacher' : 'Student'}
                            </span>
                            <button
                              onClick={copyJoinLink}
                              className="flex items-center space-x-1 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-cyan-300 text-xs font-medium transition-colors"
                            >
                              {copiedLink ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          </div>
                          <code className="text-sm font-mono text-white break-all">
                            {joinLink}
                          </code>
                        </div>

                        {/* Room code as fallback */}
                        <div className="bg-white/5 rounded-lg p-3 border border-emerald-400/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-emerald-600 font-medium">
                              Room Code (if asked)
                            </span>
                            <button
                              onClick={copyRoomCode}
                              className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-cyan-300 text-xs transition-colors"
                            >
                              {copiedCode ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <code className="text-lg font-mono font-bold text-white tracking-wider">
                            {lesson.room_code}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white/5 rounded-xl p-6 border border-emerald-400/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2">Join the Session</h4>
                        <p className="text-cyan-200 text-sm">
                          Enter your name, enable camera/microphone permissions, and tap "Join" to start your live session!
                        </p>
                        {userRole === 'teacher' && (
                          <div className="mt-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-400/30">
                            <p className="text-emerald-300 text-sm">
                              <span className="font-semibold">✨ Teacher Benefit:</span> The mobile app enables full screen sharing capabilities, perfect for sharing Quran text, slides, or other teaching materials.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setShowMobileInstructions(false)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Got it! Back to Join Options
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-6">
            <button
              onClick={handleLeave}
              className="text-emerald-300 hover:text-emerald-200 text-sm font-medium flex items-center space-x-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Connection Warning Banner */}
      {connectionWarning && (
        <div
          role="alert"
          aria-live="assertive"
          className="absolute top-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{connectionWarning}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshMedia}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Camera
            </button>
            <button
              onClick={() => setConnectionWarning(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Talbiyah Branded Header */}
      <div className={`absolute ${connectionWarning ? 'top-10' : 'top-0'} left-0 right-0 z-50 bg-gradient-to-r from-emerald-900/95 via-teal-900/95 to-emerald-900/95 backdrop-blur-sm border-b border-emerald-700/50 shadow-lg transition-all`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLeave}
              className="p-2 hover:bg-emerald-800/50 rounded-lg transition-colors text-white"
              title="Leave lesson"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <span className="text-xl font-semibold text-white">Talbiyah.ai</span>
            </div>
            <div className="h-6 w-px bg-emerald-700/50 mx-2"></div>
            <div>
              <h3 className="font-semibold text-white">{lesson.subject_name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">LIVE</span>
                <span className="text-emerald-300 text-sm">•</span>
                <span className="text-emerald-200 text-sm capitalize">{userRole}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Lesson Timer */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${
              lessonStarted
                ? 'bg-gray-100/60 border-gray-300'
                : 'bg-amber-900/40 border-amber-500/50'
            }`}>
              <Clock className={`w-5 h-5 ${lessonStarted ? 'text-emerald-600' : 'text-amber-400 animate-pulse'}`} />
              <div className="text-center">
                {lessonStarted ? (
                  <>
                    <p className="text-white text-lg font-mono font-bold tracking-wider">
                      {formatElapsedTime(elapsedSeconds)}
                    </p>
                    <p className="text-cyan-300 text-[10px] uppercase tracking-wide">Elapsed</p>
                  </>
                ) : (
                  <>
                    <p className="text-amber-300 text-sm font-semibold">
                      Ready...
                    </p>
                    <p className="text-amber-400/70 text-[10px] uppercase tracking-wide">Click Start</p>
                  </>
                )}
              </div>
              <div className="h-8 w-px bg-gray-600/50 mx-1"></div>
              <div className="text-center">
                <p className="text-emerald-300 text-sm font-semibold">
                  {lesson.duration_minutes}m
                </p>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Target</p>
              </div>
            </div>

            {/* Start Lesson Button - shows when timer hasn't started yet */}
            {!lessonStarted && isVideoReady && (
              <button
                onClick={startLessonTimer}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-500/30 flex items-center space-x-2 animate-pulse hover:animate-none"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Start Lesson</span>
              </button>
            )}

            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">
                with {userRole === 'teacher' ? lesson.learner_name : lesson.teacher_name}
              </p>
              <p className="text-emerald-300 text-xs">
                {lesson.duration_minutes} minutes
              </p>
            </div>

            {/* Refresh Camera Button - for troubleshooting */}
            <button
              onClick={refreshMedia}
              className="px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 bg-gray-600/50 hover:bg-gray-500/50 text-gray-200"
              title="Refresh camera if it stops working"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh Camera</span>
            </button>

            {/* QuranWBW Toggle Button - Show for Quran-related subjects */}
            {lesson.subject_name.toLowerCase().includes('quran') && (
              <button
                onClick={() => {
                  if (sidebarMode === 'quran') {
                    setSidebarMode('messages');
                  } else {
                    setSidebarMode('quran');
                    setShowMessaging(true);
                  }
                }}
                className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  sidebarMode === 'quran'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                }`}
                title="Open QuranWBW reference tool"
              >
                <Book className="w-4 h-4" />
                <span className="hidden sm:inline">Quran WBW</span>
              </button>
            )}

            {/* PDF Viewer Toggle Button - Show for Arabic language subjects */}
            {lesson.subject_name.toLowerCase().includes('arabic') && (
              <button
                onClick={() => {
                  if (sidebarMode === 'pdf') {
                    setSidebarMode('messages');
                  } else {
                    setSidebarMode('pdf');
                    setShowMessaging(true);
                  }
                }}
                className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  sidebarMode === 'pdf'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                }`}
                title="Open PDF materials"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Materials</span>
              </button>
            )}

            {/* Teacher: End Class Button - ends for everyone */}
            {userRole === 'teacher' && (
              <button
                onClick={() => setShowEndSessionConfirm(true)}
                className="px-3 py-2 sm:px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-lg"
                title="End class for all participants"
              >
                <PhoneOff className="w-4 h-4" />
                <span className="hidden sm:inline">End Class</span>
              </button>
            )}

            {/* Student: Leave Room Button - only leaves for themselves */}
            {userRole === 'student' && (
              <button
                onClick={handleLeave}
                className="px-3 py-2 sm:px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 shadow-lg"
                title="Leave the room"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Leave Room</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex h-full ${connectionWarning ? 'pt-[7.5rem]' : 'pt-20'} transition-all`}>
        {/* HMSPrebuilt Component */}
        <div className={`${showMessaging ? 'w-2/3' : 'w-full'} h-full transition-all duration-300`}>
          <HMSPrebuilt
            roomCode={lesson.room_code}
            options={{
              userName: userRole === 'teacher' ? lesson.teacher_name : lesson.learner_name,
              userId: user?.id || `user_${Date.now()}`,
              endpoints: {
                roomLayout: 'https://api.100ms.live/v2/layouts/ui'
              },
              theme: {
                palette: {
                  mode: 'light',
                  primary_default: '#10B981', // Talbiyah emerald
                  primary_bright: '#34D399',
                  primary_dim: '#059669',
                  primary_disabled: '#A7F3D0',
                  secondary_default: '#6B7280',
                  secondary_bright: '#9CA3AF',
                  secondary_dim: '#4B5563',
                  secondary_disabled: '#D1D5DB',
                  background_default: '#FFFFFF', // White background
                  background_dim: '#F9FAFB',
                  surface_default: '#F3F4F6',
                  surface_bright: '#FFFFFF',
                  surface_brighter: '#FFFFFF',
                  surface_dim: '#E5E7EB',
                  on_primary_high: '#FFFFFF',
                  on_primary_medium: '#E6FFFA',
                  on_primary_low: '#D1FAE5',
                  on_secondary_high: '#FFFFFF',
                  on_secondary_medium: '#F3F4F6',
                  on_secondary_low: '#E5E7EB',
                  on_surface_high: '#111827',
                  on_surface_medium: '#374151',
                  on_surface_low: '#6B7280',
                  border_default: '#E5E7EB',
                  border_bright: '#D1D5DB'
                }
              }
            }}
            screens={{
              preview: {
                elements: {
                  virtual_background: true,
                  noise_cancellation: true
                }
              },
              conferencing: {
                default: {
                  elements: {
                    video_tile_layout: {
                      grid: {
                        enable_local_tile_inset: true,
                        prominent_roles: ['host'],
                        enable_spotlighting_peer: true
                      }
                    },
                    participant_list: {
                      off_stage_roles: []
                    },
                    emoji_reactions: true,
                    hand_raise: true,
                    chat: true,
                    virtual_background: true,
                    noise_cancellation: true,
                    whiteboard: true,
                    on_stage_exp: {
                      enabled: true,
                      off_stage_roles: ['guest'],
                      on_stage_role: 'host'
                    },
                    brb: true
                  }
                },
                hls_live_streaming: {
                  elements: {
                    chat: true,
                    emoji_reactions: true,
                    hand_raise: true
                  }
                }
              }
            }}
            onJoinRoom={() => {
              // Successfully joined
            }}
            onLeaveRoom={() => {
              handleLessonEnd();
            }}
            onError={(error) => {
              setError(error.message || 'Failed to join the video session');
              setIsVideoReady(false);
            }}
          />
        </div>

        {/* Sidebar - Messages, QuranWBW, or PDF */}
        {showMessaging && (
          <div className="w-1/3 h-full bg-gray-50 border-l border-gray-200 overflow-hidden flex flex-col">
            {/* Sidebar Tab Switcher - show if Quran or Arabic subject */}
            {(lesson.subject_name.toLowerCase().includes('quran') || lesson.subject_name.toLowerCase().includes('arabic')) && (
              <div
                role="tablist"
                aria-label="Sidebar content"
                className="flex border-b border-gray-200 bg-white"
              >
                <button
                  onClick={() => setSidebarMode('messages')}
                  role="tab"
                  aria-selected={sidebarMode === 'messages'}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    sidebarMode === 'messages'
                      ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </button>
                {lesson.subject_name.toLowerCase().includes('quran') && (
                  <button
                    onClick={() => setSidebarMode('quran')}
                    role="tab"
                    aria-selected={sidebarMode === 'quran'}
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      sidebarMode === 'quran'
                        ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Book className="w-4 h-4" />
                    Quran WBW
                  </button>
                )}
                {lesson.subject_name.toLowerCase().includes('arabic') && (
                  <button
                    onClick={() => setSidebarMode('pdf')}
                    role="tab"
                    aria-selected={sidebarMode === 'pdf'}
                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      sidebarMode === 'pdf'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    PDF Materials
                  </button>
                )}
              </div>
            )}

            {/* Content based on mode */}
            {sidebarMode === 'messages' ? (
              <LessonMessaging
                lessonId={lessonId!}
                currentUserId={user?.id}
                userRole={userRole}
                onClose={() => setShowMessaging(false)}
              />
            ) : sidebarMode === 'quran' ? (
              <div className="flex-1 flex flex-col">
                {/* QuranWBW Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Book className="w-5 h-5" />
                    <span className="font-semibold">QuranWBW Reference</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://quranwbw.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setShowMessaging(false)}
                      className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
                      title="Close sidebar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* QuranWBW Iframe */}
                <div className="flex-1 bg-white">
                  <iframe
                    src="https://quranwbw.com"
                    className="w-full h-full border-0"
                    title="QuranWBW - Word by Word Quran"
                    allow="clipboard-write"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>

                {/* Quick Navigation Tips */}
                <div className="bg-amber-50 px-4 py-2 text-xs text-amber-800 border-t border-amber-100">
                  <p><strong>Tip:</strong> Use the search to find any Surah/Ayah. Share your screen to show students!</p>
                </div>
              </div>
            ) : sidebarMode === 'pdf' ? (
              <PdfMaterialsSidebar onClose={() => setShowMessaging(false)} />
            ) : null}
          </div>
        )}

        {/* Toggle Sidebar Button (when hidden) */}
        {!showMessaging && (
          <div className="fixed bottom-6 right-6 flex gap-2 z-50">
            <button
              onClick={() => {
                setShowMessaging(true);
                setSidebarMode('messages');
              }}
              className="bg-emerald-600 hover:bg-cyan-700 text-white p-4 rounded-full shadow-lg transition-all flex items-center gap-2"
              title="Open messages"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-medium hidden sm:inline">Messages</span>
            </button>
            {lesson.subject_name.toLowerCase().includes('quran') && (
              <button
                onClick={() => {
                  setShowMessaging(true);
                  setSidebarMode('quran');
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg transition-all flex items-center gap-2"
                title="Open Quran WBW"
              >
                <Book className="w-6 h-6" />
                <span className="font-medium hidden sm:inline">Quran</span>
              </button>
            )}
            {lesson.subject_name.toLowerCase().includes('arabic') && (
              <button
                onClick={() => {
                  setShowMessaging(true);
                  setSidebarMode('pdf');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all flex items-center gap-2"
                title="Open PDF Materials"
              >
                <FileText className="w-6 h-6" />
                <span className="font-medium hidden sm:inline">Materials</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Feedback Modal */}
      {showQuickFeedback && lesson && user && (
        <QuickLessonFeedback
          lessonId={lesson.id}
          teacherId={lesson.teacher_id}
          studentId={user.id}
          onComplete={handleQuickFeedbackComplete}
        />
      )}

      {/* Detailed Rating Modal */}
      {showDetailedRating && lesson && user && milestoneData && (
        <DetailedTeacherRating
          teacherId={lesson.teacher_id}
          teacherName={lesson.teacher_name}
          studentId={user.id}
          milestoneType={milestoneData.milestoneType}
          lessonCount={milestoneData.lessonCount}
          onComplete={handleDetailedRatingComplete}
        />
      )}

      {/* End Session Confirmation Modal */}
      {showEndSessionConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-session-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneOff className="w-8 h-8 text-red-600" />
              </div>
              <h3 id="end-session-title" className="text-xl font-bold text-gray-900 mb-2">End Session?</h3>
              <p className="text-gray-600 mb-6">
                {userRole === 'teacher'
                  ? 'This will end the lesson for both you and the student. The session will be marked as completed.'
                  : 'This will end the lesson for everyone. Only use this if the lesson is finished and the teacher cannot end the session (e.g., they are on the mobile app).'}
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEndSessionConfirm(false)}
                  disabled={endingSession}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndSession}
                  disabled={endingSession}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {endingSession ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Ending...</span>
                    </>
                  ) : (
                    <>
                      <PhoneOff className="w-4 h-4" />
                      <span>End Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-Lesson Form for Teachers */}
      {showPostLessonForm && lesson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Post-lesson feedback form"
            className="max-w-2xl w-full my-8"
          >
            <PostLessonForm
              lesson={{
                id: lesson.id,
                learner_id: lesson.learner_id,
                student_name: lesson.learner_name
              }}
              onComplete={() => {
                setShowPostLessonForm(false);
                navigate('/dashboard');
              }}
              onCancel={() => {
                setShowPostLessonForm(false);
                navigate('/dashboard');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
