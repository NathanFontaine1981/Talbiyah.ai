/*
  # Add Gender Column to Profiles Table

  1. Changes
    - Add `gender` column to `public.profiles` table
    - Column type: text
    - Column is nullable to allow existing records to remain valid
    - No default value set

  2. Purpose
    - Enable teacher filtering by gender in the teacher marketplace
    - Support enhanced matching and search capabilities

  3. Security
    - Existing RLS policies automatically apply to the new column
    - No additional security changes needed
*/

-- Add gender column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN gender text;
  END IF;
END $$;
