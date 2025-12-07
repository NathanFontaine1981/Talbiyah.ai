import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Edit, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subjects: string[];
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherAvailabilityCard() {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    try {
      setLoading(true);

      // Get current user and their teacher profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile) return;

      setTeacherId(teacherProfile.id);

      // Get recurring schedule
      const { data: recurringData } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      // Get one-off availability (for next 30 days)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);

      const { data: oneOffData } = await supabase
        .from('teacher_availability_one_off')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .eq('is_available', true)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', futureDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      // Get all subjects to map IDs to names
      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('id, name');

      // Create a map of subject ID to name
      const subjectMap = new Map(
        allSubjects?.map((s) => [s.id, s.name]) || []
      );

      // Replace subject IDs with subject names for recurring
      const recurringWithNames = recurringData?.map((slot) => ({
        ...slot,
        subjects: (slot.subjects || []).map((subjectId: string) =>
          subjectMap.get(subjectId) || subjectId
        ),
      })) || [];

      // Replace subject IDs with subject names for one-off and add day_of_week
      const oneOffWithNames = oneOffData?.map((slot) => ({
        ...slot,
        day_of_week: new Date(slot.date).getDay(),
        subjects: (slot.subjects || []).map((subjectId: string) =>
          subjectMap.get(subjectId) || subjectId
        ),
      })) || [];

      // Combine both - prefer one-off over recurring for display
      const combined = [...recurringWithNames, ...oneOffWithNames];

      setAvailability(combined);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(time: string): string {
    // Convert 24h time to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  }

  // Group consecutive slots with same subjects into time ranges
  const mergeConsecutiveSlots = (slots: AvailabilitySlot[]) => {
    if (slots.length === 0) return [];

    const merged: Array<{start: string, end: string, subjects: string[]}> = [];
    let currentGroup = {
      start: slots[0].start_time,
      end: slots[0].end_time,
      subjects: slots[0].subjects || []
    };

    for (let i = 1; i < slots.length; i++) {
      const slot = slots[i];
      const subjectsMatch = JSON.stringify(currentGroup.subjects.sort()) === JSON.stringify((slot.subjects || []).sort());

      // If subjects match and times are consecutive, extend the current group
      if (subjectsMatch && currentGroup.end === slot.start_time) {
        currentGroup.end = slot.end_time;
      } else {
        // Otherwise, save current group and start a new one
        merged.push(currentGroup);
        currentGroup = {
          start: slot.start_time,
          end: slot.end_time,
          subjects: slot.subjects || []
        };
      }
    }

    merged.push(currentGroup);
    return merged;
  };

  // Group availability by day
  const groupedByDay = availability.reduce((acc, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, AvailabilitySlot[]>);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // No availability set
  if (availability.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">My Availability</h3>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">
            You haven't set your availability yet
          </h4>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Students can't book you until you set your available times. Let them know when you're ready to teach!
          </p>
          <button
            onClick={() => navigate('/teacher/availability')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-lg flex items-center space-x-2 mx-auto"
          >
            <Calendar className="w-5 h-5" />
            <span>Set Availability Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Has availability - show schedule
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">My Availability</h3>
        </div>
        <button
          onClick={() => navigate('/teacher/availability')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
      </div>

      <div className="p-6">
        <p className="text-sm text-slate-600 mb-4 font-medium">Current Schedule:</p>

        <div className="space-y-4">
          {Object.keys(groupedByDay)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((dayNum) => {
              const daySlots = groupedByDay[parseInt(dayNum)];
              const dayName = DAYS_OF_WEEK[parseInt(dayNum)];
              const mergedSlots = mergeConsecutiveSlots(daySlots);

              return (
                <div key={dayNum} className="border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50/50 rounded-r-lg border border-emerald-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <h4 className="font-bold text-slate-900">{dayName}</h4>
                  </div>
                  {mergedSlots.map((slot, idx) => (
                    <div key={idx} className="ml-5 mb-2 last:mb-0">
                      <div className="flex items-center space-x-2 text-slate-700">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </span>
                      </div>
                      {slot.subjects && slot.subjects.length > 0 && (
                        <div className="ml-6 mt-1 flex flex-wrap gap-1">
                          {slot.subjects.map((subject, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={() => navigate('/teacher/availability')}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md flex items-center justify-center space-x-2"
          >
            <Calendar className="w-5 h-5" />
            <span>Manage Availability</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
