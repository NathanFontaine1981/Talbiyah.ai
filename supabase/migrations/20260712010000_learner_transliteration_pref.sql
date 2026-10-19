-- Per-learner transliteration preference (default ON) so students who can't
-- read Arabic script yet get Latin transliteration alongside ayah text in the
-- daily review / recall flows. Toggleable on the daily review page.
ALTER TABLE learners ADD COLUMN IF NOT EXISTS show_transliteration boolean NOT NULL DEFAULT true;
