-- FIX: Create student_teacher_relationships table if it doesn't exist
-- This table tracks the relationship between students and their teachers

CREATE TABLE IF NOT EXISTS student_teacher_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES learners(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  primary_teacher BOOLEAN DEFAULT TRUE,
  first_paid_lesson_date DATE,
  last_lesson_date DATE,
  total_lessons INTEGER DEFAULT 0,
  total_hours NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  paused_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  end_reason TEXT,
  teacher_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'ended'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_student ON student_teacher_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_teacher ON student_teacher_relationships(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_status ON student_teacher_relationships(status);
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_subject ON student_teacher_relationships(subject_id);

-- Enable Row Level Security
ALTER TABLE student_teacher_relationships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their relationships" ON student_teacher_relationships;
DROP POLICY IF EXISTS "System can manage relationships" ON student_teacher_relationships;

-- Create RLS policies
CREATE POLICY "Users can view their relationships"
  ON student_teacher_relationships FOR SELECT
  USING (
    student_id IN (SELECT id FROM learners WHERE parent_id = auth.uid()) OR
    teacher_id = auth.uid()
  );

CREATE POLICY "System can manage relationships"
  ON student_teacher_relationships FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger function to auto-assign students to teachers
CREATE OR REPLACE FUNCTION auto_assign_student_to_teacher()
RETURNS TRIGGER AS $$
DECLARE
  is_trial BOOLEAN;
  relationship_id UUID;
  lesson_date DATE;
BEGIN
  -- Only process for booked lessons
  IF NEW.status != 'booked' THEN
    RETURN NEW;
  END IF;

  -- Check if this is a trial lesson
  is_trial := COALESCE(NEW.is_trial, false) OR COALESCE(NEW.price, 0) = 0;

  -- Only create relationships for paid lessons
  IF NOT is_trial THEN
    -- Get the lesson date
    lesson_date := COALESCE(NEW.scheduled_date, CURRENT_DATE);

    -- Check if relationship already exists
    SELECT id INTO relationship_id
    FROM student_teacher_relationships
    WHERE student_id = NEW.learner_id
    AND teacher_id = NEW.teacher_id
    AND (subject_id = NEW.subject_id OR (subject_id IS NULL AND NEW.subject_id IS NULL));

    IF relationship_id IS NULL THEN
      -- Create new relationship
      INSERT INTO student_teacher_relationships (
        student_id,
        teacher_id,
        subject_id,
        first_paid_lesson_date,
        last_lesson_date,
        total_lessons,
        total_hours,
        status
      ) VALUES (
        NEW.learner_id,
        NEW.teacher_id,
        NEW.subject_id,
        lesson_date,
        lesson_date,
        1,
        COALESCE(NEW.duration_minutes, 60) / 60.0,
        'active'
      );
    ELSE
      -- Update existing relationship
      UPDATE student_teacher_relationships
      SET total_lessons = total_lessons + 1,
          total_hours = total_hours + (COALESCE(NEW.duration_minutes, 60) / 60.0),
          last_lesson_date = GREATEST(last_lesson_date, lesson_date),
          updated_at = NOW()
      WHERE id = relationship_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_assign_student_trigger ON lessons;

-- Create trigger
CREATE TRIGGER auto_assign_student_trigger
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_student_to_teacher();

-- Recreate get_student_teachers function with correct schema
DROP FUNCTION IF EXISTS get_student_teachers(UUID);

CREATE OR REPLACE FUNCTION get_student_teachers(p_student_id UUID)
RETURNS TABLE(
  relationship_id UUID,
  teacher_id UUID,
  teacher_name TEXT,
  teacher_email TEXT,
  teacher_avatar TEXT,
  subject_name TEXT,
  total_lessons INTEGER,
  total_hours NUMERIC,
  first_lesson_date DATE,
  last_lesson_date DATE,
  status TEXT,
  next_lesson_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    str.id as relationship_id,
    str.teacher_id,
    p.full_name as teacher_name,
    p.email as teacher_email,
    p.avatar_url as teacher_avatar,
    s.name as subject_name,
    str.total_lessons,
    str.total_hours,
    str.first_paid_lesson_date as first_lesson_date,
    str.last_lesson_date,
    str.status,
    (
      SELECT MIN(
        CASE
          WHEN l.scheduled_date IS NOT NULL AND l.scheduled_time IS NOT NULL
          THEN l.scheduled_date::timestamp + l.scheduled_time::time
          ELSE NULL
        END
      )
      FROM lessons l
      WHERE l.learner_id = p_student_id
      AND l.teacher_id = str.teacher_id
      AND l.status = 'booked'
      AND l.scheduled_date::timestamp + l.scheduled_time::time > NOW()
    ) as next_lesson_time
  FROM student_teacher_relationships str
  JOIN profiles p ON str.teacher_id = p.id
  LEFT JOIN subjects s ON str.subject_id = s.id
  WHERE str.student_id = p_student_id
  AND str.status = 'active'
  ORDER BY str.last_lesson_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_teachers(UUID) TO anon;

-- Verify the table was created
SELECT 'student_teacher_relationships table created successfully' as status;
