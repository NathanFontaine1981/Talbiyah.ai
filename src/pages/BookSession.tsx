import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Check, Star, Clock, User, ShoppingCart, Sparkles, FileText, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  hourly_rate: number;
  rating: number;
  is_legacy_assigned?: boolean;
}

interface TimeSlot {
  time: Date;
  available: boolean;
}

interface Subject {
  id: string;
  name: string;
}

// Raw data from Supabase teacher query
interface RawTeacherData {
  teacher_profiles: {
    id: string;
    user_id: string;
    hourly_rate: string | number;
    rating: number | null;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
      bio: string | null;
    };
  };
}

// Slot data from API response
interface SlotData {
  date: string;
  time: string;
  duration: number;
}

export default function BookSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart, removeFromCart, clearCart, cartItems, totalPrice, discount, finalPrice } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [duration, setDuration] = useState<30 | 60>(30);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isLegacyStudent, setIsLegacyStudent] = useState(false);
  const [isFirstLegacyLesson, setIsFirstLegacyLesson] = useState(false);
  const [assignedTeacherIds, setAssignedTeacherIds] = useState<string[]>([]);

  const subjectId = searchParams.get('subject');

  useEffect(() => {
    checkLegacyStatus();
    loadSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  useEffect(() => {
    if (currentStep === 2) {
      loadTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, subjectId, assignedTeacherIds]);

  useEffect(() => {
    if (currentStep === 3 && selectedTeacher) {
      loadAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedTeacher, duration, selectedWeek]);

  async function checkLegacyStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a legacy student
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_legacy_student')
        .eq('id', user.id)
        .single();

      if (profile?.is_legacy_student) {
        setIsLegacyStudent(true);

        // Get assigned legacy teachers
        const { data: assignments } = await supabase
          .from('legacy_teacher_students')
          .select('teacher_id')
          .eq('student_id', user.id);

        const teacherIds = (assignments || []).map(a => a.teacher_id);
        setAssignedTeacherIds(teacherIds);

        // Check if this is their first legacy lesson (for FOMO trial)
        const { data: existingTrialLesson } = await supabase
          .from('lessons')
          .select('id')
          .eq('learner_id', user.id)
          .eq('free_insights_trial', true)
          .not('status', 'in', '("cancelled_by_teacher","cancelled_by_student")')
          .limit(1)
          .single();

        setIsFirstLegacyLesson(!existingTrialLesson);
      }
    } catch (error) {
      console.error('Error checking legacy status:', error);
    }
  }

  async function loadSubject() {
    if (!subjectId) {
      navigate('/subjects');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('id', subjectId)
        .single();

      if (error) throw error;
      setSubject(data);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error loading subject:', error);
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  }

  async function loadTeachers() {
    try {
      const { data, error } = await supabase
        .from('teacher_subjects')
        .select(`
          teacher_profiles!inner(
            id,
            user_id,
            hourly_rate,
            rating,
            profiles!inner(
              full_name,
              avatar_url,
              bio
            )
          )
        `)
        .eq('subject_id', subjectId)
        .eq('teacher_profiles.status', 'approved');

      if (error) throw error;

      let formattedTeachers: Teacher[] = ((data || []) as RawTeacherData[]).map((item) => ({
        id: item.teacher_profiles.id,
        user_id: item.teacher_profiles.user_id,
        full_name: item.teacher_profiles.profiles.full_name || 'Unknown Teacher',
        avatar_url: item.teacher_profiles.profiles.avatar_url,
        bio: item.teacher_profiles.profiles.bio,
        hourly_rate: parseFloat(String(item.teacher_profiles.hourly_rate)),
        rating: item.teacher_profiles.rating || 5,
        is_legacy_assigned: assignedTeacherIds.includes(item.teacher_profiles.id),
      }));

      // For legacy students, only show their assigned teachers
      if (isLegacyStudent && assignedTeacherIds.length > 0) {
        formattedTeachers = formattedTeachers.filter(t => assignedTeacherIds.includes(t.id));
      }

      setTeachers(formattedTeachers);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  }

  async function loadAvailability() {
    if (!selectedTeacher || !subject) return;

    setLoadingSlots(true);
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);

      // Get auth session for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        setTimeSlots([]);
        return;
      }

      // Call the edge function to get available slots
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-available-slots?` +
        `from=${format(weekStart, 'yyyy-MM-dd')}&` +
        `to=${format(weekEnd, 'yyyy-MM-dd')}&` +
        `teacher_id=${selectedTeacher.user_id}&` +
        `subject=${subject.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();

      if (!data.success || !data.slots) {
        console.error('Invalid response from availability API');
        setTimeSlots([]);
        return;
      }

      // Filter slots by selected duration and convert to TimeSlot format
      const filteredSlots = (data.slots as SlotData[])
        .filter((slot) => slot.duration === duration)
        .map((slot) => {
          const slotDate = new Date(`${slot.date}T${slot.time}`);
          return {
            time: slotDate,
            available: true
          };
        });

      setTimeSlots(filteredSlots);
    } catch (error) {
      console.error('Error loading availability:', error);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleSelectTeacher(teacher: Teacher) {
    setSelectedTeacher(teacher);
    setCurrentStep(3);
  }

  async function handleSelectTimeSlot(slot: TimeSlot) {
    if (!slot.available || !selectedTeacher || !subject) return;

    // Check if this slot is already in the cart
    const existingCartItem = cartItems.find(item =>
      new Date(item.scheduled_time).getTime() === slot.time.getTime()
    );

    try {
      if (existingCartItem) {
        // Remove from cart if already added
        await removeFromCart(existingCartItem.id);
      } else {
        // Add to cart if not already there
        // Legacy students: £6/30min, £12/60min (billed monthly)
        // Regular students: £7.50/30min, £15/60min (paid upfront)
        const price = isLegacyStudent
          ? (duration === 30 ? 6.00 : 12.00)
          : (duration === 30 ? 7.50 : 15.00);

        await addToCart({
          teacher_id: selectedTeacher.id,
          teacher_name: selectedTeacher.full_name,
          subject_id: subject.id,
          subject_name: subject.name,
          scheduled_time: slot.time.toISOString(),
          duration_minutes: duration,
          price,
          lesson_tier: isLegacyStudent ? 'standard' : 'premium',
        });
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart. Please try again.');
    }
  }

  async function applyPromoCode() {
    if (!promoCode.trim()) {
      toast.warning('Please enter a promo code');
      return;
    }

    try {
      // Validate promo code against database
      const { data: promoData, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promoData) {
        toast.error('Invalid or expired promo code');
        return;
      }

      // Check if promo code has uses remaining
      if (promoData.max_uses && promoData.current_uses >= promoData.max_uses) {
        toast.error('This promo code has reached its usage limit');
        return;
      }

      // Check expiry date
      if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
        toast.error('This promo code has expired');
        return;
      }

      setPromoApplied(true);
    } catch (err) {
      console.error('Error validating promo code:', err);
      toast.error('Failed to validate promo code. Please try again.');
    }
  }

  function handleCheckout() {
    navigate('/checkout');
  }

  const steps = [
    { number: 1, label: 'Choose Teacher', completed: currentStep > 2 },
    { number: 2, label: 'Time & Duration', completed: currentStep > 3 },
    { number: 3, label: 'Review & Payment', completed: false }
  ];

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const finalTotal = promoApplied ? 0 : finalPrice;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20"></div>
            </div>
          </div>
        </div>
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
          {/* Skeleton Subject Badge */}
          <div className="mb-6 h-14 bg-gray-100 rounded-xl animate-pulse"></div>
          {/* Skeleton Steps */}
          <div className="mb-8 flex items-center justify-center space-x-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="mt-2 h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
                {i < 3 && <div className="w-24 h-0.5 mx-4 bg-gray-200"></div>}
              </div>
            ))}
          </div>
          {/* Skeleton Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                        <div className="flex-1">
                          <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-4 w-full bg-gray-100 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
                <div className="h-32 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to booking
      </a>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentStep > 2 ? setCurrentStep(2) : navigate('/subjects')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <h1 className="text-xl font-bold text-gray-900">Book a Session</h1>

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
        {/* Legacy Student Banner */}
        {isLegacyStudent && (
          <div className="mb-6 bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-medium">Legacy Account - Pay at month end</span>
            </div>
            {isFirstLegacyLesson && (
              <div className="mt-2 flex items-center justify-center gap-2 text-emerald-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Your first lesson includes FREE AI insights!</span>
                <Sparkles className="w-4 h-4" />
              </div>
            )}
          </div>
        )}

        {/* Subject Header */}
        {subject && (
          <div className="mb-6 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-500 text-sm">Booking:</span>
              <span className="text-emerald-600 font-bold text-lg">{subject.name}</span>
            </div>
          </div>
        )}

        <nav aria-label="Booking progress" className="mb-8">
          <ol className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <li
                key={step.number}
                className="flex items-center"
                aria-current={currentStep === step.number ? 'step' : undefined}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition ${
                      step.completed
                        ? 'bg-emerald-500 text-white'
                        : currentStep === step.number
                        ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                    aria-hidden="true"
                  >
                    {step.completed ? <Check className="w-6 h-6" /> : step.number}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    <span className="sr-only">Step {step.number}: </span>
                    {step.label}
                    {step.completed && <span className="sr-only"> (completed)</span>}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-4 ${
                      step.completed ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={`grid grid-cols-1 gap-8 ${currentStep === 3 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>
          <div className={currentStep === 3 ? 'lg:col-span-3' : 'lg:col-span-2'}>
            {currentStep === 1 && subject && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Selected Subject</h2>
                <p className="text-lg text-emerald-600">{subject.name}</p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Teacher</h2>

                {teachers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No teachers available for this subject</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        onClick={() => handleSelectTeacher(teacher)}
                        className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-emerald-500 hover:shadow-md transition text-left group"
                      >
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                            {teacher.avatar_url ? (
                              <img
                                src={teacher.avatar_url}
                                alt={teacher.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-emerald-600" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition mb-1">
                              {teacher.full_name}
                            </h3>
                            <div className="flex items-center space-x-1 mb-2">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="text-sm text-gray-600">{teacher.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">
                              £{teacher.hourly_rate.toFixed(2)}<span className="text-sm text-gray-500">/hour</span>
                            </p>
                          </div>
                        </div>

                        {teacher.bio && (
                          <p className="text-sm text-gray-500 line-clamp-2">{teacher.bio}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && selectedTeacher && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Session Duration</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDuration(30)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 30
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-base font-semibold">30 Minutes</p>
                      <p className="text-xl font-bold mt-1">£{isLegacyStudent ? '6.00' : '7.50'}</p>
                      <p className="text-xs text-gray-400 mt-2">30-min slots</p>
                    </button>

                    <button
                      onClick={() => setDuration(60)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 60
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-base font-semibold">60 Minutes</p>
                      <p className="text-xl font-bold mt-1">£{isLegacyStudent ? '12.00' : '15.00'}</p>
                      <p className="text-xs text-gray-400 mt-2">Hourly slots</p>
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500">
                      {duration === 30
                        ? 'Showing 30-minute intervals (9:00, 9:30, 10:00...)'
                        : 'Showing hourly intervals (9:00, 10:00, 11:00...)'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Select Time Slots</h2>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-gray-700 font-medium text-sm">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                      </span>
                      <button
                        onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 transition"
                      >
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-500 text-sm">Loading available time slots...</p>
                      </div>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-sm mb-2">No available slots for this week</p>
                      <p className="text-gray-400 text-xs">Try selecting a different week or duration</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1">
                      {weekDays.map((day) => {
                        const daySlots = timeSlots.filter((slot) => isSameDay(slot.time, day)).slice(0, 10);

                        return (
                          <div key={day.toISOString()} className="text-center">
                            <p className="text-[10px] text-gray-400 font-medium mb-1">
                              {format(day, 'EEE')}
                            </p>
                            <p className="text-xs text-gray-900 font-semibold mb-2">
                              {format(day, 'd')}
                            </p>

                            <div className="space-y-1">
                              {daySlots.length === 0 ? (
                                <p className="text-[10px] text-gray-400 py-2">No slots</p>
                              ) : (
                                daySlots.map((slot, idx) => {
                                  const isInCart = cartItems.some(item =>
                                    new Date(item.scheduled_time).getTime() === slot.time.getTime()
                                  );

                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => handleSelectTimeSlot(slot)}
                                      disabled={!slot.available}
                                      aria-pressed={isInCart}
                                      aria-label={`${format(slot.time, 'h:mm a')}${isInCart ? ', selected and in cart' : ''}`}
                                      className={`w-full text-xs sm:text-[10px] py-2 sm:py-1.5 px-1 min-h-[36px] sm:min-h-0 rounded transition ${
                                        isInCart
                                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold'
                                          : slot.available
                                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      {format(slot.time, 'HH:mm')}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside
            className={currentStep === 3 ? 'lg:col-span-2' : 'lg:col-span-1'}
            aria-label="Shopping cart"
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-24">
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-900">Shopping Cart</h3>
              </div>

              {/* Trust Indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-6 pb-4 border-b border-gray-100">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Secure checkout powered by Stripe</span>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-gray-500 text-sm">Your cart is empty</p>
                  <p className="text-gray-400 text-xs mt-1">Select time slots to add sessions</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative group"
                      >
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-500 opacity-0 group-hover:opacity-100 transition"
                          title="Remove from cart"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-sm font-semibold text-gray-900 mb-1 pr-6">{item.subject_name}</p>
                        <p className="text-xs text-gray-500 mb-2">with {item.teacher_name}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-gray-500">
                            <p>{format(parseISO(item.scheduled_time), 'MMM d, yyyy')}</p>
                            <p>{format(parseISO(item.scheduled_time), 'h:mm a')} • {item.duration_minutes} min</p>
                          </div>
                          <p className="text-emerald-600 font-bold">£{item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900 font-semibold">£{totalPrice.toFixed(2)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-600">Block Booking Discount</span>
                          <span className="text-emerald-600 font-semibold">-£{discount.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-400">Every 10 sessions = 1 free 60-min session!</p>
                      </div>
                    )}

                    {promoApplied && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-600">Promo Applied</span>
                        <span className="text-green-600 font-semibold">-£{totalPrice.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-emerald-600">£{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        disabled={promoApplied}
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      <button
                        onClick={applyPromoCode}
                        disabled={promoApplied || !promoCode}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all items from your cart?')) {
                          clearCart();
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg transition text-sm font-medium"
                    >
                      Clear Cart
                    </button>

                    <button
                      onClick={handleCheckout}
                      className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition shadow-md"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
