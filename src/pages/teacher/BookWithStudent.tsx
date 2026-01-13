import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Calendar, Clock, BookOpen, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';

interface Student {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Subject {
  id: string;
  name: string;
}

interface TimeSlot {
  time: Date;
  available: boolean;
}

export default function BookWithStudent() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<{ id: string } | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [duration, setDuration] = useState<30 | 60>(30);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId]);

  useEffect(() => {
    if (selectedSubject && teacherProfile) {
      loadAvailability();
    }
  }, [selectedSubject, duration, selectedWeek, teacherProfile]);

  async function loadData() {
    try {
      // Get current user's teacher profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in');
        navigate('/login');
        return;
      }

      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacherData) {
        toast.error('Teacher profile not found');
        navigate('/teacher/hub');
        return;
      }

      setTeacherProfile(teacherData);

      // Load student info
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', studentId)
        .single();

      if (studentError) {
        // Try learners table
        const { data: learnerData, error: learnerError } = await supabase
          .from('learners')
          .select('id, full_name, avatar_url')
          .eq('id', studentId)
          .single();

        if (learnerError) {
          toast.error('Student not found');
          navigate('/teacher/my-students');
          return;
        }
        setStudent(learnerData);
      } else {
        setStudent(studentData);
      }

      // Load teacher's subjects
      const { data: subjectsData } = await supabase
        .from('teacher_subjects')
        .select('subject_id, subjects(id, name)')
        .eq('teacher_id', teacherData.id);

      if (subjectsData && subjectsData.length > 0) {
        const subjectsList = subjectsData
          .map(s => s.subjects)
          .filter(Boolean) as Subject[];
        setSubjects(subjectsList);
        if (subjectsList.length > 0) {
          setSelectedSubject(subjectsList[0]);
        }
      } else {
        // Fallback to all subjects
        const { data: allSubjects } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name');
        if (allSubjects) {
          setSubjects(allSubjects);
          if (allSubjects.length > 0) {
            setSelectedSubject(allSubjects[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability() {
    if (!teacherProfile) return;

    setLoadingSlots(true);
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 0 });
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      // Get teacher's availability
      const { data: availability } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherProfile.id);

      // Get existing lessons to filter out booked slots
      const startDate = format(weekDays[0], 'yyyy-MM-dd');
      const endDate = format(weekDays[6], 'yyyy-MM-dd');

      const { data: existingLessons } = await supabase
        .from('lessons')
        .select('scheduled_at, duration_minutes')
        .eq('teacher_id', teacherProfile.id)
        .gte('scheduled_at', `${startDate}T00:00:00`)
        .lte('scheduled_at', `${endDate}T23:59:59`)
        .in('status', ['scheduled', 'confirmed', 'in_progress']);

      // Build time slots
      const slots: TimeSlot[] = [];

      for (const day of weekDays) {
        const dayOfWeek = day.getDay();
        const dayAvailability = availability?.filter(a => a.day_of_week === dayOfWeek) || [];

        for (const slot of dayAvailability) {
          const [startHour, startMinute] = slot.start_time.split(':').map(Number);
          const [endHour, endMinute] = slot.end_time.split(':').map(Number);

          let currentHour = startHour;
          let currentMinute = startMinute;

          while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const slotTime = setMinutes(setHours(day, currentHour), currentMinute);

            // Check if slot is in the past
            if (slotTime < new Date()) {
              currentMinute += 30;
              if (currentMinute >= 60) {
                currentHour++;
                currentMinute = 0;
              }
              continue;
            }

            // Check if slot conflicts with existing lessons
            const isBooked = existingLessons?.some(lesson => {
              const lessonStart = new Date(lesson.scheduled_at);
              const lessonEnd = new Date(lessonStart.getTime() + lesson.duration_minutes * 60000);
              const slotEnd = new Date(slotTime.getTime() + duration * 60000);
              return slotTime < lessonEnd && slotEnd > lessonStart;
            });

            slots.push({
              time: slotTime,
              available: !isBooked
            });

            currentMinute += 30;
            if (currentMinute >= 60) {
              currentHour++;
              currentMinute = 0;
            }
          }
        }
      }

      setTimeSlots(slots.sort((a, b) => a.time.getTime() - b.time.getTime()));
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleBookLesson() {
    if (!selectedSlot || !selectedSubject || !teacherProfile || !student) {
      toast.error('Please select a time slot');
      return;
    }

    setBooking(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-booking-with-room', {
        body: {
          teacherId: teacherProfile.visibleId,
          learnerId: student.id,
          subjectId: selectedSubject.id,
          scheduledAt: selectedSlot.toISOString(),
          durationMinutes: duration,
          isTeacherInitiated: true
        }
      });

      if (error) throw error;

      toast.success('Lesson booked successfully!');
      navigate('/teacher/schedule');
    } catch (error: any) {
      console.error('Error booking lesson:', error);
      toast.error(error.message || 'Failed to book lesson');
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group slots by day
  const slotsByDay = weekDays.map(day => ({
    date: day,
    slots: timeSlots.filter(slot => isSameDay(slot.time, day))
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              {student?.avatar_url ? (
                <img
                  src={student.avatar_url}
                  alt={student.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Book Lesson with {student?.full_name}
              </h1>
              <p className="text-gray-500 text-sm">Select a subject and time slot</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Subject Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Subject
          </h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedSubject?.id === subject.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subject.name}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Duration
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setDuration(30)}
              className={`flex-1 py-3 rounded-lg text-center font-medium transition ${
                duration === 30
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 minutes
            </button>
            <button
              onClick={() => setDuration(60)}
              className={`flex-1 py-3 rounded-lg text-center font-medium transition ${
                duration === 60
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              60 minutes
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Select Time
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Previous
              </button>
              <button
                onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Next
              </button>
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {slotsByDay.map(({ date, slots }) => (
                <div key={date.toISOString()} className="space-y-1">
                  <div className="text-center text-xs font-medium text-gray-500 pb-2 border-b">
                    <div>{format(date, 'EEE')}</div>
                    <div>{format(date, 'MMM d')}</div>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {slots.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-2">
                        No slots
                      </div>
                    ) : (
                      slots.map(slot => (
                        <button
                          key={slot.time.toISOString()}
                          onClick={() => slot.available && setSelectedSlot(slot.time)}
                          disabled={!slot.available}
                          className={`w-full py-1 px-1 text-xs rounded transition ${
                            selectedSlot?.getTime() === slot.time.getTime()
                              ? 'bg-emerald-600 text-white'
                              : slot.available
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {format(slot.time, 'HH:mm')}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Slot Summary */}
        {selectedSlot && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Selected Time</p>
                <p className="text-lg font-semibold text-emerald-900">
                  {format(selectedSlot, 'EEEE, MMMM d')} at {format(selectedSlot, 'h:mm a')}
                </p>
                <p className="text-sm text-emerald-700">
                  {duration} minutes - {selectedSubject?.name}
                </p>
              </div>
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={handleBookLesson}
          disabled={!selectedSlot || booking}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {booking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Booking...
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5" />
              Book Lesson
            </>
          )}
        </button>
      </div>
    </div>
  );
}
