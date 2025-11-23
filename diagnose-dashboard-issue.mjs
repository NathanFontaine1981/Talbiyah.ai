import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DIAGNOSING DASHBOARD DISPLAY ISSUE\n');

// 1. Get Naila's parent profile
const { data: parent } = await supabase
  .from('profiles')
  .select('id, email, full_name')
  .eq('email', 'naila.chohan@test.com')
  .single();

if (!parent) {
  console.log('❌ Parent not found');
  process.exit(1);
}

console.log('👤 Parent:', parent.full_name);
console.log('   ID:', parent.id);
console.log('   Email:', parent.email);

// 2. Get all learners for this parent
const { data: learners, error: learnersError } = await supabase
  .from('learners')
  .select('id, name, parent_id, user_id')
  .eq('parent_id', parent.id);

console.log(`\n📚 Found ${learners?.length || 0} learners for this parent:`);
if (learners) {
  learners.forEach((learner, i) => {
    console.log(`${i + 1}. ${learner.name}`);
    console.log(`   ID: ${learner.id}`);
    console.log(`   Parent ID: ${learner.parent_id}`);
    console.log(`   User ID: ${learner.user_id || 'NULL'}\n`);
  });
}

// 3. Get ALL credit lessons (payment_method = 'credits')
const { data: creditLessons } = await supabase
  .from('lessons')
  .select('id, learner_id, teacher_id, scheduled_time, status, payment_method, booked_at')
  .eq('payment_method', 'credits')
  .order('created_at', { ascending: false })
  .limit(10);

console.log(`\n💳 Found ${creditLessons?.length || 0} credit lessons:\n`);
if (creditLessons) {
  creditLessons.forEach((lesson, i) => {
    console.log(`${i + 1}. Lesson ID: ${lesson.id}`);
    console.log(`   Learner ID: ${lesson.learner_id}`);
    console.log(`   Status: ${lesson.status}`);
    console.log(`   Scheduled: ${lesson.scheduled_time}`);
    console.log(`   Booked At: ${lesson.booked_at}\n`);
  });
}

// 4. Check if credit lesson learners match parent's learners
if (creditLessons && learners) {
  const learnerIds = learners.map(l => l.id);
  const creditLearnerIds = [...new Set(creditLessons.map(l => l.learner_id))];

  console.log('\n🔍 Matching learner IDs:');
  console.log('   Parent learners:', learnerIds);
  console.log('   Credit lesson learners:', creditLearnerIds);

  const matching = creditLearnerIds.filter(id => learnerIds.includes(id));
  const notMatching = creditLearnerIds.filter(id => !learnerIds.includes(id));

  if (matching.length > 0) {
    console.log(`\n✅ ${matching.length} credit lessons match parent's learners`);
  }

  if (notMatching.length > 0) {
    console.log(`\n❌ ${notMatching.length} credit lessons DON'T match parent's learners:`);
    console.log('   Orphaned learner IDs:', notMatching);

    // Get info about orphaned learners
    for (const learnerId of notMatching) {
      const { data: orphanLearner } = await supabase
        .from('learners')
        .select('id, name, parent_id')
        .eq('id', learnerId)
        .single();

      if (orphanLearner) {
        console.log(`\n   Learner: ${orphanLearner.name} (${orphanLearner.id})`);
        console.log(`   Parent ID: ${orphanLearner.parent_id}`);

        if (orphanLearner.parent_id) {
          const { data: orphanParent } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', orphanLearner.parent_id)
            .single();

          if (orphanParent) {
            console.log(`   Belongs to: ${orphanParent.full_name} (${orphanParent.email})`);
          }
        }
      }
    }
  }
}

// 5. Test the exact query that UpcomingSessionsCard uses
if (learners && learners.length > 0) {
  const targetLearnerId = learners[0].id;
  console.log(`\n\n🔍 Testing UpcomingSessionsCard query for learner: ${learners[0].name}`);
  console.log(`   Learner ID: ${targetLearnerId}\n`);

  const { data: upcomingLessons, error: queryError } = await supabase
    .from('lessons')
    .select(`
      id,
      scheduled_time,
      duration_minutes,
      status,
      teacher_id,
      subject_id,
      payment_method,
      teacher_profiles!inner(
        user_id,
        profiles!inner(
          full_name,
          avatar_url
        )
      ),
      subjects!inner(
        name
      )
    `)
    .eq('learner_id', targetLearnerId)
    .eq('status', 'booked')
    .gte('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: true })
    .limit(5);

  if (queryError) {
    console.error('❌ Query error:', queryError);
  } else {
    console.log(`✅ Query returned ${upcomingLessons?.length || 0} lessons\n`);

    if (upcomingLessons && upcomingLessons.length > 0) {
      upcomingLessons.forEach((lesson, i) => {
        console.log(`${i + 1}. ${lesson.subjects.name} - ${lesson.scheduled_time}`);
        console.log(`   Teacher: ${lesson.teacher_profiles.profiles.full_name}`);
        console.log(`   Payment: ${lesson.payment_method}\n`);
      });
    } else {
      console.log('⚠️  No upcoming lessons found for this learner');
    }
  }
}
