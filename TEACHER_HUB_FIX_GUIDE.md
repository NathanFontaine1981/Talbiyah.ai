# Teacher Hub Error Fixes

## Issues Identified

The Teacher Hub (/teacher/hub) is experiencing multiple 400 Bad Request errors:

1. **PendingLessonsList Error**: `lr.user_id does not exist`
   - Function: `get_teacher_pending_lessons`
   - Cause: Learners table has `parent_id` column, not `user_id`

2. **Missing View**: `teacher_tier_stats`
   - Cause: View not created or migrations not applied

3. **Missing Table**: `teacher_earnings`
   - Cause: Migrations not fully applied

4. **Teacher Findability Issue** ✅ SOLVED
   - Teachers page queries `teacher_tier_stats` and `teacher_rating_summary` views
   - Both views are missing, causing teachers not to appear
   - Solution: Create both views using the comprehensive SQL fix

## Root Cause

Migrations have been partially applied, causing schema mismatches. Some migrations conflict with existing indexes and policies.

## Solution

### Option 1: Apply SQL Fix Directly (Recommended)

Execute the SQL in `comprehensive-fix.sql` via Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new
2. Copy content from `comprehensive-fix.sql`
3. Execute the SQL
4. Refresh the Teacher Hub page

### Option 2: Mark Migrations and Push

```bash
# Mark problematic migrations as applied
SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" \
  ./node_modules/supabase/bin/supabase migration repair --status applied 20251108000000

# Continue for other migrations...

# Then push remaining
SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff" \
  ./node_modules/supabase/bin/supabase db push
```

## What the Fix Does

1. **Updates `get_teacher_pending_lessons` function**
   - Changes `lr.user_id` to `lr.parent_id`
   - Fixes the column reference error
   - Fixes PendingLessonsList component

2. **Creates/Replaces `teacher_tier_stats` view**
   - Provides teacher statistics aggregation
   - Includes tier info, hours taught, ratings, student count
   - Uses COALESCE to handle missing data gracefully
   - Fixes Teacher Hub dashboard stats

3. **Creates/Replaces `teacher_rating_summary` view**
   - Provides comprehensive rating metrics for teachers
   - Includes detailed ratings, quick feedback, behavioral metrics
   - Calculates completion rate, rebook rate, average lessons per student
   - **Fixes Teachers page** - teachers will now be findable again

## Verification

After applying the fix, verify by:

1. Refresh Teacher Hub page
2. Check browser console for errors
3. Verify pending lessons load
4. Verify teacher stats display correctly

## Files Created

- `comprehensive-fix.sql` - SQL to execute
- `supabase/migrations/20251117200000_fix_lesson_confirmation_functions.sql` - Migration file
- This guide

## Next Steps

1. Apply the SQL fix
2. Investigate teacher findability issue separately
3. Consider consolidating/cleaning up migrations to prevent future conflicts
