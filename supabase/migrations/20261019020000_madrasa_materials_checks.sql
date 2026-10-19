-- Keep the generator's rule checks with the draft so the review screen can show them after a reload.
-- Shape: { "hard": [text, ...], "warnings": [text, ...] }  ("hard" = still broken after the automatic retry)
ALTER TABLE public.madrasa_session_materials
  ADD COLUMN IF NOT EXISTS generation_checks jsonb NOT NULL DEFAULT '{"hard": [], "warnings": []}'::jsonb;
