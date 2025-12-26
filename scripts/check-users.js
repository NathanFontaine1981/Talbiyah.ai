import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // List all auth users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Auth Users:');
  users.forEach(u => {
    console.log(`  ${u.id} - ${u.email}`);
  });

  // Find nathanlfontaine@gmail.com
  const nathan = users.find(u => u.email === 'nathanlfontaine@gmail.com');
  if (nathan) {
    console.log('\nNathan auth user ID:', nathan.id);

    // Check learners with this parent
    const { data: learners } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .eq('parent_id', nathan.id);

    console.log('Learners with Nathan as parent:', learners);

    // Check lesson_details
    const { data: details } = await supabase
      .from('lesson_details')
      .select('id, lesson_id, areas_for_improvement, lessons(learner_id)')
      .limit(5);

    console.log('\nLesson details:', JSON.stringify(details, null, 2));
  }
}

main();
