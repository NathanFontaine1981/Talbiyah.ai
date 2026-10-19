-- ┌────────────────────────────────────────────────────────────────────┐
-- │ TEACHER ONBOARDING COMPLETIONS                                      │
-- │ Stores manually ticked-off onboarding checklist steps per teacher   │
-- │ so they sync across devices (replaces the previous localStorage).   │
-- │                                                                    │
-- │ NOTE: item_id references onboarding_checklist_items, which was      │
-- │ created directly in the dashboard (not migration-tracked), so we    │
-- │ intentionally store it as a plain uuid without a FK to avoid apply   │
-- │ failures in environments where that table is absent.                │
-- └────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS teacher_onboarding_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT teacher_onboarding_completion_unique UNIQUE (teacher_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_onboarding_completions_teacher
  ON teacher_onboarding_completions(teacher_id);

ALTER TABLE teacher_onboarding_completions ENABLE ROW LEVEL SECURITY;

-- Teachers can read their own completions
DROP POLICY IF EXISTS "Teachers can view own onboarding completions" ON teacher_onboarding_completions;
CREATE POLICY "Teachers can view own onboarding completions" ON teacher_onboarding_completions
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

-- Teachers can add/remove their own completions
DROP POLICY IF EXISTS "Teachers can manage own onboarding completions" ON teacher_onboarding_completions;
CREATE POLICY "Teachers can manage own onboarding completions" ON teacher_onboarding_completions
  FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can view all completions
DROP POLICY IF EXISTS "Admins can view all onboarding completions" ON teacher_onboarding_completions;
CREATE POLICY "Admins can view all onboarding completions" ON teacher_onboarding_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );
