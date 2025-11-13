-- Create student_teachers table for teacher-student assignments
CREATE TABLE IF NOT EXISTS student_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, teacher_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_student_teachers_student_id ON student_teachers(student_id);
CREATE INDEX idx_student_teachers_teacher_id ON student_teachers(teacher_id);
CREATE INDEX idx_student_teachers_is_active ON student_teachers(is_active);

-- Enable RLS
ALTER TABLE student_teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Students can view their own assigned teachers
CREATE POLICY "Students can view their own teachers"
  ON student_teachers
  FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can view students assigned to them
CREATE POLICY "Teachers can view their assigned students"
  ON student_teachers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.user_id = auth.uid()
      AND teacher_profiles.id = student_teachers.teacher_id
    )
  );

-- Students can assign teachers to themselves
CREATE POLICY "Students can assign teachers"
  ON student_teachers
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can remove their teacher assignments
CREATE POLICY "Students can remove their teachers"
  ON student_teachers
  FOR DELETE
  USING (auth.uid() = student_id);

-- Students can update their teacher assignments (e.g., notes, active status)
CREATE POLICY "Students can update their teacher assignments"
  ON student_teachers
  FOR UPDATE
  USING (auth.uid() = student_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER student_teachers_updated_at
  BEFORE UPDATE ON student_teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_student_teachers_updated_at();

-- Add comment
COMMENT ON TABLE student_teachers IS 'Stores teacher-student assignments for progress tracking';
