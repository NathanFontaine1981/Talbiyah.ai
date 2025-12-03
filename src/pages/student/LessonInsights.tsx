import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Download,
  Printer,
  Star,
  ArrowLeft,
  Video,
  Loader,
  AlertTriangle,
  CheckCircle,
  Book,
  Target,
  Lightbulb,
  BookMarked,
  XCircle,
  Clock,
  Play,
  GraduationCap,
  PenTool,
  Volume2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  MessageCircle,
  RotateCcw,
  Scissors,
  Send,
  FileText,
  HelpCircle,
  Home
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Breadcrumbs from '../../components/Breadcrumbs';

interface LessonInsight {
  id: string;
  lesson_id: string;
  insight_type: string;
  title: string;
  summary: string;
  detailed_insights: {
    content: string;
    subject: string;
    metadata: {
      surah_name?: string;
      surah_number?: number;
      ayah_range?: string;
      teacher_name: string;
      student_names: string[];
      lesson_date: string;
      duration_minutes?: number;
    };
  } | null;
  key_topics?: string[];
  areas_of_strength?: string[];
  areas_for_improvement?: string[];
  recommendations?: string[];
  viewed_by_student: boolean;
  student_rating: number | null;
  created_at: string;
}

interface RecordingData {
  primary?: {
    presigned_url: string;
    duration: number;
  };
  screen_share?: {
    presigned_url: string;
    duration: number;
  };
  transcript_url?: string;
  days_until_expiry?: number;
  expires_warning?: boolean;
}

// Word interface for vocabulary
interface VocabWord {
  arabic: string;
  transliteration: string;
  english: string;
  wordType?: string;
  example?: string;
}

// Quiz interfaces
interface QuizQuestion {
  question: string;
  options: { text: string; arabic?: string; transliteration?: string }[];
  correctAnswer: number;
}

// Dialogue line interface
interface DialogueLine {
  speaker: string;
  arabic: string;
  transliteration: string;
  english: string;
}

// Key sentence interface
interface KeySentence {
  arabic: string;
  transliteration: string;
  english: string;
  ayahNumber?: number; // For Quran verses
}

// Grammar point interface
interface GrammarPoint {
  title: string;
  arabicTitle?: string;
  transliteration?: string;
  explanation: string;
  examples: { arabic: string; english: string }[];
}

// Teacher note interface
interface TeacherNote {
  arabic?: string;
  transliteration?: string;
  note: string;
  meanings?: string[];
}

// Clean markdown text - remove # headers and other markdown artifacts
function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, '') // Remove # headers
    .replace(/\*\*/g, '')        // Remove bold markers
    .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points at start
    .replace(/\|/g, ' ')         // Remove table pipes
    .replace(/---+/g, '')        // Remove horizontal rules
    .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
    .replace(/\s*[-–]\s*template\s*/gi, '') // Remove "- Template" or "– Template"
    .replace(/\s+template\s*$/gi, '') // Remove trailing "Template"
    .replace(/^template\s+/gi, '') // Remove leading "Template"
    .trim();
}

// Parse vocabulary from content
function parseVocabulary(content: string): VocabWord[] {
  const words: VocabWord[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip header rows and separator rows
    if (line.includes('---') || line.includes('Arabic') || line.includes('Transliteration')) {
      continue;
    }

    // Look for table rows - handle both 3-column and 4-column tables
    // Format 1: | Arabic | Transliteration | English |
    // Format 2: | Arabic | Transliteration | Meaning | Root |
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);

    if (cells.length >= 3) {
      const arabic = cells[0];
      const translit = cells[1];
      const english = cells[2]; // This is "English" or "Meaning" depending on format

      // Check if first cell contains Arabic characters
      if (arabic && /[أ-يً-ْ]/.test(arabic)) {
        words.push({ arabic, transliteration: translit, english });
      }
    }

    // Look for bullet point format: - Arabic (transliteration) - English
    const bulletMatch = line.match(/[-•]\s*([أ-يً-ْ\s]+)\s*\(([^)]+)\)\s*[-–:]\s*(.+)/);
    if (bulletMatch) {
      words.push({
        arabic: bulletMatch[1].trim(),
        transliteration: bulletMatch[2].trim(),
        english: bulletMatch[3].trim()
      });
    }
  }

  return words.slice(0, 15); // Limit to 15 words
}

// Parse key sentences (also handles Verses Covered tables)
function parseKeySentences(content: string): KeySentence[] {
  const sentences: KeySentence[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip header and separator rows
    if (line.includes('---') || line.includes('Arabic') || line.includes('Transliteration') || line.includes('Translation')) {
      continue;
    }

    // Parse table rows - handle both 3 and 4+ column formats
    // Format 1: | Arabic | Transliteration | English |
    // Format 2: | # | Arabic | Transliteration | Translation |
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);

    if (cells.length >= 3) {
      // Check if first cell is just a number (ayah/row index)
      const firstIsNumber = /^\d+$/.test(cells[0]);
      const ayahNumber = firstIsNumber ? parseInt(cells[0], 10) : undefined;
      const arabicIdx = firstIsNumber ? 1 : 0;
      const translitIdx = firstIsNumber ? 2 : 1;
      const englishIdx = firstIsNumber ? 3 : 2;

      const arabic = cells[arabicIdx];
      const translit = cells[translitIdx];
      const english = cells[englishIdx];

      // Check if Arabic column contains Arabic characters
      if (arabic && /[أ-يً-ْ]/.test(arabic) && arabic.length > 3) {
        sentences.push({
          arabic,
          transliteration: translit || '',
          english: english || '',
          ayahNumber
        });
      }
    }
  }

  return sentences.slice(0, 20); // Allow more sentences for Quran verses
}

// First Word Prompter interface
interface FirstWordPrompt {
  ayahNumber: number;
  firstWord: string;
  theme?: string;
}

// Parse First Word Prompter content
function parseFirstWordPrompter(content: string): { theme: string; prompts: FirstWordPrompt[] }[] {
  const themes: { theme: string; prompts: FirstWordPrompt[] }[] = [];
  const lines = content.split('\n');
  let currentTheme = '';
  let currentPrompts: FirstWordPrompt[] = [];

  for (const line of lines) {
    // Detect theme headers like "### Theme 1: The Five Oaths (Ayahs 1-14)"
    const themeMatch = line.match(/^###?\s*Theme\s*\d+[:\s]+(.+)/i);
    if (themeMatch) {
      // Save previous theme if exists
      if (currentTheme && currentPrompts.length > 0) {
        themes.push({ theme: currentTheme, prompts: currentPrompts });
      }
      currentTheme = themeMatch[1].trim();
      currentPrompts = [];
      continue;
    }

    // Skip header and separator rows
    if (line.includes('---') || line.includes('First Word') || line.includes('Complete the')) {
      continue;
    }

    // Parse table rows: | # | First Word | Complete the verse... |
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length >= 2) {
      const ayahNum = parseInt(cells[0], 10);
      const firstWord = cells[1];

      // Check if first cell is a number and second has Arabic
      if (!isNaN(ayahNum) && /[أ-يً-ْ]/.test(firstWord)) {
        currentPrompts.push({
          ayahNumber: ayahNum,
          firstWord: firstWord,
          theme: currentTheme
        });
      }
    }
  }

  // Don't forget last theme
  if (currentTheme && currentPrompts.length > 0) {
    themes.push({ theme: currentTheme, prompts: currentPrompts });
  }

  return themes;
}

