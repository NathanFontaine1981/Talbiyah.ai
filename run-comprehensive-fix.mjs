import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://boyrjgivpepjiboekwuu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const sql = readFileSync('./comprehensive-fix.sql', 'utf8');

console.log('🔧 Applying comprehensive fix...');
console.log('');

// Split SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT');

console.log(`Found ${statements.length} SQL statements to execute\n`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';
  const preview = statement.substring(0, 80).replace(/\n/g, ' ') + '...';

  console.log(`${i + 1}/${statements.length}: ${preview}`);

  try {
    // Use the REST API to execute SQL through a stored procedure
    // Since we can't directly execute arbitrary SQL, we'll use fetch to the edge functions

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({})
    });

    // For now, let's just log what we would execute
    console.log('   ℹ️  Statement prepared (requires manual execution via SQL editor)\n');
    successCount++;

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    errorCount++;
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Summary:');
console.log(`  ✅ Prepared: ${successCount}`);
console.log(`  ❌ Errors: ${errorCount}`);
console.log('');
console.log('📋 Manual Step Required:');
console.log('   Please copy the SQL from comprehensive-fix.sql');
console.log('   and execute it in the Supabase SQL Editor.');
console.log('   URL: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new');
