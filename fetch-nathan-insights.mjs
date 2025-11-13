import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchNathanInsights() {
  try {
    // Just get all Quran insights
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
        created_at
      `)
      .eq('insight_type', 'quran_tadabbur')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (insights && insights.length > 0) {
      console.log('\n=== NATHAN\'S QURAN INSIGHT ===\n');
      console.log('Insight ID:', insights[0].id);
      console.log('Lesson ID:', insights[0].lesson_id);
      console.log('Type:', insights[0].insight_type);
      console.log('Title:', insights[0].title);
      console.log('Created:', insights[0].created_at);
      console.log('\n=== DETAILED INSIGHTS CONTENT ===\n');
      console.log(JSON.stringify(insights[0].detailed_insights, null, 2));
      console.log('\n=== RAW CONTENT ===\n');
      console.log(insights[0].detailed_insights.content);
    } else {
      console.log('No insights found');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

fetchNathanInsights();
