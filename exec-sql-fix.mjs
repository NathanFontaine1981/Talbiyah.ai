import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.boyrjgivpepjiboekwuu',
  password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.IXUBhFJDOT5GXE33sP3Mg-fwDDOsEApCqC0IWIWQiIY',
  ssl: { rejectUnauthorized: false }
});

async function runFix() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    const sql = fs.readFileSync('./supabase/migrations/20251117200000_fix_lesson_confirmation_functions.sql', 'utf8');

    console.log('🔧 Executing SQL fix...');
    await client.query(sql);
    console.log('✅ Functions updated successfully!\n');

    // Test the function
    console.log('🔍 Testing get_teacher_pending_lessons...');
    const result = await client.query(
      'SELECT * FROM get_teacher_pending_lessons($1)',
      ['dffab54a-d120-4044-9db6-e5d987b3d5d5']
    );
    console.log(`✅ Function working! Found ${result.rows.length} pending lessons\n`);

    console.log('✅ All done! The lesson confirmation functions are fixed.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runFix();
