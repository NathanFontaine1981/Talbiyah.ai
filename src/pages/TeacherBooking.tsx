import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, User, ShoppingCart, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  hourly_rate: number;
}

interface TimeSlot {
  time: Date;
  available: boolean;
}

interface Subject {
  id: string;
  name: string;
}

export default function TeacherBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart, removeFromCart, clearCart, cartItems, totalPrice, discount, finalPrice } = useCart();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [duration, setDuration] = useState<30 | 60>(30);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [preSelectedSubject, setPreSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    setPreSelectedSubject(subjectParam || '');
  }, [searchParams]);

  useEffect(() => {
    loadTeacher();
  }, [id]);

  // Load subjects after we have the preSelectedSubject from URL
  useEffect(() => {
    if (preSelectedSubject !== null) {
      loadSubjects();
    }
  }, [id, preSelectedSubject]);

  useEffect(() => {
    if (selectedSubject) {
      loadAvailability();
    }
  }, [selectedSubject, duration, selectedWeek]);

  async function loadTeacher() {
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          hourly_rate,
          profiles!inner(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setTeacher({
        id: data.id,
        user_id: data.user_id,
        full_name: data.profiles.full_name,
        bio: data.bio,
        hourly_rate: data.hourly_rate
      });
    } catch (error) {
      console.error('Error loading teacher:', error);
      navigate('/teachers');
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    try {
      // First try to get subjects from teacher_subjects table
      const { data: teacherSubjectsData, error: tsError } = await supabase
        .from('teacher_subjects')
        .select(`
          subject_id,
          subjects!inner(id, name)
        `)
        .eq('teacher_id', id);

      let subjectsData: Subject[] = [];

      if (!tsError && teacherSubjectsData && teacherSubjectsData.length > 0) {
        subjectsData = teacherSubjectsData.map(ts => ts.subjects);
      } else {
        // Fallback: Get subjects from teacher_availability table
        const { data: availabilityData, error: avError } = await supabase
          .from('teacher_availability')
          .select('subjects')
          .eq('teacher_id', id)
          .eq('is_available', true);

        if (avError) throw avError;

        // Extract unique subject IDs from availability records
        const subjectIds = new Set<string>();
        availabilityData?.forEach(av => {
          if (av.subjects && Array.isArray(av.subjects)) {
            av.subjects.forEach((subId: string) => subjectIds.add(subId));
          }
        });

        if (subjectIds.size > 0) {
          // Fetch subject details
          const { data: subjectDetails, error: subError } = await supabase
            .from('subjects')
            .select('id, name')
            .in('id', Array.from(subjectIds));

          if (subError) throw subError;
          subjectsData = subjectDetails || [];
        }
      }

      // Only show Quran with Understanding and Arabic Language for now
      // Exclude Quran Memorisation (coming later)
      const filteredSubjects = subjectsData.filter(subject => {
        const nameLower = subject.name.toLowerCase();
        // Allow Arabic Language
        if (nameLower.includes('arabic')) return true;
        // Allow Quran with Understanding but exclude Quran Memorisation
        if (nameLower.includes('quran') && !nameLower.includes('memori')) return true;
        return false;
      });

      setSubjects(filteredSubjects);

      // If a subject was pre-selected from URL, use that
      if (preSelectedSubject && filteredSubjects.length > 0) {
        // Check if it's a UUID (direct subject ID)
        const subjectById = filteredSubjects.find(s => s.id === preSelectedSubject);
        if (subjectById) {
          setSelectedSubject(subjectById);
          return;
        }

        // Fall back to legacy subject filter names
        const subjectMap: Record<string, string> = {
          'quran': 'Quran with Understanding',
          'arabic': 'Arabic Language'
        };

        const subjectName = subjectMap[preSelectedSubject.toLowerCase()];
        if (subjectName) {
          const subject = filteredSubjects.find(s => s.name.toLowerCase().includes(subjectName.toLowerCase()));
          if (subject) {
            setSelectedSubject(subject);
            return;
          }
        }
      }

      // Default to first subject if no pre-selection
      if (filteredSubjects.length > 0) {
        setSelectedSubject(filteredSubjects[0]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }

  async function loadAvailability() {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    // Set time increment based on session duration
    const minuteIncrement = duration; // 30 or 60 minutes

    // Fetch the teacher's recurring availability
    const { data: recurringAvailability, error: recurringError } = await supabase
      .from('teacher_availability')
      .select('day_of_week, start_time, end_time, is_available')
      .eq('teacher_id', id)
      .eq('is_available', true);

    if (recurringError) {
      console.error('Error fetching recurring availability:', recurringError);
    }

    // Fetch one-off availability for the selected week
    const { data: oneOffAvailability, error: oneOffError } = await supabase
      .from('teacher_availability_one_off')
      .select('date, start_time, end_time, is_available')
      .eq('teacher_id', id)
      .eq('is_available', true)
      .gte('date', format(weekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd'));

    if (oneOffError) {
      console.error('Error fetching one-off availability:', oneOffError);
    }

    // Create a map of available time slots based on teacher's set availability
    const availableTimeSlots = new Map<string, boolean>();

    // Process recurring availability (day_of_week based)
    if (recurringAvailability) {
      for (let day = 0; day < 7; day++) {
        const currentDay = addDays(weekStart, day);
        const dayOfWeek = currentDay.getDay(); // 0 = Sunday
        const dateStr = format(currentDay, 'yyyy-MM-dd');

        // Find recurring slots for this day of week
        const daySlots = recurringAvailability.filter(slot => slot.day_of_week === dayOfWeek);

        daySlots.forEach(slot => {
          const [startHour, startMin] = slot.start_time.split(':').map(Number);
          const [endHour, endMin] = slot.end_time.split(':').map(Number);

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          // Mark all time slots within this availability window
          for (let mins = startMinutes; mins < endMinutes; mins += minuteIncrement) {
            const hour = Math.floor(mins / 60);
            const minute = mins % 60;
            const timeKey = `${dateStr}-${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            availableTimeSlots.set(timeKey, true);
          }
        });
      }
    }

    // Process one-off availability (overrides recurring for specific dates)
    if (oneOffAvailability) {
      oneOffAvailability.forEach(slot => {
        const [startHour, startMin] = slot.start_time.split(':').map(Number);
        const [endHour, endMin] = slot.end_time.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Mark all time slots within this availability window
        for (let mins = startMinutes; mins < endMinutes; mins += minuteIncrement) {
          const hour = Math.floor(mins / 60);
          const minute = mins % 60;
          const timeKey = `${slot.date}-${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          availableTimeSlots.set(timeKey, true);
        }
      });
    }

    // Fetch all existing bookings for this teacher in the selected week
    const { data: existingLessons, error } = await supabase
      .from('lessons')
      .select('scheduled_time, duration_minutes, status')
      .eq('teacher_id', id)
      .gte('scheduled_time', weekStart.toISOString())
      .lte('scheduled_time', weekEnd.toISOString())
      .not('status', 'in', '(cancelled_by_teacher,cancelled_by_student)'); // Exclude cancelled lessons

    if (error) {
      console.error('Error fetching existing lessons:', error);
    }

    // Create a set of booked time slots for quick lookup
    const bookedSlots = new Set<string>();
    if (existingLessons) {
      existingLessons.forEach(lesson => {
        const lessonStart = new Date(lesson.scheduled_time);
        const lessonEnd = new Date(lessonStart.getTime() + lesson.duration_minutes * 60 * 1000);

        // Mark all time slots that overlap with this lesson as booked
        let currentSlot = new Date(lessonStart);
        while (currentSlot < lessonEnd) {
          bookedSlots.add(currentSlot.toISOString());
          currentSlot = new Date(currentSlot.getTime() + minuteIncrement * 60 * 1000);
        }
      });
    }

    const slots: TimeSlot[] = [];

    for (let day = 0; day < 7; day++) {
      const currentDay = addDays(weekStart, day);
      const dateStr = format(currentDay, 'yyyy-MM-dd');

      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += minuteIncrement) {
          const slotTime = setMinutes(setHours(currentDay, hour), minute);
          const timeKey = `${dateStr}-${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Only show slots that the teacher has marked as available
          if (!availableTimeSlots.has(timeKey)) continue;

          if (slotTime > new Date()) {
            // Check if this slot conflicts with any existing booking
            const slotEnd = new Date(slotTime.getTime() + duration * 60 * 1000);
            let hasConflict = false;

            // Check if this slot or any time within it is already booked
            let checkTime = new Date(slotTime);
            while (checkTime < slotEnd && !hasConflict) {
              if (bookedSlots.has(checkTime.toISOString())) {
                hasConflict = true;
              }
              checkTime = new Date(checkTime.getTime() + minuteIncrement * 60 * 1000);
            }

            slots.push({
              time: slotTime,
              available: !hasConflict // Available if no conflict with existing bookings
            });
          }
        }
      }
    }

    setTimeSlots(slots);
  }

  async function handleSelectTimeSlot(slot: TimeSlot) {
    if (!slot.available || !teacher || !selectedSubject) return;

    // Check if this slot is already in the cart
    const existingCartItem = cartItems.find(item =>
      new Date(item.scheduled_time).getTime() === slot.time.getTime()
    );

    setAddingToCart(true);
    try {
      if (existingCartItem) {
        // Remove from cart if already added
        await removeFromCart(existingCartItem.id);
      } else {
        // Add to cart if not already there
        const price = duration === 30 ? 7.50 : 15.00;

        await addToCart({
          teacher_id: teacher.id,
          teacher_name: teacher.full_name,
          subject_id: selectedSubject.id,
          subject_name: selectedSubject.name,
          scheduled_time: slot.time.toISOString(),
          duration_minutes: duration,
          price
        });
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  }

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/teachers')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Teachers</span>
            </button>

            <h1 className="text-xl font-bold text-gray-900">Book with {teacher.full_name}</h1>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <span className="text-emerald-400 font-semibold text-sm">Step 3 of 3: Book Your Session</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Booking Controls (50% width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Teacher Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{teacher.full_name}</h2>
                  <p className="text-gray-600 mb-4">{teacher.bio || 'Experienced teacher'}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-emerald-400 font-semibold">£7.50 / 30 min</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-emerald-400 font-semibold">£15.00 / 60 min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Display (if pre-selected from Step 1) */}
            {preSelectedSubject && preSelectedSubject !== '' && selectedSubject && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Subject (Selected in Step 1)</h3>
                    <p className="text-xl font-bold text-emerald-400">{selectedSubject.name}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Subject & Duration Selection */}
            <div className={`grid grid-cols-1 ${(!preSelectedSubject || preSelectedSubject === '') && subjects.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
              {(!preSelectedSubject || preSelectedSubject === '') && subjects.length > 1 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject</h3>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject)}
                        className={`w-full p-3 rounded-lg text-left transition ${
                          selectedSubject?.id === subject.id
                            ? 'bg-emerald-500 text-gray-900'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {subject.name}
                      </button>
                    ))}
                    {/* Coming Soon option */}
                    <button
                      disabled
                      className="w-full p-3 rounded-lg text-left bg-gray-50 text-gray-400 cursor-not-allowed border border-dashed border-gray-300"
                    >
                      Islamic Studies <span className="text-xs ml-1 opacity-75">(Coming Soon)</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Duration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDuration(30)}
                    className={`p-4 rounded-lg transition ${
                      duration === 30
                        ? 'bg-emerald-500 text-gray-900'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">30</div>
                      <div className="text-sm">minutes</div>
                      <div className="text-xs mt-2 opacity-75">£7.50</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setDuration(60)}
                    className={`p-4 rounded-lg transition ${
                      duration === 60
                        ? 'bg-emerald-500 text-gray-900'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">60</div>
                      <div className="text-sm">minutes</div>
                      <div className="text-xs mt-2 opacity-75">£15.00</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Select Time Slots</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition"
                  >
                    Previous Week
                  </button>
                  <button
                    onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day) => {
                  const daySlots = timeSlots.filter(slot => isSameDay(slot.time, day));

                  return (
                    <div key={day.toISOString()} className="space-y-2">
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-500">{format(day, 'EEE')}</div>
                        <div className="text-lg font-semibold text-gray-900">{format(day, 'd')}</div>
                        <div className="text-xs text-gray-500">{format(day, 'MMM')}</div>
                      </div>

                      <div className="space-y-2">
                        {daySlots.slice(0, 8).map((slot, idx) => {
                          const isInCart = cartItems.some(item =>
                            new Date(item.scheduled_time).getTime() === slot.time.getTime()
                          );

                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectTimeSlot(slot)}
                              disabled={!slot.available || addingToCart}
                              className={`w-full p-2 rounded text-xs transition ${
                                isInCart
                                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/50 font-semibold'
                                  : slot.available
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-gray-900 border border-emerald-500/30'
                                  : 'bg-gray-100 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              {format(slot.time, 'h:mm a')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Cart Display (50% width) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-24">
              <div className="flex items-center space-x-2 mb-6">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Your cart is empty</p>
                  <p className="text-gray-500 text-xs mt-1">Select time slots to add sessions</p>
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
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-400 opacity-0 group-hover:opacity-100 transition"
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
                          <span className="text-emerald-400">Discount</span>
                          <span className="text-emerald-400 font-semibold">-£{discount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-emerald-600">£{finalPrice.toFixed(2)}</span>
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
                      onClick={() => navigate('/checkout')}
                      className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-gray-900 font-semibold rounded-xl transition shadow-lg shadow-emerald-500/20"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
