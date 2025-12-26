import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  Sparkles,
  Video,
  Star
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO, addMinutes, isBefore, isAfter, setHours, setMinutes } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

interface Teacher {
  id: string;
  user_id: string;
  bio: string;
  hourly_rate: number;
  gender?: string | null;
  profile: {
    full_name: string;
    avatar_url: string;
    gender?: string | null;
  };
  subjects: string[];
  rating?: number;
  total_reviews?: number;
  availabilityMatch?: number; // 0-100 percentage match with student's preferred schedule
  matchingSlots?: string[]; // List of matching time slots
}

interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function DiagnosticBooking() {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [aiAssessment, setAiAssessment] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Teacher selection
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Date/Time selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Booking
  const [booking, setBooking] = useState(false);

  // Current step
  const [step, setStep] = useState<'ai' | 'teacher' | 'schedule' | 'confirm'>('ai');

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (selectedTeacher && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedTeacher, selectedDate]);

  async function loadAssessment() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (fetchError || !data) {
        setError('Assessment not found');
        setLoading(false);
        return;
      }

      // Verify ownership
      if (data.student_id !== user.id) {
        setError('Unauthorized');
        setLoading(false);
        return;
      }

      setAssessment(data);
      setLoading(false);

      // If AI assessment exists, move to teacher selection
      if (data.ai_preliminary_assessment) {
        setAiAssessment(data.ai_preliminary_assessment);
        setStep('teacher');
        await loadTeachers(data.pre_assessment_responses?.primary_subject);
      }
      // Otherwise, stay on AI step and let user click to generate
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment');
      setLoading(false);
    }
  }

  async function generateAIAssessment() {
    setGeneratingAI(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-diagnostic-assessment', {
        body: { assessment_id: assessmentId }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setAiAssessment(data.assessment);
        setStep('teacher');
        await loadTeachers(assessment?.pre_assessment_responses?.primary_subject);
      } else {
        throw new Error(data?.error || 'Failed to generate AI assessment');
      }
    } catch (err: any) {
      const errorMsg = err?.message || err?.error || 'Unknown error';
      setError(`Failed to generate AI assessment: ${errorMsg}. Please try again.`);
    } finally {
      setGeneratingAI(false);
    }
  }

  async function loadTeachers(subjectArea?: string) {
    try {
      // Get student's preferred schedule and details from assessment
      const preferredSchedule = assessment?.pre_assessment_responses?.preferred_schedule || [];
      const studentGender = assessment?.pre_assessment_responses?.student_gender;
      const studentAge = assessment?.pre_assessment_responses?.student_age;

      // Age threshold for gender-based matching (12 years old)
      const GENDER_MATCH_AGE_THRESHOLD = 12;
      const requireGenderMatch = studentAge >= GENDER_MATCH_AGE_THRESHOLD && studentGender;

      // Get teachers who teach the relevant subject
      let query = supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          hourly_rate,
          profiles!teacher_profiles_user_id_fkey(full_name, avatar_url, gender),
          teacher_subjects(subjects(name)),
          teacher_availability(day_of_week, start_time, end_time)
        `)
        .eq('status', 'approved')
        .eq('is_accepting_bookings', true);

      const { data, error: teacherError } = await query;

      if (teacherError) throw teacherError;

      // Map preferred schedule to day/time categories
      // Format: weekday_mornings, weekday_afternoons, weekday_evenings, saturday, sunday
      const scheduleMapping: Record<string, { days: number[]; timeRange: 'morning' | 'afternoon' | 'evening' | 'all' }> = {
        'weekday_mornings': { days: [1, 2, 3, 4, 5], timeRange: 'morning' },
        'weekday_afternoons': { days: [1, 2, 3, 4, 5], timeRange: 'afternoon' },
        'weekday_evenings': { days: [1, 2, 3, 4, 5], timeRange: 'evening' },
        'saturday': { days: [6], timeRange: 'all' },
        'sunday': { days: [0], timeRange: 'all' }
      };

      const timeRanges = {
        morning: { start: 0, end: 12 },
        afternoon: { start: 12, end: 17 },
        evening: { start: 17, end: 24 },
        all: { start: 0, end: 24 }
      };

      // Filter and format teachers
      let filteredTeachers = data || [];

      // Apply gender-based filtering for students 12+ years old
      if (requireGenderMatch) {
        filteredTeachers = filteredTeachers.filter((t: any) => {
          const teacherGender = t.profiles?.gender;
          // Only show teachers whose gender matches the student's gender
          return teacherGender === studentGender;
        });
      }

      const formattedTeachers = filteredTeachers.map((t: any) => {
        const teacherAvailability = t.teacher_availability || [];
        let matchScore = 0;
        let matchingSlots: string[] = [];
        let totalPreferences = preferredSchedule.length || 1;

        // Calculate availability match
        for (const pref of preferredSchedule) {
          const mapping = scheduleMapping[pref];
          if (!mapping) continue;

          const { days, timeRange } = mapping;
          const { start: timeStart, end: timeEnd } = timeRanges[timeRange];

          // Check if teacher has availability matching this preference
          for (const avail of teacherAvailability) {
            if (days.includes(avail.day_of_week)) {
              const availStart = parseInt(avail.start_time?.split(':')[0] || '0');
              const availEnd = parseInt(avail.end_time?.split(':')[0] || '0');

              // Check if there's overlap with the preferred time range
              if (availStart < timeEnd && availEnd > timeStart) {
                matchScore++;
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][avail.day_of_week];
                const slotLabel = timeRange === 'all'
                  ? dayName
                  : `${dayName} ${timeRange}`;
                if (!matchingSlots.includes(slotLabel)) {
                  matchingSlots.push(slotLabel);
                }
                break; // Only count once per preference
              }
            }
          }
        }

        const availabilityMatch = totalPreferences > 0
          ? Math.round((matchScore / totalPreferences) * 100)
          : 0;

        return {
          id: t.id,
          user_id: t.user_id,
          bio: t.bio,
          hourly_rate: t.hourly_rate,
          gender: t.profiles?.gender || null,
          profile: {
            full_name: t.profiles?.full_name || 'Unknown',
            avatar_url: t.profiles?.avatar_url || '',
            gender: t.profiles?.gender || null
          },
          subjects: t.teacher_subjects?.map((ts: any) => ts.subjects?.name).filter(Boolean) || [],
          rating: 4.8, // TODO: Calculate from reviews
          total_reviews: 12,
          availabilityMatch,
          matchingSlots
        };
      });

      // Sort by availability match (best matches first), then by rating
      formattedTeachers.sort((a, b) => {
        // First sort by match percentage
        if (b.availabilityMatch !== a.availabilityMatch) {
          return (b.availabilityMatch || 0) - (a.availabilityMatch || 0);
        }
        // Then by rating
        return (b.rating || 0) - (a.rating || 0);
      });

      setTeachers(formattedTeachers);
    } catch {
      // Silent fail - teachers list will be empty
    }
  }

  async function loadAvailableSlots() {
    if (!selectedTeacher || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const dayOfWeek = selectedDate.getDay();
      const dateKey = format(selectedDate, 'yyyy-MM-dd');

      // Get teacher's recurring availability for this day
      const { data: recurringAvailability, error: recurringError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', selectedTeacher.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (recurringError && recurringError.code !== 'PGRST116') {
        throw recurringError;
      }

      // Get one-off availability for this specific date (takes precedence)
      const { data: oneOffAvailability, error: oneOffError } = await supabase
        .from('teacher_availability_one_off')
        .select('*')
        .eq('teacher_id', selectedTeacher.id)
        .eq('date', dateKey);

      if (oneOffError && oneOffError.code !== 'PGRST116') {
        throw oneOffError;
      }

      // Check if date is blocked
      const { data: blockedDate, error: blockedError } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('teacher_id', selectedTeacher.id)
        .eq('blocked_date', dateKey)
        .maybeSingle();

      if (blockedError && blockedError.code !== 'PGRST116') {
        throw blockedError;
      }

      // If date is blocked, no slots available
      if (blockedDate) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      // Get existing lessons for this teacher on this date
      const dateStart = new Date(selectedDate);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(23, 59, 59, 999);

      const { data: existingLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('scheduled_time, duration_minutes')
        .eq('teacher_id', selectedTeacher.id)
        .gte('scheduled_time', dateStart.toISOString())
        .lte('scheduled_time', dateEnd.toISOString())
        .not('status', 'in', '("cancelled_by_student","cancelled_by_teacher")');

      if (lessonsError) throw lessonsError;

      // Determine which availability to use: one-off takes precedence
      // Check if there's one-off availability that marks unavailable
      const oneOffUnavailable = oneOffAvailability?.some(a => !a.is_available);
      const oneOffAvailable = oneOffAvailability?.filter(a => a.is_available) || [];

      // If explicitly marked unavailable via one-off, no slots
      if (oneOffUnavailable && oneOffAvailable.length === 0) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      // Use one-off availability if exists, otherwise use recurring
      const availabilityToUse = oneOffAvailable.length > 0
        ? oneOffAvailable
        : (recurringAvailability || []);

      // Generate 20-minute slots within availability windows
      const slots: TimeSlot[] = [];
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      for (const availability of availabilityToUse) {
        const startTime = parseTimeString(availability.start_time);
        const endTime = parseTimeString(availability.end_time);

        let currentSlot = setHours(setMinutes(new Date(selectedDate), startTime.minutes), startTime.hours);
        const endSlot = setHours(setMinutes(new Date(selectedDate), endTime.minutes), endTime.hours);

        while (isBefore(addMinutes(currentSlot, 20), endSlot) || (isSameDay(currentSlot, selectedDate) && currentSlot <= endSlot)) {
          if (isBefore(addMinutes(currentSlot, 20), endSlot)) {
            const slotTime = format(currentSlot, 'HH:mm');
            const slotEnd = addMinutes(currentSlot, 20);

            // Check if slot conflicts with existing lessons
            const isBooked = existingLessons?.some(lesson => {
              const lessonStart = new Date(lesson.scheduled_time);
              const lessonEnd = addMinutes(lessonStart, lesson.duration_minutes);
              return (
                (currentSlot >= lessonStart && currentSlot < lessonEnd) ||
                (slotEnd > lessonStart && slotEnd <= lessonEnd) ||
                (currentSlot <= lessonStart && slotEnd >= lessonEnd)
              );
            });

            // Check if slot is in the past
            const isPast = isBefore(currentSlot, now);

            // Check minimum 2 hours advance booking
            const isTooSoon = isBefore(currentSlot, twoHoursFromNow);

            // Only add slot if not already in list (avoid duplicates)
            const alreadyExists = slots.some(s => s.time === slotTime);
            if (!alreadyExists) {
              slots.push({
                time: slotTime,
                available: !isBooked && !isPast && !isTooSoon
              });
            }
          }

          currentSlot = addMinutes(currentSlot, 20);
        }
      }

      // Sort slots by time
      slots.sort((a, b) => a.time.localeCompare(b.time));

      setAvailableSlots(slots);
    } catch {
      // Silent fail - slots will be empty
    } finally {
      setLoadingSlots(false);
    }
  }

  function parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  async function handleBookDiagnostic() {
    if (!selectedTeacher || !selectedDate || !selectedTime || !assessmentId) return;

    setBooking(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Create the scheduled time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Get the learner for this user (or create if needed)
      let learnerId: string;

      const { data: existingLearner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (existingLearner) {
        learnerId = existingLearner.id;
      } else {
        // Create a learner record
        const responses = assessment?.pre_assessment_responses;
        const { data: newLearner, error: learnerError } = await supabase
          .from('learners')
          .insert({
            parent_id: user.id,
            name: responses?.student_name || 'Student',
            age: responses?.student_age || null,
            gender: responses?.student_gender || null
          })
          .select('id')
          .single();

        if (learnerError) throw learnerError;
        learnerId = newLearner.id;
      }

      // For diagnostic assessments, use "Diagnostic Assessment" as the subject
      // This clearly identifies it as an assessment rather than a regular lesson
      const { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', 'Diagnostic Assessment')
        .maybeSingle();

      // Create the diagnostic lesson (FREE - no payment required)
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          learner_id: learnerId,
          teacher_id: selectedTeacher.id,
          subject_id: subject?.id || null,
          scheduled_time: scheduledTime.toISOString(),
          duration_minutes: 20,
          status: 'booked',
          lesson_type: 'diagnostic_assessment',
          is_free_trial: true,
          total_cost_paid: 0,
          teacher_rate_at_booking: 0,
          platform_fee: 0
        })
        .select('id')
        .single();

      if (lessonError) throw lessonError;

      // Book the diagnostic assessment with 100ms room creation via Edge Function
      // Refresh session to ensure we have a valid token
      let accessToken: string | undefined;

      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          accessToken = refreshData?.session?.access_token;
        }
      } catch {
        // Silent fail - will try current session
      }

      if (!accessToken) {
        const { data: currentSession } = await supabase.auth.getSession();
        accessToken = currentSession?.session?.access_token;
      }

      if (!accessToken) {
        // Force sign out and redirect to sign in
        await supabase.auth.signOut();
        navigate('/signin');
        throw new Error('Authentication session expired. Please sign in again.');
      }

      const bookingResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-diagnostic-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            assessment_id: assessmentId,
            teacher_id: selectedTeacher.id,
            scheduled_time: scheduledTime.toISOString(),
            learner_id: learnerId
          })
        }
      );

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || 'Failed to book diagnostic assessment');
      }

      const bookingResult = await bookingResponse.json();

      // Update the lesson with the room codes from the assessment
      if (bookingResult.assessment?.room_id) {
        await supabase
          .from('lessons')
          .update({
            '100ms_room_id': bookingResult.assessment.room_id,
            teacher_room_code: bookingResult.assessment.teacher_room_code,
            student_room_code: bookingResult.assessment.student_room_code
          })
          .eq('id', lesson.id);
      }

      // Update the assessment with the lesson ID
      await supabase
        .from('diagnostic_assessments')
        .update({
          lesson_id: lesson.id
        })
        .eq('id', assessmentId);

      // Update user's profile
      await supabase
        .from('profiles')
        .update({
          diagnostic_assessment_id: assessmentId
        })
        .eq('id', user.id);

      // Navigate to success page
      navigate(`/diagnostic/success/${assessmentId}`);

    } catch (err: any) {
      setError(err.message || 'Failed to book diagnostic assessment');
    } finally {
      setBooking(false);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Book Your FREE Diagnostic</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { key: 'ai', label: 'AI Analysis' },
            { key: 'teacher', label: 'Choose Teacher' },
            { key: 'schedule', label: 'Pick Time' },
            { key: 'confirm', label: 'Confirm' }
          ].map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === s.key
                    ? 'bg-emerald-500 text-white'
                    : i < ['ai', 'teacher', 'schedule', 'confirm'].indexOf(step)
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < ['ai', 'teacher', 'schedule', 'confirm'].indexOf(step) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === s.key ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {s.label}
              </span>
              {i < 3 && <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: AI Analysis */}
        {step === 'ai' && (
          <div className="max-w-2xl mx-auto">
            {/* Error display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="text-red-500 text-xs underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              {generatingAI ? (
                <>
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Analyzing Your Responses...
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Our AI is creating a preliminary assessment based on your questionnaire.
                    This helps our teachers prepare for your diagnostic session.
                  </p>
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready to Analyse
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Click below to generate your AI preliminary assessment.
                  </p>
                  <button
                    onClick={generateAIAssessment}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
                  >
                    Generate AI Assessment
                  </button>
                  {/* Skip AI option */}
                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        setStep('teacher');
                        await loadTeachers(assessment?.pre_assessment_responses?.primary_subject);
                      }}
                      className="text-gray-500 hover:text-gray-700 text-sm underline"
                    >
                      Skip and choose a teacher
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Teacher Selection */}
        {step === 'teacher' && (
          <div>
            {/* AI Assessment Summary */}
            {aiAssessment && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">AI Preliminary Assessment</h3>
                    <p className="text-gray-700 mb-3">{aiAssessment.personalized_message}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700">
                        Level: {aiAssessment.estimated_level}
                      </span>
                      <span className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700">
                        Start Phase: {aiAssessment.recommended_phase}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Teacher</h2>
            <p className="text-gray-600 mb-6">
              Teachers are sorted by availability match with your preferred schedule
            </p>

            {teachers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No teachers available at the moment. Please try again later.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher, index) => (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setStep('schedule');
                    }}
                    className={`bg-white rounded-2xl border-2 p-6 text-left transition hover:border-emerald-300 hover:shadow-md relative ${
                      selectedTeacher?.id === teacher.id ? 'border-emerald-500' : 'border-gray-200'
                    }`}
                  >
                    {/* Best Match Badge */}
                    {index === 0 && (teacher.availabilityMatch || 0) > 0 && (
                      <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Best Match
                      </div>
                    )}

                    {/* Availability Match Indicator */}
                    {(teacher.availabilityMatch || 0) > 0 && (
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (teacher.availabilityMatch || 0) >= 80
                                ? 'bg-emerald-500'
                                : (teacher.availabilityMatch || 0) >= 50
                                ? 'bg-amber-500'
                                : 'bg-gray-400'
                            }`}
                            style={{ width: `${teacher.availabilityMatch}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          (teacher.availabilityMatch || 0) >= 80
                            ? 'text-emerald-600'
                            : (teacher.availabilityMatch || 0) >= 50
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}>
                          {teacher.availabilityMatch}% match
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {teacher.profile.avatar_url ? (
                          <img
                            src={teacher.profile.avatar_url}
                            alt={teacher.profile.full_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{teacher.profile.full_name}</h3>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{teacher.rating}</span>
                          <span className="text-gray-400 text-sm">({teacher.total_reviews} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{teacher.bio}</p>

                    {/* Matching Time Slots */}
                    {teacher.matchingSlots && teacher.matchingSlots.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Available during your preferred times:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.matchingSlots.slice(0, 4).map(slot => (
                            <span
                              key={slot}
                              className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700"
                            >
                              {slot}
                            </span>
                          ))}
                          {teacher.matchingSlots.length > 4 && (
                            <span className="px-2 py-0.5 text-xs text-gray-500">
                              +{teacher.matchingSlots.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects.slice(0, 3).map(subject => (
                        <span
                          key={subject}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule Selection */}
        {step === 'schedule' && selectedTeacher && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Select Date & Time</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWeekStart(addDays(weekStart, -7))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </span>
                    <button
                      onClick={() => setWeekStart(addDays(weekStart, 7))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {weekDays.map(day => (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedTime(null);
                      }}
                      disabled={isBefore(day, new Date()) && !isSameDay(day, new Date())}
                      className={`p-3 rounded-xl text-center transition ${
                        selectedDate && isSameDay(day, selectedDate)
                          ? 'bg-emerald-500 text-white'
                          : isBefore(day, new Date()) && !isSameDay(day, new Date())
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                    >
                      <p className="text-xs font-medium">{format(day, 'EEE')}</p>
                      <p className="text-lg font-bold">{format(day, 'd')}</p>
                    </button>
                  ))}
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Available times on {format(selectedDate, 'EEEE, MMMM d')}
                    </h3>

                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No available slots on this day</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`py-3 px-2 rounded-lg text-sm font-medium transition ${
                              selectedTime === slot.time
                                ? 'bg-emerald-500 text-white'
                                : slot.available
                                ? 'bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>

                {/* Teacher */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    {selectedTeacher.profile.avatar_url ? (
                      <img
                        src={selectedTeacher.profile.avatar_url}
                        alt={selectedTeacher.profile.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedTeacher.profile.full_name}</p>
                    <p className="text-sm text-gray-500">Teacher</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Video className="w-5 h-5 text-emerald-500" />
                    <span className="text-gray-600">20-minute video session</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <span className="text-gray-600">
                      {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Select a date'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <span className="text-gray-600">
                      {selectedTime || 'Select a time'}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total Price</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-emerald-600">FREE</span>
                      <p className="text-xs text-gray-500">No payment required</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (selectedDate && selectedTime) {
                        setStep('confirm');
                      }
                    }}
                    disabled={!selectedDate || !selectedTime}
                    className={`w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition ${
                      !selectedDate || !selectedTime ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTeacher(null);
                      setStep('teacher');
                    }}
                    className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    Change Teacher
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirm' && selectedTeacher && selectedDate && selectedTime && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Booking</h2>
                <p className="text-gray-600">Review your diagnostic assessment details</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teacher</span>
                  <span className="font-semibold text-gray-900">{selectedTeacher.profile.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold text-gray-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-semibold text-gray-900">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">20 minutes</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-gray-600">Price</span>
                  <span className="font-bold text-emerald-600 text-xl">FREE</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  This is a FREE diagnostic assessment to evaluate your current level and create a personalised learning plan.
                  No payment or credits required.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('schedule')}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full transition"
                >
                  Go Back
                </button>
                <button
                  onClick={handleBookDiagnostic}
                  disabled={booking}
                  className={`flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition flex items-center justify-center gap-2 ${
                    booking ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
