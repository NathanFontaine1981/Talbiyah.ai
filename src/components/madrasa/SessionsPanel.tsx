import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { ukToday } from '../../lib/madrasaFunctions';

interface Slot { day_of_week: number; start_time: string; end_time: string }
interface Row { id: string; session_date: string; start_time: string; end_time: string; status: string }

const hhmm = (t: string) => t.slice(0, 5);
const STATUS: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  taught: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  teacher_absent: 'bg-amber-100 text-amber-800',
};
const prettyDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function SessionsPanel({ classId, schedule, canEdit }: { classId: string; schedule: Slot[]; canEdit: boolean }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(ukToday());
  const [start, setStart] = useState('17:00');
  const [end, setEnd] = useState('18:00');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('madrasa_sessions').select('id, session_date, start_time, end_time, status')
      .eq('class_id', classId).order('session_date', { ascending: false }).order('start_time').limit(30);
    setRows((data ?? []) as Row[]);
  }, [classId]);
  useEffect(() => { load(); }, [load]);

  // Prefill the time from the timetable slot for the chosen weekday.
  useEffect(() => {
    const dow = new Date(`${date}T12:00:00`).getDay();
    const slot = schedule.find((s) => s.day_of_week === dow);
    if (slot) { setStart(hhmm(slot.start_time)); setEnd(hhmm(slot.end_time)); }
  }, [date, schedule]);

  const create = async () => {
    if (end <= start) { toast.error('The end time must be after the start time'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('madrasa_sessions')
      .insert({ class_id: classId, session_date: date, start_time: start, end_time: end }).select('id').single();
    if (error?.code === '23505') {
      const { data: ex } = await supabase.from('madrasa_sessions').select('id').eq('class_id', classId).eq('session_date', date).eq('start_time', start).maybeSingle();
      setSaving(false);
      if (ex) { toast.message('That session already exists. Opening it.'); navigate(`/madrasa/sessions/${ex.id}`); return; }
    }
    setSaving(false);
    if (error || !data) { toast.error(error?.message ?? 'Could not create the session'); return; }
    navigate(`/madrasa/sessions/${data.id}`);
  };

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Sessions</h2>
        {canEdit && (
          <button onClick={() => setAdding(true)} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 font-medium text-white hover:bg-emerald-700">
            <CalendarPlus className="h-4 w-4" /> New session
          </button>
        )}
      </div>

      {rows === null ? <p className="text-gray-500">Loading…</p> : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-600">No sessions yet.</div>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {rows.map((s) => (
            <li key={s.id}>
              <Link to={`/madrasa/sessions/${s.id}`} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{prettyDate(s.session_date)}</p>
                  <p className="text-sm text-gray-500">{hhmm(s.start_time)}–{hhmm(s.end_time)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[s.status] ?? STATUS.scheduled}`}>{s.status === 'taught' ? 'Taught' : s.status === 'scheduled' ? 'Open' : s.status.replace('_', ' ')}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <div className="w-full rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New session</h3>
              <button onClick={() => setAdding(false)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2"><span className="mb-1 block text-sm font-medium text-gray-700">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 w-full rounded-lg border border-gray-300 px-3 text-base" /></label>
              <label><span className="mb-1 block text-sm font-medium text-gray-700">Starts</span>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="min-h-11 w-full rounded-lg border border-gray-300 px-3 text-base" /></label>
              <label><span className="mb-1 block text-sm font-medium text-gray-700">Ends</span>
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="min-h-11 w-full rounded-lg border border-gray-300 px-3 text-base" /></label>
            </div>
            <p className="mt-3 text-xs text-gray-500">Times are filled in from the timetable when the day matches. The timetable is still provisional.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setAdding(false)} className="min-h-11 rounded-lg px-4 text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={create} disabled={saving} className="min-h-11 rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Creating…' : 'Create and open'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
