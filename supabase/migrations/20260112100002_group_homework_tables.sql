-- Migration: Create group homework assignment and submission tables
-- This enables teachers to assign homework to group lesson participants

-- 1. Create group homework assignments table
CREATE TABLE IF NOT EXISTS group_homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),

  -- Assignment details
  title TEXT NOT NULL,
  description TEXT,
  homework_type TEXT NOT NULL CHECK (homework_type IN ('practice', 'memorization', 'revision', 'reading', 'listening', 'worksheet', 'reflection', 'other')),

  -- Content (for Quran-related homework)
  surah_number INTEGER,
  ayat_start INTEGER,
  ayat_end INTEGER,

  -- Additional resources
  resource_url TEXT,

  -- Dates
  assigned_at TIMESTAMPTZ DEFAULT now(),
  due_date DATE,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create group homework submissions table (one per student per assignment)
CREATE TABLE IF NOT EXISTS group_homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES group_homework_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),

  -- Submission status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'graded', 'late')),

  -- Student submission
  submitted_at TIMESTAMPTZ,
  submission_notes TEXT,
  recording_url TEXT,
  file_urls TEXT[],

  -- Teacher grading
  grade TEXT CHECK (grade IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'incomplete')),
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(assignment_id, student_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_homework_assignments_session
  ON group_homework_assignments(group_session_id);

CREATE INDEX IF NOT EXISTS idx_group_homework_assignments_status
  ON group_homework_assignments(status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_group_homework_submissions_assignment
  ON group_homework_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_group_homework_submissions_student
  ON group_homework_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_group_homework_submissions_status
  ON group_homework_submissions(status)
  WHERE status IN ('pending', 'submitted');

-- 4. Enable RLS
ALTER TABLE group_homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_homework_submissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for group_homework_assignments

-- Teachers can view/create/update assignments for their sessions
CREATE POLICY "Teachers manage their group homework"
  ON group_homework_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_sessions gs
      JOIN teacher_profiles tp ON gs.teacher_id = tp.id
      WHERE gs.id = group_homework_assignments.group_session_id
      AND tp.user_id = auth.uid()
    )
  );

-- Students can view assignments for sessions they're enrolled in
CREATE POLICY "Students view their group homework"
  ON group_homework_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_session_participants gsp
      WHERE gsp.group_session_id = group_homework_assignments.group_session_id
      AND gsp.student_id = auth.uid()
    )
  );

-- Admins can manage all assignments
CREATE POLICY "Admins manage all group homework"
  ON group_homework_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- 6. RLS Policies for group_homework_submissions

-- Students can view/update their own submissions
CREATE POLICY "Students manage own submissions"
  ON group_homework_submissions
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view/grade submissions for their sessions
CREATE POLICY "Teachers manage submissions for their sessions"
  ON group_homework_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_homework_assignments gha
      JOIN group_sessions gs ON gha.group_session_id = gs.id
      JOIN teacher_profiles tp ON gs.teacher_id = tp.id
      WHERE gha.id = group_homework_submissions.assignment_id
      AND tp.user_id = auth.uid()
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins view all submissions"
  ON group_homework_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- 7. Function to create submissions for all enrolled students when assignment is created
CREATE OR REPLACE FUNCTION create_group_homework_submissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a submission record for each enrolled student
  INSERT INTO group_homework_submissions (assignment_id, student_id)
  SELECT NEW.id, gsp.student_id
  FROM group_session_participants gsp
  WHERE gsp.group_session_id = NEW.group_session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to auto-create submissions
CREATE TRIGGER trigger_create_group_homework_submissions
  AFTER INSERT ON group_homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_group_homework_submissions();

-- 9. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_homework_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Triggers for updated_at
CREATE TRIGGER trigger_group_homework_assignments_updated_at
  BEFORE UPDATE ON group_homework_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_group_homework_updated_at();

CREATE TRIGGER trigger_group_homework_submissions_updated_at
  BEFORE UPDATE ON group_homework_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_group_homework_updated_at();

-- 11. View for teachers to see homework status across their group sessions
CREATE OR REPLACE VIEW teacher_group_homework_overview AS
SELECT
  gha.id as assignment_id,
  gha.group_session_id,
  gs.name as session_name,
  gha.title,
  gha.homework_type,
  gha.due_date,
  gha.status as assignment_status,
  gha.assigned_at,
  COUNT(ghs.id) as total_students,
  COUNT(CASE WHEN ghs.status = 'submitted' THEN 1 END) as submitted_count,
  COUNT(CASE WHEN ghs.status = 'graded' THEN 1 END) as graded_count,
  COUNT(CASE WHEN ghs.status = 'pending' THEN 1 END) as pending_count
FROM group_homework_assignments gha
JOIN group_sessions gs ON gha.group_session_id = gs.id
LEFT JOIN group_homework_submissions ghs ON ghs.assignment_id = gha.id
GROUP BY gha.id, gs.id;

COMMENT ON TABLE group_homework_assignments IS 'Homework assignments for group lesson sessions';
COMMENT ON TABLE group_homework_submissions IS 'Individual student submissions for group homework';
COMMENT ON COLUMN group_homework_submissions.grade IS 'Teacher grading: excellent, good, satisfactory, needs_improvement, incomplete';