// Parse grammar points
function parseGrammarPoints(content: string): GrammarPoint[] {
  const points: GrammarPoint[] = [];
  const sections = content.split(/\d️⃣|\n(?=\d+\.\s)/);

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.trim().split('\n');
    const titleLine = lines[0]?.trim();
    if (!titleLine) continue;

    // Extract Arabic from title if present
    const arabicMatch = titleLine.match(/\(([أ-يً-ْ\s+]+)\)/);
    const title = titleLine.replace(/\([أ-يً-ْ\s+]+\)/, '').replace(/^[\d.]+\s*/, '').trim();

    const explanation = lines.slice(1).find(l => !l.includes('*') && l.trim())?.trim() || '';

    // Find example sentences
    const examples: { arabic: string; english: string }[] = [];
    for (const line of lines) {
      const exMatch = line.match(/[*•-]\s*([أ-يً-ْ\s,.؟!]+)\s*[-–]\s*(.+)/);
      if (exMatch) {
        examples.push({ arabic: exMatch[1].trim(), english: exMatch[2].trim() });
      }
    }

    if (title) {
      points.push({
        title: cleanMarkdown(title),
        arabicTitle: arabicMatch?.[1],
        explanation: cleanMarkdown(explanation),
        examples
      });
    }
  }

  return points;
}

// Parse dialogues
function parseDialogues(content: string): DialogueLine[] {
  const dialogues: DialogueLine[] = [];
  const lines = content.split('\n');

  let currentSpeaker = '';
  let currentArabic = '';
  let currentTranslit = '';
  let currentEnglish = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect speaker change - multiple formats supported:
    // - T: or S: or Teacher: or Student:
    // - **Teacher (T):** or **Student (S):** (markdown bold format)
    // - **T:** or **S:** (short markdown format)
    const speakerMatch = trimmed.match(/^(?:\*\*)?(?:(Teacher|Student)\s*\(?(T|S)?\)?|(T|S))[:\*]*\s*(.+)?/i);
    if (speakerMatch) {
      // Save previous dialogue if exists
      if (currentSpeaker && currentArabic) {
        dialogues.push({
          speaker: currentSpeaker,
          arabic: currentArabic,
          transliteration: currentTranslit,
          english: currentEnglish
        });
      }

      // Determine speaker name
      const fullName = speakerMatch[1]; // Teacher or Student
      const shortCode = speakerMatch[2] || speakerMatch[3]; // T or S
      if (fullName) {
        currentSpeaker = fullName.charAt(0).toUpperCase() + fullName.slice(1).toLowerCase();
      } else if (shortCode) {
        currentSpeaker = shortCode.toUpperCase() === 'T' ? 'Teacher' : 'Student';
      }

      const rest = speakerMatch[4]?.trim() || '';

      // Check if Arabic is on the same line (after the speaker label)
      if (/[أ-ي]/.test(rest)) {
        currentArabic = rest.replace(/\*\*/g, '').replace(/\([^)]+\)$/, '').trim();
        const parenMatch = rest.match(/\(([^)]+)\)$/);
        if (parenMatch) currentEnglish = parenMatch[1];
      } else {
        currentArabic = '';
      }
      currentTranslit = '';
      currentEnglish = '';
      continue;
    }

    // Check for transliteration line (italic text with asterisks)
    const translitMatch = trimmed.match(/^\*([^*]+)\*$/);
    if (translitMatch && currentSpeaker) {
      currentTranslit = translitMatch[1].trim();
      continue;
    }

    // Check for Arabic content on its own line
    if (/[أ-ي]/.test(trimmed) && currentSpeaker && !currentArabic) {
      currentArabic = trimmed.replace(/\*\*/g, '').replace(/\([^)]+\)$/, '').trim();
      continue;
    }

    // Check for English translation in parentheses
    const parenMatch = trimmed.match(/^\(([^)]+)\)$/);
    if (parenMatch && currentSpeaker) {
      currentEnglish = parenMatch[1];
      // Push completed dialogue
      if (currentArabic) {
        dialogues.push({
          speaker: currentSpeaker,
          arabic: currentArabic,
          transliteration: currentTranslit,
          english: currentEnglish
        });
      }
      currentSpeaker = '';
      currentArabic = '';
      currentTranslit = '';
      currentEnglish = '';
    }
  }

  // Don't forget last dialogue
  if (currentSpeaker && currentArabic) {
    dialogues.push({
      speaker: currentSpeaker,
      arabic: currentArabic,
      transliteration: currentTranslit,
      english: currentEnglish
    });
  }

  return dialogues;
}

