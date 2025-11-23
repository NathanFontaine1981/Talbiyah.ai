#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking teacher availability...\n');

try {
  // Get all approved teachers
  const { data: teachers, error: teacherError } = await supabase
    .from('teacher_profiles')
    .select(`
      id,
      user_id,
      status,
      profiles!teacher_profiles_user_id_fkey(full_name, email)
    `)
    .eq('status', 'approved');

  if (teacherError) throw teacherError;

  console.log(`✅ Found ${teachers?.length || 0} approved teachers\n`);

  if (teachers && teachers.length > 0) {
    for (const teacher of teachers) {
      const name = teacher.profiles?.full_name || 'Unknown';
      const email = teacher.profiles?.email || 'N/A';

      console.log(`👤 ${name} (${email})`);
      console.log(`   Teacher ID: ${teacher.id}`);

      // Check availability
      const { data: availability, error: availError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacher.id);

      if (availError) {
        console.log(`   ❌ Error checking availability:`, availError.message);
      } else if (!availability || availability.length === 0) {
        console.log(`   ⚠️  NO AVAILABILITY SET - Will not show in Find Teachers`);
      } else {
        const availableSlots = availability.filter(a => a.is_available);
        console.log(`   ✅ Has ${availability.length} time slots (${availableSlots.length} available)`);

        if (availableSlots.length === 0) {
          console.log(`   ⚠️  All slots marked as unavailable - Will not show in Find Teachers`);
        }
      }
      console.log('');
    }
  }

  // Show summary
  console.log('\n📊 Summary:');
  const { data: withAvailability } = await supabase
    .from('teacher_availability')
    .select('teacher_id')
    .eq('is_available', true);

  const teachersInFindTeachers = new Set(withAvailability?.map(a => a.teacher_id) || []);

  console.log(`Teachers visible in "Find Teachers": ${teachersInFindTeachers.size}/${teachers?.length || 0}`);

  if (teachersInFindTeachers.size < (teachers?.length || 0)) {
    console.log('\n⚠️  Some teachers are not visible because they have no availability set!');
    console.log('Teachers need to:');
    console.log('1. Go to Teacher Account → My Availability');
    console.log('2. Set at least one time slot with is_available = true');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
