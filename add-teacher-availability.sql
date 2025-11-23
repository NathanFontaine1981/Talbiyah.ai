-- Add availability for teacher dffab54a-d120-4044-9db6-e5d987b3d5d5
-- This will make the teacher visible in Find a Teacher
-- day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, is_available)
VALUES
  ('dffab54a-d120-4044-9db6-e5d987b3d5d5', 1, '09:00', '17:00', true),  -- Monday
  ('dffab54a-d120-4044-9db6-e5d987b3d5d5', 2, '09:00', '17:00', true),  -- Tuesday
  ('dffab54a-d120-4044-9db6-e5d987b3d5d5', 3, '09:00', '17:00', true),  -- Wednesday
  ('dffab54a-d120-4044-9db6-e5d987b3d5d5', 4, '09:00', '17:00', true),  -- Thursday
  ('dffab54a-d120-4044-9db6-e5d987b3d5d5', 5, '09:00', '17:00', true),  -- Friday
  ('dffab54a-d120-4044-9db6-e5d987b3d5d5', 6, '09:00', '17:00', true),  -- Saturday
  ('dffab54a-d120-4044-9db6-e5d987b3d5d5', 0, '09:00', '17:00', true)   -- Sunday
ON CONFLICT DO NOTHING;
