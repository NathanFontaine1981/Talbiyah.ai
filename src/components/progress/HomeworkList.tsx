import { useState, useEffect } from 'react';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Circle,
  ChevronRight,
  AlertCircle,
  Calendar,
  User,
  Headphones,
  PenTool,
  BookMarked,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Homework {
  id: string;
  title: string;
  description?: string;
  homework_type: 'practice' | 'memorization' | 'revision' | 'reading' | 'listening' | 'writing' | 'other';
  surah_number?: number;
  ayat_start?: number;
  ayat_end?: number;
  status: 'assigned' | 'in_progress' | 'submitted' | 'reviewed' | 'completed';
  due_date?: string;
  assigned_by: string;
  teacher_name?: string;
  review_notes?: string;
  rating?: number;
  created_at: string;
}

const homeworkTypeConfig = {
  practice: {
    icon: BookOpen,
    label: 'Practice',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  memorization: {
    icon: BookMarked,
    label: 'Memorization',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  revision: {
    icon: RotateCcw,
    label: 'Revision',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  reading: {
    icon: BookOpen,
    label: 'Reading',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  listening: {
    icon: Headphones,
    label: 'Listening',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  writing: {
    icon: PenTool,
    label: 'Writing',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  other: {
    icon: Circle,
    label: 'Other',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
};

const statusConfig = {
  assigned: {
    label: 'To Do',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  submitted: {
    label: 'Submitted',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  reviewed: {
    label: 'Reviewed',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
};

// Surah names subset
const surahNames: Record<number, string> = {
  1: 'Al-Fatiha',
  112: 'Al-Ikhlas',
  113: 'Al-Falaq',
  114: 'An-Nas',
  108: 'Al-Kawthar',
  103: 'Al-Asr',
  // Add more as needed
};

function getDueDateLabel(dueDate: string): { label: string; urgent: boolean } {
  const date = new Date(dueDate);

  if (isPast(date) && !isToday(date)) {
    return { label: 'Overdue', urgent: true };
  }
  if (isToday(date)) {
    return { label: 'Due today', urgent: true };
  }
  if (isTomorrow(date)) {
    return { label: 'Due tomorrow', urgent: false };
  }

  const days = differenceInDays(date, new Date());
  if (days <= 7) {
    return { label: `Due in ${days} days`, urgent: false };
  }

  return { label: format(date, 'MMM d'), urgent: false };
}

interface HomeworkCardProps {
  homework: Homework;
  onStatusChange?: (id: string, status: Homework['status']) => void;
  variant?: 'compact' | 'detailed';
}

function HomeworkCard({ homework, onStatusChange, variant = 'detailed' }: HomeworkCardProps) {
  const typeConfig = homeworkTypeConfig[homework.homework_type];
  const status = statusConfig[homework.status];
  const TypeIcon = typeConfig.icon;

  const dueInfo = homework.due_date ? getDueDateLabel(homework.due_date) : null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
        <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{homework.title}</p>
          {homework.surah_number && (
            <p className="text-xs text-gray-500">
              {surahNames[homework.surah_number] || `Surah ${homework.surah_number}`}
              {homework.ayat_start && homework.ayat_end && (
                <span> (Ayat {homework.ayat_start}-{homework.ayat_end})</span>
              )}
            </p>
          )}
        </div>
        {dueInfo && (
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            dueInfo.urgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {dueInfo.label}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
              <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{homework.title}</h3>
              <span className={`text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>

        {homework.description && (
          <p className="text-sm text-gray-600 mb-3">{homework.description}</p>
        )}

        {/* Surah info */}
        {homework.surah_number && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg mb-3">
            <BookMarked className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              {surahNames[homework.surah_number] || `Surah ${homework.surah_number}`}
            </span>
            {homework.ayat_start && homework.ayat_end && (
              <span className="text-sm text-purple-600">
                Ayat {homework.ayat_start} - {homework.ayat_end}
              </span>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {homework.teacher_name && (
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {homework.teacher_name}
            </span>
          )}
          {dueInfo && (
            <span className={`flex items-center gap-1 ${dueInfo.urgent ? 'text-red-600 font-medium' : ''}`}>
              {dueInfo.urgent ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              {dueInfo.label}
            </span>
          )}
        </div>

        {/* Review notes */}
        {homework.review_notes && (
          <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs font-medium text-emerald-700 mb-1">Teacher Feedback</p>
            <p className="text-sm text-emerald-600">{homework.review_notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {homework.status !== 'completed' && onStatusChange && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
          {homework.status === 'assigned' && (
            <button
              onClick={() => onStatusChange(homework.id, 'in_progress')}
              className="flex-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Start Working
            </button>
          )}
          {homework.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange(homework.id, 'submitted')}
              className="flex-1 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Mark as Done
            </button>
          )}
          {homework.status === 'reviewed' && (
            <button
              onClick={() => onStatusChange(homework.id, 'completed')}
              className="flex-1 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface HomeworkListProps {
  studentId?: string;
  variant?: 'full' | 'compact' | 'dashboard';
  showCompleted?: boolean;
}

export default function HomeworkList({
  studentId,
  variant = 'full',
  showCompleted = false,
}: HomeworkListProps) {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    async function fetchHomework() {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }
      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('student_homework')
          .select(`
            *,
            assigned_by_profile:profiles!student_homework_assigned_by_fkey(full_name)
          `)
          .eq('student_id', targetId)
          .order('due_date', { ascending: true, nullsFirst: false });

        if (!showCompleted && filter !== 'completed') {
          query = query.neq('status', 'completed');
        }

        if (filter === 'completed') {
          query = query.eq('status', 'completed');
        }

        const { data } = await query;

        const formattedHomework = (data || []).map((h: any) => ({
          ...h,
          teacher_name: h.assigned_by_profile?.full_name,
        }));

        setHomework(formattedHomework);
      } catch (error) {
        console.error('Error fetching homework:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHomework();
  }, [studentId, showCompleted, filter]);

  const handleStatusChange = async (id: string, status: Homework['status']) => {
    try {
      const updates: Record<string, any> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      await supabase
        .from('student_homework')
        .update(updates)
        .eq('id', id);

      setHomework((prev) =>
        prev.map((h) => (h.id === id ? { ...h, status } : h))
      );
    } catch (error) {
      console.error('Error updating homework status:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  const pendingHomework = homework.filter((h) => h.status !== 'completed');
  const completedHomework = homework.filter((h) => h.status === 'completed');
  const overdueCount = pendingHomework.filter(
    (h) => h.due_date && isPast(new Date(h.due_date)) && !isToday(new Date(h.due_date))
  ).length;

  if (variant === 'dashboard') {
    if (pendingHomework.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No pending homework</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{overdueCount} overdue assignment{overdueCount > 1 ? 's' : ''}</span>
          </div>
        )}
        {pendingHomework.slice(0, 3).map((h) => (
          <HomeworkCard
            key={h.id}
            homework={h}
            variant="compact"
          />
        ))}
        {pendingHomework.length > 3 && (
          <p className="text-sm text-center text-gray-500">
            +{pendingHomework.length - 3} more assignments
          </p>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Homework</h2>
          <p className="text-sm text-gray-500">
            {pendingHomework.length} pending • {completedHomework.length} completed
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['pending', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue warning */}
      {overdueCount > 0 && filter !== 'completed' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-700">
              {overdueCount} Overdue Assignment{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-red-600">
              Please complete these as soon as possible
            </p>
          </div>
        </div>
      )}

      {/* Homework list */}
      {homework.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No homework</p>
          <p className="text-sm">
            {filter === 'completed'
              ? "You haven't completed any homework yet"
              : 'No pending assignments'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {homework.map((h) => (
            <HomeworkCard
              key={h.id}
              homework={h}
              onStatusChange={handleStatusChange}
              variant={variant === 'compact' ? 'compact' : 'detailed'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Mini version for sidebar
export function HomeworkSummary({ studentId }: { studentId?: string }) {
  const [count, setCount] = useState({ pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }
      if (!targetId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('student_homework')
        .select('id, due_date, status')
        .eq('student_id', targetId)
        .neq('status', 'completed');

      const pending = data?.length || 0;
      const overdue = (data || []).filter(
        (h) => h.due_date && isPast(new Date(h.due_date)) && !isToday(new Date(h.due_date))
      ).length;

      setCount({ pending, overdue });
      setLoading(false);
    }

    fetchCount();
  }, [studentId]);

  if (loading) {
    return <div className="h-12 animate-pulse bg-gray-100 rounded-lg" />;
  }

  if (count.pending === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">All homework done!</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${
      count.overdue > 0 ? 'bg-red-50' : 'bg-amber-50'
    }`}>
      {count.overdue > 0 ? (
        <>
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm font-medium text-red-700">
            {count.overdue} overdue, {count.pending - count.overdue} pending
          </span>
        </>
      ) : (
        <>
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            {count.pending} assignment{count.pending > 1 ? 's' : ''} pending
          </span>
        </>
      )}
    </div>
  );
}
