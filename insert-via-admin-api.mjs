import { readFileSync } from 'fs';

const ACCESS_TOKEN = "sbp_5f3b1ff4e30dd431d2ede8ba2032b70bb035c3ff";
const PROJECT_REF = "boyrjgivpepjiboekwuu";

// Read the insights data
const insightsData = JSON.parse(readFileSync('./nathan-insights-output.json', 'utf-8'));

// Create the SQL insert statement
const sql = `
INSERT INTO lesson_insights (
  lesson_id,
  learner_id,
  subject_id,
  teacher_id,
  insight_type,
  title,
  summary,
  detailed_insights,
  ai_model,
  confidence_score,
  processing_time_ms,
  viewed_by_student,
  student_rating
) VALUES (
  '${insightsData.lesson_id}',
  '${insightsData.learner_id}',
  '${insightsData.subject_id}',
  '${insightsData.teacher_id}',
  '${insightsData.insight_type}',
  $body$${insightsData.title}$body$,
  $body$${insightsData.summary}$body$,
  '${JSON.stringify(insightsData.detailed_insights)}'::jsonb,
  '${insightsData.ai_model}',
  ${insightsData.confidence_score},
  ${insightsData.processing_time_ms},
  ${insightsData.viewed_by_student},
  ${insightsData.student_rating}
)
ON CONFLICT (lesson_id) DO UPDATE SET
  detailed_insights = EXCLUDED.detailed_insights,
  summary = EXCLUDED.summary,
  title = EXCLUDED.title,
  updated_at = NOW()
RETURNING id;
`;

console.log('Inserting insights into database via admin API...');

const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const result = await response.json();

if (response.ok && !result.message) {
  console.log('✓ Insights successfully saved to database!');
  console.log('✓ Insight ID:', result[0]?.id || 'Created');
  console.log('');
  console.log('Nathan can now view the insights at:');
  console.log(`  http://localhost:5173/lesson/${insightsData.lesson_id}/insights`);
  console.log('');
  console.log('The insights will appear in his dashboard under completed lessons with a "View Insights" button.');
} else {
  console.error('Error:', result.message || result);
}
