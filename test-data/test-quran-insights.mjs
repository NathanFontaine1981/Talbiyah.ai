import { readFileSync } from 'fs';

// Read the sample transcript
const transcript = readFileSync('./test-data/sample-quran-lesson-transcript.txt', 'utf-8');

const testData = {
  lesson_id: "test-lesson-123",
  transcript: transcript,
  metadata: {
    surah_name: "Al-Qasas (The Story)",
    surah_number: 28,
    ayah_range: "28:20-28",
    teacher_name: "Ustadh Ahmed Rahman",
    student_names: ["Sarah Abdullah"],
    lesson_date: "2025-11-10"
  }
};

console.log('Testing Quran Insights Generation');
console.log('==================================\n');
console.log('Lesson:', testData.metadata.surah_name);
console.log('Verses:', testData.metadata.ayah_range);
console.log('Teacher:', testData.metadata.teacher_name);
console.log('Student:', testData.metadata.student_names.join(', '));
console.log('\nTranscript length:', transcript.length, 'characters\n');

// To test, deploy the function and call it:
console.log('To test this function:');
console.log('1. Deploy the function:');
console.log('   npx supabase functions deploy generate-quran-insights --project-ref boyrjgivpepjiboekwuu\n');
console.log('2. Set the ANTHROPIC_API_KEY secret:');
console.log('   npx supabase secrets set ANTHROPIC_API_KEY="your-key-here" --project-ref boyrjgivpepjiboekwuu\n');
console.log('3. Call the function:');
console.log('   curl -X POST https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/generate-quran-insights \\');
console.log('     -H "Authorization: Bearer YOUR_ANON_KEY" \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d @test-data/test-payload.json\n');

// Write test payload
import { writeFileSync } from 'fs';
writeFileSync('./test-data/test-payload.json', JSON.stringify(testData, null, 2));
console.log('Test payload written to: test-data/test-payload.json');
