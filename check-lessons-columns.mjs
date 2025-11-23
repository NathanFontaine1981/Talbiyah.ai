import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking lessons table structure...\n');

// Try to get all columns by selecting *
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Error:', error.message);
} else {
  console.log('✅ Lessons table columns:');
  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    columns.sort().forEach(col => {
      console.log(`   - ${col}`);
    });
    console.log(`\n📊 Total columns: ${columns.length}`);

    // Check for specific columns
    console.log('\n🔎 Checking critical columns:');
    const criticalCols = ['price', 'payment_method', 'payment_status', 'is_trial', 'booked_at'];
    criticalCols.forEach(col => {
      if (columns.includes(col)) {
        console.log(`   ✅ ${col}`);
      } else {
        console.log(`   ❌ ${col} - MISSING!`);
      }
    });
  } else {
    console.log('   ⚠️  No lessons found in table (empty table)');
    console.log('   Cannot determine column structure from empty table');
    console.log('   Let me query information_schema instead...');

    // Query information_schema
    const { data: schemaData, error: schemaError } = await supabase.rpc('sql', {
      query: `SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name = 'lessons'
              ORDER BY column_name`
    });

    if (schemaError) {
      console.log('   ⚠️  Could not query information_schema');
    }
  }
}
