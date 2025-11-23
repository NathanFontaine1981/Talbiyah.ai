import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use the teacher_id from the earlier error logs
const teacherId = 'dffab54a-d120-4044-9db6-e5d987b3d5d5';

console.log(`\n🔍 Checking setup for teacher ${teacherId}...\n`);

// 1. Check teacher profile
const { data: profile } = await supabase
  .from('teacher_profiles')
  .select('*')
  .eq('id', teacherId)
  .single();

console.log('1. Teacher Profile:');
console.log(`   Status: ${profile?.status}`);
console.log(`   Tier: ${profile?.current_tier || 'none'}\n`);

// 2. Check availability
const { data: availability } = await supabase
  .from('teacher_availability')
  .select('*')
  .eq('teacher_id', teacherId)
  .eq('is_available', true);

console.log(`2. Availability: ${availability?.length || 0} slots`);
if (availability && availability.length > 0) {
  availability.forEach(slot => {
    console.log(`   ${slot.day_of_week}: ${slot.start_time} - ${slot.end_time}`);
  });
} else {
  console.log('   ⚠️  NO AVAILABILITY SET - This is why you\'re not showing up!');
  console.log('   Creating default availability...\n');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (const day of days) {
    const { error } = await supabase
      .from('teacher_availability')
      .insert({
        teacher_id: teacherId,
        day_of_week: day,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true
      });

    if (!error) {
      console.log(`   ✅ Added ${day}`);
    }
  }
}

console.log('\n3. Teacher Tier Stats:');
const { data: tierStats } = await supabase
  .from('teacher_tier_stats')
  .select('*')
  .eq('teacher_id', teacherId)
  .single();

if (tierStats) {
  console.log(`   ✅ Tier: ${tierStats.tier_name} ${tierStats.tier_icon}`);
  console.log(`   Hours taught: ${tierStats.hours_taught}`);
  console.log(`   Completed lessons: ${tierStats.completed_lessons}`);
} else {
  console.log('   ⚠️  No tier stats - view might be broken');
}

console.log('\n4. Teacher Rating Summary:');
const { data: rating } = await supabase
  .from('teacher_rating_summary')
  .select('*')
  .eq('teacher_id', teacherId)
  .single();

if (rating) {
  console.log(`   ✅ Average rating: ${rating.avg_rating}`);
} else {
  console.log('   ⚠️  No rating summary - view might be missing');
}

console.log('\n✅ Setup check complete!\n');
