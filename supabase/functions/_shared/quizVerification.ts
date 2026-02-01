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

  // Surah An-Naba (78) vocabulary
  'an-naba': { correct: 'news', wrong: ['story', 'tale', 'message', 'warning'] },
  'النبأ': { correct: 'news', wrong: ['story', 'tale', 'message', 'warning'] },
  'naba': { correct: 'news', wrong: ['story', 'tale', 'message', 'warning'] },

  'mihād': { correct: 'resting place', wrong: ['carpet', 'bed', 'floor', 'ground'] },
  'mihad': { correct: 'resting place', wrong: ['carpet', 'bed', 'floor', 'ground'] },
  'مهاد': { correct: 'resting place', wrong: ['carpet', 'bed', 'floor', 'ground'] },

  'awtād': { correct: 'stakes', wrong: ['mountains only', 'pillars', 'supports', 'anchors'] },
  'awtad': { correct: 'stakes', wrong: ['mountains only', 'pillars', 'supports', 'anchors'] },
  'أوتاد': { correct: 'stakes', wrong: ['mountains only', 'pillars', 'supports', 'anchors'] },

  'subāt': { correct: 'rest', wrong: ['death', 'unconsciousness', 'peace', 'comfort'] },
  'subat': { correct: 'rest', wrong: ['death', 'unconsciousness', 'peace', 'comfort'] },
  'سبات': { correct: 'rest', wrong: ['death', 'unconsciousness', 'peace', 'comfort'] },

  'libās': { correct: 'covering', wrong: ['darkness', 'blanket', 'protection', 'veil'] },
  'libas': { correct: 'covering', wrong: ['darkness', 'blanket', 'protection', 'veil'] },
  'لباس': { correct: 'covering', wrong: ['darkness', 'blanket', 'protection', 'veil'] },

  'ma\'āsh': { correct: 'livelihood', wrong: ['work', 'activity', 'movement', 'life'] },
  'maash': { correct: 'livelihood', wrong: ['work', 'activity', 'movement', 'life'] },
  'معاش': { correct: 'livelihood', wrong: ['work', 'activity', 'movement', 'life'] },

  'sirāj': { correct: 'lamp', wrong: ['light', 'sun only', 'star', 'fire'] },
  'siraj': { correct: 'lamp', wrong: ['light', 'sun only', 'star', 'fire'] },
  'سراج': { correct: 'lamp', wrong: ['light', 'sun only', 'star', 'fire'] },

  'wahhāj': { correct: 'burning', wrong: ['bright', 'shining', 'glowing', 'hot'] },
  'wahhaj': { correct: 'burning', wrong: ['bright', 'shining', 'glowing', 'hot'] },
  'وهاج': { correct: 'burning', wrong: ['bright', 'shining', 'glowing', 'hot'] },

  'thajjāj': { correct: 'pouring', wrong: ['heavy', 'abundant', 'continuous', 'strong'] },
  'thajjaj': { correct: 'pouring', wrong: ['heavy', 'abundant', 'continuous', 'strong'] },
  'ثجاج': { correct: 'pouring', wrong: ['heavy', 'abundant', 'continuous', 'strong'] },

  'alfāf': { correct: 'dense', wrong: ['beautiful', 'lush', 'green', 'tall'] },
  'alfaf': { correct: 'dense', wrong: ['beautiful', 'lush', 'green', 'tall'] },
  'ألفاف': { correct: 'dense', wrong: ['beautiful', 'lush', 'green', 'tall'] },
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

/**
 * Surah vocabulary data for quiz verification
 * Maps surah number to vocabulary words with meanings
 */
