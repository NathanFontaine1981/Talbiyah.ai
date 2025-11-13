-- Ensure RLS policies allow teacher application submission and admin viewing

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Users can view their own teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Users can update their own teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can update all teacher profiles" ON teacher_profiles;

-- Enable RLS
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own teacher profile (for applications)
CREATE POLICY "Users can insert their own teacher profile"
ON teacher_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own teacher profile
CREATE POLICY "Users can view their own teacher profile"
ON teacher_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own teacher profile
CREATE POLICY "Users can update their own teacher profile"
ON teacher_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view all teacher profiles
CREATE POLICY "Admins can view all teacher profiles"
ON teacher_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.roles && ARRAY['admin']::text[]
      OR profiles.is_admin = true
    )
  )
);

-- Policy: Admins can update all teacher profiles (for approvals)
CREATE POLICY "Admins can update all teacher profiles"
ON teacher_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.roles && ARRAY['admin']::text[]
      OR profiles.is_admin = true
    )
  )
);

-- Add comment
COMMENT ON TABLE teacher_profiles IS 'Teacher profiles with RLS policies for user insert/view/update and admin full access';
