import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay, isPast, parseISO, setHours, setMinutes } from 'date-fns';
import { ArrowLeft, CalendarClock, Check } from 'lucide-react';

interface Lesson {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  teacher_id: string;
  teacher_name: string;
  subject_name: string;
}

export default function RescheduleLesson() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  useEffect(() => {
    if (selectedDate && lesson) {
      loadAvailableSlots(lesson.teacher_id, selectedDate);
    }
  }, [selectedDate, lesson]);

  async function loadLesson() {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          teacher_id,
          teacher_profiles!inner(
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

      if (error) throw error;

      setLesson({
        id: data.id,
        scheduled_time: data.scheduled_time,
        duration_minutes: data.duration_minutes,
        teacher_id: data.teacher_id,
        teacher_name: data.teacher_profiles.profiles.full_name,
        subject_name: data.subjects.name
      });
    } catch (error) {
      console.error('Error loading lesson:', error);
      toast.error('Failed to load lesson details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots(teacherId: string, date: Date) {
    setLoadingSlots(true);
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();

      // Get teacher's recurring availability
      const { data: recurringAvail } = await supabase
        .from('teacher_availability')
        .select('start_time, end_time, is_available')
        .eq('teacher_id', teacherId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      // Get one-off availability
      const { data: oneOffAvail } = await supabase
        .from('teacher_availability_one_off')
        .select('start_time, end_time, is_available')
        .eq('teacher_id', teacherId)
        .eq('date', dateKey)
        .eq('is_available', true);

      // Get existing booked lessons
      const { data: bookedLessons } = await supabase
        .from('lessons')
        .select('scheduled_time, duration_minutes')
        .eq('teacher_id', teacherId)
        .gte('scheduled_time', `${dateKey}T00:00:00`)
        .lte('scheduled_time', `${dateKey}T23:59:59`)
        .eq('status', 'booked');

      // Generate time slots
      const slots: string[] = [];
      const allAvailability = [...(recurringAvail || []), ...(oneOffAvail || [])];

      allAvailability.forEach(avail => {
        const [startHour, startMinute] = avail.start_time.split(':').map(Number);
        const [endHour, endMinute] = avail.end_time.split(':').map(Number);

        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const slotTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          const slotDateTime = setMinutes(setHours(date, currentHour), currentMinute);

          // Check if slot is at least 2 hours in the future
          const twoHoursFromNow = new Date();
          twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

          if (slotDateTime >= twoHoursFromNow) {
            // Check if slot is not already booked
            const isBooked = bookedLessons?.some(booked => {
              const bookedTime = parseISO(booked.scheduled_time);
              const bookedEndTime = new Date(bookedTime.getTime() + booked.duration_minutes * 60000);
              return slotDateTime >= bookedTime && slotDateTime < bookedEndTime;
            });

            if (!isBooked) {
              slots.push(slotTime);
            }
          }

          // Move to next 30-minute slot
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour += 1;
          }
        }
      });

      setAvailableSlots(slots.sort());
    } catch (error) {
      console.error('Error loading available slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleReschedule() {
    if (!lesson || !selectedDate || !selectedTime) return;

    setRescheduling(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newDateTime = setMinutes(setHours(selectedDate, hours), minutes);

      const { error } = await supabase
        .from('lessons')
        .update({ scheduled_time: newDateTime.toISOString() })
        .eq('id', lesson.id);

      if (error) throw error;

      toast.success('Lesson rescheduled successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error rescheduling lesson:', error);
      toast.error('Failed to reschedule lesson. Please try again.');
    } finally {
      setRescheduling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading lesson details...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Lesson not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to reschedule form
      </a>
      <main id="main-content" className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <CalendarClock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Reschedule Lesson</h1>
              <p className="text-gray-500 text-lg">Choose a new date and time</p>
            </div>
          </div>
        </div>

        {/* Current Lesson Info */}
        <div className="bg-gray-50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-emerald-400/30">
          <h2 className="text-emerald-600 text-sm font-semibold mb-3">Current Lesson</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Subject</p>
              <p className="text-white font-semibold text-lg">{lesson.subject_name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Teacher</p>
              <p className="text-white font-semibold text-lg">{lesson.teacher_name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Current Time</p>
              <p className="text-cyan-300 font-semibold text-lg">
                {format(parseISO(lesson.scheduled_time), 'EEE, MMM d, yyyy \'at\' h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
            aria-label="Go to previous week"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-xl transition font-semibold"
          >
            Previous Week
          </button>
          <span className="text-white font-semibold text-lg">
            {weekOffset === 0 ? 'This Week' : `${weekOffset} ${weekOffset === 1 ? 'week' : 'weeks'} ahead`}
          </span>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            aria-label="Go to next week"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition font-semibold"
          >
            Next Week
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-gray-50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-200">
          <h2 className="text-white text-xl font-bold mb-6">Select a Date</h2>
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 }), i);
              const isSelected = selectedDate && isSameDay(selectedDate, date);
              const isPastDate = isPast(date) && !isSameDay(date, new Date());

              return (
                <button
                  key={i}
                  onClick={() => !isPastDate && setSelectedDate(date)}
                  disabled={isPastDate}
                  aria-pressed={isSelected}
                  aria-label={`Select ${format(date, 'EEEE, MMMM d')}`}
                  className={`p-6 rounded-xl border-2 transition text-center ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20'
                      : isPastDate
                      ? 'border-gray-200 bg-white opacity-50 cursor-not-allowed'
                      : 'border-gray-200 bg-gray-50 hover:border-emerald-500/50 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-sm text-gray-500 mb-2">{format(date, 'EEE')}</div>
                  <div className="text-3xl font-bold text-white mb-2">{format(date, 'd')}</div>
                  <div className="text-sm text-gray-500">{format(date, 'MMM')}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="bg-gray-50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-200">
            <h2 className="text-white text-xl font-bold mb-6">
              Available Times for {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            {loadingSlots ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading available times...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-500 text-lg">No available times for this date</p>
                <p className="text-gray-500 mt-2">Please select another day</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {availableSlots.map((timeSlot) => (
                  <button
                    key={timeSlot}
                    onClick={() => setSelectedTime(timeSlot)}
                    aria-pressed={selectedTime === timeSlot}
                    aria-label={`Select time ${timeSlot}`}
                    className={`p-4 rounded-xl border-2 transition font-semibold ${
                      selectedTime === timeSlot
                        ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-emerald-500/50 hover:bg-gray-200'
                    }`}
                  >
                    {timeSlot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-8 py-4 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || rescheduling}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition flex items-center justify-center space-x-2"
          >
            {rescheduling ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Rescheduling...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirm Reschedule</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
