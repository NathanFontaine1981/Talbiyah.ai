# Apply Gamified Referral System Migration

## ✅ What's Been Completed

1. **Edge Function Deployed** ✅
   - `process-referral-completion` successfully deployed to production
   - Dashboard: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions
   - Function handles reward processing, tier upgrades, and achievement unlocking

2. **Frontend Components Built** ✅
   - `/refer` - ReferralDashboard with full feature set
   - `/referral/leaderboard` - Competitive leaderboard
   - Routes configured in App.tsx

3. **Migration File Created** ✅
   - File: `supabase/migrations/20251111000000_create_gamified_referral_system.sql`
   - Ready to apply manually

---

## 🚨 REQUIRED: Manual Migration Application

Due to CLI authentication issues, the SQL migration needs to be applied manually through the Supabase Dashboard.

### Step-by-Step Instructions:

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new

2. **Copy Migration SQL:**
   - Open file: `supabase/migrations/20251111000000_create_gamified_referral_system.sql`
   - Select ALL content (Cmd+A / Ctrl+A)
   - Copy (Cmd+C / Ctrl+C)

3. **Paste and Execute:**
   - Paste the SQL into the Supabase SQL Editor
   - Click the green "Run" button
   - Wait for execution to complete (should take 5-10 seconds)

4. **Verify Success:**
   Check that these tables exist in the Table Editor:
   - `referral_tiers` (5 rows: Bronze, Silver, Gold, Platinum, Diamond)
   - `referral_achievements` (10 rows: various achievements)
   - `user_achievements` (junction table, initially empty)
   - `referral_rewards_history` (audit trail, initially empty)

   Check that `referrals` table has new columns:
   - `points_earned`
   - `tier_id`
   - `milestone_reached`
   - `last_reward_date`
   - `referral_rank`
   - `total_impact_hours`

---

## 📊 What This Migration Creates

### Tables:
1. **referral_tiers** - 5-tier system (Bronze → Diamond)
2. **referral_achievements** - 10 unlockable achievements
3. **user_achievements** - Tracks earned achievements
4. **referral_rewards_history** - Complete reward audit trail

### Functions:
1. **calculate_user_tier(user_id)** - Auto-calculates tier
2. **update_referral_stats()** - Trigger on referral status changes
3. **check_achievements(user_id)** - Checks and awards achievements

### Views:
1. **referral_leaderboard** - Pre-computed rankings

### RLS Policies:
- Public read on tiers and achievements
- User-specific views for achievements and rewards
- System-level insert policies

---

## 🧪 Testing After Migration

Once the migration is applied, test the complete flow:

### 1. Test Referral Dashboard
```
Navigate to: http://localhost:5173/refer
Verify:
- Stats display correctly
- Tier progress shows (should be Bronze initially)
- Referral link displays
- Social share buttons work
- Achievement cards appear
```

### 2. Test Leaderboard
```
Navigate to: http://localhost:5173/referral/leaderboard
Verify:
- Leaderboard loads without errors
- Your position shows
- Stats summary displays
```

### 3. Test Complete Referral Flow
```
1. Get your referral code from dashboard
2. Share referral link
3. Have test user sign up with link
4. Test user completes first lesson
5. Edge Function processes completion
6. Verify:
   - Referral marked as "completed"
   - Credits awarded (£5 for Bronze tier)
   - Reward recorded in history
   - "First Referral" achievement unlocked
   - Additional £5 from achievement
```

---

## 🔧 Troubleshooting

### Migration Fails with "relation already exists"
**Solution:** Run these commands first to drop existing structures:
```sql
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS referral_rewards_history CASCADE;
DROP TABLE IF EXISTS referral_achievements CASCADE;
DROP TABLE IF EXISTS referral_tiers CASCADE;
DROP VIEW IF EXISTS referral_leaderboard CASCADE;
```
Then rerun the full migration.

### "tier_id" column conflicts
**Solution:** The migration uses `ADD COLUMN IF NOT EXISTS`, so this shouldn't happen. If it does:
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'referrals' AND column_name = 'tier_id';
```

### Edge Function not processing referrals
**Check logs:**
- Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/process-referral-completion/logs
- Look for errors
- Verify function has access to database
- Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set

### No achievements unlocking
**Manually trigger check:**
```sql
SELECT * FROM check_achievements('user-uuid-here');
```

---

## 📋 Next Steps After Migration

Once migration is applied successfully:

1. ✅ Test referral dashboard (  /refer)
2. ✅ Test leaderboard (/referral/leaderboard)
3. ✅ Create test referral
4. ✅ Complete test lesson
5. ✅ Verify reward processing
6. ✅ Check achievement unlock
7. ✅ Announce feature to users

---

## 🎯 Feature Complete Checklist

- [x] Database migration created
- [x] Edge Function created
- [x] Edge Function deployed
- [x] ReferralDashboard component
- [x] ReferralLeaderboard component
- [x] Routes configured
- [x] Social sharing integrated
- [ ] **Migration applied** ← YOU ARE HERE
- [ ] End-to-end testing complete
- [ ] Ready for production use

---

## 💡 Quick Reference

**Migration File:**
```
supabase/migrations/20251111000000_create_gamified_referral_system.sql
```

**SQL Editor:**
```
https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new
```

**Table Editor:**
```
https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/editor
```

**Function Logs:**
```
https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/functions/process-referral-completion/logs
```

**App Routes:**
```
/refer                     - Referral Dashboard
/referral/leaderboard      - Leaderboard
```

---

## ℹ️ Support

If you encounter any issues:
1. Check the Supabase Dashboard logs
2. Verify all tables were created
3. Check Edge Function logs
4. Review GAMIFIED_REFERRAL_SYSTEM_COMPLETE.md for detailed documentation

**Created:** November 11, 2025
**Status:** Awaiting Manual Migration Application
