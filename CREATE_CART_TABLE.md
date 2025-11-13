# Create Cart Table in Supabase

The cart_items table needs to be created in your Supabase database. Here's how:

## Option 1: Via Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/boyrjgivpepjiboekwuu
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste this SQL:

```sql
-- Create the cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  scheduled_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes IN (30, 60)),
  price numeric(10, 2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '15 minutes')
);

-- Enable Row Level Security
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

-- Policy: Users can read their own cart items
CREATE POLICY "Users can read own cart items"
  ON cart_items FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own cart items
CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own cart items
CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own cart items
CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_teacher_id ON cart_items(teacher_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_expires_at ON cart_items(expires_at);
```

5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Option 2: Via Terminal

Run this command:

```bash
# Navigate to your project directory
cd /Users/nathanfontaine/Documents/Talbiyah.ai/Talbiyah.ai

# Apply migrations
export SUPABASE_ACCESS_TOKEN="sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff"
npx supabase db push --include-all
```

## Verify It Worked

After running the SQL, test by:

1. Go to http://localhost:5173/teachers
2. Click "Book Now" on a teacher
3. Select a time slot
4. You should see "Added to cart!" message

If you still get an error, check the browser console (F12) for details.