// Parse tafsir points from markdown content
function parseTafsirPoints(content: string): TafsirPoint[] {
  const points: TafsirPoint[] = [];

  // Split by ### Ayah headers
  const sections = content.split(/(?=###\s*Ayah[s]?\s*\d)/i);

  for (const section of sections) {
    if (!section.trim()) continue;

    // Match ayah header like "### Ayah 34: فَإِذَا" or "### Ayahs 37-39: The Path"
    const headerMatch = section.match(/###\s*Ayahs?\s*([\d\-]+)[:\s]*(.*)/i);
    if (!headerMatch) continue;

    const ayahRef = headerMatch[1].includes('-') ? `Ayahs ${headerMatch[1]}` : `Ayah ${headerMatch[1]}`;
    const headerRest = headerMatch[2] || '';
    const lines = section.split('\n');

    // Check if Arabic is in the header (format: ### Ayah 34: فَإِذَا جَاءَتِ)
    let arabic = '';
    const headerArabicMatch = headerRest.match(/([أ-يً-ْ\s،؟!]+)/);
    if (headerArabicMatch) {
      arabic = headerArabicMatch[1].trim();
    }

    let translation = '';
    let tafsir = '';
    let reflection = '';
    const scholarQuotes: { scholar: string; quote: string }[] = [];

    let inReflection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip header and separators
      if (trimmed.startsWith('###') || trimmed === '---') {
        inReflection = false;
        continue;
      }

      // Multi-line Arabic text in bold (for ayah groups like 37-39)
      if (!arabic) {
        const boldArabicMatch = trimmed.match(/\*\*([أ-يً-ْ\s،؟!•]+)\*\*/);
        if (boldArabicMatch) {
          arabic = boldArabicMatch[1].trim();
          continue;
        }
      }

      // Translation - in bold with quotes like **"So when..."**
      const translationMatch = trimmed.match(/\*\*"([^"]+)"\*\*/);
      if (translationMatch && !translation) {
        translation = translationMatch[1];
        continue;
      }

      // Scholar quotes - various formats
      // Format 1: Ibn Kathir (رحمه الله) explains that...
      // Format 2: Imam al-Qurtubi explains that...
      // Format 3: Hasan al-Basri said: "..."
      const scholarPatterns = [
        /^(Ibn\s+[\w\-]+|Imam\s+[\w\-]+|Hasan\s+al-\w+|As-Sa['']di|Qurtubi)\s*(?:\([^)]+\))?\s*(?:explains?|said|notes?|wrote|adds?|comments?|beautifully notes?)\s*(?:that\s+)?[:"]?(.+)/i,
      ];

      for (const pattern of scholarPatterns) {
        const match = trimmed.match(pattern);
        if (match && match[2]) {
          const quote = match[2].replace(/^[":]|"$/g, '').trim();
          if (quote.length > 30) {
            scholarQuotes.push({
              scholar: match[1].replace(/\s+/g, ' '),
              quote: quote.substring(0, 200) + (quote.length > 200 ? '...' : '')
            });
          }
          break;
        }
      }

      // Reflection prompt
      if (trimmed.startsWith('**Reflection:**') || trimmed.startsWith('**Reflection:')) {
        inReflection = true;
        reflection = trimmed.replace(/\*\*Reflection:\*\*\s*/i, '').replace(/\*\*/g, '');
        continue;
      }

      if (inReflection && trimmed) {
        reflection += ' ' + trimmed;
        continue;
      }

      // Collect tafsir text - longer paragraphs
      if (trimmed && !trimmed.startsWith('|') && !trimmed.startsWith('#') &&
          !trimmed.startsWith('**Step') && !trimmed.startsWith('**Quality') &&
          !trimmed.startsWith('-') && !trimmed.startsWith('*') &&
          trimmed.length > 60) {
        // Skip lines that are likely scholar quotes (already captured)
        if (!trimmed.match(/^(Ibn|Imam|Hasan|As-Sa|Qurtubi)/i)) {
          tafsir += (tafsir ? ' ' : '') + trimmed;
        }
      }
    }

    // Only add if we have meaningful content
    if (arabic || translation || tafsir || scholarQuotes.length > 0) {
      points.push({
        ayahRef,
        arabic,
        translation,
        tafsir: tafsir.substring(0, 600), // Limit tafsir length for display
        reflection: reflection.trim() || undefined,
        scholarQuotes: scholarQuotes.length > 0 ? scholarQuotes : undefined
      });
    }
  }

  return points;
}

// Parse teacher notes
function parseTeacherNotes(content: string): TeacherNote[] {
  const notes: TeacherNote[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes('---')) continue;

    // Look for lines starting with checkmark or bullet
    if (trimmed.startsWith('✅') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
      const noteText = trimmed.replace(/^[✅•-]\s*/, '');

      // Try to extract Arabic word if present
      const arabicMatch = noteText.match(/([أ-يً-ْ]+)/);
      const arabic = arabicMatch?.[1];

      // Check for multiple meanings
      const meaningsMatch = noteText.match(/(\d+)\s*meanings?/i);
      const meanings: string[] = [];
      if (meaningsMatch) {
        const parts = noteText.split(/,|;/).slice(1);
        parts.forEach(p => meanings.push(p.trim()));
      }

      notes.push({
        arabic,
        note: cleanMarkdown(noteText),
        meanings: meanings.length > 0 ? meanings : undefined
      });
    }
  }

  return notes;
}

// Parse quiz questions
function parseQuizQuestions(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const lines = content.split('\n');
  let currentQuestion: QuizQuestion | null = null;
  let pendingOptionsLine: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect question - starts with number, possibly with ** or Q prefix
    const qMatch = line.match(/^(?:\*\*)?(?:Q)?(\d+)[.)]\s*(?:\*\*)?\s*(.+)/);
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
      }

      // Get the full question text
      const questionText = qMatch[2];

      currentQuestion = {
        question: cleanMarkdown(questionText),
        options: [],
        correctAnswer: -1
      };
      pendingOptionsLine = null;
      continue;
    }

    // Detect options line (starts with A) and contains b) c) etc)
    // Format: "A) option1 b) option2 c) option3"
    const optionsLineMatch = line.match(/^[Aa]\)\s*.+[Bb]\)\s*.+/);
    if (optionsLineMatch && currentQuestion) {
      // Split by a), b), c), d) pattern - case insensitive
      const parts = line.split(/\s*([Aa]|[Bb]|[Cc]|[Dd])\)\s*/);

      // parts will be like: ["", "A", "option1", "b", "option2", "c", "option3"]
      for (let j = 1; j < parts.length; j += 2) {
        const optionLetter = parts[j];
        const optionText = parts[j + 1]?.trim();

        if (optionText) {
          const isCorrect = optionText.includes('✅');
          const cleanText = optionText.replace(/✅/g, '').trim();

          if (cleanText) {
            if (isCorrect) currentQuestion.correctAnswer = currentQuestion.options.length;
            const arabicMatch = cleanText.match(/([أ-يً-ْ\s]+)/);
            currentQuestion.options.push({
              text: cleanMarkdown(cleanText),
              arabic: arabicMatch?.[1]?.trim()
            });
          }
        }
      }
      continue;
    }

    // Detect individual option on its own line
    const singleOptMatch = line.match(/^[-•]?\s*([Aa]|[Bb]|[Cc]|[Dd])\)\s*(.+)/);
    if (singleOptMatch && currentQuestion) {
      const optText = singleOptMatch[2].trim();
      const isCorrect = optText.includes('✅');
      const cleanText = optText.replace(/✅/g, '').trim();

      if (isCorrect) currentQuestion.correctAnswer = currentQuestion.options.length;

      const arabicMatch = cleanText.match(/([أ-يً-ْ\s]+)/);
      currentQuestion.options.push({
        text: cleanMarkdown(cleanText),
        arabic: arabicMatch?.[1]?.trim()
      });
      continue;
    }

    // True/False detection
    if (line.toLowerCase().includes('true') || line.toLowerCase().includes('false')) {
      if (currentQuestion && currentQuestion.options.length === 0) {
        currentQuestion.options = [
          { text: 'True' },
          { text: 'False' }
        ];
        if (line.includes('✅')) {
          currentQuestion.correctAnswer = line.toLowerCase().includes('true') ? 0 : 1;
        }
      }
    }
  }

  if (currentQuestion && currentQuestion.options.length > 0) {
    questions.push(currentQuestion);
  }

  return questions;
}

// Parse homework tasks
function parseHomework(content: string): { task: string; type: 'write' | 'speak' | 'read' | 'listen' | 'other'; details?: string }[] {
  const tasks: { task: string; type: 'write' | 'speak' | 'read' | 'listen' | 'other'; details?: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes('---')) continue;

    // Look for task markers
    if (trimmed.match(/^[📝🗣️📖🎧•-]/)) {
      let type: 'write' | 'speak' | 'read' | 'listen' | 'other' = 'other';
      if (trimmed.includes('📝') || trimmed.toLowerCase().includes('write')) type = 'write';
      else if (trimmed.includes('🗣️') || trimmed.toLowerCase().includes('speak') || trimmed.toLowerCase().includes('practice')) type = 'speak';
      else if (trimmed.includes('📖') || trimmed.toLowerCase().includes('read') || trimmed.toLowerCase().includes('revise')) type = 'read';
      else if (trimmed.includes('🎧') || trimmed.toLowerCase().includes('listen')) type = 'listen';

      tasks.push({
        task: cleanMarkdown(trimmed.replace(/^[📝🗣️📖🎧•-]\s*/, '')),
        type
      });
    }
  }

  return tasks;
}

// Section parsing
interface InsightSection {
  title: string;
  content: string;
  type: 'summary' | 'vocabulary' | 'sentences' | 'prompter' | 'grammar' | 'notes' | 'tafsir' | 'dialogue' | 'pronunciation' | 'takeaways' | 'quiz' | 'homework' | 'reflection' | 'other';
}

// Tafsir point interface
interface TafsirPoint {
  ayahRef: string;
  arabic: string;
  translation: string;
  tafsir: string;
  reflection?: string;
  scholarQuotes?: { scholar: string; quote: string }[];
}

