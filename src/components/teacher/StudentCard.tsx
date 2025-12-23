import { useState } from 'react';
import { Calendar, Clock, BookOpen, MessageCircle, TrendingUp, ChevronDown, ChevronUp, Maximize2, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentProgressPanel from './StudentProgressPanel';
import StudentQuranTracker from './StudentQuranTracker';
import StudentArabicTracker from './StudentArabicTracker';

interface SubjectData {
  subject_id: string | null;
  subject_name: string | null;
  total_lessons: number;
  total_hours: number;
  relationship_id: string;
  status: string;
}

interface StudentCardProps {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  subjects: SubjectData[];
  totalLessons: number;
  totalHours: number;
  firstLessonDate: string;
  lastLessonDate: string | null;
  nextLessonTime: string | null;
}

export default function StudentCard({
  studentId,
  studentName,
  studentAvatar,
  subjects,
  totalLessons,
  totalHours,
  firstLessonDate,
  lastLessonDate,
  nextLessonTime,
}: StudentCardProps) {
  const navigate = useNavigate();
  const [showProgress, setShowProgress] = useState(false);
  const [showFullTracker, setShowFullTracker] = useState(false);
  const [showArabicTracker, setShowArabicTracker] = useState(false);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);

  // Get currently selected subject data
  const selectedSubject = subjects[selectedSubjectIndex] || subjects[0];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatNextLesson = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 0) return null;
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays < 7) return `in ${diffDays}d`;
    return formatDate(dateString);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const nextLessonFormatted = formatNextLesson(nextLessonTime);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {studentAvatar ? (
            <img
              src={studentAvatar}
              alt={studentName}
              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-cyan-200">
              {getInitials(studentName)}
            </div>
          )}
          {/* Name */}
          <div>
            <h3 className="font-semibold text-gray-900">{studentName}</h3>
            <p className="text-xs text-gray-500">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Next Lesson Badge */}
        {nextLessonFormatted && (
          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Next: {nextLessonFormatted}
          </div>
        )}
      </div>

      {/* Subject Tabs */}
      {subjects.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject, index) => (
              <button
                key={subject.relationship_id}
                onClick={() => setSelectedSubjectIndex(index)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  selectedSubjectIndex === index
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{subject.subject_name || 'General'}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  selectedSubjectIndex === index
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }`}>
                  {subject.total_lessons}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid - Shows selected subject stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Total Lessons */}
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-blue-900">
            {subjects.length > 1 ? selectedSubject?.total_lessons || 0 : totalLessons}
          </p>
          <p className="text-xs text-blue-600">
            {subjects.length > 1 ? 'Subject Lessons' : 'Lessons'}
          </p>
        </div>

        {/* Total Hours */}
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center text-purple-600 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-purple-900">
            {subjects.length > 1
              ? (selectedSubject?.total_hours || 0).toFixed(1)
              : totalHours.toFixed(1)}
          </p>
          <p className="text-xs text-purple-600">
            {subjects.length > 1 ? 'Subject Hours' : 'Hours'}
          </p>
        </div>

        {/* Student Since */}
        <div className="bg-cyan-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center text-emerald-600 mb-1">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-cyan-900">
            {new Date(firstLessonDate).toLocaleDateString('en-GB', {
              month: 'short',
              year: '2-digit',
            })}
          </p>
          <p className="text-xs text-emerald-600">Since</p>
        </div>
      </div>

      {/* Total stats (when multiple subjects) */}
      {subjects.length > 1 && (
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg py-2">
          <span><strong>{totalLessons}</strong> total lessons</span>
          <span>•</span>
          <span><strong>{totalHours.toFixed(1)}</strong> total hours</span>
        </div>
      )}

      {/* Last Lesson */}
      {lastLessonDate && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>Last lesson: {formatDate(lastLessonDate)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/teacher/book-with-student/${studentId}`)}
          className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 transition font-medium text-sm flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Book Lesson
        </button>
        <button
          onClick={() => navigate(`/lesson/messages/${studentId}`)}
          className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
          title="Message student"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {/* View Progress Buttons */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setShowProgress(!showProgress)}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-medium text-sm"
        >
          <BookOpen className="w-4 h-4" />
          <span>{showProgress ? 'Hide' : 'Quick View'}</span>
          {showProgress ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => setShowFullTracker(true)}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm"
          title="Open full Quran tracker"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">Quran</span>
        </button>
        <button
          onClick={() => setShowArabicTracker(true)}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium text-sm"
          title="Open Arabic progress tracker"
        >
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline">Arabic</span>
        </button>
      </div>

      {/* Progress Panel (Quick View) */}
      {showProgress && (
        <div className="mt-3 bg-white rounded-lg p-4">
          <StudentProgressPanel
            studentId={studentId}
            studentName={studentName}
            subjectId={selectedSubject?.subject_id || ''}
            subjectName={selectedSubject?.subject_name || 'Quran'}
          />
        </div>
      )}

      {/* Full Quran Tracker Modal */}
      {showFullTracker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8">
            <StudentQuranTracker
              studentId={studentId}
              studentName={studentName}
              onClose={() => setShowFullTracker(false)}
            />
          </div>
        </div>
      )}

      {/* Full Arabic Tracker Modal */}
      {showArabicTracker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8">
            <StudentArabicTracker
              studentId={studentId}
              studentName={studentName}
              onClose={() => setShowArabicTracker(false)}
            />
          </div>
        </div>
      )}

      {/* Status Badge for paused subjects */}
      {selectedSubject?.status && selectedSubject.status !== 'active' && (
        <div className="mt-3 text-center">
          <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
            {selectedSubject.status === 'paused' ? '⏸ Paused' : '✓ Ended'}
          </span>
        </div>
      )}
    </div>
  );
}
