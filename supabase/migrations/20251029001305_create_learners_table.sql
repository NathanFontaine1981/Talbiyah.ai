/*
  # Create Learners Table

  1. New Tables
    - `learners`
      - `id` (uuid, primary key) - Unique identifier for each learner
      - `name` (text) - Learner's name (e.g., 'Aisha')
      - `parent_id` (uuid, foreign key) - Links to profiles.id of the account holder
      - `gamification_points` (integer, default: 0) - Points earned through learning
      - `created_at` (timestamptz) - Timestamp of learner creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `learners` table
    - Add policy for parents to read their own learners
    - Add policy for parents to insert new learners
    - Add policy for parents to update their own learners
    - Add policy for parents to delete their own learners

  3. Notes
    - This table enables the parent/child feature where one parent can manage multiple student profiles
    - Each learner is linked to a parent account through parent_id
*/

-- Create the learners table
CREATE TABLE IF NOT EXISTS learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gamification_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can read their own learners
CREATE POLICY "Parents can read own learners"
  ON learners
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- Policy: Parents can insert new learners
CREATE POLICY "Parents can insert own learners"
  ON learners
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Policy: Parents can update their own learners
CREATE POLICY "Parents can update own learners"
  ON learners
  FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Policy: Parents can delete their own learners
CREATE POLICY "Parents can delete own learners"
  ON learners
  FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

-- Create index for parent_id lookups (important for performance when querying learners by parent)
CREATE INDEX IF NOT EXISTS idx_learners_parent_id ON learners(parent_id);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_learners_updated_at ON learners;
CREATE TRIGGER update_learners_updated_at
  BEFORE UPDATE ON learners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
