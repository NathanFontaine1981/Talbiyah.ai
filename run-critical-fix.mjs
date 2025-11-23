import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runFix() {
  console.log('🔧 Running critical database fixes...\n');

  // Read the SQL file
  const fs = await import('fs');
  const sql = fs.readFileSync('fix-critical-booking-errors.sql', 'utf8');

  console.log('📝 SQL to execute:');
  console.log(sql);
  console.log('\n');

  console.log('⚠️  IMPORTANT: You need to run this SQL in the Supabase Dashboard SQL Editor');
  console.log('   1. Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new');
  console.log('   2. Copy the SQL from fix-critical-booking-errors.sql');
  console.log('   3. Paste it into the SQL Editor');
  console.log('   4. Click "Run"');
  console.log('\n');
  console.log('✅ Once that\'s done, the credit booking will work!');
}

runFix().catch(console.error);
