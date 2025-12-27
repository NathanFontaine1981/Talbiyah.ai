import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.bxbwTT3u0mbUdj3Hh-Dk8WY4LGIrXZKHy9Gs-rB1uWQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addColumns() {
  console.log('Checking if quiz tracking columns exist in homework_submissions...');

  // Try to query the new columns to see if they exist
  const { data, error } = await supabase
    .from('homework_submissions')
    .select('first_attempt_score, total_quiz_attempts')
    .limit(1);

  if (error && error.message.includes('column')) {
    console.log('Columns do not exist yet. They need to be added via Supabase Dashboard SQL Editor.');
    console.log('Run this SQL:');
    console.log(`
ALTER TABLE homework_submissions
ADD COLUMN IF NOT EXISTS first_attempt_score INTEGER,
ADD COLUMN IF NOT EXISTS first_attempt_total INTEGER,
ADD COLUMN IF NOT EXISTS first_attempt_answers JSONB,
ADD COLUMN IF NOT EXISTS first_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_quiz_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_quiz_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS best_quiz_score INTEGER;
    `);
  } else if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ Quiz tracking columns already exist!');
    console.log('Sample data:', data);
  }
}

addColumns().catch(console.error);
