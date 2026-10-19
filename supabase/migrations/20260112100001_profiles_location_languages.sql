-- Migration: Add structured location and languages to profiles
-- This supports teacher onboarding with country/city selection and languages spoken

-- 1. Add structured location fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English']::TEXT[];

-- 2. Create index for country filtering (useful for finding UK teachers)
CREATE INDEX IF NOT EXISTS idx_profiles_country
  ON profiles(country)
  WHERE country IS NOT NULL;

-- 3. Create index for UK-based users specifically
CREATE INDEX IF NOT EXISTS idx_profiles_uk
  ON profiles(country)
  WHERE country = 'GB';

-- 4. Migrate existing location data to country field where possible
-- This is a best-effort migration for existing data
UPDATE profiles
SET country = 'GB'
WHERE location IS NOT NULL
  AND country IS NULL
  AND (
    location ILIKE '%uk%'
    OR location ILIKE '%united kingdom%'
    OR location ILIKE '%england%'
    OR location ILIKE '%london%'
    OR location ILIKE '%birmingham%'
    OR location ILIKE '%manchester%'
    OR location ILIKE '%leeds%'
    OR location ILIKE '%bradford%'
  );

-- 5. Extract city from location for UK users where possible
UPDATE profiles
SET city = 'London'
WHERE country = 'GB'
  AND city IS NULL
  AND location ILIKE '%london%';

UPDATE profiles
SET city = 'Birmingham'
WHERE country = 'GB'
  AND city IS NULL
  AND location ILIKE '%birmingham%';

UPDATE profiles
SET city = 'Manchester'
WHERE country = 'GB'
  AND city IS NULL
  AND location ILIKE '%manchester%';

UPDATE profiles
SET city = 'Leeds'
WHERE country = 'GB'
  AND city IS NULL
  AND location ILIKE '%leeds%';

UPDATE profiles
SET city = 'Bradford'
WHERE country = 'GB'
  AND city IS NULL
  AND location ILIKE '%bradford%';

-- 6. Create view for teachers with location info
CREATE OR REPLACE VIEW teachers_with_location AS
SELECT
  tp.id as teacher_profile_id,
  tp.user_id,
  p.full_name,
  p.country,
  p.city,
  p.location as legacy_location,
  p.languages,
  p.timezone,
  tp.status,
  tp.current_tier,
  tp.hourly_rate,
  tp.group_lesson_enabled,
  tp.group_lesson_tier,
  tp.group_lesson_hourly_rate,
  CASE WHEN p.country = 'GB' THEN true ELSE false END as is_uk_based
FROM teacher_profiles tp
JOIN profiles p ON p.id = tp.user_id;

COMMENT ON COLUMN profiles.country IS 'ISO 3166-1 alpha-2 country code (e.g., GB, US, PK)';
COMMENT ON COLUMN profiles.city IS 'City name for teachers (especially UK cities)';
COMMENT ON COLUMN profiles.languages IS 'Array of languages spoken by the user';
