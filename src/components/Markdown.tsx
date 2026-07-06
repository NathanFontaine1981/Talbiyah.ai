import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

/**
 * Shared, beautifully-styled markdown renderer.
 * The project has no @tailwindcss/typography plugin, so each element is styled
 * explicitly here for consistent, readable long-form content.
 */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-8 mb-3 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-200">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-emerald-700 mt-6 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] leading-7 text-gray-700 mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1.5 mb-4 text-[15px] leading-7 text-gray-700 marker:text-emerald-500">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 space-y-1.5 mb-4 text-[15px] leading-7 text-gray-700 marker:text-emerald-600 marker:font-semibold">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-emerald-400 bg-emerald-50/60 rounded-r-lg px-4 py-2 my-4 text-gray-700 italic">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded bg-gray-100 text-emerald-700 text-[13px] font-mono">{children}</code>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-gray-700 border-b border-gray-100 align-top">{children}</td>,
};

export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
