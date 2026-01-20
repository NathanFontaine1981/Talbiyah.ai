/**
 * Quran.com API Integration
 * Fetches verified Quran verses with Uthmani script and word-by-word data
 *
 * API Documentation: https://api.quran.com/api/v4
 */

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

// Types for API responses
export interface QuranWord {
  position: number;
  text_uthmani: string;
  text_simple: string;
  translation: {
    text: string;
    language_name: string;
  } | null;
  transliteration: {
    text: string;
    language_name: string;
  } | null;
  char_type_name: 'word' | 'end';
}

export interface QuranVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  text_simple: string;
  words: QuranWord[];
  translations?: {
    text: string;
    resource_name: string;
  }[];
}

export interface ChapterInfo {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_complex: string;
  verses_count: number;
  revelation_place: 'makkah' | 'madinah';
  translated_name: {
    name: string;
    language_name: string;
  };
}

export interface FirstWordData {
  ayahNumber: number;
  verseKey: string;
  firstWord: string;  // Uthmani script
  firstWordSimple: string;  // Simple Arabic
  transliteration: string;
  translation: string;
  fullVerseUthmani: string;
  fullVerseTranslation?: string;
}

/**
 * Fetch chapter/surah information
 */
export async function getChapterInfo(surahNumber: number): Promise<ChapterInfo | null> {
  try {
    const response = await fetch(`${QURAN_API_BASE}/chapters/${surahNumber}`);
    if (!response.ok) {
      console.error(`Failed to fetch chapter ${surahNumber}:`, response.status);
      return null;
    }
    const data = await response.json();
    return data.chapter;
  } catch (error) {
    console.error('Error fetching chapter info:', error);
    return null;
  }
}

/**
 * Fetch verses for a specific surah and ayah range with word-by-word data
 */
