/*
  # Add Teacher Notes Fields to Progress Tracker

  1. Changes
    - Add `understanding_range` column (text) - Ayah range for understanding progress
    - Add `fluency_notes` column (text) - Teacher notes on fluency and Tajweed
    - Add `memorization_range` column (text) - Ayah range for memorization progress

  2. Notes
    - These fields are for teacher use to track detailed progress per Surah
    - All fields are nullable to allow gradual population
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_progress_tracker' AND column_name = 'understanding_range'
  ) THEN
    ALTER TABLE lesson_progress_tracker ADD COLUMN understanding_range text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_progress_tracker' AND column_name = 'fluency_notes'
  ) THEN
    ALTER TABLE lesson_progress_tracker ADD COLUMN fluency_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_progress_tracker' AND column_name = 'memorization_range'
  ) THEN
    ALTER TABLE lesson_progress_tracker ADD COLUMN memorization_range text;
  END IF;
END $$;
