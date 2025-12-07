import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, BookOpen, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface Lesson {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  student_name: string;
  subject_name: string;
}

interface WeeklyCalendarProps {
  teacherId: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyCalendar({ teacherId }: WeeklyCalendarProps) {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    // Calculate days since Monday (Monday = 0, Sunday = 6)
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(today);
    start.setDate(today.getDate() - daysSinceMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredLesson, setHoveredLesson] = useState<string | null>(null);

  // Calculate week dates
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    });
  }, [currentWeekStart]);

  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentWeekStart]);

  useEffect(() => {
    loadLessons();
  }, [teacherId, currentWeekStart]);

  async function loadLessons() {
    setLoading(true);
    try {
      const startISO = currentWeekStart.toISOString();
      const endISO = weekEnd.toISOString();

      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          subjects(name),
          student:learners!lessons_learner_id_fkey(name)
        `)
        .eq('teacher_id', teacherId)
        .gte('scheduled_time', startISO)
        .lte('scheduled_time', endISO)
        .in('status', ['booked', 'scheduled', 'confirmed', 'pending'])
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const formattedLessons: Lesson[] = (data || []).map(lesson => ({
        id: lesson.id,
        scheduled_time: lesson.scheduled_time,
        duration_minutes: lesson.duration_minutes,
        status: lesson.status,
        student_name: (lesson.student as any)?.name || 'Unknown Student',
        subject_name: (lesson.subjects as any)?.name || 'General',
      }));

      setLessons(formattedLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newStart = new Date(prev);
      newStart.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newStart;
    });
  };

  const goToToday = () => {
    const today = new Date();
    // Calculate days since Monday (Monday = 0, Sunday = 6)
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(today);
    start.setDate(today.getDate() - daysSinceMonday);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  // Get lessons for a specific day and time
  const getLessonsForTimeSlot = (date: Date, hour: number) => {
    return lessons.filter(lesson => {
      const lessonDate = new Date(lesson.scheduled_time);
      const lessonHour = lessonDate.getHours();
      return (
        lessonDate.getDate() === date.getDate() &&
        lessonDate.getMonth() === date.getMonth() &&
        lessonDate.getFullYear() === date.getFullYear() &&
        lessonHour === hour
      );
    });
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get subject color based on course type
  const getSubjectColor = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('quran') || name.includes('qur\'an') || name.includes('tajweed')) {
      return 'from-emerald-500 to-teal-600'; // Green for Quran
    } else if (name.includes('arabic')) {
      return 'from-blue-500 to-cyan-600'; // Blue for Arabic
    } else if (name.includes('islamic') || name.includes('revert') || name.includes('fiqh') || name.includes('aqeedah')) {
      return 'from-purple-500 to-pink-600'; // Purple for Islamic Studies
    }
    return 'from-slate-500 to-slate-600'; // Default
  };

  const getSubjectBorderColor = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('quran') || name.includes('qur\'an') || name.includes('tajweed')) {
      return 'border-emerald-500/50'; // Green for Quran
    } else if (name.includes('arabic')) {
      return 'border-blue-500/50'; // Blue for Arabic
    } else if (name.includes('islamic') || name.includes('revert') || name.includes('fiqh') || name.includes('aqeedah')) {
      return 'border-purple-500/50'; // Purple for Islamic Studies
    }
    return 'border-slate-500/50'; // Default
  };

  // Format date range for header
  const formatWeekRange = () => {
    const startMonth = currentWeekStart.toLocaleDateString('en-GB', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-GB', { month: 'short' });
    const startDay = currentWeekStart.getDate();
    const endDay = weekEnd.getDate();
    const year = currentWeekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  };

  // Count total lessons this week
  const totalLessonsThisWeek = lessons.length;
  const totalHoursThisWeek = lessons.reduce((sum, l) => sum + l.duration_minutes, 0) / 60;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700/50 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Weekly Schedule</h2>
              <p className="text-slate-400 text-sm">
                {totalLessonsThisWeek} lesson{totalLessonsThisWeek !== 1 ? 's' : ''} • {totalHoursThisWeek.toFixed(1)} hours
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-medium text-sm transition"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-2xl font-bold text-white">{formatWeekRange()}</h3>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-slate-700/50">
            {/* Time column header */}
            <div className="p-3 bg-slate-800/30" />

            {/* Day columns */}
            {weekDates.map((date, index) => (
              <div
                key={index}
                className={`p-3 text-center border-l border-slate-700/50 ${
                  isToday(date) ? 'bg-cyan-500/10' : 'bg-slate-800/30'
                }`}
              >
                <p className={`text-xs font-medium ${isToday(date) ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {DAYS_OF_WEEK[index]}
                </p>
                <p className={`text-lg font-bold ${isToday(date) ? 'text-cyan-400' : 'text-white'}`}>
                  {date.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-slate-700/30">
                  {/* Time label */}
                  <div className="p-2 text-right pr-3 bg-slate-800/20">
                    <span className="text-xs text-slate-500">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>

                  {/* Day cells */}
                  {weekDates.map((date, dayIndex) => {
                    const dayLessons = getLessonsForTimeSlot(date, hour);
                    const isPast = date < new Date() && !isToday(date);

                    return (
                      <div
                        key={dayIndex}
                        className={`min-h-[60px] p-1 border-l border-slate-700/30 relative ${
                          isToday(date) ? 'bg-cyan-500/5' : ''
                        } ${isPast ? 'bg-slate-900/30' : ''}`}
                      >
                        {dayLessons.map((lesson) => {
                          const lessonStart = new Date(lesson.scheduled_time);
                          const minuteOffset = lessonStart.getMinutes();
                          const heightPercent = (lesson.duration_minutes / 60) * 100;
                          const topOffset = (minuteOffset / 60) * 100;

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => navigate(`/lesson/${lesson.id}`)}
                              onMouseEnter={() => setHoveredLesson(lesson.id)}
                              onMouseLeave={() => setHoveredLesson(null)}
                              className={`absolute left-1 right-1 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden border ${getSubjectBorderColor(lesson.subject_name)} ${
                                hoveredLesson === lesson.id ? 'scale-[1.02] z-20 shadow-xl' : 'z-10'
                              }`}
                              style={{
                                top: `${topOffset}%`,
                                height: `${Math.max(heightPercent, 80)}%`,
                                minHeight: '48px',
                              }}
                            >
                              <div className={`h-full bg-gradient-to-br ${getSubjectColor(lesson.subject_name)} p-2`}>
                                <div className="flex flex-col h-full">
                                  <p className="text-xs font-semibold text-white truncate">
                                    {lesson.student_name}
                                  </p>
                                  <p className="text-[10px] text-white/70 truncate">
                                    {lesson.subject_name}
                                  </p>
                                  <p className="text-[10px] text-white/60 mt-auto">
                                    {lessonStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>

                              {/* Hover tooltip */}
                              {hoveredLesson === lesson.id && (
                                <div className="absolute top-full left-0 mt-1 z-30 bg-slate-900 rounded-lg shadow-xl border border-slate-700 p-3 min-w-[200px]">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-cyan-400" />
                                      <span className="text-sm text-white font-medium">{lesson.student_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="w-4 h-4 text-blue-400" />
                                      <span className="text-sm text-slate-300">{lesson.subject_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-emerald-400" />
                                      <span className="text-sm text-slate-300">
                                        {lessonStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • {lesson.duration_minutes}min
                                      </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-700">
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        lesson.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                                        lesson.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-cyan-500/20 text-cyan-400'
                                      }`}>
                                        {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Current time indicator */}
              {weekDates.some(d => isToday(d)) && (
                <CurrentTimeIndicator weekDates={weekDates} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-teal-600" />
            <span className="text-slate-400">Qur'an</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-500 to-cyan-600" />
            <span className="text-slate-400">Arabic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-purple-500 to-pink-600" />
            <span className="text-slate-400">Islamic Studies</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Current time indicator component
function CurrentTimeIndicator({ weekDates }: { weekDates: Date[] }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const todayIndex = weekDates.findIndex(d => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  if (todayIndex === -1) return null;

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();

  if (hour < 7 || hour > 20) return null;

  const topPosition = (hour - 7) * 60 + minute;
  const leftPosition = ((todayIndex + 1) / 8) * 100;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-30"
      style={{ top: `${topPosition}px` }}
    >
      <div className="relative">
        {/* Red dot */}
        <div
          className="absolute w-3 h-3 bg-red-500 rounded-full -translate-y-1/2 shadow-lg shadow-red-500/50"
          style={{ left: `${(1 / 8) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        />
        {/* Line */}
        <div
          className="absolute h-0.5 bg-red-500/70"
          style={{ left: `${leftPosition}%`, right: '0' }}
        />
      </div>
    </div>
  );
}
