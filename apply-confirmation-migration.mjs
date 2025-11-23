#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Applying lesson confirmation system migration...\n');

// Read the migration file
const migrationSQL = readFileSync('./supabase/migrations/20251117190000_add_lesson_confirmation_system.sql', 'utf8');

try {
  // Execute the migration via RPC
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: migrationSQL
  });

  if (error) {
    console.error('❌ Error applying migration:', error);

    // Try alternative: Split into smaller chunks and execute one by one
    console.log('\n⚠️  Trying alternative method: executing statements individually...\n');

    // Split SQL into statements (basic split on semicolons)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });

      if (stmtError) {
        console.error(`❌ Error on statement ${i + 1}:`, stmtError.message);
        // Continue anyway to apply as much as possible
      } else {
        console.log(`✅ Statement ${i + 1} applied successfully`);
      }
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }

  console.log('\n📋 Verifying columns were added...');

  // Verify the columns exist
  const { data: columns, error: colError } = await supabase
    .from('lessons')
    .select('id, confirmation_status, teacher_acknowledgment_message')
    .limit(1);

  if (colError) {
    console.error('❌ Verification failed:', colError.message);
    console.log('\n⚠️  Migration may not have been fully applied. You may need to apply it manually through the Supabase dashboard.');
  } else {
    console.log('✅ Columns verified! Confirmation system is ready.');
  }

} catch (error) {
  console.error('❌ Unexpected error:', error.message);
}

console.log('\n✨ Done!');
