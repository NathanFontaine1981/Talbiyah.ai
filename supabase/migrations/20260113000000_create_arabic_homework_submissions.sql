-- Create arabic_homework_submissions table for tracking Arabic-specific homework
-- This is similar to homework_submissions but tailored for Arabic language learning

CREATE TABLE IF NOT EXISTS arabic_homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to learner and lesson
    learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teacher_profiles(id),
    syllabus_id UUID REFERENCES arabic_syllabus(id) ON DELETE SET NULL,

    -- Assignment details
    title TEXT,
    description TEXT,
    homework_type TEXT DEFAULT 'practice' CHECK (homework_type IN ('vocabulary', 'grammar', 'conversation', 'writing', 'reading', 'listening', 'practice', 'review')),

    -- Vocabulary practice tracking
    vocabulary_words TEXT[], -- Words assigned for practice
    vocabulary_completed JSONB, -- [{word: "...", practiced: true, correct: true}]
    vocabulary_score INTEGER,

    -- Grammar exercises
    grammar_exercises JSONB, -- [{exercise: "...", answer: "...", correct: true}]
    grammar_score INTEGER,

    -- Audio/pronunciation practice
    audio_recordings JSONB, -- [{url: "...", duration: 30, feedback: "..."}]

    -- Written work
    written_work TEXT,
    writing_feedback TEXT,

    -- Status tracking
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'reviewed', 'completed', 'needs_revision')),
    due_date DATE,
    submitted_at TIMESTAMPTZ,

    -- Teacher feedback
    teacher_feedback TEXT,
    teacher_rating TEXT CHECK (teacher_rating IN ('excellent', 'good', 'satisfactory', 'needs_improvement')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_arabic_hw_learner ON arabic_homework_submissions(learner_id);
CREATE INDEX IF NOT EXISTS idx_arabic_hw_teacher ON arabic_homework_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_arabic_hw_status ON arabic_homework_submissions(status);
CREATE INDEX IF NOT EXISTS idx_arabic_hw_lesson ON arabic_homework_submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_arabic_hw_syllabus ON arabic_homework_submissions(syllabus_id);

-- Enable RLS
ALTER TABLE arabic_homework_submissions ENABLE ROW LEVEL SECURITY;

-- Parents can view/manage submissions for their children
CREATE POLICY "Parents manage child Arabic homework" ON arabic_homework_submissions
    FOR ALL
    TO authenticated
    USING (
        learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
    )
    WITH CHECK (
        learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
    );

-- Teachers can view submissions for their students
CREATE POLICY "Teachers view Arabic homework" ON arabic_homework_submissions
    FOR SELECT
    TO authenticated
    USING (
        teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM lessons l
            JOIN teacher_profiles tp ON tp.id = l.teacher_id
            WHERE l.learner_id = arabic_homework_submissions.learner_id
            AND tp.user_id = auth.uid()
        )
    );

-- Teachers can create homework for their students
CREATE POLICY "Teachers create Arabic homework" ON arabic_homework_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp
            WHERE tp.user_id = auth.uid()
        )
    );

-- Teachers can update/review homework
CREATE POLICY "Teachers update Arabic homework" ON arabic_homework_submissions
    FOR UPDATE
    TO authenticated
    USING (
        teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM lessons l
            JOIN teacher_profiles tp ON tp.id = l.teacher_id
            WHERE l.learner_id = arabic_homework_submissions.learner_id
            AND tp.user_id = auth.uid()
        )
    );

-- Admins can view all submissions
CREATE POLICY "Admins manage all Arabic homework" ON arabic_homework_submissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

-- Update trigger for updated_at
CREATE TRIGGER update_arabic_homework_updated_at
    BEFORE UPDATE ON arabic_homework_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE arabic_homework_submissions IS 'Tracks Arabic language homework submissions for Al-Arabiyyah Bayna Yadayk curriculum';
