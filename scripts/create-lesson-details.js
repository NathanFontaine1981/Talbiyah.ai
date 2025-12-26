// Script to create lesson_details table and insert teacher feedback
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log('Creating lesson_details table...');

  // Try to create the table using raw SQL via the database function
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS lesson_details (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      topics_covered text[],
      surahs_practiced integer[],
      ayat_range_start integer,
      ayat_range_end integer,
      milestones_addressed uuid[],
      milestones_verified uuid[],
      teacher_notes text,
      strengths_observed text,
      areas_for_improvement text,
      recommended_focus text,
      homework_assigned boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(lesson_id)
    );
  `;

  // Since we can't run arbitrary SQL, let's just try to insert directly
  // and see if the table exists

  console.log('Attempting to insert teacher feedback...');

  const { data, error } = await supabase
    .from('lesson_details')
    .upsert({
      lesson_id: 'e1b1e061-4bc9-4270-966c-f84b46749dc1',
      topics_covered: ['Tadabbur (reflection)', 'Tafsir study', 'Vocabulary analysis', 'Memorization practice'],
      surahs_practiced: [79],
      ayat_range_start: 27,
      ayat_range_end: 46,
      teacher_notes: "Excellent lesson covering Surah An-Nazi'at (79:27-46). Nathan showed strong engagement with the tafsir and made meaningful connections between Allah's creation of the heavens/earth and His power over resurrection.",
      strengths_observed: "Strong comprehension of Arabic vocabulary roots (like طغى, آثر, دحاها). Excellent recall of first words for memorization prompts. Good understanding of the three-part structure: Allah's creation, Day of Judgment, and consequences of transgression.",
      areas_for_improvement: "Work on pronunciation of مَتَاعًا (mata'an) and الطَّامَّةُ (at-tammah). Practice the qalqalah sounds in الْكُبْرَىٰ. Focus on connecting the warning about transgression (طغى) to daily life choices.",
      recommended_focus: "Continue with Surah An-Nazi'at ayat 40-46 next lesson. Review the vocabulary table for word roots. Practice the reflection questions about prioritizing the Hereafter over worldly life."
    }, {
      onConflict: 'lesson_id'
    })
    .select();

  if (error) {
    console.error('Error:', error);

    if (error.code === '42P01') {
      console.log('\nTable does not exist. You need to run the migration first.');
      console.log('Go to Supabase Dashboard > SQL Editor and run:');
      console.log(`
CREATE TABLE IF NOT EXISTS lesson_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  topics_covered text[],
  surahs_practiced integer[],
  ayat_range_start integer,
  ayat_range_end integer,
  milestones_addressed uuid[],
  milestones_verified uuid[],
  teacher_notes text,
  strengths_observed text,
  areas_for_improvement text,
  recommended_focus text,
  homework_assigned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lesson_id)
);

ALTER TABLE lesson_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson details" ON lesson_details FOR SELECT USING (true);
CREATE POLICY "Service role can insert" ON lesson_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update" ON lesson_details FOR UPDATE USING (true);
      `);
    }
    return;
  }

  console.log('Success! Teacher feedback inserted:', data);
}

main();
