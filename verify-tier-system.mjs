#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTierSystem() {
  console.log('🔍 Verifying Teacher Tier System Setup...\n');

  try {
    // 1. Check teacher_tiers table
    console.log('1️⃣ Checking teacher_tiers table...');
    const { data: tiers, error: tiersError } = await supabase
      .from('teacher_tiers')
      .select('tier, tier_name, tier_level, teacher_hourly_rate')
      .order('tier_level');

    if (tiersError) {
      console.error('❌ Error fetching tiers:', tiersError);
    } else {
      console.log(`✅ Found ${tiers.length} tiers:`);
      tiers.forEach(t => console.log(`   ${t.tier_level}. ${t.tier_name} - £${t.teacher_hourly_rate}/hr`));
    }
    console.log();

    // 2. Check if teacher_tier_stats view exists
    console.log('2️⃣ Checking teacher_tier_stats view...');
    const { data: viewData, error: viewError } = await supabase
      .from('teacher_tier_stats')
      .select('teacher_profile_id, tier, tier_name, tier_icon, teacher_hourly_rate')
      .limit(1);

    if (viewError) {
      console.error('❌ Error querying view:', viewError.message);
      console.error('   Code:', viewError.code);
      console.error('   Details:', viewError.details);
    } else {
      console.log('✅ View exists and is queryable');
      if (viewData && viewData.length > 0) {
        console.log('   Sample:', viewData[0]);
      }
    }
    console.log();

    // 3. Check approved teachers
    console.log('3️⃣ Checking approved teachers...');
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select('id, current_tier, tier_assigned_at, approval_status')
      .eq('approval_status', 'approved')
      .limit(5);

    if (teachersError) {
      console.error('❌ Error fetching teachers:', teachersError);
    } else {
      console.log(`✅ Found ${teachers.length} approved teachers (showing first 5)`);
      teachers.forEach(t => {
        console.log(`   ID: ${t.id.substring(0, 8)}... Tier: ${t.current_tier || 'NULL'}`);
      });
    }
    console.log();

    // 4. Check if teachers appear in the view
    console.log('4️⃣ Checking if teachers appear in tier stats view...');
    const { data: statsData, error: statsError } = await supabase
      .from('teacher_tier_stats')
      .select('teacher_profile_id, teacher_name, tier, tier_name, hours_taught, total_students');

    if (statsError) {
      console.error('❌ Error:', statsError.message);
    } else {
      console.log(`✅ Found ${statsData.length} teachers in view`);
      statsData.slice(0, 3).forEach(t => {
        console.log(`   ${t.teacher_name || 'Unnamed'}: ${t.tier_name} (${t.hours_taught}h taught, ${t.total_students} students)`);
      });
    }
    console.log();

    // 5. Check column existence
    console.log('5️⃣ Checking teacher_profiles columns...');
    const { data: columnsCheck } = await supabase
      .from('teacher_profiles')
      .select('current_tier, tier_assigned_at, hours_taught, average_rating')
      .limit(1);

    if (columnsCheck !== null) {
      console.log('✅ All tier columns exist in teacher_profiles');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }

  console.log('\n✨ Verification complete!');
}

verifyTierSystem();
