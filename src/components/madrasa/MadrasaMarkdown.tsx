import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { containsArabic, splitMarkdownTables } from '../../lib/arabicText';
import { ARABIC_FONT, arabize } from './ArabicText';

const components: Components = {
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold text-emerald-700 first:mt-0">{arabize(children)}</h3>,
  p: ({ children }) => <p className="mb-4 text-[15px] leading-7 text-gray-700">{arabize(children)}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-gray-700 marker:text-emerald-500">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-gray-700 marker:font-semibold marker:text-emerald-600">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{arabize(children)}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{arabize(children)}</strong>,
  em: ({ children }) => <em className="italic text-gray-800">{arabize(children)}</em>,
};

const stripMd = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');

/** Vocabulary table: Arabic cells are dir="rtl", lang="ar", right-aligned, in a naskh face. */
function VocabTable({ header, rows }: { header: string[]; rows: string[][] }) {
  // A column that holds Arabic gets a right-aligned header so the header sits over its text.
  const arabicCol = header.map((_, c) => rows.some((r) => containsArabic(r[c] ?? '')));
  return (
    <div className="my-4 overflow-x-auto" data-testid="vocab-table">
      <table className="min-w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {header.map((h, i) => (
              <th key={i} className={`border-b border-gray-200 px-3 py-2 font-semibold text-gray-700 ${arabicCol[i] || containsArabic(h) ? 'text-right' : 'text-left'}`}>{stripMd(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => {
                const text = stripMd(cell);
                return containsArabic(text) ? (
                  <td key={c} dir="rtl" lang="ar" className="border-b border-gray-100 px-3 py-2 text-right align-top text-gray-900" style={{ fontFamily: ARABIC_FONT, fontSize: '1.5rem', lineHeight: 2 }}>{text}</td>
                ) : (
                  <td key={c} className="border-b border-gray-100 px-3 py-2 align-top text-gray-700">{text}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MadrasaMarkdown({ children }: { children: string }) {
  return (
    <div>
      {splitMarkdownTables(children).map((b, i) =>
        b.kind === 'table' ? (
          <VocabTable key={i} header={b.header} rows={b.rows} />
        ) : (
          <ReactMarkdown key={i} components={components}>{b.text}</ReactMarkdown>
        ),
      )}
    </div>
  );
}
