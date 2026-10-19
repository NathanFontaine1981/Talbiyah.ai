/*
  # Create Diagnostic Assessment System

  This migration adds support for FREE 20-minute diagnostic assessments.
  The Talbiyah approach: Understanding → Fluency → Memorization

  1. New Tables
    - `diagnostic_assessments` - Stores questionnaire responses, AI analysis, teacher assessment
    - `diagnostic_teacher_payments` - Tracks £3 payments to teachers for diagnostics

  2. Table Modifications
    - Add `lesson_type` to lessons table
    - Add diagnostic tracking fields to profiles table

  3. Security
    - RLS policies for all new tables
    - Parents can manage their own diagnostic assessments
    - Teachers can view/update assessments for their lessons
    - Admins have full access
*/

-- Add lesson_type column to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'regular';

-- Create index for lesson_type
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_type ON lessons(lesson_type);

-- Add check constraint for valid lesson types
ALTER TABLE lessons
DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

ALTER TABLE lessons
ADD CONSTRAINT lessons_lesson_type_check
CHECK (lesson_type IN ('regular', 'diagnostic_assessment'));

-- Add diagnostic tracking fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_completed_diagnostic boolean DEFAULT false;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS diagnostic_assessment_id uuid;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS diagnostic_completed_at timestamptz;

-- Create diagnostic_assessments table
CREATE TABLE IF NOT EXISTS diagnostic_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id uuid REFERENCES learners(id) ON DELETE SET NULL,

  -- Pre-assessment questionnaire responses (JSONB)
  pre_assessment_responses jsonb DEFAULT '{}'::jsonb,

  -- AI-generated preliminary assessment (JSONB)
  ai_preliminary_assessment jsonb DEFAULT NULL,

  -- Teacher's assessment after the lesson (JSONB)
  teacher_assessment jsonb DEFAULT NULL,

  -- Methodology alignment score
  methodology_alignment text DEFAULT 'moderate',

  -- Recommended learning phase
  recommended_phase text DEFAULT NULL,

  -- Assessment status
  status text NOT NULL DEFAULT 'questionnaire_pending',

  -- Additional metadata
  subject_area text DEFAULT NULL,
  teacher_id uuid REFERENCES teacher_profiles(id) ON DELETE SET NULL,

  -- Timestamps
  questionnaire_completed_at timestamptz,
  ai_analyzed_at timestamptz,
  lesson_completed_at timestamptz,
  report_generated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT diagnostic_methodology_alignment_check
    CHECK (methodology_alignment IN ('strong', 'moderate', 'needs_education', 'misaligned')),
  CONSTRAINT diagnostic_status_check
    CHECK (status IN ('questionnaire_pending', 'questionnaire_complete', 'ai_analyzed', 'lesson_scheduled', 'lesson_complete', 'report_complete', 'cancelled')),
  CONSTRAINT diagnostic_recommended_phase_check
    CHECK (recommended_phase IS NULL OR recommended_phase IN ('foundations', 'understanding', 'fluency', 'memorization'))
);

