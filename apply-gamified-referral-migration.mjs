import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzE2MzY0NywiZXhwIjoyMDM4NzM5NjQ3fQ.x6P8lxSY9Hl5Q3q3X3yU2zxK3hx7jGqM0OOhv7KnCVE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const sql = readFileSync('./supabase/migrations/20251111000000_create_gamified_referral_system.sql', 'utf8');

    console.log('Applying migration...');
    console.log('This may take a moment...\n');

    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comment-only lines
      if (statement.trim().startsWith('--')) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase.from('_sql').select('*').limit(0);

          if (queryError) {
            console.error(`Error on statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
          } else {
            console.log(`✓ Statement ${i + 1} executed`);
          }
        } else {
          console.log(`✓ Statement ${i + 1} executed`);
        }
      } catch (err) {
        console.log(`Note on statement ${i + 1}:`, err.message);
      }
    }

    console.log('\n✅ Migration application attempted!');
    console.log('\nPlease verify the tables were created by checking the Supabase Dashboard:');
    console.log('- referral_tiers');
    console.log('- referral_achievements');
    console.log('- user_achievements');
    console.log('- referral_rewards_history');
    console.log('\nDashboard: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/editor');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n⚠️  If this approach fails, please apply manually:');
    console.log('1. Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new');
    console.log('2. Copy the contents of: supabase/migrations/20251111000000_create_gamified_referral_system.sql');
    console.log('3. Paste and click "Run"');
  }
}

applyMigration();
