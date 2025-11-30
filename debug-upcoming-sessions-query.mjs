import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Debugging why lesson doesnt show in UpcomingSessionsCard...\n');

const learnerId = '155a8a18-4793-45d4-aa98-4565eb231433';

// Test the exact query that UpcomingSessionsCard uses
console.log('Testing UpcomingSessionsCard query...\n');

const { data: lessonsData, error } = await supabase
  .from('lessons')
  .select(`
    id,
    scheduled_time,
    duration_minutes,
    status,
    teacher_id,
    subject_id,
    "100ms_room_id",
    confirmation_status,
    teacher_acknowledgment_message,
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
  .eq('learner_id', learnerId)
  .eq('status', 'booked')
  .order('scheduled_time', { ascending: true });

if (error) {
  console.error('❌ Query error:', error);
  process.exit(1);
}

console.log(`Found ${lessonsData?.length || 0} lessons\n`);

if (lessonsData && lessonsData.length > 0) {
  lessonsData.forEach((lesson, i) => {
    console.log(`Lesson ${i + 1}:`);
    console.log('  ID:', lesson.id);
    console.log('  Scheduled:', lesson.scheduled_time);
    console.log('  Status:', lesson.status);
    console.log('  Teacher:', lesson.teacher_profiles?.profiles?.full_name);
    console.log('  Subject:', lesson.subjects?.name);
    console.log('  Room ID:', lesson['100ms_room_id']);
    console.log('  Confirmation:', lesson.confirmation_status);
    console.log('');
  });
} else {
  console.log('⚠️  No lessons found. Checking why...\n');

  // Check basic query without joins
  const { data: basicLessons } = await supabase
    .from('lessons')
    .select('id, status, teacher_id, subject_id')
    .eq('learner_id', learnerId)
    .eq('status', 'booked');

  console.log('Lessons without INNER joins:', basicLessons?.length || 0);

  if (basicLessons && basicLessons.length > 0) {
    console.log('✓ Lesson exists in database');
    console.log('  Teacher ID:', basicLessons[0].teacher_id);
    console.log('  Subject ID:', basicLessons[0].subject_id);

    // Check if teacher_profile exists
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('id, user_id')
      .eq('id', basicLessons[0].teacher_id)
      .single();

    if (teacherProfile) {
      console.log('  ✓ Teacher profile exists');

      // Check if teacher's user profile exists
      const { data: teacherUserProfile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', teacherProfile.user_id)
        .single();

      if (teacherUserProfile) {
        console.log('  ✓ Teacher user profile exists:', teacherUserProfile.full_name);
      } else {
        console.log('  ✗ Teacher user profile MISSING');
      }
    } else {
      console.log('  ✗ Teacher profile MISSING');
    }

    // Check if subject exists
    const { data: subject } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', basicLessons[0].subject_id)
      .single();

    if (subject) {
      console.log('  ✓ Subject exists:', subject.name);
    } else {
      console.log('  ✗ Subject MISSING');
    }
  } else {
    console.log('✗ No lessons found even without joins');
  }
}

console.log('\n✅ Done');
