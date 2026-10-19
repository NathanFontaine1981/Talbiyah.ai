-- Update teacher tier hourly rates to £4-£8 range
-- Newcomer: £4/hr, Apprentice: £5/hr, Skilled: £6/hr, Expert: £7/hr, Master: £8/hr

UPDATE teacher_tiers SET teacher_hourly_rate = 4.00 WHERE tier = 'newcomer';
UPDATE teacher_tiers SET teacher_hourly_rate = 5.00 WHERE tier = 'apprentice';
UPDATE teacher_tiers SET teacher_hourly_rate = 6.00 WHERE tier = 'skilled';
UPDATE teacher_tiers SET teacher_hourly_rate = 7.00 WHERE tier = 'expert';
UPDATE teacher_tiers SET teacher_hourly_rate = 8.00 WHERE tier = 'master';
