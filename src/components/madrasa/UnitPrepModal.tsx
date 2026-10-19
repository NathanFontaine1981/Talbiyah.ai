import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { invokeGenerate } from '../../lib/madrasaFunctions';
import type { SavedUnit } from '../../lib/madrasaUnits';
import ActivityCards, { type Activity } from './ActivityCards';

/** Lesson prep: teacher-only activity ideas for an upcoming unit, before any session exists. */
export default function UnitPrepModal({ unit, onClose }: { unit: SavedUnit; onClose: () => void }) {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('madrasa_unit_prep').select('teacher_activities').eq('unit_id', unit.id).maybeSingle()
      .then(({ data }) => setActivities((data?.teacher_activities as Activity[] | undefined) ?? []));
  }, [unit.id]);

  const generate = async () => {
    setBusy(true);
    const { data, error } = await invokeGenerate<{ output: { teacher_activities: Activity[] } }>({ prep_unit_id: unit.id });
    setBusy(false);
    if (error || !data) { toast.error(error ?? 'Could not generate'); return; }
    setActivities(data.output.teacher_activities);
    toast.success('Activity ideas ready');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[94vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Prep: unit {unit.unit_number}, {unit.title}</h2>
            <p className="text-sm text-gray-500">Classroom activity ideas for you only. Parents never see these.</p>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {activities === null ? <p className="text-gray-500">Loading…</p> : activities.length === 0 ? (
            <p className="text-gray-600">No activity ideas yet for this unit.</p>
          ) : <ActivityCards activities={activities} />}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
          <button onClick={onClose} className="min-h-11 rounded-lg px-4 text-gray-700 hover:bg-gray-100">Close</button>
          <button onClick={generate} disabled={busy || activities === null} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {busy ? 'Thinking… about a minute' : activities?.length ? 'Regenerate ideas' : 'Generate ideas'}
          </button>
        </div>
      </div>
    </div>
  );
}
