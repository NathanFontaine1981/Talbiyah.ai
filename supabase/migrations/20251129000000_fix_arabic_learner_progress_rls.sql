-- Fix RLS policies for arabic_learner_progress table
-- This allows authenticated users (teachers/parents) to manage progress records for their students

-- First, let's ensure the table exists with correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'arabic_learner_progress') THEN
        CREATE TABLE arabic_learner_progress (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
            syllabus_id UUID NOT NULL REFERENCES arabic_syllabus(id) ON DELETE CASCADE,
            understanding_complete BOOLEAN DEFAULT false,
            practice_complete BOOLEAN DEFAULT false,
            mastery_complete BOOLEAN DEFAULT false,
            teacher_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(learner_id, syllabus_id)
        );
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE arabic_learner_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "arabic_learner_progress_select_policy" ON arabic_learner_progress;
DROP POLICY IF EXISTS "arabic_learner_progress_insert_policy" ON arabic_learner_progress;
DROP POLICY IF EXISTS "arabic_learner_progress_update_policy" ON arabic_learner_progress;
DROP POLICY IF EXISTS "arabic_learner_progress_delete_policy" ON arabic_learner_progress;

-- Policy: Teachers can view progress for their students
-- Policy: Parents can view progress for their children
-- Policy: Students can view their own progress
CREATE POLICY "arabic_learner_progress_select_policy" ON arabic_learner_progress
    FOR SELECT
    USING (
        -- User is the learner themselves
        learner_id IN (
            SELECT id FROM learners WHERE user_id = auth.uid()
        )
        OR
        -- User is a teacher who has taught this learner (via lessons)
        EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.teacher_id = auth.uid()
            AND l.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is a teacher assigned to this learner via student_teachers
        EXISTS (
            SELECT 1 FROM student_teachers st
            WHERE st.teacher_id = auth.uid()
            AND st.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is the parent of this learner
        EXISTS (
            SELECT 1 FROM learners l
            WHERE l.id = arabic_learner_progress.learner_id
            AND l.parent_id = auth.uid()
        )
        OR
        -- User is an admin
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Policy: Teachers can insert progress for their students
CREATE POLICY "arabic_learner_progress_insert_policy" ON arabic_learner_progress
    FOR INSERT
    WITH CHECK (
        -- User is a teacher who has taught this learner
        EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.teacher_id = auth.uid()
            AND l.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is a teacher assigned to this learner via student_teachers
        EXISTS (
            SELECT 1 FROM student_teachers st
            WHERE st.teacher_id = auth.uid()
            AND st.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is the parent of this learner
        EXISTS (
            SELECT 1 FROM learners l
            WHERE l.id = arabic_learner_progress.learner_id
            AND l.parent_id = auth.uid()
        )
        OR
        -- User is an admin
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Policy: Teachers can update progress for their students
CREATE POLICY "arabic_learner_progress_update_policy" ON arabic_learner_progress
    FOR UPDATE
    USING (
        -- User is a teacher who has taught this learner
        EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.teacher_id = auth.uid()
            AND l.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is a teacher assigned to this learner via student_teachers
        EXISTS (
            SELECT 1 FROM student_teachers st
            WHERE st.teacher_id = auth.uid()
            AND st.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is the parent of this learner
        EXISTS (
            SELECT 1 FROM learners l
            WHERE l.id = arabic_learner_progress.learner_id
            AND l.parent_id = auth.uid()
        )
        OR
        -- User is an admin
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Policy: Teachers can delete progress for their students (if needed)
CREATE POLICY "arabic_learner_progress_delete_policy" ON arabic_learner_progress
    FOR DELETE
    USING (
        -- User is a teacher who has taught this learner
        EXISTS (
            SELECT 1 FROM lessons l
            WHERE l.teacher_id = auth.uid()
            AND l.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is a teacher assigned to this learner via student_teachers
        EXISTS (
            SELECT 1 FROM student_teachers st
            WHERE st.teacher_id = auth.uid()
            AND st.learner_id = arabic_learner_progress.learner_id
        )
        OR
        -- User is an admin
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_arabic_learner_progress_learner_id ON arabic_learner_progress(learner_id);
CREATE INDEX IF NOT EXISTS idx_arabic_learner_progress_syllabus_id ON arabic_learner_progress(syllabus_id);

-- Also ensure arabic_syllabus table has public read access
ALTER TABLE arabic_syllabus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arabic_syllabus_public_read" ON arabic_syllabus;
CREATE POLICY "arabic_syllabus_public_read" ON arabic_syllabus
    FOR SELECT
    USING (true);
