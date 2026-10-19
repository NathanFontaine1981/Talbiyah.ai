import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import {
  classifyRow, parseUnitLines, revalidate, toUpsertPayload,
  type ParsedLine, type SavedUnit,
} from '../../lib/madrasaUnits';

interface Props {
  classId: string;
  saved: SavedUnit[];
  onClose: () => void;
  onSaved: () => void;
}

const PLACEHOLDER = `1 | Who is Allah? | names and attributes, simple | Book 3 pp 4-9
2 | Wudu | steps and why we do it | Book 3 pp 10–15
3 | The five daily prayers`;

const cell =
  'w-full min-h-11 rounded-lg border border-gray-300 px-2.5 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200';

const CHIP: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-800',
  update: 'bg-amber-100 text-amber-800',
  unchanged: 'bg-gray-100 text-gray-600',
};

export default function UnitPasteImporter({ classId, saved, onClose, onSaved }: Props) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<ParsedLine[] | null>(null);
  const [saving, setSaving] = useState(false);

  const parse = () => {
    const parsed = parseUnitLines(text);
    if (!parsed.length) { toast.error('Nothing to preview yet. Paste at least one line.'); return; }
    setRows(parsed);
  };

  const patch = (i: number, p: Partial<ParsedLine>) =>
    setRows((rs) => revalidate((rs ?? []).map((r, idx) => (idx === i ? { ...r, ...p } : r))));

  // Reordering swaps the two rows' unit numbers, so the set of numbers (= which saved units a
  // row updates) never changes. Rows are displayed sorted by number.
  const swapWith = (i: number, j: number) =>
    setRows((rs) => {
      if (!rs || j < 0 || j >= rs.length) return rs;
      const next = rs.map((r) => ({ ...r }));
      const a = next[i].unit_number;
      next[i].unit_number = next[j].unit_number;
      next[j].unit_number = a;
      return revalidate(next);
    });

  const addRow = () =>
    setRows((rs) => {
      const cur = rs ?? [];
      const max = Math.max(0, ...cur.map((r) => r.unit_number ?? 0), ...saved.map((u) => u.unit_number));
      return revalidate([...cur, { line: 0, unit_number: max + 1, title: '', description: '', book_reference: '', page_from: null, page_to: null, errors: [] }]);
    });

  const ordered = useMemo(
    () => (rows ?? []).map((r, i) => ({ r, i })).sort((a, b) => (a.r.unit_number ?? 1e9) - (b.r.unit_number ?? 1e9) || a.i - b.i),
    [rows],
  );
  const errorCount = (rows ?? []).reduce((n, r) => n + (r.errors.length ? 1 : 0), 0);
  const changes = (rows ?? []).filter((r) => !r.errors.length && classifyRow(r, saved) !== 'unchanged');

  const save = async () => {
    if (!rows || errorCount) return;
    if (!changes.length) { toast.message('Everything is already saved. No changes.'); onClose(); return; }
    setSaving(true);
    const { error } = await supabase
      .from('madrasa_units')
      .upsert(toUpsertPayload(classId, changes), { onConflict: 'class_id,unit_number' });
    setSaving(false);
    if (error) { toast.error(`Could not save: ${error.message}`); return; }
    const added = changes.filter((r) => classifyRow(r, saved) === 'new').length;
    toast.success(`${added} added, ${changes.length - added} updated`);
    onSaved();
  };

  const num = (s: string) => (s.trim() === '' ? null : Number(s));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[94vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-5xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Paste a term's units</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {rows === null ? (
            <>
              <p className="mb-2 text-sm text-gray-600">
                One unit per line: <code className="rounded bg-gray-100 px-1">number | topic | short description | book &amp; pages</code>.
                The description and book reference are optional. Pasting again updates units by number, it never duplicates them.
              </p>
              <textarea
                className="h-64 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">Only the topic and a citation are stored. Please don't paste book text.</p>
            </>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-gray-900">{rows.length} line{rows.length === 1 ? '' : 's'}</span>
                {errorCount > 0
                  ? <span className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700">{errorCount} to fix before saving</span>
                  : <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800">Ready to save</span>}
                <button onClick={() => setRows(null)} className="ml-auto min-h-11 rounded-lg px-3 text-emerald-700 hover:bg-emerald-50">← Back to pasted text</button>
              </div>

              <ul className="space-y-3">
                {ordered.map(({ r, i }, pos) => {
                  const change = r.errors.length ? null : classifyRow(r, saved);
                  return (
                    <li key={i} className={`rounded-xl border p-3 ${r.errors.length ? 'border-red-300 bg-red-50/40' : 'border-gray-200'}`}>
                      <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                        {r.line > 0 ? <span>Line {r.line}</span> : <span>Added by hand</span>}
                        {change && <span className={`rounded-full px-2 py-0.5 font-medium ${CHIP[change]}`}>{change === 'new' ? 'New' : change === 'update' ? 'Will update' : 'Unchanged'}</span>}
                        <div className="ml-auto flex gap-1">
                          <button onClick={() => swapWith(i, ordered[pos - 1]?.i ?? -1)} disabled={pos === 0} className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                          <button onClick={() => swapWith(i, ordered[pos + 1]?.i ?? -1)} disabled={pos === ordered.length - 1} className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                          <button onClick={() => setRows((rs) => revalidate((rs ?? []).filter((_, idx) => idx !== i)))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-red-600 hover:bg-red-50" aria-label="Remove row"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-12">
                        <input className={`${cell} md:col-span-1`} inputMode="numeric" aria-label="Unit number" value={r.unit_number ?? ''} onChange={(e) => patch(i, { unit_number: num(e.target.value) })} />
                        <input className={`${cell} col-span-2 md:col-span-4`} aria-label="Topic title" placeholder="Topic" value={r.title} onChange={(e) => patch(i, { title: e.target.value })} />
                        <input className={`${cell} col-span-2 md:col-span-3`} aria-label="Description" placeholder="Description" value={r.description} onChange={(e) => patch(i, { description: e.target.value })} />
                        <input className={`${cell} col-span-2 md:col-span-2`} aria-label="Book reference" placeholder="Book" value={r.book_reference} onChange={(e) => patch(i, { book_reference: e.target.value })} />
                        <input className={`${cell} md:col-span-1`} inputMode="numeric" aria-label="Page from" placeholder="p. from" value={r.page_from ?? ''} onChange={(e) => patch(i, { page_from: num(e.target.value) })} />
                        <input className={`${cell} md:col-span-1`} inputMode="numeric" aria-label="Page to" placeholder="p. to" value={r.page_to ?? ''} onChange={(e) => patch(i, { page_to: num(e.target.value) })} />
                      </div>
                      {r.errors.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 text-sm text-red-700">{r.errors.map((e) => <li key={e}>{e}</li>)}</ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button onClick={addRow} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-emerald-700 hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add a row</button>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
          <button onClick={onClose} className="min-h-11 rounded-lg px-4 text-gray-700 hover:bg-gray-100">Cancel</button>
          {rows === null ? (
            <button onClick={parse} disabled={!text.trim()} className="min-h-11 rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Preview</button>
          ) : (
            <button onClick={save} disabled={saving || errorCount > 0 || rows.length === 0} className="min-h-11 rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Saving…' : changes.length ? `Save ${changes.length} unit${changes.length === 1 ? '' : 's'}` : 'Nothing to change'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
