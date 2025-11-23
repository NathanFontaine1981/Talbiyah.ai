-- Check if availability was inserted
SELECT
  teacher_id,
  day_of_week,
  start_time,
  end_time,
  is_available,
  created_at
FROM teacher_availability
WHERE teacher_id = 'dffab54a-d120-4044-9db6-e5d987b3d5d5'
ORDER BY day_of_week;
