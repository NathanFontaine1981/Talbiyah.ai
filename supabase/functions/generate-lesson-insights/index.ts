// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  verifyAndCorrectQuizAnswers,
  createVerificationLog,
  markQuizAnswersFromVocabulary,
  type VerificationSummary
} from "../_shared/quizVerification.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

interface LessonInsightRequest {
  lesson_id: string;
  transcript: string;
  subject: string; // 'quran', 'arabic', etc.
  lesson_title?: string; // Full lesson title which may contain surah info
  metadata: {
    // For Quran lessons
    surah_name?: string;
    surah_number?: number;
    ayah_range?: string;
    // Common fields
    teacher_name: string;
    student_names: string[];
    lesson_date: string;
    duration_minutes?: number;
  };
}

// Surah name to number mapping for common surahs
const SURAH_NAME_TO_NUMBER: Record<string, number> = {
  'al-fatiha': 1, 'fatiha': 1,
  'al-baqarah': 2, 'baqarah': 2,
  'al-imran': 3, 'imran': 3, 'ali-imran': 3,
  'an-nisa': 4, 'nisa': 4,
  'al-maidah': 5, 'maidah': 5,
  'al-anam': 6, 'anam': 6,
  'al-araf': 7, 'araf': 7,
  'al-anfal': 8, 'anfal': 8,
  'at-tawbah': 9, 'tawbah': 9,
  'yunus': 10,
  'hud': 11,
  'yusuf': 12,
  'ar-rad': 13, 'rad': 13,
  'ibrahim': 14,
  'al-hijr': 15, 'hijr': 15,
  'an-nahl': 16, 'nahl': 16,
  'al-isra': 17, 'isra': 17,
  'al-kahf': 18, 'kahf': 18,
  'maryam': 19,
  'ta-ha': 20, 'taha': 20,
  'al-anbiya': 21, 'anbiya': 21,
  'al-hajj': 22, 'hajj': 22,
  'al-muminun': 23, 'muminun': 23,
  'an-nur': 24, 'nur': 24,
  'al-furqan': 25, 'furqan': 25,
  'ash-shuara': 26, 'shuara': 26,
  'an-naml': 27, 'naml': 27,
  'al-qasas': 28, 'qasas': 28,
  'al-ankabut': 29, 'ankabut': 29,
  'ar-rum': 30, 'rum': 30,
  'luqman': 31,
  'as-sajdah': 32, 'sajdah': 32,
  'al-ahzab': 33, 'ahzab': 33,
  'saba': 34,
  'fatir': 35,
  'ya-sin': 36, 'yasin': 36,
  'as-saffat': 37, 'saffat': 37,
  'sad': 38,
  'az-zumar': 39, 'zumar': 39,
  'ghafir': 40,
  'fussilat': 41,
  'ash-shura': 42, 'shura': 42,
  'az-zukhruf': 43, 'zukhruf': 43,
  'ad-dukhan': 44, 'dukhan': 44,
  'al-jathiyah': 45, 'jathiyah': 45,
  'al-ahqaf': 46, 'ahqaf': 46,
  'muhammad': 47,
  'al-fath': 48, 'fath': 48,
  'al-hujurat': 49, 'hujurat': 49,
  'qaf': 50,
  'adh-dhariyat': 51, 'dhariyat': 51,
  'at-tur': 52, 'tur': 52,
  'an-najm': 53, 'najm': 53,
  'al-qamar': 54, 'qamar': 54,
  'ar-rahman': 55, 'rahman': 55,
  'al-waqiah': 56, 'waqiah': 56,
  'al-hadid': 57, 'hadid': 57,
  'al-mujadilah': 58, 'mujadilah': 58,
  'al-hashr': 59, 'hashr': 59,
  'al-mumtahanah': 60, 'mumtahanah': 60,
  'as-saff': 61, 'saff': 61,
  'al-jumuah': 62, 'jumuah': 62,
  'al-munafiqun': 63, 'munafiqun': 63,
  'at-taghabun': 64, 'taghabun': 64,
  'at-talaq': 65, 'talaq': 65,
  'at-tahrim': 66, 'tahrim': 66,
  'al-mulk': 67, 'mulk': 67,
  'al-qalam': 68, 'qalam': 68,
  'al-haqqah': 69, 'haqqah': 69,
  'al-maarij': 70, 'maarij': 70,
  'nuh': 71,
  'al-jinn': 72, 'jinn': 72,
  'al-muzzammil': 73, 'muzzammil': 73,
  'al-muddaththir': 74, 'muddaththir': 74,
  'al-qiyamah': 75, 'qiyamah': 75,
  'al-insan': 76, 'insan': 76,
  'al-mursalat': 77, 'mursalat': 77,
  'an-naba': 78, 'naba': 78,
  'an-naziat': 79, 'naziat': 79,
  'abasa': 80,
  'at-takwir': 81, 'takwir': 81,
  'al-infitar': 82, 'infitar': 82,
  'al-mutaffifin': 83, 'mutaffifin': 83,
  'al-inshiqaq': 84, 'inshiqaq': 84,
  'al-buruj': 85, 'buruj': 85,
  'at-tariq': 86, 'tariq': 86,
  'al-ala': 87, 'ala': 87,
  'al-ghashiyah': 88, 'ghashiyah': 88,
  'al-fajr': 89, 'fajr': 89,
  'al-balad': 90, 'balad': 90,
  'ash-shams': 91, 'shams': 91,
  'al-layl': 92, 'layl': 92,
  'ad-duha': 93, 'duha': 93,
  'ash-sharh': 94, 'sharh': 94, 'al-inshirah': 94, 'inshirah': 94,
  'at-tin': 95, 'tin': 95,
  'al-alaq': 96, 'alaq': 96,
  'al-qadr': 97, 'qadr': 97,
  'al-bayyinah': 98, 'bayyinah': 98,
  'az-zalzalah': 99, 'zalzalah': 99,
  'al-adiyat': 100, 'adiyat': 100,
  'al-qariah': 101, 'qariah': 101,
  'at-takathur': 102, 'takathur': 102,
  'al-asr': 103, 'asr': 103,
  'al-humazah': 104, 'humazah': 104,
  'al-fil': 105, 'fil': 105,
  'quraysh': 106,
  'al-maun': 107, 'maun': 107,
  'al-kawthar': 108, 'kawthar': 108,
  'al-kafirun': 109, 'kafirun': 109,
  'an-nasr': 110, 'nasr': 110,
  'al-masad': 111, 'masad': 111,
  'al-ikhlas': 112, 'ikhlas': 112,
  'al-falaq': 113, 'falaq': 113,
  'an-nas': 114, 'nas': 114,
};

/**
 * Parse surah info from a title string like "Quran with Tadabbur: Surah An-Naba (78) - The Great News"
 * or "Surah Al-Mulk (67), Ayat 1-10"
 */
