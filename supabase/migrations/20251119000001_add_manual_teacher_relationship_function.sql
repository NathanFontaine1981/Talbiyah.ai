-- Function to manually add a teacher-student relationship
-- This allows students to connect with teachers before booking a lesson
-- Enables messaging and easier booking

CREATE OR REPLACE FUNCTION manually_add_teacher_relationship(
  p_student_id UUID,
  p_teacher_id UUID,
  p_subject_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_relationship_id UUID;
BEGIN
  -- Check if relationship already exists
  SELECT id INTO v_relationship_id
  FROM student_teacher_relationships
  WHERE student_id = p_student_id
    AND teacher_id = p_teacher_id
    AND subject_id = p_subject_id;

  -- If exists, return existing ID
  IF v_relationship_id IS NOT NULL THEN
    RETURN v_relationship_id;
  END IF;

  -- Create new relationship
  INSERT INTO student_teacher_relationships (
    student_id,
    teacher_id,
    subject_id,
    first_paid_lesson_date,
    status,
    total_lessons,
    total_hours
  )
  VALUES (
    p_student_id,
    p_teacher_id,
    p_subject_id,
    CURRENT_DATE,
    'active',
    0,
    0
  )
  RETURNING id INTO v_relationship_id;

  RETURN v_relationship_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manually_add_teacher_relationship TO authenticated;

-- Add comment
COMMENT ON FUNCTION manually_add_teacher_relationship IS
  'Manually creates a student-teacher relationship for messaging and easier booking. Returns the relationship ID.';
