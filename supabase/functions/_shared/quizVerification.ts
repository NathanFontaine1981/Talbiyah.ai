/**
 * Quiz Verification Utility
 * Verifies and auto-corrects quiz answers about Quran verses against verified Quran.com data
 *
 * This is critical to prevent AI hallucinations about Quran content.
 */

export interface VerifiedVerse {
  ayahNumber: number;
  verseKey: string;
  firstWord: string;
  transliteration: string;
  translation: string;
  fullVerseUthmani: string;
  fullVerseTranslation: string;
}

export interface QuizVerificationResult {
  questionText: string;
  verseReference: string | null;
  originalAnswer: string;
  verifiedAnswer: string | null;
  isVerified: boolean;
  correctionMade: boolean;
  similarity: number;
}

export interface VerificationSummary {
  totalQuestions: number;
  verseRelatedQuestions: number;
  correctionsApplied: number;
  correctedContent: string;
  corrections: QuizVerificationResult[];
}

// Patterns to detect questions that reference specific verses
const VERSE_QUESTION_PATTERNS = [
  // "What did Allah/Pharaoh/Musa say in verse X"
  /what\s+(?:did|does)\s+(?:Allah|Pharaoh|Fir(?:'|')awn|Musa|Moses|Ibrahim|Abraham|the\s+(?:Lord|Creator))\s+(?:say|declare|proclaim|announce)/i,
  // "According to this ayah/verse"
  /according\s+to\s+(?:this\s+)?(?:ayah|verse|āyah)/i,
  // "In Quran 79:24" or "verse 24"
  /in\s+(?:quran\s+)?(\d+:\d+)/i,
  /(?:ayah|verse|āyah)\s+(\d+)/i,
  // "The meaning of ayah/verse X"
  /(?:the\s+)?meaning\s+of\s+(?:ayah|verse|āyah)\s+(\d+)/i,
  // "What is said in verse X"
  /what\s+is\s+said\s+in\s+(?:ayah|verse|āyah)\s+(\d+)/i,
  // "Pharaoh's claim/declaration"
  /(?:Pharaoh|Fir(?:'|')awn)(?:'|')s?\s+(?:claim|declaration|statement|words)/i,
  // "I am your lord" type statements - these need verification
  /["']I\s+am\s+(?:your\s+)?(?:lord|god)/i,
];

// Patterns to extract verse numbers from questions
const VERSE_NUMBER_PATTERNS = [
  /(?:ayah|verse|āyah)\s+(\d+)/i,
  /(\d+):(\d+)/,
  /verses?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i,
];

/**
 * Extract verse reference from a quiz question
 */
export function extractVerseReference(question: string): { ayah: number; surah?: number } | null {
  for (const pattern of VERSE_NUMBER_PATTERNS) {
    const match = question.match(pattern);
    if (match) {
      if (match[2]) {
        // Format: surah:ayah (e.g., "79:24")
        return { surah: parseInt(match[1], 10), ayah: parseInt(match[2], 10) };
      } else if (match[1]) {
        // Format: just ayah number
        return { ayah: parseInt(match[1], 10) };
      }
    }
  }
  return null;
}

/**
 * Check if a question is about a specific verse
 */
export function isVerseRelatedQuestion(question: string): boolean {
  return VERSE_QUESTION_PATTERNS.some(pattern => pattern.test(question));
}

/**
 * Calculate similarity between two strings (case-insensitive)
 * Uses Jaccard similarity on words
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const normalize = (s: string) => s.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const words1 = new Set(normalize(str1));
  const words2 = new Set(normalize(str2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
}

/**
 * Extract the relevant part of a verse translation for an answer
 * For questions like "What did Pharaoh say?", extract the quoted speech
 */
export function extractRelevantTranslation(question: string, verse: VerifiedVerse): string {
  const fullTranslation = verse.fullVerseTranslation;

  // For questions about what someone said, try to extract quoted speech
  if (/what\s+(?:did|does)\s+\w+\s+say/i.test(question)) {
    // Look for quoted text or speech patterns
    const quoteMatch = fullTranslation.match(/"([^"]+)"/);
    if (quoteMatch) {
      return quoteMatch[1];
    }

    // Look for "He said:" or "said:" patterns
    const saidMatch = fullTranslation.match(/(?:he\s+)?said[,:]?\s*["']?(.+?)["']?$/i);
    if (saidMatch) {
      return saidMatch[1].trim();
    }
  }

  // Default: return the full translation
  return fullTranslation;
}

/**
 * Parse quiz questions from generated content
 * Returns array of question objects with question text and correct answer
 */
function parseQuizFromContent(content: string): { question: string; correctAnswer: string; startIndex: number; endIndex: number }[] {
  const questions: { question: string; correctAnswer: string; startIndex: number; endIndex: number }[] = [];

  // Pattern to match quiz questions: Q1., Q2., **Q1.**, 1., etc.
  const questionPattern = /(?:\*\*)?Q?(\d+)\.\*?\*?\s*(.+?)(?=(?:\*\*)?Q?\d+\.\*?\*?|\n\n---|\n\n\*\*|$)/gs;

  let match;
  while ((match = questionPattern.exec(content)) !== null) {
    const questionBlock = match[2];
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    // Find the question text (first line or up to the options)
    const questionMatch = questionBlock.match(/^(.+?)(?:\n|(?=[A-D]\)))/s);
    if (!questionMatch) continue;

    const questionText = questionMatch[1].trim();

    // Find the correct answer (marked with ✅)
    const correctMatch = questionBlock.match(/([A-D])\)\s*(.+?)\s*✅/);
    if (correctMatch) {
      questions.push({
        question: questionText,
        correctAnswer: correctMatch[2].trim(),
        startIndex,
        endIndex
      });
    }
  }

  return questions;
}

