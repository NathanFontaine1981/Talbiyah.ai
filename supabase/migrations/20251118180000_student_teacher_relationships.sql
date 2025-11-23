-- Student-Teacher Relationships System
-- Auto-assigns students to teachers on first PAID lesson
-- Tracks relationship stats and enables "My Students" / "My Teachers" features

-- Student-Teacher relationships table
CREATE TABLE IF NOT EXISTS student_teacher_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES learners(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  primary_teacher BOOLEAN DEFAULT TRUE,
  first_paid_lesson_date DATE NOT NULL,
  last_lesson_date DATE,
  total_lessons INTEGER DEFAULT 1,
  total_hours NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  paused_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  end_reason TEXT,
  teacher_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, teacher_id, subject_id),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'ended'))
);

-- Function: Auto-assign student to teacher on first PAID lesson
CREATE OR REPLACE FUNCTION auto_assign_student_to_teacher()
RETURNS TRIGGER AS $$
DECLARE
  is_trial BOOLEAN;
  relationship_id UUID;
BEGIN
  -- Only process when lesson is booked
  IF NEW.status != 'booked' THEN
    RETURN NEW;
  END IF;

  -- Check if this is a trial lesson (either flag set or price is 0)
  is_trial := COALESCE(NEW.is_trial, false) OR COALESCE(NEW.price, 0) = 0;

  -- Only create relationships for PAID lessons
  IF NOT is_trial THEN
    -- Check if relationship already exists
    SELECT id INTO relationship_id
    FROM student_teacher_relationships
    WHERE student_id = NEW.learner_id
    AND teacher_id = NEW.teacher_id
    AND (subject_id = NEW.subject_id OR (subject_id IS NULL AND NEW.subject_id IS NULL));

    IF relationship_id IS NULL THEN
      -- Create new relationship on first paid lesson
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
        CURRENT_DATE,
        NEW.scheduled_time::DATE,
        1,
        NEW.duration_minutes / 60.0,
        'active'
      );
    ELSE
      -- Update existing relationship stats
      UPDATE student_teacher_relationships
      SET total_lessons = total_lessons + 1,
          total_hours = total_hours + (NEW.duration_minutes / 60.0),
          last_lesson_date = NEW.scheduled_time::DATE,
          updated_at = NOW()
      WHERE id = relationship_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-assign on lesson insert
DROP TRIGGER IF EXISTS auto_assign_student_trigger ON lessons;
CREATE TRIGGER auto_assign_student_trigger
  AFTER INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_student_to_teacher();

-- Function: Update relationship when lesson is completed
CREATE OR REPLACE FUNCTION update_relationship_on_lesson_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update last lesson date when lesson completes
    UPDATE student_teacher_relationships
    SET last_lesson_date = NEW.scheduled_time::DATE,
        updated_at = NOW()
    WHERE student_id = NEW.learner_id
    AND teacher_id = NEW.teacher_id
    AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update relationship on lesson completion
DROP TRIGGER IF EXISTS update_relationship_on_complete_trigger ON lessons;
CREATE TRIGGER update_relationship_on_complete_trigger
  AFTER UPDATE OF status ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_relationship_on_lesson_complete();

-- Function: Get teacher's students with stats
CREATE OR REPLACE FUNCTION get_teacher_students(p_teacher_id UUID)
RETURNS TABLE(
  relationship_id UUID,
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  student_avatar TEXT,
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
    str.id,
    l.id,
    p.full_name,
    p.email,
    p.avatar_url,
    s.name,
    str.total_lessons,
    str.total_hours,
    str.first_paid_lesson_date,
    str.last_lesson_date,
    str.status,
    (
      SELECT MIN(les.scheduled_time)
      FROM lessons les
      WHERE les.learner_id = l.id
      AND les.teacher_id = p_teacher_id
      AND les.status = 'booked'
      AND les.scheduled_time > NOW()
    ) AS next_lesson_time
  FROM student_teacher_relationships str
  JOIN learners l ON str.student_id = l.id
  JOIN profiles p ON l.parent_id = p.id
  LEFT JOIN subjects s ON str.subject_id = s.id
  WHERE str.teacher_id = p_teacher_id
  AND str.status = 'active'
  ORDER BY str.last_lesson_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get student's teachers with stats
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
    str.id,
    tp.id,
    p.full_name,
    p.email,
    p.avatar_url,
    s.name,
    str.total_lessons,
    str.total_hours,
    str.first_paid_lesson_date,
    str.last_lesson_date,
    str.status,
    (
      SELECT MIN(les.scheduled_time)
      FROM lessons les
      WHERE les.learner_id = p_student_id
      AND les.teacher_id = tp.id
      AND les.status = 'booked'
      AND les.scheduled_time > NOW()
    ) AS next_lesson_time
  FROM student_teacher_relationships str
  JOIN teacher_profiles tp ON str.teacher_id = tp.id
  JOIN profiles p ON tp.user_id = p.id
  LEFT JOIN subjects s ON str.subject_id = s.id
  WHERE str.student_id = p_student_id
  AND str.status = 'active'
  ORDER BY str.last_lesson_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Switch primary teacher
CREATE OR REPLACE FUNCTION switch_primary_teacher(
  p_student_id UUID,
  p_old_teacher_id UUID,
  p_new_teacher_id UUID,
  p_subject_id UUID
) RETURNS void AS $$
BEGIN
  -- End relationship with old teacher
  UPDATE student_teacher_relationships
  SET status = 'ended',
      ended_at = NOW(),
      end_reason = 'Student switched teachers',
      updated_at = NOW()
  WHERE student_id = p_student_id
  AND teacher_id = p_old_teacher_id
  AND (subject_id = p_subject_id OR (subject_id IS NULL AND p_subject_id IS NULL));
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_student ON student_teacher_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_teacher ON student_teacher_relationships(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_status ON student_teacher_relationships(status);
CREATE INDEX IF NOT EXISTS idx_student_teacher_rel_subject ON student_teacher_relationships(subject_id);

-- Row Level Security
ALTER TABLE student_teacher_relationships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their relationships
DROP POLICY IF EXISTS "Users can view their relationships" ON student_teacher_relationships;
CREATE POLICY "Users can view their relationships"
  ON student_teacher_relationships FOR SELECT
  USING (
    student_id IN (SELECT id FROM learners WHERE parent_id = auth.uid()) OR
    teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles))
  );

-- Policy: System can insert relationships (via trigger)
DROP POLICY IF EXISTS "System can insert relationships" ON student_teacher_relationships;
CREATE POLICY "System can insert relationships"
  ON student_teacher_relationships FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their relationships
DROP POLICY IF EXISTS "Users can update their relationships" ON student_teacher_relationships;
CREATE POLICY "Users can update their relationships"
  ON student_teacher_relationships FOR UPDATE
  USING (
    student_id IN (SELECT id FROM learners WHERE parent_id = auth.uid()) OR
    teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
  );

-- Comments for documentation
COMMENT ON TABLE student_teacher_relationships IS 'Tracks student-teacher relationships created on first paid lesson';
COMMENT ON FUNCTION auto_assign_student_to_teacher IS 'Automatically creates relationship on first PAID lesson (not trial)';
COMMENT ON FUNCTION get_teacher_students IS 'Returns all active students for a teacher with stats';
COMMENT ON FUNCTION get_student_teachers IS 'Returns all active teachers for a student with stats';
COMMENT ON FUNCTION switch_primary_teacher IS 'Ends relationship with old teacher when student switches';
