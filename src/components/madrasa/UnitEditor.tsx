import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { toUpsertPayload, validateDraft, type SavedUnit, type UnitDraft } from '../../lib/madrasaUnits';

interface Props {
  classId: string;
  /** Existing unit to edit, or null to add a new one. */
  unit: SavedUnit | null;
  /** Suggested number for a new unit. */
  nextNumber: number;
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  'w-full min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200';

export default function UnitEditor({ classId, unit, nextNumber, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState({
    unit_number: String(unit?.unit_number ?? nextNumber),
    title: unit?.title ?? '',
    description: unit?.description ?? '',
    book_reference: unit?.book_reference ?? '',
    page_from: unit?.page_from?.toString() ?? '',
    page_to: unit?.page_to?.toString() ?? '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const save = async () => {
    const num = (s: string) => (s.trim() === '' ? null : Number(s));
    const parsed: UnitDraft = {
      unit_number: num(draft.unit_number),
      title: draft.title,
      description: draft.description,
      book_reference: draft.book_reference,
      page_from: num(draft.page_from),
      page_to: draft.page_to.trim() === '' && draft.page_from.trim() !== '' ? num(draft.page_from) : num(draft.page_to),
    };
    const errs = validateDraft(parsed);
    setErrors(errs);
    if (errs.length) return;

    setSaving(true);
    const [row] = toUpsertPayload(classId, [parsed]);
    const { error } = unit
      ? await supabase.from('madrasa_units').update(row).eq('id', unit.id)
      : await supabase.from('madrasa_units').insert(row);
    setSaving(false);

    if (error) {
      setErrors([
        error.code === '23505'
          ? `Unit ${row.unit_number} already exists in this class. Pick another number, or edit that unit.`
          : error.message,
      ]);
      return;
    }
    toast.success(unit ? 'Unit updated' : 'Unit added');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{unit ? `Edit unit ${unit.unit_number}` : 'Add a unit'}</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <label className="sm:col-span-1">
            <span className="mb-1 block text-sm font-medium text-gray-700">Unit no.</span>
            <input className={inputCls} inputMode="numeric" value={draft.unit_number} onChange={set('unit_number')} />
          </label>
          <label className="sm:col-span-3">
            <span className="mb-1 block text-sm font-medium text-gray-700">Topic title</span>
            <input className={inputCls} value={draft.title} onChange={set('title')} placeholder="e.g. Wudu" autoFocus={!unit} />
          </label>
          <label className="sm:col-span-4">
            <span className="mb-1 block text-sm font-medium text-gray-700">Short description <span className="font-normal text-gray-500">(optional)</span></span>
            <textarea className={inputCls} rows={2} value={draft.description} onChange={set('description')} placeholder="Your own words: what this topic covers" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-gray-700">Book reference <span className="font-normal text-gray-500">(citation only)</span></span>
            <input className={inputCls} value={draft.book_reference} onChange={set('book_reference')} placeholder="Book 3" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-gray-700">Page from</span>
            <input className={inputCls} inputMode="numeric" value={draft.page_from} onChange={set('page_from')} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-gray-700">Page to</span>
            <input className={inputCls} inputMode="numeric" value={draft.page_to} onChange={set('page_to')} />
          </label>
        </div>

        <p className="mt-3 text-xs text-gray-500">Only the topic and a citation are stored. Please don't paste book text here.</p>

        {errors.length > 0 && (
          <ul className="mt-3 list-disc rounded-lg bg-red-50 py-2 pl-8 pr-3 text-sm text-red-700">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="min-h-11 rounded-lg px-4 text-gray-700 hover:bg-gray-100">Cancel</button>
          <button onClick={save} disabled={saving} className="min-h-11 rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Saving…' : unit ? 'Save changes' : 'Add unit'}
          </button>
        </div>
      </div>
    </div>
  );
}
