import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronUp, Clock, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import MadrasaMarkdown from '../../components/madrasa/MadrasaMarkdown';

interface Child { id: string; first_name: string }
interface ClassInfo { id: string; name: string; age_band: string; term: string | null; academic_year: string | null; teacher: { full_name: string } | null }
interface Slot { class_id: string; day_of_week: number; start_time: string; end_time: string; is_provisional: boolean }
interface SessionRow { id: string; class_id: string; session_date: string }
interface Note { session_id: string; class_id: string; session_date: string; parent_notes: string; homework: string; units: { unit_number: number; title: string }[] | null }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hhmm = (t: string) => t.slice(0, 5);
const prettyDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// A distinct accent per child keeps siblings visually separate.
const ACCENTS = [
  { border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500' },
  { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-800', dot: 'bg-violet-500' },
  { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
];

export default function MadrasaFamilyPage() {
  const [params] = useSearchParams();
  const focusNote = params.get('note');
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [enrolments, setEnrolments] = useState<{ learner_id: string; class_id: string }[]>([]);
  const [classes, setClasses] = useState<Record<string, ClassInfo>>({});
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sessions, setSessions] = useState<Record<string, SessionRow>>({});
  const [attendance, setAttendance] = useState<{ learner_id: string; session_id: string; status: 'present' | 'absent' }[]>([]);
  const [sessionUnits, setSessionUnits] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const noteRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: kids } = await supabase.from('learners').select('id, first_name, name').eq('parent_id', user.id).order('first_name');
      const kidIds = (kids ?? []).map((k) => k.id as string);
      const { data: enr } = kidIds.length
        ? await supabase.from('madrasa_class_enrolments').select('learner_id, class_id').in('learner_id', kidIds).eq('status', 'active')
        : { data: [] as { learner_id: string; class_id: string }[] };
      const enrolled = new Set((enr ?? []).map((e) => e.learner_id));
      setChildren((kids ?? []).filter((k) => enrolled.has(k.id)).map((k) => ({ id: k.id as string, first_name: (k.first_name || k.name || 'Child') as string })));
      setEnrolments(enr ?? []);

      const classIds = [...new Set((enr ?? []).map((e) => e.class_id))];
      if (classIds.length) {
        const [c, sl, se, nt] = await Promise.all([
          supabase.from('madrasa_classes').select('id, name, age_band, term, academic_year, teacher:profiles!madrasa_classes_teacher_id_fkey(full_name)').in('id', classIds),
          supabase.from('madrasa_class_schedule').select('class_id, day_of_week, start_time, end_time, is_provisional').in('class_id', classIds).order('day_of_week'),
          supabase.from('madrasa_sessions').select('id, class_id, session_date').in('class_id', classIds).order('session_date', { ascending: false }),
          supabase.from('madrasa_published_notes').select('session_id, class_id, session_date, parent_notes, homework, units').in('class_id', classIds).order('session_date', { ascending: false }),
        ]);
        setClasses(Object.fromEntries(((c.data ?? []) as unknown as ClassInfo[]).map((x) => [x.id, x])));
        setSlots((sl.data ?? []) as Slot[]);
        const sess = (se.data ?? []) as SessionRow[];
        setSessions(Object.fromEntries(sess.map((s) => [s.id, s])));
        const noteRows = (nt.data ?? []) as Note[];
        setNotes(noteRows);
        setOpen(new Set(focusNote ? [focusNote] : noteRows.slice(0, 1).map((n) => n.session_id)));

        const [att, su] = await Promise.all([
          supabase.from('madrasa_attendance').select('learner_id, session_id, status').in('learner_id', kidIds),
          sess.length ? supabase.from('madrasa_session_units').select('session_id, unit_id, madrasa_units(unit_number, title)').in('session_id', sess.map((s) => s.id)) : Promise.resolve({ data: [] }),
        ]);
        setAttendance((att.data ?? []) as typeof attendance);
        const map: Record<string, string[]> = {};
        for (const r of (su.data ?? []) as unknown as { session_id: string; madrasa_units: { unit_number: number; title: string } | null }[]) {
          if (r.madrasa_units) (map[r.session_id] ??= []).push(r.madrasa_units.title);
        }
        setSessionUnits(map);
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link from the email: scroll to the note once it has rendered.
  useEffect(() => {
    if (!loading && focusNote) noteRefs.current[focusNote]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, focusNote, notes]);

  const classOf = (childId: string) => classes[enrolments.find((e) => e.learner_id === childId)?.class_id ?? ''];
  const childrenByClass = useMemo(() => {
    const m: Record<string, Child[]> = {};
    for (const e of enrolments) { const k = children.find((c) => c.id === e.learner_id); if (k) (m[e.class_id] ??= []).push(k); }
    return m;
  }, [enrolments, children]);

  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!children.length) {
    return <div className="mx-auto max-w-2xl p-8"><h1 className="mb-2 text-2xl font-bold text-gray-900">Madrasa</h1><p className="text-gray-600">None of your children are in a madrasa class yet.</p></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Madrasa</h1>
      <p className="mb-6 text-gray-600">Class details, attendance and notes for your {children.length === 1 ? 'child' : 'children'}.</p>

      {/* One card per child */}
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{children.length === 1 ? 'Your child' : 'Your children'}</h2>
      <div className="mb-10 space-y-5">
        {children.map((child, i) => {
          const a = ACCENTS[i % ACCENTS.length];
          const cls = classOf(child.id);
          const mySlots = slots.filter((s) => s.class_id === cls?.id);
          const rows = attendance
            .filter((r) => r.learner_id === child.id && sessions[r.session_id])
            .sort((x, y) => sessions[y.session_id].session_date.localeCompare(sessions[x.session_id].session_date));
          const present = rows.filter((r) => r.status === 'present').length;
          const absent = rows.length - present;
          return (
            <section key={child.id} data-testid={`child-${child.first_name}`} className={`rounded-2xl border-2 ${a.border} bg-white`}>
              <header className={`flex items-center gap-3 rounded-t-xl ${a.bg} px-4 py-3`}>
                <span className={`h-3 w-3 rounded-full ${a.dot}`} />
                <h3 className={`text-xl font-bold ${a.text}`}>{child.first_name}</h3>
              </header>
              <div className="space-y-4 p-4">
                {cls && (
                  <div>
                    <p className="flex items-start gap-2 font-medium text-gray-900"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />{cls.name}</p>
                    <p className="ml-6 text-sm text-gray-600">{[cls.age_band, cls.term && `${cls.term} term`, cls.academic_year, cls.teacher?.full_name && `Teacher: ${cls.teacher.full_name}`].filter(Boolean).join(' · ')}</p>
                    {mySlots.length > 0 && (
                      <div className="ml-6 mt-2 flex flex-wrap items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {mySlots.map((s, k) => <span key={k} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{DAYS[s.day_of_week]} {hhmm(s.start_time)}–{hhmm(s.end_time)}</span>)}
                        {mySlots.some((s) => s.is_provisional) && <span className="text-xs text-gray-500">Times to be confirmed</span>}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="mb-2 flex items-center gap-2 font-medium text-gray-900"><CalendarDays className="h-4 w-4 text-gray-400" /> Attendance</p>
                  {rows.length === 0 ? <p className="ml-6 text-sm text-gray-500">No lessons recorded yet.</p> : (
                    <>
                      <p className="mb-2 ml-6 text-sm text-gray-600">Present {present} · Absent {absent}</p>
                      <ul className="ml-6 divide-y divide-gray-100 rounded-lg border border-gray-100">
                        {rows.map((r) => {
                          const covered = sessionUnits[r.session_id]?.join(', ');
                          return (
                            <li key={r.session_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                              <span className="text-sm font-medium text-gray-800">{prettyDate(sessions[r.session_id].session_date)}</span>
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>{r.status === 'present' ? 'Present' : 'Absent'}</span>
                              {covered && <span className="text-xs text-gray-500">{r.status === 'absent' ? 'Covered in class: ' : 'Covered: '}{covered}</span>}
                            </li>
                          );
                        })}
                      </ul>
                      {absent > 0 && <p className="ml-6 mt-2 text-xs text-gray-500">The class notes below explain what was taught, so any lesson can be caught up at home.</p>}
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Notes feed, grouped by class (siblings in the same class share the notes) */}
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Class notes</h2>
      {Object.keys(childrenByClass).map((classId) => {
        const list = notes.filter((n) => n.class_id === classId);
        const who = childrenByClass[classId].map((c) => c.first_name).join(' and ');
        return (
          <div key={classId} className="mb-8">
            <p className="mb-3 text-sm text-gray-600">{classes[classId]?.name}, for {who}</p>
            {list.length === 0 ? <p className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-600">No notes yet. They appear here after each lesson.</p> : (
              <ul className="space-y-3">
                {list.map((n) => {
                  const isOpen = open.has(n.session_id);
                  return (
                    <li key={n.session_id} ref={(el) => { noteRefs.current[n.session_id] = el; }} data-testid={`note-${n.session_id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <button onClick={() => toggle(n.session_id)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50" aria-expanded={isOpen}>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{prettyDate(n.session_date)}</p>
                          {n.units?.length ? <p className="text-sm text-gray-500">{n.units.map((u) => u.title).join(', ')}</p> : null}
                        </div>
                        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </button>
                      {isOpen && (
                        <div className="space-y-5 border-t border-gray-100 p-4">
                          <MadrasaMarkdown>{n.parent_notes}</MadrasaMarkdown>
                          <div className="rounded-xl bg-amber-50 p-4">
                            <h4 className="mb-2 font-semibold text-amber-900">Homework</h4>
                            <MadrasaMarkdown>{n.homework}</MadrasaMarkdown>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
