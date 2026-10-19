-- Add qiyam_attended column to ramadan_daily_log for tracking Qiyam al-Layl
ALTER TABLE ramadan_daily_log ADD COLUMN IF NOT EXISTS qiyam_attended BOOLEAN DEFAULT false;
