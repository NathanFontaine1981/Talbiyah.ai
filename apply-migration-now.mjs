import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzE2MzY0NywiZXhwIjoyMDM4NzM5NjQ3fQ.x6P8lxSY9Hl5Q3q3X3yU2zxK3hx7jGqM0OOhv7KnCVE';

console.log('🚀 Starting migration application...\n');

async function executeSQLDirect(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({ query: sql })
  });

  return response;
}

async function applyMigration() {
  try {
    console.log('📖 Reading migration file...');
    const sql = readFileSync('./supabase/migrations/20251111000000_create_gamified_referral_system.sql', 'utf8');

    console.log('✅ Migration file loaded\n');
    console.log('🔧 Applying to production database...');
    console.log('   URL:', supabaseUrl);
    console.log('   Tables to create: referral_tiers, referral_achievements, user_achievements, referral_rewards_history');
    console.log('   Functions to create: calculate_user_tier, update_referral_stats, check_achievements');
    console.log('   Views to create: referral_leaderboard\n');

    // Try using PostgreSQL REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ Migration applied successfully via RPC!');
      const result = await response.json();
      console.log('Result:', result);
    } else {
      // Try alternative method using supabase-js client
      console.log('ℹ️  RPC method not available, trying alternative approach...\n');

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Execute key parts of the migration
      console.log('1️⃣  Creating referral_tiers table...');
      const { error: createError } = await supabase.rpc('query', {
        sql: `
          CREATE TABLE IF NOT EXISTS referral_tiers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tier_name TEXT NOT NULL UNIQUE,
            tier_level INTEGER NOT NULL UNIQUE,
            min_referrals INTEGER NOT NULL,
            max_referrals INTEGER,
            reward_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
            badge_icon TEXT,
            badge_color TEXT,
            tier_benefits JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError && !createError.message.includes('already exists')) {
        throw createError;
      }

      console.log('✅ Tables created (or already exist)');
      console.log('\n⚠️  Full migration needs to be applied via Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new');
      console.log('\n📋 Copy the entire contents of this file:');
      console.log('   supabase/migrations/20251111000000_create_gamified_referral_system.sql');
      console.log('\n🔧 Paste into SQL Editor and click "Run"');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📝 Manual application required:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Open: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new');
    console.log('2. Copy contents of: supabase/migrations/20251111000000_create_gamified_referral_system.sql');
    console.log('3. Paste and click "Run"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

applyMigration();
