import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  try {
    const sql = readFileSync(filePath, 'utf-8');
    console.log(`Executing SQL from ${filePath}...`);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`Error executing ${filePath}:`, error);
      return false;
    }

    console.log(`✓ Successfully executed ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error reading/executing ${filePath}:`, err);
    return false;
  }
}

// Apply the quick fix migration
console.log('Applying database fixes...\n');

const result = await executeSQLFile('supabase/migrations/20251114170000_fix_missing_columns_and_views.sql');

if (result) {
  console.log('\n✓ Database fixes applied successfully!');
  console.log('  - Added phone column to profiles');
  console.log('  - Created teacher_tier_stats view');
} else {
  console.log('\n✗ Failed to apply database fixes');
  process.exit(1);
}
