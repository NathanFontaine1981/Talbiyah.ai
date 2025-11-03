import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Save, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayAvailability {
  day: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const START_HOUR = 9;
const END_HOUR = 21;

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

export default function TeacherAvailability() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

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

      const timeSlots = generateTimeSlots();
      const weekAvailability: DayAvailability[] = DAYS.map((day, index) => {
        const daySlots = timeSlots.map(time => {
          const existing = existingAvailability?.find(
            a => a.day_of_week === index && a.start_time === time
          );
          return {
            time,
            available: existing?.is_available ?? false
          };
        });

        return {
          day,
          dayOfWeek: index,
          slots: daySlots
        };
      });

      setAvailability(weekAvailability);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSlot(dayIndex: number, slotIndex: number) {
    setAvailability(prev => {
      const newAvailability = [...prev];
      newAvailability[dayIndex].slots[slotIndex].available =
        !newAvailability[dayIndex].slots[slotIndex].available;
      return newAvailability;
    });
  }

  function setDayAvailability(dayIndex: number, available: boolean) {
    setAvailability(prev => {
      const newAvailability = [...prev];
      newAvailability[dayIndex].slots = newAvailability[dayIndex].slots.map(slot => ({
        ...slot,
        available
      }));
      return newAvailability;
    });
  }

  async function saveAvailability() {
    if (!teacherId) return;

    setSaving(true);
    try {
      await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', teacherId);

      const records = availability.flatMap(day =>
        day.slots.map((slot, index) => {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const endHours = minutes === 30 ? hours + 1 : hours;
          const endMinutes = minutes === 30 ? '00' : '30';
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes}`;

          return {
            teacher_id: teacherId,
            day_of_week: day.dayOfWeek,
            start_time: slot.time,
            end_time: endTime,
            is_available: slot.available
          };
        })
      );

      const { error } = await supabase
        .from('teacher_availability')
        .insert(records);

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
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Set Your Availability</h1>
                  <p className="text-sm text-slate-400">Manage your weekly teaching schedule</p>
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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Weekly Schedule</h2>
            <p className="text-slate-600">
              Click on time slots to toggle availability. Green slots are available for booking.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 bg-slate-50 border border-slate-200 font-semibold text-slate-700 w-32">
                    Time
                  </th>
                  {availability.map((day, index) => (
                    <th key={index} className="p-4 bg-slate-50 border border-slate-200">
                      <div className="text-center">
                        <div className="font-semibold text-slate-900 mb-2">{day.day}</div>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setDayAvailability(index, true)}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition"
                            title="Set all available"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDayAvailability(index, false)}
                            className="px-2 py-1 bg-slate-400 hover:bg-slate-500 text-white text-xs rounded transition"
                            title="Set all unavailable"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generateTimeSlots().map((time, slotIndex) => (
                  <tr key={time}>
                    <td className="p-3 border border-slate-200 font-medium text-slate-700 bg-slate-50">
                      {time}
                    </td>
                    {availability.map((day, dayIndex) => (
                      <td key={dayIndex} className="p-1 border border-slate-200">
                        <button
                          onClick={() => toggleSlot(dayIndex, slotIndex)}
                          className={`w-full h-12 rounded-lg transition font-semibold text-sm ${
                            day.slots[slotIndex].available
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                          }`}
                        >
                          {day.slots[slotIndex].available ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-slate-700">Available for booking</span>
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
    </div>
  );
}