function parseSurahInfoFromTitle(title: string): { surahName?: string; surahNumber?: number; ayahRange?: string } | null {
  if (!title) return null;

  // Pattern 1: "Surah Name (number)" or "Surah Name (number) - Description"
  // e.g., "Surah An-Naba (78)" or "Surah An-Naba (78) - The Great News"
  const pattern1 = /[Ss]urah\s+([A-Za-z\-']+)\s*\((\d+)\)/i;
  const match1 = title.match(pattern1);

  if (match1) {
    const result: { surahName?: string; surahNumber?: number; ayahRange?: string } = {
      surahName: match1[1].trim(),
      surahNumber: parseInt(match1[2], 10),
    };

    // Try to extract ayah range: "Ayat X-Y" or "Verses X-Y" or "(X-Y)"
    const ayahPattern = /(?:[Aa]yat?|[Vv]erses?)\s*([\d]+)\s*[-–]\s*([\d]+)/;
    const ayahMatch = title.match(ayahPattern);
    if (ayahMatch) {
      result.ayahRange = `${ayahMatch[1]}-${ayahMatch[2]}`;
    }

    return result;
  }

  // Pattern 2: Just "Surah Name" without number - look up in mapping
  const pattern2 = /[Ss]urah\s+([A-Za-z\-']+)/i;
  const match2 = title.match(pattern2);

  if (match2) {
    const surahName = match2[1].trim();
    const normalizedName = surahName.toLowerCase().replace(/['']/g, '');
    const surahNumber = SURAH_NAME_TO_NUMBER[normalizedName];

    if (surahNumber) {
      const result: { surahName?: string; surahNumber?: number; ayahRange?: string } = {
        surahName: surahName,
        surahNumber: surahNumber,
      };

      // Try to extract ayah range
      const ayahPattern = /(?:[Aa]yat?|[Vv]erses?)\s*([\d]+)\s*[-–]\s*([\d]+)/;
      const ayahMatch = title.match(ayahPattern);
      if (ayahMatch) {
        result.ayahRange = `${ayahMatch[1]}-${ayahMatch[2]}`;
      }

      return result;
    }
  }

  return null;
}

/**
 * Extract surah info from AI-generated content
 * Looks for patterns like "Surah Actually Covered: Surah An-Naba (78)" or "Main Lesson Content: Surah Al-Mulk, Ayat 1-10"
 */
function extractSurahInfoFromAIContent(content: string): { surahName?: string; surahNumber?: number; ayahRange?: string } | null {
  const patterns = [
    // "Surah Actually Covered: Surah An-Naba (78)"
    /Surah Actually Covered[:\s]+(?:Surah\s+)?([A-Za-z\-']+)(?:\s*\((\d+)\))?/i,
    // "Main Lesson Content: Surah Al-Mulk (67), Ayat 1-10"
    /Main Lesson Content[:\s]+(?:Surah\s+)?([A-Za-z\-']+)(?:\s*\((\d+)\))?(?:,?\s*(?:Ayat?|Verses?)?\s*([\d]+[-–][\d]+))?/i,
    // "Surah: An-Naba (78)" or just "Surah: An-Naba"
    /^[\*\-\s]*Surah[:\s]+(?:Surah\s+)?([A-Za-z\-']+)(?:\s+and\s+[A-Za-z\-']+)?(?:\s*\((\d+)\))?/im,
    // "Verses Covered: An-Naba 1-40"
    /Verses Covered[:\s]+([A-Za-z\-']+)\s*([\d]+[-–][\d]+)?/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const surahName = match[1].trim();
      let surahNumber = match[2] ? parseInt(match[2], 10) : undefined;

      // If no number found, look up in mapping
      if (!surahNumber) {
        const normalizedName = surahName.toLowerCase().replace(/['']/g, '');
        surahNumber = SURAH_NAME_TO_NUMBER[normalizedName];
      }

      const result: { surahName?: string; surahNumber?: number; ayahRange?: string } = {
        surahName: surahName,
        surahNumber: surahNumber,
      };

      // Extract ayah range if present in match
      if (match[3]) {
        result.ayahRange = match[3].replace('–', '-');
      } else {
        // Try to find ayah range elsewhere in first 2000 chars
        const ayahPattern = /(?:Ayat?|Verses?)[:\s]*([\d]+)\s*[-–]\s*([\d]+)/i;
        const ayahMatch = content.substring(0, 2000).match(ayahPattern);
        if (ayahMatch) {
          result.ayahRange = `${ayahMatch[1]}-${ayahMatch[2]}`;
        }
      }

      return result;
    }
  }

  return null;
}

interface VerifiedVerse {
  ayahNumber: number;
  verseKey: string;
  firstWord: string;
  transliteration: string;
  translation: string;
  fullVerseUthmani: string;
  fullVerseTranslation: string;
}

interface TafsirEntry {
  verseKey: string;
  ayahNumber: number;
  text: string;
  tafsirName: string;
}

interface CachedSurahData {
  surah_number: number;
  surah_name_arabic: string;
  surah_name_english: string;
  surah_name_transliteration: string;
  total_ayahs: number;
  revelation_type: string;
  themes: string[] | null;
  verses: Record<string, {
    arabic: string;
    translation: string;
    first_word: string;
    first_word_transliteration: string;
  }>;
  tafsir_ibn_kathir: Record<string, string> | null;
}

/**
 * PHASE 2: Fetch verified Quran data from pre-cached surah_data table
 * This provides A* reliability - no external API calls during insight generation
 */
async function fetchCachedSurahData(
  supabase: ReturnType<typeof createClient>,
  surahNumber: number
): Promise<CachedSurahData | null> {
  try {
    const { data, error } = await supabase
      .from('surah_data')
      .select('*')
      .eq('surah_number', surahNumber)
      .single();

    if (error || !data) {
      console.log(`Surah ${surahNumber} not found in cache, will use API fallback`);
      return null;
    }

    console.log(`✅ Found cached data for Surah ${surahNumber} (${data.surah_name_english})`);
    return data as CachedSurahData;
  } catch (error) {
    console.error('Error fetching cached surah data:', error);
    return null;
  }
}

/**
 * PHASE 2: Convert cached surah data to VerifiedVerse format
 */
function convertCachedToVerifiedVerses(
  cachedData: CachedSurahData,
  startAyah: number,
  endAyah: number
): VerifiedVerse[] {
  const verses: VerifiedVerse[] = [];

  for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
    const verseData = cachedData.verses[ayahNum.toString()];
    if (verseData) {
      verses.push({
        ayahNumber: ayahNum,
        verseKey: `${cachedData.surah_number}:${ayahNum}`,
        firstWord: verseData.first_word || '',
        transliteration: verseData.first_word_transliteration || '',
        translation: verseData.translation?.split(' ').slice(0, 5).join(' ') || '',
        fullVerseUthmani: verseData.arabic || '',
        fullVerseTranslation: verseData.translation || '',
      });
    }
  }

  return verses.sort((a, b) => a.ayahNumber - b.ayahNumber);
}

/**
 * PHASE 2: Convert cached tafsir data to TafsirEntry format
 */
function convertCachedToTafsirEntries(
  cachedData: CachedSurahData,
  startAyah: number,
  endAyah: number
): TafsirEntry[] {
  const entries: TafsirEntry[] = [];

  if (!cachedData.tafsir_ibn_kathir) {
    return entries;
  }

  for (let ayahNum = startAyah; ayahNum <= endAyah; ayahNum++) {
    const tafsirText = cachedData.tafsir_ibn_kathir[ayahNum.toString()];
    if (tafsirText) {
      entries.push({
        verseKey: `${cachedData.surah_number}:${ayahNum}`,
        ayahNumber: ayahNum,
        text: tafsirText,
        tafsirName: 'Ibn Kathir (Abridged)',
      });
    }
  }

  return entries;
}

/**
 * Fetch scholarly tafsir from Quran.com API
 * Uses Ibn Kathir (Abridged) - ID 169 for English tafsir
 */
async function fetchTafsirData(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): Promise<TafsirEntry[]> {
  const tafsirEntries: TafsirEntry[] = [];
  const TAFSIR_ID = 169; // Ibn Kathir (Abridged) in English

  try {
    // Fetch tafsir for each verse in range (API returns per-ayah)
    const fetchPromises: Promise<Response>[] = [];
    for (let ayah = startAyah; ayah <= endAyah; ayah++) {
      const verseKey = `${surahNumber}:${ayah}`;
      fetchPromises.push(
        fetch(`${QURAN_API_BASE}/tafsirs/${TAFSIR_ID}/by_ayah/${verseKey}`)
      );
    }

    const responses = await Promise.all(fetchPromises);

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const ayahNumber = startAyah + i;
      const verseKey = `${surahNumber}:${ayahNumber}`;

      if (response.ok) {
        const data = await response.json();
        if (data.tafsir?.text) {
          // Clean HTML tags from tafsir text
          let cleanText = data.tafsir.text
            .replace(/<h2[^>]*>.*?<\/h2>/gi, '') // Remove headers
            .replace(/<p[^>]*>/gi, '\n') // Replace p tags with newlines
            .replace(/<\/p>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
            .trim();

          // Limit length per verse to keep response manageable
          if (cleanText.length > 2000) {
            cleanText = cleanText.substring(0, 2000) + '...';
          }

          tafsirEntries.push({
            verseKey,
            ayahNumber,
            text: cleanText,
            tafsirName: data.tafsir.resource_name || 'Ibn Kathir (Abridged)'
          });
        }
      } else {
        console.warn(`Failed to fetch tafsir for ${verseKey}: ${response.status}`);
      }
    }

    return tafsirEntries;
  } catch (error) {
    console.error('Error fetching tafsir data:', error);
    return [];
  }
}

/**
 * Generate Tafsir section with actual scholarly commentary
 */
function generateTafsirSection(tafsirEntries: TafsirEntry[], surahName: string): string {
  if (tafsirEntries.length === 0) return '';

  let section = `
---

## 📖 Scholarly Tafsir (Ibn Kathir)

**Surah ${surahName} - Classical Commentary from Tafsir Ibn Kathir**

*This tafsir is sourced directly from Quran.com's verified scholarly database.*

`;

  for (const entry of tafsirEntries) {
    section += `### Ayah ${entry.ayahNumber}\n\n`;
    section += `${entry.text}\n\n`;
  }

  section += `---\n\n*Source: ${tafsirEntries[0]?.tafsirName || 'Ibn Kathir (Abridged)'} via Quran.com API*\n\n`;

  return section;
}

/**
 * Fetch verified Quran verses from Quran.com API
 * Uses separate endpoints for Arabic text and translations, then merges them
 */
async function fetchVerifiedQuranData(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): Promise<VerifiedVerse[]> {
  try {
    // Fetch Arabic text, translations, and word data in parallel
    const [arabicResponse, translationResponse, wordsResponse] = await Promise.all([
      fetch(`${QURAN_API_BASE}/quran/verses/uthmani?chapter_number=${surahNumber}`),
      fetch(`${QURAN_API_BASE}/quran/translations/20?chapter_number=${surahNumber}`), // Saheeh International
      fetch(`${QURAN_API_BASE}/verses/by_chapter/${surahNumber}?words=true&word_fields=text_uthmani,transliteration&per_page=300`)
    ]);

    if (!arabicResponse.ok || !translationResponse.ok || !wordsResponse.ok) {
      console.error('Failed to fetch from Quran API:', {
        arabic: arabicResponse.status,
        translation: translationResponse.status,
        words: wordsResponse.status
      });
      return [];
    }

    const [arabicData, translationData, wordsData] = await Promise.all([
      arabicResponse.json(),
      translationResponse.json(),
      wordsResponse.json()
    ]);

    // Create maps for easy lookup
    const arabicMap = new Map<number, string>();
    for (const verse of arabicData.verses || []) {
      const verseNum = parseInt(verse.verse_key?.split(':')[1] || '0');
      if (verseNum > 0) {
        arabicMap.set(verseNum, verse.text_uthmani);
      }
    }

    const translationMap = new Map<number, string>();
    let translationIndex = 1;
    for (const trans of translationData.translations || []) {
      translationMap.set(translationIndex, trans.text?.replace(/<[^>]*>/g, '') || '');
      translationIndex++;
    }

    const verses: VerifiedVerse[] = [];

    for (const verse of wordsData.verses || []) {
      if (verse.verse_number >= startAyah && verse.verse_number <= endAyah) {
        const firstWord = verse.words?.find(
          (w: { char_type_name: string; position: number }) =>
            w.char_type_name === 'word' && w.position === 1
        );

        verses.push({
          ayahNumber: verse.verse_number,
          verseKey: verse.verse_key,
          firstWord: firstWord?.text_uthmani || '',
          transliteration: firstWord?.transliteration?.text || '',
          translation: translationMap.get(verse.verse_number)?.split(' ').slice(0, 5).join(' ') || '',
          fullVerseUthmani: arabicMap.get(verse.verse_number) || '',
          fullVerseTranslation: translationMap.get(verse.verse_number) || '',
        });
      }
    }

    return verses.sort((a, b) => a.ayahNumber - b.ayahNumber);
  } catch (error) {
    console.error('Error fetching Quran data:', error);
    return [];
  }
}

/**
 * Generate Verses Covered section with verified full Arabic and translation
 */
function generateVersesCoveredSection(verses: VerifiedVerse[], surahName: string): string {
  if (verses.length === 0) return '';

  let section = `
---

## 📖 Verses Covered (Verified from Quran.com)

**Surah ${surahName} - ${verses.length} verses studied**

| Ayah | Arabic Text | English Translation |
|------|-------------|---------------------|
`;

  for (const v of verses) {
    // Escape any pipe characters in the text
    const arabic = (v.fullVerseUthmani || v.firstWord || '').replace(/\|/g, '\\|');
    const translation = (v.fullVerseTranslation || v.translation || '').replace(/\|/g, '\\|');
    section += `| ${v.ayahNumber} | ${arabic} | ${translation} |\n`;
  }

  section += `
`;

  return section;
}

/**
 * Generate First Word Prompter section with verified data
 */
function generateFirstWordPrompterSection(verses: VerifiedVerse[]): string {
  if (verses.length === 0) return '';

  let section = `
---

## 🎯 First Word Prompter (Verified from Quran.com)

Use this for memorization practice - see the first word and try to recall the complete ayah!

| Ayah | First Word | Transliteration | Translation Hint |
|------|------------|-----------------|------------------|
`;

  for (const v of verses) {
    section += `| ${v.ayahNumber} | ${v.firstWord} | ${v.transliteration || '-'} | ${v.translation || '-'} |\n`;
  }

  section += `
**Practice Method:**
1. Cover the verse and look only at the first word
2. Try to recite the complete ayah from memory
3. Check your answer
4. Repeat until automatic

`;

  return section;
}

// Quran Lesson Types - detected from transcript
type QuranLessonType = 'tafsir' | 'hifdh' | 'revision' | 'mixed';

interface LessonClassification {
  lessonType: QuranLessonType;
  confidence: number;
  surahNumber?: number;
  surahName?: string;
  ayahRange?: string;
  reasoning: string;
}

/**
 * Classify the Quran lesson type from transcript content
 * Returns: tafsir, hifdh, revision, or mixed
 */
async function classifyQuranLessonType(
  transcript: string,
  anthropicApiKey: string
): Promise<LessonClassification> {
  const classificationPrompt = `Analyze this Quran lesson transcript and classify it.

CLASSIFICATION TYPES:
1. **tafsir** - Teacher EXPLAINS meanings, themes, context, or scholarly commentary. Student asks questions about meanings. Focus is on UNDERSTANDING.
2. **hifdh** - Student READS/RECITES verses, teacher CORRECTS pronunciation/tajweed. Student REPEATS after teacher. Focus is on MEMORIZATION or FLUENT READING.
3. **revision** - Student recites FROM MEMORY, teacher listens and notes mistakes. Testing previously memorized content.
4. **mixed** - Combination: some explanation AND some reading practice in the same lesson.

ANALYZE THE TRANSCRIPT FOR:
- Who is speaking more? (Teacher explaining = tafsir, Student reciting = hifdh/revision)
- Is the teacher explaining meanings or correcting pronunciation?
- Is the student reading from text or reciting from memory?
- Are there discussions about tafsir/themes or focus on recitation accuracy?

ALSO EXTRACT:
- Surah name and number actually covered
- Ayah range discussed/recited

Respond in this EXACT JSON format (no other text):
{
  "lessonType": "tafsir" | "hifdh" | "revision" | "mixed",
  "confidence": 0.0-1.0,
  "surahNumber": number or null,
  "surahName": "string" or null,
  "ayahRange": "X-Y" or null,
  "reasoning": "Brief explanation of classification"
}

TRANSCRIPT:
${transcript.substring(0, 8000)}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        temperature: 0.1,
        messages: [{ role: "user", content: classificationPrompt }]
      }),
    });

    if (!response.ok) {
      console.error("Classification API error:", await response.text());
      return { lessonType: 'mixed', confidence: 0.5, reasoning: 'Classification failed, using default' };
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("Lesson classification:", parsed);
      return {
        lessonType: parsed.lessonType || 'mixed',
        confidence: parsed.confidence || 0.7,
        surahNumber: parsed.surahNumber,
        surahName: parsed.surahName,
        ayahRange: parsed.ayahRange,
        reasoning: parsed.reasoning || ''
      };
    }
  } catch (error) {
    console.error("Error classifying lesson:", error);
  }

  return { lessonType: 'mixed', confidence: 0.5, reasoning: 'Classification failed, using default' };
}

// =============================================================================
// QURAN LESSON PROMPTS - Specialized for each lesson type
// =============================================================================

const QURAN_TAFSIR_PROMPT = `You are Talbiyah Insights – Qur'an Tafsir & Tadabbur Specialist.
This lesson was identified as a TAFSIR/UNDERSTANDING focused lesson where the teacher explains verse meanings.

Your task: Transform this transcript into comprehensive study notes focused on UNDERSTANDING and REFLECTION.

---

### 🕌 TALBIYAH INSIGHTS – QUR'ĀN TAFSIR & TADABBUR

**1. Lesson Information**
- Surah Covered: [Extract from transcript]
- Verses Explained: [Specific ayat range, e.g., "1-16"]
- Teacher: [Name]
- Student(s): [Name(s)]
- Date: [Lesson date]
- Lesson Focus: Tafsir & Understanding

---

**2. Verses Studied (Arabic & Translation)**
⚠️ CRITICAL: List EVERY verse from the lesson, starting from ayah 1. Do NOT skip any verses.

| Ayah | Arabic (with full tashkīl) | English Translation |
|------|---------------------------|---------------------|
| 1    | [First verse Arabic]       | [Translation]       |
| 2    | [Second verse Arabic]      | [Translation]       |
... continue for ALL verses discussed in the lesson

---

**3. Tafsir (Verse-by-Verse)**
For each verse or group of verses, provide the teacher's explanation in this format:

### Ayat 1-2: [Theme Title]
**Arabic:** [Arabic text of these verses]
**Translation:** [English translation]
**Teacher's Explanation:** [What the teacher explained about these verses - 2-3 sentences]

### Ayat 3-5: [Theme Title]
**Arabic:** [Arabic text]
**Translation:** [English translation]
**Teacher's Explanation:** [Teacher's explanation - 2-3 sentences]

... continue for all verse groups discussed in the lesson.

⚠️ Group verses by theme (2-4 verses per group). Each group should have Arabic, translation, and explanation.

---

**4. Key Arabic Vocabulary**
List **15-20 important words** from the verses studied:

| Arabic | Transliteration | Root | Meaning | Context |
|--------|-----------------|------|---------|---------|
| النبأ | an-naba' | ن ب أ | news/tidings | The "great news" refers to... |

---

**5. Themes & Tadabbur Points**
List 8-10 key spiritual lessons and reflections:
- [Theme 1]
- [Theme 2]
...

---

**6. Mini Quiz**
Create 5-6 multiple-choice questions. DO NOT mark any answers yet.

Format (no ✅ markers):
**Q1.** [Question about vocabulary or verse meaning]
A) [Option]
B) [Option]
C) [Option]
D) [Option]

**Q2.** [Next question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]

⚠️ IMPORTANT: Do NOT mark correct answers with ✅. Leave all options unmarked.
Quiz answers will be verified separately against authentic sources.

---

**7. Reflection Questions**
4-5 deep questions for personal contemplation.

---

**8. Homework**
- 📖 Re-read verses with reflection
- ✍️ Written response to one reflection question
- 🎧 Listen to the verses with a recommended reciter

---

**9. Summary**
3-4 sentences capturing the main spiritual message.

---

### RULES
- Include ALL verses from the lesson in section 2 - do not skip any
- Tafsir section must be prose only - no tables
- Do NOT mark quiz answers - leave them unmarked
- Use Arabic with full tashkīl throughout
- Focus on what the TEACHER actually explained`;

const QURAN_HIFDH_PROMPT = `You are Talbiyah Insights – Qur'an Hifdh (Memorization) Specialist.
This lesson was identified as a HIFDH/MEMORIZATION focused lesson where the student practices reading or memorizing.

Your task: Transform this transcript into practical memorization aids and recitation guides.

---

### 🕌 TALBIYAH INSIGHTS – QUR'ĀN HIFDH (MEMORIZATION)

**1. Lesson Information**
- Surah Practiced: [Extract from transcript]
- Verses Covered: [Ayat that were read/memorized]
- Teacher: [Name]
- Student(s): [Name(s)]
- Date: [Lesson date]
- Lesson Focus: Memorization & Recitation Practice

---

**2. Verses Practiced**
List all verses that were read/recited:
| Ayah | Arabic (with tashkīl) | Transliteration | Translation |
|------|----------------------|-----------------|-------------|

---

**3. 🎯 First Word Prompter (Memorization Aid)**
This is the CORE section for hifdh lessons. For EACH ayah:
| Ayah | First Word | Transliteration | English Hint | Full Verse Preview |
|------|------------|-----------------|--------------|-------------------|

**How to use:**
1. Look at the first word only
2. Try to recall the complete ayah
3. Check your answer
4. Repeat until automatic

---

**4. 🔍 Verse Revealer (Progressive Practice)**
For each verse, show it in stages for gradual memorization:
**Ayah X:**
- First 2 words: [Arabic] - [Transliteration]
- First half: [Arabic] - [Transliteration]
- Full verse: [Arabic] - [Transliteration]

---

**5. Pronunciation & Tajweed Notes**
Document corrections and tips from the lesson:
- ✅ Corrections made by teacher
- 🔊 Specific letters/sounds to practice
- ⚠️ Common mistakes to avoid
- 💡 Tajweed rules applied (if mentioned)

---

**6. Connection Phrases**
How verses connect to help with flow:
| End of Ayah X | Beginning of Ayah X+1 | Connection Tip |
|---------------|----------------------|----------------|

---

**7. Recitation Checklist**
Self-assessment for the student:
☐ Can recite Ayah 1 without looking
☐ Can recite Ayah 2 without looking
... (for each verse)
☐ Can recite all verses in sequence
☐ Tajweed is correct on difficult letters

---

**8. Brief Meaning Summary**
Short meaning of each verse (1 sentence each) to aid memorization through understanding:
- Ayah 1: [Brief meaning]
- Ayah 2: [Brief meaning]

---

**9. Practice Plan**
- 🔁 Morning: Recite new verses 10x each
- 🔁 Evening: Review and connect to previous verses
- 🎧 Listen to Sheikh [Recommended reciter] before bed
- 📝 Write verses from memory to test retention

---

**10. Progress Notes**
- Verses memorized this lesson: X
- Total verses in surah: Y
- Remaining: Z
- Estimated completion: [Based on pace]

---

### RULES
- Focus on MEMORIZATION AIDS and RECITATION
- Include all pronunciation corrections from the teacher
- Make the first-word prompter comprehensive
- Arabic must have full tashkīl for correct pronunciation`;

const QURAN_REVISION_PROMPT = `You are Talbiyah Insights – Qur'an Revision Specialist.
This lesson was identified as a REVISION/TESTING session where the student recited from memory.

Your task: Document what was revised, note mistakes, and create a targeted review plan.

---

### 🕌 TALBIYAH INSIGHTS – QUR'ĀN REVISION SESSION

**1. Session Information**
- Surah(s) Revised: [Extract from transcript]
- Verses Tested: [Ayat recited from memory]
- Teacher: [Name]
- Student: [Name]
- Date: [Lesson date]
- Session Type: Revision & Assessment

---

**2. Revision Summary**
| Surah | Ayat Range | Performance | Notes |
|-------|-----------|-------------|-------|
| [Name] | X-Y | Strong/Needs Work | Brief note |

---

**3. ✅ What Went Well**
Document verses/sections the student recited correctly:
- Strong memorization of: [specific ayat]
- Good tajweed on: [specific sounds/rules]
- Smooth flow between: [ayat connections]

---

**4. ⚠️ Mistakes & Corrections**
Document every mistake noted in the lesson:

| Ayah | Mistake Made | Correct Version | Type |
|------|-------------|-----------------|------|
| X | [What student said] | [Correct text] | Word/Pronunciation/Sequence |

---

**5. 🎯 Priority Review List**
Verses that need the most attention (ranked):
1. **Ayah X** - [Reason: forgotten word/wrong pronunciation]
2. **Ayah Y** - [Reason]
3. **Ayah Z** - [Reason]

---

**6. Targeted Practice Plan**
Based on mistakes, create a specific practice plan:

**Immediate (Today):**
- Recite problematic verses 20x each
- Focus on: [specific corrections]

**This Week:**
- Daily revision of [ayat range]
- Re-memorize: [weak verses]

**Before Next Session:**
- Full recitation test of [surah/section]

---

**7. First Word Prompter (Weak Verses)**
Only for verses that had mistakes:
| Ayah | First Word | Transliteration | What to Remember |
|------|------------|-----------------|------------------|

---

**8. Confidence Tracker**
Self-assessment for next session:
☐ Ayah X - Confident / Needs review
☐ Ayah Y - Confident / Needs review
... (for problematic verses)

---

**9. Teacher Feedback**
Summarize any feedback or encouragement from the teacher.

---

**10. Next Session Goals**
- Revise: [specific section]
- Master: [weak verses]
- New memorization: [if mentioned]

---

### RULES
- Focus on ASSESSMENT and IMPROVEMENT
- Document ALL mistakes accurately
- Create actionable review plans
- Be encouraging but honest about areas needing work`;

const QURAN_MIXED_PROMPT = `You are Talbiyah Insights – Qur'an with Tadabbur.
This lesson contains BOTH explanation/tafsir AND recitation/memorization practice.
Your task is to transform this transcript into comprehensive notes covering BOTH aspects.

---

### ⚠️ CRITICAL: TRANSCRIPT ANALYSIS FIRST

**IMPORTANT**: The metadata provided (surah name, ayah range) may be INACCURATE or a general booking title.
You MUST analyze the transcript carefully to determine:
1. Which surah(s) were ACTUALLY discussed in this lesson
2. Which specific ayat (verses) were covered
3. What topics were actually taught (tafsir, memorization, revision, etc.)

**Rules:**
- If the transcript mentions reviewing/reciting a DIFFERENT surah at the start (e.g., revision of previously learned material), note this separately
- Identify the MAIN surah being taught in this lesson from what the teacher explains
- Extract the actual ayah numbers mentioned in the lesson discussion
- If no specific verses are clearly discussed, state "General discussion" rather than guessing
- Always prioritize what you find in the transcript over the metadata

---

### 🕌 TALBIYAH INSIGHTS – QUR'ĀN WITH TADABBUR (UNDERSTANDING & REFLECTION)

**1. Lesson Information**
- Surah Actually Covered: [Extract from transcript - NOT from metadata]
- Verses Actually Discussed: [Extract from transcript - specify exact ayat]
- Revision/Warm-up: [If student recited a different surah for revision, note it here]
- Teacher: [Name]
- Student(s): [Name(s)]
- Date: [Lesson date]
- Class Type: Qur'an with Tadabbur (Understanding & Reflection)

---

**2. Verses Covered (Arabic & Translation)**
IMPORTANT: Only include verses that were ACTUALLY discussed in the transcript. Do NOT include verses just because they appear in the metadata.

First, clearly state:
- "Main Lesson Content: Surah [Name] ([Number]), Ayat [X-Y]" - based on what the teacher actually explained
- If there was revision: "Revision Portion: Surah [Name], Ayat [X-Y]" - if student recited previous material

Then display each verse that was ACTUALLY studied (not just recited for warm-up) as a table:
- Ayah number
- Full Arabic text (Uthmānī script with tashkīl/vowel marks)
- English translation

Use this table format:
| Ayah | Arabic | Translation |
|------|--------|-------------|
| 1 | بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ | In the name of Allah, the Most Gracious, the Most Merciful |

Only include verses where the teacher provided explanation or discussion.

---

**3. Flow of Meaning (Lesson Explanation)**
NOTE: A separate "Scholarly Tafsir (Ibn Kathir)" section with actual scholarly commentary from Quran.com API will be automatically appended to these insights.

For THIS section, focus on:
- What the TEACHER specifically explained about these verses in the lesson
- Any unique insights, examples, or analogies the teacher used
- Word meanings and concepts the teacher highlighted
- How the teacher connected verses to daily life
- Any questions or discussions that arose during the lesson

**Formatting:**
- Break into paragraphs, one for each group of related ayat discussed
- Use subheadings like "Ayat 1-3: [Topic Teacher Covered]"
- Be honest about what was and wasn't covered - if the teacher only briefly mentioned verses, say so
- This section captures the LESSON EXPERIENCE, while the scholarly tafsir section provides the comprehensive academic commentary

---

**4. Key Arabic Vocabulary**
List **15 important Arabic words** from the verses covered. For each word:
- Arabic word (Uthmānī script with tashkīl)
- Transliteration (with proper vowel marks)
- Root letters (3-letter root)
- English meaning
- Context/note (how it's used in the ayah)

Use this table format:
| Arabic | Transliteration | Root | Meaning | Note |
|--------|-----------------|------|---------|------|
| تَبَـٰرَكَ | tabāraka | ب-ر-ك | Blessed is He | Expresses abundance of blessing and greatness |

---

**5. Key Takeaways & Tadabbur Points**
List 7–10 short, impactful lessons or reflections that the student should remember.
These key points will help them answer the quiz below, so include all important facts.
Focus on what the verses teach about:
- Allah's names and attributes (with specific meanings)
- Human character and behaviour
- Spiritual growth and taqwa
- Practical application in daily life
- Connection to other verses/surahs

---

**6. Mini Quiz (Comprehension Check)**
Create 5 multiple-choice questions drawn from the Key Takeaways above.
Mix meaning, tafsīr context, vocabulary, and verse identification.
IMPORTANT: The quiz tests whether the student understood the Key Takeaways.

Format each question EXACTLY like this - put ✅ ONLY after the CORRECT answer:
**Q1.** What does "Ar-Raḥmān" specifically refer to?
A) Allah's mercy only for Muslims B) Allah's universal mercy for all creation ✅ C) Allah's anger toward sinners D) Allah's knowledge of everything

⚠️ CRITICAL QUIZ ACCURACY RULES:
1. ONLY place ✅ after the FACTUALLY CORRECT answer - never on wrong answers
2. For vocabulary questions, use the EXACT meanings from the vocabulary reference below
3. For verse-meaning questions, verify against the actual verse translation
4. DOUBLE-CHECK every ✅ placement before finalizing

### MANDATORY VOCABULARY REFERENCE (Use these exact meanings):
- **تَبَارَكَ (tabāraka)** = "Blessed is He" (NOT "He is great")
- **الْمُلْك (al-mulk)** = "The Dominion/Sovereignty" (complete authority)
- **قَدِير (qadīr)** = "All-Powerful/Competent over all things"
- **الْمَوْت (al-mawt)** = "Death"
- **الْحَيَاة (al-ḥayāh)** = "Life"
- **لِيَبْلُوَكُمْ (li-yabluwakum)** = "To test you"
- **أَحْسَنُ عَمَلًا (aḥsanu ʿamalan)** = "Best in deeds"
- **الْعَزِيز (al-ʿAzīz)** = "The Exalted in Might"
- **الْغَفُور (al-Ghafūr)** = "The Forgiving"
- **الرَّحْمَٰن (Ar-Raḥmān)** = "The Most Merciful" (universal mercy for ALL creation)
- **الرَّحِيم (Ar-Raḥīm)** = "The Especially Merciful" (special mercy for believers)
- **رَبّ الْعَالَمِين (Rabb al-ʿĀlamīn)** = "Lord of all the worlds"
- **مَالِك يَوْم الدِّين (Mālik Yawm al-Dīn)** = "Master/Owner of the Day of Judgment"
- **قَيِّم (qayyim)** = "Straight/Upright" (without crookedness)
- **يُنْذِر (yundhir)** = "To warn"
- **زِينَة (zīnah)** = "Adornment/Decoration"
- **فِتْنَة (fitnah)** = "Trial/Test"

### VERSE MEANING VERIFICATION:
- Surah Al-Mulk 67:2 - Allah created death and life "to TEST you which of you is BEST IN DEEDS"
- Surah Al-Kahf 18:7 - Earth's adornments are "to TEST them which of them is BEST IN DEEDS"
- Always verify quiz answers against actual verse meanings

---

**7. Reflection Questions**
Provide 4–5 open-ended questions that help students apply the teachings to daily life.
Encourage deep thinking and self-assessment, not rote recall.
Make them personal and actionable.

---

**8. First Word Prompter (Memorization Aid)**
Create a table to help with memorization. For each ayah covered:
- Ayah number
- First word (Arabic with tashkīl)
- Transliteration
- Brief hint about the verse content

| Ayah | First Word | Transliteration | Hint |
|------|------------|-----------------|------|
| 1 | تَبَـٰرَكَ | tabāraka | Blessed is He who has dominion |

---

**9. Homework & Weekly Reflection Task**
List 3–4 practical follow-up tasks:
- 📖 Reading/recitation practice with specific verses
- 🎧 Listening recommendation (specific reciter)
- ✍️ Written reflection prompt
- 🤲 Practical action/du'a to implement

---

**10. Summary Takeaway**
End with a 3–4 sentence summary that captures:
- The main theme of the verses
- The spiritual message and emotional impact
- One key action point for the student

---

### QUIZ ANSWER VERIFICATION
Before finalizing the quiz, verify each answer is factually correct:
- Ar-Raḥmān = universal mercy for ALL creation (not just Muslims)
- Ar-Raḥīm = special mercy for believers
- Rabb al-'Ālamīn = Lord of all the worlds
- Mālik Yawm al-Dīn = Master of the Day of Judgment
Always mark the CORRECT answer with ✅

---

### 🧹 CLEAN-UP AND FILTER RULES
- **Include only content directly related to the Qur'an lesson** (tafsīr, translation, examples, reflections, Arabic analysis).
- **Exclude** all irrelevant conversation: greetings ("How are you?"), small talk, technical issues, setup chat, and off-topic discussion.
- If teacher mentions what's next lesson, you may include it; otherwise **do not invent a next-session preview.**
- **NEVER generate content about surahs/verses that weren't actually discussed in the transcript.**

---

### FORMATTING RULES
1. Follow this exact order and headings for consistency.
2. Write in warm, educational, and reflective tone.
3. Keep Arabic in standard Uthmānī script with full tashkīl (vowel marks).
4. Use clear spacing, bullets, and tables for readability.
5. The "Flow of Meaning" section should capture WHAT THE TEACHER EXPLAINED (scholarly tafsir is appended automatically from Quran.com API).
6. For ALL sections: Focus on what was actually covered in the lesson transcript.
7. If the lesson was primarily recitation/memorization practice, note the lesson focus - the appended tafsir will provide scholarly commentary.
8. Clearly distinguish between:
   - Revision/warm-up recitation (student practicing previous material)
   - Main lesson content (new material being taught)`;


const ARABIC_PROMPT = `## 📚 TALBIYAH INSIGHTS – ARABIC LANGUAGE TEMPLATE

You are Talbiyah Insights – Arabic Language.
Your task is to transform an Arabic language class transcript into structured, reflective, and easy-to-study notes.
The goal is for students to be able to revise everything that was taught in detail — including vocabulary, grammar, pronunciation, conversation, and practice questions.
The output should feel like a complete revision pack, not a short summary.
It should help the student feel like they can open it anytime in their dashboard and learn directly from it, as if the teacher is still with them.

---

### 1️⃣ Lesson Summary
* Give a short and simple summary of what was taught in the class.
* Mention the grammar focus, the main vocabulary topics, and what type of speaking or reading practice was done.
* Include 3–5 bullet points that highlight the most important learning goals.
* The tone should be friendly, clear, and motivating.

---

### 2️⃣ Key Sentences from the Class
* Extract 5–10 of the most useful Arabic sentences that appeared in the class.
* Show them in a 3-column table:

| Arabic | Transliteration | English Meaning |
|--------|----------------|-----------------|
| Example Arabic sentence | Transliteration | English translation |

* Choose sentences that demonstrate grammar points, daily-life vocabulary, or conversation patterns.
* Ensure they are accurate and beneficial for revision.

---

### 3️⃣ Vocabulary List (with Tashkīl)
* Collect all new or important words mentioned during the lesson.
* Each word should include its transliteration, English meaning, word type (noun, verb, adjective, etc.), and one short example sentence.
* Use a clear table format:

| Arabic (with Tashkīl) | Transliteration | English Meaning | Word Type | Example |
|-----------------------|----------------|-----------------|-----------|---------|
| فُرْنٌ | furnun | oven | noun | يُوجَدُ فُرْنٌ فِي المَطْبَخِ |

* Include at least 10–20 words if possible.
* Add tashkīl (vowel markings) for every word to help pronunciation.

---

### 4️⃣ Grammar Focus
* Summarise every grammar point that the teacher explained in this lesson.
* Use numbered sections (1️⃣, 2️⃣, 3️⃣, etc.) for each rule.
* For each point, include:
  - The rule name or topic (e.g. Future Tense (سَـ + Present Verb)).
  - A short explanation (2–4 sentences).
  - Two Arabic example sentences from the transcript or based on it.

Example format:
1️⃣ Future Tense (سَـ + Present Verb)
Used to express "will" or future action.
Example:
* سَيَقْرَأُ الطَّالِبُ الكِتَابَ – The student will read the book.
* سَنَذْهَبُ إِلَى المَدِينَةِ – We will go to the city.

---

### 5️⃣ Teacher Notes & Corrections
* List the pronunciation corrections, grammar mistakes, or reminders given by the teacher.
* Use bullet points, each starting with ✅.

Example:
✅ Say سَأَقْضِي not *sayyafi* for "I will spend."
✅ Pronounce خ from the throat, not like the English "k."
✅ After كَمْ, always use the singular form of the noun (كَمْ كِتَابًا؟).

---

### 6️⃣ Conversation Practice (Role-Play)
* Turn key parts of the lesson into short Arabic dialogues that the student can practise.
* **CRITICAL: Use the table format below. EVERY line MUST have an English translation.**

**Use this exact table format:**

| Speaker | Arabic | Transliteration | English |
|---------|--------|-----------------|---------|
| Teacher | كَيْفَ حَالُكَ؟ | Kayfa haaluka? | How are you? |
| Student | أَنَا بِخَيْرٍ، الْحَمْدُ لِلَّهِ | Ana bikhayr, alhamdulillah | I am fine, praise be to Allah |
| Teacher | مَا اسْمُكَ؟ | Maa ismuka? | What is your name? |
| Student | اسْمِي أَحْمَد | Ismee Ahmad | My name is Ahmad |

**Rules:**
- Include at least 2–3 dialogues (6-10 lines total)
- NEVER leave the English column empty
- Every Arabic line must have its transliteration AND English translation
- Use realistic, practical conversations from the lesson content

---

### 7️⃣ Pronunciation Practice
* Identify the letters or sounds the teacher corrected or emphasised.
* Give a short note on how to pronounce them correctly.
* Include a few example words to practise.

Example:
Focus on ق (qāf) and خ (khā') — both come from the back of the throat.
Drill with words like: قَرْيَة, خَرَجَ, أَخْرَجَ.

---

### 8️⃣ Key Takeaways
* Write a short list (3–5 bullet points) summarising what the student can now do after this lesson.
* Keep it positive and clear.

Example:
* Can form sentences using the future tense.
* Can use يُوجَدُ / تُوجَدُ correctly for "there is/are."
* Can ask and answer "how many?" questions.
* Can pronounce خ, ق, and ط accurately.

---

### 9️⃣ Mini Quiz
* Create at least 10 quiz questions that test vocabulary, grammar, and sentence understanding.
* Include different question types:
  - Arabic ↔️ English translation
  - Multiple choice
  - Fill-in-the-blank
  - True/False
* Always mark the correct answer with a ✅ symbol.

Example:
1. Translate: We will spend the holiday on the beach. → سَنَقْضِي العُطْلَةَ عَلَى الشَّاطِئِ ✅
2. What does "كَمْ كِتَابًا؟" mean?
   a) Whose books? b) How many books? ✅ c) Where are the books?
3. True or False: "مُعَلِّمَانِ" means two teachers ✅

---

### 🔟 Homework / Practice Tasks

#### ✍️ Part A: Writing Challenge – Build Your Paragraph

Create a writing exercise based on THIS lesson's vocabulary and grammar.

**Instructions:**
1. Choose a TOPIC related to the lesson content (e.g., daily routine, shopping, family, travel, etc.)
2. Write a simple ENGLISH PARAGRAPH (4-6 sentences) that uses vocabulary and grammar from this lesson
3. The student's task is to translate it into Arabic
4. Provide a "Build Your Own Sentences" TABLE with 4 rows showing mix-and-match options:
   - Column 1: Subject options (أَنا، نَحْنُ، هُوَ، هِيَ، أَنْتَ، هُمْ) with English
   - Column 2: Verb/action options FROM THE LESSON with tashkīl and English
   - Column 3: Object/place/time endings FROM THE LESSON with tashkīl and English
5. Include a WORD BANK of 8-10 vocabulary items from the lesson (Arabic with tashkīl + English)
6. Add a SELF-CHECK list: ☐ Verb conjugations ☐ Connectors used ☐ Tashkīl added

**Example Output:**

#### ✍️ Writing Challenge: Build Your Paragraph

**Topic:** A Trip to the Market

**Your Mission:** Translate this paragraph into Arabic:

> "Yesterday, I went to the market with my mother. We bought bread, fruit, and vegetables. The shopkeeper was very kind. After that, we returned home. It was a good day!"

**Build Your Own Sentences:** Mix and match to create your Arabic paragraph:

| Start with... | Add an action... | End with... |
|---------------|------------------|-------------|
| أَنا (I) | ذَهَبْتُ إِلَى (went to) | السُّوقِ (the market) |
| نَحْنُ (We) | اِشْتَرَيْنا (we bought) | خُبْزًا وَفَواكِهَ (bread and fruit) |
| هُوَ (He) | كانَ لَطيفًا (was kind) | مَعَ أُمِّي (with my mother) |
| بَعْدَ ذٰلِكَ (After that) | رَجَعْنا (we returned) | إِلَى البَيْتِ (to the house) |

**Word Bank (use at least 5):**
السُّوقُ (market) • خُبْزٌ (bread) • فَواكِهُ (fruit) • اِشْتَرَى (bought) • ذَهَبَ (went) • رَجَعَ (returned) • لَطِيفٌ (kind) • أَمْسِ (yesterday) • يَوْمٌ جَيِّدٌ (good day) • البائِعُ (shopkeeper)

**Self-Check:** ☐ Correct verb forms (past tense) ☐ Used connectors (وَ، ثُمَّ، بَعْدَ ذٰلِكَ) ☐ Added tashkīl to key words

---

#### 📋 Part B: Quick Practice Tasks
List 3-4 short, actionable tasks mixing different skills:
📝 [Writing task using specific lesson vocabulary/grammar]
🗣️ [Speaking/pronunciation practice task]
📖 [Reading or flashcard review task]
🎧 [Listening task - optional]

---

### 11️⃣ Talbiyah Insights Summary (Final Reflection)
* End with a short paragraph that encourages the student and links this lesson to their Arabic journey.
* Make it sound personal and reflective.

Example:
> This lesson strengthened your ability to speak about everyday activities using accurate Arabic grammar and pronunciation.
> Review these notes carefully to build confidence, and practise daily so that Arabic becomes more natural for you.

---

### RULES FOR THE AI
* Always produce detailed notes, not short bullet points.
* Each section above must be included in the output.
* Always show Arabic words with Tashkīl where possible.
* Use simple English explanations that any beginner can understand.
* Keep the tone friendly, encouraging, and easy to follow.
* Do not include Qur'an or Hadith unless the Arabic lesson was based on them.
* Always include at least 15 new vocabulary words and 10 quiz questions.
* **CRITICAL: Every Arabic sentence in tables MUST have a complete English translation. Never leave the English column empty or incomplete.**`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    const { lesson_id, transcript, subject, lesson_title, metadata }: LessonInsightRequest = await req.json();

    if (!lesson_id || !transcript || !subject || !metadata) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: lesson_id, transcript, subject, and metadata are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Try to parse surah info from lesson_title if not in metadata
    if (!metadata.surah_number && lesson_title) {
      const parsedInfo = parseSurahInfoFromTitle(lesson_title);
      if (parsedInfo) {
        console.log(`Parsed surah info from title "${lesson_title}":`, parsedInfo);
        metadata.surah_name = parsedInfo.surahName || metadata.surah_name;
        metadata.surah_number = parsedInfo.surahNumber || metadata.surah_number;
        metadata.ayah_range = parsedInfo.ayahRange || metadata.ayah_range;
      }
    }

    // Also try parsing from subject name if still no surah info
    if (!metadata.surah_number && subject) {
      const parsedFromSubject = parseSurahInfoFromTitle(subject);
      if (parsedFromSubject) {
        console.log(`Parsed surah info from subject "${subject}":`, parsedFromSubject);
        metadata.surah_name = parsedFromSubject.surahName || metadata.surah_name;
        metadata.surah_number = parsedFromSubject.surahNumber || metadata.surah_number;
        metadata.ayah_range = parsedFromSubject.ayahRange || metadata.ayah_range;
      }
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client to fetch subject-specific template
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which prompt to use based on subject
    let systemPrompt: string;
    let insightType: string;
    let title: string;
    let verifiedVerses: VerifiedVerse[] = [];
    let tafsirEntries: TafsirEntry[] = [];
    let firstWordPrompterSection = '';
    let versesCoveredSection = '';
    let tafsirSection = '';

    const subjectLower = subject.toLowerCase();

    // Check for specific subject types
    const isQuranUnderstanding = subjectLower.includes('quran') && subjectLower.includes('understanding');
    const isQuranMemorisation = subjectLower.includes('quran') && (subjectLower.includes('memori') || subjectLower.includes('hifz') || subjectLower.includes('hifdh'));
    const isQuranLesson = subjectLower.includes('quran') || subjectLower.includes('qur');
    const isArabicLesson = subjectLower.includes('arabic');

    // Try to fetch subject-specific template from database
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('ai_prompt_template, name')
      .ilike('name', `%${subject.replace(/[%_]/g, '')}%`)
      .single();

    if (subjectData?.ai_prompt_template) {
      // Use database template
      systemPrompt = subjectData.ai_prompt_template;
      insightType = 'subject_specific';
      console.log(`Using database template for subject: ${subjectData.name}`);

      // Set initial title based on subject type (will be refined after AI analysis)
      // Using date-based titles since surah/ayah metadata may be inaccurate
      if (isQuranUnderstanding) {
        title = `Qur'an with Understanding: ${metadata.lesson_date}`;
      } else if (isQuranMemorisation) {
        title = `Qur'an Memorisation: ${metadata.lesson_date}`;
      } else if (isQuranLesson) {
        title = `Qur'an Insights: ${metadata.lesson_date}`;
      } else if (isArabicLesson) {
        title = `Arabic Language Insights: ${metadata.lesson_date}`;
      } else {
        title = `${subject} Insights: ${metadata.lesson_date}`;
      }
    } else if (isQuranLesson) {
      // Classify the lesson type based on transcript content
      console.log('Classifying Quran lesson type from transcript...');
      const classification = await classifyQuranLessonType(transcript, anthropicApiKey!);
      console.log(`Classification result: ${classification.lessonType} (confidence: ${classification.confidence})`);
      console.log(`Classification reasoning: ${classification.reasoning}`);

      // Select the appropriate prompt based on lesson type
      switch (classification.lessonType) {
        case 'tafsir':
          systemPrompt = QURAN_TAFSIR_PROMPT;
          title = `Qur'an Tafsir: ${metadata.lesson_date}`;
          console.log('Using QURAN_TAFSIR_PROMPT for understanding/explanation lesson');
          break;
        case 'hifdh':
          systemPrompt = QURAN_HIFDH_PROMPT;
          title = `Qur'an Hifdh: ${metadata.lesson_date}`;
          console.log('Using QURAN_HIFDH_PROMPT for memorization lesson');
          break;
        case 'revision':
          systemPrompt = QURAN_REVISION_PROMPT;
          title = `Qur'an Revision: ${metadata.lesson_date}`;
          console.log('Using QURAN_REVISION_PROMPT for revision/assessment lesson');
          break;
        case 'mixed':
        default:
          systemPrompt = QURAN_MIXED_PROMPT;
          title = `Qur'an Insights: ${metadata.lesson_date}`;
          console.log('Using QURAN_MIXED_PROMPT for mixed/general lesson');
          break;
      }

      // Use classification's surah info if metadata is missing
      if (!metadata.surah_number && classification.surahNumber) {
        metadata.surah_number = classification.surahNumber;
        metadata.surah_name = classification.surahName || '';
        metadata.ayah_range = classification.ayahRange || '';
        console.log(`Updated metadata from classification: Surah ${classification.surahNumber} (${classification.surahName}), ayat ${classification.ayahRange}`);
      }

      insightType = 'subject_specific';
    } else if (isArabicLesson) {
      // Fallback to hardcoded Arabic prompt
      systemPrompt = ARABIC_PROMPT;
      insightType = 'subject_specific';
      title = `Arabic Language Insights: ${metadata.lesson_date}`;
      console.log('Using fallback ARABIC_PROMPT');
    } else {
      // Generic fallback for any other subject
      systemPrompt = `You are Talbiyah Insights – ${subject} specialist.
Transform the class transcript into comprehensive, structured study notes.
Include: lesson summary, key concepts, important lessons, reflection questions, mini quiz, and homework.
Make the notes detailed, educational, and easy to revise.`;
      insightType = 'subject_specific';
      title = `${subject} Insights: ${metadata.lesson_date}`;
      console.log(`Using generic template for subject: ${subject}`);
    }

    // PHASE 1 IMPROVEMENT: Do NOT fetch Quran.com data before Claude
    // Instead, let Claude analyze the transcript first, then fetch based on AI-identified content
    // This makes generation reliable even when metadata is missing or inaccurate
    console.log(`Phase 1: Skipping pre-fetch, will fetch Quran.com data AFTER Claude analysis for reliability`);

    // Build user prompt based on subject type
    let userPrompt = `Generate Talbiyah Insights for this ${subject} lesson:

BOOKING METADATA (may be inaccurate - use transcript to verify):`;

    if (metadata.surah_name && metadata.surah_number) {
      userPrompt += `
- Booked as: ${metadata.surah_name} (${metadata.surah_number})
- Booked verses: ${metadata.ayah_range}
⚠️ WARNING: The above is just the booking title. ANALYZE THE TRANSCRIPT to determine what was ACTUALLY taught.`;
    }

    userPrompt += `
- Teacher: ${metadata.teacher_name}
- Students: ${metadata.student_names.join(', ')}
- Date: ${metadata.lesson_date}`;

    if (metadata.duration_minutes) {
      userPrompt += `
- Duration: ${metadata.duration_minutes} minutes`;
    }

    userPrompt += `

CRITICAL INSTRUCTIONS:
1. Read the ENTIRE transcript carefully before generating insights
2. Identify which surah(s) and ayat were ACTUALLY discussed (not what the booking says)
3. If the student recited one surah for revision/warm-up but learned a different surah, note BOTH
4. For the "Flow of Meaning" section: Focus on what the TEACHER actually explained in the lesson
5. NOTE: Scholarly tafsir from Ibn Kathir will be automatically appended from Quran.com API - you don't need to generate comprehensive tafsir
6. Your role is to capture the LESSON EXPERIENCE - the teacher's explanations, examples, and discussions
7. IMPORTANT: Clearly state the Surah name/number and Ayat range at the beginning so we can fetch verified verse data

TRANSCRIPT:
${transcript}

Generate the insights following the exact format specified in the system prompt. Remember: transcript content takes priority over booking metadata.`;

    console.log(`Calling Claude API to generate ${subject} insights...`);

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192, // Increased for detailed Arabic notes
          temperature: 0.3,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate insights", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    let generatedText = data.content?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "No response generated from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // PHASE 1 IMPROVEMENT: Extract surah info from AI-generated content and fetch Quran.com data
    // This is the authoritative source - AI analyzes the actual transcript FIRST
    // Then we fetch verified data based on what AI identified (not unreliable metadata)
    let actualSurahInfo: { surahName?: string; surahNumber?: number; ayahRange?: string } | null = null;
    if (isQuranLesson) {
      actualSurahInfo = extractSurahInfoFromAIContent(generatedText);

      if (actualSurahInfo?.surahNumber) {
        console.log("AI identified actual surah from transcript:", actualSurahInfo);

        // Parse ayah range from AI content, default to reasonable range if not found
        let startAyah = 1;
        let endAyah = 20; // Default to first 20 ayahs if no range specified
        if (actualSurahInfo.ayahRange) {
          const ayahMatch = actualSurahInfo.ayahRange.match(/(\d+)\s*[-–]\s*(\d+)/);
          if (ayahMatch) {
            startAyah = parseInt(ayahMatch[1], 10);
            endAyah = parseInt(ayahMatch[2], 10);
          }
        }

        const actualSurahNumber = actualSurahInfo.surahNumber;
        console.log(`Fetching verified Quran data for AI-identified Surah ${actualSurahNumber}, Ayat ${startAyah}-${endAyah}...`);

        try {
          // PHASE 2: Try to get data from pre-cached surah_data table FIRST (A* reliability)
          const cachedSurah = await fetchCachedSurahData(supabase, actualSurahNumber);

          let fetchedVerses: VerifiedVerse[] = [];
          let fetchedTafsir: TafsirEntry[] = [];

          if (cachedSurah) {
            // Use cached data - no external API calls needed!
            console.log(`✅ PHASE 2: Using cached surah_data for Surah ${actualSurahNumber} (A* reliability)`);
            fetchedVerses = convertCachedToVerifiedVerses(cachedSurah, startAyah, endAyah);
            fetchedTafsir = convertCachedToTafsirEntries(cachedSurah, startAyah, endAyah);
            console.log(`Loaded ${fetchedVerses.length} verses and ${fetchedTafsir.length} tafsir entries from cache`);
          } else {
            // Fallback to Quran.com API for uncached surahs
            console.log(`⚠️ Surah ${actualSurahNumber} not cached, falling back to Quran.com API...`);
            [fetchedVerses, fetchedTafsir] = await Promise.all([
              fetchVerifiedQuranData(actualSurahNumber, startAyah, endAyah),
              fetchTafsirData(actualSurahNumber, startAyah, endAyah)
            ]);
          }

          if (fetchedVerses.length > 0) {
            console.log(`Successfully loaded ${fetchedVerses.length} verified verses for Surah ${actualSurahNumber}`);
            console.log(`Successfully loaded ${fetchedTafsir.length} tafsir entries from Ibn Kathir`);
            verifiedVerses = fetchedVerses;
            tafsirEntries = fetchedTafsir;

            // Update metadata with AI-identified info for storage
            metadata.surah_name = actualSurahInfo.surahName || metadata.surah_name;
            metadata.surah_number = actualSurahNumber;
            metadata.ayah_range = actualSurahInfo.ayahRange || `${startAyah}-${endAyah}`;

            // Generate the verified sections
            versesCoveredSection = generateVersesCoveredSection(verifiedVerses, metadata.surah_name || 'Quran');
            firstWordPrompterSection = generateFirstWordPrompterSection(verifiedVerses);
            tafsirSection = generateTafsirSection(tafsirEntries, metadata.surah_name || 'Quran');
          } else {
            console.log(`Note: Could not fetch verses for Surah ${actualSurahNumber} - insights will work without verified sections`);
          }
        } catch (quranApiError) {
          // PHASE 1: Quran.com API failure should NOT block insight generation
          console.error("Quran.com API error (non-blocking):", quranApiError);
          console.log("Continuing with Claude-generated insights without verified Quran data");
        }
      } else {
        // AI didn't identify a specific surah - insights still work, just without verse data
        console.log("AI did not identify specific surah from transcript - insights will generate without verified verse sections");
      }
    }

    // IMPORTANT: Only add verified verses if we have them and they match the AI-identified content
    // After the re-fetch logic above, verifiedVerses should now contain the correct surah's verses
    const shouldAppendVerifiedVerses = (): boolean => {
      // Must have valid verified verses and be a Quran lesson
      if (!isQuranLesson || !versesCoveredSection || verifiedVerses.length === 0) {
        return false;
      }

      // If we have actualSurahInfo (AI analysis), check consistency
      if (actualSurahInfo?.surahNumber) {
        // We should have already re-fetched if there was a mismatch
        // Just verify we have the right surah
        const expectedVerseKey = `${actualSurahInfo.surahNumber}:`;
        if (verifiedVerses[0]?.verseKey?.startsWith(expectedVerseKey)) {
          console.log(`Verified verses match AI-identified surah ${actualSurahInfo.surahNumber}`);
          return true;
        } else {
          console.log(`Warning: Verified verses don't match AI-identified surah. Expected ${expectedVerseKey}, got ${verifiedVerses[0]?.verseKey}`);
          return false;
        }
      }

      // If no AI-identified surah but we have metadata, check that
      if (metadata.surah_number) {
        const expectedVerseKey = `${metadata.surah_number}:`;
        if (verifiedVerses[0]?.verseKey?.startsWith(expectedVerseKey)) {
          return true;
        }
      }

      // Default: don't append if we can't verify correctness
      return false;
    };

    // Add verified Verses Covered section for Quran lessons (only if surah matches)
    if (shouldAppendVerifiedVerses() && versesCoveredSection) {
      // Insert after the first "---" (after lesson info section)
      const firstDividerIndex = generatedText.indexOf('---');
      if (firstDividerIndex !== -1) {
        const afterFirstDivider = generatedText.indexOf('---', firstDividerIndex + 3);
        if (afterFirstDivider !== -1) {
          generatedText = generatedText.slice(0, afterFirstDivider) + versesCoveredSection + generatedText.slice(afterFirstDivider);
        } else {
          generatedText = generatedText + versesCoveredSection;
        }
      } else {
        generatedText = versesCoveredSection + generatedText;
      }
      console.log("Added verified Verses Covered section from Quran.com API");
    } else if (isQuranLesson && !versesCoveredSection) {
      console.log("No verified verse section available - Quran.com fetch may have failed or no surah identified");
    }

    // Append verified First Word Prompter section for Quran lessons (only if surah matches)
    if (shouldAppendVerifiedVerses() && firstWordPrompterSection) {
      generatedText = generatedText + firstWordPrompterSection;
      console.log("Appended verified First Word Prompter section from Quran.com API");
    }

    // Append scholarly Tafsir section from Ibn Kathir (only if surah matches)
    if (shouldAppendVerifiedVerses() && tafsirSection) {
      generatedText = generatedText + tafsirSection;
      console.log(`Appended scholarly Tafsir section with ${tafsirEntries.length} entries from Ibn Kathir`);
    }

    // QUIZ MARKING: First, mark unmarked quiz answers using vocabulary data
    if (isQuranLesson && metadata.surah_number) {
      console.log(`Marking quiz answers using vocabulary data for surah ${metadata.surah_number}...`);
      generatedText = markQuizAnswersFromVocabulary(generatedText, metadata.surah_number);
    }

    // QUIZ VERIFICATION: Then verify and correct any marked answers
    let quizVerificationResult: VerificationSummary | null = null;
    if (isQuranLesson && verifiedVerses.length > 0) {
      console.log("Running quiz verification against verified Quran data...");

      quizVerificationResult = verifyAndCorrectQuizAnswers(generatedText, {
        surahNumber: metadata.surah_number,
        surahName: metadata.surah_name,
        ayahRange: metadata.ayah_range,
        verifiedVerses: verifiedVerses
      });

      if (quizVerificationResult.correctionsApplied > 0) {
        console.log(`Quiz verification: ${quizVerificationResult.correctionsApplied} corrections applied`);
        generatedText = quizVerificationResult.correctedContent;

        // Log the corrections for monitoring
        const verificationLog = createVerificationLog(lesson_id, quizVerificationResult);
        console.log("Quiz corrections:", JSON.stringify(verificationLog.corrections));
      } else {
        console.log(`Quiz verification: ${quizVerificationResult.totalQuestions} questions checked, all correct`);
      }
    }

    console.log("Insights generated successfully, saving to database...");

    // Extract key topics from the generated content
    const extractKeyTopics = (content: string, isQuran: boolean): string[] => {
      const topics: string[] = [];

      if (isQuran) {
        // Check for tafsir content
        if (content.toLowerCase().includes('tafsīr') || content.toLowerCase().includes('tafsir') || content.includes('Flow of Meaning')) {
          topics.push('Tafsir');
        }
        // Check for tadabbur/reflection content
        if (content.toLowerCase().includes('tadabbur') || content.includes('Reflection')) {
          topics.push('Tadabbur');
        }
        // Check for memorization content
        if (content.toLowerCase().includes('memoriz') || content.includes('First Word Prompter') || content.toLowerCase().includes('hifz')) {
          topics.push('Memorization');
        }
        // Check for vocabulary
        if (content.includes('Arabic Vocabulary') || content.includes('Key Arabic')) {
          topics.push('Vocabulary');
        }
        // Check for quiz
        if (content.includes('Mini Quiz') || content.includes('Comprehension Check')) {
          topics.push('Quiz');
        }
      } else {
        // Arabic lessons
        if (content.includes('Grammar Focus') || content.toLowerCase().includes('grammar')) {
          topics.push('Grammar');
        }
        if (content.includes('Vocabulary List') || content.toLowerCase().includes('vocabulary')) {
          topics.push('Vocabulary');
        }
        if (content.includes('Conversation Practice') || content.toLowerCase().includes('dialogue')) {
          topics.push('Conversation');
        }
        if (content.includes('Pronunciation') || content.toLowerCase().includes('pronunciation')) {
          topics.push('Pronunciation');
        }
      }

      return topics;
    };

    const keyTopics = extractKeyTopics(generatedText, isQuranLesson);
    console.log("Extracted key topics:", keyTopics);

    const processingTime = Date.now() - startTime;

    // Fetch lesson to get teacher_id and learner_id for RLS
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('teacher_id, learner_id, subject_id')
      .eq('id', lesson_id)
      .single();

    if (lessonError || !lessonData) {
      console.error("Error fetching lesson data:", lessonError);
      return new Response(
        JSON.stringify({ error: "Lesson not found", details: lessonError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Lesson data fetched:", { teacher_id: lessonData.teacher_id, learner_id: lessonData.learner_id });

    // Check if insight already exists for this lesson
    const { data: existingInsight } = await supabase
      .from('lesson_insights')
      .select('id')
      .eq('lesson_id', lesson_id)
      .single();

    let savedInsight;
    let saveError;

    // Build detailed insights object with verified Quran data if available
    const detailedInsightsData: Record<string, unknown> = {
      content: generatedText,
      subject: subject,
      metadata: metadata,
      generated_at: new Date().toISOString(),
    };

    // Add verified Quran data if available
    if (isQuranLesson && verifiedVerses.length > 0) {
      detailedInsightsData.verified_verses = verifiedVerses;
      detailedInsightsData.quran_api_source = 'quran.com/api/v4';
    }

    // Add scholarly tafsir data if available
    if (isQuranLesson && tafsirEntries.length > 0) {
      detailedInsightsData.tafsir = {
        source: 'Ibn Kathir (Abridged)',
        source_id: 169,
        entries: tafsirEntries,
        fetched_at: new Date().toISOString()
      };
    }

    // Add quiz verification metadata if verification was performed
    if (quizVerificationResult) {
      detailedInsightsData.quiz_verification = {
        verified_at: new Date().toISOString(),
        total_questions: quizVerificationResult.totalQuestions,
        verse_related_questions: quizVerificationResult.verseRelatedQuestions,
        corrections_made: quizVerificationResult.correctionsApplied,
        status: quizVerificationResult.correctionsApplied > 0 ? 'auto_corrected' : 'verified'
      };
    }

    // Generate a meaningful summary (first 2000 chars or up to the first major section break)
    const generateSummary = (content: string): string => {
      // Try to find the Summary Takeaway section for a better summary
      const summaryMatch = content.match(/(?:Summary Takeaway|Talbiyah Insights Summary)[^\n]*\n([\s\S]{100,800}?)(?:\n---|\n##|$)/i);
      if (summaryMatch) {
        return summaryMatch[1].trim().substring(0, 2000);
      }
      // Otherwise use first 2000 chars
      return content.substring(0, 2000);
    };

    // Extract actual surah info from AI-generated content to create accurate title
    const extractActualSurahInfo = (content: string): { surah?: string; ayat?: string } | null => {
      // Look for patterns like "Surah Actually Covered: Surah An-Naba (78)"
      // or "Main Lesson Content: Surah Al-Mulk (67), Ayat 1-10"
      const patterns = [
        /Surah Actually Covered[:\s]+(?:Surah\s+)?([A-Za-z\-']+)(?:\s*\((\d+)\))?(?:,?\s*(?:Ayat?|Verses?)?\s*([\d\-–]+))?/i,
        /Main Lesson Content[:\s]+(?:Surah\s+)?([A-Za-z\-']+)(?:\s*\((\d+)\))?(?:,?\s*(?:Ayat?|Verses?)?\s*([\d\-–]+))?/i,
        /Surah[:\s]+(?:Surah\s+)?([A-Za-z\-']+)(?:\s*\((\d+)\))?/i,
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          return {
            surah: match[1].trim(),
            ayat: match[3]?.trim() || undefined
          };
        }
      }
      return null;
    };

    // Try to extract actual surah info from the generated content for title
    const actualSurahTitle = isQuranLesson ? extractActualSurahInfo(generatedText) : null;

    // Update title with actual content if found
    if (actualSurahTitle?.surah) {
      const surahPart = actualSurahTitle.surah;
      const ayatPart = actualSurahTitle.ayat ? ` (${actualSurahTitle.ayat})` : '';

      if (isQuranUnderstanding) {
        title = `Qur'an with Understanding: Surah ${surahPart}${ayatPart}`;
      } else if (isQuranMemorisation) {
        title = `Qur'an Memorisation: Surah ${surahPart}${ayatPart}`;
      } else if (isQuranLesson) {
        title = `Qur'an Insights: Surah ${surahPart}${ayatPart}`;
      }
      console.log(`Updated title from AI analysis: ${title}`);
    }

    const summaryText = generateSummary(generatedText);

    if (existingInsight) {
      // Update existing - ensure teacher_id, learner_id, subject_id are set for RLS
      const { data, error } = await supabase
        .from('lesson_insights')
        .update({
          teacher_id: lessonData.teacher_id,
          learner_id: lessonData.learner_id,
          subject_id: lessonData.subject_id,
          insight_type: insightType,
          title: title,
          summary: summaryText,
          key_topics: keyTopics,
          detailed_insights: detailedInsightsData,
          ai_model: 'claude-sonnet-4-20250514',
          confidence_score: 0.90,
          processing_time_ms: processingTime,
          raw_transcript: transcript, // Preserve transcript for future regeneration
        })
        .eq('id', existingInsight.id)
        .select()
        .single();
      savedInsight = data;
      saveError = error;
    } else {
      // Insert new - include teacher_id, learner_id, subject_id for RLS
      const { data, error } = await supabase
        .from('lesson_insights')
        .insert({
          lesson_id,
          teacher_id: lessonData.teacher_id,
          learner_id: lessonData.learner_id,
          subject_id: lessonData.subject_id,
          insight_type: insightType,
          title: title,
          summary: summaryText,
          key_topics: keyTopics,
          detailed_insights: detailedInsightsData,
          ai_model: 'claude-sonnet-4-20250514',
          confidence_score: 0.90,
          processing_time_ms: processingTime,
          raw_transcript: transcript, // Preserve transcript for future regeneration
        })
        .select()
        .single();
      savedInsight = data;
      saveError = error;
    }

    if (saveError) {
      console.error("Error saving insights:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save insights to database", details: saveError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Insights saved successfully:", savedInsight.id);

    // Send notification email to parent
    try {
      // Fetch learner details including parent information
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select(`
          name,
          profiles!learners_parent_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', lessonData.learner_id)
        .single();

      if (learnerError) {
        console.error("Error fetching learner data for notification:", learnerError);
      } else if (learnerData?.profiles?.email) {
        // Fetch teacher notes from lesson_details
        const { data: lessonDetails } = await supabase
          .from('lesson_details')
          .select('teacher_notes')
          .eq('lesson_id', lesson_id)
          .maybeSingle();

        // Fetch homework assigned
        const { data: homeworkData } = await supabase
          .from('student_homework')
          .select('assignment_details')
          .eq('lesson_id', lesson_id)
          .maybeSingle();

        // Fetch teacher name
        const { data: teacherData } = await supabase
          .from('teacher_profiles')
          .select('profiles(full_name)')
          .eq('id', lessonData.teacher_id)
          .single();

        // Call the notification email function
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type: 'lesson_insight_ready',
            recipient_email: learnerData.profiles.email,
            recipient_name: learnerData.profiles.full_name || 'Parent',
            data: {
              student_name: learnerData.name,
              teacher_name: teacherData?.profiles?.full_name || metadata.teacher_name,
              subject: subject,
              lesson_date: metadata.lesson_date,
              insight_title: title,
              teacher_notes: lessonDetails?.teacher_notes || null,
              homework_assigned: homeworkData?.assignment_details || null,
              insights_url: `https://talbiyah.ai/student/${lessonData.learner_id}/lesson/${lesson_id}/insights`,
            },
          }),
        });

        if (emailResponse.ok) {
          console.log("Parent notification email sent successfully");
        } else {
          const errorText = await emailResponse.text();
          console.error("Failed to send parent notification email:", errorText);
        }
      } else {
        console.log("No parent email found for learner, skipping notification");
      }
    } catch (emailError) {
      // Don't fail the whole request if email fails
      console.error("Error sending parent notification email:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        lesson_id,
        insight_id: savedInsight.id,
        insight_type: insightType,
        content: generatedText,
        processing_time_ms: processingTime,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating lesson insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
