// Arabic-run detection for rendering. Keep in sync with supabase/functions/_shared/madrasaEmail.ts
// (tests/arabic.spec.ts asserts both agree).
const A = '\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF';
const RUN = new RegExp(`[${A}]+(?:[ \\u00A0]+[${A}]+)*`, 'g');

export interface TextRun { text: string; arabic: boolean }

export function containsArabic(text: string): boolean {
  return new RegExp(`[${A}]`).test(text);
}

/** Split text into alternating non-Arabic / Arabic runs. Words separated by single spaces stay in one run. */
export function splitArabicRuns(text: string): TextRun[] {
  const out: TextRun[] = [];
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i), arabic: false });
    out.push({ text: m[0], arabic: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), arabic: false });
  return out;
}

/** Cells in a markdown pipe table: "| a | b |" -> ["a", "b"]. */
export function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

export type MdBlock = { kind: 'md'; text: string } | { kind: 'table'; header: string[]; rows: string[][] };

/** Separate GFM pipe tables from the rest of the markdown (react-markdown here has no GFM plugin). */
export function splitMarkdownTables(src: string): MdBlock[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MdBlock[] = [];
  let buf: string[] = [];
  const flush = () => { if (buf.length) { blocks.push({ kind: 'md', text: buf.join('\n') }); buf = []; } };

  for (let i = 0; i < lines.length; i++) {
    const isRow = (l?: string) => !!l && l.trim().startsWith('|');
    const isSep = (l?: string) => !!l && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
    if (isRow(lines[i]) && isSep(lines[i + 1])) {
      flush();
      const header = splitTableRow(lines[i]);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isRow(lines[i])) { rows.push(splitTableRow(lines[i])); i++; }
      i--;
      blocks.push({ kind: 'table', header, rows });
    } else {
      buf.push(lines[i]);
    }
  }
  flush();
  return blocks;
}
