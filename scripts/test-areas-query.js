import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
  const targetId = '6b4a3333-b172-416e-8f13-403cbeb69719'; // Nathan's auth ID

  console.log('Testing as anon (simulating frontend)...\n');

  // Test 1: Get learners
  console.log('1. Getting learners with parent_id =', targetId);
  const { data: learners, error: learnersError } = await supabase
    .from('learners')
    .select('id')
    .eq('parent_id', targetId);

  console.log('   Learners:', learners);
  if (learnersError) console.log('   Error:', learnersError);

  const learnerIds = [targetId];
  if (learners) {
    learners.forEach(l => learnerIds.push(l.id));
  }
  console.log('   All learner IDs:', learnerIds);

  // Test 2: Get lesson_details
  console.log('\n2. Getting lesson_details...');
  const { data: lessonDetails, error: detailsError } = await supabase
    .from('lesson_details')
    .select(`
      id,
      lesson_id,
      areas_for_improvement,
      recommended_focus,
      strengths_observed,
      created_at,
      lessons!inner(
        scheduled_time,
        learner_id,
        subjects(name)
      )
    `)
    .not('areas_for_improvement', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('   Lesson details:', JSON.stringify(lessonDetails, null, 2));
  if (detailsError) console.log('   Error:', detailsError);

  // Test 3: Filter by learner IDs
  if (lessonDetails) {
    console.log('\n3. Filtering by learner IDs...');
    lessonDetails.forEach((ld) => {
      const lessonLearnerId = ld.lessons?.learner_id;
      const matches = learnerIds.includes(lessonLearnerId);
      console.log(`   Lesson ${ld.lesson_id}: learner_id=${lessonLearnerId}, matches=${matches}`);
    });
  }
}

main();