export const SURAH_VOCABULARY: Record<number, Record<string, string>> = {
  // Surah An-Naba (78)
  78: {
    'النبأ': 'the news/tidings',
    'العظيم': 'the great',
    'مختلفون': 'in disagreement',
    'مهاد': 'resting place/expanse',
    'أوتاد': 'stakes/pegs',
    'أزواج': 'pairs',
    'سبات': 'rest',
    'لباس': 'covering/clothing',
    'معاش': 'livelihood',
    'شداد': 'strong',
    'سراج': 'lamp',
    'وهاج': 'burning/blazing',
    'المعصرات': 'rain clouds',
    'ثجاج': 'pouring',
    'حب': 'grain',
    'نبات': 'vegetation',
    'جنات': 'gardens',
    'ألفاف': 'dense/entwined',
    'ميقات': 'appointed time',
    'أفواج': 'groups/multitudes',
    'سراب': 'mirage',
    'مرصاد': 'lying in wait',
    'مآب': 'place of return',
    'أحقاب': 'ages/eons',
    'حميم': 'scalding water',
    'غساق': 'purulence',
    'جزاء': 'recompense',
    'وفاق': 'appropriate',
    'حساب': 'account',
    'كذاب': 'denial',
    'أحصيناه': 'enumerated/recorded',
    'مفاز': 'success/attainment',
    'حدائق': 'gardens',
    'أعناب': 'grapes',
    'كواعب': 'full-breasted maidens',
    'أتراب': 'of equal age',
    'دهاق': 'full/overflowing',
    'لغو': 'vain talk',
    'كذاب': 'denial/lies',
    'عطاء': 'gift/reward',
    'الرحمن': 'the Most Merciful',
    'خطاب': 'speech/address',
  },
  // Surah Al-Mulk (67)
  67: {
    'تبارك': 'blessed',
    'الملك': 'dominion/sovereignty',
    'قدير': 'all-powerful',
    'الموت': 'death',
    'الحياة': 'life',
    'ليبلوكم': 'to test you',
    'أحسن': 'best',
    'عملا': 'in deed',
    'العزيز': 'the Almighty',
    'الغفور': 'the Forgiving',
    'طباق': 'layers',
    'تفاوت': 'inconsistency',
    'فطور': 'breaks/cracks',
    'خاسئ': 'humbled',
    'حسير': 'fatigued',
    'مصابيح': 'lamps',
    'رجوم': 'missiles',
    'السعير': 'the Blaze',
    'شهيق': 'inhaling',
    'تفور': 'boiling over',
    'تميز': 'burst',
    'الغيظ': 'rage',
    'فوج': 'group',
    'خزنتها': 'its keepers',
    'نذير': 'warner',
  },
};

/**
 * Known correct answers for common quiz questions
 * Maps question patterns to correct answer patterns
 */