/**
 * Verify and correct a single quiz answer
 */
export function verifyAndCorrectQuizAnswer(
  question: string,
  answer: string,
  verses: VerifiedVerse[]
): { corrected: boolean; newAnswer: string; similarity: number; matchedVerse?: VerifiedVerse } {
  // Check if question is verse-related
  if (!isVerseRelatedQuestion(question)) {
    return { corrected: false, newAnswer: answer, similarity: 1 };
  }

  // Try to extract verse reference
  const verseRef = extractVerseReference(question);

  let matchedVerse: VerifiedVerse | undefined;

  if (verseRef) {
    // Find the specific verse
    matchedVerse = verses.find(v => v.ayahNumber === verseRef.ayah);
  }

  // If no specific verse found, try to match by content similarity
  if (!matchedVerse && verses.length > 0) {
    let bestSimilarity = 0;
    for (const verse of verses) {
      const sim = calculateSimilarity(answer, verse.fullVerseTranslation);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        matchedVerse = verse;
      }
    }
    // Only use if similarity is reasonable
    if (bestSimilarity < 0.2) {
      matchedVerse = undefined;
    }
  }

  if (!matchedVerse) {
    // Can't verify - no matching verse found
    return { corrected: false, newAnswer: answer, similarity: 0 };
  }

  // Check similarity between answer and verse translation
  const similarity = calculateSimilarity(answer, matchedVerse.fullVerseTranslation);

  // If similarity is too low, the answer might be wrong
  if (similarity < 0.4) {
    // Extract the relevant part of the verified translation
    const correctedAnswer = extractRelevantTranslation(question, matchedVerse);

    // Only correct if the new answer is meaningfully different
    if (correctedAnswer && calculateSimilarity(answer, correctedAnswer) < 0.6) {
      console.log(`Quiz correction: "${answer}" -> "${correctedAnswer}" (similarity: ${similarity.toFixed(2)})`);
      return {
        corrected: true,
        newAnswer: correctedAnswer,
        similarity,
        matchedVerse
      };
    }
  }

  return { corrected: false, newAnswer: answer, similarity, matchedVerse };
}

/**
 * Main function: Verify and correct all quiz answers in generated content
 */
export function verifyAndCorrectQuizAnswers(
  generatedContent: string,
  context: {
    surahNumber?: number;
    surahName?: string;
    ayahRange?: string;
    verifiedVerses: VerifiedVerse[];
  }
): VerificationSummary {
  const { verifiedVerses } = context;

  if (!verifiedVerses || verifiedVerses.length === 0) {
    return {
      totalQuestions: 0,
      verseRelatedQuestions: 0,
      correctionsApplied: 0,
      correctedContent: generatedContent,
      corrections: []
    };
  }

  // Parse quiz questions from content
  const questions = parseQuizFromContent(generatedContent);

  const corrections: QuizVerificationResult[] = [];
  let correctedContent = generatedContent;
  let correctionsApplied = 0;
  let verseRelatedCount = 0;

  // Process questions in reverse order to maintain string indices
  for (let i = questions.length - 1; i >= 0; i--) {
    const q = questions[i];

    const isVerseRelated = isVerseRelatedQuestion(q.question);
    if (isVerseRelated) {
      verseRelatedCount++;
    }

    const result = verifyAndCorrectQuizAnswer(q.question, q.correctAnswer, verifiedVerses);

    corrections.unshift({
      questionText: q.question,
      verseReference: extractVerseReference(q.question)?.ayah?.toString() || null,
      originalAnswer: q.correctAnswer,
      verifiedAnswer: result.corrected ? result.newAnswer : null,
      isVerified: result.similarity >= 0.4 || !isVerseRelated,
      correctionMade: result.corrected,
      similarity: result.similarity
    });

    if (result.corrected) {
      // Replace the incorrect answer with the corrected one
      // Find the answer in the content and replace it
      const answerPattern = new RegExp(
        escapeRegex(q.correctAnswer) + '(\\s*✅)',
        'g'
      );
      correctedContent = correctedContent.replace(answerPattern, result.newAnswer + '$1');
      correctionsApplied++;
    }
  }

  return {
    totalQuestions: questions.length,
    verseRelatedQuestions: verseRelatedCount,
    correctionsApplied,
    correctedContent,
    corrections
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a verification log entry for monitoring
 */
export function createVerificationLog(
  lessonId: string,
  summary: VerificationSummary
): Record<string, unknown> {
  return {
    lesson_id: lessonId,
    verified_at: new Date().toISOString(),
    total_questions: summary.totalQuestions,
    verse_related_questions: summary.verseRelatedQuestions,
    corrections_applied: summary.correctionsApplied,
    corrections: summary.corrections.filter(c => c.correctionMade).map(c => ({
      question: c.questionText.substring(0, 100),
      original: c.originalAnswer,
      corrected: c.verifiedAnswer,
      similarity: c.similarity
    }))
  };
}
