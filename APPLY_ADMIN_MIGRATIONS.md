# Apply Admin Dashboard Migrations

## Quick Setup - 2 Minutes

The admin dashboard requires 3 new database tables. Apply them using either method below:

---

## Method 1: Supabase Dashboard (Recommended - 2 min)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/sql/new

2. **Run Migration 1: Group Sessions**
   - Copy the entire contents of `supabase/migrations/20251108120000_create_group_sessions_tables.sql`
   - Paste into SQL Editor
   - Click "Run" (bottom right)
   - ✅ Should see "Success. No rows returned"

3. **Run Migration 2: Lesson Recordings**
   - Copy the entire contents of `supabase/migrations/20251108130000_create_lesson_recordings_table.sql`
   - Paste into SQL Editor (new query)
   - Click "Run"
   - ✅ Should see "Success. No rows returned"

4. **Run Migration 3: Bookings**
   - Copy the entire contents of `supabase/migrations/20251108140000_create_bookings_table.sql`
   - Paste into SQL Editor (new query)
   - Click "Run"
   - ✅ Should see "Success. No rows returned"

---

## Method 2: Command Line (Alternative)

```bash
# Set access token
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"

# Mark old migrations as applied (if not already done)
npx supabase migration repair --status applied 20251029001305 --linked
# ... repeat for all old migrations

# Push only the 3 new migrations
npx supabase db push --linked
```

---

## Verify Tables Created

After applying migrations, verify in Supabase dashboard:

1. **Go to Table Editor**
   - https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu/editor

2. **Check these tables exist:**
   - ✅ `group_sessions` (18 columns)
   - ✅ `group_session_participants` (4 columns)
   - ✅ `lesson_recordings` (8 columns)
   - ✅ `bookings` (16 columns)

---

## Test Admin Dashboard

Once tables are created:

1. **Open admin dashboard:** http://localhost:5173/admin
2. **Navigate to each page:**
   - ✅ Home - Should show stats
   - ✅ Users - Should list users
   - ✅ Sessions - Should load (may be empty)
   - ✅ Group Sessions - Should load with filters
   - ✅ Recordings - Should show storage stats
   - ✅ Analytics - Should display charts

---

## What These Tables Do

### `bookings`
- Stores individual 1-on-1 lesson bookings
- Used by: Sessions page, Analytics page
- Key features: Payment tracking, room codes, scheduling

### `group_sessions`
- Stores recurring group class sessions
- Used by: Group Sessions page
- Key features: Enrollment tracking, auto-status updates, participant limits

### `group_session_participants`
- Tracks which students are enrolled in which group sessions
- Auto-updates participant counts
- Used by: Manage Participants modal

### `lesson_recordings`
- Stores video recordings of completed lessons
- Used by: Recordings page
- Key features: AI notes (JSONB), video playback, storage tracking

---

## Troubleshooting

**If table already exists:**
- The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run
- Existing data won't be affected

**If you see policy errors:**
- RLS policies might already exist from a previous migration
- You can safely ignore these - the tables will still work

**If dev server isn't running:**
```bash
npm run dev
```

---

**Ready to test!** 🎉

Once tables are created, your admin dashboard is fully functional.
