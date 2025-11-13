import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HMSPrebuilt } from '@100mslive/roomkit-react';
import {
  Loader,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  BookOpen,
  Smartphone,
  Laptop,
  Copy,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LessonData {
  id: string;
  teacher_name: string;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
  '100ms_room_id': string;
  room_code: string;
}

export default function Lesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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
          "100ms_room_id",
          teacher_room_code,
          student_room_code,
          teacher_id,
          teacher_profiles!inner(
            user_id,
            profiles!inner(
              full_name
            )
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

      // Check if user is teacher or student
      const isTeacher = lessonData.teacher_profiles.user_id === currentUser.id;
      setUserRole(isTeacher ? 'teacher' : 'student');

      // Get the appropriate room code based on user role
      const roomCode = isTeacher
        ? lessonData.teacher_room_code
        : lessonData.student_room_code;

      if (!roomCode) {
        setError('Video room is not ready yet. Please try again in a few moments or contact support.');
        setLoading(false);
        return;
      }

      setLesson({
        id: lessonData.id,
        teacher_name: lessonData.teacher_profiles.profiles.full_name || 'Teacher',
        subject_name: lessonData.subjects.name,
        scheduled_time: lessonData.scheduled_time,
        duration_minutes: lessonData.duration_minutes,
        '100ms_room_id': lessonData['100ms_room_id'],
        room_code: roomCode
      });

      // Wait a moment before showing the video interface
      setTimeout(() => {
        setIsVideoReady(true);
      }, 1500);

    } catch (error: any) {
      console.error('Error loading lesson:', error);
      setError(error.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }

  function handleLeave() {
    navigate('/dashboard');
  }

  function copyRoomCode() {
    if (lesson?.room_code) {
      navigator.clipboard.writeText(lesson.room_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  function handleJoinWeb() {
    setShowMobileInstructions(false);
    setIsVideoReady(true);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center z-50">
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
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
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
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center z-50 p-6">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center text-white mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <BookOpen className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold">Talbiyah.ai</h1>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Join {lesson.subject_name}</h2>
            <p className="text-emerald-200">with {lesson.teacher_name} • {lesson.duration_minutes} minutes</p>
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-cyan-400/30 hover:border-cyan-400/60 transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                  <Smartphone className="w-10 h-10 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Join via Mobile App</h3>
                <p className="text-cyan-200 text-sm mb-6">
                  For tablets & phones - enables screen sharing
                </p>
                <button
                  onClick={() => setShowMobileInstructions(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
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
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-2xl w-full p-8 border border-cyan-400/30 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Smartphone className="w-7 h-7 text-cyan-400" />
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
                  <div className="bg-white/5 rounded-xl p-6 border border-cyan-400/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
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

                  {/* Step 2 */}
                  <div className="bg-white/5 rounded-xl p-6 border border-cyan-400/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2">Open the App and Enter Room Code</h4>
                        <p className="text-cyan-200 text-sm mb-3">
                          Launch the 100ms app and select "Join with Code"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 - Room Code */}
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-400/40">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-3">Your Room Code</h4>
                        <div className="bg-white/10 rounded-lg p-4 border border-cyan-400/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-cyan-300 font-medium uppercase tracking-wider">
                              Room Code for {userRole === 'teacher' ? 'Teacher' : 'Student'}
                            </span>
                            <button
                              onClick={copyRoomCode}
                              className="flex items-center space-x-1 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-300 text-xs font-medium transition-colors"
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
                          <code className="text-2xl font-mono font-bold text-white tracking-wider block break-all">
                            {lesson.room_code}
                          </code>
                        </div>
                        <p className="text-cyan-200 text-xs mt-3">
                          💡 Tip: Copy this code and paste it in the 100ms app
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white/5 rounded-xl p-6 border border-cyan-400/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
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
                    className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Got it! Close Instructions
                  </button>

                  {/* Alternative Option */}
                  <div className="text-center">
                    <p className="text-cyan-300 text-sm mb-2">Prefer to join via web instead?</p>
                    <button
                      onClick={handleJoinWeb}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium underline"
                    >
                      Join via Web Browser
                    </button>
                  </div>
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
      {/* Talbiyah Branded Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900/95 via-teal-900/95 to-emerald-900/95 backdrop-blur-sm border-b border-emerald-700/50 shadow-lg">
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
            <div className="text-right">
              <p className="text-white text-sm font-medium">
                with {lesson.teacher_name}
              </p>
              <p className="text-emerald-300 text-xs">
                {lesson.duration_minutes} minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HMSPrebuilt Component */}
      <div className="w-full h-full pt-20">
        <HMSPrebuilt
          roomCode={lesson.room_code}
          options={{
            userName: user?.email || 'Student',
            userId: user?.id || `user_${Date.now()}`,
          }}
          onJoinRoom={(data) => {
            console.log('✅ Successfully joined lesson:', data);
          }}
          onLeaveRoom={(data) => {
            console.log('👋 Left lesson:', data);
            handleLeave();
          }}
          onError={(error) => {
            console.error('❌ 100ms error:', error);
            setError(error.message || 'Failed to join the video session');
            setIsVideoReady(false);
          }}
        />
      </div>
    </div>
  );
}