const KNOWN_QUIZ_ANSWERS: Record<number, { pattern: RegExp; correctPattern: string }[]> = {
  78: [ // Surah An-Naba
    // Q: What are people questioning? A: Day of Judgment
    { pattern: /what\s+are\s+.*questioning|opening\s+of\s+surah/i, correctPattern: 'day of judgment' },
    // Q: Mountains function like? A: Pegs/stakes
    { pattern: /mountains\s+function|mountains\s+like|mountains\s+as/i, correctPattern: 'peg' },
    // Q: subatan means? A: rest/sleep
    { pattern: /sub[āa]t[an]*\s+(mean|refer)/i, correctPattern: 'rest' },
    // Q: What makes Quran miraculous? A: Not known when revealed to illiterate Prophet
    { pattern: /miraculous|scientific\s+knowledge/i, correctPattern: 'illiterate' },
    // Q: What is النبأ العظيم? A: Day of Judgment
    { pattern: /النبأ\s*العظيم|great\s+news/i, correctPattern: 'day of judgment' },
    // Q: What does لباس mean? A: covering
    { pattern: /lib[āa]s|لباس/i, correctPattern: 'cover' },
    // Q: What does سبات mean? A: rest
    { pattern: /سبات/i, correctPattern: 'rest' },
    // Q: What does معاش mean? A: livelihood
    { pattern: /ma['\']?[āa]sh|معاش/i, correctPattern: 'livelihood' },
    // Q: What does وهاج mean? A: burning/blazing
    { pattern: /wahh[āa]j|وهاج/i, correctPattern: 'burn' },
    // Q: What does ثجاج mean? A: pouring
    { pattern: /thajj[āa]j|ثجاج/i, correctPattern: 'pour' },
    // Q: What does أوتاد mean? A: stakes/pegs
    { pattern: /awt[āa]d|أوتاد/i, correctPattern: 'stake' },
  ],
  67: [ // Surah Al-Mulk
    // Q: What does تبارك mean? A: Blessed
    { pattern: /tab[āa]raka|تبارك/i, correctPattern: 'bless' },
    // Q: Why did Allah create death and life? A: To test
    { pattern: /create.*death.*life|death.*life.*create/i, correctPattern: 'test' },
  ],
};

/**
 * Mark quiz answers using surah_data vocabulary
 * This is called when AI generates quiz without marked answers
 */
export function markQuizAnswersFromVocabulary(
  content: string,
  surahNumber: number
): string {
  const vocab = SURAH_VOCABULARY[surahNumber];
  const knownAnswers = KNOWN_QUIZ_ANSWERS[surahNumber] || [];

  if (!vocab && knownAnswers.length === 0) {
    console.log(`No vocabulary data for surah ${surahNumber}, skipping quiz marking`);
    return content;
  }

  // CRITICAL: First, strip ALL existing ✅ marks to reset
  let markedContent = content.replace(/\s*✅/g, '');
  console.log('Stripped all existing ✅ marks to re-verify answers');

  // Pattern to match quiz questions - handles both inline and multi-line formats
  const quizPattern = /(\*\*Q\d+\.\*?\*?\s+.+?)(?=\*\*Q\d+\.|---|\n\n\*\*[78]|$)/gs;

  const matches = [...markedContent.matchAll(quizPattern)];

  for (const match of matches) {
    const questionBlock = match[1];

    // Extract question text
    const questionMatch = questionBlock.match(/\*\*Q\d+\.\*?\*?\s+(.+?)(?=\n?[A-D]\))/s);
    if (!questionMatch) continue;

    const questionText = questionMatch[1];
    const questionLower = questionText.toLowerCase();

    // Extract options - handle both inline (A) text B) text) and multi-line formats
    const optionMatches = [...questionBlock.matchAll(/([A-D])\)\s*([^\nA-D]+?)(?=\s*[A-D]\)|$)/g)];
    if (optionMatches.length < 2) continue;

    console.log(`\nProcessing Q: "${questionText.substring(0, 60)}..."`);
    console.log(`Options: ${optionMatches.map(m => m[2].trim().substring(0, 30)).join(' | ')}`);

    // Find the correct answer
    let correctIndex = -1;
    let matchMethod = '';

    // PRIORITY 1: Check known quiz answers first (most reliable)
    for (const { pattern, correctPattern } of knownAnswers) {
      if (pattern.test(questionText)) {
        // Find the option that contains the correct pattern
        for (let i = 0; i < optionMatches.length; i++) {
          const optionText = optionMatches[i][2].toLowerCase();
          if (optionText.includes(correctPattern.toLowerCase())) {
            correctIndex = i;
            matchMethod = `known_answer:${correctPattern}`;
            break;
          }
        }
        if (correctIndex >= 0) break;
      }
    }

    // PRIORITY 2: Check vocabulary matches
    if (correctIndex === -1 && vocab) {
      for (const [arabicWord, meaning] of Object.entries(vocab)) {
        if (questionLower.includes(arabicWord.toLowerCase()) ||
            questionLower.includes(meaning.toLowerCase().split('/')[0])) {
          // Found the word - now find which option matches the meaning
          let bestScore = 0;
          for (let i = 0; i < optionMatches.length; i++) {
            const optionText = optionMatches[i][2].toLowerCase();
            const meaningParts = meaning.toLowerCase().split('/');

            for (const part of meaningParts) {
              if (optionText.includes(part.trim())) {
                const score = part.trim().length;
                if (score > bestScore) {
                  bestScore = score;
                  correctIndex = i;
                  matchMethod = `vocab:${arabicWord}=${meaning}`;
                }
              }
            }
          }
          if (correctIndex >= 0) break;
        }
      }
    }

    // PRIORITY 3: Fallback patterns for common themes
    if (correctIndex === -1) {
      for (let i = 0; i < optionMatches.length; i++) {
        const optionText = optionMatches[i][2].toLowerCase();
        // These are almost always correct for An-Naba questions
        if ((optionText.includes('day of judgment') || optionText.includes('judgment day')) ||
            (optionText.includes('peg') && questionLower.includes('mountain')) ||
            (optionText.includes('rest') && questionLower.includes('sleep')) ||
            (optionText.includes('illiterate') && questionLower.includes('miraculous'))) {
          correctIndex = i;
          matchMethod = 'fallback_pattern';
          break;
        }
      }
    }

    // Mark the correct answer if found
    if (correctIndex >= 0 && optionMatches[correctIndex]) {
      const letter = optionMatches[correctIndex][1];
      const optionText = optionMatches[correctIndex][2].trim();
      const fullOption = `${letter}) ${optionText}`;

      // Find and replace the option with the ✅ mark
      // Handle both inline and multiline formats
      const optionPattern = new RegExp(
        escapeRegex(letter) + '\\)\\s*' + escapeRegex(optionText.substring(0, 20)) + '[^\\n]*',
        'g'
      );

      const originalOption = markedContent.match(optionPattern)?.[0];
      if (originalOption) {
        markedContent = markedContent.replace(originalOption, originalOption + ' ✅');
        console.log(`✓ Marked: ${letter}) ${optionText.substring(0, 40)}... [${matchMethod}]`);
      }
    } else {
      console.log(`✗ Could not determine correct answer for this question`);
    }
  }

  return markedContent;
}
