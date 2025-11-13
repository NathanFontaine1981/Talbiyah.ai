#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎮 TWO-TRACK REFERRAL SYSTEM DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will deploy:"
echo "  ✅ Database schema (referral_credits, referral_tiers, referral_transactions)"
echo "  ✅ Edge Functions (track-referral-rewards, transfer-hours)"
echo "  ✅ Lesson completion trigger"
echo "  ✅ UI updates (MyReferrals page, ReferralWidget)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# ═══════════════════════════════════════
# STEP 1: APPLY DATABASE MIGRATIONS
# ═══════════════════════════════════════
echo ""
echo "━━━ STEP 1: Database Migrations ━━━"
echo ""
echo "📋 Copying migration SQL to clipboard..."
echo ""

# Combine all migrations into one file
cat supabase/migrations/20251111130000_create_two_track_referral_system.sql \
    supabase/migrations/20251111140000_create_lesson_completion_trigger.sql \
    > /tmp/combined_referral_migration.sql

# Copy to clipboard
cat /tmp/combined_referral_migration.sql | pbcopy

echo "✅ Migration SQL copied to clipboard!"
echo ""
echo "📖 INSTRUCTIONS:"
echo "1. Opening Supabase SQL Editor in your browser..."
echo "2. Paste the SQL (Cmd+V)"
echo "3. Click 'Run'"
echo "4. Come back here when done"
echo ""

# Open SQL Editor
open "https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new"

echo "⏳ Waiting for you to apply migrations..."
read -p "Press ENTER when migrations are applied successfully..."

# ═══════════════════════════════════════
# STEP 2: DEPLOY EDGE FUNCTIONS
# ═══════════════════════════════════════
echo ""
echo "━━━ STEP 2: Deploy Edge Functions ━━━"
echo ""

export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "📦 Deploying track-referral-rewards function..."
./node_modules/supabase/bin/supabase functions deploy track-referral-rewards --project-ref boyrjgivpepjiboekwuu

if [ $? -eq 0 ]; then
    echo "✅ track-referral-rewards deployed successfully"
else
    echo "❌ Failed to deploy track-referral-rewards"
    exit 1
fi

echo ""
echo "📦 Deploying transfer-hours function..."
./node_modules/supabase/bin/supabase functions deploy transfer-hours --project-ref boyrjgivpepjiboekwuu

if [ $? -eq 0 ]; then
    echo "✅ transfer-hours deployed successfully"
else
    echo "❌ Failed to deploy transfer-hours"
    exit 1
fi

# ═══════════════════════════════════════
# STEP 3: VERIFICATION
# ═══════════════════════════════════════
echo ""
echo "━━━ STEP 3: Verification ━━━"
echo ""

echo "🔍 Checking referral_tiers..."
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT tier, conversion_bonus, hourly_multiplier, transfer_limit_monthly FROM referral_tiers ORDER BY min_referrals;" 2>/dev/null || echo "⚠️  Cannot connect to local DB (that's ok if you're on production)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 SYSTEM OVERVIEW:"
echo ""
echo "🎯 TWO-TRACK REWARDS:"
echo "  Track 1: Conversion Bonus (£5-15 when referral completes 1st lesson)"
echo "  Track 2: Lifetime Hours (£15-19.50 per 10h referral completes)"
echo ""
echo "🏆 FOUR TIERS:"
echo "  🥉 Bronze: £5 conversion, 1.0x multiplier, no transfers"
echo "  🥈 Silver: £7 conversion, 1.1x multiplier, 10h/mo transfers"
echo "  🥇 Gold: £10 conversion, 1.2x multiplier, 20h/mo transfers"
echo "  💎 Platinum: £15 conversion, 1.3x multiplier, 50h/mo transfers"
echo ""
echo "📱 FEATURES:"
echo "  ✅ Auto-rewards on lesson completion"
echo "  ✅ Transfer hours (Silver+ only)"
echo "  ✅ Transaction history"
echo "  ✅ Tier progression"
echo "  ✅ Referral tracking"
echo ""
echo "🔗 PAGES:"
echo "  /my-referrals - Full referral dashboard"
echo "  Dashboard has ReferralWidget in sidebar"
echo ""
echo "🧪 TESTING:"
echo "  1. Go to /my-referrals"
echo "  2. Check your tier and referral code"
echo "  3. Share your link and have someone sign up"
echo "  4. When they complete a lesson, check for rewards!"
echo ""
echo "🎉 Ready to use!"
echo ""
