-- Fix RLS policy on learners table so parents can see their own children

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Parents can view their own learners" ON learners;
DROP POLICY IF EXISTS "Users can view their own learner record" ON learners;
DROP POLICY IF EXISTS "Authenticated users can view learners" ON learners;

-- Create policy: Parents can view their children (learners where parent_id = auth.uid())
CREATE POLICY "Parents can view their own learners" ON learners
  FOR SELECT
  USING (parent_id = auth.uid());

-- Also allow viewing if the learner ID matches the user ID (for users who are also learners)
CREATE POLICY "Users can view their own learner record" ON learners
  FOR SELECT
  USING (id = auth.uid());

-- Also need to fix lesson_details RLS to allow viewing
DROP POLICY IF EXISTS "Anyone can view lesson details" ON lesson_details;
DROP POLICY IF EXISTS "Participants can view lesson details" ON lesson_details;

-- Allow authenticated users to view lesson_details (we filter in app code)
CREATE POLICY "Authenticated users can view lesson details" ON lesson_details
  FOR SELECT
  USING (auth.role() = 'authenticated');