export async function getVerses(
  surahNumber: number,
  startAyah: number,
  endAyah: number,
  options: {
    includeTranslation?: boolean;
    translationId?: number; // Default: 85 (Abdul Haleem - commonly available)
  } = {}
): Promise<QuranVerse[]> {
  const { includeTranslation = true, translationId = 85 } = options;

  try {
    const verses: QuranVerse[] = [];
    const perPage = 50; // Max per request
    const totalAyahs = endAyah - startAyah + 1;
    const pages = Math.ceil(totalAyahs / perPage);

    // Fetch verses with word-by-word data
    for (let page = 1; page <= pages; page++) {
      const params = new URLSearchParams({
        language: 'en',
        words: 'true',
        word_fields: 'text_uthmani,text_simple,translation,transliteration',
        per_page: perPage.toString(),
        page: page.toString(),
      });

      const url = `${QURAN_API_BASE}/verses/by_chapter/${surahNumber}?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`Failed to fetch verses:`, response.status);
        continue;
      }

      const data = await response.json();

      // Filter to only include ayahs in our range
      const filteredVerses = data.verses.filter((v: QuranVerse) =>
        v.verse_number >= startAyah && v.verse_number <= endAyah
      );

      verses.push(...filteredVerses);
    }

    // Sort verses
    verses.sort((a, b) => a.verse_number - b.verse_number);

    // Fetch translations separately (API v4 requires separate endpoint)
    if (includeTranslation && verses.length > 0) {
      try {
        const translationResponse = await fetch(
          `${QURAN_API_BASE}/quran/translations/${translationId}?chapter_number=${surahNumber}`
        );

        if (translationResponse.ok) {
          const translationData = await translationResponse.json();
          const translations = translationData.translations || [];

          // Map translations to verses by index (translations are in verse order)
          verses.forEach((verse, index) => {
            // Find the matching translation by verse number (1-indexed)
            const translationIndex = verse.verse_number - 1;
            if (translations[translationIndex]) {
              verse.translations = [{
                text: translations[translationIndex].text,
                resource_name: 'Abdul Haleem'
              }];
            }
          });
        }
      } catch (translationError) {
        console.error('Error fetching translations:', translationError);
        // Continue without translations
      }
    }

    return verses;
  } catch (error) {
    console.error('Error fetching verses:', error);
    return [];
  }
}

/**
 * Extract first word data from verses - the key function for First Word Prompter
 */
export async function getFirstWordsForAyahs(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): Promise<FirstWordData[]> {
  const verses = await getVerses(surahNumber, startAyah, endAyah);

  return verses.map(verse => {
    // Find the first actual word (not end marker)
    const firstWord = verse.words.find(w => w.char_type_name === 'word' && w.position === 1);

    // Build full verse from words (API doesn't always return text_uthmani directly)
    const fullVerseFromWords = verse.words
      .filter(w => w.char_type_name === 'word')
      .map(w => w.text_uthmani)
      .join(' ');

    // Get translation if available
    const translation = verse.translations?.[0]?.text || '';

    return {
      ayahNumber: verse.verse_number,
      verseKey: verse.verse_key,
      firstWord: firstWord?.text_uthmani || '',
      firstWordSimple: firstWord?.text_simple || '',
      transliteration: firstWord?.transliteration?.text || '',
      translation: firstWord?.translation?.text || '',
      fullVerseUthmani: fullVerseFromWords || verse.text_uthmani || '',
      fullVerseTranslation: translation,
    };
  });
}

/**
 * Generate First Word Prompter markdown table with verified data
 */
export async function generateFirstWordPrompterMarkdown(
  surahNumber: number,
  startAyah: number,
  endAyah: number,
  surahName?: string
): Promise<string> {
  const firstWords = await getFirstWordsForAyahs(surahNumber, startAyah, endAyah);

  if (firstWords.length === 0) {
    return '> Unable to fetch verified Quran data. Please check the ayah range.';
  }

  let markdown = `## 🎯 First Word Prompter (Verified from Quran.com)\n\n`;
  markdown += `**Surah ${surahName || surahNumber}, Ayat ${startAyah}-${endAyah}**\n\n`;
  markdown += `| Ayah | First Word | Transliteration | Meaning |\n`;
  markdown += `|------|------------|-----------------|----------|\n`;

  for (const fw of firstWords) {
    markdown += `| ${fw.ayahNumber} | ${fw.firstWord} | ${fw.transliteration || '-'} | ${fw.translation || '-'} |\n`;
  }

  markdown += `\n**Practice:** Look at the first word, then try to recite the complete ayah from memory!\n`;

  return markdown;
}

/**
 * Validate AI-generated first words against actual Quran data
 * Returns corrections if any are found
 */
export async function validateFirstWords(
  surahNumber: number,
  aiGeneratedWords: { ayahNumber: number; firstWord: string }[]
): Promise<{
  isValid: boolean;
  corrections: {
    ayahNumber: number;
    aiWord: string;
    correctWord: string;
  }[];
}> {
  const verifiedWords = await getFirstWordsForAyahs(
    surahNumber,
    Math.min(...aiGeneratedWords.map(w => w.ayahNumber)),
    Math.max(...aiGeneratedWords.map(w => w.ayahNumber))
  );

  const corrections: { ayahNumber: number; aiWord: string; correctWord: string }[] = [];

  for (const aiWord of aiGeneratedWords) {
    const verified = verifiedWords.find(v => v.ayahNumber === aiWord.ayahNumber);
    if (verified) {
      // Check if the AI word matches (allowing for some variation in Arabic encoding)
      const aiNormalized = normalizeArabic(aiWord.firstWord);
      const verifiedNormalized = normalizeArabic(verified.firstWord);

      if (aiNormalized !== verifiedNormalized) {
        corrections.push({
          ayahNumber: aiWord.ayahNumber,
          aiWord: aiWord.firstWord,
          correctWord: verified.firstWord,
        });
      }
    }
  }

  return {
    isValid: corrections.length === 0,
    corrections,
  };
}

/**
 * Normalize Arabic text for comparison (remove diacritics variations)
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
    .replace(/\u0670/g, '') // Remove superscript alef
    .replace(/ٱ/g, 'ا') // Normalize alef wasla
    .replace(/ى/g, 'ي') // Normalize alef maqsura
    .trim();
}

/**
 * Get full verse text with Uthmani script
 */
export async function getVerseText(
  surahNumber: number,
  ayahNumber: number
): Promise<{ uthmani: string; simple: string; translation: string } | null> {
  try {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_key/${surahNumber}:${ayahNumber}?language=en&translations=131`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const verse = data.verse;

    return {
      uthmani: verse.text_uthmani,
      simple: verse.text_simple || verse.text_uthmani,
      translation: verse.translations?.[0]?.text || '',
    };
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
}

/**
 * Get all surahs list
 */
export async function getAllSurahs(): Promise<ChapterInfo[]> {
  try {
    const response = await fetch(`${QURAN_API_BASE}/chapters?language=en`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.chapters;
  } catch (error) {
    console.error('Error fetching surahs:', error);
    return [];
  }
}

// ============================================================================
// QUIZ VERIFICATION UTILITIES (Frontend)
// ============================================================================

export interface VerifiedVerse {
  ayahNumber: number;
  verseKey: string;
  firstWord: string;
  transliteration: string;
  translation: string;
  fullVerseUthmani: string;
  fullVerseTranslation: string;
}

export interface QuizQuestion {
  question: string;
  options: { text: string; arabic?: string; transliteration?: string }[];
  correctAnswer: number;
}

export interface QuizVerificationWarning {
  questionIndex: number;
  question: string;
  answer: string;
  warning: string;
  verseRef?: string;
}

// Patterns to detect questions that reference specific verses
const VERSE_QUESTION_PATTERNS = [
  /what\s+(?:did|does)\s+(?:Allah|Pharaoh|Fir(?:'|')awn|Musa|Moses|Ibrahim|Abraham|the\s+(?:Lord|Creator))\s+(?:say|declare|proclaim)/i,
  /according\s+to\s+(?:this\s+)?(?:ayah|verse|āyah)/i,
  /(?:ayah|verse|āyah)\s+(\d+)/i,
  /(?:Pharaoh|Fir(?:'|')awn)(?:'|')s?\s+(?:claim|declaration|statement)/i,
];

/**
 * Check if a quiz question is about a specific verse
 */
export function isVerseRelatedQuestion(question: string): boolean {
  return VERSE_QUESTION_PATTERNS.some(pattern => pattern.test(question));
}

/**
 * Extract verse number from a question
 */
export function extractVerseNumber(question: string): number | null {
  const match = question.match(/(?:ayah|verse|āyah)\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Calculate text similarity (Jaccard on words)
 */
function calculateSimilarity(str1: string, str2: string): number {
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
 * Verify quiz questions against verified verses at display time
 * Returns warnings for any questions that may have incorrect answers
 */
export function verifyQuizAtDisplayTime(
  questions: QuizQuestion[],
  verifiedVerses: VerifiedVerse[]
): { questions: QuizQuestion[]; warnings: QuizVerificationWarning[] } {
  const warnings: QuizVerificationWarning[] = [];

  if (!verifiedVerses || verifiedVerses.length === 0) {
    return { questions, warnings };
  }

  questions.forEach((q, index) => {
    // Skip if not a verse-related question
    if (!isVerseRelatedQuestion(q.question)) return;

    // Get the correct answer text
    const correctOption = q.options[q.correctAnswer];
    if (!correctOption) return;

    const answerText = correctOption.text;

    // Try to find matching verse
    const verseNum = extractVerseNumber(q.question);
    let matchedVerse: VerifiedVerse | undefined;

    if (verseNum) {
      matchedVerse = verifiedVerses.find(v => v.ayahNumber === verseNum);
    }

    // If no specific verse, try to match by content
    if (!matchedVerse) {
      let bestSim = 0;
      for (const v of verifiedVerses) {
        const sim = calculateSimilarity(answerText, v.fullVerseTranslation);
        if (sim > bestSim) {
          bestSim = sim;
          matchedVerse = v;
        }
      }
      if (bestSim < 0.2) matchedVerse = undefined;
    }

    if (matchedVerse) {
      const similarity = calculateSimilarity(answerText, matchedVerse.fullVerseTranslation);

      // If very low similarity, warn about potential incorrect answer
      if (similarity < 0.3) {
        warnings.push({
          questionIndex: index,
          question: q.question,
          answer: answerText,
          warning: `Answer may not match verified Quran text`,
          verseRef: matchedVerse.verseKey
        });
      }
    }
  });

  return { questions, warnings };
}
