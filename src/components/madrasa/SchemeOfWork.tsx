import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardPaste, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { formatCitation, type SavedUnit } from '../../lib/madrasaUnits';
import UnitEditor from './UnitEditor';
import UnitPasteImporter from './UnitPasteImporter';

interface Props {
  classId: string;
  canEdit: boolean;
}

export default function SchemeOfWork({ classId, canEdit }: Props) {
  const [units, setUnits] = useState<SavedUnit[] | null>(null);
  const [editing, setEditing] = useState<SavedUnit | 'new' | null>(null);
  const [pasting, setPasting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('madrasa_units')
      .select('id, unit_number, title, description, book_reference, page_from, page_to')
      .eq('class_id', classId)
      .order('unit_number');
    if (error) { toast.error(`Could not load units: ${error.message}`); setUnits([]); return; }
    setUnits((data ?? []).map((u) => ({ ...u, description: u.description ?? '', book_reference: u.book_reference ?? '' })));
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const swap = async (a: SavedUnit, b: SavedUnit | undefined) => {
    if (!b) return;
    const { error } = await supabase.rpc('madrasa_swap_units', { p_a: a.id, p_b: b.id });
    if (error) toast.error(`Could not reorder: ${error.message}`);
    await load();
  };

  const remove = async (u: SavedUnit) => {
    // Units already taught in a session carry attendance/progress history; don't silently erase it.
    const { count } = await supabase.from('madrasa_session_units').select('session_id', { count: 'exact', head: true }).eq('unit_id', u.id);
    if (count) { toast.error(`Unit ${u.unit_number} has been covered in ${count} session${count === 1 ? '' : 's'}, so it can't be deleted.`); setConfirmDelete(null); return; }
    const { error } = await supabase.from('madrasa_units').delete().eq('id', u.id);
    setConfirmDelete(null);
    if (error) toast.error(error.message); else toast.success(`Unit ${u.unit_number} deleted`);
    await load();
  };

  const nextNumber = (units ?? []).reduce((m, u) => Math.max(m, u.unit_number), 0) + 1;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Scheme of work</h2>
        {units && <span className="text-sm text-gray-500">{units.length} unit{units.length === 1 ? '' : 's'}</span>}
        {canEdit && (
          <div className="ml-auto flex flex-wrap gap-2">
            <button onClick={() => setPasting(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-600 px-4 font-medium text-emerald-700 hover:bg-emerald-50">
              <ClipboardPaste className="h-4 w-4" /> Paste a term
            </button>
            <button onClick={() => setEditing('new')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 font-medium text-white hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add unit
            </button>
          </div>
        )}
      </div>

      {units === null ? (
        <p className="text-gray-500">Loading…</p>
      ) : units.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          No units yet.{canEdit && ' Use “Paste a term” to enter the whole term in one go.'}
        </div>
      ) : (
        <ol className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {units.map((u, i) => (
            <li key={u.id} className="flex items-start gap-3 p-3 sm:p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">{u.unit_number}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{u.title}</p>
                {u.description && <p className="text-sm text-gray-600">{u.description}</p>}
                {formatCitation(u) && <p className="mt-0.5 text-xs text-gray-500">{formatCitation(u)}</p>}
                {confirmDelete === u.id && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">
                    Delete unit {u.unit_number}?
                    <button onClick={() => remove(u)} className="min-h-11 rounded-lg bg-red-600 px-4 font-medium text-white">Delete</button>
                    <button onClick={() => setConfirmDelete(null)} className="min-h-11 rounded-lg px-3 hover:bg-red-100">Keep</button>
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => swap(u, units[i - 1])} disabled={i === 0} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30" aria-label={`Move unit ${u.unit_number} up`}><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => swap(u, units[i + 1])} disabled={i === units.length - 1} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30" aria-label={`Move unit ${u.unit_number} down`}><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => setEditing(u)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100" aria-label={`Edit unit ${u.unit_number}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setConfirmDelete(u.id)} className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50" aria-label={`Delete unit ${u.unit_number}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <UnitEditor
          classId={classId}
          unit={editing === 'new' ? null : editing}
          nextNumber={nextNumber}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {pasting && (
        <UnitPasteImporter
          classId={classId}
          saved={units ?? []}
          onClose={() => setPasting(false)}
          onSaved={() => { setPasting(false); load(); }}
        />
      )}
    </section>
  );
}
