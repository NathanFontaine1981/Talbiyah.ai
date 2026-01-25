// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  verifyAndCorrectQuizAnswers,
  createVerificationLog,
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

// System prompts
const QURAN_PROMPT = `You are Talbiyah Insights – Qur'an with Tadabbur.
Your task is to transform a Qur'an lesson transcript into structured, reflective, and easy-to-study notes.
The goal is to help students understand, internalise, and live by the Qur'an's meanings.

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

CRITICAL: Double-check that the ✅ is placed after the factually correct answer based on Islamic knowledge.

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
* List 3–5 things the student should do before the next lesson.
* Include a mix of writing, speaking, and reading tasks.
* Keep each one short and actionable.

Example:
📝 Write 5 sentences using أَخْرَجَ in past and future forms.
🗣️ Practise reading the dialogue aloud and record yourself.
📖 Revise vocabulary flashcards for "places" and "daily actions."
🎧 Listen to a short Arabic clip and try to repeat each sentence clearly.

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
* Always include at least 15 new vocabulary words and 10 quiz questions.`;

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
    let verifiedFirstWordsContext = '';

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
      // Fallback to hardcoded Quran prompt
      systemPrompt = QURAN_PROMPT;
      insightType = 'subject_specific';
      title = `Qur'an Insights: ${metadata.lesson_date}`;
      console.log('Using fallback QURAN_PROMPT');
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

    // For Quran lessons (both Understanding and Memorisation), fetch verified data
    if (isQuranLesson && metadata.surah_number && metadata.ayah_range) {
      const ayahRangeMatch = metadata.ayah_range.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (ayahRangeMatch) {
        const startAyah = parseInt(ayahRangeMatch[1], 10);
        const endAyah = parseInt(ayahRangeMatch[2], 10);

        console.log(`Fetching verified Quran data for Surah ${metadata.surah_number}, Ayat ${startAyah}-${endAyah}...`);

        // Fetch verses and tafsir in parallel
        const [fetchedVerses, fetchedTafsir] = await Promise.all([
          fetchVerifiedQuranData(metadata.surah_number, startAyah, endAyah),
          fetchTafsirData(metadata.surah_number, startAyah, endAyah)
        ]);

        verifiedVerses = fetchedVerses;
        tafsirEntries = fetchedTafsir;

        console.log(`Fetched ${verifiedVerses.length} verified verses from Quran.com API`);
        console.log(`Fetched ${tafsirEntries.length} tafsir entries from Ibn Kathir`);

        // Generate verified Verses Covered section with full Arabic and translation
        versesCoveredSection = generateVersesCoveredSection(verifiedVerses, metadata.surah_name || 'Quran');

        // Generate verified First Word Prompter section
        firstWordPrompterSection = generateFirstWordPrompterSection(verifiedVerses);

        // Generate scholarly Tafsir section
        tafsirSection = generateTafsirSection(tafsirEntries, metadata.surah_name || 'Quran');

        // Create context for AI prompt
        if (verifiedVerses.length > 0) {
          verifiedFirstWordsContext = `\n\nVERIFIED FIRST WORDS (from Quran.com API - USE THESE EXACT VALUES):\n${verifiedVerses.map(v => `Ayah ${v.ayahNumber}: ${v.firstWord} (${v.transliteration})`).join('\n')}\n`;
        }
      }
    }

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
${verifiedFirstWordsContext}

CRITICAL INSTRUCTIONS:
1. Read the ENTIRE transcript carefully before generating insights
2. Identify which surah(s) and ayat were ACTUALLY discussed (not what the booking says)
3. If the student recited one surah for revision/warm-up but learned a different surah, note BOTH
4. For the "Flow of Meaning" section: Focus on what the TEACHER actually explained in the lesson
5. NOTE: Scholarly tafsir from Ibn Kathir will be automatically appended from Quran.com API - you don't need to generate comprehensive tafsir
6. Your role is to capture the LESSON EXPERIENCE - the teacher's explanations, examples, and discussions

TRANSCRIPT:
${transcript}

