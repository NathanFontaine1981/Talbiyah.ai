/*
  # Add Default Availability for All Approved Teachers

  ## Summary
  Provides default Monday-Friday 9AM-5PM availability for all approved teachers 
  who don't currently have any availability set. This ensures students can book 
  with all approved teachers immediately.

  ## Changes
  1. Inserts default availability slots for approved teachers without existing availability
  2. Creates 30-minute time slots from 9:00 AM to 5:00 PM
  3. Covers Monday through Friday (day_of_week 1-5)
  4. Teachers can customize their availability later through the dashboard

  ## Default Schedule
  - Days: Monday-Friday
  - Hours: 9:00 AM - 5:00 PM
  - Slot Duration: 30 minutes
  - Status: Available (is_available = true)

  ## Notes
  - Only affects teachers who have NO availability records
  - Skips teachers who have already set custom availability
  - Teachers can modify this default schedule anytime
*/

-- Add default availability for all approved teachers without existing availability
INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, is_available)
SELECT 
  tp.id as teacher_id,
  dow.day,
  ts.time_slot::time as start_time,
  (ts.time_slot + interval '30 minutes')::time as end_time,
  true as is_available
FROM teacher_profiles tp
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) as dow(day)  -- Monday-Friday
CROSS JOIN (
  SELECT generate_series(
    '2025-01-01 09:00:00'::timestamp,
    '2025-01-01 16:30:00'::timestamp,
    interval '30 minutes'
  ) as time_slot
) ts
WHERE tp.status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM teacher_availability ta 
  WHERE ta.teacher_id = tp.id
);