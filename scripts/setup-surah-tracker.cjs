// Script to populate surah_retention_tracker for Nathan Fontaine
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('Setting up surah_retention_tracker for Nathan Fontaine...\n');

  // Nathan Fontaine's learner ID
  const learnerId = '68405fd0-2c98-411a-9c77-93b7c6558be7';
  const today = new Date().toISOString();

  // Surahs to mark as memorized:
  // 1. Surahs 80-114 (35 surahs)
  // 2. Surah 1 (Al-Fatihah)
  // 3. Surah 18 (Al-Kahf)
  // 4. Surah 67 (Al-Mulk)
  // 5. Surah 2 (Ayat al-Kursi only - will note as partial)
  // 6. Surah 53 (An-Najm - first 28 ayahs - will note as partial)

  const surahsToInsert = [
    // Full surahs
    1, 18, 67,
    // Partial surahs (2 = Ayat al-Kursi, 53 = first 28 ayahs An-Najm)
    2, 53,
    // Surahs 80-114
    80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
    110, 111, 112, 113, 114
  ];

  // Remove duplicates (114 already inserted)
  const uniqueSurahs = [...new Set(surahsToInsert)];

  console.log(`Inserting ${uniqueSurahs.length} surahs as memorized...\n`);

  // Prepare records
  const records = uniqueSurahs.map(surah => ({
    learner_id: learnerId,
    surah_number: surah,
    memorization_status: 'memorized',
    memorization_completed_at: today,
    retention_score: 100,
    next_review_date: new Date().toISOString().split('T')[0],
    review_interval_days: 7, // Weekly review for fluent surahs
    ease_factor: 2.5,
    consecutive_correct: 5 // Assume already fluent
  }));

  // Upsert records
  const { data, error } = await supabase
    .from('surah_retention_tracker')
    .upsert(records, {
      onConflict: 'learner_id,surah_number',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('Error inserting data:', error);
    return;
  }

  console.log(`Successfully inserted/updated ${data.length} surah records!\n`);
  console.log('Surahs marked as memorized:');
  console.log('- Surah 1 (Al-Fatihah)');
  console.log('- Surah 2 (Al-Baqarah - Ayat al-Kursi)');
  console.log('- Surah 18 (Al-Kahf)');
  console.log('- Surah 53 (An-Najm - first 28 ayahs)');
  console.log('- Surah 67 (Al-Mulk)');
  console.log('- Surahs 80-114 (Juz Amma surahs)');
  console.log('\nTotal: 40 surahs marked as memorized');
}

main().catch(console.error);
