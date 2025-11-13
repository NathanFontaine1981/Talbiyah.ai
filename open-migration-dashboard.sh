#!/bin/bash

echo "🚀 Opening Supabase SQL Editor..."
echo ""
echo "📋 I'll open your browser and copy the SQL to your clipboard."
echo ""

# Copy the SQL migration to clipboard
cat supabase/migrations/20251111000000_create_gamified_referral_system.sql | pbcopy

echo "✅ Migration SQL copied to clipboard!"
echo ""
echo "Opening browser in 2 seconds..."
sleep 2

# Open the Supabase SQL Editor
open "https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Paste the SQL (Cmd+V) into the editor"
echo "2. Click the green 'Run' button"
echo "3. Wait 5-10 seconds for completion"
echo "4. You're done! 🎉"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will create:"
echo "  ✓ referral_tiers table (5 tiers)"
echo "  ✓ referral_achievements table (10 achievements)"
echo "  ✓ user_achievements table"
echo "  ✓ referral_rewards_history table"
echo "  ✓ 3 database functions"
echo "  ✓ 1 leaderboard view"
echo "  ✓ All RLS policies"
echo ""
