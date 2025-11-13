/*
  # Add Missing Columns to Subjects Table

  1. Changes
    - Add `slug` column (text, unique) - URL-friendly identifier for subjects
    - Add `allowed_durations` column (integer array) - Permitted session durations
    - Add `minimum_rate` column (integer) - Minimum hourly rate in pence
    - Add `platform_fee_type` column (text) - 'percentage' or 'fixed'
    - Add `platform_fee_percentage` column (numeric) - Platform fee percentage
    - Add `platform_fee_amount` column (integer) - Platform fee fixed amount in pence

  2. Data Migration
    - Generate slugs from existing subject names
    - Set default values for pricing fields
*/

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
ALTER TABLE subjects
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_slug ON subjects(slug);

-- Add check constraints
ALTER TABLE subjects
ADD CONSTRAINT check_platform_fee_type
CHECK (platform_fee_type IN ('percentage', 'fixed'));

ALTER TABLE subjects
ADD CONSTRAINT check_minimum_rate_positive
CHECK (minimum_rate > 0);

COMMENT ON COLUMN subjects.slug IS 'URL-friendly identifier for the subject';
COMMENT ON COLUMN subjects.allowed_durations IS 'Array of permitted session durations in minutes (e.g., {30, 60})';
COMMENT ON COLUMN subjects.minimum_rate IS 'Minimum hourly rate in pence for this subject';
COMMENT ON COLUMN subjects.platform_fee_type IS 'Platform fee calculation method: percentage or fixed';
COMMENT ON COLUMN subjects.platform_fee_percentage IS 'Platform fee percentage (if type is percentage)';
COMMENT ON COLUMN subjects.platform_fee_amount IS 'Platform fee fixed amount in pence per hour (if type is fixed)';