function parseInsightSections(content: string): InsightSection[] {
  const sections: InsightSection[] = [];

  // Find all section headers
  const tempContent = content.replace(/\r\n/g, '\n');
  const lines = tempContent.split('\n');
  let currentPos = 0;
  const matches: { title: string; start: number }[] = [];

  // Extended regex to match Arabic, Quran, and general section headers
  const sectionPattern = /^(?:#{1,3}\s*)?(?:\d️⃣|\d+[.)]?)?\s*\**\s*(Lesson Summary|Lesson Information|Key Sentences|Key Verses|Vocabulary|Focus Words|Key Arabic Vocabulary|Arabic Vocabulary|Verses Covered|First Word Prompter|Grammar Focus|Grammar Points|Teacher Notes|Tajweed Points|Tafsir Points|Tafsir|Flow of Meaning|Memorisation Progress|Memorization Progress|Conversation Practice|Role-?Play|Pronunciation|Key Takeaways|Key Lessons|Lessons & Tadabbur|Tadabbur Points|Mini Quiz|Comprehension Check|Homework|Practice Tasks|Weekly Reflection|Reflection Questions|Flashcard Challenge|Summary Takeaway|Talbiyah Insights Summary|Final Reflection|Summary & Key Takeaway)\**\s*/i;

  for (const line of lines) {
    const headerMatch = line.match(sectionPattern);
    if (headerMatch) {
      matches.push({ title: headerMatch[1].trim(), start: currentPos });
    }
    currentPos += line.length + 1;
  }

  // Extract content for each section
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].start;
    const end = i < matches.length - 1 ? matches[i + 1].start : tempContent.length;
    const sectionContent = tempContent.slice(start, end).trim();

    // Remove the header line from content
    const contentLines = sectionContent.split('\n').slice(1).join('\n').trim();

    let type: InsightSection['type'] = 'other';
    const titleLower = matches[i].title.toLowerCase();
    if (titleLower.includes('lesson information')) type = 'summary';
    else if (titleLower.includes('summary') && !titleLower.includes('talbiyah')) type = 'summary';
    else if (titleLower.includes('vocabulary') || titleLower.includes('focus words')) type = 'vocabulary';
    else if (titleLower.includes('sentence') || titleLower.includes('verses covered') || titleLower.includes('key verses')) type = 'sentences';
    else if (titleLower.includes('first word prompter')) type = 'prompter';
    else if (titleLower.includes('grammar') || titleLower.includes('tajweed')) type = 'grammar';
    else if (titleLower.includes('tafsir') || titleLower.includes('flow of meaning')) type = 'tafsir';
    else if (titleLower.includes('notes') || titleLower.includes('correction')) type = 'notes';
    else if (titleLower.includes('key lessons') || titleLower.includes('tadabbur') || titleLower.includes('lessons &')) type = 'takeaways';
    else if (titleLower.includes('conversation') || titleLower.includes('role')) type = 'dialogue';
    else if (titleLower.includes('pronunciation')) type = 'pronunciation';
    else if (titleLower.includes('takeaway')) type = 'takeaways';
    else if (titleLower.includes('quiz') || titleLower.includes('comprehension check')) type = 'quiz';
    else if (titleLower.includes('homework') || titleLower.includes('practice task') || titleLower.includes('weekly reflection')) type = 'homework';
    else if (titleLower.includes('reflection') || titleLower.includes('talbiyah insights')) type = 'reflection';
    else if (titleLower.includes('flashcard')) type = 'vocabulary';
    else if (titleLower.includes('memoris') || titleLower.includes('memoriz')) type = 'other'; // Memorisation Progress

    sections.push({
      title: cleanMarkdown(matches[i].title),
      content: contentLines,
      type
    });
  }

  return sections;
}

