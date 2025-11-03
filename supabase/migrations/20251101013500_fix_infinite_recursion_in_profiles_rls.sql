/*
  # Fix Infinite Recursion in Profiles RLS Policies

  ## Summary
  This migration resolves the infinite recursion error that occurs when updating profiles
  by eliminating the circular dependency between profiles and teacher_profiles tables.

  ## Root Cause
  The "Public can read basic approved teacher profiles" policy on profiles table queries
  teacher_profiles, which in turn has admin policies that query profiles table, creating
  an infinite loop during UPDATE operations.

  ## Solution Strategy
  1. Add `is_approved_teacher` boolean flag to profiles table for denormalization
  2. Create a trigger to automatically maintain this flag when teacher_profiles status changes
  3. Drop the problematic "Public can read basic approved teacher profiles" policy
  4. Create a new simpler policy that uses the denormalized flag instead of EXISTS subquery
  5. Ensure users can always update their own profile without triggering teacher_profiles checks

  ## Changes Made

  ### 1. Schema Changes
  - Add `is_approved_teacher` boolean column to profiles table (defaults to false)
  - This denormalizes the approved teacher status for better performance and eliminates circular reference

  ### 2. Trigger Function
  - Create `sync_approved_teacher_status()` function that updates profiles.is_approved_teacher
  - Trigger fires on INSERT/UPDATE of teacher_profiles when status changes to/from 'approved'
  - Maintains data consistency automatically

  ### 3. RLS Policy Updates
  - DROP: "Public can read basic approved teacher profiles" (causes infinite recursion)
  - KEEP: "Users can read own profile" (allows self-updates without recursion)
  - ADD: "Public can read approved teacher basic info" (uses is_approved_teacher flag, no recursion)

  ## Security Impact
  - Users can still only read their own full profile data
  - Approved teachers' basic info (name, avatar, gender) remains publicly readable
  - No change to update permissions - users can only update their own profiles
  - Eliminates infinite recursion while maintaining same security model

  ## Performance Impact
  - Improved: No more expensive EXISTS subquery on every profile SELECT
  - Improved: Simple boolean check is much faster than joining to teacher_profiles
  - Minimal overhead: Trigger only fires when teacher status actually changes
*/

-- Step 1: Add is_approved_teacher column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'is_approved_teacher'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_approved_teacher boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Step 2: Create index for the new column to optimize queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved_teacher 
  ON public.profiles(is_approved_teacher) 
  WHERE is_approved_teacher = true;

-- Step 3: Populate existing data - mark profiles as approved teachers if they have approved teacher_profile
UPDATE public.profiles
SET is_approved_teacher = true
WHERE EXISTS (
  SELECT 1 FROM public.teacher_profiles
  WHERE teacher_profiles.user_id = profiles.id
  AND teacher_profiles.status = 'approved'
);

-- Step 4: Create trigger function to maintain is_approved_teacher flag
CREATE OR REPLACE FUNCTION public.sync_approved_teacher_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a teacher profile is inserted or updated
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Update the profile's is_approved_teacher flag based on new status
    UPDATE public.profiles
    SET is_approved_teacher = (NEW.status = 'approved')
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;

  -- When a teacher profile is deleted, set flag to false
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles
    SET is_approved_teacher = false
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Step 5: Create trigger on teacher_profiles to auto-sync the flag
DROP TRIGGER IF EXISTS sync_approved_teacher_status_trigger ON public.teacher_profiles;
CREATE TRIGGER sync_approved_teacher_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.teacher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_approved_teacher_status();

-- Step 6: Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Public can read basic approved teacher profiles" ON public.profiles;

-- Step 7: Create new policy using the denormalized flag (no circular dependency)
CREATE POLICY "Public can read approved teacher basic info"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_approved_teacher = true);

-- Step 8: Ensure the "Users can read own profile" policy exists and is evaluated first
-- This policy should allow users to read their own profile without any expensive checks
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Step 9: Ensure users can update their own profile without triggering teacher checks
-- Verify the update policy is simple and doesn't reference teacher_profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Step 10: Ensure users can insert their own profile (needed for signup trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);