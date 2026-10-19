-- Enable RLS on homework_submissions (if not already enabled)
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "homework_select_policy" ON homework_submissions;
DROP POLICY IF EXISTS "homework_insert_policy" ON homework_submissions;
DROP POLICY IF EXISTS "homework_update_policy" ON homework_submissions;
DROP POLICY IF EXISTS "homework_delete_policy" ON homework_submissions;
DROP POLICY IF EXISTS "Students can view own homework" ON homework_submissions;
DROP POLICY IF EXISTS "Students can insert homework" ON homework_submissions;
DROP POLICY IF EXISTS "Students can update own homework" ON homework_submissions;
DROP POLICY IF EXISTS "Teachers can view student homework" ON homework_submissions;
DROP POLICY IF EXISTS "Teachers can update homework feedback" ON homework_submissions;

-- SELECT policy: Users can see their own submissions or teachers can see their students' submissions
CREATE POLICY "homework_select_policy" ON homework_submissions
FOR SELECT USING (
  -- Parent can see their children's submissions (via learner_id -> learners.parent_id)
  EXISTS (
    SELECT 1 FROM learners
    WHERE learners.id = homework_submissions.learner_id
    AND learners.parent_id = auth.uid()
  )
  -- Teacher can see submissions from students they teach
  OR EXISTS (
    SELECT 1 FROM lessons l
    JOIN teacher_profiles tp ON tp.id = l.teacher_id
    WHERE l.learner_id = homework_submissions.learner_id
    AND tp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM student_teachers st
    JOIN teacher_profiles tp ON tp.id = st.teacher_id
    WHERE st.student_id = homework_submissions.learner_id
    AND tp.user_id = auth.uid()
  )
  -- Admin can see all
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- INSERT policy: Parents can create submissions for their learners
CREATE POLICY "homework_insert_policy" ON homework_submissions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM learners
    WHERE learners.id = homework_submissions.learner_id
    AND learners.parent_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- UPDATE policy: Parents can update their own, teachers can add feedback
CREATE POLICY "homework_update_policy" ON homework_submissions
FOR UPDATE USING (
  -- Parent can update their children's submissions
  EXISTS (
    SELECT 1 FROM learners
    WHERE learners.id = homework_submissions.learner_id
    AND learners.parent_id = auth.uid()
  )
  -- Teachers can update submissions from their students (to add feedback)
  OR EXISTS (
    SELECT 1 FROM lessons l
    JOIN teacher_profiles tp ON tp.id = l.teacher_id
    WHERE l.learner_id = homework_submissions.learner_id
    AND tp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM student_teachers st
    JOIN teacher_profiles tp ON tp.id = st.teacher_id
    WHERE st.student_id = homework_submissions.learner_id
    AND tp.user_id = auth.uid()
  )
  -- Admin can update all
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- DELETE policy: Only parents can delete their children's draft submissions, admins can delete any
CREATE POLICY "homework_delete_policy" ON homework_submissions
FOR DELETE USING (
  (
    EXISTS (
      SELECT 1 FROM learners
      WHERE learners.id = homework_submissions.learner_id
      AND learners.parent_id = auth.uid()
    )
    AND status = 'draft'  -- Only allow deleting drafts
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_homework_submissions_learner_id ON homework_submissions(learner_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_syllabus_id ON homework_submissions(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_course_type ON homework_submissions(course_type);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_status ON homework_submissions(status);
