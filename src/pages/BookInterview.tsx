import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Video,
} from 'lucide-react';

interface TokenData {
  token: string;
  candidate_id: string;
  expires_at: string;
  used: boolean;
  interview_id: string | null;
}

interface CandidateData {
  full_name: string;
  email: string;
}

interface SlotData {
  id: string;
  admin_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_booked: boolean;
}

type Step = 'loading' | 'error' | 'select-slot' | 'confirm' | 'success';

export default function BookInterview() {
  const { token: tokenParam } = useParams<{ token: string }>();

  const [step, setStep] = useState<Step>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<SlotData | null>(null);

  // Step 1: Validate token
  const validateToken = useCallback(async () => {
    if (!tokenParam) {
      setErrorMessage('No booking token provided.');
      setStep('error');
      return;
    }

    try {
      // Fetch token record
      const { data: tokenRecord, error: tokenError } = await supabase
        .from('interview_booking_tokens')
        .select('*')
        .eq('token', tokenParam)
        .single();

      if (tokenError || !tokenRecord) {
        setErrorMessage('This link has expired or has already been used.');
        setStep('error');
        return;
      }

      // Check if already used
      if (tokenRecord.used) {
        setErrorMessage('This link has expired or has already been used.');
        setStep('error');
        return;
      }

      // Check if expired
      if (new Date(tokenRecord.expires_at) <= new Date()) {
        setErrorMessage('This link has expired or has already been used.');
        setStep('error');
        return;
      }

      setTokenData(tokenRecord);

      // Fetch candidate name
      const { data: candidateRecord, error: candidateError } = await supabase
        .from('recruitment_pipeline')
        .select('full_name, email')
        .eq('id', tokenRecord.candidate_id)
        .single();

      if (candidateError || !candidateRecord) {
        setErrorMessage('Could not retrieve your information. Please contact us.');
        setStep('error');
        return;
      }

      setCandidate(candidateRecord);

      // Fetch available slots
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: availableSlots, error: slotsError } = await supabase
        .from('admin_interview_slots')
        .select('*')
        .eq('is_booked', false)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (slotsError) {
        setErrorMessage('Could not load available times. Please try again.');
        setStep('error');
        return;
      }

      setSlots(availableSlots || []);
      setStep('select-slot');
    } catch {
      setErrorMessage('Something went wrong. Please try again later.');
      setStep('error');
    }
  }, [tokenParam]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, SlotData[]>>((groups, slot) => {
    const dateKey = slot.date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(slot);
    return groups;
  }, {});

  // Format time for display (e.g. "10:00" -> "10:00 AM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !tokenParam) return;

    setIsBooking(true);

    try {
      const { data, error } = await supabase.functions.invoke('book-interview-slot', {
        body: {
          token: tokenParam,
          slot_id: selectedSlot.id,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to book interview. Please try again.');
        setIsBooking(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error || 'Failed to book interview. Please try again.');
        setIsBooking(false);
        return;
      }

      setBookedSlot(selectedSlot);
      setStep('success');
    } catch {
      toast.error('Something went wrong. Please try again.');
      setIsBooking(false);
    }
  };

  // Step indicator
  const StepIndicator = () => {
    const steps = [
      { num: 1, label: 'Choose Time' },
      { num: 2, label: 'Confirm' },
      { num: 3, label: 'Booked' },
    ];

    const currentStepNum =
      step === 'select-slot' ? 1 : step === 'confirm' ? 2 : step === 'success' ? 3 : 0;

    if (currentStepNum === 0) return null;

    return (
      <div className="flex items-center justify-center gap-3 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  currentStepNum >= s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                {currentStepNum > s.num ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  currentStepNum >= s.num
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mb-5 ${
                  currentStepNum > s.num
                    ? 'bg-emerald-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Branding header
  const BrandingHeader = () => (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
        Talbiyah.ai
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Islamic Education Platform
      </p>
    </div>
  );

  // Loading screen
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <BrandingHeader />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Validating your booking link...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <BrandingHeader />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Unable to Book
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md">
                {errorMessage}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-6">
                If you believe this is an error, please contact us at{' '}
                <a
                  href="mailto:support@talbiyah.ai"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  support@talbiyah.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === 'success' && bookedSlot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <BrandingHeader />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <StepIndicator />
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {/* Animated checkmark */}
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Interview Booked!
              </h2>

              <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                Your interview has been confirmed
              </p>

              {/* Booking details */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6 w-full max-w-sm mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {format(parseISO(bookedSlot.date), 'EEEE, d MMMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {formatTime(bookedSlot.start_time)} - {formatTime(bookedSlot.end_time)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Video call ({bookedSlot.duration_minutes} minutes)
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  You will receive a confirmation email with the video call link.
                </p>
                <p>
                  If you need to reschedule, please reply to the confirmation email.
                </p>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Powered by{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Talbiyah.ai
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Slot selection screen
  if (step === 'select-slot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <BrandingHeader />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <StepIndicator />

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Book Your Interview
              </h2>
              {candidate && (
                <p className="text-gray-600 dark:text-gray-300">
                  Welcome, <span className="font-semibold">{candidate.full_name}</span>.
                  Please select a time for your interview.
                </p>
              )}
            </div>

            {Object.keys(slotsByDate).length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
                  No available times at the moment.
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Please check back later or contact us at{' '}
                  <a
                    href="mailto:support@talbiyah.ai"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    support@talbiyah.ai
                  </a>
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-6 max-h-[28rem] overflow-y-auto pr-1">
                  {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                    <div key={date}>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(date), 'EEEE, d MMMM yyyy')}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {dateSlots.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot)}
                              className={`border rounded-lg px-4 py-3 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Clock
                                  className={`w-4 h-4 ${
                                    isSelected
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-gray-400'
                                  }`}
                                />
                                <div>
                                  <p
                                    className={`font-semibold ${
                                      isSelected
                                        ? 'text-emerald-700 dark:text-emerald-300'
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {slot.duration_minutes} minutes
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                  All times shown in GMT (London time)
                </p>

                {selectedSlot && (
                  <button
                    onClick={() => setStep('confirm')}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (step === 'confirm' && selectedSlot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <BrandingHeader />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <StepIndicator />

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Confirm Your Interview
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Please review the details below before confirming.
              </p>
            </div>

            {/* Details card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-6 mb-8 space-y-4">
              {candidate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Candidate</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {candidate.full_name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {format(parseISO(selectedSlot.date), 'EEEE, d MMMM yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time
                </span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Format
                </span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  Video Call ({selectedSlot.duration_minutes} min)
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6">
              All times shown in GMT (London time)
            </p>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('select-slot')}
                disabled={isBooking}
                className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Choose a Different Time
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should not reach here)
  return null;
}
