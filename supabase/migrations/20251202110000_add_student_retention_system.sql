-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STUDENT RETENTION SYSTEM FOR TEACHER TIERS
-- Replace rating-based progression with retention-based progression
-- Retention = % of students who return for 2+ lessons
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Add retention columns to teacher_tiers
ALTER TABLE teacher_tiers
ADD COLUMN IF NOT EXISTS min_retention_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_students_for_retention INTEGER DEFAULT 5;

-- 2. Update tier retention requirements
UPDATE teacher_tiers SET min_retention_rate = 0, min_students_for_retention = 0 WHERE tier = 'newcomer';
UPDATE teacher_tiers SET min_retention_rate = 50, min_students_for_retention = 5 WHERE tier = 'apprentice';
UPDATE teacher_tiers SET min_retention_rate = 60, min_students_for_retention = 10 WHERE tier = 'skilled';
UPDATE teacher_tiers SET min_retention_rate = 70, min_students_for_retention = 15 WHERE tier = 'expert';
UPDATE teacher_tiers SET min_retention_rate = 80, min_students_for_retention = 20 WHERE tier = 'master';

-- 3. Add retention tracking columns to teacher_profiles
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS retention_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS returning_students INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_unique_students INTEGER DEFAULT 0;

-- 4. Create function to calculate teacher retention rate
CREATE OR REPLACE FUNCTION calculate_teacher_retention(p_teacher_id UUID)
RETURNS TABLE(
  total_unique_students INTEGER,
  returning_students INTEGER,
  retention_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH student_lesson_counts AS (
    SELECT
      learner_id,
      COUNT(*) as lesson_count
    FROM lessons
    WHERE teacher_id = p_teacher_id
    AND status = 'completed'
    AND learner_id IS NOT NULL
    GROUP BY learner_id
  )
  SELECT
    COUNT(*)::INTEGER as total_unique_students,
    COUNT(CASE WHEN lesson_count >= 2 THEN 1 END)::INTEGER as returning_students,
    CASE
      WHEN COUNT(*) >= 5 THEN
        ROUND((COUNT(CASE WHEN lesson_count >= 2 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
      ELSE 0
    END as retention_rate
  FROM student_lesson_counts;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to update all teacher retention rates
CREATE OR REPLACE FUNCTION update_all_teacher_retention_rates()
RETURNS void AS $$
DECLARE
  teacher_record RECORD;
  retention_data RECORD;
BEGIN
  FOR teacher_record IN
    SELECT id FROM teacher_profiles WHERE status = 'approved'
  LOOP
    SELECT * INTO retention_data FROM calculate_teacher_retention(teacher_record.id);

    UPDATE teacher_profiles
    SET
      retention_rate = COALESCE(retention_data.retention_rate, 0),
      returning_students = COALESCE(retention_data.returning_students, 0),
      total_unique_students = COALESCE(retention_data.total_unique_students, 0),
      updated_at = NOW()
    WHERE id = teacher_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update retention after lesson completion
CREATE OR REPLACE FUNCTION update_teacher_retention_on_lesson_complete()
RETURNS TRIGGER AS $$
DECLARE
  retention_data RECORD;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT * INTO retention_data FROM calculate_teacher_retention(NEW.teacher_id);

    UPDATE teacher_profiles
    SET
      retention_rate = COALESCE(retention_data.retention_rate, 0),
      returning_students = COALESCE(retention_data.returning_students, 0),
      total_unique_students = COALESCE(retention_data.total_unique_students, 0),
      updated_at = NOW()
    WHERE id = NEW.teacher_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_retention_on_lesson_complete ON lessons;
CREATE TRIGGER trigger_update_retention_on_lesson_complete
  AFTER UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_retention_on_lesson_complete();

-- 7. Run initial retention calculation for all teachers
SELECT update_all_teacher_retention_rates();

-- 8. Update qualifications_required to reflect retention instead of rating
UPDATE teacher_tiers
SET qualifications_required = ARRAY['None - Starting point for new teachers']
WHERE tier = 'newcomer';

UPDATE teacher_tiers
SET qualifications_required = ARRAY['50+ hours taught', '50% student retention (5+ students)', 'OR 1-2 years teaching experience']
WHERE tier = 'apprentice';

UPDATE teacher_tiers
SET qualifications_required = ARRAY['150+ hours taught', '60% student retention (10+ students)', 'OR 3+ years experience', 'OR basic teaching certificate']
WHERE tier = 'skilled';

UPDATE teacher_tiers
SET qualifications_required = ARRAY['Ijazah in Quran OR Islamic degree', 'OR 5+ years teaching experience', '70% student retention (15+ students)', 'Fluent English (C1+)', 'Admin interview passed']
WHERE tier = 'expert';

UPDATE teacher_tiers
SET qualifications_required = ARRAY['Multiple Ijazahs (Quran + Qira''at)', 'Al-Azhar University degree OR equivalent', '80% student retention (20+ students)', 'Native/Near-native English', 'Admin interview + demonstration']
WHERE tier = 'master';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION COMPLETE
-- ✅ Added retention rate columns to teacher_tiers
-- ✅ Added retention tracking to teacher_profiles
-- ✅ Created retention calculation function
-- ✅ Created trigger for automatic retention updates
-- ✅ Updated tier requirements to use retention
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
