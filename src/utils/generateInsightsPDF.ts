import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: { finalY: number };
  }
}

// Arabic font loading - using Amiri Quran for proper Uthmani script
let arabicFontLoaded = false;
let arabicFontBase64: string | null = null;

// Check if text contains Arabic characters
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

async function loadArabicFont(): Promise<string | null> {
  if (arabicFontBase64) return arabicFontBase64;

  try {
    // Amiri Quran for proper Uthmani script with tashkeel
    // Fallback to Amiri regular and Noto Naskh
    const fontUrls = [
      'https://fonts.gstatic.com/s/amiriquran/v7/_Xm4-HfI5MFmLCUOWR0HcLKqYxI.ttf',
      'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.ttf',
      'https://fonts.gstatic.com/s/notonaskharabic/v33/RrQ5bpV-9Dd1b1OAGA6M9PkyDuVBePeKNaxcsss0Y7bwvc5krK0z9_Mnuw.ttf'
    ];

    for (const url of fontUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          arabicFontBase64 = btoa(binary);
          console.log('Arabic font loaded successfully from:', url);
          return arabicFontBase64;
        }
      } catch (e) {
        console.warn('Failed to load font from:', url, e);
      }
    }
    throw new Error('All font URLs failed');
  } catch (error) {
    console.error('Failed to load Arabic font:', error);
    return null;
  }
}

async function setupArabicFont(doc: jsPDF): Promise<boolean> {
  if (arabicFontLoaded && arabicFontBase64) {
    doc.addFileToVFS('AmiriQuran-Regular.ttf', arabicFontBase64);
    doc.addFont('AmiriQuran-Regular.ttf', 'AmiriQuran', 'normal');
    return true;
  }

  const fontData = await loadArabicFont();
  if (fontData) {
    doc.addFileToVFS('AmiriQuran-Regular.ttf', fontData);
    doc.addFont('AmiriQuran-Regular.ttf', 'AmiriQuran', 'normal');
    arabicFontLoaded = true;
    return true;
  }
  return false;
}

export type TemplateType = 'quran' | 'arabic' | 'reverts';

export interface InsightMetadata {
  title: string;
  templateType: TemplateType;
  teacherName: string;
  studentName?: string;
  lessonDate: string;
  durationMinutes?: number;
  tags?: string[];
}

export interface QuranInsightContent {
  lessonSummary: string;
  versesCovered: {
    surah: string;
    ayahRange: string;
  };
  tajweedPoints: Array<{
    rule: string;
    explanation: string;
    examples?: string[];
  }>;
  vocabulary: Array<{
    arabic: string;
    transliteration: string;
    meaning: string;
    root?: string;
  }>;
  tafsirPoints: string[];
  memorizationProgress: {
    versesReviewed: string;
    newVerses: string;
    notes?: string;
  };
  practiceRecommendations: string[];
  nextLessonPreview?: string;
}

export interface ArabicInsightContent {
  lessonSummary: string;
  vocabulary: Array<{
    arabic: string;
    transliteration: string;
    english: string;
    wordType: string;
    exampleSentence?: string;
  }>;
  grammarPoints: Array<{
    topic: string;
    explanation: string;
    examples: Array<{ arabic: string; english: string }>;
    commonMistakes?: string;
  }>;
  conversationPhrases: Array<{
    arabic: string;
    transliteration: string;
    english: string;
    context?: string;
  }>;
  commonMistakes: Array<{
    mistake: string;
    correction: string;
  }>;
  homeworkExercises: Array<{
    task: string;
    type: string;
  }>;
  recommendedResources: Array<{
    title: string;
    type: string;
    description?: string;
  }>;
}

export interface RevertsInsightContent {
  topicSummary: string;
  keyConcepts: Array<{
    concept: string;
    explanation: string;
    importance?: string;
    arabicTerm?: string;
    transliteration?: string;
  }>;
  practicalApplications: Array<{
    topic: string;
    howTo: string;
    tips?: string;
  }>;
  questionsAnswered: Array<{
    question: string;
    answer: string;
    additionalNotes?: string;
  }>;
  quranReferences: Array<{
    surah: string;
    ayah: string;
    arabic?: string;
    translation: string;
    context?: string;
  }>;
  hadithReferences: Array<{
    text: string;
    source: string;
    context?: string;
  }>;
  actionItems: Array<{
    action: string;
    frequency: string;
    tips?: string;
  }>;
  recommendedReading: Array<{
    title: string;
    author?: string;
    description?: string;
  }>;
  encouragementNote?: string;
}

type InsightContent = QuranInsightContent | ArabicInsightContent | RevertsInsightContent;

