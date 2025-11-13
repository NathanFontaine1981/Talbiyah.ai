-- Create lesson_recordings table
CREATE TABLE IF NOT EXISTS lesson_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    recording_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    file_size_mb DECIMAL(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    ai_notes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_lesson ON lesson_recordings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_status ON lesson_recordings(status);
CREATE INDEX IF NOT EXISTS idx_lesson_recordings_created_at ON lesson_recordings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE lesson_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_recordings

-- Anyone can view recordings
CREATE POLICY "Anyone can view recordings"
    ON lesson_recordings FOR SELECT
    USING (true);

-- Authenticated users can create recordings (typically done by system/admin)
CREATE POLICY "Admins can create recordings"
    ON lesson_recordings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Admins can update recordings
CREATE POLICY "Admins can update recordings"
    ON lesson_recordings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Admins can delete recordings
CREATE POLICY "Admins can delete recordings"
    ON lesson_recordings FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND roles @> ARRAY['admin']::text[]
        )
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_lesson_recordings_updated_at
    BEFORE UPDATE ON lesson_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-delete old recordings (optional, can be called via cron)
CREATE OR REPLACE FUNCTION delete_old_recordings(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM lesson_recordings
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Example AI notes structure (for reference)
-- {
--   "summary": "This session covered basic Quran recitation...",
--   "topics": ["Tajweed rules", "Surah Al-Fatiha", "Pronunciation"],
--   "questions": ["How to pronounce 'qaf'?", "When to use noon sakinah?"],
--   "homework": "Practice reciting Surah Al-Fatiha 10 times",
--   "feedback": "Student showed good progress with pronunciation",
--   "next_recommendations": "Move to Surah Al-Baqarah"
-- }
