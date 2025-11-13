-- Create a test lesson for Nathan's learner account
INSERT INTO lessons (
  id,
  learner_id,
  teacher_id,
  subject_id,
  scheduled_time,
  duration_minutes,
  status,
  is_free_trial,
  "100ms_room_id"
) VALUES (
  gen_random_uuid(),
  '5bb6b97d-028b-4fa0-bc0c-2eb22fa64558', -- Nathan's learner ID
  '91e24948-69c8-4c80-96b9-0b84fdbc332f', -- Ayodeji teacher
  '12eef119-16e4-45ac-a7d9-1ec5291f83ed', -- Quran subject
  NOW() + INTERVAL '5 minutes', -- Start in 5 minutes
  60, -- 60 minutes duration
  'booked',
  false,
  'test-room-talbiyah-' || floor(random() * 100000)::text
)
RETURNING id, scheduled_time, "100ms_room_id";
