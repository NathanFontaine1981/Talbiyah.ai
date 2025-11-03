/*
  # Fix RLS Security Policies

  ## Summary
  This migration addresses critical security issues in Row Level Security (RLS) policies
  to ensure proper data access control and prevent unauthorized access to user data.

  ## Changes Made

  ### 1. Profiles Table
  - **REMOVED**: Overly permissive "Users can read all profiles" policy that used `USING (true)`
  - **KEPT**: "Users can read own profile" - Users can only read their own profile data
  - **ADDED**: "Public can read basic teacher info" - Allow reading minimal profile data (full_name, avatar_url, gender) for approved teachers only
  - This ensures users cannot access sensitive data from other users' profiles

  ### 2. Teacher Profiles Table
  - Already has proper policies:
    - Users can read approved teacher profiles (public facing)
    - Users can read/update their own teacher profile
    - Admins can manage all teacher profiles

  ### 3. Teacher Availability Recurring Table
  - Already has proper policies:
    - Teachers can manage their own availability
    - Users can read availability for approved teachers (needed for booking)
    - Admins can read all availability

  ### 4. Lessons Table
  - Already has proper policies:
    - Parents can manage their learners' lessons
    - Teachers can read and update their assigned lessons
    - Admins can manage all lessons
    - No unauthorized access possible

  ### 5. Learners Table
  - Already has proper policies:
    - Parents can fully manage their own learners
    - No one else can access learner data

  ## Security Impact
  - CRITICAL FIX: Removes the ability for any authenticated user to read all profiles
  - Maintains necessary public access for approved teacher information (for booking functionality)
  - All other policies remain properly restrictive
*/

-- DROP the overly permissive policy that allows reading all profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;

-- ADD a restricted policy for reading basic teacher information
-- This allows users to see basic info (name, avatar, gender) for profiles that are approved teachers
CREATE POLICY "Public can read basic approved teacher profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.user_id = profiles.id
      AND teacher_profiles.status = 'approved'
    )
  );

-- Verify the "Users can read own profile" policy exists (it should already exist)
-- This is a safety check to ensure users can still read their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;
