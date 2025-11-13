import { readFileSync } from 'fs';

const PROJECT_REF = 'boyrjgivpepjiboekwuu';
const ACCESS_TOKEN = 'sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff';

console.log('📋 Reading migration file...');
const sql = readFileSync('supabase/migrations/20251112140000_add_payment_logging.sql', 'utf-8');

console.log('🚀 Applying payment logging migration via Supabase API...\n');

const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: sql
  })
});

if (response.ok) {
  const result = await response.json();
  console.log('✅ Migration applied successfully!');
  console.log(result);
} else {
  const error = await response.text();
  console.error('❌ Migration failed:');
  console.error(error);
  process.exit(1);
}