// Flip Card Component for Focus Words
function FlipCard({ word, index }: { word: VocabWord; index: number }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="cursor-pointer h-32 perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front - Arabic */}
        <div
          className="absolute w-full h-full bg-white rounded-xl p-4 border-2 border-emerald-200 hover:border-emerald-400 transition flex flex-col items-center justify-center shadow-sm"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-4xl font-arabic text-emerald-700 mb-1 text-center" dir="rtl">{word.arabic}</p>
          {word.transliteration && (
            <p className="text-sm text-gray-500 italic">{word.transliteration}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">Tap to flip</p>
        </div>

        {/* Back - English */}
        <div
          className="absolute w-full h-full bg-emerald-50 rounded-xl p-4 border-2 border-emerald-300 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-lg font-medium text-emerald-800 text-center">{word.english}</p>
          {word.transliteration && (
            <p className="text-sm text-gray-600 italic mt-1">{word.transliteration}</p>
          )}
          {word.wordType && (
            <span className="text-xs bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded mt-2">{word.wordType}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Interactive Quiz Component
function InteractiveQuiz({ questions, onAnswerUpdate }: { questions: QuizQuestion[]; onAnswerUpdate?: (answers: { questionIndex: number; selectedAnswer: number; correct: boolean }[]) => void }) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState<{ [key: number]: boolean }>({});

  const handleAnswerClick = (questionIndex: number, optionIndex: number) => {
    const newSelectedAnswers = { ...selectedAnswers, [questionIndex]: optionIndex };
    const newShowResults = { ...showResults, [questionIndex]: true };

    setSelectedAnswers(newSelectedAnswers);
    setShowResults(newShowResults);

    // Update parent with all answers
    if (onAnswerUpdate) {
      const answers = Object.keys(newShowResults).map(k => {
        const idx = parseInt(k);
        return {
          questionIndex: idx,
          selectedAnswer: newSelectedAnswers[idx],
          correct: newSelectedAnswers[idx] === questions[idx]?.correctAnswer
        };
      });
      onAnswerUpdate(answers);
    }
  };

  const resetQuestion = (questionIndex: number) => {
    setSelectedAnswers(prev => { const n = { ...prev }; delete n[questionIndex]; return n; });
    setShowResults(prev => { const n = { ...prev }; delete n[questionIndex]; return n; });
  };

  const correctCount = Object.keys(showResults).filter(
    (k) => selectedAnswers[parseInt(k)] === questions[parseInt(k)]?.correctAnswer
  ).length;
  const answeredCount = Object.keys(showResults).length;

  return (
    <div className="space-y-6">
      {answeredCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-800 font-medium">Score: {correctCount}/{answeredCount}</span>
            </div>
            <span className="text-indigo-600 font-bold text-lg">{Math.round((correctCount / answeredCount) * 100)}%</span>
          </div>
          <div className="mt-2 h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(correctCount / answeredCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {questions.map((q, qIndex) => {
        const selectedAnswer = selectedAnswers[qIndex];
        const isAnswered = showResults[qIndex];
        const isCorrect = selectedAnswer === q.correctAnswer;

        return (
          <div key={qIndex} className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="font-semibold text-gray-900 mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm mr-2">
                {qIndex + 1}
              </span>
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((option, oIndex) => {
                const isSelected = selectedAnswer === oIndex;
                const isCorrectOption = oIndex === q.correctAnswer;

                let buttonClasses = "w-full text-left px-4 py-3 rounded-xl border-2 transition-all ";
                if (!isAnswered) {
                  buttonClasses += "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer";
                } else {
                  if (isSelected && isCorrect) buttonClasses += "border-emerald-400 bg-emerald-50";
                  else if (isSelected && !isCorrect) buttonClasses += "border-red-400 bg-red-50";
                  else if (isCorrectOption) buttonClasses += "border-emerald-400 bg-emerald-50";
                  else buttonClasses += "border-gray-200 bg-gray-50 opacity-50";
                }

                return (
                  <button
                    key={oIndex}
                    onClick={() => !isAnswered && handleAnswerClick(qIndex, oIndex)}
                    disabled={isAnswered}
                    className={buttonClasses}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium mr-2 text-gray-500">{String.fromCharCode(65 + oIndex)})</span>
                        <span className="text-gray-700">{option.text}</span>
                        {option.transliteration && (
                          <span className="text-gray-500 italic ml-2">({option.transliteration})</span>
                        )}
                      </div>
                      {isAnswered && isSelected && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                      {isAnswered && !isSelected && isCorrectOption && <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                <p className={`text-sm font-medium ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isCorrect ? '✓ Correct! Well done!' : '✗ Not quite - see the correct answer above'}
                </p>
                <button onClick={() => resetQuestion(qIndex)} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Dialogue Card Component
function DialogueCard({ line }: { line: DialogueLine }) {
  const isTeacher = line.speaker.toLowerCase().includes('teacher') || line.speaker === 'T';

  return (
    <div className={`p-4 rounded-xl border-l-4 ${
      isTeacher ? 'bg-blue-50 border-blue-500' : 'bg-emerald-50 border-emerald-500'
    }`}>
      <p className={`text-sm font-medium mb-2 ${isTeacher ? 'text-blue-700' : 'text-emerald-700'}`}>
        {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}:
      </p>

      {/* Arabic - right aligned */}
      <p className="font-arabic text-3xl text-right mb-2 text-gray-900" dir="rtl">
        {line.arabic}
      </p>

      {/* Transliteration */}
      {line.transliteration && (
        <p className="text-gray-600 italic mb-1">
          {line.transliteration}
        </p>
      )}

      {/* English */}
      <p className="text-gray-700">
        {line.english}
      </p>
    </div>
  );
}

// Key Sentence Card Component
function KeySentenceCard({ sentence, isQuran = false }: { sentence: KeySentence; isQuran?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      {/* Ayah number badge for Quran verses */}
      {isQuran && sentence.ayahNumber && (
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm border border-emerald-200">
            {sentence.ayahNumber}
          </span>
          <span className="text-sm text-gray-500">Ayah {sentence.ayahNumber}</span>
        </div>
      )}

      {/* Arabic - right aligned */}
      <p className="font-arabic text-3xl text-right mb-2 text-gray-900" dir="rtl">
        {sentence.arabic}
      </p>

      {/* Transliteration */}
      <p className="text-cyan-700 mb-1 italic">
        {sentence.transliteration}
      </p>

      {/* English */}
      <p className="text-gray-700 font-medium">
        {sentence.english}
      </p>
    </div>
  );
}

// First Word Prompter Card - interactive memorisation practice
function FirstWordPrompterCard({ themes }: { themes: { theme: string; prompts: FirstWordPrompt[] }[] }) {
  const [revealedAyahs, setRevealedAyahs] = useState<Set<number>>(new Set());

  const toggleReveal = (ayahNum: number) => {
    setRevealedAyahs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ayahNum)) {
        newSet.delete(ayahNum);
      } else {
        newSet.add(ayahNum);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
        Test yourself! See the first word and try to recite the complete verse. Tap a card to check if you got it right.
      </p>

      {themes.map((themeGroup, tIdx) => (
        <div key={tIdx} className="space-y-3">
          <h4 className="font-bold text-emerald-700 text-sm bg-emerald-100 px-3 py-2 rounded-lg">
            {themeGroup.theme}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" dir="rtl">
            {themeGroup.prompts.map((prompt, pIdx) => {
              const isRevealed = revealedAyahs.has(prompt.ayahNumber);
              return (
                <button
                  key={pIdx}
                  onClick={() => toggleReveal(prompt.ayahNumber)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                    isRevealed
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  {/* Ayah number badge */}
                  <span className="absolute top-2 left-2 w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center justify-center">
                    {prompt.ayahNumber}
                  </span>

                  {/* First word */}
                  <p className="font-arabic text-2xl text-gray-900 mt-2" dir="rtl">
                    {prompt.firstWord}
                  </p>

                  {/* Prompt or checkmark */}
                  {isRevealed ? (
                    <span className="text-emerald-600 text-xs font-medium mt-2 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Done
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs mt-2 block">...complete</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Grammar Point Card
function GrammarCard({ point }: { point: GrammarPoint }) {
  return (
    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
      <div className="flex items-start gap-2 mb-3">
        <span className="text-2xl">📚</span>
        <div>
          <h4 className="font-bold text-gray-900">{point.title}</h4>
          {point.arabicTitle && (
            <div className="flex items-center gap-2 mt-1">
              <span className="font-arabic text-2xl text-orange-700">{point.arabicTitle}</span>
              {point.transliteration && (
                <span className="text-gray-500 italic">({point.transliteration})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {point.explanation && (
        <p className="text-gray-700 mb-3">{point.explanation}</p>
      )}

      {point.examples.length > 0 && (
        <div className="space-y-2 bg-white rounded-lg p-3 border border-orange-100">
          <p className="text-sm font-medium text-orange-700 mb-2">Examples:</p>
          {point.examples.map((ex, i) => (
            <div key={i} className="flex flex-col">
              <p className="font-arabic text-2xl text-right text-gray-900" dir="rtl">{ex.arabic}</p>
              <p className="text-gray-600 text-sm">{ex.english}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Teacher Note Card
function TeacherNoteCard({ note }: { note: TeacherNote }) {
  return (
    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="flex-1">
          {note.arabic && (
            <p className="font-arabic text-2xl text-purple-800 mb-1">{note.arabic}</p>
          )}
          {note.transliteration && (
            <p className="text-gray-500 italic text-sm mb-2">{note.transliteration}</p>
          )}
          <p className="text-gray-700">{note.note}</p>
          {note.meanings && note.meanings.length > 0 && (
            <div className="mt-2 space-y-1">
              {note.meanings.map((meaning, i) => (
                <p key={i} className="text-sm text-purple-700">
                  <strong>Meaning {i + 1}:</strong> {meaning}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tafsir Card - Expandable card for detailed verse commentary
function TafsirCard({ point, index }: { point: TafsirPoint; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-start gap-3 hover:bg-teal-100/50 transition-colors"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
          {point.ayahRef.replace('Ayah ', '').split('-')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-teal-800">{point.ayahRef}</h4>
            <ChevronDown className={`w-5 h-5 text-teal-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          {point.arabic && (
            <p className="font-arabic text-xl text-teal-900 mt-1 text-right" dir="rtl">
              {point.arabic}
            </p>
          )}
          {point.translation && (
            <p className="text-gray-700 italic mt-1">"{point.translation}"</p>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-teal-200 bg-white/50">
          {/* Tafsir explanation */}
          {point.tafsir && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-teal-700 mb-2 flex items-center gap-2">
                <Book className="w-4 h-4" />
                Tafsir
              </h5>
              <p className="text-gray-700 leading-relaxed">{point.tafsir}</p>
            </div>
          )}

          {/* Scholar quotes */}
          {point.scholarQuotes && point.scholarQuotes.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-teal-700 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Scholar's Commentary
              </h5>
              <div className="space-y-3">
                {point.scholarQuotes.map((sq, i) => (
                  <div key={i} className="bg-teal-50 rounded-lg p-3 border-l-4 border-teal-500">
                    <p className="text-gray-700 italic">"{sq.quote}"</p>
                    <p className="text-teal-700 text-sm font-medium mt-1">— {sq.scholar}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflection prompt */}
          {point.reflection && (
            <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <h5 className="text-sm font-semibold text-amber-700 mb-1 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Reflection
              </h5>
              <p className="text-gray-700">{point.reflection}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Homework Task Card with checkboxes
function HomeworkCard({
  tasks,
  completedTasks,
  onToggleTask
}: {
  tasks: { task: string; type: string }[];
  completedTasks: boolean[];
  onToggleTask: (index: number, taskCount: number) => void;
}) {
  const icons: Record<string, string> = {
    write: '📝',
    speak: '🗣️',
    read: '📖',
    listen: '🎧',
    other: '✅'
  };

  const completedCount = completedTasks.filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">Check off tasks as you complete them</p>
        <span className="text-sm font-medium text-amber-700">
          {completedCount}/{tasks.length} completed
        </span>
      </div>
      {tasks.map((task, i) => (
        <div
          key={i}
          onClick={() => onToggleTask(i, tasks.length)}
          className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
            completedTasks[i]
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-amber-50 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
              completedTasks[i]
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-300 bg-white'
            }`}>
              {completedTasks[i] && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{icons[task.type] || '✅'}</span>
                <p className={`${completedTasks[i] ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                  {task.task}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  color = 'indigo',
  badge
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorClasses: Record<string, { bg: string; border: string; headerBg: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', headerBg: 'bg-gradient-to-r from-orange-500 to-orange-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', headerBg: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', headerBg: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', headerBg: 'bg-gradient-to-r from-teal-500 to-teal-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-gradient-to-r from-amber-500 to-amber-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', headerBg: 'bg-gradient-to-r from-rose-500 to-rose-600' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', headerBg: 'bg-gradient-to-r from-cyan-500 to-cyan-600' },
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${colors.border} overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${colors.headerBg} px-6 py-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {badge && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{badge}</span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-white" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white" />
        )}
      </button>

      {isOpen && (
        <div className={`p-6 ${colors.bg}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// Video Player Component
function VideoPlayer({
  url,
  title,
  daysUntilExpiry,
  expiresWarning
}: {
  url: string;
  title: string;
  daysUntilExpiry?: number;
  expiresWarning?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="rounded-2xl bg-gray-100 p-8 text-center">
        <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">Video unavailable. The recording may have expired.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium"
        >
          <Play className="w-4 h-4" />
          Try Opening Directly
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      {expiresWarning && daysUntilExpiry !== undefined && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="text-amber-800 text-sm font-medium">
            Recording expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} - download to keep
          </span>
        </div>
      )}
      <div className="aspect-video bg-black relative">
        <video
          src={url}
          controls
          className="w-full h-full"
          onError={() => setHasError(true)}
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium">{title}</span>
        </div>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>
    </div>
  );
}

export default function LessonInsights() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<LessonInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [recording, setRecording] = useState<RecordingData | null>(null);
  const [loadingRecording, setLoadingRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'lesson' | 'screen'>('lesson');
  const [lessonTime, setLessonTime] = useState<string | null>(null);

  // Homework tracking state
  const [completedTasks, setCompletedTasks] = useState<boolean[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<{ questionIndex: number; selectedAnswer: number; correct: boolean }[]>([]);
  const [studentNotes, setStudentNotes] = useState('');
  const [questionsForTeacher, setQuestionsForTeacher] = useState('');
  const [difficultyRating, setDifficultyRating] = useState<number>(0);
  const [submittingHomework, setSubmittingHomework] = useState(false);
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Download as PDF function - uses browser print for proper Arabic RTL support
  async function downloadAsPDF() {
    setDownloadingPDF(true);
    try {
      const element = document.getElementById('insights-content');
      if (!element) {
        alert('Could not find content to download');
        return;
      }

      // Load Arabic fonts via Google Fonts CSS
      const fontLinkId = 'arabic-fonts-for-pdf';
      let fontLink = document.getElementById(fontLinkId) as HTMLLinkElement;
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = fontLinkId;
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&display=swap';
        document.head.appendChild(fontLink);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await document.fonts.ready;

      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('Please allow popups to download PDF');
        return;
      }

      // Get computed styles
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch {
            return '';
          }
        })
        .join('\n');

      // Create print document with proper RTL support
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en" dir="ltr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${insight?.title || 'Lesson Insights'}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap">
          <style>
            ${styles}

            /* Print-specific styles */
            @media print {
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print\\:hidden { display: none !important; }
            }

            /* Reset for print */
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              color: #1e293b;
              padding: 20px;
              max-width: 210mm;
              margin: 0 auto;
            }

            /* Arabic text styles - critical for proper rendering */
            .font-arabic,
            [dir="rtl"],
            [lang="ar"] {
              font-family: 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', 'Arabic Typesetting', serif !important;
              direction: rtl !important;
              text-align: right !important;
              unicode-bidi: isolate !important;
            }

            /* Ensure Arabic in tables renders correctly */
            td[dir="rtl"],
            th[dir="rtl"],
            .arabic-cell {
              font-family: 'Noto Naskh Arabic', 'Amiri', serif !important;
              direction: rtl !important;
              unicode-bidi: isolate !important;
            }

            /* Fix dark backgrounds for print */
            .bg-slate-800, .bg-slate-900, .bg-gray-800, .bg-gray-900 {
              background: #f1f5f9 !important;
            }
            .text-white, .text-slate-100, .text-gray-100 {
              color: #1e293b !important;
            }

            /* Card styles for print */
            .rounded-xl, .rounded-2xl {
              border: 1px solid #e2e8f0 !important;
              background: white !important;
            }

            /* Colored accents should print */
            .bg-emerald-500\\/20, .bg-teal-500\\/20 { background: #d1fae5 !important; }
            .bg-blue-500\\/20, .bg-indigo-500\\/20 { background: #dbeafe !important; }
            .text-emerald-400, .text-emerald-500 { color: #059669 !important; }
            .text-blue-400, .text-blue-500 { color: #2563eb !important; }
            .text-cyan-400, .text-cyan-500 { color: #0891b2 !important; }
            .border-emerald-500\\/30 { border-color: #059669 !important; }
            .border-blue-500\\/30 { border-color: #2563eb !important; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
          <script>
            // Wait for fonts to load then print
            document.fonts.ready.then(() => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 500);
            });
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, [lessonId]);

  async function loadInsights() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Please sign in to view insights'); setLoading(false); return; }

      const { data: teacherProfile } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).maybeSingle();
      const isTeacher = !!teacherProfile;
      let learnerId: string | null = null;

      if (!isTeacher) {
        const { data: learner } = await supabase.from('learners').select('id').eq('parent_id', user.id).maybeSingle();
        if (!learner) { setError('Learner profile not found'); setLoading(false); return; }
        learnerId = learner.id;
      }

      const { data: lessonData } = await supabase
        .from('lessons')
        .select('"100ms_room_id", scheduled_time, recording_url, recording_expires_at')
        .eq('id', lessonId)
        .single();

      if (lessonData?.scheduled_time) {
        setLessonTime(lessonData.scheduled_time);
      }

      // First try to use recording_url from lesson table (most reliable)
      if (lessonData?.recording_url) {
        const expiresAt = lessonData.recording_expires_at ? new Date(lessonData.recording_expires_at) : null;
        const daysUntilExpiry = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
        setRecording({
          primary: {
            presigned_url: lessonData.recording_url,
            duration: 0
          },
          days_until_expiry: daysUntilExpiry ?? undefined,
          expires_warning: daysUntilExpiry !== null && daysUntilExpiry <= 2
        });
      } else if (lessonData?.['100ms_room_id']) {
        // Fallback to 100ms API
        fetchRecording(lessonData['100ms_room_id']);
      }

      let insightQuery = supabase.from('lesson_insights').select('*').eq('lesson_id', lessonId);
      if (learnerId) insightQuery = insightQuery.eq('learner_id', learnerId);
      // Order by detailed_insights to prefer insights with content, then by most recent
      insightQuery = insightQuery.order('created_at', { ascending: false }).limit(1);

      const { data: insightResults, error: insightError } = await insightQuery;
      const insightData = insightResults?.[0] || null;
      if (insightError?.code === 'PGRST116' || !insightData) {
        setError('Insights not yet generated for this lesson');
        setLoading(false);
        return;
      }
      if (insightError) throw insightError;

      setInsight(insightData);
      setRating(insightData.student_rating || 0);

      if (!insightData.viewed_by_student) {
        await supabase.from('lesson_insights').update({ viewed_by_student: true, student_viewed_at: new Date().toISOString() }).eq('id', insightData.id);
      }
    } catch (err: any) {
      console.error('Error loading insights:', err);
      setError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecording(roomId: string) {
    try {
      setLoadingRecording(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recording-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ room_id: roomId })
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recordings) {
          setRecording({
            primary: data.recordings.primary,
            screen_share: data.recordings.screen_share,
            transcript_url: data.transcript_url,
            days_until_expiry: data.days_until_expiry,
            expires_warning: data.expires_warning
          });
        }
      }
    } catch (err) {
      console.error('Error fetching recording:', err);
    } finally {
      setLoadingRecording(false);
    }
  }

  async function submitRating(newRating: number) {
    if (!insight) return;
    try {
      setSubmittingRating(true);
      const { error } = await supabase.from('lesson_insights').update({ student_rating: newRating }).eq('id', insight.id);
      if (error) throw error;
      setRating(newRating);
      setRatingSubmitted(true);
      setTimeout(() => setRatingSubmitted(false), 3000);
    } catch (err: any) {
      console.error('Error submitting rating:', err);
    } finally {
      setSubmittingRating(false);
    }
  }

  // Toggle homework task completion - note: homeworkTasks will be available in scope when this is called
  function toggleTask(index: number, taskCount: number) {
    setCompletedTasks(prev => {
      // Initialize if needed
      const current = prev.length === taskCount ? prev : new Array(taskCount).fill(false);
      const updated = [...current];
      updated[index] = !updated[index];
      return updated;
    });
  }

  // Submit homework
  async function submitHomework() {
    if (!insight || !lessonId) return;

    try {
      setSubmittingHomework(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get learner ID
      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      // Get teacher ID from lesson
      const { data: lesson } = await supabase
        .from('lessons')
        .select('teacher_id')
        .eq('id', lessonId)
        .single();

      const submissionData = {
        lesson_id: lessonId,
        insight_id: insight.id,
        learner_id: learner?.id,
        teacher_id: lesson?.teacher_id,
        parent_id: user.id,
        quiz_answers: quizAnswers,
        quiz_score: quizAnswers.filter(a => a.correct).length,
        quiz_total: quizAnswers.length,
        quiz_completed_at: quizAnswers.length > 0 ? new Date().toISOString() : null,
        completed_tasks: completedTasks.map((completed, i) => ({
          task: homeworkTasks[i]?.task || '',
          completed,
          completedAt: completed ? new Date().toISOString() : null
        })),
        tasks_completed_count: completedTasks.filter(Boolean).length,
        tasks_total_count: homeworkTasks.length,
        student_notes: studentNotes || null,
        questions_for_teacher: questionsForTeacher || null,
        difficulty_rating: difficultyRating || null,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('homework_submissions')
        .upsert(submissionData, { onConflict: 'lesson_id,learner_id' });

      if (error) throw error;

      setHomeworkSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting homework:', err);
      alert('Failed to submit homework. Please try again.');
    } finally {
      setSubmittingHomework(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">Loading your lesson insights...</p>
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">{error || 'Insights not available'}</h2>
          <p className="text-gray-500 text-center text-sm mb-6">The insights for this lesson may still be processing.</p>
          <button onClick={() => navigate(-1)} className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const metadata = insight.detailed_insights?.metadata;
  const isQuran = insight.insight_type === 'quran_tadabbur' || insight.detailed_insights?.subject?.toLowerCase().includes('quran') || metadata?.subject?.toLowerCase().includes('quran');
  const hasDetailedInsights = !!insight.detailed_insights?.content;

  // Parse all sections
  const sections = hasDetailedInsights ? parseInsightSections(insight.detailed_insights!.content) : [];

  // Parse specific content types
  const vocabSection = sections.find(s => s.type === 'vocabulary');
  const vocabulary = vocabSection ? parseVocabulary(vocabSection.content) : [];

  const sentenceSection = sections.find(s => s.type === 'sentences');
  const sentences = sentenceSection ? parseKeySentences(sentenceSection.content) : [];

  const grammarSection = sections.find(s => s.type === 'grammar');
  const grammarPoints = grammarSection ? parseGrammarPoints(grammarSection.content) : [];

  const notesSection = sections.find(s => s.type === 'notes');
  const teacherNotes = notesSection ? parseTeacherNotes(notesSection.content) : [];

  const tafsirSection = sections.find(s => s.type === 'tafsir');
  const tafsirPoints = tafsirSection ? parseTafsirPoints(tafsirSection.content) : [];

  const dialogueSection = sections.find(s => s.type === 'dialogue');
  const dialogues = dialogueSection ? parseDialogues(dialogueSection.content) : [];

  const quizSection = sections.find(s => s.type === 'quiz');
  const quizQuestions = quizSection ? parseQuizQuestions(quizSection.content) : [];

  const homeworkSection = sections.find(s => s.type === 'homework');
  const homeworkTasks = homeworkSection ? parseHomework(homeworkSection.content) : [];

  const prompterSection = sections.find(s => s.type === 'prompter');
  const firstWordPrompts = prompterSection ? parseFirstWordPrompter(prompterSection.content) : [];

  const summarySection = sections.find(s => s.type === 'summary');
  const takeawaysSection = sections.find(s => s.type === 'takeaways');

  const effectiveCompletedTasks = completedTasks.length === homeworkTasks.length
    ? completedTasks
    : new Array(homeworkTasks.length).fill(false);

  return (
    <>
      <style>{`
        @media print { body { background: white !important; } .print\\:hidden { display: none !important; } }
        .font-arabic, [dir="rtl"] {
          font-family: 'Noto Naskh Arabic', 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif !important;
          font-feature-settings: normal;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }
        /* Ensure Arabic text displays correctly - use 'embed' NOT 'bidi-override' */
        [dir="rtl"] {
          unicode-bidi: embed;
          direction: rtl;
          text-align: right;
        }
        /* Prevent html2canvas from reversing Arabic text */
        .font-arabic {
          unicode-bidi: embed;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 print:hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-3">
              <Breadcrumbs
                items={[
                  { label: 'Dashboard', path: '/dashboard' },
                  { label: 'Lesson Insights' }
                ]}
                homePath="/dashboard"
              />
              <div className="flex items-center justify-between">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition font-medium">
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition" title="Print">
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={downloadAsPDF}
                    disabled={downloadingPDF}
                    className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition disabled:opacity-50"
                    title="Download PDF"
                  >
                    {downloadingPDF ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="insights-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Hero Card */}
          <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-white shadow-xl ${
            isQuran ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700' : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700'
          }`}>
            <div className="flex flex-col gap-4">
              {/* Title row */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {isQuran ? <BookMarked className="w-6 h-6" /> : <Book className="w-6 h-6" />}
                </div>
                <h1 className="text-xl md:text-2xl font-bold">{cleanMarkdown(insight.title)}</h1>
              </div>

              {/* Details row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90 text-sm bg-white/10 rounded-xl px-4 py-3">
                {(lessonTime || metadata?.lesson_date) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(lessonTime || metadata!.lesson_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {(lessonTime || metadata?.lesson_date) && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(lessonTime || metadata!.lesson_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {metadata?.teacher_name && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{metadata.teacher_name}</span>
                  </div>
                )}
                {/* For Quran - show Surah info */}
                {isQuran && metadata?.surah_name && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Surah {metadata.surah_name}{metadata.ayah_range ? ` (${metadata.ayah_range})` : ''}</span>
                  </div>
                )}
                {/* For Arabic - extract book/unit from title if present */}
                {!isQuran && insight.title && (insight.title.toLowerCase().includes('book') || insight.title.toLowerCase().includes('unit')) && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {insight.title.match(/book\s*\d+[ab]?/i)?.[0] || ''}
                      {insight.title.match(/unit\s*\d+/i)?.[0] ? ` ${insight.title.match(/unit\s*\d+/i)?.[0]}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Card */}
          {summarySection && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">At a Glance</h2>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700">
                {cleanMarkdown(summarySection.content).split('\n').filter(l => l.trim()).map((line, i) => (
                  <p key={i} className="flex items-start gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{cleanMarkdown(line)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Focus Words with Flip Cards */}
          {vocabulary.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-4 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-gray-900">Focus Words</h2>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{vocabulary.length} words</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Tap any card to reveal the English meaning. Pro tip: Print this page, cut out the cards, and write the English on the back for flashcard practice!
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vocabulary.map((word, idx) => (
                  <FlipCard key={idx} word={word} index={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Video Recording */}
          {(recording?.primary?.presigned_url || loadingRecording) && (
            <div className="mb-6 print:hidden">
              {loadingRecording ? (
                <div className="bg-gray-100 rounded-2xl p-8 flex items-center justify-center">
                  <Loader className="w-6 h-6 text-gray-400 animate-spin mr-3" />
                  <span className="text-gray-500">Loading recording...</span>
                </div>
              ) : recording?.primary?.presigned_url ? (
                <div className="space-y-3">
                  {recording.screen_share?.presigned_url && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('lesson')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                          activeTab === 'lesson' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        Lesson Video
                      </button>
                      <button
                        onClick={() => setActiveTab('screen')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                          activeTab === 'screen' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        Screen Share
                      </button>
                    </div>
                  )}
                  {activeTab === 'lesson' && recording.primary?.presigned_url && (
                    <VideoPlayer url={recording.primary.presigned_url} title="Lesson Recording" daysUntilExpiry={recording.days_until_expiry} expiresWarning={recording.expires_warning} />
                  )}
                  {activeTab === 'screen' && recording.screen_share?.presigned_url && (
                    <VideoPlayer url={recording.screen_share.presigned_url} title="Screen Share" daysUntilExpiry={recording.days_until_expiry} expiresWarning={recording.expires_warning} />
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Detailed Sections */}
          <div className="space-y-4">

            {/* Key Sentences / Verses Covered */}
            {sentences.length > 0 && (
              <CollapsibleSection
                title={isQuran ? "Key Verses" : "Key Sentences"}
                icon={MessageCircle}
                color="cyan"
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {sentences.map((sentence, i) => (
                    <KeySentenceCard key={i} sentence={sentence} isQuran={isQuran} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* First Word Prompter - only for Quran */}
            {firstWordPrompts.length > 0 && isQuran && (
              <CollapsibleSection
                title="First Word Prompter"
                icon={BookMarked}
                color="emerald"
                defaultOpen={true}
                badge={`${firstWordPrompts.reduce((acc, t) => acc + t.prompts.length, 0)} ayahs`}
              >
                <FirstWordPrompterCard themes={firstWordPrompts} />
              </CollapsibleSection>
            )}

            {/* Grammar Focus - hide for Quran (use Tajweed instead) */}
            {grammarPoints.length > 0 && !isQuran && (
              <CollapsibleSection title="Grammar Focus" icon={PenTool} color="orange">
                <div className="space-y-4">
                  {grammarPoints.map((point, i) => (
                    <GrammarCard key={i} point={point} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Tafsir Points - Detailed verse commentary */}
            {tafsirPoints.length > 0 && (
              <CollapsibleSection title="Tafsir & Commentary" icon={BookMarked} color="teal" defaultOpen={true}>
                <p className="text-sm text-gray-600 mb-4">
                  Tap each verse to expand and read the detailed tafsir, scholar commentary, and reflection prompts.
                </p>
                <div className="space-y-3">
                  {tafsirPoints.map((point, i) => (
                    <TafsirCard key={i} point={point} index={i} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Teacher Notes */}
            {teacherNotes.length > 0 && (
              <CollapsibleSection title="Teacher Notes & Corrections" icon={Lightbulb} color="purple">
                <div className="space-y-3">
                  {teacherNotes.map((note, i) => (
                    <TeacherNoteCard key={i} note={note} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Conversation Practice */}
            {dialogues.length > 0 && (
              <CollapsibleSection title="Conversation Practice" icon={MessageCircle} color="blue">
                <p className="text-sm text-gray-600 mb-4">Practice these dialogues aloud. Say the Arabic, then check your pronunciation.</p>
                <div className="space-y-3">
                  {dialogues.map((line, i) => (
                    <DialogueCard key={i} line={line} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Mini Quiz */}
            {quizQuestions.length > 0 && (
              <CollapsibleSection title="Mini Quiz" icon={Target} color="indigo" badge={`${quizQuestions.length} questions`} defaultOpen={true}>
                <InteractiveQuiz questions={quizQuestions} onAnswerUpdate={setQuizAnswers} />
              </CollapsibleSection>
            )}

            {/* Homework */}
            {homeworkTasks.length > 0 && (
              <CollapsibleSection title="Homework & Practice Tasks" icon={BookOpen} color="amber" badge={`${effectiveCompletedTasks.filter(Boolean).length}/${homeworkTasks.length}`}>
                <HomeworkCard tasks={homeworkTasks} completedTasks={effectiveCompletedTasks} onToggleTask={toggleTask} />
              </CollapsibleSection>
            )}

            {/* Key Takeaways */}
            {takeawaysSection && (
              <CollapsibleSection title="Key Takeaways" icon={Trophy} color="teal">
                <div className="space-y-2">
                  {cleanMarkdown(takeawaysSection.content).split('\n').filter(l => l.trim()).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-teal-100">
                      <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{cleanMarkdown(line)}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Homework Submission Section */}
          {(homeworkTasks.length > 0 || quizQuestions.length > 0) && (
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-sm border border-cyan-200 p-4 sm:p-6 mt-6 sm:mt-8 print:hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Submit Your Homework</h3>
                  <p className="text-sm text-gray-600">Complete the tasks above and submit for teacher review</p>
                </div>
              </div>

              {homeworkSubmitted ? (
                <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-emerald-800 mb-1">Homework Submitted!</h4>
                  <p className="text-emerald-700">Your teacher will review your work soon.</p>
                </div>
              ) : (
                <>
                  {/* Progress Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {quizQuestions.length > 0 && (
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                          <Target className="w-4 h-4" />
                          <span className="text-sm font-medium">Quiz</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {quizAnswers.filter(a => a.correct).length}/{quizQuestions.length} correct
                        </p>
                      </div>
                    )}
                    {homeworkTasks.length > 0 && (
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-sm font-medium">Tasks</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {completedTasks.filter(Boolean).length}/{homeworkTasks.length} done
                        </p>
                      </div>
                    )}
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">Difficulty</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <button
                            key={level}
                            onClick={() => setDifficultyRating(level)}
                            className={`w-6 h-6 rounded-full text-xs font-bold transition ${
                              difficultyRating >= level
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 text-gray-500 hover:bg-purple-100'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4" />
                        Your Notes (optional)
                      </label>
                      <textarea
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        placeholder="Write any notes about what you learned, what you found interesting, or what you want to remember..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <HelpCircle className="w-4 h-4" />
                        Questions for Teacher (optional)
                      </label>
                      <textarea
                        value={questionsForTeacher}
                        onChange={(e) => setQuestionsForTeacher(e.target.value)}
                        placeholder="Any questions you'd like to ask your teacher about this lesson?"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={submitHomework}
                    disabled={submittingHomework}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingHomework ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Homework
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Rating Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6 sm:mt-8 print:hidden">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How was this lesson?</h3>
              <p className="text-gray-500 text-sm mb-4">Your feedback helps us improve</p>

              <div className="flex items-center justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    onClick={() => submitRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={submittingRating}
                    className="transition-all hover:scale-110 disabled:opacity-50 p-1"
                  >
                    <Star className={`w-8 h-8 transition-colors ${starValue <= (hoveredRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>

              {ratingSubmitted && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-2 px-4 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Thanks for your feedback!</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 mt-8 pb-8">
            <p>Talbiyah.ai - Your Islamic Learning Companion</p>
          </div>
        </main>
      </div>
    </>
  );
}
