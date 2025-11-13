-- Mark counselling and Islamic Studies as inactive
-- Keep them in database for future use but hide from active booking flow

UPDATE subjects
SET is_active = false
WHERE slug IN ('counselling', 'islamic-studies');

-- Verify the update
SELECT slug, name, is_active FROM subjects ORDER BY slug;
