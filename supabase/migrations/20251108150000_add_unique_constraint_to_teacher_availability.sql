-- Add unique constraint to teacher_availability table
-- This allows upsert operations to work properly and prevents duplicate time slots

-- First, remove any duplicate records (keep the most recent)
DELETE FROM teacher_availability a
USING teacher_availability b
WHERE a.id < b.id
  AND a.teacher_id = b.teacher_id
  AND a.day_of_week = b.day_of_week
  AND a.start_time = b.start_time;

-- Add unique constraint
ALTER TABLE teacher_availability
ADD CONSTRAINT teacher_availability_unique_slot
UNIQUE (teacher_id, day_of_week, start_time);

-- Add subjects column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teacher_availability'
    AND column_name = 'subjects'
  ) THEN
    ALTER TABLE teacher_availability
    ADD COLUMN subjects text[] DEFAULT '{}';
  END IF;
END $$;
