-- Combined schema fixes for subjects and learners tables

-- ===================================================================
-- PART 1: Add missing columns to subjects table
-- ===================================================================

-- Add slug column
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS slug text;

-- Add allowed_durations column (default to 30 and 60 minutes)
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS allowed_durations integer[] DEFAULT ARRAY[30, 60];

-- Add minimum_rate column (default to £15.00 per hour = 1500 pence)
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS minimum_rate integer DEFAULT 1500;

-- Add platform fee columns
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS platform_fee_type text DEFAULT 'percentage';

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS platform_fee_percentage numeric DEFAULT 20.0;

ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS platform_fee_amount integer DEFAULT 0;

-- Generate slugs from existing subject names (convert to lowercase and replace spaces with hyphens)
UPDATE subjects
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug unique and not null after populating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subjects_slug_key'
  ) THEN
    ALTER TABLE subjects ALTER COLUMN slug SET NOT NULL;
    CREATE UNIQUE INDEX idx_subjects_slug ON subjects(slug);
  END IF;
END $$;

-- Add check constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_platform_fee_type'
  ) THEN
    ALTER TABLE subjects
    ADD CONSTRAINT check_platform_fee_type
    CHECK (platform_fee_type IN ('percentage', 'fixed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_minimum_rate_positive'
  ) THEN
    ALTER TABLE subjects
    ADD CONSTRAINT check_minimum_rate_positive
    CHECK (minimum_rate > 0);
  END IF;
END $$;

-- ===================================================================
-- PART 2: Add missing columns to learners table
-- ===================================================================

-- Add missing columns to learners table
ALTER TABLE learners
ADD COLUMN IF NOT EXISTS total_xp integer DEFAULT 0;

ALTER TABLE learners
ADD COLUMN IF NOT EXISTS current_level integer DEFAULT 1;

ALTER TABLE learners
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_total_xp_non_negative'
  ) THEN
    ALTER TABLE learners
    ADD CONSTRAINT check_total_xp_non_negative
    CHECK (total_xp >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_current_level_positive'
  ) THEN
    ALTER TABLE learners
    ADD CONSTRAINT check_current_level_positive
    CHECK (current_level >= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_current_streak_non_negative'
  ) THEN
    ALTER TABLE learners
    ADD CONSTRAINT check_current_streak_non_negative
    CHECK (current_streak >= 0);
  END IF;
END $$;
