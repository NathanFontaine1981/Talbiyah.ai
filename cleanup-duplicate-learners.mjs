import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const parentId = 'b8537f26-035c-4400-9509-40fc2b5c270e';

console.log('🧹 Cleaning up duplicate learners...\n');

// Get all learners
const { data: allLearners } = await supabase
  .from('learners')
  .select('id, name')
  .eq('parent_id', parentId);

console.log(`Total learners found: ${allLearners?.length || 0}\n`);

// Find which learners have lessons
const { data: lessonsData } = await supabase
  .from('lessons')
  .select('learner_id')
  .in('learner_id', allLearners?.map(l => l.id) || []);

const learnerIdsWithLessons = new Set(lessonsData?.map(l => l.learner_id) || []);

console.log(`Learners with lessons: ${learnerIdsWithLessons.size}`);
learnerIdsWithLessons.forEach(id => {
  const learner = allLearners?.find(l => l.id === id);
  console.log(`  - ${learner?.name} (${id})`);
});
console.log('');

// Identify duplicates to delete (keep only those with lessons)
const toDelete = allLearners?.filter(l => !learnerIdsWithLessons.has(l.id)) || [];

console.log(`\nLearners to DELETE: ${toDelete.length}`);
console.log('(These have no lessons and are duplicates)\n');

if (toDelete.length > 0) {
  console.log('Deleting duplicate learners...');

  const { error } = await supabase
    .from('learners')
    .delete()
    .in('id', toDelete.map(l => l.id));

  if (error) {
    console.error('❌ Error deleting:', error);
  } else {
    console.log(`✅ Deleted ${toDelete.length} duplicate learners`);
  }
}

// Verify
const { data: remaining } = await supabase
  .from('learners')
  .select('id, name')
  .eq('parent_id', parentId);

console.log(`\n✅ Remaining learners: ${remaining?.length || 0}`);
remaining?.forEach((l, i) => {
  const hasLesson = learnerIdsWithLessons.has(l.id);
  console.log(`${i + 1}. ${l.name} (${l.id}) ${hasLesson ? '✓ has lessons' : ''}`);
});

console.log('\n✅ Done! Now refresh the dashboards.');
