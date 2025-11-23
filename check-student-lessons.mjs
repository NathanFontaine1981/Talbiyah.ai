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

  // Get learners
  const { data: learners, error: learnerError } = await supabase
    .from('learners')
    .select('id, name, parent_id')
    .eq('parent_id', user.id);

  if (learnerError) throw learnerError;

  console.log('👥 Learners:', learners?.length || 0);
  if (learners && learners.length > 0) {
    learners.forEach(l => {
      console.log(`   - ${l.name} (ID: ${l.id})`);
    });
  } else {
    console.log('   ❌ No learners found for this user');
    process.exit(1);
  }
  console.log('');

  // Check each learner's lessons
  for (const learner of learners) {
    console.log(`📚 Checking lessons for learner: ${learner.name}`);
    console.log('');

    // All lessons
    const { data: allLessons, error: allError } = await supabase
      .from('lessons')
      .select(`
        id,
        scheduled_time,
        status,
        confirmation_status,
        teacher_profiles!inner(profiles!inner(full_name)),
        subjects(name)
      `)
      .eq('learner_id', learner.id)
      .order('scheduled_time', { ascending: false });

    if (allError) {
      console.error('   Error fetching lessons:', allError);
      continue;
    }

    console.log(`   Total lessons: ${allLessons?.length || 0}`);
    console.log('');

    if (allLessons && allLessons.length > 0) {
      console.log('   All Lessons:');
      allLessons.forEach((lesson, idx) => {
        const teacher = lesson.teacher_profiles?.profiles?.full_name || 'Unknown';
        const subject = lesson.subjects?.name || 'Unknown';
        const time = new Date(lesson.scheduled_time);
        const isPast = time < new Date();

        console.log(`   ${idx + 1}. ${subject} with ${teacher}`);
        console.log(`      Time: ${time.toLocaleString()}`);
        console.log(`      Status: ${lesson.status}`);
        console.log(`      Confirmation: ${lesson.confirmation_status || 'N/A'}`);
        console.log(`      ${isPast ? '⏰ PAST' : '⏰ UPCOMING'}`);
        console.log('');
      });

      // Upcoming only
      const upcomingLessons = allLessons.filter(l =>
        new Date(l.scheduled_time) >= new Date() && l.status === 'booked'
      );

      console.log(`   📅 Upcoming Lessons (status=booked, future): ${upcomingLessons.length}`);
      if (upcomingLessons.length > 0) {
        upcomingLessons.forEach((lesson, idx) => {
          const teacher = lesson.teacher_profiles?.profiles?.full_name || 'Unknown';
          const subject = lesson.subjects?.name || 'Unknown';
          console.log(`   ${idx + 1}. ${subject} with ${teacher} - ${new Date(lesson.scheduled_time).toLocaleString()}`);
        });
      }
    } else {
      console.log('   ❌ No lessons found for this learner');
    }
    console.log('');
  }

  console.log('✅ Check complete!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