// Colors
const COLORS = {
  primary: [6, 182, 212] as [number, number, number],      // Cyan #06B6D4
  secondary: [59, 130, 246] as [number, number, number],   // Blue #3B82F6
  dark: [15, 23, 42] as [number, number, number],          // Slate-900
  text: [51, 65, 85] as [number, number, number],          // Slate-700
  lightText: [100, 116, 139] as [number, number, number],  // Slate-500
  background: [248, 250, 252] as [number, number, number], // Slate-50
  white: [255, 255, 255] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],      // Green
  warning: [234, 179, 8] as [number, number, number],      // Yellow
  purple: [168, 85, 247] as [number, number, number],      // Purple for reverts
};

const TEMPLATE_COLORS = {
  quran: COLORS.success,
  arabic: COLORS.secondary,
  reverts: COLORS.purple,
};

const TEMPLATE_NAMES = {
  quran: 'Quran Lesson Insights',
  arabic: 'Arabic Language Insights',
  reverts: 'New Muslim Class Insights',
};

const SECTION_ICONS = {
  summary: '📝',
  verses: '📖',
  tajweed: '🎙️',
  vocabulary: '📚',
  tafsir: '💡',
  memorization: '📈',
  practice: '✏️',
  next: '➡️',
  grammar: '📐',
  conversation: '💬',
  mistakes: '⚠️',
  homework: '📝',
  resources: '🔗',
  concepts: '🕌',
  practical: '🛠️',
  questions: '❓',
  quran: '📖',
  hadith: '📜',
  actions: '✅',
  reading: '📚',
  encouragement: '💚',
};

export function generateInsightsPDF(
  metadata: InsightMetadata,
  content: InsightContent
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const accentColor = TEMPLATE_COLORS[metadata.templateType];

  // Helper functions
  const addNewPage = () => {
    doc.addPage();
    yPos = margin;
    addFooter();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - 25) {
      addNewPage();
      return true;
    }
    return false;
  };

  const addFooter = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.lightText);
    doc.text(
      `Generated by Talbiyah.ai | www.talbiyah.ai`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  };

  // Draw header
  const drawHeader = () => {
    // Gradient-like header background
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Logo text
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Talbiyah.ai', margin, 18);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(TEMPLATE_NAMES[metadata.templateType], margin, 28);

    // Title and date on right
    doc.setFontSize(10);
    doc.text(metadata.title, pageWidth - margin, 18, { align: 'right' });
    doc.text(
      formatDate(metadata.lessonDate),
      pageWidth - margin,
      26,
      { align: 'right' }
    );

    // Teacher info
    if (metadata.teacherName) {
      doc.text(`Teacher: ${metadata.teacherName}`, pageWidth - margin, 34, {
        align: 'right',
      });
    }

    yPos = 55;
  };

  const drawSectionHeader = (title: string, icon: string) => {
    checkPageBreak(15);

    doc.setFillColor(...COLORS.background);
    doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');

    doc.setTextColor(...accentColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${icon} ${title}`, margin + 3, yPos + 7);

    yPos += 14;
  };

  const drawParagraph = (text: string, indent = 0) => {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = 5;
    const neededHeight = lines.length * lineHeight;

    checkPageBreak(neededHeight);

    doc.text(lines, margin + indent, yPos);
    yPos += neededHeight + 3;
  };

  const drawBulletPoint = (text: string, bulletChar = '•') => {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const bulletIndent = 5;
    const textIndent = 10;
    const lines = doc.splitTextToSize(text, contentWidth - textIndent);
    const lineHeight = 5;
    const neededHeight = lines.length * lineHeight;

    checkPageBreak(neededHeight);

    doc.setTextColor(...accentColor);
    doc.text(bulletChar, margin + bulletIndent, yPos);
    doc.setTextColor(...COLORS.text);
    doc.text(lines, margin + textIndent, yPos);

    yPos += neededHeight + 2;
  };

  const drawKeyValuePair = (key: string, value: string) => {
    checkPageBreak(8);

    doc.setTextColor(...COLORS.lightText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(key + ':', margin + 5, yPos);

    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, yPos);

    yPos += 6;
  };

  const drawHighlightBox = (text: string, bgColor = COLORS.background) => {
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    const lineHeight = 5;
    const boxHeight = lines.length * lineHeight + 8;

    checkPageBreak(boxHeight);

    doc.setFillColor(...bgColor);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'F');

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(lines, margin + 5, yPos + 6);

    yPos += boxHeight + 5;
  };

  const drawTable = (
    headers: string[],
    rows: string[][],
    columnWidths?: number[]
  ) => {
    checkPageBreak(30);

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: accentColor,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        textColor: COLORS.text,
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: COLORS.background,
      },
      columnStyles: columnWidths
        ? Object.fromEntries(
            columnWidths.map((w, i) => [i, { cellWidth: w }])
          )
        : {},
      didDrawPage: () => {
        addFooter();
      },
    });

    yPos = doc.lastAutoTable.finalY + 8;
  };

  // Main rendering
  drawHeader();
  addFooter();

  // Student name if personalized
  if (metadata.studentName) {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Prepared for: ${metadata.studentName}`, margin, yPos);
    yPos += 8;
  }

  // Duration and tags
  if (metadata.durationMinutes || (metadata.tags && metadata.tags.length > 0)) {
    doc.setTextColor(...COLORS.lightText);
    doc.setFontSize(9);
    let infoText = '';
    if (metadata.durationMinutes) {
      infoText += `Duration: ${metadata.durationMinutes} minutes`;
    }
    if (metadata.tags && metadata.tags.length > 0) {
      if (infoText) infoText += ' | ';
      infoText += `Topics: ${metadata.tags.join(', ')}`;
    }
    doc.text(infoText, margin, yPos);
    yPos += 8;
  }

  // Render content based on template type
  switch (metadata.templateType) {
    case 'quran':
      renderQuranContent(
        content as QuranInsightContent,
        drawSectionHeader,
        drawParagraph,
        drawBulletPoint,
        drawKeyValuePair,
        drawTable,
        drawHighlightBox
      );
      break;
    case 'arabic':
      renderArabicContent(
        content as ArabicInsightContent,
        drawSectionHeader,
        drawParagraph,
        drawBulletPoint,
        drawTable,
        drawHighlightBox
      );
      break;
    case 'reverts':
      renderRevertsContent(
        content as RevertsInsightContent,
        drawSectionHeader,
        drawParagraph,
        drawBulletPoint,
        drawTable,
        drawHighlightBox
      );
      break;
  }

  return doc;
}

