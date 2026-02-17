import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Trash2,
  Link2,
  Send,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  format,
  addDays,
  startOfDay,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
type TabKey = 'slots' | 'upcoming' | 'completed';

interface InterviewSlot {
  id: string;
  admin_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_booked: boolean;
  booked_by_candidate_id: string | null;
  created_at: string;
  candidate?: { full_name: string; email: string } | null;
}

interface Interview {
  id: string;
  candidate_id: string;
  slot_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  timezone: string | null;
  hms_room_id: string | null;
  room_code_admin: string | null;
  room_code_candidate: string | null;
  status: InterviewStatus;
  recording_url: string | null;
  interview_notes: string | null;
  teaching_demo_rating: number | null;
  communication_rating: number | null;
  knowledge_rating: number | null;
  personality_rating: number | null;
  overall_rating: number | null;
  ai_summary: string | null;
  completed_at: string | null;
  created_at: string;
  candidate?: {
    id: string;
    full_name: string;
    email: string;
    subjects: string[] | null;
  } | null;
}

interface Stats {
  total: number;
  upcoming: number;
  completedThisMonth: number;
  averageRating: number | null;
}

// ─── Time slot helpers ────────────────────────────────────────────────────────

function generateTimeSlots(durationMinutes: number): string[] {
  const slots: string[] = [];
  const startHour = 9;
  const endHour = 18;
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += durationMinutes) {
      if (h + (m + durationMinutes) / 60 > endHour) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getCountdown(dateStr: string, timeStr: string): string {
  const target = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 'Now';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    return `In ${days} day${days > 1 ? 's' : ''}`;
  }
  if (diffHours > 0) return `In ${diffHours}h ${diffMinutes}m`;
  return `In ${diffMinutes}m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InterviewManagement() {
  const navigate = useNavigate();

  // Auth
  const [adminId, setAdminId] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('slots');

  // Stats
  const [stats, setStats] = useState<Stats>({
    total: 0,
    upcoming: 0,
    completedThisMonth: 0,
    averageRating: null,
  });

  // Slots tab
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(30);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [calendarStartDate, setCalendarStartDate] = useState(startOfDay(new Date()));
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Quick add
  const [quickAddDate, setQuickAddDate] = useState('');
  const [quickAddTime, setQuickAddTime] = useState('09:00');
  const [quickAddDuration, setQuickAddDuration] = useState<30 | 60>(30);

  // Upcoming tab
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  // Completed tab
  const [completedInterviews, setCompletedInterviews] = useState<Interview[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [expandedInterviewId, setExpandedInterviewId] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmDeleteSlotId, setConfirmDeleteSlotId] = useState<string | null>(null);
  const [confirmCancelInterviewId, setConfirmCancelInterviewId] = useState<string | null>(null);

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminId(user.id);
    })();
  }, []);

  useEffect(() => {
    if (adminId) {
      fetchStats();
      fetchSlots();
      fetchUpcomingInterviews();
      fetchCompletedInterviews();
    }
  }, [adminId]);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    const { data: allInterviews } = await supabase
      .from('recruitment_interviews')
      .select('id, status, overall_rating, scheduled_date, completed_at');

    if (!allInterviews) return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const upcoming = allInterviews.filter((i) => i.status === 'scheduled').length;
    const completedThisMonth = allInterviews.filter(
      (i) => i.status === 'completed' && i.completed_at && i.completed_at >= monthStart
    ).length;

    const rated = allInterviews.filter((i) => i.overall_rating !== null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, i) => sum + (i.overall_rating ?? 0), 0) / rated.length
        : null;

    setStats({
      total: allInterviews.length,
      upcoming,
      completedThisMonth,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    });
  }, []);

  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const startDate = format(calendarStartDate, 'yyyy-MM-dd');
      const endDate = format(addDays(calendarStartDate, 13), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('admin_interview_slots')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      // For booked slots, fetch candidate names
      const bookedSlots = (data || []).filter((s) => s.is_booked && s.booked_by_candidate_id);
      const candidateIds = [...new Set(bookedSlots.map((s) => s.booked_by_candidate_id))];

      let candidateMap: Record<string, { full_name: string; email: string }> = {};
      if (candidateIds.length > 0) {
        const { data: candidates } = await supabase
          .from('recruitment_pipeline')
          .select('id, full_name, email')
          .in('id', candidateIds);

        if (candidates) {
          candidateMap = Object.fromEntries(candidates.map((c) => [c.id, c]));
        }
      }

      setSlots(
        (data || []).map((s) => ({
          ...s,
          candidate: s.booked_by_candidate_id ? candidateMap[s.booked_by_candidate_id] || null : null,
        }))
      );
    } catch (err) {
      console.error('Error fetching slots:', err);
      toast.error('Failed to load interview slots');
    } finally {
      setSlotsLoading(false);
    }
  }, [calendarStartDate]);

  useEffect(() => {
    if (adminId) fetchSlots();
  }, [calendarStartDate, adminId, fetchSlots]);

  const fetchUpcomingInterviews = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const { data, error } = await supabase
        .from('recruitment_interviews')
        .select('*, candidate:recruitment_pipeline!candidate_id(id, full_name, email, subjects)')
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setUpcomingInterviews(data || []);
    } catch (err) {
      console.error('Error fetching upcoming interviews:', err);
      toast.error('Failed to load upcoming interviews');
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  const fetchCompletedInterviews = useCallback(async () => {
    setCompletedLoading(true);
    try {
      const { data, error } = await supabase
        .from('recruitment_interviews')
        .select('*, candidate:recruitment_pipeline!candidate_id(id, full_name, email, subjects)')
        .in('status', ['completed', 'no_show', 'cancelled'])
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setCompletedInterviews(data || []);
    } catch (err) {
      console.error('Error fetching completed interviews:', err);
      toast.error('Failed to load completed interviews');
    } finally {
      setCompletedLoading(false);
    }
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function createSlot(date: string, startTime: string, duration: number) {
    if (!adminId) return;
    const endTime = addMinutesToTime(startTime, duration);
    try {
      const { error } = await supabase.from('admin_interview_slots').insert({
        admin_id: adminId,
        date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        is_booked: false,
      });
      if (error) throw error;
      toast.success('Slot created');
      fetchSlots();
      fetchStats();
    } catch (err: any) {
      console.error('Error creating slot:', err);
      toast.error(err.message || 'Failed to create slot');
    }
  }

  async function deleteSlot(slotId: string) {
    try {
      const { error } = await supabase
        .from('admin_interview_slots')
        .delete()
        .eq('id', slotId)
        .eq('is_booked', false);

      if (error) throw error;
      toast.success('Slot removed');
      setConfirmDeleteSlotId(null);
      fetchSlots();
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting slot:', err);
      toast.error(err.message || 'Failed to delete slot');
    }
  }

  async function cancelInterview(interviewId: string) {
    try {
      const { error } = await supabase
        .from('recruitment_interviews')
        .update({ status: 'cancelled' })
        .eq('id', interviewId);

      if (error) throw error;
      toast.success('Interview cancelled');
      setConfirmCancelInterviewId(null);
      fetchUpcomingInterviews();
      fetchCompletedInterviews();
      fetchStats();
    } catch (err: any) {
      console.error('Error cancelling interview:', err);
      toast.error(err.message || 'Failed to cancel interview');
    }
  }

  async function generateInviteLink(candidateId: string) {
    if (!adminId) return;
    try {
      const { data, error } = await supabase
        .from('interview_booking_tokens')
        .insert({
          candidate_id: candidateId,
          created_by: adminId,
        })
        .select('token')
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/book-interview/${data.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Interview link copied to clipboard!');
    } catch (err: any) {
      console.error('Error generating invite link:', err);
      toast.error(err.message || 'Failed to generate invite link');
    }
  }

  function sendReminder() {
    toast.success('Reminder sent');
  }

  // ─── Calendar helpers ─────────────────────────────────────────────────────

  const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(calendarStartDate, i));
  const timeSlots = generateTimeSlots(durationMinutes);

  function getSlotForCell(date: Date, time: string): InterviewSlot | undefined {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.find((s) => s.date === dateStr && s.start_time.slice(0, 5) === time);
  }

  function handleSlotClick(date: Date, time: string) {
    const existing = getSlotForCell(date, time);
    const dateStr = format(date, 'yyyy-MM-dd');

    if (!existing) {
      createSlot(dateStr, time + ':00', durationMinutes);
    } else if (existing.is_booked) {
      toast.info(
        `Booked by ${existing.candidate?.full_name || 'Unknown candidate'}. Cannot delete booked slots.`
      );
    } else {
      setConfirmDeleteSlotId(existing.id);
    }
  }

  function getSlotColor(date: Date, time: string): string {
    const existing = getSlotForCell(date, time);
    if (!existing) return 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';
    if (existing.is_booked) return 'bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700';
    return 'bg-emerald-200 dark:bg-emerald-800 hover:bg-emerald-300 dark:hover:bg-emerald-700';
  }

  function getSlotTooltip(date: Date, time: string): string {
    const existing = getSlotForCell(date, time);
    if (!existing) return 'Click to create slot';
    if (existing.is_booked) return `Booked: ${existing.candidate?.full_name || 'Unknown'}`;
    return 'Available - click to remove';
  }

  // Upcoming unbooked slots list
  const upcomingSlots = slots
    .filter((s) => !s.is_booked && isAfter(parseISO(s.date), addDays(new Date(), -1)))
    .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));

  // ─── Status badge ─────────────────────────────────────────────────────────

  function statusBadge(status: InterviewStatus) {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
            <XCircle className="w-3 h-3" /> No Show
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">
            <Video className="w-3 h-3" /> In Progress
          </span>
        );
      default:
        return null;
    }
  }

  // ─── Rating display ───────────────────────────────────────────────────────

  function ratingDisplay(rating: number | null) {
    if (rating === null) return <span className="text-gray-400 dark:text-gray-500 text-sm">Not rated</span>;
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
        <Star className="w-3.5 h-3.5 fill-current" /> {rating}/5
      </span>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'slots', label: 'Manage Slots', icon: <Calendar className="w-4 h-4" /> },
    { key: 'upcoming', label: 'Upcoming Interviews', icon: <Video className="w-4 h-4" /> },
    { key: 'completed', label: 'Completed Interviews', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage availability slots, track upcoming interviews, and review completed sessions.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <Users className="w-4 h-4" /> Total Interviews
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <Calendar className="w-4 h-4" /> Upcoming
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.upcoming}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <CheckCircle className="w-4 h-4" /> Completed This Month
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completedThisMonth}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
            <Star className="w-4 h-4" /> Average Rating
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.averageRating !== null ? `${stats.averageRating}/5` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'slots' && (
        <ManageSlotsTab
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          calendarDays={calendarDays}
          calendarStartDate={calendarStartDate}
          setCalendarStartDate={setCalendarStartDate}
          timeSlots={timeSlots}
          slotsLoading={slotsLoading}
          getSlotColor={getSlotColor}
          getSlotTooltip={getSlotTooltip}
          handleSlotClick={handleSlotClick}
          upcomingSlots={upcomingSlots}
          deleteSlot={deleteSlot}
          confirmDeleteSlotId={confirmDeleteSlotId}
          setConfirmDeleteSlotId={setConfirmDeleteSlotId}
          quickAddDate={quickAddDate}
          setQuickAddDate={setQuickAddDate}
          quickAddTime={quickAddTime}
          setQuickAddTime={setQuickAddTime}
          quickAddDuration={quickAddDuration}
          setQuickAddDuration={setQuickAddDuration}
          createSlot={createSlot}
        />
      )}

      {activeTab === 'upcoming' && (
        <UpcomingTab
          interviews={upcomingInterviews}
          loading={upcomingLoading}
          navigate={navigate}
          generateInviteLink={generateInviteLink}
          sendReminder={sendReminder}
          cancelInterview={cancelInterview}
          confirmCancelInterviewId={confirmCancelInterviewId}
          setConfirmCancelInterviewId={setConfirmCancelInterviewId}
          statusBadge={statusBadge}
        />
      )}

      {activeTab === 'completed' && (
        <CompletedTab
          interviews={completedInterviews}
          loading={completedLoading}
          expandedInterviewId={expandedInterviewId}
          setExpandedInterviewId={setExpandedInterviewId}
          statusBadge={statusBadge}
          ratingDisplay={ratingDisplay}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ─── Manage Slots Tab ─────────────────────────────────────────────────────────

function ManageSlotsTab({
  durationMinutes,
  setDurationMinutes,
  calendarDays,
  calendarStartDate,
  setCalendarStartDate,
  timeSlots,
  slotsLoading,
  getSlotColor,
  getSlotTooltip,
  handleSlotClick,
  upcomingSlots,
  deleteSlot,
  confirmDeleteSlotId,
  setConfirmDeleteSlotId,
  quickAddDate,
  setQuickAddDate,
  quickAddTime,
  setQuickAddTime,
  quickAddDuration,
  setQuickAddDuration,
  createSlot,
}: {
  durationMinutes: 30 | 60;
  setDurationMinutes: (d: 30 | 60) => void;
  calendarDays: Date[];
  calendarStartDate: Date;
  setCalendarStartDate: (d: Date) => void;
  timeSlots: string[];
  slotsLoading: boolean;
  getSlotColor: (date: Date, time: string) => string;
  getSlotTooltip: (date: Date, time: string) => string;
  handleSlotClick: (date: Date, time: string) => void;
  upcomingSlots: InterviewSlot[];
  deleteSlot: (id: string) => void;
  confirmDeleteSlotId: string | null;
  setConfirmDeleteSlotId: (id: string | null) => void;
  quickAddDate: string;
  setQuickAddDate: (d: string) => void;
  quickAddTime: string;
  setQuickAddTime: (t: string) => void;
  quickAddDuration: 30 | 60;
  setQuickAddDuration: (d: 30 | 60) => void;
  createSlot: (date: string, startTime: string, duration: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Duration Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration:</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setDurationMinutes(30)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              durationMinutes === 30
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            30 min
          </button>
          <button
            onClick={() => setDurationMinutes(60)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              durationMinutes === 60
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            60 min
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCalendarStartDate(addDays(calendarStartDate, -14))}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {format(calendarDays[0], 'MMM d')} - {format(calendarDays[calendarDays.length - 1], 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => setCalendarStartDate(addDays(calendarStartDate, 14))}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {slotsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Time</div>
              {calendarDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="text-center text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-gray-500 dark:text-gray-400">{format(day, 'MMM d')}</div>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="p-2 space-y-1">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-[80px_repeat(14,1fr)] gap-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                    {formatTimeDisplay(time)}
                  </div>
                  {calendarDays.map((day) => (
                    <button
                      key={`${day.toISOString()}-${time}`}
                      onClick={() => handleSlotClick(day, time)}
                      title={getSlotTooltip(day, time)}
                      className={`h-8 w-full rounded cursor-pointer transition-colors text-[10px] truncate px-0.5 ${getSlotColor(day, time)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600" />
            Empty
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800" />
            Available
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800" />
            Booked
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Quick Add Slot
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={quickAddDate}
              onChange={(e) => setQuickAddDate(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Time</label>
            <input
              type="time"
              value={quickAddTime}
              onChange={(e) => setQuickAddTime(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</label>
            <select
              value={quickAddDuration}
              onChange={(e) => setQuickAddDuration(Number(e.target.value) as 30 | 60)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
          <button
            onClick={() => {
              if (!quickAddDate) {
                toast.error('Please select a date');
                return;
              }
              createSlot(quickAddDate, quickAddTime + ':00', quickAddDuration);
              setQuickAddDate('');
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {/* Upcoming Available Slots List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Upcoming Available Slots ({upcomingSlots.length})
          </h3>
        </div>
        {upcomingSlots.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No available slots. Create some above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcomingSlots.map((slot) => (
              <div key={slot.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {format(parseISO(slot.date), 'EEE, MMM d, yyyy')}
                  </span>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatTimeDisplay(slot.start_time.slice(0, 5))} - {formatTimeDisplay(slot.end_time.slice(0, 5))}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {slot.duration_minutes} min
                  </span>
                </div>
                <button
                  onClick={() => setConfirmDeleteSlotId(slot.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                  title="Delete slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteSlotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Remove Slot?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove this availability slot? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteSlotId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSlot(confirmDeleteSlotId)}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upcoming Interviews Tab ──────────────────────────────────────────────────

function UpcomingTab({
  interviews,
  loading,
  navigate,
  generateInviteLink,
  sendReminder,
  cancelInterview,
  confirmCancelInterviewId,
  setConfirmCancelInterviewId,
  statusBadge,
}: {
  interviews: Interview[];
  loading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  generateInviteLink: (candidateId: string) => void;
  sendReminder: () => void;
  cancelInterview: (id: string) => void;
  confirmCancelInterviewId: string | null;
  setConfirmCancelInterviewId: (id: string | null) => void;
  statusBadge: (status: InterviewStatus) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Video className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming interviews scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Candidate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Countdown</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {interviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {interview.candidate?.full_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {interview.candidate?.email || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {format(parseISO(interview.scheduled_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {formatTimeDisplay(interview.scheduled_time.slice(0, 5))}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {interview.duration_minutes} min
                  </td>
                  <td className="px-4 py-3">{statusBadge(interview.status)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {getCountdown(interview.scheduled_date, interview.scheduled_time)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/admin/interview-room/${interview.id}`)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                        title="Join Interview"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        onClick={sendReminder}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Send Reminder"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => interview.candidate_id && generateInviteLink(interview.candidate_id)}
                        className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 transition-colors"
                        title="Generate Invite Link"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmCancelInterviewId(interview.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        title="Cancel Interview"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {confirmCancelInterviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel Interview?</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel this interview? The candidate will need to be rescheduled.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmCancelInterviewId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Keep
              </button>
              <button
                onClick={() => cancelInterview(confirmCancelInterviewId)}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Cancel Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Completed Interviews Tab ─────────────────────────────────────────────────

function CompletedTab({
  interviews,
  loading,
  expandedInterviewId,
  setExpandedInterviewId,
  statusBadge,
  ratingDisplay,
  navigate,
}: {
  interviews: Interview[];
  loading: boolean;
  expandedInterviewId: string | null;
  setExpandedInterviewId: (id: string | null) => void;
  statusBadge: (status: InterviewStatus) => React.ReactNode;
  ratingDisplay: (rating: number | null) => React.ReactNode;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <CheckCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">No completed interviews yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Candidate</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Overall Rating</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {interviews.map((interview) => (
              <Fragment key={interview.id}>
                <tr
                  onClick={() =>
                    setExpandedInterviewId(
                      expandedInterviewId === interview.id ? null : interview.id
                    )
                  }
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {interview.candidate?.full_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {interview.candidate?.email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {format(parseISO(interview.scheduled_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">{statusBadge(interview.status)}</td>
                  <td className="px-4 py-3">{ratingDisplay(interview.overall_rating)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (interview.candidate_id) {
                          navigate(`/admin/recruitment/${interview.candidate_id}`);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View Details
                    </button>
                  </td>
                </tr>

                {/* Expanded Details */}
                {expandedInterviewId === interview.id && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Ratings */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Ratings
                          </h4>
                          <div className="space-y-2">
                            {[
                              { label: 'Teaching Demo', value: interview.teaching_demo_rating },
                              { label: 'Communication', value: interview.communication_rating },
                              { label: 'Knowledge', value: interview.knowledge_rating },
                              { label: 'Personality', value: interview.personality_rating },
                              { label: 'Overall', value: interview.overall_rating },
                            ].map((r) => (
                              <div key={r.label} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{r.label}</span>
                                {ratingDisplay(r.value)}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes & AI Summary */}
                        <div className="space-y-4">
                          {interview.interview_notes && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Interview Notes
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                {interview.interview_notes}
                              </p>
                            </div>
                          )}
                          {interview.ai_summary && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                AI Summary
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                {interview.ai_summary}
                              </p>
                            </div>
                          )}
                          {!interview.interview_notes && !interview.ai_summary && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                              No notes or AI summary available.
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

