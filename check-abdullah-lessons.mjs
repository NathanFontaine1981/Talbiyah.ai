#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking Abdullah Abbas lessons...\n');

try {
  // Find Abdullah Abbas teacher profile
  const { data: teachers, error: teacherError } = await supabase
    .from('teacher_profiles')
    .select(`
      id,
      user_id,
      profiles!inner(full_name, email)
    `)
    .ilike('profiles.full_name', '%abdullah%abbas%');

  if (teacherError) throw teacherError;

  if (!teachers || teachers.length === 0) {
    console.log('❌ No teacher found matching "Abdullah Abbas"');
    process.exit(1);
  }

  console.log(`✅ Found ${teachers.length} teacher(s):`);
  teachers.forEach(t => {
    console.log(`   - ${t.profiles.full_name} (${t.profiles.email})`);
    console.log(`     Teacher ID: ${t.id}`);
  });
  console.log('');

  const teacherId = teachers[0].id;

  // Get all lessons for this teacher
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select(`
      id,
      scheduled_time,
      status,
      confirmation_status,
      confirmation_requested_at,
      learner_id,
      learners!inner(name),
      subjects(name)
    `)
    .eq('teacher_id', teacherId)
    .order('scheduled_time', { ascending: false});

  if (lessonsError) throw lessonsError;

  console.log(`📚 Total lessons for this teacher: ${lessons?.length || 0}\n`);

  if (lessons && lessons.length > 0) {
    // Separate by status
    const pending = lessons.filter(l => l.confirmation_status === 'pending');
    const acknowledged = lessons.filter(l => l.confirmation_status === 'acknowledged');
    const upcoming = lessons.filter(l => new Date(l.scheduled_time) >= new Date() && l.status === 'booked');
    const past = lessons.filter(l => new Date(l.scheduled_time) < new Date());

    console.log('📊 Lesson Status Summary:');
    console.log(`   Pending Acknowledgment: ${pending.length}`);
    console.log(`   Acknowledged: ${acknowledged.length}`);
    console.log(`   Upcoming: ${upcoming.length}`);
    console.log(`   Past: ${past.length}`);
    console.log('');

    if (pending.length > 0) {
      console.log('⏳ PENDING ACKNOWLEDGMENT:');
      pending.forEach((lesson, idx) => {
        const studentName = lesson.learners?.name || 'Unknown';
        const subject = lesson.subjects?.name || 'Unknown';
        const time = new Date(lesson.scheduled_time);
        const requestedAt = lesson.confirmation_requested_at ? new Date(lesson.confirmation_requested_at) : null;
        const hoursSinceRequest = requestedAt ? ((Date.now() - requestedAt.getTime()) / (1000 * 60 * 60)).toFixed(1) : 'N/A';

        console.log(`\n   ${idx + 1}. ${subject} with ${studentName}`);
        console.log(`      Learner ID: ${lesson.learner_id}`);
        console.log(`      Scheduled: ${time.toLocaleString()}`);
        console.log(`      Status: ${lesson.status}`);
        console.log(`      Confirmation Status: ${lesson.confirmation_status}`);
        console.log(`      Requested: ${requestedAt ? requestedAt.toLocaleString() : 'N/A'} (${hoursSinceRequest}h ago)`);
        console.log(`      Lesson ID: ${lesson.id}`);
      });
    } else {
      console.log('✅ No pending acknowledgments');
    }

    console.log('\n📅 All Upcoming Lessons:');
    if (upcoming.length > 0) {
      upcoming.forEach((lesson, idx) => {
        const studentName = lesson.learners?.name || 'Unknown';
        const subject = lesson.subjects?.name || 'Unknown';
        const time = new Date(lesson.scheduled_time);

        console.log(`   ${idx + 1}. ${subject} with ${studentName} - ${time.toLocaleString()}`);
        console.log(`      Status: ${lesson.status}, Confirmation: ${lesson.confirmation_status || 'null'}`);
      });
    } else {
      console.log('   No upcoming lessons');
    }
  }

  console.log('\n✅ Check complete!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
