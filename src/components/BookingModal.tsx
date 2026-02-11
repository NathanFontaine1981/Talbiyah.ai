import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, User, CreditCard, Gift, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
}

interface TeacherAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface OneOffAvailability {
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface Learner {
  id: string;
  name: string;
  is_free_trial_used?: boolean;
}

export default function BookingModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  subjectId,
  subjectName
}: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState<30 | 60>(30);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [isFreeSession, setIsFreeSession] = useState(false);
  const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailability[]>([]);
  const [oneOffAvailability, setOneOffAvailability] = useState<OneOffAvailability[]>([]);
  const [existingBookings, setExistingBookings] = useState<Array<{scheduled_time: string, duration_minutes: number}>>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [teacherHourlyPrice, setTeacherHourlyPrice] = useState(15);

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }), i)
  );

  // Generate 24-hour time slots
  const timeSlots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const price = duration === 30 ? teacherHourlyPrice / 2 : teacherHourlyPrice;

  useEffect(() => {
    if (isOpen) {
      fetchLearners();
      fetchTeacherAvailability();
      fetchTeacherRate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function fetchTeacherRate() {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('teacher_type, independent_rate')
      .eq('user_id', teacherId)
      .single();
    if (data?.teacher_type === 'independent' && data.independent_rate) {
      setTeacherHourlyPrice(parseFloat(data.independent_rate));
    }
  }

  useEffect(() => {
    if (selectedLearner && learners.length > 0) {
      const learner = learners.find(l => l.id === selectedLearner);
      setIsFreeSession(!learner?.is_free_trial_used);
    }
  }, [selectedLearner, learners]);

  async function fetchLearners() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's profile for default name
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('learners')
        .select('id, name')
        .eq('parent_id', user.id);

      if (error) throw error;

      let learnerData = data || [];

      // If no learners exist, create a default one
      if (learnerData.length === 0) {
        // Double-check that learner doesn't exist (in case of race condition)
        const { data: existingCheck } = await supabase
          .from('learners')
          .select('id, name')
          .eq('parent_id', user.id)
          .maybeSingle();

        if (existingCheck) {
          learnerData = [existingCheck];
        } else {
          const { data: newLearner, error: createError } = await supabase
            .from('learners')
            .insert({
              parent_id: user.id,
              name: userProfile?.full_name || 'Student',
              gamification_points: 0
            })
            .select('id, name')
            .single();

          if (createError) {
            console.error('Error creating default learner:', createError);
            // If error is due to unique constraint, try fetching again
            if (createError.message?.includes('duplicate') || createError.message?.includes('unique') || createError.message?.includes('already exists')) {
              const { data: retryLearner } = await supabase
                .from('learners')
                .select('id, name')
                .eq('parent_id', user.id)
                .maybeSingle();

              if (retryLearner) {
                learnerData = [retryLearner];
              }
            }
          } else if (newLearner) {
            learnerData = [newLearner];
          }
        }
      }

      const learnersWithTrialStatus = await Promise.all(
        learnerData.map(async (learner) => {
          const { data: trialLesson } = await supabase
            .from('lessons')
            .select('id')
            .eq('learner_id', learner.id)
            .eq('is_free_trial', true)
            .maybeSingle();

          return {
            ...learner,
            is_free_trial_used: !!trialLesson
          };
        })
      );

      setLearners(learnersWithTrialStatus);

      if (learnersWithTrialStatus.length === 1) {
        setSelectedLearner(learnersWithTrialStatus[0].id);
      }
    } catch (err) {
      console.error('Error fetching learners:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeacherAvailability() {
    try {
      // Fetch recurring availability
      const { data: recurringData, error: recurringError } = await supabase
        .from('teacher_availability')
        .select('day_of_week, start_time, end_time, is_available')
        .eq('teacher_id', teacherId)
        .eq('is_available', true);

      if (recurringError) throw recurringError;
      setTeacherAvailability(recurringData || []);

      // Fetch one-off availability for next 30 days
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);

      const { data: oneOffData, error: oneOffError } = await supabase
        .from('teacher_availability_one_off')
        .select('date, start_time, end_time, is_available')
        .eq('teacher_id', teacherId)
        .eq('is_available', true)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', futureDate.toISOString().split('T')[0]);

      if (oneOffError) throw oneOffError;
      setOneOffAvailability(oneOffData || []);

      // Fetch existing bookings for next 30 days (to prevent double booking)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('lessons')
        .select('scheduled_time, duration_minutes')
        .eq('teacher_id', teacherId)
        .gte('scheduled_time', today.toISOString())
        .lte('scheduled_time', futureDate.toISOString())
        .not('status', 'in', '(cancelled_by_teacher,cancelled_by_student)'); // Exclude cancelled lessons

      if (bookingsError) throw bookingsError;
      setExistingBookings(bookingsData || []);

      // Fetch blocked dates for next 30 days
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_dates')
        .select('blocked_date')
        .eq('teacher_id', teacherId)
        .gte('blocked_date', today.toISOString().split('T')[0])
        .lte('blocked_date', futureDate.toISOString().split('T')[0]);

      if (blockedError) throw blockedError;
      setBlockedDates((blockedData || []).map(d => d.blocked_date));
    } catch (err) {
      console.error('Error fetching teacher availability:', err);
    }
  }

  function createTimeSlot(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slot = new Date(date);
    slot.setHours(hours, minutes, 0, 0);
    return slot;
  }

  function isTimeSlotAvailable(date: Date, timeStr: string): boolean {
    const slot = createTimeSlot(date, timeStr);
    const now = new Date();

    // Must be in the future
    if (slot <= now) return false;

    // Must be at least 2 hours from now
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (slot < twoHoursFromNow) return false;

    // Check if date is blocked
    const dateKey = format(date, 'yyyy-MM-dd');
    if (blockedDates.includes(dateKey)) return false;

    // Check for conflicts with existing bookings
    const slotEnd = new Date(slot.getTime() + duration * 60 * 1000);
    const hasConflict = existingBookings.some(booking => {
      const bookingStart = new Date(booking.scheduled_time);
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60 * 1000);

      // Check if there's any overlap between the slot and the booking
      return (slot < bookingEnd && slotEnd > bookingStart);
    });

    if (hasConflict) return false;

    // Normalize time format (database returns HH:MM:SS, we have HH:MM)
    const normalizeTime = (t: string) => t.substring(0, 5);

    // Check one-off availability first (takes precedence over recurring)
    const oneOff = oneOffAvailability.find(
      (a) => a.date === dateKey && normalizeTime(a.start_time) === timeStr && a.is_available
    );

    if (oneOff) return true;

    // Fall back to recurring availability
    const dayOfWeek = date.getDay();
    const recurring = teacherAvailability.find(
      (a) => a.day_of_week === dayOfWeek && normalizeTime(a.start_time) === timeStr && a.is_available
    );

    return !!recurring;
  }

  async function handleBooking() {
    if (!selectedLearner || !selectedDate || !selectedTime) {
      setError('Please complete all booking details');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const bookingData = {
        learner_id: selectedLearner,
        parent_id: user.id,
        teacher_id: teacherId,
        subject_id: subjectId,
        scheduled_time: selectedTime.toISOString(),
        duration_minutes: duration,
        status: 'booked',
        is_free_trial: isFreeSession,
        teacher_rate_at_booking: price,
        platform_fee: 0,
        total_cost_paid: isFreeSession ? 0 : price,
        payment_id: isFreeSession ? null : `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        '100ms_room_id': `room_${Date.now()}_${Math.random().toString(36).substring(7)}`
      };

      const { error: insertError } = await supabase
        .from('lessons')
        .insert(bookingData);

      if (insertError) throw insertError;

      onClose();
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);

      toast.success('Booking confirmed! Check your dashboard for lesson details.');
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to complete booking');
    } finally {
      setProcessing(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-50/80 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 id="booking-modal-title" className="text-2xl font-bold text-gray-900">Book a Lesson</h2>
              <p className="text-gray-500 text-sm mt-1">
                {teacherName} • {subjectName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-500 hover:text-gray-900"
              aria-label="Close booking modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? 'bg-emerald-500 text-gray-900'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-20 h-1 mx-2 ${
                        step > s ? 'bg-emerald-500' : 'bg-gray-100'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select Student</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                  </div>
                ) : learners.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No student profiles found</p>
                    <p className="text-sm text-gray-500">Please complete your profile setup</p>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {learners.map((learner) => (
                        <button
                          key={learner.id}
                          onClick={() => setSelectedLearner(learner.id)}
                          className={`p-4 rounded-xl border-2 transition text-left ${
                            selectedLearner === learner.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{learner.name}</p>
                                {!learner.is_free_trial_used && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Gift className="w-3 h-3 text-emerald-600" />
                                    <span className="text-xs text-emerald-600 font-semibold">
                                      Free first lesson
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedLearner === learner.id && (
                              <CheckCircle className="w-6 h-6 text-emerald-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedLearner}
                      className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-200 disabled:text-gray-500 text-gray-900 rounded-lg font-semibold transition"
                    >
                      Continue
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select Date & Time</h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    Lesson Duration
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDuration(30)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 30
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-lg">30 Minutes</p>
                        <p className="text-emerald-600 font-semibold">£{(teacherHourlyPrice / 2).toFixed(2)}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setDuration(60)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 60
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-lg">60 Minutes</p>
                        <p className="text-emerald-600 font-semibold">£{teacherHourlyPrice.toFixed(2)}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setWeekOffset(weekOffset - 1)}
                      disabled={weekOffset === 0}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-lg text-sm transition"
                    >
                      Previous Week
                    </button>
                    <button
                      onClick={() => setWeekOffset(weekOffset + 1)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm transition"
                    >
                      Next Week
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                    {weekDates.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        className={`p-2 rounded-lg border transition text-center ${
                          selectedDate && isSameDay(selectedDate, date)
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs text-gray-500">{format(date, 'EEE')}</div>
                        <div className="text-sm font-semibold text-gray-900">{format(date, 'd')}</div>
                        <div className="text-xs text-gray-500">{format(date, 'MMM')}</div>
                      </button>
                    ))}
                  </div>

                  {selectedDate && (
                    <div className="max-h-64 overflow-y-auto">
                      <p className="text-sm font-medium text-gray-600 mb-3">Available Times</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((timeStr) => {
                          const slot = createTimeSlot(selectedDate, timeStr);
                          const available = isTimeSlotAvailable(selectedDate, timeStr);

                          return (
                            <button
                              key={timeStr}
                              onClick={() => available && setSelectedTime(slot)}
                              disabled={!available}
                              className={`p-2 rounded-lg border text-sm transition ${
                                selectedTime && selectedTime.getTime() === slot.getTime()
                                  ? 'border-emerald-500 bg-emerald-500/10 text-gray-900 font-semibold'
                                  : available
                                  ? 'border-green-600 bg-green-500/20 hover:bg-green-500/30 text-green-300 font-semibold'
                                  : 'border-gray-200 bg-white text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              {timeStr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-200 disabled:text-gray-500 text-gray-900 rounded-lg font-semibold transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Confirm & Pay</h3>

                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Teacher</span>
                      <span className="text-gray-900 font-medium">{teacherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subject</span>
                      <span className="text-gray-900 font-medium">{subjectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Student</span>
                      <span className="text-gray-900 font-medium">
                        {learners.find(l => l.id === selectedLearner)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date & Time</span>
                      <span className="text-gray-900 font-medium">
                        {selectedDate && selectedTime &&
                          format(selectedTime, 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="text-gray-900 font-medium">{duration} minutes</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between">
                      <span className="text-gray-900 font-semibold">Total</span>
                      <span className="text-emerald-600 font-bold text-lg">
                        {isFreeSession ? 'FREE' : `£${price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {isFreeSession ? (
                  <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Gift className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-emerald-600 font-semibold">Free First Lesson</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Your first 30-minute lesson is on us. No payment required!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Method</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-gray-900" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Demo Payment</p>
                          <p className="text-sm text-gray-500">Payment processing will be integrated</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 disabled:opacity-50 text-gray-900 rounded-lg font-bold transition flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>{isFreeSession ? 'Confirm Booking' : 'Confirm & Pay'}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