${isQuranLesson && verifiedVerses.length > 0 ? 'IMPORTANT: If you include a First Word Prompter section, you MUST use the VERIFIED FIRST WORDS provided above. Do NOT guess or generate first words - they have been verified from the Quran.com API.\n\n' : ''}Generate the insights following the exact format specified in the system prompt. Remember: transcript content takes priority over booking metadata.`;

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

    // CRITICAL: Extract actual surah info from AI-generated content
    // This is the authoritative source - AI analyzes the actual transcript
    let actualSurahInfo: { surahName?: string; surahNumber?: number; ayahRange?: string } | null = null;
    if (isQuranLesson) {
      actualSurahInfo = extractSurahInfoFromAIContent(generatedText);
      if (actualSurahInfo) {
        console.log("AI identified actual surah from transcript:", actualSurahInfo);

        // Check if AI found a different surah than what was in metadata
        const metadataSurahNumber = metadata.surah_number;
        const actualSurahNumber = actualSurahInfo.surahNumber;

        if (actualSurahNumber && (!metadataSurahNumber || actualSurahNumber !== metadataSurahNumber)) {
          console.log(`Surah mismatch detected! Metadata: ${metadataSurahNumber}, AI found: ${actualSurahNumber}`);
          console.log("Re-fetching verified verses for correct surah...");

          // Parse ayah range from AI content, default to 1-10 if not found
          let startAyah = 1;
          let endAyah = 10;
          if (actualSurahInfo.ayahRange) {
            const ayahMatch = actualSurahInfo.ayahRange.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (ayahMatch) {
              startAyah = parseInt(ayahMatch[1], 10);
              endAyah = parseInt(ayahMatch[2], 10);
            }
          }

          // Re-fetch the correct verses and tafsir in parallel
          const [correctedVerses, correctedTafsir] = await Promise.all([
            fetchVerifiedQuranData(actualSurahNumber, startAyah, endAyah),
            fetchTafsirData(actualSurahNumber, startAyah, endAyah)
          ]);

          if (correctedVerses.length > 0) {
            console.log(`Successfully fetched ${correctedVerses.length} verses for Surah ${actualSurahNumber}`);
            console.log(`Successfully fetched ${correctedTafsir.length} tafsir entries for Surah ${actualSurahNumber}`);
            verifiedVerses = correctedVerses;
            tafsirEntries = correctedTafsir;

            // Update metadata with correct info for storage
            metadata.surah_name = actualSurahInfo.surahName || metadata.surah_name;
            metadata.surah_number = actualSurahNumber;
            metadata.ayah_range = actualSurahInfo.ayahRange || `${startAyah}-${endAyah}`;

            // Re-generate the verified sections
            versesCoveredSection = generateVersesCoveredSection(verifiedVerses, metadata.surah_name || 'Quran');
            firstWordPrompterSection = generateFirstWordPrompterSection(verifiedVerses);
            tafsirSection = generateTafsirSection(tafsirEntries, metadata.surah_name || 'Quran');
          } else {
            console.log(`Warning: Could not fetch verses for Surah ${actualSurahNumber}`);
          }
        } else if (actualSurahNumber && metadataSurahNumber === actualSurahNumber) {
          console.log(`Surah confirmed: metadata and AI agree on Surah ${actualSurahNumber}`);
          // Update ayah range if AI found more specific info
          if (actualSurahInfo.ayahRange && !metadata.ayah_range) {
            metadata.ayah_range = actualSurahInfo.ayahRange;
          }
        }
      } else if (verifiedVerses.length === 0) {
        // If AI didn't explicitly identify a surah but we have no verified verses,
        // try one more time to parse from the lesson title
        console.log("AI did not explicitly identify surah, checking if we need to fetch verses...");
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
    } else if (isQuranLesson && versesCoveredSection) {
      console.log("Skipped verified verse append - AI identified different content than metadata");
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

    // QUIZ VERIFICATION: Auto-correct quiz answers about Quran verses
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

    // Try to extract actual surah info from the generated content
    const actualSurahInfo = isQuranLesson ? extractActualSurahInfo(generatedText) : null;

    // Update title with actual content if found
    if (actualSurahInfo?.surah) {
      const surahPart = actualSurahInfo.surah;
      const ayatPart = actualSurahInfo.ayat ? ` (${actualSurahInfo.ayat})` : '';

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
