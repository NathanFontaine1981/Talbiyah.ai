import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: { finalY: number };
  }
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const AMBER = [245, 158, 11] as [number, number, number];
  const EMERALD = [16, 185, 129] as [number, number, number];
  const SLATE_700 = [51, 65, 85] as [number, number, number];
  const SLATE_500 = [100, 116, 139] as [number, number, number];
  const SLATE_100 = [241, 245, 249] as [number, number, number];
  const WHITE = [255, 255, 255] as [number, number, number];

  const formattedDate = data.khutba_date
    ? new Date(data.khutba_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_500);
    doc.text(
      'Generated by Talbiyah Insights | Always consult qualified scholars for religious rulings',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
      addFooter();
      return true;
    }
    return false;
  };

  const drawSectionHeader = (title: string, color: [number, number, number] = AMBER) => {
    checkPageBreak(15);
    doc.setFillColor(...color);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPos + 5.5);
    yPos += 12;
    doc.setTextColor(...SLATE_700);
  };

  const drawParagraph = (text: string, indent = 0) => {
    doc.setTextColor(...SLATE_700);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = 4.5;
    checkPageBreak(lines.length * lineHeight);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * lineHeight + 2;
  };

  const drawBullet = (text: string, bullet = '•') => {
    doc.setTextColor(...AMBER);
    doc.setFontSize(9);
    doc.text(bullet, margin + 3, yPos);
    doc.setTextColor(...SLATE_700);
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    checkPageBreak(lines.length * 4.5);
    doc.text(lines, margin + 8, yPos);
    yPos += lines.length * 4.5 + 1;
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

  // Cleaned Transcript (summary only for PDF)
  if (data.cleaned_transcript) {
    drawSectionHeader('Full Khutba Summary', EMERALD);
    const summary = data.cleaned_transcript.length > 800
      ? data.cleaned_transcript.substring(0, 800) + '...'
      : data.cleaned_transcript;
    drawParagraph(summary);
    yPos += 3;
  }

  // Main Points
  if (data.main_points && data.main_points.length > 0) {
    drawSectionHeader('Main Points to Reflect Upon');
    data.main_points.forEach((p, i) => {
      checkPageBreak(12);
      doc.setTextColor(...AMBER);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${p.point}`, margin + 2, yPos);
      yPos += 5;
      doc.setTextColor(...SLATE_500);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const lines = doc.splitTextToSize(p.reflection, contentWidth - 8);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4.5 + 3;
    });
  }

  // Quranic Words
  if (data.quranic_words_phrases && data.quranic_words_phrases.length > 0) {
    drawSectionHeader('Key Quranic Words & Phrases', EMERALD);
    data.quranic_words_phrases.forEach(w => {
      checkPageBreak(18);
      doc.setTextColor(...SLATE_700);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(w.arabic, pageWidth - margin, yPos, { align: 'right' });
      doc.setFontSize(9);
      doc.setTextColor(...EMERALD);
      doc.text(w.transliteration, margin + 2, yPos);
      yPos += 5;
      doc.setTextColor(...SLATE_700);
      doc.setFont('helvetica', 'normal');
      doc.text(`Meaning: ${w.meaning}`, margin + 2, yPos);
      yPos += 4;
      doc.setTextColor(...SLATE_500);
      doc.text(`Context: ${w.context}`, margin + 2, yPos);
      yPos += 6;
    });
  }

  // Key Vocabulary
  if (data.key_vocabulary && data.key_vocabulary.length > 0) {
    drawSectionHeader('Arabic Vocabulary', [139, 92, 246]);
    const headers = ['Term', 'Arabic', 'Definition'];
    const rows = data.key_vocabulary.map(v => [v.term, v.arabic || '-', v.definition]);
    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [139, 92, 246], textColor: WHITE, fontSize: 8 },
      bodyStyles: { textColor: SLATE_700, fontSize: 8 },
      alternateRowStyles: { fillColor: SLATE_100 },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { cellWidth: 'auto' } },
    });
    yPos = doc.lastAutoTable.finalY + 5;
  }

  // Quran References
  if (data.quran_references && data.quran_references.length > 0) {
    drawSectionHeader('Quran to Reflect Upon', EMERALD);
    data.quran_references.forEach(ref => {
      checkPageBreak(20);
      if (ref.arabic) {
        doc.setTextColor(...SLATE_700);
        doc.setFontSize(12);
        doc.text(ref.arabic, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
      }
      doc.setTextColor(...SLATE_700);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const lines = doc.splitTextToSize(`"${ref.translation}"`, contentWidth);
      doc.text(lines, margin + 2, yPos);
      yPos += lines.length * 4.5;
      doc.setTextColor(...EMERALD);
      doc.setFont('helvetica', 'bold');
      doc.text(ref.reference, margin + 2, yPos);
      yPos += 4;
      doc.setTextColor(...SLATE_500);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reflection: ${ref.reflection}`, margin + 2, yPos);
      yPos += 6;
    });
  }

  // Hadith References
  if (data.hadith_references && data.hadith_references.length > 0) {
    drawSectionHeader('Hadith to Reflect Upon');
    data.hadith_references.forEach(ref => {
      checkPageBreak(20);
      doc.setTextColor(...SLATE_700);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const lines = doc.splitTextToSize(`"${ref.translation}"`, contentWidth);
      doc.text(lines, margin + 2, yPos);
      yPos += lines.length * 4.5;
      doc.setTextColor(...AMBER);
      doc.setFont('helvetica', 'bold');
      doc.text(ref.reference, margin + 2, yPos);
      yPos += 4;
      doc.setTextColor(...SLATE_500);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reflection: ${ref.reflection}`, margin + 2, yPos);
      yPos += 6;
    });
  }

  // Action Items
  if (data.action_items && data.action_items.length > 0) {
    drawSectionHeader('Action Items', [239, 68, 68]);
    data.action_items.forEach((item, i) => {
      checkPageBreak(10);
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${item.action}`, margin + 2, yPos);
      yPos += 4;
      doc.setTextColor(...SLATE_500);
      doc.setFont('helvetica', 'normal');
      doc.text(`How: ${item.how_to}`, margin + 8, yPos);
      yPos += 5;
    });
  }

  // Quiz (simplified)
  if (data.quiz?.multiple_choice && data.quiz.multiple_choice.length > 0) {
    drawSectionHeader('Quiz - Multiple Choice', [59, 130, 246]);
    data.quiz.multiple_choice.forEach((q, i) => {
      checkPageBreak(25);
      doc.setTextColor(...SLATE_700);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${q.question}`, margin + 2, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      q.options.forEach(opt => {
        const isCorrect = opt.charAt(0) === q.correct_answer;
        if (isCorrect) {
          doc.setTextColor(...EMERALD);
        } else {
          doc.setTextColor(...SLATE_500);
        }
        doc.text(`   ${opt}${isCorrect ? ' ✓' : ''}`, margin + 5, yPos);
        yPos += 4;
      });
      yPos += 2;
    });
  }

  // Homework
  if (data.homework && data.homework.length > 0) {
    drawSectionHeader('Homework Assignments', [249, 115, 22]);
    data.homework.forEach((hw, i) => {
      checkPageBreak(12);
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${hw.task}`, margin + 2, yPos);
      doc.setTextColor(...SLATE_500);
      doc.setFont('helvetica', 'normal');
      doc.text(`(${hw.duration})`, margin + 100, yPos);
      yPos += 4;
      doc.setTextColor(...SLATE_700);
      const lines = doc.splitTextToSize(hw.description, contentWidth - 10);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4.5 + 2;
    });
  }

  // Age-Appropriate Summaries
  if (data.summary_for_children || data.summary_for_teens) {
    drawSectionHeader('Age-Appropriate Summaries', [6, 182, 212]);
    if (data.summary_for_children) {
      doc.setTextColor(6, 182, 212);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('For Children (5-10):', margin + 2, yPos);
      yPos += 4;
      doc.setTextColor(...SLATE_700);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.summary_for_children, contentWidth - 5);
      checkPageBreak(lines.length * 4.5);
      doc.text(lines, margin + 2, yPos);
      yPos += lines.length * 4.5 + 4;
    }
    if (data.summary_for_teens) {
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('For Teens (11-17):', margin + 2, yPos);
      yPos += 4;
      doc.setTextColor(...SLATE_700);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.summary_for_teens, contentWidth - 5);
      checkPageBreak(lines.length * 4.5);
      doc.text(lines, margin + 2, yPos);
      yPos += lines.length * 4.5 + 4;
    }
  }

  // Family Discussion Guide
  if (data.family_discussion_guide && data.family_discussion_guide.length > 0) {
    drawSectionHeader('Family Discussion Guide', [20, 184, 166]);
    data.family_discussion_guide.forEach((item, i) => {
      drawBullet(`${i + 1}. ${item}`);
    });
  }

  // Save PDF
  const filename = `Talbiyah-Insights-${data.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50)}.pdf`;
  doc.save(filename);
}
