/*
  # Gamification and Referral System

  1. Changes to Learners Table
    - Add `referral_code` (text, unique, non-editable) - Unique code for referring others
    - Add `learning_credits` (numeric) - Free lesson hours earned through referrals
    - Add `login_streak` (integer) - Consecutive days logged in
    - Add `last_login_date` (date) - Last login date for streak tracking
    - Add `total_points` (integer) - Total gamification points earned
    - Add `referred_by` (uuid) - ID of the learner who referred this learner

  2. New Tables
    - `referrals`
      - `id` (uuid, primary key) - Unique identifier
      - `referrer_id` (uuid, foreign key) - Learner who made the referral
      - `referred_id` (uuid, foreign key) - Learner who was referred
      - `hours_completed` (numeric) - Hours completed by referred learner
      - `credits_awarded` (integer) - Number of credits awarded to referrer
      - `created_at` (timestamptz) - When the referral was created
      - `updated_at` (timestamptz) - Last update timestamp

  3. Security
    - Enable RLS on `referrals` table
    - Users can read their own referral records (as referrer)
    - System functions can update referral tracking
    - Admin users can manage all referrals

  4. Triggers
    - Automatically generate referral code on learner creation
    - Track lesson completion and award referral credits
    - Update login streaks on dashboard access

  5. Notes
    - Referral codes are 8 characters: alphanumeric, uppercase
    - Every 10 hours completed by referred student = 1 credit for referrer
    - Login streaks reset if user doesn't log in for more than 24 hours
    - Credits can be used to book free lessons
*/

-- Add new fields to learners table
ALTER TABLE learners
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS learning_credits numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date,
  ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES learners(id) ON DELETE SET NULL;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  hours_completed numeric(10, 2) DEFAULT 0,
  credits_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Enable Row Level Security
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own referral records (as referrer)
CREATE POLICY "Users can read own referral records"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = referrals.referrer_id
      AND learners.parent_id = auth.uid()
    )
  );

-- Policy: System can insert referral records
CREATE POLICY "System can insert referral records"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: System can update referral records
CREATE POLICY "System can update referral records"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Admin users can manage all referrals
CREATE POLICY "Admin users can manage all referrals"
  ON referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learners_referral_code ON learners(referral_code);
CREATE INDEX IF NOT EXISTS idx_learners_referred_by ON learners(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
  code_exists boolean;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM learners WHERE referral_code = result) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN result;
END;
$$;

-- Trigger function to assign referral code on learner creation
CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for referral code assignment
DROP TRIGGER IF EXISTS assign_referral_code_trigger ON learners;
CREATE TRIGGER assign_referral_code_trigger
  BEFORE INSERT ON learners
  FOR EACH ROW
  EXECUTE FUNCTION assign_referral_code();

-- Function to update referral credits when lessons are completed
CREATE OR REPLACE FUNCTION update_referral_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_learner_id uuid;
  lesson_hours numeric;
  current_hours numeric;
  new_credits integer;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    lesson_hours := NEW.duration_minutes / 60.0;

    SELECT referred_by INTO referrer_learner_id
    FROM learners
    WHERE id = NEW.learner_id AND referred_by IS NOT NULL;

    IF referrer_learner_id IS NOT NULL THEN
      INSERT INTO referrals (referrer_id, referred_id, hours_completed, credits_awarded)
      VALUES (referrer_learner_id, NEW.learner_id, lesson_hours, 0)
      ON CONFLICT (referrer_id, referred_id)
      DO UPDATE SET
        hours_completed = referrals.hours_completed + lesson_hours,
        updated_at = now();

      SELECT hours_completed INTO current_hours
      FROM referrals
      WHERE referrer_id = referrer_learner_id AND referred_id = NEW.learner_id;

      new_credits := FLOOR(current_hours / 10.0);

      UPDATE referrals
      SET credits_awarded = new_credits
      WHERE referrer_id = referrer_learner_id AND referred_id = NEW.learner_id;

      UPDATE learners
      SET learning_credits = (
        SELECT COALESCE(SUM(credits_awarded), 0)
        FROM referrals
        WHERE referrer_id = referrer_learner_id
      )
      WHERE id = referrer_learner_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for referral credit updates
DROP TRIGGER IF EXISTS update_referral_credits_trigger ON lessons;
CREATE TRIGGER update_referral_credits_trigger
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_credits();

-- Create trigger to automatically update updated_at timestamp on referrals
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak(learner_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_login date;
  current_streak integer;
BEGIN
  SELECT last_login_date, login_streak INTO last_login, current_streak
  FROM learners
  WHERE id = learner_id_param;

  IF last_login IS NULL OR last_login < CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE learners
    SET
      login_streak = CASE
        WHEN last_login = CURRENT_DATE - INTERVAL '1 day' THEN login_streak + 1
        ELSE 1
      END,
      last_login_date = CURRENT_DATE,
      total_points = total_points + 10
    WHERE id = learner_id_param;
  END IF;
END;
$$;

-- Backfill referral codes for existing learners
UPDATE learners
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;
