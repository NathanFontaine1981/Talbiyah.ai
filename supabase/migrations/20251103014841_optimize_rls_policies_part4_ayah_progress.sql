/*
  # Optimize RLS Policies - Part 4: Ayah Progress

  1. Performance Optimization
    - Replace auth.uid() with (SELECT auth.uid()) to prevent re-evaluation per row
  
  2. Tables Updated
    - ayah_progress
*/

-- Ayah Progress policies
DROP POLICY IF EXISTS "Learners can insert own ayah progress" ON public.ayah_progress;
DROP POLICY IF EXISTS "Learners can read own ayah progress" ON public.ayah_progress;
DROP POLICY IF EXISTS "Learners can update own ayah progress" ON public.ayah_progress;
DROP POLICY IF EXISTS "Teachers can read student ayah progress" ON public.ayah_progress;
DROP POLICY IF EXISTS "Teachers can update student ayah progress" ON public.ayah_progress;

CREATE POLICY "Learners can insert own ayah progress"
  ON public.ayah_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Learners can read own ayah progress"
  ON public.ayah_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Learners can update own ayah progress"
  ON public.ayah_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learners
      WHERE learners.id = ayah_progress.learner_id
      AND learners.parent_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Teachers can read student ayah progress"
  ON public.ayah_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.user_id = (SELECT auth.uid())
      AND teacher_profiles.id IN (
        SELECT DISTINCT lessons.teacher_id
        FROM public.lessons
        WHERE lessons.learner_id = ayah_progress.learner_id
      )
    )
  );

CREATE POLICY "Teachers can update student ayah progress"
  ON public.ayah_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.user_id = (SELECT auth.uid())
      AND teacher_profiles.id IN (
        SELECT DISTINCT lessons.teacher_id
        FROM public.lessons
        WHERE lessons.learner_id = ayah_progress.learner_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE teacher_profiles.user_id = (SELECT auth.uid())
      AND teacher_profiles.id IN (
        SELECT DISTINCT lessons.teacher_id
        FROM public.lessons
        WHERE lessons.learner_id = ayah_progress.learner_id
      )
    )
  );
