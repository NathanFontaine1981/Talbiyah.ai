// Direct fix for lesson confirmation functions
// This bypasses migrations and directly creates/replaces the functions

const SUPABASE_URL = 'https://boyrjgivpepjiboekwuu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

async function executeSQL(sql) {
  // Try using the database-webhooks table which allows direct SQL execution
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to execute SQL: ${response.status} - ${text}`);
  }

  return response;
}

const functions = [
  {
    name: 'get_teacher_pending_lessons',
    sql: `
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
`
  },
  {
    name: 'auto_acknowledge_pending_lessons',
    sql: `
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
`
  }
];

async function fixFunctions() {
  console.log('🔧 Fixing lesson confirmation functions...\n');

  for (const func of functions) {
    console.log(`📝 Creating/replacing function: ${func.name}`);
    try {
      await executeSQL(func.sql);
      console.log(`✅ ${func.name} updated successfully\n`);
    } catch (error) {
      console.error(`❌ Failed to update ${func.name}:`, error.message);
      console.log(`\n⚠️  Trying alternative method for ${func.name}...\n`);

      // Alternative: Use Supabase Management API if available
      const pgResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: func.sql
        })
      });

      if (!pgResponse.ok) {
        console.error(`❌ Alternative method also failed for ${func.name}`);
        console.error(`   Status: ${pgResponse.status}`);
        console.error(`   Response: ${await pgResponse.text()}`);
      }
    }
  }

  console.log('\n✅ Function fix process completed!');
  console.log('   Please refresh your browser to test the changes.');
}

fixFunctions().catch(console.error);
