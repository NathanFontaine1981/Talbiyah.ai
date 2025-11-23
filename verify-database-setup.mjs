import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySetup() {
  console.log('🔍 Verifying database setup...\n');

  // Test 1: Check if booked_at column exists
  console.log('1️⃣ Checking booked_at column...');
  const { data: columns, error: colError } = await supabase
    .from('lessons')
    .select('booked_at')
    .limit(1);

  if (colError && colError.message.includes('booked_at')) {
    console.log('   ❌ booked_at column does NOT exist');
  } else {
    console.log('   ✅ booked_at column exists');
  }

  // Test 2: Check if student_teacher_relationships table exists
  console.log('\n2️⃣ Checking student_teacher_relationships table...');
  const { data: strData, error: strError } = await supabase
    .from('student_teacher_relationships')
    .select('id')
    .limit(1);

  if (strError && strError.message.includes('does not exist')) {
    console.log('   ❌ student_teacher_relationships table does NOT exist');
    console.log('   ⚠️  You need to run fix-student-teacher-relationships.sql in Supabase SQL Editor');
  } else {
    console.log('   ✅ student_teacher_relationships table exists');
  }

  // Test 3: Check if get_student_teachers function exists
  console.log('\n3️⃣ Checking get_student_teachers function...');

  // Get a test learner ID
  const { data: learners } = await supabase
    .from('learners')
    .select('id')
    .limit(1);

  if (learners && learners.length > 0) {
    const { data: funcData, error: funcError } = await supabase
      .rpc('get_student_teachers', {
        p_student_id: learners[0].id
      });

    if (funcError && funcError.message.includes('Could not find')) {
      console.log('   ❌ get_student_teachers function does NOT exist');
      console.log('   ⚠️  You need to run fix-student-teacher-relationships.sql in Supabase SQL Editor');
    } else {
      console.log('   ✅ get_student_teachers function exists');
    }
  } else {
    console.log('   ⚠️  No learners found to test function');
  }

  // Test 4: Check user_credits
  console.log('\n4️⃣ Checking user credits...');
  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (creditsError) {
    console.log('   ❌ Error reading user_credits:', creditsError.message);
  } else if (!credits || credits.length === 0) {
    console.log('   ⚠️  No user credits found in database');
    console.log('   💡 Run: node add-8-credits-to-latest-user.mjs');
  } else {
    console.log('   ✅ User credits exist:', credits[0].credits_remaining, 'credits');
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📋 SUMMARY:');
  console.log('  Run fix-student-teacher-relationships.sql if you see ❌ above');
  console.log('  Then refresh browser and try booking with credits');
  console.log('\n' + '='.repeat(50));
}

verifySetup().catch(console.error);
