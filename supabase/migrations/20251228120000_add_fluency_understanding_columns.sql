-- Add fluency and understanding tracking columns to surah_retention_tracker
-- These columns track whether the learner has mastered fluency (tajweed) and understanding (meaning) for each surah

ALTER TABLE surah_retention_tracker
ADD COLUMN IF NOT EXISTS fluency_complete BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS understanding_complete BOOLEAN NOT NULL DEFAULT false;

-- Add comments
COMMENT ON COLUMN surah_retention_tracker.fluency_complete IS 'Whether the learner can recite this surah fluently with proper tajweed';
COMMENT ON COLUMN surah_retention_tracker.understanding_complete IS 'Whether the learner understands the meaning/tafsir of this surah';
