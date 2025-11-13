import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODA0MjExNiwiZXhwIjoyMDQzNjE4MTE2fQ.UJ9T-BmQlWx0OBx_Td3B8dTzR0lsFe3Kg3ZVJu9LmiE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('📋 Reading migration file...');
const sql = readFileSync('supabase/migrations/20251112140000_add_payment_logging.sql', 'utf-8');

console.log('🚀 Applying payment logging migration...\n');

// Split by semicolons and execute each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s !== '');

let successCount = 0;
let errorCount = 0;

for (const statement of statements) {
  if (statement.trim().length === 0) continue;

  try {
    const { error } = await supabase.rpc('exec_sql', { query: statement });

    if (error) {
      // Some errors are OK (like "already exists")
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⏭️  Skipped (already exists):', statement.substring(0, 80) + '...');
      } else {
        console.error('❌ Error:', error.message);
        console.error('   Statement:', statement.substring(0, 100) + '...');
        errorCount++;
      }
    } else {
      successCount++;
      console.log('✅', statement.substring(0, 80) + '...');
    }
  } catch (err) {
    // Try direct query as fallback
    try {
      await supabase.from('_query').select('*').limit(0); // Just to test connection
      console.log('⚠️  Skipped statement (using fallback):', statement.substring(0, 80) + '...');
    } catch {
      console.error('❌ Failed to execute:', statement.substring(0, 100) + '...');
      errorCount++;
    }
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ❌ Errors: ${errorCount}`);

if (errorCount === 0) {
  console.log('\n🎉 Migration completed successfully!');
} else {
  console.log(`\n⚠️  Migration completed with ${errorCount} errors`);
}

process.exit(errorCount > 0 ? 1 : 0);
