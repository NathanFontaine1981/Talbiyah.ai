#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking teacher_tier_stats view...\n');

try {
  const { data, error } = await supabase
    .from('teacher_tier_stats')
    .select('*');

  if (error) {
    console.error('❌ Error querying teacher_tier_stats:', error);
    throw error;
  }

  console.log(`✅ Found ${data?.length || 0} teachers in teacher_tier_stats view\n`);

  if (data && data.length > 0) {
    data.forEach(teacher => {
      console.log(`👤 Teacher ID: ${teacher.teacher_id}`);
      console.log(`   Tier: ${teacher.tier} (${teacher.tier_name})`);
      console.log(`   Hours Taught: ${teacher.hours_taught || 0}`);
      console.log(`   Completed Lessons: ${teacher.completed_lessons || 0}`);
      console.log(`   Rate: $${teacher.teacher_hourly_rate}/hr`);
      console.log('');
    });
  }

  // Check specifically for Abdullah
  const abdullah = data?.find(t => t.teacher_id === 'dffab54a-d120-4044-9db6-e5d987b3d5d5');

  if (abdullah) {
    console.log('✅ Abdullah Abbass IS in teacher_tier_stats');
  } else {
    console.log('❌ Abdullah Abbass is NOT in teacher_tier_stats view');
    console.log('   This is why he\'s not showing in Find Teachers!');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
