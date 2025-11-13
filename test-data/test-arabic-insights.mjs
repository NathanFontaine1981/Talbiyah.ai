import { readFileSync } from 'fs';

// Read the sample Arabic transcript
const transcript = readFileSync('./test-data/sample-arabic-lesson-transcript.txt', 'utf-8');

const testData = {
  lesson_id: "test-arabic-lesson-456",
  transcript: transcript,
  subject: "Arabic Language",
  metadata: {
    teacher_name: "Ustadha Fatima Hassan",
    student_names: ["Omar Johnson"],
    lesson_date: "2025-11-10",
    duration_minutes: 60
  }
};

console.log('Testing Arabic Language Insights Generation');
console.log('==========================================\n');
console.log('Subject:', testData.subject);
console.log('Teacher:', testData.metadata.teacher_name);
console.log('Student:', testData.metadata.student_names.join(', '));
console.log('Duration:', testData.metadata.duration_minutes, 'minutes');
console.log('\nTranscript length:', transcript.length, 'characters\n');

// To test, deploy the function and call it:
console.log('To test this function:');
console.log('1. Deploy the unified insights function:');
console.log('   npx supabase functions deploy generate-lesson-insights --project-ref boyrjgivpepjiboekwuu\n');
console.log('2. Set the ANTHROPIC_API_KEY secret (if not already set):');
console.log('   npx supabase secrets set ANTHROPIC_API_KEY="your-key-here" --project-ref boyrjgivpepjiboekwuu\n');
console.log('3. Call the function:');
console.log('   curl -X POST https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/generate-lesson-insights \\\\');
console.log('     -H "Authorization: Bearer YOUR_ANON_KEY" \\\\');
console.log('     -H "Content-Type: application/json" \\\\');
console.log('     -d @test-data/test-arabic-payload.json\n');

// Write test payload
import { writeFileSync } from 'fs';
writeFileSync('./test-data/test-arabic-payload.json', JSON.stringify(testData, null, 2));
console.log('Test payload written to: test-data/test-arabic-payload.json');
