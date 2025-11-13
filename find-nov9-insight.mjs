import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findNov9Insight() {
  try {
    // First check if there are any insights at all
    const { data: allInsights, error: allError } = await supabase
      .from('lesson_insights')
      .select('id, created_at, lesson_id')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('\nRecent insights in database:');
    if (allInsights && allInsights.length > 0) {
      allInsights.forEach(i => {
        console.log(`- ${i.id}: Created ${i.created_at}`);
      });
    } else {
      console.log('No insights found in database at all');
    }

    // Get insights from November 9th, 2025
    const { data: insights, error } = await supabase
      .from('lesson_insights')
      .select(`
        id,
        lesson_id,
        learner_id,
        insight_type,
        title,
        summary,
        detailed_insights,
        created_at,
        lessons (
          id,
          scheduled_time,
          subjects (name)
        )
      `)
      .gte('created_at', '2025-11-09T00:00:00.000Z')
      .lt('created_at', '2025-11-10T00:00:00.000Z')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!insights || insights.length === 0) {
      console.log('\nNo insights found for November 9th, 2025. Checking 2024...');

      // Try 2024
      const { data: insights2024 } = await supabase
        .from('lesson_insights')
        .select(`
          id,
          lesson_id,
          learner_id,
          insight_type,
          title,
          summary,
          detailed_insights,
          created_at
        `)
        .gte('created_at', '2024-11-09T00:00:00.000Z')
        .lt('created_at', '2024-11-10T00:00:00.000Z')
        .order('created_at', { ascending: false });

      if (insights2024 && insights2024.length > 0) {
        console.log('\nFound insights from November 9th, 2024:');
        insights2024.forEach(i => {
          console.log(`\n=== INSIGHT ===`);
          console.log('ID:', i.id);
          console.log('Lesson ID:', i.lesson_id);
          console.log('Type:', i.insight_type);
          console.log('Title:', i.title);
          console.log('Created:', i.created_at);
          console.log('\n=== CONTENT ===\n');
          console.log(i.detailed_insights?.content || 'No content');
        });
      }
      return;
    }

    console.log(`\nFound ${insights.length} insight(s) from November 9th:\n`);

    insights.forEach((insight, index) => {
      console.log(`\n=== INSIGHT ${index + 1} ===`);
      console.log('ID:', insight.id);
      console.log('Lesson ID:', insight.lesson_id);
      console.log('Type:', insight.insight_type);
      console.log('Title:', insight.title);
      console.log('Created:', insight.created_at);
      console.log('Subject:', insight.lessons?.subjects?.name);
      console.log('\n=== CURRENT CONTENT ===\n');
      console.log(insight.detailed_insights?.content || 'No content');
      console.log('\n=== METADATA ===\n');
      console.log(JSON.stringify(insight.detailed_insights?.metadata, null, 2));
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

findNov9Insight();
