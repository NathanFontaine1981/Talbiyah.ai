import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { invokeGenerate, type GenerationChecks } from '../../lib/madrasaFunctions';
import { formatCitation } from '../../lib/madrasaUnits';
import ActivityCards, { type Activity } from '../../components/madrasa/ActivityCards';
import MadrasaMarkdown from '../../components/madrasa/MadrasaMarkdown';

interface SessionRow { id: string; class_id: string; session_date: string; start_time: string; end_time: string; status: string; teacher_emphasis: string | null }
interface ClassRow { id: string; name: string; age_band: string }
interface UnitRow { id: string; unit_number: number; title: string; description: string | null; book_reference: string | null; page_from: number | null; page_to: number | null }
interface RosterRow { learner_id: string; first_name: string; status: string }
interface Materials {
  status: 'draft' | 'published';
  parent_notes: string | null;
  homework: string | null;
  teacher_activities: Activity[];
  generation_checks: GenerationChecks | null;
  generated_at: string | null;
  edited_at: string | null;
  published_at: string | null;
  parents_notified_at: string | null;
}

const MAX_UNITS = 3;
const hhmm = (t: string) => t.slice(0, 5);
const prettyDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 font-medium disabled:opacity-50';

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">{n}</span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {hint && <p className="text-sm text-gray-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function MadrasaSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionRow | null>(null);
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [emphasis, setEmphasis] = useState('');
  const [materials, setMaterials] = useState<Materials | null>(null);
  const [notes, setNotes] = useState('');
  const [homework, setHomework] = useState('');
  const [tab, setTab] = useState<'notes' | 'homework' | 'activities'>('notes');
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [checkedArabic, setCheckedArabic] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [ask, setAsk] = useState<{ message: string; yes: string; run: () => void } | null>(null);

  const loadMaterials = useCallback(async (id: string) => {
    const { data } = await supabase.from('madrasa_session_materials')
      .select('status, parent_notes, homework, teacher_activities, generation_checks, generated_at, edited_at, published_at, parents_notified_at')
      .eq('session_id', id).maybeSingle();
    const m = (data as Materials | null) ?? null;
    setMaterials(m);
    setNotes(m?.parent_notes ?? '');
    setHomework(m?.homework ?? '');
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const [{ data: { user } }, { data: s }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('madrasa_sessions').select('id, class_id, session_date, start_time, end_time, status, teacher_emphasis').eq('id', sessionId).maybeSingle(),
      ]);
      if (!s || !user) { setStatus('missing'); return; }
      setUserId(user.id);
      setSession(s as SessionRow);
      setEmphasis(s.teacher_emphasis ?? '');
      const [c, r, u, su, att] = await Promise.all([
        supabase.from('madrasa_classes').select('id, name, age_band').eq('id', s.class_id).single(),
        supabase.rpc('madrasa_class_roster', { p_class_id: s.class_id }),
        supabase.from('madrasa_units').select('id, unit_number, title, description, book_reference, page_from, page_to').eq('class_id', s.class_id).order('unit_number'),
        supabase.from('madrasa_session_units').select('unit_id').eq('session_id', s.id),
        supabase.from('madrasa_attendance').select('learner_id, status').eq('session_id', s.id),
      ]);
      setCls(c.data as ClassRow);
      setRoster(((r.data ?? []) as RosterRow[]).filter((x) => x.status === 'active'));
      setUnits((u.data ?? []) as UnitRow[]);
      setPicked(new Set((su.data ?? []).map((x) => x.unit_id as string)));
      setAttendance(Object.fromEntries((att.data ?? []).map((a) => [a.learner_id as string, a.status as 'present' | 'absent'])));
      await loadMaterials(s.id);
      setStatus('ok');
    })();
  }, [sessionId, loadMaterials]);

  // ------------------------------------------------------------------ register
  const mark = async (learnerIds: string[], value: 'present' | 'absent') => {
    if (!session) return;
    const prev = attendance;
    setAttendance((a) => ({ ...a, ...Object.fromEntries(learnerIds.map((id) => [id, value])) }));
    const { error } = await supabase.from('madrasa_attendance').upsert(
      learnerIds.map((learner_id) => ({ session_id: session.id, learner_id, status: value, marked_by: userId, marked_at: new Date().toISOString() })),
      { onConflict: 'session_id,learner_id' },
    );
    if (error) { setAttendance(prev); toast.error(`Could not save the register: ${error.message}`); }
  };

  const presentCount = Object.values(attendance).filter((v) => v === 'present').length;
  const absentCount = Object.values(attendance).filter((v) => v === 'absent').length;
  const unmarked = roster.length - presentCount - absentCount;

  // --------------------------------------------------------------------- units
  const toggleUnit = async (u: UnitRow) => {
    if (!session) return;
    const on = picked.has(u.id);
    if (!on && picked.size >= MAX_UNITS) { toast.error(`Pick at most ${MAX_UNITS} units for one lesson`); return; }
    const next = new Set(picked);
    on ? next.delete(u.id) : next.add(u.id);
    setPicked(next);
    const { error } = on
      ? await supabase.from('madrasa_session_units').delete().eq('session_id', session.id).eq('unit_id', u.id)
      : await supabase.from('madrasa_session_units').insert({ session_id: session.id, unit_id: u.id });
    if (error) { setPicked(picked); toast.error(error.message); }
  };

  // ------------------------------------------------------------------ emphasis
  const nameHits = useMemo(() => {
    const text = emphasis.toLowerCase();
    if (!text.trim()) return [];
    return roster.map((r) => r.first_name).filter((n) => n && new RegExp(`(^|[^\\p{L}])${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(text));
  }, [emphasis, roster]);

  // ------------------------------------------------------------------ generate
  const generate = async (overwrite = false) => {
    if (!session) return;
    setGenerating(true);
    const { data, error, status: http } = await invokeGenerate<{ checks: GenerationChecks }>({ session_id: session.id, teacher_emphasis: emphasis, overwrite });
    setGenerating(false);
    if (error) {
      if (http === 409 && /edited/i.test(error)) {
        setAsk({ message: 'You have edited this draft. Replace it with a fresh one? Your edits will be lost.', yes: 'Replace it', run: () => { void generate(true); } });
        return;
      }
      toast.error(error);
      return;
    }
    await loadMaterials(session.id);
    setEditing(false);
    setTab('notes');
    setCheckedArabic(false);
    const n = (data?.checks.hard.length ?? 0) + (data?.checks.warnings.length ?? 0);
    toast.success(n ? `Draft ready, with ${n} thing${n === 1 ? '' : 's'} to check` : 'Draft ready. Please review it.');
  };

  const dirty = !!materials && (notes !== (materials.parent_notes ?? '') || homework !== (materials.homework ?? ''));
  const published = materials?.status === 'published';

  const saveEdits = async () => {
    if (!session) return;
    const { error } = await supabase.from('madrasa_session_materials')
      .update({ parent_notes: notes, homework, edited_at: new Date().toISOString() }).eq('session_id', session.id);
    if (error) { toast.error(error.message); return; }
    await loadMaterials(session.id);
    toast.success(published ? 'Changes saved. Parents see the update in their portal; they were not emailed.' : 'Changes saved');
  };

  const publish = async () => {
    if (!session) return;
    setPublishing(true);
    const { error } = await supabase.from('madrasa_session_materials')
      .update({ status: 'published', published_at: new Date().toISOString(), published_by: userId }).eq('session_id', session.id);
    setPublishing(false);
    if (error) { toast.error(error.message); return; }
    setConfirmPublish(false);
    await notify(false);
    await loadMaterials(session.id);
  };

  // Email parents a short summary + portal link. Without force it is idempotent: nobody is emailed twice
  // for the same lesson. force = the teacher explicitly chose "notify parents again" after an edit.
  const notify = async (force: boolean) => {
    if (!session) return;
    const { data, error } = await supabase.functions.invoke('madrasa-notify-parents', { body: { session_id: session.id, force } });
    if (error || !data) { toast.error('The notes are published, but the email could not be sent. You can try again from this page.'); return; }
    const d = data as { sent: number; skipped_test_address: number; already_emailed: number; errors: number };
    if (d.errors > 0) { toast.error(`The notes are published. ${d.errors} email${d.errors === 1 ? '' : 's'} could not be sent.`); return; }
    const parts = [`Published. ${d.sent} parent${d.sent === 1 ? '' : 's'} emailed.`];
    if (d.skipped_test_address) parts.push(`${d.skipped_test_address} test address${d.skipped_test_address === 1 ? '' : 'es'} skipped.`);
    if (d.already_emailed && !d.sent) parts.splice(0, 1, 'Published. Parents were already emailed about this lesson, so no new email was sent.');
    toast.success(parts.join(' '));
  };

  // -------------------------------------------------------------- finish lesson
  const finish = async (skipUnmarkedCheck = false) => {
    if (!session) return;
    if (picked.size === 0) { toast.error('Tick at least one unit that you covered'); return; }
    if (unmarked > 0 && !skipUnmarkedCheck) {
      setAsk({ message: `${unmarked} ${unmarked === 1 ? 'child is' : 'children are'} not marked on the register. They won’t be counted as present or absent. Close the lesson anyway?`, yes: 'Close the lesson', run: () => { void finish(true); } });
      return;
    }
    const { error } = await supabase.from('madrasa_sessions').update({ status: 'taught', taught_by: userId }).eq('id', session.id);
    if (error) { toast.error(error.message); return; }
    setSession({ ...session, status: 'taught' });
    toast.success('Lesson closed. Each child’s unit progress is updated.');
  };

  if (status === 'loading') return <div className="p-8 text-gray-500">Loading…</div>;
  if (status === 'missing' || !session || !cls) {
    return <div className="mx-auto max-w-2xl p-8"><p className="text-gray-700">That session wasn't found, or you don't have access.</p><Link to="/madrasa" className="mt-3 inline-block text-emerald-700 underline">Back to classes</Link></div>;
  }

  const checks = materials?.generation_checks ?? { hard: [], warnings: [] };
  const taught = session.status === 'taught';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link to={`/madrasa/classes/${cls.id}`} className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> {cls.name}</Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{prettyDate(session.session_date)}</h1>
        <p className="text-gray-600">{hhmm(session.start_time)}–{hhmm(session.end_time)} · {cls.age_band}
          {taught && <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Lesson closed</span>}</p>
      </header>

      {/* 1. Register */}
      <Section n={1} title="Register" hint="Tap Present or Absent for each child.">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">{presentCount} present</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">{absentCount} absent</span>
          {unmarked > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">{unmarked} not marked</span>}
          <button onClick={() => mark(roster.map((r) => r.learner_id), 'present')} disabled={roster.length === 0} className="ml-auto min-h-11 rounded-lg border border-emerald-600 px-4 font-medium text-emerald-700 hover:bg-emerald-50">Mark all present</button>
        </div>
        {roster.length === 0 ? <p className="text-gray-600">No children are enrolled in this class yet.</p> : (
          <ul className="divide-y divide-gray-100">
            {roster.map((r) => {
              const v = attendance[r.learner_id];
              return (
                <li key={r.learner_id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-base font-medium text-gray-900">{r.first_name}</span>
                  <button aria-pressed={v === 'present'} onClick={() => mark([r.learner_id], 'present')} className={`min-h-12 w-28 rounded-lg border text-base font-medium ${v === 'present' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Present</button>
                  <button aria-pressed={v === 'absent'} onClick={() => mark([r.learner_id], 'absent')} className={`min-h-12 w-28 rounded-lg border text-base font-medium ${v === 'absent' ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Absent</button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* 2. Units */}
      <Section n={2} title="What did you cover?" hint={`Tick the unit${MAX_UNITS > 1 ? 's' : ''} from the scheme of work (up to ${MAX_UNITS}).`}>
        {units.length === 0 ? <p className="text-gray-600">No units yet. Add them on the class page first.</p> : (
          <ul className="space-y-2">
            {units.map((u) => (
              <li key={u.id}>
                <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 ${picked.has(u.id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" className="h-6 w-6 accent-emerald-600" checked={picked.has(u.id)} onChange={() => toggleUnit(u)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-gray-900">{u.unit_number}. {u.title}</span>
                    {(u.description || formatCitation(u)) && <span className="block text-sm text-gray-500">{[u.description, formatCitation(u)].filter(Boolean).join(' · ')}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 3. Emphasis + generate */}
      <Section n={3} title="Your emphasis (optional)" hint="Anything you want stressed, or homework you want set.">
        <textarea value={emphasis} onChange={(e) => setEmphasis(e.target.value)} rows={3} maxLength={1000} disabled={published}
          placeholder="e.g. Stress that wudu is before every salah. Ask them to practise at the sink."
          className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
        <p className="mt-1 text-sm text-gray-600">Don’t include pupil names — notes go to all parents.</p>
        {nameHits.length > 0 && (
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            This looks like it names a pupil ({nameHits.join(', ')}). Please take the name out. We also remove it automatically before the notes are written.</p>
        )}
        <div className="mt-4">
          <button onClick={() => generate(false)} disabled={generating || picked.size === 0 || published} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
            <Sparkles className="h-4 w-4" /> {generating ? 'Writing the notes… about a minute' : materials ? 'Generate again' : 'Generate notes'}
          </button>
          {picked.size === 0 && <span className="ml-3 text-sm text-gray-500">Tick a unit first</span>}
          {published && <span className="ml-3 text-sm text-gray-500">Published notes can’t be regenerated</span>}
        </div>
      </Section>

      {/* 4. Review */}
      {materials && (
        <Section n={4} title={published ? 'Published notes' : 'Review the draft'} hint={published ? `Published ${new Date(materials.published_at ?? '').toLocaleString('en-GB')}. Parents can see these notes.` : 'Nothing goes to parents until you publish.'}>
          {/* Generator warnings: above the draft */}
          {(checks.hard.length > 0 || checks.warnings.length > 0) && (
            <div data-testid="generation-warnings" className="mb-4 space-y-2">
              {checks.hard.length > 0 && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4">
                  <p className="mb-1 flex items-center gap-2 font-semibold text-red-800"><AlertTriangle className="h-5 w-5" /> Needs fixing before you publish</p>
                  <ul className="list-disc pl-6 text-sm text-red-800">{checks.hard.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              {checks.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <p className="mb-1 flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle className="h-5 w-5" /> Please check</p>
                  <ul className="list-disc pl-6 text-sm text-amber-900">{checks.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Fixed notice */}
          <div data-testid="arabic-notice" className="mb-4 flex items-start gap-3 rounded-xl border border-sky-300 bg-sky-50 p-4 text-sky-900">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-medium">Check all Arabic text and any Qur’an/hadith references before publishing</p>
          </div>

          <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
            {([['notes', 'Parent notes'], ['homework', 'Homework'], ['activities', 'Teacher activities (only you)']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`min-h-11 rounded-lg px-4 text-sm font-medium ${tab === k ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{label}</button>
            ))}
            {tab !== 'activities' && (
              <button onClick={() => setEditing((e) => !e)} className="ml-auto min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">{editing ? 'Preview' : 'Edit'}</button>
            )}
          </div>

          {tab === 'activities' ? <ActivityCards activities={materials.teacher_activities} /> : editing ? (
            <textarea value={tab === 'notes' ? notes : homework} onChange={(e) => (tab === 'notes' ? setNotes(e.target.value) : setHomework(e.target.value))}
              rows={22} dir="auto" className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          ) : (
            <div className="rounded-xl bg-gray-50 p-4" data-testid={tab === 'notes' ? 'notes-preview' : 'homework-preview'}>
              <MadrasaMarkdown>{tab === 'notes' ? notes : homework}</MadrasaMarkdown>
            </div>
          )}

          {published && (
            <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={saveEdits} disabled={!dirty} className={`${btn} border border-emerald-600 text-emerald-700 hover:bg-emerald-50`}>Save changes</button>
                {dirty && <span className="text-sm text-amber-700">You have unsaved changes.</span>}
              </div>
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {materials?.parents_notified_at ? `Parents were emailed on ${new Date(materials.parents_notified_at).toLocaleString('en-GB')}. ` : 'Parents have not been emailed yet. '}
                Changes you save appear in the parent portal straight away, but parents are <strong>not</strong> emailed again unless you choose to.
              </p>
              <button onClick={() => setAsk({ message: 'Email the parents again to say these notes have been updated?', yes: 'Notify parents again', run: () => { void notify(true); } })} disabled={dirty}
                className={`${btn} border border-gray-300 text-gray-800 hover:bg-gray-50`}>Notify parents again</button>
              {!materials?.parents_notified_at && <button onClick={() => void notify(false)} disabled={dirty} className={`${btn} ml-3 bg-emerald-600 text-white hover:bg-emerald-700`}>Send the first email</button>}
            </div>
          )}
          {!published && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
              <button onClick={saveEdits} disabled={!dirty} className={`${btn} border border-emerald-600 text-emerald-700 hover:bg-emerald-50`}>Save changes</button>
              <button onClick={() => { setConfirmPublish(true); setCheckedArabic(false); }} disabled={dirty || checks.hard.length > 0} className={`${btn} ml-auto bg-emerald-600 text-white hover:bg-emerald-700`}>Publish to parents</button>
              {dirty && <span className="w-full text-sm text-amber-700">Save your changes before publishing.</span>}
              {checks.hard.length > 0 && <span className="w-full text-sm text-red-700">Fix the items in red (edit the text, or generate again) before publishing.</span>}
            </div>
          )}
        </Section>
      )}

      {/* 5. Finish */}
      <Section n={materials ? 5 : 4} title="Finish the lesson" hint="Closing the lesson records which units each child covered (present) or missed (absent).">
        {taught ? <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Lesson closed. Register changes now will still update unit progress.</p> : (
          <button onClick={() => finish()} className={`${btn} border border-emerald-600 text-emerald-700 hover:bg-emerald-50`}><Check className="h-4 w-4" /> Close the lesson</button>
        )}
      </Section>

      {/* Generic confirmation */}
      {ask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="alertdialog" aria-modal="true">
          <div className="w-full rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl">
            <p className="mb-5 text-gray-800">{ask.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setAsk(null)} className="min-h-11 rounded-lg px-4 text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={() => { const r = ask.run; setAsk(null); r(); }} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>{ask.yes}</button>
            </div>
          </div>
        </div>
      )}

      {/* Publish confirmation */}
      {confirmPublish && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <div className="w-full rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Publish to parents?</h3>
              <button onClick={() => setConfirmPublish(false)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-3 text-gray-700">The parent notes and homework will be visible to the parents of the {roster.length} {roster.length === 1 ? 'child' : 'children'} in this class. Teacher activities stay private. Each parent gets one short email with a link, and no one is emailed twice for the same lesson.</p>
            {checks.warnings.length > 0 && <p className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">There {checks.warnings.length === 1 ? 'is 1 warning' : `are ${checks.warnings.length} warnings`} above. Have you dealt with {checks.warnings.length === 1 ? 'it' : 'them'}?</p>}
            <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
              <input type="checkbox" className="mt-0.5 h-6 w-6 accent-emerald-600" checked={checkedArabic} onChange={(e) => setCheckedArabic(e.target.checked)} />
              <span className="text-gray-800">I have checked all the Arabic text and any Qur’an/hadith references.</span>
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmPublish(false)} className="min-h-11 rounded-lg px-4 text-gray-700 hover:bg-gray-100">Not yet</button>
              <button onClick={publish} disabled={!checkedArabic || publishing} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>{publishing ? 'Publishing…' : 'Publish'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
