import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Save, Check, X, Calendar, ChevronLeft, ChevronRight, Clock, Repeat, Ban } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, getDay } from 'date-fns';

interface DateAvailability {
  date: Date;
  slots: { time: string; available: boolean }[];
}

interface RecurringSchedule {
  dayOfWeek: number;
  times: string[];
}

interface BlockedDate {
  date: Date;
}

const START_HOUR = 9;
const END_HOUR = 21;
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherAvailability() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Map<string, DateAvailability>>(new Map());
  const [slotDuration, setSlotDuration] = useState<30 | 60>(30);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [recurringSchedule, setRecurringSchedule] = useState<RecurringSchedule[]>([]);
  const [selectedRecurringDays, setSelectedRecurringDays] = useState<Set<number>>(new Set());
  const [selectedRecurringTimes, setSelectedRecurringTimes] = useState<Set<string>>(new Set());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

  const monthDates = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  useEffect(() => {
    loadAvailability();
  }, []);

  function generateTimeSlots(duration: 30 | 60): string[] {
    const slots: string[] = [];
    const increment = duration === 30 ? 0.5 : 1;
    for (let hour = START_HOUR; hour < END_HOUR; hour += increment) {
      const h = Math.floor(hour);
      const m = (hour % 1) * 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    return slots;
  }

  async function loadAvailability() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacherProfile) {
        navigate('/dashboard');
        return;
      }

      setTeacherId(teacherProfile.id);

      const { data: existingAvailability } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherProfile.id);

      const availMap = new Map<string, DateAvailability>();
      const timeSlots = generateTimeSlots(slotDuration);

      monthDates.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date);

        const slots = timeSlots.map(time => {
          const existing = existingAvailability?.find(
            a => a.day_of_week === dayOfWeek && a.start_time === time
          );
          return {
            time,
            available: existing?.is_available ?? false
          };
        });

        availMap.set(dateKey, { date, slots });
      });

      setAvailability(availMap);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSlot(dateKey: string, slotIndex: number) {
    setAvailability(prev => {
      const newAvail = new Map(prev);
      const dateAvail = newAvail.get(dateKey);
      if (dateAvail) {
        const newSlots = [...dateAvail.slots];
        newSlots[slotIndex] = {
          ...newSlots[slotIndex],
          available: !newSlots[slotIndex].available
        };
        newAvail.set(dateKey, { ...dateAvail, slots: newSlots });
      }
      return newAvail;
    });
  }

  function applyRecurringSchedule() {
    setAvailability(prev => {
      const newAvail = new Map(prev);

      monthDates.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date);

        if (selectedRecurringDays.has(dayOfWeek)) {
          const dateAvail = newAvail.get(dateKey);
          if (dateAvail) {
            const newSlots = dateAvail.slots.map(slot => ({
              ...slot,
              available: selectedRecurringTimes.has(slot.time)
            }));
            newAvail.set(dateKey, { ...dateAvail, slots: newSlots });
          }
        }
      });

      return newAvail;
    });

    setShowRecurringModal(false);
    setSelectedRecurringDays(new Set());
    setSelectedRecurringTimes(new Set());
  }

  function blockDates() {
    setAvailability(prev => {
      const newAvail = new Map(prev);

      blockedDates.forEach(dateStr => {
        const dateAvail = newAvail.get(dateStr);
        if (dateAvail) {
          const newSlots = dateAvail.slots.map(slot => ({
            ...slot,
            available: false
          }));
          newAvail.set(dateStr, { ...dateAvail, slots: newSlots });
        }
      });

      return newAvail;
    });

    setShowBlockModal(false);
    setBlockedDates(new Set());
  }

  async function saveAvailability() {
    if (!teacherId) return;

    setSaving(true);
    try {
      await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', teacherId);

      const records: any[] = [];

      availability.forEach((dateAvail) => {
        const dayOfWeek = getDay(dateAvail.date);

        dateAvail.slots.forEach((slot) => {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const endHours = slotDuration === 30 ? (minutes === 30 ? hours + 1 : hours) : hours + 1;
          const endMinutes = slotDuration === 30 ? (minutes === 30 ? '00' : '30') : '00';
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes}`;

          records.push({
            teacher_id: teacherId,
            day_of_week: dayOfWeek,
            start_time: slot.time,
            end_time: endTime,
            is_available: slot.available
          });
        });
      });

      const uniqueRecords = records.reduce((acc, curr) => {
        const key = `${curr.day_of_week}-${curr.start_time}`;
        if (!acc.has(key)) {
          acc.set(key, curr);
        }
        return acc;
      }, new Map());

      const { error } = await supabase
        .from('teacher_availability')
        .insert(Array.from(uniqueRecords.values()));

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Set Your Availability</h1>
                  <p className="text-sm text-slate-400">Manage your teaching schedule</p>
                </div>
              </div>
            </div>

            <button
              onClick={saveAvailability}
              disabled={saving}
              className={`px-6 py-3 rounded-xl font-semibold transition flex items-center space-x-2 ${
                saveSuccess
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Availability'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setSlotDuration(30)}
                  className={`px-4 py-2 rounded-md transition ${
                    slotDuration === 30
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  30 min
                </button>
                <button
                  onClick={() => setSlotDuration(60)}
                  className={`px-4 py-2 rounded-md transition ${
                    slotDuration === 60
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  60 min
                </button>
              </div>

              <button
                onClick={() => setShowRecurringModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center space-x-2"
              >
                <Repeat className="w-4 h-4" />
                <span>Set Recurring</span>
              </button>

              <button
                onClick={() => setShowBlockModal(true)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center space-x-2"
              >
                <Ban className="w-4 h-4" />
                <span>Block Dates</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {monthDates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dateAvail = availability.get(dateKey);
              const timeSlots = generateTimeSlots(slotDuration);

              return (
                <div key={dateKey} className="border border-slate-200 rounded-lg p-3">
                  <div className="text-center mb-3">
                    <div className="text-xs text-slate-500 font-medium">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {format(date, 'd')}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {timeSlots.map((time, slotIndex) => {
                      const slot = dateAvail?.slots[slotIndex];
                      const isAvailable = slot?.available ?? false;

                      return (
                        <button
                          key={time}
                          onClick={() => toggleSlot(dateKey, slotIndex)}
                          className={`w-full px-2 py-1.5 rounded text-xs font-medium transition ${
                            isAvailable
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-slate-700">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-slate-200 rounded"></div>
                <span className="text-slate-700">Unavailable</span>
              </div>
            </div>

            <button
              onClick={saveAvailability}
              disabled={saving}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Availability'}</span>
            </button>
          </div>
        </div>
      </main>

      {showRecurringModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowRecurringModal(false)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Set Recurring Schedule</h3>
                <button
                  onClick={() => setShowRecurringModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Which days repeat weekly?
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const newDays = new Set(selectedRecurringDays);
                        if (newDays.has(index)) {
                          newDays.delete(index);
                        } else {
                          newDays.add(index);
                        }
                        setSelectedRecurringDays(newDays);
                      }}
                      className={`p-3 rounded-lg border-2 transition ${
                        selectedRecurringDays.has(index)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold">{day.substring(0, 3)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select times that repeat
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {generateTimeSlots(slotDuration).map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        const newTimes = new Set(selectedRecurringTimes);
                        if (newTimes.has(time)) {
                          newTimes.delete(time);
                        } else {
                          newTimes.add(time);
                        }
                        setSelectedRecurringTimes(newTimes);
                      }}
                      className={`p-2 rounded-lg border transition ${
                        selectedRecurringTimes.has(time)
                          ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowRecurringModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={applyRecurringSchedule}
                  disabled={selectedRecurringDays.size === 0 || selectedRecurringTimes.size === 0}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                >
                  Apply Recurring Schedule
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showBlockModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowBlockModal(false)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Block Specific Dates</h3>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select dates to block (holidays, vacations, etc.)
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {monthDates.map((date) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    return (
                      <button
                        key={dateKey}
                        onClick={() => {
                          const newBlocked = new Set(blockedDates);
                          if (newBlocked.has(dateKey)) {
                            newBlocked.delete(dateKey);
                          } else {
                            newBlocked.add(dateKey);
                          }
                          setBlockedDates(newBlocked);
                        }}
                        className={`p-2 rounded-lg border-2 transition ${
                          blockedDates.has(dateKey)
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{format(date, 'EEE')}</div>
                        <div className="font-bold">{format(date, 'd')}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={blockDates}
                  disabled={blockedDates.size === 0}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                >
                  Block Selected Dates
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
