import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlibFa3d1VSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzA3NDk0NjksImV4cCI6MjA0NjMyNTQ2OX0.a4VgXoWJNQ5_nB_DklKlGH0AxAdcm6e7Lv_1lZyQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filePath, migrationName) {
  console.log(`\n📝 Applying ${migrationName}...`);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Error applying ${migrationName}:`, error);
      return false;
    }

    console.log(`✅ ${migrationName} applied successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Exception applying ${migrationName}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Admin Dashboard Migrations...\n');

  const migrations = [
    {
      file: 'supabase/migrations/20251108120000_create_group_sessions_tables.sql',
      name: 'Group Sessions Tables'
    },
    {
      file: 'supabase/migrations/20251108130000_create_lesson_recordings_table.sql',
      name: 'Lesson Recordings Table'
    },
    {
      file: 'supabase/migrations/20251108140000_create_bookings_table.sql',
      name: 'Bookings Table'
    }
  ];

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await executeSQLFile(migration.file, migration.name);
    if (!success) {
      allSuccess = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allSuccess) {
    console.log('✨ All migrations applied successfully!');
  } else {
    console.log('⚠️  Some migrations failed. Check errors above.');
  }
  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
