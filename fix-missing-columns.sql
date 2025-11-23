-- Add ALL missing columns to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing lessons to have sensible defaults
UPDATE lessons
SET booked_at = created_at
WHERE booked_at IS NULL;

UPDATE lessons
SET payment_method = 'stripe'
WHERE payment_method IS NULL;

UPDATE lessons
SET payment_status = 'paid'
WHERE payment_status IS NULL AND status = 'booked';

-- Verify lessons table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lessons'
AND column_name IN ('is_trial', 'booked_at', 'payment_method', 'payment_status', 'scheduled_date', 'scheduled_time')
ORDER BY column_name;
