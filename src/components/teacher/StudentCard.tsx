import { Calendar, Clock, BookOpen, MessageCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentCardProps {
  relationshipId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  subjectName: string | null;
  totalLessons: number;
  totalHours: number;
  firstLessonDate: string;
  lastLessonDate: string | null;
  nextLessonTime: string | null;
  status: string;
}

export default function StudentCard({
  relationshipId,
  studentId,
  studentName,
  studentEmail,
  studentAvatar,
  subjectName,
  totalLessons,
  totalHours,
  firstLessonDate,
  lastLessonDate,
  nextLessonTime,
  status,
}: StudentCardProps) {
  const navigate = useNavigate();

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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-cyan-200">
              {getInitials(studentName)}
            </div>
          )}
          {/* Name & Subject */}
          <div>
            <h3 className="font-semibold text-gray-900">{studentName}</h3>
            {subjectName && (
              <p className="text-sm text-gray-600">{subjectName}</p>
            )}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Total Lessons */}
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-blue-900">{totalLessons}</p>
          <p className="text-xs text-blue-600">Lessons</p>
        </div>

        {/* Total Hours */}
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center text-purple-600 mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-purple-900">
            {totalHours.toFixed(1)}
          </p>
          <p className="text-xs text-purple-600">Hours</p>
        </div>

        {/* Student Since */}
        <div className="bg-cyan-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center text-cyan-600 mb-1">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-cyan-900">
            {new Date(firstLessonDate).toLocaleDateString('en-GB', {
              month: 'short',
              year: '2-digit',
            })}
          </p>
          <p className="text-xs text-cyan-600">Since</p>
        </div>
      </div>

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
          className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 transition font-medium text-sm flex items-center justify-center gap-2"
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

      {/* Status Badge (if not active) */}
      {status !== 'active' && (
        <div className="mt-3 text-center">
          <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
            {status === 'paused' ? '⏸ Paused' : '✓ Ended'}
          </span>
        </div>
      )}
    </div>
  );
}
