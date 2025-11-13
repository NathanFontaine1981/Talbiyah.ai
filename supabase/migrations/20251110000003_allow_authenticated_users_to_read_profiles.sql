-- Allow authenticated users to read all profiles
-- This is needed for teachers to see student names/avatars and vice versa

CREATE POLICY "Authenticated users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);
