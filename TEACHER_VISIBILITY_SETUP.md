# Teacher Visibility Setup Guide

## Problem
Teachers not appearing in the "Find a Teacher" page.

## Root Causes

For a teacher to appear in the "Find a Teacher" page, they must meet ALL of these requirements:

1. **Teacher profile must be approved**
   - `teacher_profiles.status = 'approved'`

2. **Teacher must have availability set**
   - At least one row in `teacher_availability` table
   - With `is_available = true`

3. **Teacher data must exist in views**
   - `teacher_tier_stats` view must return data for the teacher
   - `teacher_rating_summary` view should exist (optional but recommended)

## Solution

### Step 1: Check Teacher Status

Run this SQL to check your teacher profile:

```sql
SELECT id, user_id, status, current_tier
FROM teacher_profiles
WHERE user_id = auth.uid();
```

If status is not 'approved', update it:

```sql
UPDATE teacher_profiles
SET status = 'approved'
WHERE user_id = auth.uid();
```

### Step 2: Add Teacher Availability

The `day_of_week` column uses integers:
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

Run this SQL (replace the teacher_id with yours):

```sql
-- Add availability for all days, 9 AM - 5 PM
INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, is_available)
VALUES
  ('YOUR_TEACHER_ID', 1, '09:00', '17:00', true),  -- Monday
  ('YOUR_TEACHER_ID', 2, '09:00', '17:00', true),  -- Tuesday
  ('YOUR_TEACHER_ID', 3, '09:00', '17:00', true),  -- Wednesday
  ('YOUR_TEACHER_ID', 4, '09:00', '17:00', true),  -- Thursday
  ('YOUR_TEACHER_ID', 5, '09:00', '17:00', true),  -- Friday
  ('YOUR_TEACHER_ID', 6, '09:00', '17:00', true),  -- Saturday
  ('YOUR_TEACHER_ID', 0, '09:00', '17:00', true)   -- Sunday
ON CONFLICT DO NOTHING;
```

### Step 3: Verify Teacher Tier Stats

Check if the `teacher_tier_stats` view returns data:

```sql
SELECT *
FROM teacher_tier_stats
WHERE teacher_id = 'YOUR_TEACHER_ID';
```

If this returns nothing, the view might be broken. Run the comprehensive fix:

```sql
-- See comprehensive-fix.sql for the full view creation script
```

### Step 4: Verify in UI

1. Go to `/teachers` page
2. You should now see yourself in the teacher list
3. If not, check browser console for errors

## Quick Verification Script

Use this to check all requirements:

```javascript
// Run in browser console on localhost
const teacherId = 'YOUR_TEACHER_ID';

// Check availability
fetch(`http://localhost:5174/rest/v1/teacher_availability?teacher_id=eq.${teacherId}&is_available=eq.true`)
  .then(r => r.json())
  .then(d => console.log('Availability:', d));

// Check tier stats
fetch(`http://localhost:5174/rest/v1/teacher_tier_stats?teacher_id=eq.${teacherId}`)
  .then(r => r.json())
  .then(d => console.log('Tier Stats:', d));
```

## Common Issues

### Issue 1: "column learners.full_name does not exist"
**Fix**: Use `learners.name` instead - the learners table uses `name`, not `full_name`

### Issue 2: "column teacher_earnings.amount does not exist"
**Fix**: Use `amount_earned` instead - the column is named `amount_earned`

### Issue 3: "teacher_tier_stats returns no data"
**Fix**: The view might need to be recreated. Run `comprehensive-fix.sql`

### Issue 4: "teacher_rating_summary view missing"
**Fix**: Create the view using the SQL in `comprehensive-fix.sql`

## Database Schema Reference

### teacher_availability Table

```sql
CREATE TABLE teacher_availability (
  id uuid PRIMARY KEY,
  teacher_id uuid REFERENCES teacher_profiles(id),
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### How Teachers Page Filters

The Teachers.tsx page filters teachers by:

1. Joining `teacher_tier_stats` view
2. Joining `teacher_rating_summary` view (optional)
3. Filtering `teacher_profiles` where `status = 'approved'`
4. Filtering to only teachers with `is_available = true` in `teacher_availability`
5. Merging all data together

If ANY of these steps fail, the teacher won't appear.

## Files Related to Teacher Visibility

- `/src/pages/Teachers.tsx` - Main page that displays teachers
- `/src/pages/teacher/TeacherHub.tsx` - Teacher dashboard
- `/supabase/migrations/*_teacher_tier_system.sql` - Tier system setup
- `/supabase/migrations/*_teacher_availability*.sql` - Availability tables
- `comprehensive-fix.sql` - Contains view definitions

## Success Criteria

After following these steps, you should:

1. ✅ See yourself in the "Find a Teacher" page
2. ✅ Have a tier badge displayed (Bronze/Silver/Gold)
3. ✅ Show availability when students try to book
4. ✅ Be able to receive booking requests

## Support

If issues persist after following this guide:

1. Check browser console for errors
2. Check Supabase SQL logs for query errors
3. Verify RLS policies on `teacher_availability` table
4. Ensure you're logged in with the correct account
