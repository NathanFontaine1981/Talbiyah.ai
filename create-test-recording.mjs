import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://boyrjgivpepjiboekwuu.supabase.co';
const ACCESS_TOKEN = 'sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff';

// Create admin client
const supabase = createClient(SUPABASE_URL, ACCESS_TOKEN, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Creating test lesson and recording for Nathan...\n');

// Nathan's IDs
const nathanUserId = 'c8a77dba-a666-4a30-87df-a4c26043b6a4';
const nathanLearnerId = '5bb6b97d-028b-4fa0-bc0c-2eb22fa64558';
const quranSubjectId = '12eef119-16e4-45ac-a7d9-1ec5291f83ed'; // Quran with Understanding
const teacherId = '4c202a41-15a3-4d15-96b4-f763321c6133'; // Ayodeji Teacher

// Generate UUIDs
const lessonId = randomUUID();
const recordingId = randomUUID();

console.log('Lesson ID:', lessonId);
console.log('Recording ID:', recordingId);
console.log('');

// Step 1: Insert lesson via admin API
const lessonSql = `
INSERT INTO lessons (
  id,
  teacher_id,
  learner_id,
  subject_id,
  scheduled_time,
  duration_minutes,
  status,
  "100ms_room_id",
  student_room_code,
  teacher_room_code
) VALUES (
  '${lessonId}',
  '${teacherId}',
  '${nathanLearnerId}',
  '${quranSubjectId}',
  '2025-11-08 18:00:00+00',
  60,
  'completed',
  'test-room-${lessonId}',
  'student-code-123',
  'teacher-code-456'
) RETURNING id;
`;

console.log('Creating lesson...');
const lessonResponse = await fetch(`https://api.supabase.com/v1/projects/boyrjgivpepjiboekwuu/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: lessonSql }),
});

const lessonResult = await lessonResponse.json();
if (lessonResult.message) {
  console.error('Error creating lesson:', lessonResult.message);
  process.exit(1);
}

console.log('✓ Lesson created:', lessonResult[0]?.id);
console.log('');

// Step 2: Insert recording
const recordingSql = `
INSERT INTO lesson_recordings (
  id,
  lesson_id,
  recording_url,
  duration_minutes,
  file_size_mb,
  status
) VALUES (
  '${recordingId}',
  '${lessonId}',
  'https://player.vimeo.com/video/123456789',
  60,
  500,
  'completed'
) RETURNING id;
`;

console.log('Creating recording...');
const recordingResponse = await fetch(`https://api.supabase.com/v1/projects/boyrjgivpepjiboekwuu/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: recordingSql }),
});

const recordingResult = await recordingResponse.json();
if (recordingResult.message) {
  console.error('Error creating recording:', recordingResult.message);
  process.exit(1);
}

console.log('✓ Recording created:', recordingResult[0]?.id);
console.log('');

console.log('Test lesson and recording created successfully!');
console.log('');
console.log('Next steps:');
console.log('1. Run: ANTHROPIC_API_KEY="your-key" node generate-test-insights.mjs');
console.log('2. The recording will appear in Nathan\'s Recent Recordings');
console.log('');

// Save IDs for next script
import { writeFileSync } from 'fs';
writeFileSync('./test-recording-ids.json', JSON.stringify({
  lessonId,
  recordingId,
  learnerId: nathanLearnerId,
  subjectId: quranSubjectId,
  teacherId: teacherId
}, null, 2));

console.log('IDs saved to test-recording-ids.json');
