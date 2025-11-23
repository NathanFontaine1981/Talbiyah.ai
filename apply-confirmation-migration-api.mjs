#!/usr/bin/env node
import { readFileSync } from 'fs';

const SUPABASE_PROJECT_REF = 'boyrjgivpepjiboekwuu';
const SUPABASE_ACCESS_TOKEN = 'sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff';

console.log('🚀 Applying lesson confirmation system migration via API...\n');

// Read the migration file
const migrationSQL = readFileSync('./supabase/migrations/20251117190000_add_lesson_confirmation_system.sql', 'utf8');

try {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Error applying migration:', result);
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  console.log('✅ Migration applied successfully!');
  console.log('Response:', result);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📝 You can manually apply the migration by:');
  console.log('1. Going to https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new');
  console.log('2. Copying the contents of: supabase/migrations/20251117190000_add_lesson_confirmation_system.sql');
  console.log('3. Running it in the SQL editor');
}

console.log('\n✨ Done!');
