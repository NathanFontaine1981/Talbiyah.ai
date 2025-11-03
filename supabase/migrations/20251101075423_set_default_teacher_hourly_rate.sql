/*
  # Set Default Teacher Hourly Rate

  1. Changes
    - Update teacher_profiles table to set default hourly_rate to 15.00 GBP
    - Update all existing teacher profiles with NULL or incorrect hourly rates to 15.00

  2. Security
    - No RLS policy changes needed
    - This migration only updates the schema and existing data

  3. Notes
    - Default rate of £15.00 per hour is now the official standard
    - All new teacher profiles will automatically have this rate
    - Existing teachers can still customize their rate after approval
*/

-- Set default hourly rate for new teacher profiles
ALTER TABLE teacher_profiles
  ALTER COLUMN hourly_rate SET DEFAULT 15.00;

-- Update existing teacher profiles with NULL hourly_rate to 15.00
UPDATE teacher_profiles
SET hourly_rate = 15.00
WHERE hourly_rate IS NULL OR hourly_rate = 0;

-- Update any test/incorrect rates (optional - uncomment if needed)
-- UPDATE teacher_profiles
-- SET hourly_rate = 15.00
-- WHERE hourly_rate != 15.00;