import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import SchemeOfWork from '../../components/madrasa/SchemeOfWork';
import SessionsPanel from '../../components/madrasa/SessionsPanel';

interface ClassRow {
  id: string;
  organisation_id: string;
  name: string;
  syllabus_reference: string | null;
  academic_year: string | null;
  term: string | null;
  age_band: string;
  learner_type: string;
  teacher_id: string | null;
  subject: { name: string } | null;
  teacher: { full_name: string } | null;
  schedule: { id: string; day_of_week: number; start_time: string; end_time: string; is_provisional: boolean }[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hhmm = (t: string) => t.slice(0, 5);

export default function MadrasaClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('madrasa_classes')
        .select(`id, organisation_id, name, syllabus_reference, academic_year, term, age_band, learner_type, teacher_id,
                 subject:subjects(name),
                 teacher:profiles!madrasa_classes_teacher_id_fkey(full_name),
                 schedule:madrasa_class_schedule(id, day_of_week, start_time, end_time, is_provisional)`)
        .eq('id', classId)
        .maybeSingle();
      if (!data || !user) { setStatus('missing'); return; }
      const row = data as unknown as ClassRow;
      row.schedule = [...(row.schedule ?? [])].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
      setCls(row);

      // Mirrors the RLS write rule (class teacher, org admin, platform admin). RLS is the real gate;
      // this only decides whether to show the edit buttons.
      const [{ data: member }, { data: me }] = await Promise.all([
        supabase.from('madrasa_org_members').select('role').eq('organisation_id', row.organisation_id).eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('roles, is_admin').eq('id', user.id).maybeSingle(),
      ]);
      const platformAdmin = me?.is_admin === true || (me?.roles ?? []).some((r: string) => r.toLowerCase() === 'admin');
      setCanEdit(row.teacher_id === user.id || member?.role === 'admin' || platformAdmin);
      setStatus('ok');
    })();
  }, [classId]);

  if (status === 'loading') return <div className="p-8 text-gray-500">Loading…</div>;
  if (status === 'missing' || !cls) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="text-gray-700">That class wasn't found, or you don't have access to it.</p>
        <Link to="/madrasa" className="mt-3 inline-block text-emerald-700 underline">Back to classes</Link>
      </div>
    );
  }

  const provisional = cls.schedule.some((s) => s.is_provisional);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link to="/madrasa" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> All classes</Link>

      <header className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        <p className="mt-1 text-gray-600">
          {[cls.subject?.name, cls.age_band, cls.syllabus_reference].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {[cls.term && `${cls.term} term`, cls.academic_year, cls.teacher?.full_name && `Teacher: ${cls.teacher.full_name}`].filter(Boolean).join(' · ')}
        </p>
        {cls.schedule.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            {cls.schedule.map((s) => (
              <span key={s.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {DAYS[s.day_of_week]} {hhmm(s.start_time)}–{hhmm(s.end_time)}
              </span>
            ))}
            {provisional && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">TEST timetable – to be confirmed</span>}
          </div>
        )}
      </header>

      <SessionsPanel classId={cls.id} schedule={cls.schedule} canEdit={canEdit} />
      <SchemeOfWork classId={cls.id} canEdit={canEdit} />
    </div>
  );
}
