-- Fix messaging system: Add unique constraint and create relationships for existing lessons

-- TASK 1: Add unique constraint (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_student_teacher_subject'
    ) THEN
        ALTER TABLE student_teacher_relationships
        ADD CONSTRAINT unique_student_teacher_subject
        UNIQUE (student_id, teacher_id, subject_id);
    END IF;
END $$;

-- TASK 2: Create relationships for existing credit-based lessons
INSERT INTO student_teacher_relationships (
    student_id,
    teacher_id,
    subject_id,
    first_paid_lesson_date,
    last_lesson_date,
    total_lessons,
    total_hours,
    status
)
SELECT DISTINCT
    l.learner_id,
    l.teacher_id,
    l.subject_id,
    MIN(l.scheduled_time::DATE) as first_paid_lesson_date,
    MAX(l.scheduled_time::DATE) as last_lesson_date,
    COUNT(*) as total_lessons,
    SUM(l.duration_minutes / 60.0) as total_hours,
    'active' as status
FROM lessons l
WHERE l.payment_method = 'credits'
AND COALESCE(l.is_trial, false) = false
AND NOT EXISTS (
    SELECT 1 FROM student_teacher_relationships str
    WHERE str.student_id = l.learner_id
    AND str.teacher_id = l.teacher_id
    AND (str.subject_id = l.subject_id OR (str.subject_id IS NULL AND l.subject_id IS NULL))
)
GROUP BY l.learner_id, l.teacher_id, l.subject_id
ON CONFLICT (student_id, teacher_id, subject_id) DO NOTHING;

-- TASK 3: Re-enable the auto-assign trigger (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'auto_assign_student_trigger'
    ) THEN
        ALTER TABLE lessons ENABLE TRIGGER auto_assign_student_trigger;
    END IF;
END $$;
