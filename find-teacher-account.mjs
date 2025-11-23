import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTeacherAccount() {
  console.log('\n🔍 Looking for teacher accounts...\n');

  // Get all teacher profiles
  const { data: teachers, error } = await supabase
    .from('teacher_profiles')
    .select(`
      id,
      user_id,
      status,
      current_tier,
      profiles!teacher_profiles_user_id_fkey (
        full_name,
        email
      )
    `);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${teachers.length} teacher profiles:\n`);

  teachers.forEach((teacher, index) => {
    console.log(`${index + 1}. ${teacher.profiles?.full_name || 'No name'}`);
    console.log(`   Email: ${teacher.profiles?.email || 'No email'}`);
    console.log(`   Teacher ID: ${teacher.id}`);
    console.log(`   User ID: ${teacher.user_id}`);
    console.log(`   Status: ${teacher.status}`);
    console.log(`   Tier: ${teacher.current_tier || 'none'}`);
    console.log('');
  });
}

findTeacherAccount().catch(console.error);
