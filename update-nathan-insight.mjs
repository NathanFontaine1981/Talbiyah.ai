import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateNathanInsight() {
  try {
    const lessonId = '30a7dd02-7e85-4abb-a661-d5b25e5e157b';
    const learnerId = '5bb6b97d-028b-4fa0-bc0c-2eb22fa64558';

    // Read the reformatted content
    const reformattedContent = fs.readFileSync('./nathan-insights-reformatted.md', 'utf8');

    // Prepare the update data
    const detailedInsights = {
      content: reformattedContent,
      subject: 'Quran with Tadabbur',
      metadata: {
        surah_name: 'An-Nazi\'at (The Extractors)',
        surah_number: 79,
        ayah_range: '79:15-26',
        teacher_name: 'Ustadh Osama Muhammad',
        student_names: ['Nathan Fontaine'],
        lesson_date: '2025-11-09',
        duration_minutes: 60
      },
      generated_at: new Date().toISOString()
    };

    // First check if an insight exists for this lesson
    const { data: existing } = await supabase
      .from('lesson_insights')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('learner_id', learnerId)
      .single();

    if (existing) {
      console.log('Found existing insight, updating...', existing.id);

      // Update existing insight
      const { data, error } = await supabase
        .from('lesson_insights')
        .update({
          title: 'Qur\'an Insights: An-Nazi\'at (79:15-26)',
          summary: 'Lesson on Surah An-Nazi\'at verses 15-26, covering the story of Musa and Pharaoh, key Arabic vocabulary, and reflections on arrogance and divine punishment.',
          detailed_insights: detailedInsights,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();

      if (error) {
        console.error('Error updating insight:', error);
        return;
      }

      console.log('\n✅ Successfully updated insight!');
      console.log('ID:', data[0].id);
      console.log('\nYou can view it at: /student/lessons/' + lessonId + '/insights');
    } else {
      console.log('No existing insight found, creating new one...');

      // Create new insight
      const { data, error } = await supabase
        .from('lesson_insights')
        .insert({
          lesson_id: lessonId,
          learner_id: learnerId,
          insight_type: 'quran_tadabbur',
          title: 'Qur\'an Insights: An-Nazi\'at (79:15-26)',
          summary: 'Lesson on Surah An-Nazi\'at verses 15-26, covering the story of Musa and Pharaoh, key Arabic vocabulary, and reflections on arrogance and divine punishment.',
          detailed_insights: detailedInsights,
          ai_model: 'claude-3-haiku-20240307',
          confidence_score: 0.9,
          viewed_by_student: false
        })
        .select();

      if (error) {
        console.error('Error creating insight:', error);
        return;
      }

      console.log('\n✅ Successfully created insight!');
      console.log('ID:', data[0].id);
      console.log('\nYou can view it at: /student/lessons/' + lessonId + '/insights');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateNathanInsight();