function renderQuranContent(
  content: QuranInsightContent,
  drawSectionHeader: (title: string, icon: string) => void,
  drawParagraph: (text: string, indent?: number) => void,
  drawBulletPoint: (text: string, bulletChar?: string) => void,
  drawKeyValuePair: (key: string, value: string) => void,
  drawTable: (headers: string[], rows: string[][], columnWidths?: number[]) => void,
  drawHighlightBox: (text: string) => void
) {
  // Lesson Summary
  if (content.lessonSummary) {
    drawSectionHeader('Lesson Summary', SECTION_ICONS.summary);
    drawHighlightBox(content.lessonSummary);
  }

  // Verses Covered
  if (content.versesCovered?.surah) {
    drawSectionHeader('Verses Covered', SECTION_ICONS.verses);
    drawKeyValuePair('Surah', content.versesCovered.surah);
    drawKeyValuePair('Ayaat', content.versesCovered.ayahRange);
  }

  // Tajweed Points
  if (content.tajweedPoints?.length > 0) {
    drawSectionHeader('Tajweed Points Learned', SECTION_ICONS.tajweed);
    content.tajweedPoints.forEach((point) => {
      drawBulletPoint(`${point.rule}: ${point.explanation}`);
      if (point.examples?.length) {
        point.examples.forEach((ex) => drawParagraph(`Example: ${ex}`, 15));
      }
    });
  }

  // Vocabulary
  if (content.vocabulary?.length > 0) {
    drawSectionHeader('New Vocabulary', SECTION_ICONS.vocabulary);
    const headers = ['Arabic', 'Transliteration', 'Meaning', 'Root'];
    const rows = content.vocabulary.map((v) => [
      v.arabic,
      v.transliteration,
      v.meaning,
      v.root || '-',
    ]);
    drawTable(headers, rows, [35, 40, 60, 25]);
  }

  // Tafsir Points
  if (content.tafsirPoints?.length > 0) {
    drawSectionHeader('Key Tafsir Points', SECTION_ICONS.tafsir);
    content.tafsirPoints.forEach((point) => {
      drawBulletPoint(point, '💡');
    });
  }

  // Memorization Progress
  if (content.memorizationProgress) {
    drawSectionHeader('Memorization Progress', SECTION_ICONS.memorization);
    drawKeyValuePair('Reviewed', content.memorizationProgress.versesReviewed);
    drawKeyValuePair('New Verses', content.memorizationProgress.newVerses);
    if (content.memorizationProgress.notes) {
      drawParagraph(`Notes: ${content.memorizationProgress.notes}`, 5);
    }
  }

  // Practice Recommendations
  if (content.practiceRecommendations?.length > 0) {
    drawSectionHeader('Practice Recommendations', SECTION_ICONS.practice);
    content.practiceRecommendations.forEach((rec, i) => {
      drawBulletPoint(rec, `${i + 1}.`);
    });
  }

  // Next Lesson Preview
  if (content.nextLessonPreview) {
    drawSectionHeader('Next Lesson Preview', SECTION_ICONS.next);
    drawParagraph(content.nextLessonPreview);
  }
}

