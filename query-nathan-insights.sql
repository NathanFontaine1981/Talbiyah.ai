SELECT 
  li.id,
  li.lesson_id,
  li.insight_type,
  li.title,
  li.summary,
  li.detailed_insights,
  li.created_at,
  l.scheduled_time,
  s.name as subject_name
FROM lesson_insights li
JOIN lessons l ON li.lesson_id = l.id
JOIN learners lr ON li.learner_id = lr.id
JOIN subjects s ON l.subject_id = s.id
WHERE lr.parent_id IN (
  SELECT id FROM auth.users WHERE email = 'nathanlfontaine@gmail.com'
)
AND li.insight_type = 'quran_tadabbur'
ORDER BY li.created_at DESC
LIMIT 1;
