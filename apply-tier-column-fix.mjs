#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔧 Applying current_tier column fix...\n');

try {
  // Read the migration file
  const sql = readFileSync('./supabase/migrations/20251117170000_add_current_tier_to_teacher_profiles.sql', 'utf8');

  // Execute the migration using raw SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Migration failed:', error.message);

    // Try alternative approach - execute via REST API
    console.log('\n📝 Trying alternative approach - executing statements individually...\n');

    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (!statement) continue;

      console.log('Executing:', statement.substring(0, 60) + '...');

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: statement + ';' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed: ${errorText}`);
      } else {
        console.log('✅ Success');
      }
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }

  // Verify the column exists
  console.log('\n🔍 Verifying column existence...');
  const { data: columns, error: colError } = await supabase
    .from('teacher_profiles')
    .select('current_tier, tier_assigned_at')
    .limit(1);

  if (colError) {
    console.error('❌ Verification failed:', colError.message);
  } else {
    console.log('✅ Column verification successful!');
  }

  // Test the view
  console.log('\n🔍 Testing teacher_tier_stats view...');
  const { data: viewData, error: viewError } = await supabase
    .from('teacher_tier_stats')
    .select('tier, tier_name, tier_icon')
    .limit(1);

  if (viewError) {
    console.error('❌ View test failed:', viewError.message);
  } else {
    console.log('✅ View is working!');
    if (viewData && viewData.length > 0) {
      console.log('   Sample data:', viewData[0]);
    }
  }

  console.log('\n✨ Fix complete! Please refresh your browser to see the tier information.');

} catch (error) {
  console.error('❌ Unexpected error:', error);
}
