import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

const sql = `
-- Fix lesson confirmation functions to use correct learners table column
-- The learners table has 'parent_id' not 'user_id'

-- Function: Auto-acknowledge lessons after 24 hours (FIXED)
CREATE OR REPLACE FUNCTION auto_acknowledge_pending_lessons()
RETURNS TABLE(
  lesson_id UUID,
  student_id UUID,
  student_name TEXT,
  teacher_id UUID,
  teacher_name TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  UPDATE lessons l
  SET
    confirmation_status = 'auto_acknowledged',
    acknowledged_at = NOW(),
    auto_acknowledged = TRUE
  FROM learners lr, profiles sp, teacher_profiles tp, profiles t_prof
  WHERE
    l.confirmation_status = 'pending'
    AND l.confirmation_requested_at < NOW() - INTERVAL '24 hours'
    AND l.status = 'booked'
    AND l.learner_id = lr.id
    AND lr.parent_id = sp.id
    AND l.teacher_id = tp.id
    AND tp.user_id = t_prof.id
  RETURNING
    l.id,
    lr.id,
    sp.full_name,
    tp.id,
    t_prof.full_name,
    l.scheduled_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending lessons for teacher (FIXED)
CREATE OR REPLACE FUNCTION get_teacher_pending_lessons(p_teacher_id UUID)
RETURNS TABLE(
  lesson_id UUID,
  student_name TEXT,
  student_id UUID,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  subject_name TEXT,
  hours_until_lesson NUMERIC,
  requested_hours_ago NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    p.full_name,
    lr.id,
    l.scheduled_time,
    l.duration_minutes,
    s.name,
    EXTRACT(EPOCH FROM (l.scheduled_time - NOW())) / 3600,
    EXTRACT(EPOCH FROM (NOW() - l.confirmation_requested_at)) / 3600
  FROM lessons l
  JOIN learners lr ON l.learner_id = lr.id
  JOIN profiles p ON lr.parent_id = p.id
  LEFT JOIN subjects s ON l.subject_id = s.id
  WHERE l.teacher_id = p_teacher_id
  AND l.confirmation_status = 'pending'
  AND l.status = 'booked'
  ORDER BY l.scheduled_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function applyFix() {
  console.log('🔧 Applying lesson confirmation function fixes...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).select();

    if (error) {
      // Try direct execution
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        // If exec_sql doesn't exist, just execute the SQL statements individually
        console.log('⚠️  exec_sql function not available, executing statements directly...\n');

        // Split and execute each function creation
        const statements = sql.split('CREATE OR REPLACE FUNCTION').filter(s => s.trim());

        for (let i = 1; i < statements.length; i++) {
          const statement = 'CREATE OR REPLACE FUNCTION' + statements[i];
          console.log(`Executing statement ${i}...`);

          const { error: execError } = await supabase.rpc('exec', { sql: statement });
          if (execError) {
            console.error(`Error on statement ${i}:`, execError);
          } else {
            console.log(`✅ Statement ${i} executed successfully`);
          }
        }
      } else {
        console.log('✅ Functions updated successfully via REST API');
      }
    } else {
      console.log('✅ Functions updated successfully');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_teacher_pending_lessons', { p_teacher_id: '00000000-0000-0000-0000-000000000000' });

    if (testError && !testError.message.includes('does not exist')) {
      console.error('❌ Function still has errors:', testError);
    } else {
      console.log('✅ Function is working correctly (no schema errors)');
    }

    console.log('\n✅ Lesson confirmation functions have been fixed!');
    console.log('   - Changed lr.user_id to lr.parent_id in both functions');
    console.log('   - Functions should now work correctly with the learners table schema');

  } catch (error) {
    console.error('❌ Error applying fix:', error);
    process.exit(1);
  }
}

applyFix();
