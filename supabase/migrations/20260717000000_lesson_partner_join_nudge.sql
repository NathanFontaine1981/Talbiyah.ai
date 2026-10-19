-- Lesson partner join-nudge, applied Jul 17 2026 (via Management API).
-- Feature request: when a teacher or student joins the lesson room at/near
-- lesson time and the other party hasn't joined yet, nudge them (email +
-- in-app notification) to join. See notify-lesson-partner edge function.
-- Idempotent: safe to re-run.

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS teacher_joined_at timestamptz;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS student_joined_at timestamptz;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS teacher_join_nudge_sent boolean NOT NULL DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS student_join_nudge_sent boolean NOT NULL DEFAULT false;
