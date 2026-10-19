-- Add the flag the recording-failure sweep uses to alert on each failed lesson
-- exactly once. `sweep-failed-recordings` both filters on and writes this column,
-- so without it the sweep's SELECT errors and the whole job no-ops.
-- Idempotent: safe to run repeatedly in the Supabase SQL editor.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS insight_recovery_alerted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.lessons.insight_recovery_alerted IS
  'Set true once the recording/insight-failure sweep has alerted for this lesson, so it alerts only once.';
