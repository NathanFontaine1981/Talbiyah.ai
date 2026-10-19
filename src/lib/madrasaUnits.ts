// Scheme-of-work helpers for the Madrasa module: a tolerant paste-lines parser and the
// diff against already-saved units. Pure functions only (no imports) so they can be unit-tested
// with `node --test`.
//
// Accepted line shape (everything after the title is optional):
//   3 | Wudu | steps and why | Book 3 pp 12–15
// Book references are citations only; we never store book content.

export interface UnitDraft {
  unit_number: number | null;
  title: string;
  description: string;
  book_reference: string;
  page_from: number | null;
  page_to: number | null;
}

export interface ParsedLine extends UnitDraft {
  /** 1-based line number in the pasted text, for error messages */
  line: number;
  /** Rows can also be added by hand (line = 0). */
  errors: string[];
}

export interface SavedUnit extends Omit<UnitDraft, 'unit_number'> {
  id: string;
  unit_number: number;
}

export const LIMITS = { title: 120, description: 500, bookReference: 120, maxUnit: 999, maxPage: 2000 } as const;

// Dash-likes -> '-', odd spaces -> ' '
function normalise(s: string): string {
  return s
    .replace(/[‐-―−]/g, '-')
    .replace(/[   ]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const PAGE_KEYWORD = String.raw`(?:pp?\.?|pgs?\.?|pages?)`;
// "pp 12-15", "p. 12 – 15", "pages 12 to 15", "pp12-15"
const PAGE_RANGE_KW = new RegExp(String.raw`[,;(]?\s*\b${PAGE_KEYWORD}\s*(\d+)\s*(?:-|to)\s*(\d+)\)?\s*$`, 'i');
// "p. 12", "page 12"
const PAGE_SINGLE_KW = new RegExp(String.raw`[,;(]?\s*\b${PAGE_KEYWORD}\s*(\d+)\)?\s*$`, 'i');
// bare "12-15" at the very end, only accepted when it stands alone or follows a comma/space
const PAGE_RANGE_BARE = /(?:^|[,;]\s*|\s)(\d+)\s*(?:-|to)\s*(\d+)\s*$/i;

/** Split "Book 3 pp 12–15" into the citation text and a page range. */
export function parseReference(raw: string): Pick<UnitDraft, 'book_reference' | 'page_from' | 'page_to'> {
  const s = normalise(raw);
  if (!s) return { book_reference: '', page_from: null, page_to: null };

  let m = s.match(PAGE_RANGE_KW);
  if (m && m.index !== undefined) {
    return { book_reference: cleanRef(s.slice(0, m.index)), page_from: Number(m[1]), page_to: Number(m[2]) };
  }
  m = s.match(PAGE_SINGLE_KW);
  if (m && m.index !== undefined) {
    const n = Number(m[1]);
    return { book_reference: cleanRef(s.slice(0, m.index)), page_from: n, page_to: n };
  }
  // Bare range, but not "Book 3-4" style (a hyphenated number right after a word like "Book"/"Level"/"Part").
  m = s.match(PAGE_RANGE_BARE);
  if (m && m.index !== undefined) {
    const before = s.slice(0, m.index).trim();
    const hyphenatedLabel = /\b(book|level|part|volume|vol|unit|grade|year)\s*$/i.test(before);
    if (!hyphenatedLabel || before === '') {
      return { book_reference: cleanRef(before), page_from: Number(m[1]), page_to: Number(m[2]) };
    }
  }
  return { book_reference: cleanRef(s), page_from: null, page_to: null };
}

function cleanRef(s: string): string {
  return s.replace(/[,;(\s]+$/g, '').trim();
}

function looksLikeReference(s: string): boolean {
  const t = normalise(s);
  if (!t) return false;
  return (
    /^\s*(book|bk|vol|volume|part|level|safar|ch|chapter)\b/i.test(t) ||
    new RegExp(String.raw`\b${PAGE_KEYWORD}\s*\d`, 'i').test(t)
  );
}

function parseUnitNumber(raw: string): number | null {
  const m = normalise(raw).match(/^(?:unit|u|no\.?|number|#)?\s*(\d{1,4})\s*[.):]?$/i);
  return m ? Number(m[1]) : null;
}

function isHeaderLine(fields: string[]): boolean {
  return /^(unit|no\.?|number|#|week|lesson)\s*(no\.?|number)?$/i.test(normalise(fields[0] ?? ''))
    && /^(topic|title|unit|name)/i.test(normalise(fields[1] ?? ''));
}

export function validateDraft(d: UnitDraft): string[] {
  const errors: string[] = [];
  if (d.unit_number === null || !Number.isInteger(d.unit_number)) errors.push('Unit number is missing or not a whole number');
  else if (d.unit_number < 1 || d.unit_number > LIMITS.maxUnit) errors.push(`Unit number must be between 1 and ${LIMITS.maxUnit}`);
  if (!d.title.trim()) errors.push('Topic title is required');
  else if (d.title.trim().length > LIMITS.title) errors.push(`Title is longer than ${LIMITS.title} characters`);
  if (d.description.length > LIMITS.description) errors.push(`Description is longer than ${LIMITS.description} characters`);
  if (d.book_reference.length > LIMITS.bookReference) errors.push(`Book reference is longer than ${LIMITS.bookReference} characters`);
  for (const [label, p] of [['Start page', d.page_from], ['End page', d.page_to]] as const) {
    if (p !== null && (!Number.isInteger(p) || p < 1 || p > LIMITS.maxPage)) errors.push(`${label} must be between 1 and ${LIMITS.maxPage}`);
  }
  if (d.page_from === null && d.page_to !== null) errors.push('End page given without a start page');
  if (d.page_from !== null && d.page_to !== null && d.page_to < d.page_from) errors.push('End page is before the start page');
  return errors;
}

/** Flag unit numbers used more than once (in the pasted rows or the edited preview). */
export function markDuplicates<T extends { unit_number: number | null; errors: string[] }>(rows: T[]): T[] {
  const seen = new Map<number, number>();
  rows.forEach((r) => { if (r.unit_number !== null) seen.set(r.unit_number, (seen.get(r.unit_number) ?? 0) + 1); });
  return rows.map((r) => {
    const base = r.errors.filter((e) => !e.startsWith('Unit number ') || !e.endsWith('used more than once'));
    return r.unit_number !== null && (seen.get(r.unit_number) ?? 0) > 1
      ? { ...r, errors: [...base, `Unit number ${r.unit_number} is used more than once`] }
      : { ...r, errors: base };
  });
}

/** Re-run validation on an edited row (keeps duplicate detection separate, see markDuplicates). */
export function revalidate<T extends UnitDraft & { errors: string[] }>(rows: T[]): T[] {
  return markDuplicates(rows.map((r) => ({ ...r, errors: validateDraft(r) })));
}

export function parseUnitLines(text: string): ParsedLine[] {
  const rows: ParsedLine[] = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let headerChecked = false;

  lines.forEach((rawLine, idx) => {
    // Don't normalise the whole line first: that would flatten the tabs we may need to split on.
    const line = rawLine.trim();
    if (!line || line.startsWith('#') && !/^#\s*\d/.test(line)) return; // blank / comment

    // Pipes preferred; tabs (spreadsheet paste) as a fallback.
    const fields = (line.includes('|') ? line.split('|') : line.split('\t')).map((f) => normalise(f));

    if (!headerChecked) {
      headerChecked = true;
      if (isHeaderLine(fields)) return;
    }

    let [numRaw = '', title = '', third = '', ...rest] = fields;
    let description = third;
    let refRaw = rest.join(' | ');

    // "3 | Wudu | Book 3 pp 12-15": three fields where the last one is a citation, not a description.
    if (rest.length === 0 && fields.length === 3 && looksLikeReference(third)) {
      description = '';
      refRaw = third;
    }

    const draft: UnitDraft = {
      unit_number: parseUnitNumber(numRaw),
      title: title.replace(/\s+/g, ' '),
      description,
      ...parseReference(refRaw),
    };

    const errors = validateDraft(draft);
    if (fields.length < 2) errors.unshift('Expected "number | title | description | book & pages"');
    rows.push({ ...draft, line: idx + 1, errors });
  });

  return markDuplicates(rows);
}

// ---------------------------------------------------------------------------
// Diff against saved units (save = upsert by unit number, so re-pasting updates, never duplicates)
// ---------------------------------------------------------------------------
export type RowChange = 'new' | 'update' | 'unchanged';

export function classifyRow(row: UnitDraft, saved: SavedUnit[]): RowChange {
  const existing = saved.find((u) => u.unit_number === row.unit_number);
  if (!existing) return 'new';
  const same =
    existing.title === row.title.trim() &&
    (existing.description ?? '') === row.description.trim() &&
    (existing.book_reference ?? '') === row.book_reference.trim() &&
    (existing.page_from ?? null) === row.page_from &&
    (existing.page_to ?? null) === row.page_to;
  return same ? 'unchanged' : 'update';
}

/** Payload for supabase upsert(..., { onConflict: 'class_id,unit_number' }). */
export function toUpsertPayload(classId: string, rows: UnitDraft[]) {
  return rows.map((r) => ({
    class_id: classId,
    unit_number: r.unit_number as number,
    title: r.title.trim(),
    description: r.description.trim() || null,
    book_reference: r.book_reference.trim() || null,
    page_from: r.page_from,
    page_to: r.page_to,
  }));
}

/** Format a stored citation for display: "Book 3, pp. 12–15". */
export function formatCitation(u: { book_reference: string | null; page_from: number | null; page_to: number | null }): string {
  const pages =
    u.page_from === null ? '' : u.page_to === null || u.page_to === u.page_from ? `p. ${u.page_from}` : `pp. ${u.page_from}–${u.page_to}`;
  return [u.book_reference, pages].filter(Boolean).join(', ');
}
