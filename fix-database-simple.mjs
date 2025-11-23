import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('Attempting to query teacher_tier_stats view...');

// Try to query the view to see if it exists
const { data, error } = await supabase
  .from('teacher_tier_stats')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error querying teacher_tier_stats:', error);
  console.log('\nThe view does not exist or has errors.');
  console.log('Please use the Supabase dashboard SQL editor to run:');
  console.log('supabase/migrations/20251114170000_fix_missing_columns_and_views.sql');
} else {
  console.log('✓ teacher_tier_stats view exists and is queryable!');
  console.log(`Found ${data?.length || 0} teachers`);
}

// Check if phone column exists
console.log('\nChecking profiles table for phone column...');
const { data: profiles, error: profileError } = await supabase
  .from('profiles')
  .select('phone')
  .limit(1);

if (profileError) {
  console.error('Error checking phone column:', profileError);
  console.log('The phone column may not exist in profiles table.');
} else {
  console.log('✓ Phone column exists in profiles table!');
}
