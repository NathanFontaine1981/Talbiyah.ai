-- Add teacher_general_notes column to student_teacher_relationships
-- This column stores general notes from teachers about their students' Quran progress
-- These notes are visible to students on their Quran Progress page

ALTER TABLE student_teacher_relationships
ADD COLUMN IF NOT EXISTS teacher_general_notes TEXT;

-- Add a comment to the column
COMMENT ON COLUMN student_teacher_relationships.teacher_general_notes IS 'Teacher notes about student progress, visible to the student';
