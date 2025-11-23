import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 CHECKING ALL RECENT LESSONS\n');

// Get ALL recent lessons from today
const { data: lessons, error } = await supabase
  .from('lessons')
  .select('id, learner_id, teacher_id, subject_id, scheduled_time, status, payment_method, payment_status, duration_minutes, created_at, booked_at, price')
  .gte('created_at', '2025-11-20T00:00:00')
  .order('created_at', { ascending: false })
  .limit(20);

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`✅ Found ${lessons?.length || 0} lessons created today:\n`);

if (lessons && lessons.length > 0) {
  lessons.forEach((lesson, i) => {
    console.log(`${i + 1}. Lesson ID: ${lesson.id}`);
    console.log(`   Learner ID: ${lesson.learner_id}`);
    console.log(`   Status: ${lesson.status}`);
    console.log(`   Payment Method: ${lesson.payment_method || 'NULL'}`);
    console.log(`   Payment Status: ${lesson.payment_status || 'NULL'}`);
    console.log(`   Price: £${lesson.price || 'NULL'}`);
    console.log(`   Scheduled: ${lesson.scheduled_time}`);
    console.log(`   Created: ${lesson.created_at}`);
    console.log(`   Booked At: ${lesson.booked_at || 'NULL'}\n`);
  });

  // Group by payment_method
  const byPaymentMethod = lessons.reduce((acc, lesson) => {
    const method = lesson.payment_method || 'NULL';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Breakdown by payment method:');
  Object.entries(byPaymentMethod).forEach(([method, count]) => {
    console.log(`   ${method}: ${count} lessons`);
  });

  // Check unique learner IDs
  const uniqueLearnerIds = [...new Set(lessons.map(l => l.learner_id))];
  console.log(`\n👥 ${uniqueLearnerIds.length} unique learner IDs`);

  // Check which learners exist
  for (const learnerId of uniqueLearnerIds.slice(0, 5)) {
    const { data: learner } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .eq('id', learnerId)
      .maybeSingle();

    if (learner) {
      console.log(`   ✅ ${learner.name} (${learnerId}) - parent: ${learner.parent_id}`);

      // Get parent info
      if (learner.parent_id) {
        const { data: parent } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', learner.parent_id)
          .single();

        if (parent) {
          console.log(`      Parent: ${parent.full_name} (${parent.email})`);
        }
      }
    } else {
      console.log(`   ❌ Learner ${learnerId} NOT FOUND in learners table`);
    }
  }
}
