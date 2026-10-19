-- Create homework_submissions table for tracking student homework from insights
CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to lesson and insight
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    insight_id UUID REFERENCES lesson_insights(id) ON DELETE SET NULL,
    learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teacher_profiles(id),
    parent_id UUID REFERENCES profiles(id), -- Who submitted (parent on behalf of child)

    -- Quiz completion data
    quiz_answers JSONB, -- [{questionIndex: 0, selectedAnswer: 1, correct: true, question: "...", correctAnswer: 2}]
    quiz_score INTEGER, -- Number correct
    quiz_total INTEGER, -- Total questions
    quiz_completed_at TIMESTAMPTZ,

    -- Task completion data (from homework section)
    completed_tasks JSONB, -- [{task: "Write 5 sentences...", completed: true, completedAt: "..."}]
    tasks_completed_count INTEGER DEFAULT 0,
    tasks_total_count INTEGER DEFAULT 0,

    -- Vocabulary practice
    vocabulary_practiced JSONB, -- [{word: "مطبخ", practiced: true, timesFlipped: 3}]
    vocabulary_practiced_count INTEGER DEFAULT 0,

    -- Student reflections
    student_notes TEXT, -- Any notes the student wants to add
    questions_for_teacher TEXT, -- Questions for the teacher
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5), -- 1=easy, 5=very hard
    time_spent_minutes INTEGER, -- Self-reported time spent
    confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5), -- How confident after lesson

    -- File uploads (for written homework, recordings, etc.)
    uploaded_files JSONB, -- [{url: "...", filename: "...", type: "image/png", description: "..."}]

    -- Submission status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'needs_revision')),
    submitted_at TIMESTAMPTZ,

    -- Teacher feedback
    teacher_feedback TEXT,
    teacher_rating TEXT CHECK (teacher_rating IN ('excellent', 'good', 'satisfactory', 'needs_improvement')),
    teacher_encouragement TEXT, -- Positive feedback
    areas_to_focus TEXT[], -- Specific areas to work on
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hw_submissions_lesson ON homework_submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_hw_submissions_learner ON homework_submissions(learner_id);
CREATE INDEX IF NOT EXISTS idx_hw_submissions_teacher ON homework_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_hw_submissions_status ON homework_submissions(status);
CREATE INDEX IF NOT EXISTS idx_hw_submissions_insight ON homework_submissions(insight_id);

-- Unique constraint for upsert (one submission per lesson per learner)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hw_submissions_lesson_learner_unique ON homework_submissions(lesson_id, learner_id);

-- Enable RLS
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Parents can view/create/update submissions for their children
DROP POLICY IF EXISTS "Parents manage child submissions" ON homework_submissions;
CREATE POLICY "Parents manage child submissions" ON homework_submissions
    FOR ALL
    TO authenticated
    USING (
        learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
        OR parent_id = auth.uid()
    )
    WITH CHECK (
        learner_id IN (SELECT id FROM learners WHERE parent_id = auth.uid())
        OR parent_id = auth.uid()
    );

-- Teachers can view submissions for lessons they taught
DROP POLICY IF EXISTS "Teachers view their submissions" ON homework_submissions;
CREATE POLICY "Teachers view their submissions" ON homework_submissions
    FOR SELECT
    TO authenticated
    USING (
        teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    );

-- Teachers can update (add feedback) to submissions for their lessons
DROP POLICY IF EXISTS "Teachers give feedback" ON homework_submissions;
CREATE POLICY "Teachers give feedback" ON homework_submissions
    FOR UPDATE
    TO authenticated
    USING (
        teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    );

-- Admins can view all submissions
DROP POLICY IF EXISTS "Admins view all submissions" ON homework_submissions;
CREATE POLICY "Admins view all submissions" ON homework_submissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
    );

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_homework_submissions_updated_at ON homework_submissions;
CREATE TRIGGER update_homework_submissions_updated_at
BEFORE UPDATE ON homework_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add viewed_by_student and student_viewed_at to lesson_insights if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'lesson_insights' AND column_name = 'viewed_by_student') THEN
        ALTER TABLE lesson_insights ADD COLUMN viewed_by_student BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'lesson_insights' AND column_name = 'student_viewed_at') THEN
        ALTER TABLE lesson_insights ADD COLUMN student_viewed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'lesson_insights' AND column_name = 'student_rating') THEN
        ALTER TABLE lesson_insights ADD COLUMN student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5);
    END IF;
END $$;
