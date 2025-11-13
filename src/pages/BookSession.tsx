import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Check, Star, Clock, User, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';
import { X } from 'lucide-react';
import TalbiyahBot from '../components/TalbiyahBot';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  hourly_rate: number;
  rating: number;
}

interface TimeSlot {
  time: Date;
  available: boolean;
}

interface Subject {
  id: string;
  name: string;
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

  const subjectId = searchParams.get('subject');

  useEffect(() => {
    loadSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  useEffect(() => {
    if (currentStep === 2) {
      loadTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, subjectId]);

  useEffect(() => {
    if (currentStep === 3 && selectedTeacher) {
      loadAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedTeacher, duration, selectedWeek]);

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

      const formattedTeachers: Teacher[] = (data || []).map((item: any) => ({
        id: item.teacher_profiles.id,
        user_id: item.teacher_profiles.user_id,
        full_name: item.teacher_profiles.profiles.full_name || 'Unknown Teacher',
        avatar_url: item.teacher_profiles.profiles.avatar_url,
        bio: item.teacher_profiles.profiles.bio,
        hourly_rate: parseFloat(item.teacher_profiles.hourly_rate),
        rating: item.teacher_profiles.rating || 5
      }));

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
      const filteredSlots = data.slots
        .filter((slot: any) => slot.duration === duration)
        .map((slot: any) => {
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
        const price = duration === 30 ? 7.50 : 15.00;

        await addToCart({
          teacher_id: selectedTeacher.id,
          teacher_name: selectedTeacher.full_name,
          subject_id: subject.id,
          subject_name: subject.name,
          scheduled_time: slot.time.toISOString(),
          duration_minutes: duration,
          price
        });
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      alert('Failed to update cart. Please try again.');
    }
  }

  function applyPromoCode() {
    if (promoCode.toLowerCase() === 'admin' || promoCode.toLowerCase() === 'free') {
      setPromoApplied(true);
    } else {
      alert('Invalid promo code');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentStep > 2 ? setCurrentStep(2) : navigate('/subjects')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <h1 className="text-xl font-bold text-white">Book a Session</h1>

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
        {/* Subject Header */}
        {subject && (
          <div className="mb-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-slate-400 text-sm">Booking:</span>
              <span className="text-cyan-400 font-bold text-lg">{subject.name}</span>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition ${
                      step.completed
                        ? 'bg-cyan-500 text-white'
                        : currentStep === step.number
                        ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500'
                        : 'bg-slate-800 text-slate-500 border-2 border-slate-700'
                    }`}
                  >
                    {step.completed ? <Check className="w-6 h-6" /> : step.number}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-4 ${
                      step.completed ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-8 ${currentStep === 3 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>
          <div className={currentStep === 3 ? 'lg:col-span-3' : 'lg:col-span-2'}>
            {currentStep === 1 && subject && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50">
                <h2 className="text-2xl font-bold text-white mb-4">Selected Subject</h2>
                <p className="text-lg text-cyan-400">{subject.name}</p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50">
                <h2 className="text-2xl font-bold text-white mb-6">Choose Your Teacher</h2>

                {teachers.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No teachers available for this subject</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        onClick={() => handleSelectTeacher(teacher)}
                        className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition text-left group"
                      >
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                            {teacher.avatar_url ? (
                              <img
                                src={teacher.avatar_url}
                                alt={teacher.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition mb-1">
                              {teacher.full_name}
                            </h3>
                            <div className="flex items-center space-x-1 mb-2">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="text-sm text-slate-300">{teacher.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-2xl font-bold text-cyan-400">
                              £{teacher.hourly_rate.toFixed(2)}<span className="text-sm text-slate-400">/hour</span>
                            </p>
                          </div>
                        </div>

                        {teacher.bio && (
                          <p className="text-sm text-slate-400 line-clamp-2">{teacher.bio}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && selectedTeacher && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50">
                  <h2 className="text-xl font-bold text-white mb-4">Session Duration</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDuration(30)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 30
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-base font-semibold">30 Minutes</p>
                      <p className="text-xl font-bold mt-1">£7.50</p>
                      <p className="text-xs text-slate-500 mt-2">30-min slots</p>
                    </button>

                    <button
                      onClick={() => setDuration(60)}
                      className={`p-4 rounded-xl border-2 transition ${
                        duration === 60
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-base font-semibold">60 Minutes</p>
                      <p className="text-xl font-bold mt-1">£15.00</p>
                      <p className="text-xs text-slate-500 mt-2">Hourly slots</p>
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <p className="text-xs text-slate-400">
                      {duration === 30
                        ? '⏱️ Showing 30-minute intervals (9:00, 9:30, 10:00...)'
                        : '⏱️ Showing hourly intervals (9:00, 10:00, 11:00...)'}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Select Time Slots</h2>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-slate-300 font-medium text-sm">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                      </span>
                      <button
                        onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 transition"
                      >
                        <ChevronLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-slate-400 text-sm">Loading available time slots...</p>
                      </div>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400 text-sm mb-2">No available slots for this week</p>
                      <p className="text-slate-500 text-xs">Try selecting a different week or duration</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1">
                      {weekDays.map((day) => {
                        const daySlots = timeSlots.filter((slot) => isSameDay(slot.time, day)).slice(0, 10);

                        return (
                          <div key={day.toISOString()} className="text-center">
                            <p className="text-[10px] text-slate-500 font-medium mb-1">
                              {format(day, 'EEE')}
                            </p>
                            <p className="text-xs text-white font-semibold mb-2">
                              {format(day, 'd')}
                            </p>

                            <div className="space-y-1">
                              {daySlots.length === 0 ? (
                                <p className="text-[10px] text-slate-600 py-2">No slots</p>
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
                                      className={`w-full text-[10px] py-1.5 px-1 rounded transition ${
                                        isInCart
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-semibold'
                                          : slot.available
                                          ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
                                          : 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
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

          <div className={currentStep === 3 ? 'lg:col-span-2' : 'lg:col-span-1'}>
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 sticky top-24">
              <div className="flex items-center space-x-2 mb-6">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Shopping Cart</h3>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Your cart is empty</p>
                  <p className="text-slate-500 text-xs mt-1">Select time slots to add sessions</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 relative group"
                      >
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-400 opacity-0 group-hover:opacity-100 transition"
                          title="Remove from cart"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <p className="text-sm font-semibold text-white mb-1 pr-6">{item.subject_name}</p>
                        <p className="text-xs text-slate-400 mb-2">with {item.teacher_name}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-slate-400">
                            <p>{format(parseISO(item.scheduled_time), 'MMM d, yyyy')}</p>
                            <p>{format(parseISO(item.scheduled_time), 'h:mm a')} • {item.duration_minutes} min</p>
                          </div>
                          <p className="text-cyan-400 font-bold">£{item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-700 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-white font-semibold">£{totalPrice.toFixed(2)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-400">Block Booking Discount</span>
                          <span className="text-emerald-400 font-semibold">-£{discount.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-500">Every 10 sessions = 1 free 60-min session!</p>
                      </div>
                    )}

                    {promoApplied && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400">Promo Applied</span>
                        <span className="text-green-400 font-semibold">-£{totalPrice.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-cyan-400">£{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Promo Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        disabled={promoApplied}
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                      />
                      <button
                        onClick={applyPromoCode}
                        disabled={promoApplied || !promoCode}
                        className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg font-medium hover:bg-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition text-sm font-medium"
                    >
                      Clear Cart
                    </button>

                    <button
                      onClick={handleCheckout}
                      className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20"
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
      <TalbiyahBot />
    </div>
  );
}
