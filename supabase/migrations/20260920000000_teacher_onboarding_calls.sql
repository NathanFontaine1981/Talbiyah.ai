-- Tracks live onboarding-call invites an admin sends a teacher (distinct from
-- the recruitment-interview room system) so the "Invite to Onboarding Call"
-- button on Teacher Management has a durable record to show/reuse.

CREATE TABLE IF NOT EXISTS public.teacher_onboarding_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  hms_room_id text,
  admin_room_code text,
  teacher_room_code text,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'completed')),
  teacher_joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_onboarding_calls_teacher_id ON public.teacher_onboarding_calls(teacher_id);

ALTER TABLE public.teacher_onboarding_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage onboarding calls"
  ON public.teacher_onboarding_calls FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

CREATE POLICY "Teachers can view their own onboarding calls"
  ON public.teacher_onboarding_calls FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());
