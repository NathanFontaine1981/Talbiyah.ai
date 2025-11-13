-- Create Quran Progress Tracking Table
-- This table tracks each student's progress through the Quran across three learning stages

CREATE TABLE IF NOT EXISTS quran_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Quran reference
    surah_number INTEGER NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
    surah_name TEXT NOT NULL,
    ayah_number INTEGER NOT NULL CHECK (ayah_number >= 1),

    -- Understanding (Tadabbur) Stage
    understanding_completed BOOLEAN DEFAULT FALSE,
    understanding_level TEXT CHECK (understanding_level IN ('basic', 'intermediate', 'advanced', 'mastered')),
    understanding_confidence DECIMAL(3,2) CHECK (understanding_confidence >= 0 AND understanding_confidence <= 1),
    understanding_last_practiced TIMESTAMPTZ,

    -- Fluency (Tajweed) Stage
    fluency_completed BOOLEAN DEFAULT FALSE,
    fluency_level TEXT CHECK (fluency_level IN ('beginner', 'intermediate', 'advanced', 'mastered')),
    fluency_confidence DECIMAL(3,2) CHECK (fluency_confidence >= 0 AND fluency_confidence <= 1),
    fluency_last_practiced TIMESTAMPTZ,

    -- Memorization (Hifz) Stage
    memorization_completed BOOLEAN DEFAULT FALSE,
    memorization_level TEXT CHECK (memorization_level IN ('fresh', 'solid', 'strong', 'mastered')),
    memorization_confidence DECIMAL(3,2) CHECK (memorization_confidence >= 0 AND memorization_confidence <= 1),
    memorization_last_practiced TIMESTAMPTZ,
    memorization_next_review TIMESTAMPTZ,
    memorization_review_frequency TEXT CHECK (memorization_review_frequency IN ('daily', 'every_2_days', 'twice_weekly', 'weekly', 'monthly')),

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one record per student per ayah
    UNIQUE(student_id, surah_number, ayah_number)
);

-- Create indexes for efficient queries
CREATE INDEX idx_quran_progress_student ON quran_progress(student_id);
CREATE INDEX idx_quran_progress_surah ON quran_progress(surah_number, ayah_number);
CREATE INDEX idx_quran_progress_student_surah ON quran_progress(student_id, surah_number);
CREATE INDEX idx_quran_progress_understanding ON quran_progress(student_id, understanding_completed);
CREATE INDEX idx_quran_progress_fluency ON quran_progress(student_id, fluency_completed);
CREATE INDEX idx_quran_progress_memorization ON quran_progress(student_id, memorization_completed);
CREATE INDEX idx_quran_progress_review ON quran_progress(student_id, memorization_next_review) WHERE memorization_completed = TRUE;

-- Add RLS policies
ALTER TABLE quran_progress ENABLE ROW LEVEL SECURITY;

-- Students can view their own progress
CREATE POLICY "Students can view own Quran progress"
    ON quran_progress
    FOR SELECT
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Students can insert their own progress (via app)
CREATE POLICY "Students can insert own Quran progress"
    ON quran_progress
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Students can update their own progress
CREATE POLICY "Students can update own Quran progress"
    ON quran_progress
    FOR UPDATE
    USING (auth.uid() = student_id);

-- Teachers can view their students' progress
CREATE POLICY "Teachers can view their students Quran progress"
    ON quran_progress
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM student_teachers st
            INNER JOIN profiles p ON p.id = auth.uid()
            WHERE st.student_id = quran_progress.student_id
            AND st.teacher_id = auth.uid()
            AND p.role = 'teacher'
        )
    );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quran_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quran_progress_updated_at
    BEFORE UPDATE ON quran_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_quran_progress_updated_at();

