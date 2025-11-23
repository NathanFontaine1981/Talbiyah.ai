import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY'
);

console.log('🔍 Checking database schema...\n');

// Check for key tables/views that are causing 400 errors
const checks = [
  { name: 'teacher_tier_stats', type: 'view' },
  { name: 'teacher_earnings', type: 'table' },
  { name: 'lessons', type: 'table' },
  { name: 'learners', type: 'table' },
  { name: 'teacher_profiles', type: 'table' },
];

async function checkSchema() {
  for (const check of checks) {
    console.log(`Checking ${check.type}: ${check.name}...`);

    try {
      const { data, error, count } = await supabase
        .from(check.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ NOT FOUND or ERROR: ${error.message}`);
        console.log(`     Code: ${error.code}, Details: ${error.details || 'none'}\n`);
      } else {
        console.log(`  ✅ EXISTS (${count || 0} rows)\n`);
      }
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}\n`);
    }
  }

  // Check for lesson confirmation columns
  console.log('\n📋 Checking lesson confirmation columns...');
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('confirmation_status, confirmation_requested_at')
      .limit(1);

    if (error) {
      console.log(`  ❌ Columns NOT FOUND: ${error.message}\n`);
    } else {
      console.log(`  ✅ Confirmation columns exist\n`);
    }
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}\n`);
  }

  // Check functions
  console.log('\n🔧 Checking functions...');
  const functions = ['get_teacher_pending_lessons', 'auto_acknowledge_pending_lessons'];

  for (const funcName of functions) {
    try {
      const { data, error } = await supabase.rpc(funcName, {
        p_teacher_id: '00000000-0000-0000-0000-000000000000'
      });

      if (error && !error.message.includes('does not exist')) {
        console.log(`  ${funcName}: ✅ EXISTS (may have schema error: ${error.message})`);
      } else if (error) {
        console.log(`  ${funcName}: ❌ NOT FOUND`);
      } else {
        console.log(`  ${funcName}: ✅ WORKING`);
      }
    } catch (err) {
      console.log(`  ${funcName}: ❌ ERROR - ${err.message}`);
    }
  }

  // Check for teacher with specific ID
  console.log('\n👨‍🏫 Checking specific teacher (dffab54a-d120-4044-9db6-e5d987b3d5d5)...');
  try {
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select('id, status, user_id')
      .eq('id', 'dffab54a-d120-4044-9db6-e5d987b3d5d5')
      .single();

    if (error) {
      console.log(`  ❌ Teacher not found: ${error.message}`);
    } else {
      console.log(`  ✅ Teacher found: status=${data.status}, user_id=${data.user_id}`);
    }
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}`);
  }

  console.log('\n✅ Schema check complete!');
}

checkSchema();
