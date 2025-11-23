import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTeacherVisibility() {
  const email = 'nathanlfontaine@gmail.com';

  console.log(`\n🔍 Setting up teacher visibility for ${email}...\n`);

  // 1. Get user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found');
    return;
  }

  console.log(`✅ Found user: ${user.id}`);

  // 2. Get teacher profile
  const { data: teacherProfile, error: profileError } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.error('❌ No teacher profile found:', profileError.message);
    return;
  }

  console.log(`✅ Found teacher profile: ${teacherProfile.id}`);
  console.log(`   Status: ${teacherProfile.status}`);
  console.log(`   Current tier: ${teacherProfile.current_tier || 'none'}`);

  // 3. Ensure teacher is approved
  if (teacherProfile.status !== 'approved') {
    console.log('📝 Updating teacher status to approved...');
    const { error: updateError } = await supabase
      .from('teacher_profiles')
      .update({ status: 'approved' })
      .eq('id', teacherProfile.id);

    if (updateError) {
      console.error('❌ Failed to update status:', updateError.message);
    } else {
      console.log('✅ Teacher approved');
    }
  } else {
    console.log('✅ Teacher already approved');
  }

  // 4. Check teacher_tier_stats view
  const { data: tierStats, error: tierError } = await supabase
    .from('teacher_tier_stats')
    .select('*')
    .eq('teacher_id', teacherProfile.id)
    .single();

  if (tierError) {
    console.log('⚠️  No tier stats found:', tierError.message);
  } else {
    console.log(`✅ Tier stats exist:`);
    console.log(`   Tier: ${tierStats.tier_name} ${tierStats.tier_icon}`);
    console.log(`   Hours taught: ${tierStats.hours_taught}`);
    console.log(`   Average rating: ${tierStats.average_rating}`);
  }

  // 5. Check teacher availability
  const { data: availability, error: availError } = await supabase
    .from('teacher_availability')
    .select('*')
    .eq('teacher_id', teacherProfile.id)
    .eq('is_available', true);

  if (!availability || availability.length === 0) {
    console.log('\n⚠️  No availability found. Creating default availability...');

    // Create availability for all days, 9 AM to 5 PM
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (const day of days) {
      const { error: insertError } = await supabase
        .from('teacher_availability')
        .insert({
          teacher_id: teacherProfile.id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00',
          is_available: true
        });

      if (insertError) {
        console.error(`   ❌ Failed to add ${day}:`, insertError.message);
      } else {
        console.log(`   ✅ Added availability for ${day}`);
      }
    }
  } else {
    console.log(`✅ Found ${availability.length} availability slots`);
    availability.forEach(slot => {
      console.log(`   ${slot.day_of_week}: ${slot.start_time} - ${slot.end_time}`);
    });
  }

  // 6. Check rating summary
  const { data: ratingSummary, error: ratingError } = await supabase
    .from('teacher_rating_summary')
    .select('*')
    .eq('teacher_id', teacherProfile.id)
    .single();

  if (ratingError) {
    console.log('⚠️  No rating summary found:', ratingError.message);
    console.log('   This is normal for new teachers - the view might be missing');
  } else {
    console.log(`✅ Rating summary exists:`);
    console.log(`   Average rating: ${ratingSummary.avg_rating}`);
    console.log(`   Total ratings: ${ratingSummary.total_detailed_ratings}`);
  }

  console.log('\n🎉 Setup complete! Teacher should now be visible in Find a Teacher page.\n');
}

setupTeacherVisibility().catch(console.error);
