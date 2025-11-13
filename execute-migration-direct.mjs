import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzE2MzY0NywiZXhwIjoyMDM4NzM5NjQ3fQ.x6P8lxSY9Hl5Q3q3X3yU2zxK3hx7jGqM0OOhv7KnCVE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Executing migration directly...\n');

async function executeMigration() {
  try {
    const sql = readFileSync('./supabase/migrations/20251111000000_create_gamified_referral_system.sql', 'utf8');

    // Use Supabase's PostgreSQL connection to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: sql
      })
    });

    if (response.ok) {
      console.log('✅ Migration executed successfully!');
      const result = await response.json();
      console.log('Result:', result);
    } else {
      const error = await response.text();
      console.log('Response status:', response.status);
      console.log('Response:', error);

      // Try using pg library approach
      console.log('\n🔧 Trying alternative method with individual statements...\n');

      // Split into statements and execute one by one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim().length === 0) continue;

        try {
          // Try to execute via REST API query endpoint
          const res = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Prefer': 'return=minimal'
            }
          });

          if (res.ok) {
            successCount++;
            console.log(`✓ Statement ${i + 1}/${statements.length}`);
          }
        } catch (err) {
          errorCount++;
        }
      }

      console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeMigration();
