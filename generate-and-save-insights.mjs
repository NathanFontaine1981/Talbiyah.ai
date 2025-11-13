import { readFileSync, writeFileSync } from 'fs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

// Read the payload
const payload = JSON.parse(readFileSync('./test-data/nathan-quran-lesson-payload.json', 'utf-8'));
const { lesson_id, transcript, metadata } = payload;

// Read the Quran system prompt
const systemPrompt = readFileSync('./src/prompts/talbiyah-insights-quran.txt', 'utf-8');

// Build user prompt
const userPrompt = `Generate Talbiyah Insights for this Quran lesson:

METADATA:
- Surah: ${metadata.surah_name} (${metadata.surah_number})
- Verses: ${metadata.ayah_range}
- Teacher: ${metadata.teacher_name}
- Students: ${metadata.student_names.join(', ')}
- Date: ${metadata.lesson_date}
- Duration: ${metadata.duration_minutes} minutes

TRANSCRIPT:
${transcript}

Generate the insights following the exact format specified in the system prompt.`;

console.log('Generating Talbiyah Insights for Nathan\'s Quran lesson...');
console.log(`Lesson ID: ${lesson_id}`);
console.log(`Surah: ${metadata.surah_name}`);
console.log(`Verses: ${metadata.ayah_range}`);
console.log('');

// Call Claude API
console.log('Calling Claude API...');
const startTime = Date.now();

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  console.error('Claude API error:', errorText);
  process.exit(1);
}

const data = await response.json();
const generatedText = data.content?.[0]?.text;

if (!generatedText) {
  console.error('No response generated from AI');
  process.exit(1);
}

const processingTime = Date.now() - startTime;
console.log(`✓ Insights generated successfully (${processingTime}ms)`);
console.log(`✓ Generated ${generatedText.length} characters of content`);
console.log('');

// Save to file
const insightsData = {
  lesson_id: lesson_id,
  learner_id: '5bb6b97d-028b-4fa0-bc0c-2eb22fa64558',
  subject_id: '12eef119-16e4-45ac-a7d9-1ec5291f83ed',
  teacher_id: '4c202a41-15a3-4d15-96b4-f763321c6133',
  insight_type: 'quran_tadabbur',
  title: `Qur'an Insights: ${metadata.surah_name} (${metadata.ayah_range})`,
  summary: generatedText.substring(0, 500),
  detailed_insights: {
    content: generatedText,
    subject: 'Quran with Tadabbur',
    metadata: metadata,
    generated_at: new Date().toISOString(),
  },
  ai_model: 'claude-3-haiku-20240307',
  confidence_score: 0.90,
  processing_time_ms: processingTime,
  viewed_by_student: false,
  student_rating: null,
};

writeFileSync('./nathan-insights-output.json', JSON.stringify(insightsData, null, 2));
console.log('✓ Insights saved to nathan-insights-output.json');
console.log('');

// Also save just the content for easy viewing
writeFileSync('./nathan-insights-content.md', generatedText);
console.log('✓ Insights content saved to nathan-insights-content.md');
console.log('');

console.log('Preview of generated insights:');
console.log('─'.repeat(60));
console.log(generatedText.substring(0, 500) + '...');
console.log('─'.repeat(60));
