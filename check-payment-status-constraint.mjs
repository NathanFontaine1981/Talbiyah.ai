import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking payment_status constraint...\n');

// Try different payment_status values to see what's allowed
const testValues = ['paid', 'pending', 'completed', 'failed', 'refunded'];

console.log('Testing which payment_status values are allowed:\n');

// Get a recent lesson to test with
const { data: lessons } = await supabase
  .from('lessons')
  .select('id, payment_status')
  .limit(1);

if (lessons && lessons.length > 0) {
  console.log(`Testing with lesson ID: ${lessons[0].id}`);
  console.log(`Current payment_status: ${lessons[0].payment_status}\n`);
}

// Check the actual constraint in the schema
console.log('The constraint error suggests these columns exist:');
console.log('- payment_status (the one we\'re trying to update)');
console.log('- Another field at position showing "pending"');
console.log('\nThe error shows: ...paid, null, null, pending...');
console.log('This suggests payment_status might need to be "completed" instead of "paid"\n');

// Let's try to get one successful lesson
const { data: paidLessons } = await supabase
  .from('lessons')
  .select('id, payment_status, payment_method, status')
  .eq('status', 'completed')
  .limit(5);

if (paidLessons && paidLessons.length > 0) {
  console.log('✅ Found completed lessons with these payment_status values:');
  paidLessons.forEach(lesson => {
    console.log(`  - ${lesson.payment_status} (payment_method: ${lesson.payment_method})`);
  });
} else {
  console.log('No completed lessons found to check payment_status values');
}
