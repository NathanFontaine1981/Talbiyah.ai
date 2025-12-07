import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, X, Calendar, ChevronLeft, ChevronRight, Repeat, Ban, Info, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, startOfWeek, addDays, getDay, isBefore, startOfDay } from 'date-fns';

interface DateAvailability {
  date: Date;
  slots: { time: string; available: boolean; subjects: string[] }[];
}

interface Subject {
  id: string;
  name: string;
}

const START_HOUR = 0;
const END_HOUR = 24;

export default function TeacherAvailability() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [availability, setAvailability] = useState<Map<string, DateAvailability>>(new Map());
  const [slotDuration] = useState<30 | 60>(60);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedRecurringDays, setSelectedRecurringDays] = useState<Set<number>>(new Set());
  const [selectedRecurringTimes, setSelectedRecurringTimes] = useState<Set<string>>(new Set());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedRecurringSubjects, setSelectedRecurringSubjects] = useState<Set<string>>(new Set());
  const [isAcceptingBookings, setIsAcceptingBookings] = useState(true);
  const [persistedBlockedDates, setPersistedBlockedDates] = useState<Map<string, { reason: string }>>(new Map());
  const [blockReason, setBlockReason] = useState('Holiday');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [firstSelectedSlot, setFirstSelectedSlot] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyDuration, setApplyDuration] = useState<30 | 60>(60);
  const [applySubjects, setApplySubjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<{ dateIndex: number; slotIndex: number } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Generate dates for the calendar (starting from today + offset, showing 14 days)
  const today = startOfDay(new Date());
  const startDate = addDays(today, currentWeekOffset * 7);
  const monthDates: Date[] = [];
  for (let i = 0; i < 14; i++) {
    monthDates.push(addDays(startDate, i));
  }

  useEffect(() => {
    loadAvailability();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekOffset]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle if a modal is open or if typing in an input
      if (showApplyModal || showRecurringModal || showBlockModal) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const totalSlots = generateTimeSlots().length;
      const visibleDays = monthDates.length; // Show all 14 days

      // Initialize focus if not set and arrow key is pressed
      if (!focusedSlot && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        setFocusedSlot({ dateIndex: 0, slotIndex: 0 });
        e.preventDefault();
        return;
      }

      if (!focusedSlot) return;

      const { dateIndex, slotIndex } = focusedSlot;

      switch (e.key) {
        case 'ArrowUp':
          if (slotIndex > 0) {
            setFocusedSlot({ dateIndex, slotIndex: slotIndex - 1 });
          }
          e.preventDefault();
          break;

        case 'ArrowDown':
          if (slotIndex < totalSlots - 1) {
            setFocusedSlot({ dateIndex, slotIndex: slotIndex + 1 });
          }
          e.preventDefault();
          break;

        case 'ArrowLeft':
          if (dateIndex > 0) {
            setFocusedSlot({ dateIndex: dateIndex - 1, slotIndex });
          }
          e.preventDefault();
          break;

        case 'ArrowRight':
          if (dateIndex < visibleDays - 1) {
            setFocusedSlot({ dateIndex: dateIndex + 1, slotIndex });
          }
          e.preventDefault();
          break;

        case ' ':
        case 'Enter': {
          // Toggle selection of focused slot
          const date = monthDates[dateIndex];
          const dateKey = format(date, 'yyyy-MM-dd');
          const isPast = isPastDate(date);
          const isBlocked = persistedBlockedDates.has(dateKey);

          if (!isPast && !isBlocked) {
            handleSlotClick(dateKey, slotIndex, e.shiftKey);
          }
          e.preventDefault();
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedSlot, showApplyModal, showRecurringModal, showBlockModal, monthDates, persistedBlockedDates]);

  async function loadSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }

  async function loadBlockedDates(teacherProfileId?: string) {
    try {
      const idToUse = teacherProfileId || teacherId;
      if (!idToUse) return;

      const { data, error } = await supabase
        .from('blocked_dates')
        .select('blocked_date, reason')
        .eq('teacher_id', idToUse);

      if (error) throw error;

      const blockedMap = new Map<string, { reason: string }>();
      data?.forEach(item => {
        blockedMap.set(item.blocked_date, { reason: item.reason || 'Not specified' });
      });
      setPersistedBlockedDates(blockedMap);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  }

  function generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      if (slotDuration === 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      } else {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
      }
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
        .select('id, is_accepting_bookings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacherProfile) {
        navigate('/dashboard');
        return;
      }

      setTeacherId(teacherProfile.id);
      setIsAcceptingBookings(teacherProfile.is_accepting_bookings ?? true);

      // Load blocked dates
      const { data: blockedDatesData } = await supabase
        .from('blocked_dates')
        .select('blocked_date, reason')
        .eq('teacher_id', teacherProfile.id);

      const blockedMap = new Map<string, { reason: string }>();
      blockedDatesData?.forEach(item => {
        blockedMap.set(item.blocked_date, { reason: item.reason || 'Not specified' });
      });
      setPersistedBlockedDates(blockedMap);

      // Load recurring availability
      const { data: recurringAvailability, error: recurringError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherProfile.id);

      if (recurringError) {
        console.error('Error fetching recurring availability:', recurringError);
      }

      // Load one-off availability for visible dates
      const dateKeys = monthDates.map(date => format(date, 'yyyy-MM-dd'));
      const { data: oneOffAvailability, error: oneOffError } = await supabase
        .from('teacher_availability_one_off')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .in('date', dateKeys);

      if (oneOffError) {
        console.error('Error fetching one-off availability:', oneOffError);
      }

      const availMap = new Map<string, DateAvailability>();
      const timeSlots = generateTimeSlots();

      monthDates.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date);

        const slots = timeSlots.map(time => {
          // Normalize time to HH:MM format for comparison (database returns HH:MM:SS)
          const normalizeTime = (t: string) => t.substring(0, 5);

          // Check one-off availability first (takes precedence)
          const oneOff = oneOffAvailability?.find(
            a => {
              const dateMatches = a.date === dateKey;
              const timeMatches = normalizeTime(a.start_time) === time;
              const availableMatches = a.is_available === true;
              return dateMatches && timeMatches && availableMatches;
            }
          );

          if (oneOff) {
            return {
              time,
              available: true,
              subjects: oneOff.subjects || []
            };
          }

          // Fall back to recurring availability
          const recurring = recurringAvailability?.find(
            a => a.day_of_week === dayOfWeek && normalizeTime(a.start_time) === time && a.is_available === true
          );

          return {
            time,
            available: recurring?.is_available ?? false,
            subjects: recurring?.subjects || []
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

  function isPastDate(date: Date): boolean {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  }

  function handleSlotClick(dateKey: string, slotIndex: number, isShiftKey: boolean) {
    const dateAvail = availability.get(dateKey);
    if (!dateAvail) return;

    // Check if date is in the past
    if (isPastDate(dateAvail.date)) {
      setError('Cannot set availability for past dates');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const slot = dateAvail.slots[slotIndex];
    const slotKey = `${dateKey}-${slotIndex}`;

    // If slot is already available (green), remove it immediately
    if (slot.available) {
      removeSlotAvailability(dateKey, slotIndex);
      return;
    }

    // Handle shift-click for range selection within same column
    if (isShiftKey && firstSelectedSlot) {
      const [firstDateKey, firstIndexStr] = firstSelectedSlot.split('-');
      const firstIndex = parseInt(firstIndexStr);

      // Only allow range selection within same date column
      if (firstDateKey !== dateKey) {
        setError('Hold SHIFT and click another slot in the SAME DAY to select a time range');
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Select all slots in the time range
      const newSelectedSlots = new Set(selectedSlots);
      const start = Math.min(firstIndex, slotIndex);
      const end = Math.max(firstIndex, slotIndex);
      for (let i = start; i <= end; i++) {
        newSelectedSlots.add(`${dateKey}-${i}`);
      }

      setSelectedSlots(newSelectedSlots);
      setFirstSelectedSlot(slotKey);
    } else {
      // Regular click: toggle single slot selection
      const newSelectedSlots = new Set(selectedSlots);
      if (newSelectedSlots.has(slotKey)) {
        newSelectedSlots.delete(slotKey);
        if (newSelectedSlots.size === 0) {
          setFirstSelectedSlot(null);
        }
      } else {
        newSelectedSlots.add(slotKey);
        setFirstSelectedSlot(slotKey);
      }
      setSelectedSlots(newSelectedSlots);
    }
  }

  async function removeSlotAvailability(dateKey: string, slotIndex: number) {
    if (!teacherId) return;

    // Update local state
    setAvailability(prev => {
      const newAvail = new Map(prev);
      const dateAvail = newAvail.get(dateKey);
      if (dateAvail) {
        const newSlots = [...dateAvail.slots];
        newSlots[slotIndex] = {
          ...newSlots[slotIndex],
          available: false,
          subjects: []
        };
        newAvail.set(dateKey, { ...dateAvail, slots: newSlots });
      }
      return newAvail;
    });

    // Save to database immediately
    await saveAvailability();
  }

  async function applyAvailabilityToSelectedSlots() {
    if (!teacherId) return;
    if (applySubjects.size === 0) {
      setError('Please select at least one subject');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);

    try {
      // Create a deep copy of the availability map
      const newAvail = new Map();
      availability.forEach((dateAvail, dateKey) => {
        newAvail.set(dateKey, {
          date: dateAvail.date,
          slots: dateAvail.slots.map(slot => ({
            time: slot.time,
            available: slot.available,
            subjects: [...(slot.subjects || [])]
          }))
        });
      });

      // Update the selected slots to be available
      const subjectsArray = Array.from(applySubjects);
      const selectedCount = selectedSlots.size;

      selectedSlots.forEach(slotKey => {
        // Split on the LAST hyphen only (date contains hyphens: 2025-11-13-0)
        const lastHyphenIndex = slotKey.lastIndexOf('-');
        const dateKey = slotKey.substring(0, lastHyphenIndex);
        const slotIndexStr = slotKey.substring(lastHyphenIndex + 1);
        const slotIndex = parseInt(slotIndexStr);

        const dateAvail = newAvail.get(dateKey);

        if (dateAvail && dateAvail.slots[slotIndex]) {
          dateAvail.slots[slotIndex] = {
            time: dateAvail.slots[slotIndex].time,
            available: true,
            subjects: subjectsArray
          };
        }
      });

      // Update local state first
      setAvailability(newAvail);

      // Save to database
      await saveAvailabilityWithData(newAvail);

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Show count of added slots
      setSuccessMessage(`✅ ${selectedCount} time slot${selectedCount !== 1 ? 's' : ''} added to your availability`);
      setTimeout(() => setSuccessMessage(null), 5000);

      // Clear selection and close modal
      setSelectedSlots(new Set());
      setFirstSelectedSlot(null);
      setShowApplyModal(false);
      setApplySubjects(new Set());
    } catch (error) {
      console.error('Error applying availability:', error);
      setError('Failed to save availability. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function removeAllAvailability() {
    if (!confirm('Are you sure you want to remove ALL availability slots? This cannot be undone.')) {
      return;
    }

    if (!teacherId) return;

    setSaving(true);
    try {
      // Delete all recurring availability
      const { error: recurringError } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', teacherId);

      if (recurringError) throw recurringError;

      // Delete all one-off availability
      const { error: oneOffError } = await supabase
        .from('teacher_availability_one_off')
        .delete()
        .eq('teacher_id', teacherId);

      if (oneOffError) throw oneOffError;

      // Clear local state
      setAvailability(prev => {
        const newAvail = new Map(prev);
        newAvail.forEach((dateAvail, key) => {
          const newSlots = dateAvail.slots.map(slot => ({
            ...slot,
            available: false,
            subjects: []
          }));
          newAvail.set(key, { ...dateAvail, slots: newSlots });
        });
        return newAvail;
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setSuccessMessage('✅ All availability cleared');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error clearing availability:', error);
      setError('Failed to clear availability. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function applyRecurringSchedule() {
    if (!teacherId) return;
    if (selectedRecurringDays.size === 0 || selectedRecurringTimes.size === 0 || selectedRecurringSubjects.size === 0) {
      return;
    }

    setSaving(true);

    try {
      // Delete existing recurring availability for the selected days and times
      const { error: deleteError } = await supabase
        .from('teacher_availability')
        .delete()
        .eq('teacher_id', teacherId)
        .in('day_of_week', Array.from(selectedRecurringDays))
        .in('start_time', Array.from(selectedRecurringTimes));

      if (deleteError) throw deleteError;

      // Create new recurring availability records
      const records: any[] = [];
      const subjectsArray = Array.from(selectedRecurringSubjects);

      selectedRecurringDays.forEach(dayOfWeek => {
        selectedRecurringTimes.forEach(time => {
          const [hours, minutes] = time.split(':').map(Number);

          // Calculate end time based on slot duration
          let endHours = hours;
          let endMinutes = minutes + slotDuration;

          if (endMinutes >= 60) {
            endHours++;
            endMinutes -= 60;
          }

          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

          records.push({
            teacher_id: teacherId,
            day_of_week: dayOfWeek,
            start_time: time,
            end_time: endTime,
            is_available: true,
            subjects: subjectsArray
          });
        });
      });

      const { error: insertError } = await supabase
        .from('teacher_availability')
        .insert(records);

      if (insertError) throw insertError;

      // Reload availability to show the changes
      await loadAvailability();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error applying recurring schedule:', error);
      alert('Failed to apply recurring schedule. Please try again.');
    } finally {
      setSaving(false);
    }

    setShowRecurringModal(false);
    setSelectedRecurringDays(new Set());
    setSelectedRecurringTimes(new Set());
    setSelectedRecurringSubjects(new Set());
  }

  async function blockDates() {
    if (!teacherId) return;

    try {
      // Save to database
      const datesToBlock = Array.from(blockedDates).map(dateStr => ({
        teacher_id: teacherId,
        blocked_date: dateStr,
        reason: blockReason
      }));

      const { error } = await supabase
        .from('blocked_dates')
        .insert(datesToBlock);

      if (error) throw error;

      // Update local state
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

      // Reload blocked dates
      await loadBlockedDates();

      setShowBlockModal(false);
      setBlockedDates(new Set());
      setBlockReason('Holiday');
    } catch (error) {
      console.error('Error blocking dates:', error);
      alert('Failed to block dates. Please try again.');
    }
  }

  async function unblockDate(dateStr: string) {
    if (!teacherId) return;

    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('blocked_date', dateStr);

      if (error) throw error;

      await loadBlockedDates();
    } catch (error) {
      console.error('Error unblocking date:', error);
      alert('Failed to unblock date. Please try again.');
    }
  }

  async function toggleAcceptingBookings(newValue: boolean) {
    if (!teacherId) return;

    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ is_accepting_bookings: newValue })
        .eq('id', teacherId);

      if (error) throw error;

      setIsAcceptingBookings(newValue);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  }

  async function saveAvailabilityWithData(availabilityData: Map<string, DateAvailability>) {
    if (!teacherId) return;

    setSaving(true);
    try {
      // Analyze slots to separate recurring patterns from one-off dates
      // Group by (day_of_week, time, subjects) to detect patterns
      const slotPatterns = new Map<string, { dates: string[], dayOfWeek: number, time: string, subjects: string[] }>();

      availabilityData.forEach((dateAvail, dateKey) => {
        const dayOfWeek = getDay(dateAvail.date);

        dateAvail.slots.forEach((slot) => {
          if (slot.available) {
            // Create a key based on day_of_week, time, and subjects
            // Empty subjects array is allowed
            const subjectsKey = JSON.stringify((slot.subjects || []).sort());
            const patternKey = `${dayOfWeek}-${slot.time}-${subjectsKey}`;

            if (!slotPatterns.has(patternKey)) {
              slotPatterns.set(patternKey, {
                dates: [],
                dayOfWeek,
                time: slot.time,
                subjects: slot.subjects || []
              });
            }

            slotPatterns.get(patternKey)!.dates.push(dateKey);
          }
        });
      });

      // Separate recurring (appears on multiple weeks) from one-off (single date)
      const recurringSlots: Array<{ day_of_week: number; start_time: string; end_time: string; subjects: string[] }> = [];
      const oneOffSlots: Array<{ date: string; start_time: string; end_time: string; subjects: string[] }> = [];

      slotPatterns.forEach((pattern) => {
        const [hours, minutes] = pattern.time.split(':').map(Number);
        let endHours = hours;
        let endMinutes = minutes + slotDuration;

        if (endMinutes >= 60) {
          endHours++;
          endMinutes -= 60;
        }

        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

        // If pattern appears on multiple weeks (dates with different week offsets), it's recurring
        const uniqueWeeks = new Set(pattern.dates.map(dateStr => {
          const date = new Date(dateStr);
          return format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
        }));

        if (uniqueWeeks.size > 1) {
          // Recurring pattern - appears across multiple weeks
          recurringSlots.push({
            day_of_week: pattern.dayOfWeek,
            start_time: pattern.time,
            end_time: endTime,
            subjects: pattern.subjects
          });
        } else {
          // One-off - only appears on specific date(s)
          pattern.dates.forEach(dateStr => {
            oneOffSlots.push({
              date: dateStr,
              start_time: pattern.time,
              end_time: endTime,
              subjects: pattern.subjects
            });
          });
        }
      });

      // Delete all existing one-off availability for dates in the visible range
      const visibleDateKeys = Array.from(availabilityData.keys());
      if (visibleDateKeys.length > 0) {
        await supabase
          .from('teacher_availability_one_off')
          .delete()
          .eq('teacher_id', teacherId)
          .in('date', visibleDateKeys);
      }

      // Fetch existing recurring availability
      const { data: existingRecurring } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherId);

      // Determine which recurring records to delete (no longer in the pattern)
      const recurringToDelete: { day_of_week: number; start_time: string }[] = [];
      existingRecurring?.forEach(existing => {
        const matchesNewPattern = recurringSlots.some(
          slot => slot.day_of_week === existing.day_of_week &&
                  slot.start_time === existing.start_time &&
                  JSON.stringify((slot.subjects || []).sort()) === JSON.stringify((existing.subjects || []).sort())
        );
        if (!matchesNewPattern) {
          recurringToDelete.push({
            day_of_week: existing.day_of_week,
            start_time: existing.start_time
          });
        }
      });

      // Delete recurring records that are no longer valid
      for (const record of recurringToDelete) {
        await supabase
          .from('teacher_availability')
          .delete()
          .eq('teacher_id', teacherId)
          .eq('day_of_week', record.day_of_week)
          .eq('start_time', record.start_time);
      }

      // Save recurring availability
      if (recurringSlots.length > 0) {
        const recurringRecords = recurringSlots.map(slot => ({
          ...slot,
          teacher_id: teacherId,
          is_available: true
        }));

        const { error: recurringError } = await supabase
          .from('teacher_availability')
          .upsert(recurringRecords, {
            onConflict: 'teacher_id,day_of_week,start_time'
          });

        if (recurringError) {
          throw recurringError;
        }
      }

      // Save one-off availability
      if (oneOffSlots.length > 0) {
        const oneOffRecords = oneOffSlots.map(slot => ({
          ...slot,
          teacher_id: teacherId,
          is_available: true
        }));

        const { error: oneOffError } = await supabase
          .from('teacher_availability_one_off')
          .insert(oneOffRecords);

        if (oneOffError) {
          throw oneOffError;
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Reload to show updated availability
      await loadAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function saveAvailability() {
    return saveAvailabilityWithData(availability);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Booking Availability Status</h3>
              <p className="text-sm text-slate-600">
                {isAcceptingBookings
                  ? 'Students can currently book sessions with you'
                  : 'You are not accepting new bookings. Your schedule is saved.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAcceptingBookings}
                onChange={(e) => toggleAcceptingBookings(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-3 text-sm font-medium text-slate-900">
                {isAcceptingBookings ? 'Available' : 'Unavailable'}
              </span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                disabled={currentWeekOffset === 0}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg font-semibold transition flex items-center space-x-2"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous Week</span>
              </button>
              <h3 className="text-lg font-bold text-slate-900">
                {format(startDate, 'MMM d')} - {format(addDays(startDate, 13), 'MMM d, yyyy')}
              </h3>
              <button
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition flex items-center space-x-2"
              >
                <span>Next Week</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {selectedSlots.size > 0 && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center space-x-2 shadow-lg"
              >
                <Check className="w-5 h-5" />
                <span>Apply to {selectedSlots.size} Selected</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setShowRecurringModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition flex items-center space-x-2"
            >
              <Repeat className="w-5 h-5" />
              <span>Set Recurring</span>
            </button>
            <button
              onClick={() => setShowBlockModal(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
            >
              <Ban className="w-5 h-5" />
              <span>Block Dates</span>
            </button>
            <button
              onClick={removeAllAvailability}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>Clear All</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How to set availability:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click slots to select them (blue) or use Arrow Keys to navigate</li>
                <li>Press Space/Enter to select focused slot (amber ring)</li>
                <li>Hold SHIFT and click to select a time range in the same day</li>
                <li>Click "Apply" button to set duration and subjects</li>
                <li>Click green slots to remove availability</li>
              </ul>
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start space-x-3 animate-fade-in">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start space-x-3">
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Color Legend */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500/20 rounded border border-green-300"></div>
                <span className="text-sm font-medium text-slate-700">Available for booking</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
                <span className="text-sm font-medium text-slate-700">Selected (not saved yet)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white rounded border border-slate-300"></div>
                <span className="text-sm font-medium text-slate-700">Not available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded border border-red-300"></div>
                <span className="text-sm font-medium text-slate-700">Blocked/Holiday</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-slate-100 rounded border border-slate-300"></div>
                <span className="text-sm font-medium text-slate-700">Past date</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(monthDates.length, 7)}, minmax(120px, 1fr))` }}>
              {monthDates.slice(0, 7).map((date, dateIndex) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const dateAvail = availability.get(dateKey);
                const isPast = isPastDate(date);
                const isBlocked = persistedBlockedDates.has(dateKey);

                return (
                  <div key={dateKey} className="flex flex-col">
                    {/* Date Header */}
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-t-xl p-3 text-center">
                      <div className="text-xs font-semibold text-white/90">
                        {format(date, 'EEE')}
                      </div>
                      <div className="text-lg font-bold text-white">
                        {format(date, 'MMM d')}
                      </div>
                      {isBlocked && (
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-xs text-red-200 mt-1">Blocked</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Unblock ${format(date, 'MMM d, yyyy')}?`)) {
                                unblockDate(dateKey);
                              }
                            }}
                            className="text-xs text-red-200 hover:text-white mt-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Time Slots */}
                    <div className="border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
                      {dateAvail?.slots.map((slot, slotIndex) => {
                        const slotKey = `${dateKey}-${slotIndex}`;
                        const isSelected = selectedSlots.has(slotKey);
                        const isFocused = focusedSlot?.dateIndex === dateIndex && focusedSlot?.slotIndex === slotIndex;

                        return (
                          <button
                            key={slotIndex}
                            onClick={(e) => {
                              if (isPast || isBlocked) return;
                              setFocusedSlot({ dateIndex, slotIndex });
                              handleSlotClick(dateKey, slotIndex, e.shiftKey);
                            }}
                            disabled={isPast || isBlocked}
                            className={`w-full px-3 py-2 text-sm font-medium transition border-b border-slate-100 last:border-b-0 relative ${
                              isPast
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isBlocked
                                ? 'bg-red-100 text-red-400 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : slot.available
                                ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-300'
                                : 'bg-white text-slate-700 hover:bg-slate-50'
                            } ${isFocused && !isPast && !isBlocked ? 'ring-2 ring-inset ring-amber-400 ring-offset-0' : ''}`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Second Week */}
            {monthDates.length > 7 && (
              <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: `repeat(${Math.min(monthDates.length - 7, 7)}, minmax(120px, 1fr))` }}>
                {monthDates.slice(7, 14).map((date, idx) => {
                  const dateIndex = idx + 7; // Offset for second week
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const dateAvail = availability.get(dateKey);
                  const isPast = isPastDate(date);
                  const isBlocked = persistedBlockedDates.has(dateKey);

                  return (
                    <div key={dateKey} className="flex flex-col">
                      {/* Date Header */}
                      <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-t-xl p-3 text-center">
                        <div className="text-xs font-semibold text-white/90">
                          {format(date, 'EEE')}
                        </div>
                        <div className="text-lg font-bold text-white">
                          {format(date, 'MMM d')}
                        </div>
                        {isBlocked && (
                          <div className="flex items-center justify-center gap-1">
                            <div className="text-xs text-red-200 mt-1">Blocked</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Unblock ${format(date, 'MMM d, yyyy')}?`)) {
                                  unblockDate(dateKey);
                                }
                              }}
                              className="text-xs text-red-200 hover:text-white mt-1"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Time Slots */}
                      <div className="border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
                        {dateAvail?.slots.map((slot, slotIndex) => {
                          const slotKey = `${dateKey}-${slotIndex}`;
                          const isSelected = selectedSlots.has(slotKey);
                          const isFocused = focusedSlot?.dateIndex === dateIndex && focusedSlot?.slotIndex === slotIndex;

                          return (
                            <button
                              key={slotIndex}
                              onClick={(e) => {
                                if (isPast || isBlocked) return;
                                setFocusedSlot({ dateIndex, slotIndex });
                                handleSlotClick(dateKey, slotIndex, e.shiftKey);
                              }}
                              disabled={isPast || isBlocked}
                              className={`w-full px-3 py-2 text-sm font-medium transition border-b border-slate-100 last:border-b-0 relative ${
                                isPast
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : isBlocked
                                  ? 'bg-red-100 text-red-400 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                                  : slot.available
                                  ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-300'
                                  : 'bg-white text-slate-700 hover:bg-slate-50'
                              } ${isFocused && !isPast && !isBlocked ? 'ring-2 ring-inset ring-amber-400 ring-offset-0' : ''}`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Apply Availability Modal */}
        {showApplyModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowApplyModal(false)}
            ></div>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Configure Availability</h3>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Apply to {selectedSlots.size} selected slot{selectedSlots.size !== 1 ? 's' : ''}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duration
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applyDuration"
                      value="30"
                      checked={applyDuration === 30}
                      onChange={() => setApplyDuration(30)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">30 minutes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applyDuration"
                      value="60"
                      checked={applyDuration === 60}
                      onChange={() => setApplyDuration(60)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">60 minutes</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subjects
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subjects.map((subject) => (
                    <label
                      key={subject.id}
                      className="flex items-center space-x-3 p-3 border-2 border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={applySubjects.has(subject.id)}
                        onChange={(e) => {
                          const newSubjects = new Set(applySubjects);
                          if (e.target.checked) {
                            newSubjects.add(subject.id);
                          } else {
                            newSubjects.delete(subject.id);
                          }
                          setApplySubjects(newSubjects);
                        }}
                        className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={applyAvailabilityToSelectedSlots}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </>
        )}

        {selectedSlots.size > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6 mt-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Selected Specific Times ({selectedSlots.size})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(selectedSlots).sort().map((slotKey) => {
                const [dateStr, slotIndexStr] = slotKey.split('-');
                const slotIndex = parseInt(slotIndexStr);
                const dateAvail = availability.get(dateStr);
                if (!dateAvail) return null;
                const slot = dateAvail.slots[slotIndex];
                const date = new Date(dateStr + 'T00:00:00');
                return (
                  <div
                    key={slotKey}
                    className="flex items-center justify-between p-4 border-2 border-blue-200 bg-blue-50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {format(date, 'MMM dd')} - {slot.time}
                      </div>
                      <div className="text-sm text-blue-600">
                        {applyDuration}min, {applySubjects.size} subject(s)
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newSlots = new Set(selectedSlots);
                        newSlots.delete(slotKey);
                        setSelectedSlots(newSlots);
                      }}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(selectedRecurringDays.size > 0 && selectedRecurringTimes.size > 0) && (
          <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6 mt-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Recurring Availability
            </h3>
            <div className="space-y-3">
              <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                <div className="font-semibold text-slate-900 mb-2">Days:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedRecurringDays).sort().map(day => (
                    <span key={day} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                <div className="font-semibold text-slate-900 mb-2">Times:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedRecurringTimes).sort().map(time => (
                    <span key={time} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                <div className="font-semibold text-slate-900 mb-2">Subjects: {selectedRecurringSubjects.size}</div>
              </div>
            </div>
          </div>
        )}

        {persistedBlockedDates.size > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6 mt-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Blocked Dates ({persistedBlockedDates.size})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(persistedBlockedDates.entries())
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([dateStr, info]) => {
                  const date = new Date(dateStr + 'T00:00:00');
                  return (
                    <div
                      key={dateStr}
                      className="flex items-center justify-between p-4 border-2 border-red-200 bg-red-50 rounded-lg"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {format(date, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-red-600">{info.reason}</div>
                      </div>
                      <button
                        onClick={() => unblockDate(dateStr)}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
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
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
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
                  {generateTimeSlots().map((time) => (
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

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select subjects you'll teach during these times
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        const newSubjects = new Set(selectedRecurringSubjects);
                        if (newSubjects.has(subject.id)) {
                          newSubjects.delete(subject.id);
                        } else {
                          newSubjects.add(subject.id);
                        }
                        setSelectedRecurringSubjects(newSubjects);
                      }}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        selectedRecurringSubjects.has(subject.id)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {subject.name}
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
                  disabled={selectedRecurringDays.size === 0 || selectedRecurringTimes.size === 0 || selectedRecurringSubjects.size === 0}
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
                  Reason for blocking
                </label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Holiday">Holiday</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Sick">Sick</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Select dates to block
                </label>
                <div className="grid grid-cols-7 gap-2 max-h-96 overflow-y-auto">
                  {monthDates.map((date) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const alreadyBlocked = persistedBlockedDates.has(dateKey);
                    return (
                      <button
                        key={dateKey}
                        onClick={() => {
                          if (alreadyBlocked) return;
                          const newBlocked = new Set(blockedDates);
                          if (newBlocked.has(dateKey)) {
                            newBlocked.delete(dateKey);
                          } else {
                            newBlocked.add(dateKey);
                          }
                          setBlockedDates(newBlocked);
                        }}
                        disabled={alreadyBlocked}
                        className={`p-2 rounded-lg border-2 transition ${
                          alreadyBlocked
                            ? 'border-red-300 bg-red-100 text-red-400 cursor-not-allowed opacity-50'
                            : blockedDates.has(dateKey)
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
