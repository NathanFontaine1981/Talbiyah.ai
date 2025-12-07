/**
 * Script to fix First Word Prompter data in existing insights
 * Uses Quran.com API to get verified first words
 *
 * Run with: npx tsx scripts/fix-insight-first-words.ts
 */

import { createClient } from '@supabase/supabase-js';

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

// Load env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface VerifiedVerse {
  ayahNumber: number;
  verseKey: string;
  firstWord: string;
  transliteration: string;
  translation: string;
  fullVerseUthmani: string;
  fullVerseTranslation: string;
}

async function fetchVerifiedQuranData(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): Promise<VerifiedVerse[]> {
  try {
    console.log(`Fetching Surah ${surahNumber}, Ayat ${startAyah}-${endAyah} from Quran.com API...`);

    const params = new URLSearchParams({
      language: 'en',
      words: 'true',
      word_fields: 'text_uthmani,text_simple,translation,transliteration',
      translations: '131',
      per_page: '50',
    });

    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_chapter/${surahNumber}?${params}`
    );

    if (!response.ok) {
      console.error('Failed to fetch from Quran API:', response.status);
      return [];
    }

    const data = await response.json();
    const verses: VerifiedVerse[] = [];

    for (const verse of data.verses) {
      if (verse.verse_number >= startAyah && verse.verse_number <= endAyah) {
        const firstWord = verse.words?.find(
          (w: any) => w.char_type_name === 'word' && w.position === 1
        );

        verses.push({
          ayahNumber: verse.verse_number,
          verseKey: verse.verse_key,
          firstWord: firstWord?.text_uthmani || verse.text_uthmani?.split(' ')[0] || '',
          transliteration: firstWord?.transliteration?.text || '',
          translation: firstWord?.translation?.text || '',
          fullVerseUthmani: verse.text_uthmani,
          fullVerseTranslation: verse.translations?.[0]?.text || '',
        });
      }
    }

    return verses.sort((a, b) => a.ayahNumber - b.ayahNumber);
  } catch (error) {
    console.error('Error fetching Quran data:', error);
    return [];
  }
}

function generateFirstWordPrompterMarkdown(verses: VerifiedVerse[]): string {
  if (verses.length === 0) return '';

  let section = `
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

async function fixInsightFirstWords(lessonDate: string, surahNumber: number, startAyah: number, endAyah: number) {
  console.log('\n========================================');
  console.log('Fixing First Word Prompter Data');
  console.log('========================================\n');

  // Fetch verified data
  const verifiedVerses = await fetchVerifiedQuranData(surahNumber, startAyah, endAyah);

  if (verifiedVerses.length === 0) {
    console.error('Could not fetch verified Quran data');
    return;
  }

  console.log(`\n✅ Fetched ${verifiedVerses.length} verified verses:\n`);

  // Print the verified first words
  console.log('| Ayah | First Word | Transliteration |');
  console.log('|------|------------|-----------------|');
  for (const v of verifiedVerses) {
    console.log(`| ${v.ayahNumber} | ${v.firstWord} | ${v.transliteration} |`);
  }

  // Generate the correct markdown
  const correctMarkdown = generateFirstWordPrompterMarkdown(verifiedVerses);

  console.log('\n\n========================================');
  console.log('CORRECTED FIRST WORD PROMPTER SECTION:');
  console.log('========================================');
  console.log(correctMarkdown);

  // Find the insight to update
  console.log('\n\nSearching for insight to update...');

  const { data: insights, error } = await supabase
    .from('lesson_insights')
    .select('*')
    .ilike('title', `%${surahNumber}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching insights:', error);
    return;
  }

  if (!insights || insights.length === 0) {
    console.log('No matching insights found. You may need to manually update.');
    console.log('\nCopy the corrected markdown above and paste it into the insight.');
    return;
  }

  console.log(`\nFound ${insights.length} potential insights:`);
  insights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight.title} (ID: ${insight.id})`);
  });

  // For now, just output the data - manual update recommended
  console.log('\n========================================');
  console.log('MANUAL UPDATE INSTRUCTIONS:');
  console.log('========================================');
  console.log('1. Go to Supabase Dashboard > Table Editor > lesson_insights');
  console.log('2. Find the insight for the Nov 30th lesson');
  console.log('3. In the detailed_insights JSON, update the First Word Prompter section');
  console.log('4. Or regenerate the insight using the updated Edge Function');
  console.log('\nThe verified first words are shown above.');
}

// Run for the specific lesson mentioned
// Surah 28 (Al-Qasas), Ayat 1-26 (adjust as needed based on the actual lesson)
const SURAH_NUMBER = 28;
const START_AYAH = 1;
const END_AYAH = 26;
const LESSON_DATE = '2024-11-30';

fixInsightFirstWords(LESSON_DATE, SURAH_NUMBER, START_AYAH, END_AYAH);
