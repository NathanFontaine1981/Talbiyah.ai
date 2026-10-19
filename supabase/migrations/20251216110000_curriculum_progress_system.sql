-- Curriculum Progress System Migration
-- Implements the Talbiyah Methodology: Understanding (Fahm) → Fluency (Itqan) → Memorization (Hifz)

-- =============================================
-- PART 1: Curriculum Structure Tables
-- =============================================

-- Curriculum Subjects (e.g., Quran Reading, Arabic, Islamic Studies)
CREATE TABLE IF NOT EXISTS curriculum_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_arabic text,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Curriculum Phases (major learning stages within a subject)
CREATE TABLE IF NOT EXISTS curriculum_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_arabic text,
  slug text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  estimated_hours integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(subject_id, slug)
);

-- Curriculum Stages (sub-stages within phases)
CREATE TABLE IF NOT EXISTS curriculum_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES curriculum_phases(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_arabic text,
  slug text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  estimated_hours integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(phase_id, slug)
);

-- Curriculum Milestones (specific learning objectives)
CREATE TABLE IF NOT EXISTS curriculum_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES curriculum_stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_arabic text,
  slug text NOT NULL,
  description text,
  -- The Three Pillars for Quran students
  pillar text CHECK (pillar IN ('fahm', 'itqan', 'hifz')), -- Understanding, Fluency, Memorization
  sort_order integer DEFAULT 0,
  estimated_lessons integer,
  -- Verification requirements
  requires_verification boolean DEFAULT true,
  verification_criteria text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(stage_id, slug)
);

-- Indexes for curriculum structure
CREATE INDEX IF NOT EXISTS idx_curriculum_phases_subject ON curriculum_phases(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_stages_phase ON curriculum_stages(phase_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_milestones_stage ON curriculum_milestones(stage_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_milestones_pillar ON curriculum_milestones(pillar);

-- =============================================
-- PART 2: Student Progress Tables
-- =============================================

-- Student Curriculum Progress (overall progress in a subject)
CREATE TABLE IF NOT EXISTS student_curriculum_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  current_phase_id uuid REFERENCES curriculum_phases(id),
  current_stage_id uuid REFERENCES curriculum_stages(id),
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  total_lessons_completed integer DEFAULT 0,
  total_hours_studied numeric(10,2) DEFAULT 0,
  overall_progress_percentage numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Student Milestone Progress (progress on individual milestones)
CREATE TABLE IF NOT EXISTS student_milestone_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES curriculum_milestones(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'pending_verification', 'verified', 'mastered')),
  progress_percentage numeric(5,2) DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, milestone_id)
);

-- Student Surah Progress (specific to Quran students - Three Pillars tracking)
CREATE TABLE IF NOT EXISTS student_surah_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number integer NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
  surah_name text NOT NULL,
  surah_name_arabic text,
  total_ayat integer NOT NULL,
  -- Three Pillars Progress
  fahm_progress integer DEFAULT 0, -- Understanding: ayat count
  fahm_completed boolean DEFAULT false,
  fahm_verified_at timestamptz,
  fahm_verified_by uuid REFERENCES auth.users(id),
  itqan_progress integer DEFAULT 0, -- Fluency: ayat count
  itqan_completed boolean DEFAULT false,
  itqan_verified_at timestamptz,
  itqan_verified_by uuid REFERENCES auth.users(id),
  hifz_progress integer DEFAULT 0, -- Memorization: ayat count
  hifz_completed boolean DEFAULT false,
  hifz_verified_at timestamptz,
  hifz_verified_by uuid REFERENCES auth.users(id),
  -- Overall status
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, surah_number)
);

-- Indexes for student progress
CREATE INDEX IF NOT EXISTS idx_student_curriculum_progress_student ON student_curriculum_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_curriculum_progress_subject ON student_curriculum_progress(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_milestone_progress_student ON student_milestone_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_milestone_progress_milestone ON student_milestone_progress(milestone_id);
CREATE INDEX IF NOT EXISTS idx_student_milestone_progress_status ON student_milestone_progress(status);
CREATE INDEX IF NOT EXISTS idx_student_surah_progress_student ON student_surah_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_surah_progress_status ON student_surah_progress(status);

-- =============================================
-- PART 3: Lesson Details & Homework
-- =============================================

-- Lesson Details (extended lesson information for progress tracking)
CREATE TABLE IF NOT EXISTS lesson_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  -- What was covered
  topics_covered text[],
  surahs_practiced integer[], -- Array of surah numbers
  ayat_range_start integer,
  ayat_range_end integer,
  -- Milestones addressed
  milestones_addressed uuid[],
  milestones_verified uuid[],
  -- Teacher notes
  teacher_notes text,
  strengths_observed text,
  areas_for_improvement text,
  -- Next lesson recommendations
  recommended_focus text,
  homework_assigned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lesson_id)
);

