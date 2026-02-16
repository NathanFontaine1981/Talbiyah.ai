import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Printer,
  Star,
  Loader,
  Calendar,
  User,
  ArrowLeft,
  Lightbulb,
  BookMarked,
  MessageCircle,
  Target,
  HelpCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Languages,
  ScrollText,
  GraduationCap,
  RotateCcw,
  Check,
  Circle,
  Lock,
  Loader2,
  Play,
  Download,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { useCourseNotesAccess } from '../../hooks/useCourseNotesAccess';
import { COURSE_NOTES_PRICING } from '../../constants/courseNotesPricing';

// ─── Types ──────────────────────────────────────────────
interface InsightData {
  id: string;
  title: string | null;
  summary: string | null;
  insights_content: string;
  processing_time_ms: number | null;
  created_at: string;
  course_sessions: {
    session_number: number;
    title: string | null;
    session_date: string | null;
  };
  group_sessions: {
    name: string;
    slug: string;
    teacher: { full_name: string } | null;
  };
}

interface Section {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
}

// ─── Section config ─────────────────────────────────────
const SECTION_CONFIG: Record<string, Omit<Section, 'id' | 'title' | 'content'>> = {
  'Session Overview': { icon: <BookOpen className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', gradientFrom: 'from-blue-500', gradientTo: 'to-blue-600' },
  'Key Themes Covered': { icon: <Lightbulb className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', gradientFrom: 'from-amber-500', gradientTo: 'to-orange-500' },
  'Qur\'anic Verses Referenced': { icon: <BookMarked className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-200 dark:border-emerald-800', gradientFrom: 'from-emerald-500', gradientTo: 'to-teal-500' },
  'Key Arabic Vocabulary': { icon: <Languages className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800', gradientFrom: 'from-purple-500', gradientTo: 'to-violet-500' },
  'Hadith References': { icon: <ScrollText className="w-5 h-5" />, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-900/20', borderColor: 'border-teal-200 dark:border-teal-800', gradientFrom: 'from-teal-500', gradientTo: 'to-cyan-500' },
  'Stories & Examples': { icon: <MessageCircle className="w-5 h-5" />, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-900/20', borderColor: 'border-rose-200 dark:border-rose-800', gradientFrom: 'from-rose-500', gradientTo: 'to-pink-500' },
  'Connection to Previous Sessions': { icon: <ChevronRight className="w-5 h-5" />, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', borderColor: 'border-indigo-200 dark:border-indigo-800', gradientFrom: 'from-indigo-500', gradientTo: 'to-blue-500' },
  'Reflections & Action Points': { icon: <Target className="w-5 h-5" />, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800', gradientFrom: 'from-orange-500', gradientTo: 'to-red-500' },
  'Mini Quiz': { icon: <HelpCircle className="w-5 h-5" />, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-900/20', borderColor: 'border-pink-200 dark:border-pink-800', gradientFrom: 'from-pink-500', gradientTo: 'to-rose-500' },
  'Key Takeaways': { icon: <Sparkles className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-200 dark:border-emerald-800', gradientFrom: 'from-emerald-500', gradientTo: 'to-green-500' },
  'Preparation for Next Session': { icon: <GraduationCap className="w-5 h-5" />, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-900/20', borderColor: 'border-sky-200 dark:border-sky-800', gradientFrom: 'from-sky-500', gradientTo: 'to-blue-500' },
};

const DEFAULT_CONFIG: Omit<Section, 'id' | 'title' | 'content'> = { icon: <BookOpen className="w-5 h-5" />, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800', borderColor: 'border-gray-200 dark:border-gray-700', gradientFrom: 'from-gray-500', gradientTo: 'to-gray-600' };

function parseSections(content: string): Section[] {
  // Normalise: strip leading ## so every part is just "Title\ncontent"
  const normalised = content.replace(/^## /, '');
  const parts = normalised.split(/\n## /);
  const sections: Section[] = [];
  for (const part of parts) {
    const lineBreak = part.indexOf('\n');
    const title = (lineBreak > -1 ? part.substring(0, lineBreak) : part).replace(/^#+\s*/, '').trim();
    const body = lineBreak > -1 ? part.substring(lineBreak + 1).trim() : '';
    if (!title) continue;
    const config = SECTION_CONFIG[title] || DEFAULT_CONFIG;
    sections.push({ id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title, content: body, ...config });
  }
  return sections;
}

// ─── Key Themes: Expandable cards ───────────────────────
function ThemesSection({ content }: { content: string }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const themes = useMemo(() => {
    const cleaned = content.replace(/^### /, '');
    const blocks = cleaned.split(/\n### /).filter(b => b.trim());
    return blocks.map(block => {
      const nl = block.indexOf('\n');
      return { title: (nl > -1 ? block.substring(0, nl) : block).replace(/^#+\s*/, '').trim(), body: nl > -1 ? block.substring(nl + 1).trim() : '' };
    });
  }, [content]);

  return (
    <div className="space-y-3">
      {themes.map((theme, idx) => (
        <div key={idx} className="rounded-xl border border-amber-100 dark:border-amber-900/40 overflow-hidden bg-white dark:bg-gray-800">
          <button
            onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {idx + 1}
            </div>
            <span className="font-semibold text-gray-900 dark:text-white flex-1">{theme.title}</span>
            {expanded.has(idx) ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
          </button>
          {expanded.has(idx) && (
            <div className="px-4 pb-4 pl-[60px]">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-600 prose-p:dark:text-gray-400 prose-p:leading-relaxed">
                <ReactMarkdown>{theme.body}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Qur'anic Verses: Beautiful verse cards ─────────────
function VersesSection({ content }: { content: string }) {
  const verses = useMemo(() => {
    const cleaned = content.replace(/^> \*\*/, '');
    const blocks = cleaned.split(/\n> \*\*/).filter(b => b.trim());
    const result: { reference: string; arabic: string; translation: string; context: string }[] = [];
    for (const block of blocks) {
      const fullBlock = block.startsWith('**') ? block : '**' + block;
      const refMatch = fullBlock.match(/\*\*(.+?)\*\*/);
      const arabicMatch = fullBlock.match(/>\s*\n>\s*(.+?)(?:\n|$)/);
      const transMatch = fullBlock.match(/\*(.+?)\*/);
      const contextMatch = fullBlock.match(/\*\*Context from the teacher:\*\*\s*(.+)/);

      // Better parsing - look for Arabic text (contains Arabic Unicode range)
      const lines = fullBlock.split('\n');
      let arabic = '';
      let translation = '';
      for (const line of lines) {
        const cleaned = line.replace(/^>\s*/, '').trim();
        if (/[\u0600-\u06FF]/.test(cleaned) && !cleaned.startsWith('*')) {
          arabic = cleaned;
        }
        if (cleaned.startsWith('*') && cleaned.endsWith('*') && !cleaned.startsWith('**')) {
          translation = cleaned.replace(/^\*|\*$/g, '');
        }
      }

      if (refMatch) {
        result.push({
          reference: refMatch[1].replace(/\*\*/g, '').trim(),
          arabic: arabic || '',
          translation: translation || '',
          context: contextMatch?.[1]?.trim() || '',
        });
      }
    }
    return result;
  }, [content]);

  if (verses.length === 0) {
    return <div className="prose prose-emerald dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;
  }

  return (
    <div className="space-y-4">
      {verses.map((verse, idx) => (
        <div key={idx} className="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50">
          {/* Reference badge */}
          <div className="px-5 pt-4">
            <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
              {verse.reference}
            </span>
          </div>
          {/* Arabic */}
          {verse.arabic && (
            <div className="px-5 py-5 text-center" dir="rtl">
              <p className="text-2xl sm:text-3xl leading-[2.2] text-emerald-900 dark:text-emerald-100" style={{ fontFamily: "'Noto Naskh Arabic', 'Amiri', serif" }}>
                {verse.arabic}
              </p>
            </div>
          )}
          {/* Translation */}
          {verse.translation && (
            <div className="px-5 pb-3">
              <p className="text-gray-600 dark:text-gray-400 italic text-center leading-relaxed">{verse.translation}</p>
            </div>
          )}
          {/* Teacher context */}
          {verse.context && (
            <div className="mx-5 mb-4 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
              <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold text-emerald-700 dark:text-emerald-400">Teacher's note: </span>{verse.context}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Vocabulary: Flip flashcards ────────────────────────
function VocabSection({ content }: { content: string }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const words = useMemo(() => {
    const lines = content.split('\n').filter(l => l.includes('|') && !l.includes('---') && !l.toLowerCase().includes('arabic'));
    return lines.map(line => {
      const cells = line.split('|').map(c => c.trim().replace(/\*\*/g, '').replace(/\*/g, '')).filter(c => c);
      if (cells.length >= 4) {
        return { arabic: cells[0], transliteration: cells[1], root: cells[2], meaning: cells[3], explanation: cells[4] || '' };
      }
      return null;
    }).filter(Boolean) as { arabic: string; transliteration: string; root: string; meaning: string; explanation: string }[];
  }, [content]);

  if (words.length === 0) {
    return <div className="prose prose-emerald dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;
  }

  return (
    <div>
      <p className="text-sm text-purple-600 dark:text-purple-400 mb-4 font-medium">Tap a card to reveal the meaning</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {words.map((word, idx) => {
          const isFlipped = flipped.has(idx);
          return (
            <button
              key={idx}
              onClick={() => setFlipped(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}
              className="text-left w-full"
            >
              <div className={`relative rounded-2xl p-5 min-h-[140px] transition-all duration-300 ${
                isFlipped
                  ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/40'
                  : 'bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
              }`}>
                {!isFlipped ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-3xl mb-2 text-purple-900 dark:text-purple-100" style={{ fontFamily: "'Noto Naskh Arabic', serif" }} dir="rtl">{word.arabic}</p>
                    <p className="text-sm text-purple-500 dark:text-purple-400 italic">{word.transliteration}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Tap to reveal</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xl" style={{ fontFamily: "'Noto Naskh Arabic', serif" }} dir="rtl">{word.arabic}</p>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{word.root}</span>
                    </div>
                    <p className="text-sm font-medium opacity-90 mb-1">{word.transliteration} — {word.meaning}</p>
                    {word.explanation && (
                      <p className="text-sm opacity-80 leading-relaxed mt-2 border-t border-white/20 pt-2">{word.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-center mt-4">
        <button
          onClick={() => setFlipped(prev => prev.size === words.length ? new Set() : new Set(words.map((_, i) => i)))}
          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1.5 mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {flipped.size === words.length ? 'Hide all' : 'Reveal all'}
        </button>
      </div>
    </div>
  );
}

// ─── Hadith: Quote cards ────────────────────────────────
function HadithSection({ content }: { content: string }) {
  const hadiths = useMemo(() => {
    const cleaned = content.replace(/^> \*\*Hadith:\*\*/, '');
    const blocks = cleaned.split(/\n> \*\*Hadith:\*\*/).filter(b => b.trim());
    return blocks.map(block => {
      const textMatch = block.match(/^\s*(.+?)(?:\n|$)/);
      const sourceMatch = block.match(/\*\*Source:\*\*\s*(.+?)(?:\n|$)/);
      const contextMatch = block.match(/\*\*Context:\*\*\s*(.+?)(?:\n|$)/);
      return {
        text: textMatch?.[1]?.replace(/^>\s*/, '').replace(/"/g, '').trim() || '',
        source: sourceMatch?.[1]?.trim() || '',
        context: contextMatch?.[1]?.trim() || '',
      };
    }).filter(h => h.text);
  }, [content]);

  if (hadiths.length === 0) {
    return <div className="prose prose-emerald dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;
  }

  return (
    <div className="space-y-4">
      {hadiths.map((hadith, idx) => (
        <div key={idx} className="relative rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-100 dark:border-teal-800/50 p-6">
          {/* Decorative quote marks */}
          <div className="absolute top-4 left-4 text-5xl text-teal-200 dark:text-teal-800 font-serif leading-none select-none">"</div>
          <div className="ml-8">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed italic text-base">{hadith.text}</p>
            {hadith.source && (
              <div className="mt-3">
                <span className="inline-block px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full">{hadith.source}</span>
              </div>
            )}
            {hadith.context && (
              <p className="mt-3 text-sm text-teal-700 dark:text-teal-400 border-t border-teal-100 dark:border-teal-800 pt-3">{hadith.context}</p>
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-400 dark:text-gray-500 italic">Note: Please verify exact hadith references independently.</p>
    </div>
  );
}

// ─── Stories: Story cards ───────────────────────────────
function StoriesSection({ content }: { content: string }) {
  const stories = useMemo(() => {
    const cleaned = content.replace(/^### /, '');
    const blocks = cleaned.split(/\n### /).filter(b => b.trim());
    return blocks.map(block => {
      const nl = block.indexOf('\n');
      return { title: (nl > -1 ? block.substring(0, nl) : block).replace(/^#+\s*/, '').trim(), body: nl > -1 ? block.substring(nl + 1).trim() : '' };
    });
  }, [content]);

  const storyEmojis = ['🌱', '⚖️', '🌟', '🕊️', '💎', '🔑'];

  return (
    <div className="space-y-4">
      {stories.map((story, idx) => (
        <div key={idx} className="rounded-2xl bg-white dark:bg-gray-800 border border-rose-100 dark:border-rose-900/40 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-xl flex-shrink-0">
              {storyEmojis[idx % storyEmojis.length]}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">{story.title}</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-600 prose-p:dark:text-gray-400 prose-p:leading-relaxed">
                <ReactMarkdown>{story.body}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Action Points: Interactive checklist ───────────────
function ActionPointsSection({ content }: { content: string }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const items = useMemo(() => {
    const lines = content.split('\n').filter(l => /^\d+\.\s*\*\*/.test(l.trim()));
    return lines.map(line => {
      const match = line.match(/^\d+\.\s*\*\*(.+?)\*\*:?\s*(.+)?/);
      return { title: match?.[1]?.trim() || line.trim(), description: match?.[2]?.trim() || '' };
    });
  }, [content]);

  if (items.length === 0) {
    return <div className="prose prose-emerald dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-3">Tick off as you implement each point this week</p>
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => setChecked(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })}
          className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
            checked.has(idx)
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
            checked.has(idx) ? 'bg-emerald-500 text-white' : 'border-2 border-gray-300 dark:border-gray-600'
          }`}>
            {checked.has(idx) && <Check className="w-3.5 h-3.5" />}
          </div>
          <div>
            <p className={`font-semibold text-sm ${checked.has(idx) ? 'text-emerald-800 dark:text-emerald-300 line-through' : 'text-gray-900 dark:text-white'}`}>
              {item.title}
            </p>
            {item.description && (
              <p className={`text-sm mt-0.5 ${checked.has(idx) ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.description}
              </p>
            )}
          </div>
        </button>
      ))}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-400 dark:text-gray-500">{checked.size}/{items.length} completed</p>
      </div>
    </div>
  );
}

// ─── Key Takeaways: Highlight pills ─────────────────────
function TakeawaysSection({ content }: { content: string }) {
  const items = useMemo(() => {
    return content.split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.replace(/^-\s*/, '').trim());
  }, [content]);

  if (items.length === 0) {
    return <div className="prose prose-emerald dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/15 dark:to-transparent">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {idx + 1}
          </div>
          <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pt-1 prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{item}</ReactMarkdown></div>
        </div>
      ))}
    </div>
  );
}

// ─── Preparation: Task card ─────────────────────────────
function PrepSection({ content }: { content: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800/50 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-p:leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz: Interactive ──────────────────────────────────
function QuizComplete({ score, total, onComplete }: { score: number; total: number; onComplete?: (scorePercent: number) => void }) {
  const [fired, setFired] = useState(false);
  useEffect(() => {
    if (!fired && onComplete) {
      setFired(true);
      onComplete(Math.round((score / total) * 100));
    }
  }, [fired, onComplete, score, total]);

  return (
    <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
      <p className="text-2xl mb-2">{score === total ? '🎉' : score >= total / 2 ? '👏' : '💪'}</p>
      <p className="font-bold text-gray-900 dark:text-white">
        {score === total ? 'Perfect score!' : score >= total / 2 ? 'Well done!' : 'Keep revising!'}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{score} out of {total} correct</p>
    </div>
  );
}

function QuizSection({ content, onComplete }: { content: string; onComplete?: (scorePercent: number) => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const questions = useMemo(() => {
    const qs: { question: string; options: { letter: string; text: string }[]; answer: string; explanation: string }[] = [];
    const blocks = content.split(/\*\*Q\d+\.\*\*/);
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i].trim();
      const lines = block.split('\n').filter(l => l.trim());
      const questionText = lines[0]?.trim() || '';
      const options: { letter: string; text: string }[] = [];
      let answer = '';
      let explanation = '';
      for (const line of lines.slice(1)) {
        const optMatch = line.match(/^-\s*([A-D])\)\s*(.+)/);
        if (optMatch) { options.push({ letter: optMatch[1], text: optMatch[2].trim() }); continue; }
        const ansMatch = line.match(/\*\*Answer:\*\*\s*([A-D])\)\s*(.*)/);
        if (ansMatch) { answer = ansMatch[1]; explanation = ansMatch[2]?.trim() || ''; }
      }
      if (questionText && options.length > 0) qs.push({ question: questionText, options, answer, explanation });
    }
    return qs;
  }, [content]);

  const score = useMemo(() => {
    let correct = 0;
    revealed.forEach(idx => { if (selectedAnswers[idx] === questions[idx]?.answer) correct++; });
    return correct;
  }, [revealed, selectedAnswers, questions]);

  if (questions.length === 0) return <div className="prose prose-emerald dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;

  return (
    <div className="space-y-5">
      {/* Score bar */}
      {revealed.size > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-pink-700 dark:text-pink-400">Score: {score}/{revealed.size}</span>
          <div className="flex gap-1.5">
            {questions.map((_, idx) => (
              <div key={idx} className={`w-3 h-3 rounded-full ${
                !revealed.has(idx) ? 'bg-gray-200 dark:bg-gray-700'
                : selectedAnswers[idx] === questions[idx].answer ? 'bg-emerald-400' : 'bg-red-400'
              }`} />
            ))}
          </div>
        </div>
      )}

      {questions.map((q, idx) => {
        const isRevealed = revealed.has(idx);
        const selected = selectedAnswers[idx];
        const isCorrect = selected === q.answer;

        return (
          <div key={idx} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="p-5">
              <p className="font-semibold text-gray-900 dark:text-white mb-4">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white text-xs font-bold mr-2">{idx + 1}</span>
                {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isSelected = selected === opt.letter;
                  const isAnswer = opt.letter === q.answer;
                  let style = 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 cursor-pointer';
                  if (isRevealed) {
                    if (isAnswer) style = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-700';
                    else if (isSelected) style = 'border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-700';
                    else style = 'border-gray-200 dark:border-gray-700 opacity-50';
                  } else if (isSelected) style = 'border-pink-400 bg-pink-50 dark:bg-pink-900/30 dark:border-pink-700 shadow-sm';

                  return (
                    <button key={opt.letter} onClick={() => { if (!isRevealed) setSelectedAnswers(prev => ({ ...prev, [idx]: opt.letter })); }} disabled={isRevealed}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 ${style} transition-all flex items-center gap-3`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isRevealed && isAnswer ? 'bg-emerald-500 text-white' : isRevealed && isSelected ? 'bg-red-500 text-white'
                        : isSelected ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {isRevealed && isAnswer ? <CheckCircle className="w-4 h-4" /> : isRevealed && isSelected ? <XCircle className="w-4 h-4" /> : opt.letter}
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 text-sm">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
              {selected && !isRevealed && (
                <button onClick={() => setRevealed(prev => new Set(prev).add(idx))}
                  className="mt-4 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow">
                  Check Answer
                </button>
              )}
              {isRevealed && q.explanation && (
                <div className={`mt-4 p-4 rounded-xl text-sm ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'}`}>
                  <span className="font-bold">{isCorrect ? 'Correct! ✓ ' : 'Not quite ✗ '}</span>{q.explanation}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {revealed.size === questions.length && (
        <QuizComplete score={score} total={questions.length} onComplete={onComplete} />
      )}
    </div>
  );
}

// ─── Section renderer ───────────────────────────────────
function SectionContent({ section, onQuizComplete }: { section: Section; onQuizComplete?: (scorePercent: number) => void }) {
  switch (section.title) {
    case 'Key Themes Covered': return <ThemesSection content={section.content} />;
    case 'Qur\'anic Verses Referenced': return <VersesSection content={section.content} />;
    case 'Key Arabic Vocabulary': return <VocabSection content={section.content} />;
    case 'Hadith References': return <HadithSection content={section.content} />;
    case 'Stories & Examples': return <StoriesSection content={section.content} />;
    case 'Reflections & Action Points': return <ActionPointsSection content={section.content} />;
    case 'Mini Quiz': return <QuizSection content={section.content} onComplete={onQuizComplete} />;
    case 'Key Takeaways': return <TakeawaysSection content={section.content} />;
    case 'Preparation for Next Session': return <PrepSection content={section.content} />;
    default: return (
      <div className="prose prose-emerald dark:prose-invert max-w-none prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-p:leading-relaxed">
        <ReactMarkdown>{section.content}</ReactMarkdown>
      </div>
    );
  }
}

// ─── Main page ──────────────────────────────────────────
export default function CourseSessionInsights() {
  const { slug, sessionNumber } = useParams<{ slug: string; sessionNumber: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [courseSessionId, setCourseSessionId] = useState<string | null>(null);
  const [groupSessionId, setGroupSessionId] = useState<string | null>(null);
  const [purchasingNotes, setPurchasingNotes] = useState(false);
  const [coursePosterUrl, setCoursePosterUrl] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingExpiresAt, setRecordingExpiresAt] = useState<string | null>(null);
  const [recordingAssetId, setRecordingAssetId] = useState<string | null>(null);
  const [refreshingRecording, setRefreshingRecording] = useState(false);

  const { hasAccess: hasNotesAccess, loading: notesAccessLoading, notesPricePounds, isTeacherOrAdmin } = useCourseNotesAccess(groupSessionId);
  const currentSessionNum = parseInt(sessionNumber || '1', 10);
  const canViewNotes = currentSessionNum === 1 || hasNotesAccess || isTeacherOrAdmin;

  useEffect(() => { fetchInsight(); }, [slug, sessionNumber]);

  // Handle return from Stripe with notes_unlocked=true
  useEffect(() => {
    if (searchParams.get('notes_unlocked') === 'true') {
      toast.success('Study notes unlocked! You now have access to all session notes.');
    }
  }, [searchParams]);

  async function fetchInsight() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please sign up and enrol to view study notes'); navigate(`/signup?redirect=/course/${slug}/session/${sessionNumber}`); return; }

      const num = parseInt(sessionNumber || '1', 10);
      const { data: course } = await supabase.from('group_sessions').select('id, name, slug, teacher_id, created_by, poster_url').eq('slug', slug).single();
      if (!course) { toast.error('Course not found'); navigate('/'); return; }
      setGroupSessionId(course.id);
      setCoursePosterUrl(course.poster_url);

      const isTeacherOrAdmin = user.id === course.teacher_id || user.id === course.created_by;
      if (!isTeacherOrAdmin) {
        const { data: enrollment } = await supabase.from('group_session_participants').select('id').eq('group_session_id', course.id).eq('student_id', user.id).limit(1);
        if (!enrollment || enrollment.length === 0) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role !== 'admin') { toast.error('Please enrol in this course to view study notes'); navigate(`/course/${slug}`); return; }
        }
      }

      const { data: session } = await supabase.from('course_sessions').select('id, session_number, recording_url, recording_expires_at, recording_asset_id').eq('group_session_id', course.id).eq('session_number', num).single();
      if (!session) { toast.error('Session not found'); navigate(`/course/${slug}`); return; }
      setCourseSessionId(session.id);
      setRecordingUrl(session.recording_url || null);
      setRecordingExpiresAt(session.recording_expires_at || null);
      setRecordingAssetId(session.recording_asset_id || null);

      const { data: insightData, error } = await supabase.from('course_insights')
        .select(`id, title, summary, insights_content, processing_time_ms, created_at, course_sessions!inner (session_number, title, session_date), group_sessions!inner (name, slug, teacher:profiles!group_sessions_teacher_id_fkey (full_name))`)
        .eq('course_session_id', session.id).single();

      if (error || !insightData) { toast.error('Study notes not yet available'); navigate(`/course/${slug}`); return; }
      setInsight(insightData as unknown as InsightData);

      // Track view progress
      await supabase.from('course_student_progress').upsert(
        { course_session_id: session.id, student_id: user.id, viewed_at: new Date().toISOString() },
        { onConflict: 'course_session_id,student_id', ignoreDuplicates: false }
      );

      const { count } = await supabase.from('course_sessions').select('id', { count: 'exact', head: true }).eq('group_session_id', course.id);
      setTotalSessions(count || 0);
    } catch (err) { console.error('Error loading insights:', err); } finally { setLoading(false); }
  }

  const sections = useMemo(() => insight ? parseSections(insight.insights_content) : [], [insight]);
  const toggleSection = (id: string) => setCollapsedSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  async function handleQuizComplete(scorePercent: number) {
    if (!courseSessionId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('course_student_progress').upsert(
        { course_session_id: courseSessionId, student_id: user.id, quiz_score: scorePercent, quiz_completed_at: new Date().toISOString() },
        { onConflict: 'course_session_id,student_id', ignoreDuplicates: false }
      );
    } catch (err) { console.error('Failed to save quiz progress:', err); }
  }

  async function handlePurchaseNotes() {
    if (!groupSessionId) return;
    setPurchasingNotes(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) { toast.error('Please sign in to purchase study notes'); return; }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/course-notes-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            group_session_id: groupSessionId,
            success_url: `${window.location.origin}/course/${slug}/session/${sessionNumber}?notes_unlocked=true`,
            cancel_url: `${window.location.origin}/course/${slug}/session/${sessionNumber}`,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout');

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      console.error('Error purchasing notes:', err);
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setPurchasingNotes(false);
    }
  }

  const isRecordingExpired = recordingExpiresAt ? new Date(recordingExpiresAt) < new Date() : false;
  const recordingExpiresInDays = recordingExpiresAt
    ? Math.max(0, Math.ceil((new Date(recordingExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  async function handleRefreshRecordingUrl() {
    if (!recordingAssetId || !courseSessionId) return;
    setRefreshingRecording(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recording-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            recording_asset_id: recordingAssetId,
            course_session_id: courseSessionId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.recording_url) {
          setRecordingUrl(data.recording_url);
          setRecordingExpiresAt(data.expires_at || null);
          toast.success('Recording URL refreshed!');
        }
      } else {
        toast.error('Could not refresh recording URL');
      }
    } catch (err) {
      console.error('Error refreshing recording URL:', err);
      toast.error('Failed to refresh recording');
    } finally {
      setRefreshingRecording(false);
    }
  }

  const currentSession = parseInt(sessionNumber || '1', 10);
  const hasPrev = currentSession > 1;
  const hasNext = currentSession < totalSessions;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center"><Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" /><p className="text-gray-500 dark:text-gray-400">Loading study notes...</p></div>
    </div>
  );

  if (!insight) return null;
  const session = insight.course_sessions;
  const course = insight.group_sessions;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 print:hidden shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate(`/course/${slug}`)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">{session.title || insight.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{course.name} · Session {session.session_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/dashboard" className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors">Dashboard</Link>
            <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><Printer className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-6 sm:p-8 text-white mb-6 shadow-xl shadow-emerald-900/20">
          <div className="flex items-center gap-2 text-emerald-200 text-sm mb-3">
            <BookOpen className="w-4 h-4" />
            <span>{course.name}</span>
            <span className="mx-1">·</span>
            <span>Session {session.session_number}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{session.title || insight.title}</h2>
          {insight.summary && <p className="text-emerald-100 leading-relaxed">{insight.summary}</p>}
          <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-emerald-200">
            {course.teacher && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {course.teacher.full_name}</span>}
            {session.session_date && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(session.session_date)}</span>}
          </div>
        </div>

        {/* Session Recording Player */}
        {recordingUrl && canViewNotes && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm mb-6">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Session Recording</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {recordingExpiresInDays !== null && recordingExpiresInDays > 0
                        ? `Available for ${recordingExpiresInDays} more day${recordingExpiresInDays !== 1 ? 's' : ''}`
                        : isRecordingExpired ? 'Recording link expired' : 'Watch the full session'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isRecordingExpired && (
                    <a
                      href={recordingUrl}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  )}
                </div>
              </div>

              {/* Expiry warning */}
              {recordingExpiresInDays !== null && recordingExpiresInDays <= 2 && recordingExpiresInDays > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4 text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>This recording expires in {recordingExpiresInDays} day{recordingExpiresInDays !== 1 ? 's' : ''}. Download it now to keep a copy.</p>
                </div>
              )}

              {isRecordingExpired ? (
                <div className="text-center py-6">
                  <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-3">The recording link has expired.</p>
                  {recordingAssetId && (
                    <button
                      onClick={handleRefreshRecordingUrl}
                      disabled={refreshingRecording}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {refreshingRecording ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Refreshing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Get Fresh Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <video
                  src={recordingUrl}
                  controls
                  className="w-full rounded-xl bg-black"
                  preload="metadata"
                  controlsList="nodownload"
                />
              )}
            </div>
          </div>
        )}

        {/* Table of Contents */}
        {sections.length > 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">In this session</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${s.color}`}>
                  {s.icon}
                  <span className="text-gray-700 dark:text-gray-300">{s.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {canViewNotes ? (
          <>
            {/* Sections */}
            <div className="space-y-5">
              {sections.map(section => {
                const isCollapsed = collapsedSections.has(section.id);

                return (
                  <div key={section.id} id={section.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm scroll-mt-20">
                    <button onClick={() => toggleSection(section.id)} className={`w-full flex items-center justify-between p-4 sm:p-5 transition-colors hover:opacity-90`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradientFrom} ${section.gradientTo} flex items-center justify-center text-white`}>
                          {section.icon}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white text-left">{section.title}</h2>
                      </div>
                      {isCollapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
                    </button>
                    {!isCollapsed && (
                      <div className="px-4 sm:px-6 pb-5 pt-1">
                        <SectionContent section={section} onQuizComplete={handleQuizComplete} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rating */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mt-6 text-center print:hidden">
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">How useful were these study notes?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your feedback helps us improve</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => { setRating(star); toast.success('JazakAllahu khairan for your feedback!'); }}
                    onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125">
                    <Star className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
                  </button>
                ))}
              </div>
              {rating && <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3 font-medium">You rated this {rating}/5 — thank you!</p>}
            </div>
          </>
        ) : (
          <>
            {/* Blurred preview of first section */}
            {sections.length > 0 && (
              <div className="relative mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sections[0].gradientFrom} ${sections[0].gradientTo} flex items-center justify-center text-white`}>
                        {sections[0].icon}
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{sections[0].title}</h2>
                    </div>
                    <div className="relative max-h-32 overflow-hidden">
                      <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed blur-[6px] select-none pointer-events-none">
                        <SectionContent section={sections[0]} onQuizComplete={() => {}} />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-gray-800/70 dark:to-gray-800" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paywall Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden text-center print:hidden">
              {coursePosterUrl && (
                <div className="relative h-40 sm:h-48 w-full">
                  <img src={coursePosterUrl} alt={course.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-emerald-50 dark:to-emerald-900/20" />
                </div>
              )}
              <div className="p-6 sm:p-8">
                {!coursePosterUrl && (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unlock All Study Notes</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Session 1 notes were free — get notes for every session in this course.
              </p>

              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                £{notesPricePounds.toFixed(2)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">one-off</span>
              </p>

              <ul className="text-left max-w-sm mx-auto space-y-2 mb-6">
                {COURSE_NOTES_PRICING.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handlePurchaseNotes}
                disabled={purchasingNotes || notesAccessLoading}
                className="w-full max-w-sm mx-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchasingNotes ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Redirecting to checkout...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Get All Study Notes — £{notesPricePounds.toFixed(2)}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Secure payment via Stripe. Lifetime access to all session notes.
              </p>
              </div>
            </div>
          </>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-6 mb-12 print:hidden">
          {hasPrev ? (
            <Link to={`/course/${slug}/session/${currentSession - 1}`} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <div className="text-left"><div className="text-xs text-gray-400">Previous</div><div className="text-sm font-medium text-gray-700 dark:text-gray-300">Session {currentSession - 1}</div></div>
            </Link>
          ) : <div />}
          <Link to={`/course/${slug}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Sessions
          </Link>
          {hasNext ? (
            <Link to={`/course/${slug}/session/${currentSession + 1}`} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="text-right"><div className="text-xs text-gray-400">Next</div><div className="text-sm font-medium text-gray-700 dark:text-gray-300">Session {currentSession + 1}</div></div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
