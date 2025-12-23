import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Star,
  FileText,
  MessageSquare,
} from 'lucide-react';

interface LessonDetails {
  topics_covered?: string[];
  surahs_practiced?: number[];
  ayat_range_start?: number;
  ayat_range_end?: number;
  teacher_notes?: string;
  strengths_observed?: string;
  areas_for_improvement?: string;
  recommended_focus?: string;
  homework_assigned?: boolean;
}

interface Lesson {
  id: string;
  title?: string;
  scheduled_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  teacher_id?: string;
  teacher?: {
    full_name: string;
    avatar_url?: string;
  };
  subject?: {
    name: string;
    icon?: string;
  };
  lesson_details?: LessonDetails;
  rating?: number;
}

interface DetailedLessonCardProps {
  lesson: Lesson;
  variant?: 'compact' | 'detailed' | 'timeline';
  showDetails?: boolean;
  onViewDetails?: () => void;
}

// Surah name lookup (subset for common surahs)
const surahNames: Record<number, string> = {
  1: 'Al-Fatiha',
  112: 'Al-Ikhlas',
  113: 'Al-Falaq',
  114: 'An-Nas',
  108: 'Al-Kawthar',
  103: 'Al-Asr',
  110: 'An-Nasr',
  111: 'Al-Masad',
  109: 'Al-Kafirun',
  107: 'Al-Maun',
  106: 'Quraysh',
  105: 'Al-Fil',
  104: 'Al-Humazah',
  102: 'At-Takathur',
  101: 'Al-Qariah',
  100: 'Al-Adiyat',
  99: 'Az-Zalzalah',
  98: 'Al-Bayyinah',
  97: 'Al-Qadr',
  96: 'Al-Alaq',
  95: 'At-Tin',
  94: 'Ash-Sharh',
  93: 'Ad-Duha',
  67: 'Al-Mulk',
  36: 'Ya-Sin',
  55: 'Ar-Rahman',
  56: 'Al-Waqiah',
  18: 'Al-Kahf',
};

function getSurahName(number: number): string {
  return surahNames[number] || `Surah ${number}`;
}

const statusConfig = {
  scheduled: {
    label: 'Upcoming',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
};

export default function DetailedLessonCard({
  lesson,
  variant = 'detailed',
  showDetails: initialShowDetails = false,
  onViewDetails,
}: DetailedLessonCardProps) {
  const [expanded, setExpanded] = useState(initialShowDetails);
  const status = statusConfig[lesson.status];
  const details = lesson.lesson_details;
  const hasDetails = details && (
    details.topics_covered?.length ||
    details.surahs_practiced?.length ||
    details.teacher_notes ||
    details.strengths_observed ||
    details.areas_for_improvement
  );

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors">
        <div className={`p-2 rounded-lg ${status.bg}`}>
          <Calendar className={`w-4 h-4 ${status.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {lesson.title || 'Quran Lesson'}
          </p>
          <p className="text-sm text-gray-500">
            {format(new Date(lesson.scheduled_time), 'MMM d, yyyy')} • {lesson.duration_minutes} min
          </p>
        </div>
        {lesson.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium text-gray-700">{lesson.rating}</span>
          </div>
        )}
        <span className={`text-xs font-medium px-2 py-1 rounded ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>
    );
  }

  if (variant === 'timeline') {
    return (
      <div className="relative pl-8 pb-8 last:pb-0">
        {/* Timeline line */}
        <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-gray-200 last:hidden" />

        {/* Timeline dot */}
        <div
          className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-white shadow ${
            lesson.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
        >
          {lesson.status === 'completed' && (
            <CheckCircle className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-gray-900">
                {lesson.title || 'Quran Lesson'}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(lesson.scheduled_time), 'EEEE, MMMM d, yyyy • h:mm a')}
              </p>
            </div>
            {lesson.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{lesson.rating}</span>
              </div>
            )}
          </div>

          {details?.surahs_practiced && details.surahs_practiced.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {details.surahs_practiced.map((num) => (
                <span
                  key={num}
                  className="text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-700"
                >
                  {getSurahName(num)}
                </span>
              ))}
            </div>
          )}

          {details?.teacher_notes && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {details.teacher_notes}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {lesson.subject?.icon && (
              <span className="text-2xl">{lesson.subject.icon}</span>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {lesson.title || lesson.subject?.name || 'Quran Lesson'}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(lesson.scheduled_time), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {lesson.duration_minutes} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lesson.rating && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium text-amber-700">{lesson.rating}/5</span>
              </div>
            )}
            <span className={`text-xs font-medium px-2 py-1 rounded ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Teacher info */}
        {lesson.teacher && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {lesson.teacher.avatar_url ? (
              <img
                src={lesson.teacher.avatar_url}
                alt={lesson.teacher.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
            )}
            <span className="text-sm text-gray-600">with</span>
            <span className="text-sm font-medium text-gray-900">
              {lesson.teacher.full_name}
            </span>
          </div>
        )}
      </div>

      {/* Surahs practiced */}
      {details?.surahs_practiced && details.surahs_practiced.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Surahs Practiced</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {details.surahs_practiced.map((num) => (
              <span
                key={num}
                className="text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-700"
              >
                {getSurahName(num)}
                {details.ayat_range_start && details.ayat_range_end && (
                  <span className="text-purple-500 ml-1">
                    ({details.ayat_range_start}-{details.ayat_range_end})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Topics covered */}
      {details?.topics_covered && details.topics_covered.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Topics Covered</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {details.topics_covered.map((topic, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-700"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable details */}
      {hasDetails && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View Teacher Notes
              </>
            )}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-4">
              {details?.teacher_notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Teacher Notes</span>
                  </div>
                  <p className="text-sm text-gray-600">{details.teacher_notes}</p>
                </div>
              )}

              {details?.strengths_observed && (
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm font-medium text-emerald-700">Strengths</span>
                  <p className="text-sm text-emerald-600 mt-1">{details.strengths_observed}</p>
                </div>
              )}

              {details?.areas_for_improvement && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <span className="text-sm font-medium text-amber-700">Areas for Improvement</span>
                  <p className="text-sm text-amber-600 mt-1">{details.areas_for_improvement}</p>
                </div>
              )}

              {details?.recommended_focus && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">Recommended Focus</span>
                  <p className="text-sm text-blue-600 mt-1">{details.recommended_focus}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// List component for recent lessons
export function RecentLessonsList({ lessons, variant = 'compact' }: { lessons: Lesson[]; variant?: 'compact' | 'timeline' }) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No lessons yet</p>
        <p className="text-sm">Book your first lesson to get started</p>
      </div>
    );
  }

  if (variant === 'timeline') {
    return (
      <div className="space-y-0">
        {lessons.map((lesson) => (
          <DetailedLessonCard key={lesson.id} lesson={lesson} variant="timeline" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <DetailedLessonCard key={lesson.id} lesson={lesson} variant="compact" />
      ))}
    </div>
  );
}
