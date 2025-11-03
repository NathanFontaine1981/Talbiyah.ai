/*
  # Add Public Read Access for Subjects

  1. Changes
    - Add policy to allow anonymous (public) users to read subjects
    - This ensures the subject filter on the /teachers page works for all visitors
  
  2. Security
    - Only SELECT operations are allowed for anonymous users
    - INSERT, UPDATE, DELETE remain restricted to admin users only
*/

-- Drop the old authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can read subjects" ON subjects;

-- Create new policy that allows both authenticated and anonymous users to read subjects
CREATE POLICY "Anyone can read subjects"
  ON subjects
  FOR SELECT
  TO anon, authenticated
  USING (true);