-- Create indexes for diagnostic_assessments
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_student_id ON diagnostic_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_learner_id ON diagnostic_assessments(learner_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_lesson_id ON diagnostic_assessments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_teacher_id ON diagnostic_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_status ON diagnostic_assessments(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_created_at ON diagnostic_assessments(created_at);

-- Enable RLS on diagnostic_assessments
ALTER TABLE diagnostic_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagnostic_assessments

-- Users can read their own diagnostic assessments
CREATE POLICY "Users can read own diagnostic assessments"
  ON diagnostic_assessments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Users can insert their own diagnostic assessments
CREATE POLICY "Users can insert own diagnostic assessments"
  ON diagnostic_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Users can update their own diagnostic assessments
CREATE POLICY "Users can update own diagnostic assessments"
  ON diagnostic_assessments
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can read diagnostic assessments for their lessons
CREATE POLICY "Teachers can read diagnostic assessments for their lessons"
  ON diagnostic_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = diagnostic_assessments.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Teachers can update diagnostic assessments for their lessons (to add teacher_assessment)
CREATE POLICY "Teachers can update diagnostic assessments for their lessons"
  ON diagnostic_assessments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = diagnostic_assessments.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = diagnostic_assessments.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Admin users can read all diagnostic assessments
CREATE POLICY "Admin users can read all diagnostic assessments"
  ON diagnostic_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Admin users can update all diagnostic assessments
CREATE POLICY "Admin users can update all diagnostic assessments"
  ON diagnostic_assessments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Admin users can delete diagnostic assessments
CREATE POLICY "Admin users can delete all diagnostic assessments"
  ON diagnostic_assessments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Create diagnostic_teacher_payments table
CREATE TABLE IF NOT EXISTS diagnostic_teacher_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_assessment_id uuid NOT NULL REFERENCES diagnostic_assessments(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL DEFAULT 3.00,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT diagnostic_payment_status_check
    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  CONSTRAINT diagnostic_payment_amount_positive
    CHECK (amount > 0)
);

-- Create indexes for diagnostic_teacher_payments
CREATE INDEX IF NOT EXISTS idx_diagnostic_payments_assessment_id ON diagnostic_teacher_payments(diagnostic_assessment_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_payments_teacher_id ON diagnostic_teacher_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_payments_status ON diagnostic_teacher_payments(status);

-- Enable RLS on diagnostic_teacher_payments
ALTER TABLE diagnostic_teacher_payments ENABLE ROW LEVEL SECURITY;

-- Teachers can read their own diagnostic payments
CREATE POLICY "Teachers can read own diagnostic payments"
  ON diagnostic_teacher_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles
      WHERE teacher_profiles.id = diagnostic_teacher_payments.teacher_id
      AND teacher_profiles.user_id = auth.uid()
    )
  );

-- Admin users can read all diagnostic payments
CREATE POLICY "Admin users can read all diagnostic payments"
  ON diagnostic_teacher_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Admin users can insert diagnostic payments
CREATE POLICY "Admin users can insert diagnostic payments"
  ON diagnostic_teacher_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Authenticated users can insert diagnostic payments for their own assessments
CREATE POLICY "Users can insert diagnostic payments for own assessments"
  ON diagnostic_teacher_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagnostic_assessments
      WHERE diagnostic_assessments.id = diagnostic_teacher_payments.diagnostic_assessment_id
      AND diagnostic_assessments.student_id = auth.uid()
    )
  );

-- Admin users can update diagnostic payments
CREATE POLICY "Admin users can update diagnostic payments"
  ON diagnostic_teacher_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Add foreign key from profiles to diagnostic_assessments
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_diagnostic_assessment_id_fkey;

ALTER TABLE profiles
ADD CONSTRAINT profiles_diagnostic_assessment_id_fkey
FOREIGN KEY (diagnostic_assessment_id)
REFERENCES diagnostic_assessments(id)
ON DELETE SET NULL;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_diagnostic_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_diagnostic_assessments_updated_at ON diagnostic_assessments;
CREATE TRIGGER update_diagnostic_assessments_updated_at
  BEFORE UPDATE ON diagnostic_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_assessment_updated_at();

DROP TRIGGER IF EXISTS update_diagnostic_teacher_payments_updated_at ON diagnostic_teacher_payments;
CREATE TRIGGER update_diagnostic_teacher_payments_updated_at
  BEFORE UPDATE ON diagnostic_teacher_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_diagnostic_assessment_updated_at();

-- Create a function to check if user has completed a diagnostic
CREATE OR REPLACE FUNCTION check_diagnostic_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM diagnostic_assessments
  WHERE student_id = p_user_id
  AND status NOT IN ('cancelled');

  RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_diagnostic_limit(uuid) TO authenticated;

-- Comment on tables
COMMENT ON TABLE diagnostic_assessments IS 'Stores diagnostic assessment data including questionnaire responses, AI analysis, and teacher evaluations';
COMMENT ON TABLE diagnostic_teacher_payments IS 'Tracks £3 payments to teachers for conducting diagnostic assessments';
COMMENT ON COLUMN diagnostic_assessments.methodology_alignment IS 'How well the student aligns with Talbiyah methodology: strong, moderate, needs_education, misaligned';
COMMENT ON COLUMN diagnostic_assessments.recommended_phase IS 'Recommended learning phase: foundations, understanding, fluency, or memorization';
