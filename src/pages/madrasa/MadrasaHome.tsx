import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Row { id: string; name: string; age_band: string; syllabus_reference: string | null; org: { name: string } | null }

// Placeholder landing for Session 3: lists the classes the signed-in user can see.
// The teacher portal (schedule, today's session) replaces this in a later session.
export default function MadrasaHome() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    supabase
      .from('madrasa_classes')
      .select('id, name, age_band, syllabus_reference, org:madrasa_organisations(name)')
      .order('name')
      .then(({ data }) => setRows((data ?? []) as unknown as Row[]));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Madrasa classes</h1>
      {rows === null ? <p className="text-gray-500">Loading…</p> : rows.length === 0 ? (
        <p className="text-gray-600">You don't have any madrasa classes yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
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