-- Create view for overall progress summary
CREATE OR REPLACE VIEW quran_progress_summary AS
SELECT
    student_id,
    COUNT(DISTINCT surah_number) as surahs_started,
    COUNT(*) as total_ayat_tracked,
    SUM(CASE WHEN understanding_completed THEN 1 ELSE 0 END) as understanding_completed_count,
    SUM(CASE WHEN fluency_completed THEN 1 ELSE 0 END) as fluency_completed_count,
    SUM(CASE WHEN memorization_completed THEN 1 ELSE 0 END) as memorization_completed_count,
    ROUND(AVG(CASE WHEN understanding_completed THEN understanding_confidence ELSE NULL END), 2) as avg_understanding_confidence,
    ROUND(AVG(CASE WHEN fluency_completed THEN fluency_confidence ELSE NULL END), 2) as avg_fluency_confidence,
    ROUND(AVG(CASE WHEN memorization_completed THEN memorization_confidence ELSE NULL END), 2) as avg_memorization_confidence,
    MAX(understanding_last_practiced) as last_understanding_practice,
    MAX(fluency_last_practiced) as last_fluency_practice,
    MAX(memorization_last_practiced) as last_memorization_practice
FROM quran_progress
GROUP BY student_id;

-- Grant access to the view
GRANT SELECT ON quran_progress_summary TO authenticated;

-- Create function to get ayat needing review
CREATE OR REPLACE FUNCTION get_ayat_needing_review(
    p_student_id UUID,
    p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
    surah_number INTEGER,
    surah_name TEXT,
    ayah_number INTEGER,
    memorization_level TEXT,
    next_review TIMESTAMPTZ,
    days_until_review INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        qp.surah_number,
        qp.surah_name,
        qp.ayah_number,
        qp.memorization_level,
        qp.memorization_next_review,
        EXTRACT(DAY FROM (qp.memorization_next_review - NOW()))::INTEGER as days_until_review
    FROM quran_progress qp
    WHERE qp.student_id = p_student_id
    AND qp.memorization_completed = TRUE
    AND qp.memorization_next_review <= (NOW() + (p_days_ahead || ' days')::INTERVAL)
    ORDER BY qp.memorization_next_review ASC, qp.surah_number ASC, qp.ayah_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate spaced repetition schedule
CREATE OR REPLACE FUNCTION calculate_next_review_date(
    p_last_practiced TIMESTAMPTZ,
    p_memorization_level TEXT
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN CASE p_memorization_level
        WHEN 'fresh' THEN p_last_practiced + INTERVAL '1 day'
        WHEN 'solid' THEN p_last_practiced + INTERVAL '3 days'
        WHEN 'strong' THEN p_last_practiced + INTERVAL '7 days'
        WHEN 'mastered' THEN p_last_practiced + INTERVAL '30 days'
        ELSE p_last_practiced + INTERVAL '1 day'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate next review date for memorization
CREATE OR REPLACE FUNCTION auto_calculate_memorization_review()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.memorization_completed = TRUE AND NEW.memorization_level IS NOT NULL THEN
        IF NEW.memorization_last_practiced IS NOT NULL THEN
            NEW.memorization_next_review := calculate_next_review_date(
                NEW.memorization_last_practiced,
                NEW.memorization_level
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_memorization_review
    BEFORE INSERT OR UPDATE ON quran_progress
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_memorization_review();

-- Add comments for documentation
COMMENT ON TABLE quran_progress IS 'Tracks student progress through the Quran across three learning stages: Understanding (Tadabbur), Fluency (Tajweed), and Memorization (Hifz)';
COMMENT ON COLUMN quran_progress.understanding_completed IS 'Has the student learned the meaning and tafsir of this ayah?';
COMMENT ON COLUMN quran_progress.fluency_completed IS 'Can the student recite this ayah with proper tajweed?';
COMMENT ON COLUMN quran_progress.memorization_completed IS 'Has the student memorized this ayah?';
COMMENT ON COLUMN quran_progress.memorization_next_review IS 'When should this ayah be reviewed next? Auto-calculated based on spaced repetition.';
COMMENT ON FUNCTION get_ayat_needing_review IS 'Returns list of memorized ayat that need review within the specified number of days';
COMMENT ON FUNCTION calculate_next_review_date IS 'Calculates the next review date based on spaced repetition principles';
