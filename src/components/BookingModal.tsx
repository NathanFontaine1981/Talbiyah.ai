import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, CreditCard, Gift, CheckCircle, Loader2 } from 'lucide-react';
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

interface TimeSlot {
  time: Date;
  available: boolean;
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

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }), i)
  );

  const timeSlots: string[] = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  const price = duration === 30 ? 7.50 : 15.00;

  useEffect(() => {
    if (isOpen) {
      fetchLearners();
    }
  }, [isOpen]);

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

      const { data, error } = await supabase
        .from('learners')
        .select('id, name')
        .eq('parent_id', user.id);

      if (error) throw error;

      const learnersWithTrialStatus = await Promise.all(
        (data || []).map(async (learner) => {
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

  function createTimeSlot(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slot = new Date(date);
    slot.setHours(hours, minutes, 0, 0);
    return slot;
  }

  function isTimeSlotAvailable(date: Date, timeStr: string): boolean {
    const slot = createTimeSlot(date, timeStr);
    const now = new Date();
    return slot > now;
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

      alert('Booking confirmed! Check your dashboard for lesson details.');
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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8 border border-slate-800">
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-white">Book a Lesson</h2>
              <p className="text-slate-400 text-sm mt-1">
                {teacherName} • {subjectName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center text-slate-400 hover:text-white"
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
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-20 h-1 mx-2 ${
                        step > s ? 'bg-cyan-500' : 'bg-slate-800'
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
                <h3 className="text-xl font-bold text-white mb-4">Select Student</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                  </div>
                ) : learners.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No student profiles found</p>
                    <p className="text-sm text-slate-500">Please complete your profile setup</p>
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
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white">{learner.name}</p>
                                {!learner.is_free_trial_used && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Gift className="w-3 h-3 text-cyan-400" />
                                    <span className="text-xs text-cyan-400 font-semibold">
                                      Free trial available
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedLearner === learner.id && (
                              <CheckCircle className="w-6 h-6 text-cyan-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedLearner}
                      className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition"
                    >
                      Continue
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Select Date & Time</h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Lesson Duration
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDuration(30)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 30
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-bold text-white text-lg">30 Minutes</p>
                        <p className="text-cyan-400 font-semibold">£7.50</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setDuration(60)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 60
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-bold text-white text-lg">60 Minutes</p>
                        <p className="text-cyan-400 font-semibold">£15.00</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setWeekOffset(weekOffset - 1)}
                      disabled={weekOffset === 0}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition"
                    >
                      Previous Week
                    </button>
                    <button
                      onClick={() => setWeekOffset(weekOffset + 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition"
                    >
                      Next Week
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {weekDates.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        className={`p-2 rounded-lg border transition text-center ${
                          selectedDate && isSameDay(selectedDate, date)
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs text-slate-400">{format(date, 'EEE')}</div>
                        <div className="text-sm font-semibold text-white">{format(date, 'd')}</div>
                        <div className="text-xs text-slate-500">{format(date, 'MMM')}</div>
                      </button>
                    ))}
                  </div>

                  {selectedDate && (
                    <div className="max-h-64 overflow-y-auto">
                      <p className="text-sm font-medium text-slate-300 mb-3">Available Times</p>
                      <div className="grid grid-cols-4 gap-2">
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
                                  ? 'border-cyan-500 bg-cyan-500/10 text-white'
                                  : available
                                  ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600 text-slate-300'
                                  : 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
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
                    className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Confirm & Pay</h3>

                <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
                  <h4 className="font-semibold text-white mb-4">Booking Summary</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teacher</span>
                      <span className="text-white font-medium">{teacherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subject</span>
                      <span className="text-white font-medium">{subjectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Student</span>
                      <span className="text-white font-medium">
                        {learners.find(l => l.id === selectedLearner)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date & Time</span>
                      <span className="text-white font-medium">
                        {selectedDate && selectedTime &&
                          format(selectedTime, 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="text-white font-medium">{duration} minutes</span>
                    </div>
                    <div className="pt-3 border-t border-slate-700 flex justify-between">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-cyan-400 font-bold text-lg">
                        {isFreeSession ? 'FREE' : `£${price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {isFreeSession ? (
                  <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Gift className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-cyan-400 font-semibold">Free Taster Session</p>
                        <p className="text-sm text-slate-300 mt-1">
                          This is your complimentary 30-minute taster session. No payment required!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-3">Payment Method</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Demo Payment</p>
                          <p className="text-sm text-slate-400">Payment processing will be integrated</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-lg font-bold transition flex items-center justify-center space-x-2"
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
