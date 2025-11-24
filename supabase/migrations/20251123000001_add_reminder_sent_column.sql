-- Add column to track if reminder email was sent
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Create index for faster cron job queries
CREATE INDEX IF NOT EXISTS idx_lessons_reminder_pending
ON lessons(scheduled_time, reminder_sent)
WHERE reminder_sent IS NULL OR reminder_sent = FALSE;
