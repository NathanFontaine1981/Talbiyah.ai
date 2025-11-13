-- Add missing fields to teacher_availability_one_off table so it matches teacher_availability

ALTER TABLE teacher_availability_one_off
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subjects text[] DEFAULT '{}';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_availability_one_off_teacher_date
  ON teacher_availability_one_off(teacher_id, date);

-- Add comment
COMMENT ON TABLE teacher_availability_one_off IS 'One-off availability for specific dates (not recurring weekly patterns)';
COMMENT ON COLUMN teacher_availability_one_off.subjects IS 'Array of subject IDs that teacher can teach during this slot';