function renderArabicContent(
  content: ArabicInsightContent,
  drawSectionHeader: (title: string, icon: string) => void,
  drawParagraph: (text: string, indent?: number) => void,
  drawBulletPoint: (text: string, bulletChar?: string) => void,
  drawTable: (headers: string[], rows: string[][], columnWidths?: number[]) => void,
  drawHighlightBox: (text: string) => void
) {
  // Lesson Summary
  if (content.lessonSummary) {
    drawSectionHeader('Lesson Summary', SECTION_ICONS.summary);
    drawHighlightBox(content.lessonSummary);
  }

  // Vocabulary Table
  if (content.vocabulary?.length > 0) {
    drawSectionHeader('New Vocabulary', SECTION_ICONS.vocabulary);
    const headers = ['Arabic', 'Transliteration', 'English', 'Type'];
    const rows = content.vocabulary.map((v) => [
      v.arabic,
      v.transliteration,
      v.english,
      v.wordType,
    ]);
    drawTable(headers, rows, [35, 40, 50, 30]);
  }

  // Grammar Points
  if (content.grammarPoints?.length > 0) {
    drawSectionHeader('Grammar Points Covered', SECTION_ICONS.grammar);
    content.grammarPoints.forEach((point) => {
      drawBulletPoint(`${point.topic}: ${point.explanation}`, '📐');
      point.examples?.forEach((ex) => {
        drawParagraph(`${ex.arabic} → ${ex.english}`, 15);
      });
      if (point.commonMistakes) {
        drawParagraph(`⚠️ Common mistake: ${point.commonMistakes}`, 10);
      }
    });
  }

  // Conversation Phrases
  if (content.conversationPhrases?.length > 0) {
    drawSectionHeader('Conversation Phrases', SECTION_ICONS.conversation);
    const headers = ['Arabic', 'Transliteration', 'English'];
    const rows = content.conversationPhrases.map((p) => [
      p.arabic,
      p.transliteration,
      p.english,
    ]);
    drawTable(headers, rows, [50, 50, 60]);
  }

  // Common Mistakes
  if (content.commonMistakes?.length > 0) {
    drawSectionHeader('Common Mistakes to Avoid', SECTION_ICONS.mistakes);
    content.commonMistakes.forEach((m) => {
      drawBulletPoint(`❌ ${m.mistake} → ✅ ${m.correction}`);
    });
  }

  // Homework
  if (content.homeworkExercises?.length > 0) {
    drawSectionHeader('Homework / Practice Exercises', SECTION_ICONS.homework);
    content.homeworkExercises.forEach((hw, i) => {
      drawBulletPoint(`${hw.task} (${hw.type})`, `${i + 1}.`);
    });
  }

  // Resources
  if (content.recommendedResources?.length > 0) {
    drawSectionHeader('Recommended Resources', SECTION_ICONS.resources);
    content.recommendedResources.forEach((res) => {
      drawBulletPoint(
        `${res.title} (${res.type})${res.description ? ` - ${res.description}` : ''}`,
        '🔗'
      );
    });
  }
}

