#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseKey);

const email = 'nathanlfontaine@gmail.com';

console.log('🔍 Checking lessons for:', email);
console.log('');

try {
  // Get user
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', email);

  if (userError) throw userError;

  if (!users || users.length === 0) {
    console.log('❌ No user found with that email');
    process.exit(1);
  }

  const user = users[0];
  console.log('✅ User found:');
  console.log('   ID:', user.id);
  console.log('   Name:', user.full_name);
  console.log('');

  // Check if user IS a learner
  const { data: directLearner, error: directLearnerError } = await supabase
    .from('learners')
    .select('id, name, parent_id, user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (directLearnerError) {
    console.log('⚠️  Error checking if user is learner:', directLearnerError.message);
  }

  console.log('👤 User as direct learner:', directLearner ? `✅ ${directLearner.name} (ID: ${directLearner.id})` : '❌ Not a learner');
  console.log('');

  // Get learners where user is parent
  const { data: learners, error: learnerError } = await supabase
    .from('learners')
    .select('id, name, parent_id, user_id')
    .eq('parent_id', user.id);

  if (learnerError) throw learnerError;

  console.log('👥 Learners (as parent):', learners?.length || 0);
  if (learners && learners.length > 0) {
    learners.forEach(l => {
      console.log(`   - ${l.name} (ID: ${l.id})`);
    });
  }
  console.log('');

  // Collect all learner IDs
  const allLearnerIds = [];
  if (directLearner) allLearnerIds.push(directLearner.id);
  if (learners && learners.length > 0) {
    allLearnerIds.push(...learners.map(l => l.id));
  }

  if (allLearnerIds.length === 0) {
    console.log('❌ No learner profiles found for this user');
    process.exit(1);
  }

  console.log('📚 Checking lessons for learner IDs:', allLearnerIds);
  console.log('');

  // Get all lessons for all learner IDs
  const { data: allLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select(`
      id,
      scheduled_time,
      status,
      confirmation_status,
      learner_id,
      teacher_id,
      subject_id,
      learners!inner(name),
      teacher_profiles!inner(profiles!inner(full_name)),
      subjects(name)
    `)
    .in('learner_id', allLearnerIds)
    .order('scheduled_time', { ascending: false });

  if (lessonsError) {
    console.error('❌ Error fetching lessons:', lessonsError);
    process.exit(1);
  }

  console.log(`📊 Total lessons found: ${allLessons?.length || 0}`);
  console.log('');

  if (allLessons && allLessons.length > 0) {
    const now = new Date();
    const upcoming = allLessons.filter(l => new Date(l.scheduled_time) >= now && l.status === 'booked');
    const past = allLessons.filter(l => new Date(l.scheduled_time) < now);

    console.log(`⏰ Upcoming lessons (booked, future): ${upcoming.length}`);
    console.log(`📅 Past lessons: ${past.length}`);
    console.log('');

    console.log('All Lessons:');
    allLessons.forEach((lesson, idx) => {
      const teacher = lesson.teacher_profiles?.profiles?.full_name || 'Unknown';
      const subject = lesson.subjects?.name || 'Unknown';
      const learner = lesson.learners?.name || 'Unknown';
      const time = new Date(lesson.scheduled_time);
      const isPast = time < now;

      console.log(`${idx + 1}. ${isPast ? '📅 PAST' : '⏰ UPCOMING'} - ${subject} with ${teacher}`);
      console.log(`   Learner: ${learner}`);
      console.log(`   Time: ${time.toLocaleString()}`);
      console.log(`   Status: ${lesson.status}`);
      console.log(`   Confirmation: ${lesson.confirmation_status || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('❌ No lessons found');
  }

  console.log('✅ Check complete!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
