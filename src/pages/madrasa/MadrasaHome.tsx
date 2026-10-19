import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { ukToday } from '../../lib/madrasaFunctions';

interface ClassRowT { id: string; name: string; age_band: string; syllabus_reference: string | null; org: { name: string } | null }
interface TodayRow { id: string; class_id: string; start_time: string; end_time: string; status: string }

const hhmm = (t: string) => t.slice(0, 5);

// Madrasa home: today's sessions first, then the user's classes.
export default function MadrasaHome() {
  const [classes, setClasses] = useState<ClassRowT[] | null>(null);
  const [today, setToday] = useState<TodayRow[]>([]);
  const [isParentOnly, setIsParentOnly] = useState(false);

  useEffect(() => {
    (async () => {
      // Parents (no organisation role) belong in the family portal, not the teacher home.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from('madrasa_org_members').select('role').eq('user_id', user.id).limit(1);
        if (!member?.length) {
          const { data: kids } = await supabase.from('learners').select('id').eq('parent_id', user.id).limit(1);
          if (kids?.length) { setIsParentOnly(true); return; }
        }
      }
      const [c, t] = await Promise.all([
        supabase.from('madrasa_classes').select('id, name, age_band, syllabus_reference, org:madrasa_organisations(name)').order('name'),
        supabase.from('madrasa_sessions').select('id, class_id, start_time, end_time, status').eq('session_date', ukToday()).order('start_time'),
      ]);
      setClasses((c.data ?? []) as unknown as ClassRowT[]);
      setToday((t.data ?? []) as TodayRow[]);
    })();
  }, []);

  if (isParentOnly) return <Navigate to="/madrasa/family" replace />;

  const nameOf = (id: string) => classes?.find((c) => c.id === id)?.name ?? 'Class';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Madrasa</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Today</h2>
        {today.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-4 text-gray-600">No session is set up for today. Open a class below and tap “New session”.</p>
        ) : (
          <ul className="space-y-3">
            {today.map((s) => (
              <li key={s.id}>
                <Link to={`/madrasa/sessions/${s.id}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 hover:border-emerald-500">
                  <CalendarCheck className="h-5 w-5 text-emerald-700" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{nameOf(s.class_id)}</p>
                    <p className="text-sm text-gray-600">{hhmm(s.start_time)}–{hhmm(s.end_time)} · {s.status === 'taught' ? 'Lesson closed' : 'Open the register'}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Your classes</h2>
      {classes === null ? <p className="text-gray-500">Loading…</p> : classes.length === 0 ? (
        <p className="text-gray-600">You don't have any madrasa classes yet.</p>
      ) : (
        <ul className="space-y-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link to={`/madrasa/classes/${c.id}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-400">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-600">{[c.org?.name, c.age_band, c.syllabus_reference].filter(Boolean).join(' · ')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