function renderRevertsContent(
  content: RevertsInsightContent,
  drawSectionHeader: (title: string, icon: string) => void,
  drawParagraph: (text: string, indent?: number) => void,
  drawBulletPoint: (text: string, bulletChar?: string) => void,
  drawTable: (headers: string[], rows: string[][], columnWidths?: number[]) => void,
  drawHighlightBox: (text: string) => void
) {
  // Topic Summary
  if (content.topicSummary) {
    drawSectionHeader('Topic Summary', SECTION_ICONS.summary);
    drawHighlightBox(content.topicSummary);
  }

  // Key Islamic Concepts
  if (content.keyConcepts?.length > 0) {
    drawSectionHeader('Key Islamic Concepts', SECTION_ICONS.concepts);
    content.keyConcepts.forEach((concept) => {
      let title = concept.concept;
      if (concept.arabicTerm) {
        title += ` (${concept.arabicTerm}`;
        if (concept.transliteration) title += ` - ${concept.transliteration}`;
        title += ')';
      }
      drawBulletPoint(title, '🕌');
      drawParagraph(concept.explanation, 10);
      if (concept.importance) {
        drawParagraph(`Why it matters: ${concept.importance}`, 10);
      }
    });
  }

  // Practical Applications
  if (content.practicalApplications?.length > 0) {
    drawSectionHeader('Practical Applications', SECTION_ICONS.practical);
    content.practicalApplications.forEach((app) => {
      drawBulletPoint(app.topic, '🛠️');
      drawParagraph(`How to: ${app.howTo}`, 10);
      if (app.tips) {
        drawParagraph(`💡 Tip: ${app.tips}`, 10);
      }
    });
  }

  // Questions Answered
  if (content.questionsAnswered?.length > 0) {
    drawSectionHeader('Common Questions Answered', SECTION_ICONS.questions);
    content.questionsAnswered.forEach((qa) => {
      drawBulletPoint(`Q: ${qa.question}`, '❓');
      drawParagraph(`A: ${qa.answer}`, 10);
      if (qa.additionalNotes) {
        drawParagraph(`Note: ${qa.additionalNotes}`, 10);
      }
    });
  }

  // Quran References
  if (content.quranReferences?.length > 0) {
    drawSectionHeader("Qur'an References", SECTION_ICONS.quran);
    content.quranReferences.forEach((ref) => {
      drawBulletPoint(`Surah ${ref.surah}, Ayah ${ref.ayah}`, '📖');
      if (ref.arabic) {
        drawParagraph(ref.arabic, 10);
      }
      drawParagraph(`"${ref.translation}"`, 10);
      if (ref.context) {
        drawParagraph(`Context: ${ref.context}`, 10);
      }
    });
  }

  // Hadith References
  if (content.hadithReferences?.length > 0) {
    drawSectionHeader('Hadith References', SECTION_ICONS.hadith);
    content.hadithReferences.forEach((ref) => {
      drawBulletPoint(`"${ref.text}"`, '📜');
      drawParagraph(`Source: ${ref.source}`, 10);
      if (ref.context) {
        drawParagraph(`Context: ${ref.context}`, 10);
      }
    });
  }

  // Action Items
  if (content.actionItems?.length > 0) {
    drawSectionHeader('Action Items for This Week', SECTION_ICONS.actions);
    content.actionItems.forEach((item, i) => {
      drawBulletPoint(`${item.action} (${item.frequency})`, `${i + 1}.`);
      if (item.tips) {
        drawParagraph(`Tip: ${item.tips}`, 15);
      }
    });
  }

  // Recommended Reading
  if (content.recommendedReading?.length > 0) {
    drawSectionHeader('Recommended Reading & Videos', SECTION_ICONS.reading);
    content.recommendedReading.forEach((rec) => {
      let text = rec.title;
      if (rec.author) text += ` by ${rec.author}`;
      if (rec.description) text += ` - ${rec.description}`;
      drawBulletPoint(text, '📚');
    });
  }

  // Encouragement Note
  if (content.encouragementNote) {
    drawSectionHeader('Encouragement', SECTION_ICONS.encouragement);
    drawHighlightBox(`"${content.encouragementNote}"`);
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

export function getPDFDataUri(doc: jsPDF): string {
  return doc.output('datauristring');
}

// =============================================
// TALBIYAH INSIGHTS (Khutba Study Notes) PDF
// =============================================

interface TalbiyahInsightsData {
  title: string;
  speaker?: string;
  khutba_date?: string;
  location?: string;
  cleaned_transcript?: string;
  main_points?: Array<{ point: string; reflection: string }>;
  quranic_words_phrases?: Array<{
    arabic: string;
    transliteration: string;
    meaning: string;
    context: string;
    quran_reference?: string;
  }>;
  key_vocabulary?: Array<{ term: string; arabic?: string; definition: string }>;
  key_themes?: Array<{ theme: string; explanation: string }>;
  quran_references?: Array<{
    arabic?: string;
    translation: string;
    reference: string;
    reflection: string;
  }>;
  hadith_references?: Array<{
    arabic?: string;
    translation: string;
    reference: string;
    reflection: string;
  }>;
  action_items?: Array<{ action: string; how_to: string }>;
  memory_aids?: Array<{ concept: string; memory_tip: string }>;
  quiz?: {
    multiple_choice?: Array<{
      question: string;
      options: string[];
      correct_answer: string;
      explanation: string;
    }>;
    short_answer?: Array<{ question: string; suggested_answer: string }>;
    reflection?: string[];
  };
  homework?: Array<{ task: string; description: string; duration: string }>;
  summary_for_children?: string;
  summary_for_teens?: string;
  family_discussion_guide?: string[];
}

export async function generateTalbiyahInsightsPDF(data: TalbiyahInsightsData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load Arabic font (Uthmani/Quranic script)
  const hasArabicFont = await setupArabicFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Beautiful color palette
  const AMBER = [217, 119, 6] as [number, number, number];       // Darker amber for better contrast
  const EMERALD = [5, 150, 105] as [number, number, number];     // Rich emerald
  const TEAL = [13, 148, 136] as [number, number, number];       // Teal accent
  const SLATE_800 = [30, 41, 59] as [number, number, number];    // Dark slate for text
  const SLATE_700 = [51, 65, 85] as [number, number, number];    // Dark medium slate
  const SLATE_600 = [71, 85, 105] as [number, number, number];   // Medium slate
  const SLATE_400 = [148, 163, 184] as [number, number, number]; // Light slate
  const SLATE_500 = [100, 116, 139] as [number, number, number]; // Medium slate
  const CREAM = [254, 252, 232] as [number, number, number];     // Warm cream background
  const WHITE = [255, 255, 255] as [number, number, number];
  const GOLD = [180, 140, 50] as [number, number, number];       // Gold accent

  const formattedDate = data.khutba_date
    ? new Date(data.khutba_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const addFooter = () => {
    doc.setDrawColor(...SLATE_400);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_600);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Generated by Talbiyah Insights | Always consult qualified scholars for religious rulings',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Better page break with proper margin handling
  const checkPageBreak = (neededHeight: number): boolean => {
    const bottomMargin = 30;
    if (yPos + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = margin + 10;
      addFooter();
      return true;
    }
    return false;
  };

  // Professional section header with proper spacing
  const drawSectionHeader = (title: string, color: [number, number, number] = AMBER) => {
    // Always check for page break with enough space for header + some content
    checkPageBreak(35);

    // Add space before section
    yPos += 8;

    // Draw header background
    doc.setFillColor(...color);
    doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');

    // Draw header text
    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 6, yPos + 8.5);

    // Reset for content
    yPos += 18;
    doc.setTextColor(...SLATE_800);
    doc.setFont('helvetica', 'normal');
  };

  // Draw Arabic text - disabled due to rendering issues
  // Arabic text is displayed in the web modal view only
  const drawArabicBox = (_arabicText: string, _requestedFontSize: number = 14) => {
    // Arabic rendering in PDF has been disabled - the web view displays Arabic properly
    return;
  };

  // Draw paragraph with proper line calculation
  const drawParagraph = (text: string, indent = 0) => {
    doc.setTextColor(...SLATE_800);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const availableWidth = contentWidth - indent - 5;
    const lines = doc.splitTextToSize(text, availableWidth);
    const lineHeight = 5.5;
    const totalHeight = lines.length * lineHeight;

    checkPageBreak(totalHeight + 5);
    doc.text(lines, margin + indent, yPos);
    yPos += totalHeight + 4;
  };

  // Draw bullet point with proper spacing
  const drawBullet = (text: string, bullet = '•') => {
    doc.setFontSize(10);

    const availableWidth = contentWidth - 15;
    const lines = doc.splitTextToSize(text, availableWidth);
    const lineHeight = 5;
    const totalHeight = lines.length * lineHeight;

    checkPageBreak(totalHeight + 4);

    // Draw bullet
    doc.setTextColor(...TEAL);
    doc.text(bullet, margin + 4, yPos);

    // Draw text
    doc.setTextColor(...SLATE_800);
    doc.text(lines, margin + 12, yPos);
    yPos += totalHeight + 3;
  };

  // Header
  doc.setFillColor(...AMBER);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TALBIYAH INSIGHTS', margin, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Khutba Study Notes', margin, 22);

  // Title on right
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.title, 80);
  doc.text(titleLines, pageWidth - margin, 12, { align: 'right' });

  if (data.speaker) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`By ${data.speaker}`, pageWidth - margin, 20, { align: 'right' });
  }
  if (data.location) {
    doc.text(data.location, pageWidth - margin, 25, { align: 'right' });
  }
  if (formattedDate) {
    doc.text(formattedDate, pageWidth - margin, 30, { align: 'right' });
  }

  yPos = 42;
  addFooter();

  // ===========================================
  // FULL PDF CONTENT - ALL SECTIONS
  // ===========================================

  // 1. Full Khutba Summary
  if (data.cleaned_transcript) {
    drawSectionHeader('Full Khutba Summary', EMERALD);
    const paragraphs = data.cleaned_transcript.split('\n\n').filter(p => p.trim());
    paragraphs.forEach(para => {
      drawParagraph(para.trim());
    });
    yPos += 3;
  }

  // 2. Main Points
  if (data.main_points && data.main_points.length > 0) {
    drawSectionHeader('Main Points to Reflect Upon', AMBER);
    data.main_points.forEach((p, i) => {
      const pointLines = doc.splitTextToSize(`${i + 1}. ${p.point}`, contentWidth - 10);
      const reflectionLines = doc.splitTextToSize(p.reflection, contentWidth - 15);
      const totalHeight = pointLines.length * 5 + reflectionLines.length * 4.5 + 12;

      checkPageBreak(totalHeight);

      doc.setTextColor(...AMBER);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(pointLines, margin + 4, yPos);
      yPos += pointLines.length * 5 + 2;

      doc.setTextColor(...SLATE_600);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(reflectionLines, margin + 8, yPos);
      yPos += reflectionLines.length * 4.5 + 8;
    });
  }

  // 3. Key Themes
  if (data.key_themes && data.key_themes.length > 0) {
    drawSectionHeader('Key Themes', [234, 179, 8]);
    checkPageBreak(30);
    let xPos = margin + 4;
    let lineY = yPos;
    const tagHeight = 8;
    const tagPadding = 4;

    data.key_themes.forEach((t) => {
      const themeText = t.theme;
      doc.setFontSize(9);
      const textWidth = doc.getTextWidth(themeText) + tagPadding * 2;

      if (xPos + textWidth > pageWidth - margin) {
        xPos = margin + 4;
        lineY += tagHeight + 4;
        checkPageBreak(tagHeight + 4);
      }

      doc.setFillColor(254, 243, 199);
      doc.roundedRect(xPos, lineY - 5, textWidth, tagHeight, 2, 2, 'F');
      doc.setTextColor(180, 140, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(themeText, xPos + tagPadding, lineY);
      xPos += textWidth + 6;
    });
    yPos = lineY + tagHeight + 10;
  }

  // 4. Quranic Words & Phrases
  if (data.quranic_words_phrases && data.quranic_words_phrases.length > 0) {
    drawSectionHeader('Key Quranic Words & Phrases', EMERALD);
    data.quranic_words_phrases.forEach(w => {
      const contextLines = doc.splitTextToSize(`Context: ${w.context}`, contentWidth - 15);
      const arabicBoxHeight = 40;
      const meaningBoxHeight = 14;
      const contextHeight = contextLines.length * 4.5 + 4;
      const totalHeight = arabicBoxHeight + meaningBoxHeight + contextHeight + 20;

      checkPageBreak(totalHeight);

      drawArabicBox(w.arabic, 22);

      doc.setFontSize(11);
      doc.setTextColor(...TEAL);
      doc.setFont('helvetica', 'bold');
      doc.text(w.transliteration, margin + 6, yPos);
      yPos += 7;

      doc.setFillColor(240, 253, 244);
      doc.roundedRect(margin + 2, yPos - 3, contentWidth - 4, meaningBoxHeight, 2, 2, 'F');
      doc.setTextColor(...SLATE_800);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Meaning: ${w.meaning}`, margin + 8, yPos + 5);
      yPos += meaningBoxHeight + 4;

      doc.setTextColor(...SLATE_600);
      doc.setFontSize(9);
      doc.text(contextLines, margin + 6, yPos);
      yPos += contextHeight + 8;
    });
  }

  // 5. Key Vocabulary
  if (data.key_vocabulary && data.key_vocabulary.length > 0) {
    drawSectionHeader('Arabic Vocabulary', [139, 92, 246]);
    const headers = ['Term', 'Arabic', 'Definition'];
    const rows = data.key_vocabulary.map(v => [v.term, v.arabic || '-', v.definition]);
    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [139, 92, 246], textColor: WHITE, fontSize: 10, cellPadding: 4 },
      bodyStyles: { textColor: SLATE_800, fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50, font: hasArabicFont ? 'AmiriQuran' : 'helvetica', fontSize: 16, halign: 'right' },
        2: { cellWidth: 'auto' }
      },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // 6. Quran References
  if (data.quran_references && data.quran_references.length > 0) {
    drawSectionHeader('Quran References', EMERALD);
    data.quran_references.forEach(ref => {
      const translationLines = doc.splitTextToSize(`"${ref.translation}"`, contentWidth - 20);
      const reflectionLines = doc.splitTextToSize(`Reflection: ${ref.reflection}`, contentWidth - 20);
      const arabicBoxHeight = ref.arabic ? 45 : 0;
      const translationHeight = translationLines.length * 5.5 + 8;
      const reflectionBoxHeight = reflectionLines.length * 5 + 12;
      const totalHeight = arabicBoxHeight + translationHeight + reflectionBoxHeight + 25;

      checkPageBreak(totalHeight);

      if (ref.arabic) {
        drawArabicBox(ref.arabic, 20);
      }

      const borderStartY = yPos - 2;
      doc.setTextColor(...SLATE_800);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(translationLines, margin + 12, yPos);
      yPos += translationLines.length * 5.5;

      doc.setDrawColor(...EMERALD);
      doc.setLineWidth(2);
      doc.line(margin + 4, borderStartY, margin + 4, yPos + 2);
      yPos += 6;

      doc.setTextColor(...EMERALD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(ref.reference, margin + 12, yPos);
      yPos += 8;

      const reflectionBoxY = yPos - 3;
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(margin + 2, reflectionBoxY, contentWidth - 4, reflectionBoxHeight, 2, 2, 'F');
      doc.setTextColor(...SLATE_600);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(reflectionLines, margin + 8, yPos + 4);
      yPos += reflectionBoxHeight + 10;
    });
  }

  // 7. Hadith References
  if (data.hadith_references && data.hadith_references.length > 0) {
    drawSectionHeader('Hadith References', AMBER);
    data.hadith_references.forEach(ref => {
      const hadithLines = doc.splitTextToSize(`"${ref.translation}"`, contentWidth - 10);
      const reflectionLines = doc.splitTextToSize(`Reflection: ${ref.reflection}`, contentWidth - 10);
      const totalHeight = hadithLines.length * 5 + reflectionLines.length * 4.5 + 20;

      checkPageBreak(totalHeight);

      doc.setTextColor(...SLATE_700);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(hadithLines, margin + 6, yPos);
      yPos += hadithLines.length * 5 + 3;

      doc.setTextColor(...AMBER);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(ref.reference, margin + 6, yPos);
      yPos += 6;

      doc.setTextColor(...SLATE_600);
      doc.setFont('helvetica', 'normal');
      doc.text(reflectionLines, margin + 6, yPos);
      yPos += reflectionLines.length * 4.5 + 8;
    });
  }

  // 8. Action Items
  if (data.action_items && data.action_items.length > 0) {
    drawSectionHeader('Action Items', [239, 68, 68]);
    data.action_items.forEach((item, i) => {
      const actionLines = doc.splitTextToSize(`${i + 1}. ${item.action}`, contentWidth - 10);
      const howLines = doc.splitTextToSize(`How: ${item.how_to}`, contentWidth - 15);
      const totalHeight = actionLines.length * 5 + howLines.length * 4.5 + 10;

      checkPageBreak(totalHeight);

      doc.setTextColor(239, 68, 68);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(actionLines, margin + 4, yPos);
      yPos += actionLines.length * 5 + 2;

      doc.setTextColor(...SLATE_600);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(howLines, margin + 10, yPos);
      yPos += howLines.length * 4.5 + 8;
    });
  }

  // 9. Quiz - Questions only (answers not shown in PDF)
  if (data.quiz?.multiple_choice && data.quiz.multiple_choice.length > 0) {
    drawSectionHeader('Quiz', [59, 130, 246]);
    data.quiz.multiple_choice.forEach((q, i) => {
      const questionLines = doc.splitTextToSize(`${i + 1}. ${q.question}`, contentWidth - 10);
      const optionsHeight = (q.options?.length || 4) * 6;
      const totalHeight = questionLines.length * 5 + optionsHeight + 10;

      checkPageBreak(totalHeight);

      doc.setTextColor(...SLATE_700);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(questionLines, margin + 4, yPos);
      yPos += questionLines.length * 5 + 3;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...SLATE_600);
      q.options.forEach(opt => {
        doc.text(`   ○  ${opt}`, margin + 8, yPos);
        yPos += 6;
      });
      yPos += 5;
    });
  }

  // 10. Homework
  if (data.homework && data.homework.length > 0) {
    drawSectionHeader('Homework', [249, 115, 22]);
    data.homework.forEach((hw, i) => {
      const descLines = doc.splitTextToSize(hw.description, contentWidth - 15);
      const totalHeight = 8 + descLines.length * 4.5 + 8;

      checkPageBreak(totalHeight);

      doc.setTextColor(249, 115, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${hw.task}`, margin + 4, yPos);

      doc.setTextColor(...SLATE_500);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const taskWidth = doc.getTextWidth(`${i + 1}. ${hw.task}`);
      doc.text(`(${hw.duration})`, margin + 8 + taskWidth, yPos);
      yPos += 6;

      doc.setTextColor(...SLATE_700);
      doc.text(descLines, margin + 10, yPos);
      yPos += descLines.length * 4.5 + 6;
    });
  }

  // 11. Age-Appropriate Summaries
  if (data.summary_for_children || data.summary_for_teens) {
    drawSectionHeader('Age-Appropriate Summaries', [6, 182, 212]);

    if (data.summary_for_children) {
      const childLines = doc.splitTextToSize(data.summary_for_children, contentWidth - 10);
      const totalHeight = 8 + childLines.length * 4.5 + 6;
      checkPageBreak(totalHeight);

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('For Children (5-10):', margin + 4, yPos);
      yPos += 6;

      doc.setTextColor(...SLATE_700);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(childLines, margin + 6, yPos);
      yPos += childLines.length * 4.5 + 8;
    }

    if (data.summary_for_teens) {
      const teenLines = doc.splitTextToSize(data.summary_for_teens, contentWidth - 10);
      const totalHeight = 8 + teenLines.length * 4.5 + 6;
      checkPageBreak(totalHeight);

      doc.setTextColor(139, 92, 246);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('For Teens (11-17):', margin + 4, yPos);
      yPos += 6;

      doc.setTextColor(...SLATE_700);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(teenLines, margin + 6, yPos);
      yPos += teenLines.length * 4.5 + 8;
    }
  }

  // 12. Family Discussion Guide
  if (data.family_discussion_guide && data.family_discussion_guide.length > 0) {
    drawSectionHeader('Family Discussion Guide', TEAL);
    data.family_discussion_guide.forEach((item, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${item}`, contentWidth - 15);
      const totalHeight = lines.length * 5 + 4;

      checkPageBreak(totalHeight);

      doc.setTextColor(...TEAL);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${i + 1}.`, margin + 4, yPos);

      doc.setTextColor(...SLATE_700);
      doc.text(lines.map((l: string, idx: number) => idx === 0 ? l.substring(3) : l), margin + 12, yPos);
      yPos += lines.length * 5 + 4;
    });
  }

  // Save PDF
  const filename = `Talbiyah-Insights-${data.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50)}.pdf`;
  doc.save(filename);
}
