/*
  # Add Missing Columns to Profiles and Teacher Profiles Tables

  1. Changes to `profiles` table
    - Add `date_of_birth` (date) - Teacher's date of birth
    - Add `location` (text) - City and country of teacher
    - Add `arabic_font_style` (text) - Preferred Arabic font (IndoPak or Uthmani)

  2. Changes to `teacher_profiles` table
    - Add `education_level` (text) - Highest level of education completed
    - Add `islamic_learning_interests` (text[]) - Array of Islamic subjects of interest

  3. Notes
    - All new columns are nullable to support existing data
    - These fields are required for the comprehensive teacher application form
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'arabic_font_style'
  ) THEN
    ALTER TABLE profiles ADD COLUMN arabic_font_style text;
  END IF;
END $$;

-- Add new columns to teacher_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teacher_profiles' AND column_name = 'education_level'
  ) THEN
    ALTER TABLE teacher_profiles ADD COLUMN education_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teacher_profiles' AND column_name = 'islamic_learning_interests'
  ) THEN
    ALTER TABLE teacher_profiles ADD COLUMN islamic_learning_interests text[];
  END IF;
END $$;