-- Student Homework
CREATE TABLE IF NOT EXISTS student_homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  -- Homework details
  title text NOT NULL,
  description text,
  homework_type text NOT NULL CHECK (homework_type IN ('practice', 'memorization', 'revision', 'reading', 'listening', 'writing', 'other')),
  -- Surah-specific homework
  surah_number integer,
  ayat_start integer,
  ayat_end integer,
  -- Status tracking
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'reviewed', 'completed')),
  due_date date,
  completed_at timestamptz,
  -- Review
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  review_notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for lesson details and homework
CREATE INDEX IF NOT EXISTS idx_lesson_details_lesson ON lesson_details(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_homework_student ON student_homework(student_id);
CREATE INDEX IF NOT EXISTS idx_student_homework_status ON student_homework(status);
CREATE INDEX IF NOT EXISTS idx_student_homework_due ON student_homework(due_date);

-- =============================================
-- PART 4: RLS Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE curriculum_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_curriculum_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_surah_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_homework ENABLE ROW LEVEL SECURITY;

-- Curriculum Structure Policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view curriculum subjects" ON curriculum_subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can view curriculum phases" ON curriculum_phases FOR SELECT USING (true);
CREATE POLICY "Anyone can view curriculum stages" ON curriculum_stages FOR SELECT USING (true);
CREATE POLICY "Anyone can view curriculum milestones" ON curriculum_milestones FOR SELECT USING (true);

-- Admin-only write access for curriculum structure
CREATE POLICY "Admins can manage curriculum subjects" ON curriculum_subjects FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));
CREATE POLICY "Admins can manage curriculum phases" ON curriculum_phases FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));
CREATE POLICY "Admins can manage curriculum stages" ON curriculum_stages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));
CREATE POLICY "Admins can manage curriculum milestones" ON curriculum_milestones FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- Student Progress Policies
CREATE POLICY "Students can view their own curriculum progress" ON student_curriculum_progress
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update their own curriculum progress" ON student_curriculum_progress
  FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "System can insert curriculum progress" ON student_curriculum_progress
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own milestone progress" ON student_milestone_progress
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view student milestone progress" ON student_milestone_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.learner_id = student_milestone_progress.student_id
      AND l.teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Teachers can verify milestones" ON student_milestone_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.learner_id = student_milestone_progress.student_id
      AND l.teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Students can view their own surah progress" ON student_surah_progress
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view and update student surah progress" ON student_surah_progress
  FOR ALL USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.learner_id = student_surah_progress.student_id
      AND l.teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

-- Lesson Details Policies
CREATE POLICY "Participants can view lesson details" ON lesson_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_details.lesson_id
      AND (l.learner_id = auth.uid() OR l.teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()))
    )
  );
CREATE POLICY "Teachers can manage lesson details" ON lesson_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_details.lesson_id
      AND l.teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    )
  );

-- Homework Policies
CREATE POLICY "Students can view their own homework" ON student_homework
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update their homework status" ON student_homework
  FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Teachers can manage homework for their students" ON student_homework
  FOR ALL USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teacher_profiles tp WHERE tp.user_id = auth.uid()
    )
  );

-- =============================================
-- PART 5: Helper Views
-- =============================================

-- Student Overall Progress Summary
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT
  p.id as student_id,
  p.full_name,
  COALESCE(SUM(l.duration_minutes) / 60.0, 0) as total_hours,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'completed') as completed_lessons,
  COUNT(DISTINCT l.teacher_id) as unique_teachers,
  COALESCE(
    (SELECT COUNT(*) FROM student_milestone_progress smp WHERE smp.student_id = p.id AND smp.status = 'verified'),
    0
  ) as verified_milestones,
  COALESCE(
    (SELECT COUNT(*) FROM student_surah_progress ssp WHERE ssp.student_id = p.id AND ssp.hifz_completed = true),
    0
  ) as surahs_memorized,
  COALESCE(
    (SELECT SUM(hifz_progress) FROM student_surah_progress ssp WHERE ssp.student_id = p.id),
    0
  ) as total_ayat_memorized,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'subject_id', scp.subject_id,
      'progress', scp.overall_progress_percentage
    ))
    FROM student_curriculum_progress scp
    WHERE scp.student_id = p.id
  ) as curriculum_progress
FROM profiles p
LEFT JOIN lessons l ON l.learner_id = p.id
GROUP BY p.id, p.full_name;

GRANT SELECT ON student_progress_summary TO authenticated;

-- Active Homework View
CREATE OR REPLACE VIEW active_homework AS
SELECT
  sh.*,
  p.full_name as student_name,
  tp.id as teacher_profile_id,
  teacher_p.full_name as teacher_name
FROM student_homework sh
JOIN profiles p ON sh.student_id = p.id
LEFT JOIN profiles teacher_p ON sh.assigned_by = teacher_p.id
LEFT JOIN teacher_profiles tp ON tp.user_id = sh.assigned_by
WHERE sh.status IN ('assigned', 'in_progress', 'submitted');

GRANT SELECT ON active_homework TO authenticated;

-- =============================================
-- PART 6: Helpful Comments
-- =============================================

COMMENT ON TABLE curriculum_subjects IS 'Top-level subjects (Quran Reading, Arabic, Islamic Studies)';
COMMENT ON TABLE curriculum_phases IS 'Major learning phases within a subject';
COMMENT ON TABLE curriculum_stages IS 'Sub-stages within phases for granular progression';
COMMENT ON TABLE curriculum_milestones IS 'Specific learning objectives with optional pillar assignment';
COMMENT ON COLUMN curriculum_milestones.pillar IS 'The Three Pillars: fahm (Understanding), itqan (Fluency), hifz (Memorization)';
COMMENT ON TABLE student_surah_progress IS 'Quran-specific progress tracking with Three Pillars methodology';
COMMENT ON TABLE lesson_details IS 'Extended lesson information for progress tracking';
COMMENT ON TABLE student_homework IS 'Homework assignments from teachers to students';
