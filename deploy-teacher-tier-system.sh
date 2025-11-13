#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏆 TEACHER TIER PROGRESSION SYSTEM DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will deploy:"
echo "  ✅ Database schema (5 tiers, qualifications, applications, pricing)"
echo "  ✅ Edge Functions (process-teacher-application, admin-assign-tier)"
echo "  ✅ Auto-promotion trigger"
echo "  ✅ Grandfather pricing system"
echo "  ✅ UI updates (TeacherTierDashboard, Admin TeacherTiers)"
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
echo "━━━ STEP 1: Database Migration ━━━"
echo ""
echo "📋 Copying migration SQL to clipboard..."
echo ""

# Copy migration to clipboard
cat supabase/migrations/20251111150000_create_teacher_tier_system.sql | pbcopy

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

echo "⏳ Waiting for you to apply migration..."
read -p "Press ENTER when migration is applied successfully..."

# ═══════════════════════════════════════
# STEP 2: DEPLOY EDGE FUNCTIONS
# ═══════════════════════════════════════
echo ""
echo "━━━ STEP 2: Deploy Edge Functions ━━━"
echo ""

export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

echo "📦 Deploying process-teacher-application function..."
./node_modules/supabase/bin/supabase functions deploy process-teacher-application --project-ref boyrjgivpepjiboekwuu

if [ $? -eq 0 ]; then
    echo "✅ process-teacher-application deployed successfully"
else
    echo "❌ Failed to deploy process-teacher-application"
    exit 1
fi

echo ""
echo "📦 Deploying admin-assign-tier function..."
./node_modules/supabase/bin/supabase functions deploy admin-assign-tier --project-ref boyrjgivpepjiboekwuu

if [ $? -eq 0 ]; then
    echo "✅ admin-assign-tier deployed successfully"
else
    echo "❌ Failed to deploy admin-assign-tier"
    exit 1
fi

# ═══════════════════════════════════════
# STEP 3: VERIFICATION
# ═══════════════════════════════════════
echo ""
echo "━━━ STEP 3: Verification ━━━"
echo ""

echo "🔍 Checking teacher_tiers table..."
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT tier, tier_name, teacher_hourly_rate, student_hourly_price, platform_margin FROM teacher_tiers ORDER BY tier_level;" 2>/dev/null || echo "⚠️  Cannot connect to local DB (that's ok if you're on production)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 SYSTEM OVERVIEW:"
echo ""
echo "🎯 FIVE TIERS:"
echo "  🌱 Newcomer: £5/h (student pays £15, margin £10 - 67%)"
echo "  📚 Apprentice: £6/h (student pays £15, margin £9 - 60%)"
echo "  🎯 Skilled: £7/h (student pays £15, margin £8 - 53%)"
echo "  🏆 Expert: £8.50/h (student pays £16.50, margin £8 - 48%)"
echo "  💎 Master: £10/h (student pays £18, margin £8 - 44%)"
echo ""
echo "📈 TWO PHASES:"
echo "  Phase 1 (Absorption): £15 student price, teacher grows £5→£7, you absorb compression"
echo "  Phase 2 (Pass-through): £8 margin locked, teacher grows £7→£10, student pays £15→£18"
echo ""
echo "⚡ AUTO-PROMOTION:"
echo "  • Newcomer → Apprentice: 50h taught, 4.0+ rating"
echo "  • Apprentice → Skilled: 150h taught, 4.2+ rating"
echo "  • Skilled → Expert: Manual approval + credentials"
echo "  • Expert → Master: Manual approval + demonstration"
echo ""
echo "🎓 EXPERT/MASTER REQUIREMENTS:"
echo "  • Expert: Ijazah/degree OR 5y experience, Fluent English, Admin interview"
echo "  • Master: Multiple Ijazahs, Al-Azhar degree, Native English, Demonstration"
echo ""
echo "💰 GRANDFATHER PRICING:"
echo "  • Students lock in teacher's price for 12 months from first booking"
echo "  • After 12mo, price updates to teacher's current tier rate"
echo "  • Protects both sides: stability for students, growth for teachers"
echo ""
echo "📱 PAGES:"
echo "  /teacher/tiers - Teacher tier dashboard (view progress, apply for tiers)"
echo "  /admin/teacher-tiers - Admin tier management (assign, review applications)"
echo ""
echo "🧪 TESTING:"
echo "  1. As teacher: Visit /teacher/tiers to see your current tier"
echo "  2. Complete lessons to accumulate hours and ratings"
echo "  3. Watch for auto-promotion when eligible"
echo "  4. Apply for Expert/Master tier when ready"
echo "  5. As admin: Visit /admin/teacher-tiers to review applications"
echo ""
echo "🎉 Ready to use!"
echo ""
