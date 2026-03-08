-- Add audio_url column to course_sessions for uploaded lesson recordings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='course_sessions' AND column_name='audio_url') THEN
    ALTER TABLE course_sessions ADD COLUMN audio_url TEXT;
  END IF;
END $$;
