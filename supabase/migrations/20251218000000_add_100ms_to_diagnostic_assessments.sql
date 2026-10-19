/*
  # Add 100ms Video Room Support to Diagnostic Assessments

  This migration adds video room fields to diagnostic_assessments table
  to support 20-minute video sessions between teachers and students.

  Assessment recordings are retained for 30 days (vs 7 days for regular lessons)
  to allow admin quality control review.
*/

-- Add 100ms room fields to diagnostic_assessments
ALTER TABLE diagnostic_assessments
ADD COLUMN IF NOT EXISTS room_id text,
ADD COLUMN IF NOT EXISTS teacher_room_code text,
ADD COLUMN IF NOT EXISTS student_room_code text,
ADD COLUMN IF NOT EXISTS recording_url text,
ADD COLUMN IF NOT EXISTS recording_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS scheduled_time timestamptz,
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 20;

-- Create index for scheduled assessments
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_scheduled_time
ON diagnostic_assessments(scheduled_time)
WHERE scheduled_time IS NOT NULL;

-- Create index for recording expiration (for cleanup job)
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_recording_expires
ON diagnostic_assessments(recording_expires_at)
WHERE recording_expires_at IS NOT NULL;

-- Add admin notes field for quality control
ALTER TABLE diagnostic_assessments
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid REFERENCES auth.users(id);

-- Comment on new columns
COMMENT ON COLUMN diagnostic_assessments.room_id IS '100ms room ID for video session';
COMMENT ON COLUMN diagnostic_assessments.teacher_room_code IS '100ms room code for teacher (host role)';
COMMENT ON COLUMN diagnostic_assessments.student_room_code IS '100ms room code for student (guest role)';
COMMENT ON COLUMN diagnostic_assessments.recording_url IS 'URL to 100ms recording of the assessment';
COMMENT ON COLUMN diagnostic_assessments.recording_expires_at IS 'Recording expiration date (30 days from session)';
COMMENT ON COLUMN diagnostic_assessments.scheduled_time IS 'Scheduled time for the diagnostic assessment video call';
COMMENT ON COLUMN diagnostic_assessments.duration_minutes IS 'Duration of assessment in minutes (default 20)';
COMMENT ON COLUMN diagnostic_assessments.admin_notes IS 'Admin notes from quality control review';
COMMENT ON COLUMN diagnostic_assessments.admin_reviewed_at IS 'When admin reviewed this assessment';
COMMENT ON COLUMN diagnostic_assessments.admin_reviewed_by IS 'Which admin reviewed this assessment';
