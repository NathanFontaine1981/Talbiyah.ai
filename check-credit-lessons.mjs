import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking ALL recent lessons...\n');

// Get ALL recent lessons (not just credits)
const { data: lessons, error } = await supabase
  .from('lessons')
  .select('id, learner_id, teacher_id, subject_id, scheduled_time, status, payment_method, duration_minutes, created_at, booked_at, payment_status')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('❌ Error fetching lessons:', error);
} else {
  console.log(`✅ Found ${lessons.length} recent lessons:\n`);
  lessons.forEach((lesson, i) => {
    console.log(`${i + 1}. Lesson ID: ${lesson.id}`);
    console.log(`   Learner: ${lesson.learner_id}`);
    console.log(`   Teacher: ${lesson.teacher_id}`);
    console.log(`   Scheduled: ${lesson.scheduled_time}`);
    console.log(`   Status: ${lesson.status}`);
    console.log(`   Payment Method: ${lesson.payment_method || 'NULL'}`);
    console.log(`   Payment Status: ${lesson.payment_status || 'NULL'}`);
    console.log(`   Duration: ${lesson.duration_minutes} min`);
    console.log(`   Booked At: ${lesson.booked_at || 'NULL'}`);
    console.log(`   Created: ${lesson.created_at}\n`);
  });
}

// Check which parent owns the most recent credit lesson learner
const recentLearnerIds = ['7caaa350-9349-4c23-9e89-758b070d277d', '4355b79c-9ad0-45bb-b4fa-6b10049856bc', '58cdb9b4-28b4-4c0b-a85b-0b57e1777abe'];

console.log('\n🔍 Finding parents for recent credit lesson learners...\n');

const { data: learnersWithParents } = await supabase
  .from('learners')
  .select('id, name, parent_id')
  .in('id', recentLearnerIds);

if (learnersWithParents) {
  for (const learner of learnersWithParents) {
    const { data: parent } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', learner.parent_id)
      .single();

    if (parent) {
      console.log(`Learner: ${learner.name || learner.id}`);
      console.log(`  Parent: ${parent.full_name} (${parent.email})\n`);
    }
  }
}

// Also get learner info for Naila (parent)
const { data: parent } = await supabase
  .from('profiles')
  .select('id, email, full_name')
  .eq('email', 'naila.chohan@test.com')
  .single();

if (parent) {
  console.log(`\n👤 Parent: ${parent.full_name} (${parent.email})`);
  console.log(`   ID: ${parent.id}\n`);

  // Get learners for this parent
  const { data: learners, error: learnersError } = await supabase
    .from('learners')
    .select('id, name, parent_id')
    .eq('parent_id', parent.id)
    .limit(5);

  if (learnersError) {
    console.error('❌ Error fetching learners:', learnersError);
  } else {
    console.log(`📚 Found ${learners.length} learners for this parent:`);
    learners.forEach((learner, i) => {
      console.log(`${i + 1}. ${learner.name} (ID: ${learner.id})`);
    });
  }

  // Get lessons for these learners
  if (learners && learners.length > 0) {
    const learnerIds = learners.map(l => l.id);
    console.log(`\n🔍 Checking lessons for learner IDs: ${learnerIds.join(', ')}\n`);

    const { data: learnerLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, learner_id, scheduled_time, status, payment_method')
      .in('learner_id', learnerIds)
      .gte('scheduled_time', new Date().toISOString())
      .eq('status', 'booked')
      .order('scheduled_time', { ascending: true });

    if (lessonsError) {
      console.error('❌ Error fetching learner lessons:', lessonsError);
    } else {
      console.log(`✅ Found ${learnerLessons.length} upcoming lessons for these learners:`);
      learnerLessons.forEach((lesson, i) => {
        console.log(`${i + 1}. Lesson ${lesson.id} - ${lesson.scheduled_time} (${lesson.payment_method})`);
      });
    }
  }
}
