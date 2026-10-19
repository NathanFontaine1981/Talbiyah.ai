-- Fix incorrect quiz answer for Pharaoh's declaration question
-- The correct answer is "I am your lord most high" (Quran 79:24), not "I am a god among gods"

-- Update any lesson_insights that have this incorrect quiz answer
UPDATE lesson_insights
SET content = REPLACE(
  REPLACE(content,
    'A) I am a god among gods ✅',
    'A) I am a god among gods'
  ),
  'B) I am your lord most high',
  'B) I am your lord most high ✅'
)
WHERE content LIKE '%What did Pharaoh declare%'
  AND content LIKE '%I am a god among gods%✅%';

-- Also handle variations where the checkmark might be formatted differently
UPDATE lesson_insights
SET content = REPLACE(
  REPLACE(content,
    'I am a god among gods✅',
    'I am a god among gods'
  ),
  'I am your lord most high',
  'I am your lord most high ✅'
)
WHERE content LIKE '%What did Pharaoh declare%'
  AND content LIKE '%I am a god among gods%✅%';

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed Pharaoh quiz answer - correct answer is now "I am your lord most high" per Quran 79:24';
END $$;
