import { randomUUID } from 'crypto';

const ACCESS_TOKEN = 'sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff';
const lessonId = 'acfc0287-c4b7-42fb-a661-74378a690e4e';
const recordingId = randomUUID();

console.log('Creating recording for lesson:', lessonId);
console.log('Recording ID:', recordingId);
console.log('');

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
  'ready'
) RETURNING id;
`;

const response = await fetch(`https://api.supabase.com/v1/projects/boyrjgivpepjiboekwuu/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: recordingSql }),
});

const result = await response.json();
if (result.message) {
  console.error('Error:', result.message);
  process.exit(1);
}

console.log('✓ Recording created:', result[0]?.id);
console.log('');

// Save IDs for generating insights
import { writeFileSync } from 'fs';
writeFileSync('./test-recording-ids.json', JSON.stringify({
  lessonId,
  recordingId,
  learnerId: '5bb6b97d-028b-4fa0-bc0c-2eb22fa64558',
  subjectId: '12eef119-16e4-45ac-a7d9-1ec5291f83ed',
  teacherId: '4c202a41-15a3-4d15-96b4-f763321c6133'
}, null, 2));

console.log('✓ IDs saved to test-recording-ids.json');
console.log('');
console.log('Ready to generate insights!');
