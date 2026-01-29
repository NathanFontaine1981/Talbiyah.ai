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

// Patterns to detect vocabulary/meaning questions
const VOCAB_QUESTION_PATTERNS = [
  /what\s+does\s+["'""]?(\w+)["'""]?\s+mean/i,
  /the\s+meaning\s+of\s+["'""]?(\w+)["'""]?/i,
  /["'""]?(\w+)["'""]?\s+(?:means|refers\s+to|specifically\s+refer)/i,
  /what\s+is\s+the\s+(?:meaning|definition)\s+of/i,
  /why\s+did\s+allah\s+create\s+(?:death\s+and\s+life|life\s+and\s+death)/i,
  /according\s+to\s+the\s+verse/i,
];

// CRITICAL: Known correct Arabic vocabulary meanings
// These override any AI-generated answers
const ARABIC_VOCAB_CORRECTIONS: Record<string, { correct: string; wrong: string[] }> = {
  // Tabāraka - most common error
  'tabāraka': { correct: 'blessed', wrong: ['all-knowing', 'knowing', 'great', 'mighty', 'powerful', 'high', 'seeing'] },
  'tabaraka': { correct: 'blessed', wrong: ['all-knowing', 'knowing', 'great', 'mighty', 'powerful', 'high', 'seeing'] },
  'تبارك': { correct: 'blessed', wrong: ['all-knowing', 'knowing', 'great', 'mighty', 'powerful', 'high', 'seeing'] },

  // Al-Mulk
  'al-mulk': { correct: 'dominion', wrong: ['power only', 'kingdom only'] },
  'الملك': { correct: 'dominion', wrong: ['power only', 'kingdom only'] },

  // Qadīr
  'qadīr': { correct: 'all-powerful', wrong: ['strong only', 'mighty only'] },
  'قدير': { correct: 'all-powerful', wrong: ['strong only', 'mighty only'] },

  // Rahman/Raheem
  'ar-raḥmān': { correct: 'universal mercy', wrong: ['mercy only for muslims', 'special mercy for believers'] },
  'الرحمن': { correct: 'universal mercy', wrong: ['mercy only for muslims', 'special mercy for believers'] },
  'ar-raḥīm': { correct: 'special mercy for believers', wrong: ['universal mercy', 'general mercy for all'] },
  'الرحيم': { correct: 'special mercy for believers', wrong: ['universal mercy', 'general mercy for all'] },

  // Qayyim
  'qayyim': { correct: 'straight', wrong: ['great', 'powerful', 'beautiful', 'knowing'] },
  'قيم': { correct: 'straight', wrong: ['great', 'powerful', 'beautiful', 'knowing'] },
};

// Known verse meaning corrections - map question patterns to correct answer patterns
const VERSE_MEANING_CORRECTIONS: Record<string, { correctPattern: string; wrongPatterns: string[] }> = {
  // Why did Allah create death and life?
  'create death and life': {
    correctPattern: 'test',
    wrongPatterns: ['accident', 'entertainment', 'show his power', 'for fun', 'by chance']
  },
  'created death and life': {
    correctPattern: 'test',
    wrongPatterns: ['accident', 'entertainment', 'show his power', 'for fun', 'by chance']
  },

  // Looking for flaws in creation
  'flaws in allah': {
    correctPattern: 'frustrated',
    wrongPatterns: ['experts', 'find many', 'special knowledge', 'gain']
  },
  'look repeatedly': {
    correctPattern: 'frustrated',
    wrongPatterns: ['experts', 'find many', 'special knowledge', 'gain']
  },

  // Stars purpose
  'stars in the': {
    correctPattern: 'beauty',
    wrongPatterns: ['navigation', 'time-keeping', 'light and heat']
  },
  'dual purpose': {
    correctPattern: 'beauty',
    wrongPatterns: ['navigation', 'time-keeping', 'light and heat']
  },
};

// Patterns to extract verse numbers from questions
const VERSE_NUMBER_PATTERNS = [
  /(?:ayah|verse|āyah)\s+(\d+)/i,
  /(\d+):(\d+)/,
  /verses?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i,
];

/**
 * Check if a question is a vocabulary/meaning question
 */
export function isVocabQuestion(question: string): boolean {
  return VOCAB_QUESTION_PATTERNS.some(pattern => pattern.test(question));
}

/**
 * Verify vocabulary question answer and return correction if needed
 */
export function verifyVocabAnswer(
  question: string,
  answer: string,
  allOptions: string[]
): { corrected: boolean; newAnswer: string; correctOptionIndex: number } {
  const questionLower = question.toLowerCase();
  const answerLower = answer.toLowerCase();

  console.log(`Verifying quiz answer: Q="${question.substring(0, 50)}..." A="${answer}"`);
  console.log(`Available options: ${allOptions.join(' | ')}`);

  // Check for vocabulary term corrections
  for (const [term, { correct, wrong }] of Object.entries(ARABIC_VOCAB_CORRECTIONS)) {
    if (questionLower.includes(term.toLowerCase())) {
      console.log(`Found vocab term "${term}" in question`);

      // Check if current answer is a known wrong answer
      const isWrongAnswer = wrong.some(w => answerLower.includes(w.toLowerCase()));

      if (isWrongAnswer) {
        // Find the option that contains the correct meaning
        const correctIndex = allOptions.findIndex(opt =>
          opt.toLowerCase().includes(correct.toLowerCase())
        );

        if (correctIndex !== -1) {
          console.log(`VOCAB CORRECTION: "${answer}" -> "${allOptions[correctIndex]}" (term: ${term})`);
          return { corrected: true, newAnswer: allOptions[correctIndex], correctOptionIndex: correctIndex };
        }
      }

      // Check if current answer matches correct - no correction needed
      if (answerLower.includes(correct.toLowerCase())) {
        console.log(`Answer "${answer}" is correct for term "${term}"`);
        return { corrected: false, newAnswer: answer, correctOptionIndex: -1 };
      }
    }
  }

  // Check for verse meaning corrections
  for (const [pattern, { correctPattern, wrongPatterns }] of Object.entries(VERSE_MEANING_CORRECTIONS)) {
    if (questionLower.includes(pattern.toLowerCase())) {
      console.log(`Found verse pattern "${pattern}" in question`);

      // Check if current answer matches a known wrong pattern
      const isWrongAnswer = wrongPatterns.some(w => answerLower.includes(w.toLowerCase()));

      if (isWrongAnswer) {
        // Find the option that contains the correct pattern
        const correctIndex = allOptions.findIndex(opt =>
          opt.toLowerCase().includes(correctPattern.toLowerCase())
        );

        if (correctIndex !== -1 && allOptions[correctIndex].toLowerCase() !== answerLower) {
          console.log(`VERSE CORRECTION: "${answer}" -> "${allOptions[correctIndex]}" (pattern: ${pattern})`);
          return { corrected: true, newAnswer: allOptions[correctIndex], correctOptionIndex: correctIndex };
        }
      }

      // Check if current answer has the correct pattern
      if (answerLower.includes(correctPattern.toLowerCase())) {
        console.log(`Answer "${answer}" is correct for pattern "${pattern}"`);
        return { corrected: false, newAnswer: answer, correctOptionIndex: -1 };
      }
    }
  }

  console.log(`No correction needed for: "${answer}"`);
  return { corrected: false, newAnswer: answer, correctOptionIndex: -1 };
}

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
 * Returns array of question objects with question text, all options, and correct answer
 * Handles both multi-line and inline option formats
 */
function parseQuizFromContent(content: string): {
  question: string;
  options: string[];
  correctAnswer: string;
  correctLetter: string;
  fullBlock: string;
  startIndex: number;
  endIndex: number;
}[] {
  const questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    correctLetter: string;
    fullBlock: string;
    startIndex: number;
    endIndex: number;
  }[] = [];

  // Pattern to match quiz questions: Q1., Q2., **Q1.**, etc.
  const questionPattern = /(?:\*\*)?Q?(\d+)\.\*?\*?\s*(.+?)(?=(?:\*\*)?Q?\d+\.\*?\*?|\n\n---|\n\n\*\*|$)/gs;

  let match;
  while ((match = questionPattern.exec(content)) !== null) {
    const questionBlock = match[2];
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;
    const fullBlock = match[0];

    // Find the question text - everything before the first A)
    const questionMatch = questionBlock.match(/^(.+?)(?=\s*[A-D]\))/s);
    if (!questionMatch) continue;

    const questionText = questionMatch[1].replace(/\n/g, ' ').trim();

    // Extract all options - handle INLINE format: A) text B) text C) text D) text
    // This regex captures: letter, option text (everything until next letter) or ✅)
    const options: string[] = [];
    let correctAnswer = '';
    let correctLetter = '';

    // Match each option - handles inline format with ✅ markers
    const optionMatches = questionBlock.matchAll(/([A-D])\)\s*([^A-D]+?)(?=\s*[A-D]\)|$)/g);

    for (const optMatch of optionMatches) {
      const letter = optMatch[1];
      let optionText = optMatch[2].trim();

      // Check if this option has the ✅
      if (optionText.includes('✅')) {
        correctAnswer = optionText.replace(/\s*✅\s*/g, '').trim();
        correctLetter = letter;
        optionText = correctAnswer;
      }

      options.push(optionText);
    }

    if (correctAnswer && options.length >= 2) {
      questions.push({
        question: questionText,
        options,
        correctAnswer,
        correctLetter,
        fullBlock,
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

  // NOTE: Don't return early if no verified verses - we still need to check vocab questions!
  console.log(`Starting quiz verification. Verified verses available: ${verifiedVerses?.length || 0}`);

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
    const isVocab = isVocabQuestion(q.question);

    if (isVerseRelated) {
      verseRelatedCount++;
    }

    let correctionMade = false;
    let newAnswer = q.correctAnswer;
    let similarity = 1;

    // First check vocabulary questions (most common issue)
    if (isVocab || q.question.toLowerCase().includes('mean') || q.question.toLowerCase().includes('why did allah')) {
      const vocabResult = verifyVocabAnswer(q.question, q.correctAnswer, q.options);

      if (vocabResult.corrected) {
        correctionMade = true;
        newAnswer = vocabResult.newAnswer;
        similarity = 0;

        // Move the ✅ marker to the correct option
        // First remove ✅ from wrong answer
        const wrongAnswerPattern = new RegExp(
          escapeRegex(q.correctAnswer) + '\\s*✅',
          'g'
        );
        correctedContent = correctedContent.replace(wrongAnswerPattern, q.correctAnswer);

        // Then add ✅ to correct answer
        const correctAnswerPattern = new RegExp(
          escapeRegex(newAnswer) + '(?!\\s*✅)',
          'g'
        );
        correctedContent = correctedContent.replace(correctAnswerPattern, newAnswer + ' ✅');

        console.log(`Quiz vocab correction applied: "${q.correctAnswer}" -> "${newAnswer}"`);
        correctionsApplied++;
      }
    }

    // Then check verse-related questions if no vocab correction was made
    if (!correctionMade && isVerseRelated && verifiedVerses && verifiedVerses.length > 0) {
      const result = verifyAndCorrectQuizAnswer(q.question, q.correctAnswer, verifiedVerses);

      if (result.corrected) {
        correctionMade = true;
        newAnswer = result.newAnswer;
        similarity = result.similarity;

        // Replace the incorrect answer with the corrected one
        const answerPattern = new RegExp(
          escapeRegex(q.correctAnswer) + '(\\s*✅)',
          'g'
        );
        correctedContent = correctedContent.replace(answerPattern, result.newAnswer + '$1');
        correctionsApplied++;
      } else {
        similarity = result.similarity;
      }
    }

    corrections.unshift({
      questionText: q.question,
      verseReference: extractVerseReference(q.question)?.ayah?.toString() || null,
      originalAnswer: q.correctAnswer,
      verifiedAnswer: correctionMade ? newAnswer : null,
      isVerified: similarity >= 0.4 || (!isVerseRelated && !isVocab),
      correctionMade,
      similarity
    });
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
