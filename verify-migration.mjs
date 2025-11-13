import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzE2MzY0NywiZXhwIjoyMDM4NzM5NjQ3fQ.x6P8lxSY9Hl5Q3q3X3yU2zxK3hx7jGqM0OOhv7KnCVE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Verifying gamified referral system setup...\n');

async function verifySetup() {
  try {
    // Check referral_tiers
    console.log('1️⃣  Checking referral_tiers table...');
    const { data: tiers, error: tiersError } = await supabase
      .from('referral_tiers')
      .select('tier_name, tier_level, min_referrals, max_referrals, reward_multiplier, badge_icon')
      .order('tier_level');

    if (tiersError) {
      console.error('   ❌ Error:', tiersError.message);
    } else {
      console.log('   ✅ Found', tiers.length, 'tiers:');
      tiers.forEach(t => {
        console.log(`      ${t.badge_icon} ${t.tier_name} (${t.min_referrals}-${t.max_referrals || '∞'} refs, ${t.reward_multiplier}x)`);
      });
    }

    // Check referral_achievements
    console.log('\n2️⃣  Checking referral_achievements table...');
    const { data: achievements, error: achievementsError } = await supabase
      .from('referral_achievements')
      .select('achievement_name, achievement_type, requirement_value, credits_reward');

    if (achievementsError) {
      console.error('   ❌ Error:', achievementsError.message);
    } else {
      console.log('   ✅ Found', achievements.length, 'achievements:');
      achievements.forEach(a => {
        console.log(`      ${a.achievement_name} (${a.achievement_type}, £${a.credits_reward})`);
      });
    }

    // Check user_achievements
    console.log('\n3️⃣  Checking user_achievements table...');
    const { error: userAchError } = await supabase
      .from('user_achievements')
      .select('id')
      .limit(1);

    if (userAchError) {
      console.error('   ❌ Error:', userAchError.message);
    } else {
      console.log('   ✅ Table exists');
    }

    // Check referral_rewards_history
    console.log('\n4️⃣  Checking referral_rewards_history table...');
    const { error: historyError } = await supabase
      .from('referral_rewards_history')
      .select('id')
      .limit(1);

    if (historyError) {
      console.error('   ❌ Error:', historyError.message);
    } else {
      console.log('   ✅ Table exists');
    }

    // Check leaderboard view
    console.log('\n5️⃣  Checking referral_leaderboard view...');
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('referral_leaderboard')
      .select('*')
      .limit(5);

    if (leaderboardError) {
      console.error('   ❌ Error:', leaderboardError.message);
    } else {
      console.log('   ✅ View accessible');
      if (leaderboard.length > 0) {
        console.log('   📊 Current leaderboard:');
        leaderboard.forEach((entry, i) => {
          console.log(`      ${i + 1}. ${entry.full_name} - ${entry.total_referrals} referrals`);
        });
      } else {
        console.log('   📊 No referrals yet (expected for new setup)');
      }
    }

    console.log('\n✅ Migration verification complete!');
    console.log('\n🚀 Next step: Test the referral dashboard at http://localhost:5173/refer');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

verifySetup();
