-- Structured teaching plan (cue-sheet format: book/stop/script cues) alongside
-- the legacy free-text `teaching_plan` column. New generations populate this;
-- old sessions keep rendering from `teaching_plan` until regenerated.
ALTER TABLE public.course_sessions ADD COLUMN IF NOT EXISTS teaching_plan_json jsonb;
