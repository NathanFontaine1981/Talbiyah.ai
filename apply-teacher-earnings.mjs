import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = readFileSync('fix-teacher-earnings-only.sql', 'utf8');

console.log('📦 Creating teacher_earnings table...');

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
  // If exec_sql doesn't exist, try direct execution
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({ sql_query: sql })
  });

  if (!response.ok) {
    // Try using the query API directly
    console.log('Trying alternative method...');
    const queryResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.pgrst.object+json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: sql
    });

    return { data: await queryResponse.text(), error: queryResponse.ok ? null : await queryResponse.text() };
  }

  return { data: await response.json(), error: null };
});

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('✅ Success!');
console.log(data);
