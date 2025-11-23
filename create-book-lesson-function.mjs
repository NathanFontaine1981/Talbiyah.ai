import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('📝 Creating book_lesson_with_credits function...\n');

const sql = `
-- Drop function if exists
DROP FUNCTION IF EXISTS book_lesson_with_credits(UUID, UUID, UUID, DATE, TIME, INTEGER, NUMERIC, BOOLEAN);

-- Create function to book lessons that doesn't rely on schema cache
CREATE OR REPLACE FUNCTION book_lesson_with_credits(
  p_learner_id UUID,
  p_teacher_id UUID,
  p_subject_id UUID,
  p_scheduled_date DATE,
  p_scheduled_time TIME,
  p_duration_minutes INTEGER,
  p_price NUMERIC,
  p_is_trial BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lesson_id UUID;
BEGIN
  -- Insert the lesson
  INSERT INTO lessons (
    learner_id,
    teacher_id,
    subject_id,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    price,
    is_trial,
    status,
    payment_method,
    payment_status,
    booked_at,
    created_at,
    updated_at
  ) VALUES (
    p_learner_id,
    p_teacher_id,
    p_subject_id,
    p_scheduled_date,
    p_scheduled_time,
    p_duration_minutes,
    p_price,
    p_is_trial,
    'booked',
    'credits',
    'paid',
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_lesson_id;

  RETURN v_lesson_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION book_lesson_with_credits(UUID, UUID, UUID, DATE, TIME, INTEGER, NUMERIC, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION book_lesson_with_credits(UUID, UUID, UUID, DATE, TIME, INTEGER, NUMERIC, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION book_lesson_with_credits(UUID, UUID, UUID, DATE, TIME, INTEGER, NUMERIC, BOOLEAN) TO anon;
`;

try {
  // Execute via raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    console.log('⚠️  exec_sql RPC not available, trying alternative method...\n');

    // Try pg_execute instead
    const { data, error } = await supabase.rpc('pg_execute', {
      sql_query: sql
    });

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n⚠️  Please run create-lesson-booking-function.sql in Supabase SQL Editor manually.');
      process.exit(1);
    }
  }

  console.log('✅ Function created successfully!');
  console.log('\n🧪 Testing the function...');

  // Test if function exists
  const { data: testData, error: testError } = await supabase.rpc('book_lesson_with_credits', {
    p_learner_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID to test
    p_teacher_id: '00000000-0000-0000-0000-000000000000',
    p_subject_id: '00000000-0000-0000-0000-000000000000',
    p_scheduled_date: '2025-01-01',
    p_scheduled_time: '10:00:00',
    p_duration_minutes: 60,
    p_price: 15,
    p_is_trial: false
  });

  if (testError && !testError.message.includes('foreign key')) {
    console.error('⚠️  Function may not exist:', testError.message);
    console.log('\n📋 Please run the SQL from create-lesson-booking-function.sql in Supabase SQL Editor.');
  } else {
    console.log('✅ Function is callable!');
  }

} catch (err) {
  console.error('❌ Unexpected error:', err.message);
  console.log('\n📋 Please run create-lesson-booking-function.sql in Supabase SQL Editor.');
}
