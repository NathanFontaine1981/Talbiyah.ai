# Referral System Implementation

## ✅ Completed Features

### 1. Database Schema
Created migration file: `supabase/migrations/20251108000000_create_referral_system.sql`

**Tables Created:**
- Added `referral_code` column to `profiles` table (unique)
- Created `referrals` table to track all referrals with:
  - `referrer_id` - User who referred
  - `referred_id` - User who was referred
  - `referral_code` - The code used
  - `status` - 'pending', 'completed', or 'rewarded'
  - `reward_amount` - Default £5.00
  - Timestamps for created_at, completed_at, rewarded_at

**Features:**
- Row Level Security (RLS) enabled
- Automatic unique referral code generation
- Indexes for fast lookups
- Migration script to add referral codes to existing users

### 2. Frontend Components

**Created:** `src/components/ReferralWidget.tsx`
- Displays user's unique referral link
- Shows referral statistics (total, pending, completed)
- Copy-to-clipboard functionality
- "How It Works" explanation
- Tracks rewards earned

**Features:**
- Auto-generates referral code if user doesn't have one
- Format: `{firstname}-{random6chars}` (e.g., "nathan-a3f9x2")
- Beautiful amber/gold gradient design
- Responsive layout

### 3. SignUp Flow Integration

**Updated:** `src/pages/SignUp.tsx`
- Captures `?ref=` parameter from URL
- Displays referrer's name if valid code
- Generates unique referral code for new users
- Creates referral record in database
- Tracks referral relationship

**Example URLs:**
- `https://talbiyah.ai/signup?ref=nathan-a3f9x2`
- `https://talbiyah.ai/signup?ref=sarah-k9d2m1`

### 4. Dashboard Integration

**Updated:** `src/pages/Dashboard.tsx`
- Added ReferralWidget to student dashboard (right sidebar)
- Added ReferralWidget to teacher dashboard (right sidebar)
- Added ReferralWidget to parent dashboard (automatically included)
- Widget shows between LearningStatsWidget and other components

## 📋 Next Steps Required

### IMPORTANT: Run Database Migration

You need to execute the migration to create the database tables:

**Option 1: Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase/migrations/20251108000000_create_referral_system.sql`
4. Paste and run the SQL
5. Verify tables were created successfully

**Option 2: Using Supabase CLI**
```bash
# First, login to Supabase
npx supabase login

# Then push the migration
npx supabase db push
```

### How the System Works

#### For New Signups:
1. User visits signup page with referral code: `/signup?ref=nathan-a3f9x2`
2. System validates the code and shows: "Referred by Nathan"
3. User completes signup
4. System generates unique code for new user (e.g., "sarah-k9d2m1")
5. Creates referral record linking referrer → referred

#### In Dashboard:
1. User sees "Refer & Earn" widget
2. Can copy their unique referral link
3. Sees stats: Total Referrals, Completed, Rewards Earned
4. Shares link with friends/family

#### Referral Lifecycle:
- **Pending:** User signed up but hasn't completed first lesson
- **Completed:** User completed their first paid lesson
- **Rewarded:** Both referrer and referee received £5 credit

## 🎯 Future Enhancements (To Implement)

### 1. Automatic Reward System
Create a function to monitor lessons and award credits:
```sql
-- Trigger when lesson status changes to 'completed' and is paid
CREATE OR REPLACE FUNCTION award_referral_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the user's first completed paid lesson
  -- Update referral status to 'completed'
  -- Award £5 credit to both referrer and referee
  -- Update status to 'rewarded'
END;
$$ LANGUAGE plpgsql;
```

### 2. Referral Leaderboard
- Show top referrers
- Monthly/yearly rankings
- Special badges for milestones (5, 10, 50 referrals)

### 3. Social Sharing
- WhatsApp share button
- Email invitation
- Social media sharing

### 4. Referral Analytics
- Track conversion rates
- See which channels work best
- Time-to-conversion metrics

### 5. Custom Referral Codes
- Allow users to customize their code
- Check availability
- Brand their link

## 💡 Sadaqah Jariyah Connection

The referral system is positioned as **Sadaqah Jariyah** (ongoing charity):
- Every hour a referred person learns = rewards for referrer
- Continues even after death
- Incentive aligned with Islamic values
- Win-win: Both parties get £5 credit

## 🔧 Technical Details

**Referral Code Format:**
- First name (cleaned, lowercase, max 10 chars)
- Hyphen separator
- 6 random alphanumeric characters
- Example: `nathanfontaine` → `nathanfont-a3f9x2`
- Fallback: `user-{6chars}` if name is invalid

**Security:**
- Unique constraint ensures no duplicate codes
- RLS policies protect user data
- Validation on both frontend and backend
- Graceful fallbacks if tracking fails

**Performance:**
- Indexed columns for fast lookups
- Lazy loading in widget
- Minimal database queries
- Cached in browser

## 📊 Testing Checklist

- [ ] Run database migration
- [ ] Sign up new user - verify referral code generated
- [ ] Sign up with `?ref=` parameter - verify tracking
- [ ] Check ReferralWidget appears on dashboard
- [ ] Copy referral link - verify format
- [ ] Share link and have someone sign up
- [ ] Verify referral record created
- [ ] Check stats update correctly

## 🎨 Design Notes

**Colors:**
- Amber/Gold gradient (referral = gold/value)
- Matches Islamic aesthetic
- Stands out from other widgets
- Warm, inviting tone

**Icons:**
- Gift icon for "Refer & Earn"
- Users for total referrals
- Share2 for "How It Works"
- Check for completed
- Copy for clipboard action

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify migration ran successfully
3. Check Supabase dashboard for data
4. Test with incognito window for clean state
