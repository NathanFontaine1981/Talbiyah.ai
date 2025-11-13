import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyNDE4NzUsImV4cCI6MjA0MzgxNzg3NX0.s0vBcGYBXZdDAcYxXy-Kqx1b85dJ2yHLqPCgGrHCxh8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestInsights() {
  try {
    console.log('🚀 Creating test insights...\n');

    // Get all profiles to find the first one with a learner (likely Nathan)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(10);

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ Could not find any profiles');
      return;
    }

    // Try to find a profile with a learner
    let userProfile = null;
    let learner = null;

    for (const profile of profiles) {
      const { data: learnerData } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', profile.id)
        .single();

      if (learnerData) {
        userProfile = profile;
        learner = learnerData;
        break;
      }
    }

    if (!userProfile || !learner) {
      console.error('❌ Could not find a user with a learner profile');
      console.log('Available profiles:', profiles.map(p => `${p.full_name} (${p.email})`).join(', '));
      return;
    }

    console.log(`✅ Found profile: ${userProfile.full_name} (${userProfile.email})`);
    console.log(`✅ Found learner ID: ${learner.id}`);

    // Get a teacher (any teacher will do)
    const { data: teacher, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('id, profiles!inner(full_name)')
      .limit(1)
      .single();

    if (teacherError || !teacher) {
      console.error('❌ Could not find teacher profile');
      return;
    }

    console.log(`✅ Found teacher: ${teacher.profiles.full_name}`);

    // Get Quran subject
    const { data: quranSubject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('name', 'Quran with Tadabbur (Understanding & Reflection)')
      .single();

    if (subjectError || !quranSubject) {
      console.error('❌ Could not find Quran subject');
      return;
    }

    console.log(`✅ Found subject: ${quranSubject.name}`);

    // Create a test lesson for Quran
    const { data: quranLesson, error: quranLessonError } = await supabase
      .from('lessons')
      .insert({
        learner_id: learner.id,
        teacher_id: teacher.id,
        subject_id: quranSubject.id,
        scheduled_time: '2025-11-10T14:00:00Z',
        duration_minutes: 60,
        status: 'completed',
        recording_url: 'https://example.com/test-recording',
        room_code: 'test-quran-lesson'
      })
      .select()
      .single();

    if (quranLessonError) {
      console.error('❌ Error creating Quran lesson:', quranLessonError);
      return;
    }

    console.log(`✅ Created Quran lesson: ${quranLesson.id}`);

    // Read the Quran insight markdown
    const quranInsightPath = path.join(__dirname, 'test-data', 'QURAN_UNDERSTANDING_INSIGHT_EXAMPLE.md');
    const quranInsightContent = fs.readFileSync(quranInsightPath, 'utf-8');

    // Create Quran insight
    const { data: quranInsight, error: quranInsightError } = await supabase
      .from('lesson_insights')
      .insert({
        lesson_id: quranLesson.id,
        learner_id: learner.id,
        insight_type: 'quran_tadabbur',
        title: 'Quran Understanding - Surah Al-Qasas (28:20-28)',
        summary: 'Deep tadabbur of Musa\'s (AS) escape from Egypt and journey to Madyan, exploring themes of tawakkul, divine provision, and good character.',
        detailed_insights: {
          content: quranInsightContent,
          subject: 'Quran with Tadabbur',
          metadata: {
            surah_name: 'Al-Qasas (The Story)',
            surah_number: 28,
            ayah_range: 'Ayat 20-28',
            teacher_name: teacher.profiles.full_name,
            student_names: [userProfile.full_name || 'Student'],
            lesson_date: '2025-11-10',
            duration_minutes: 60
          }
        },
        viewed_by_student: false,
        student_rating: null
      })
      .select()
      .single();

    if (quranInsightError) {
      console.error('❌ Error creating Quran insight:', quranInsightError);
      return;
    }

    console.log(`✅ Created Quran insight: ${quranInsight.id}`);

    // Get Arabic subject
    const { data: arabicSubject, error: arabicSubjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .ilike('name', '%arabic%')
      .limit(1)
      .single();

    if (arabicSubjectError || !arabicSubject) {
      console.error('⚠️ Could not find Arabic subject, skipping Arabic insight');
    } else {
      console.log(`✅ Found subject: ${arabicSubject.name}`);

      // Create a test lesson for Arabic
      const { data: arabicLesson, error: arabicLessonError } = await supabase
        .from('lessons')
        .insert({
          learner_id: learner.id,
          teacher_id: teacher.id,
          subject_id: arabicSubject.id,
          scheduled_time: '2025-11-10T15:00:00Z',
          duration_minutes: 60,
          status: 'completed',
          recording_url: 'https://example.com/test-recording-2',
          room_code: 'test-arabic-lesson'
        })
        .select()
        .single();

      if (arabicLessonError) {
        console.error('❌ Error creating Arabic lesson:', arabicLessonError);
      } else {
        console.log(`✅ Created Arabic lesson: ${arabicLesson.id}`);

        // Read the Arabic insight markdown
        const arabicInsightPath = path.join(__dirname, 'test-data', 'ARABIC_LANGUAGE_INSIGHT_EXAMPLE.md');
        const arabicInsightContent = fs.readFileSync(arabicInsightPath, 'utf-8');

        // Create Arabic insight
        const { data: arabicInsight, error: arabicInsightError } = await supabase
          .from('lesson_insights')
          .insert({
            lesson_id: arabicLesson.id,
            learner_id: learner.id,
            insight_type: 'arabic_language',
            title: 'Arabic Language - Daily Activities & Verb Tenses',
            summary: 'Comprehensive lesson on present, past, and future verb conjugations with daily routine vocabulary and pronunciation practice.',
            detailed_insights: {
              content: arabicInsightContent,
              subject: 'Arabic Language',
              metadata: {
                teacher_name: teacher.profiles.full_name,
                student_names: [userProfile.full_name || 'Student'],
                lesson_date: '2025-11-10',
                duration_minutes: 60
              }
            },
            viewed_by_student: false,
            student_rating: null
          })
          .select()
          .single();

        if (arabicInsightError) {
          console.error('❌ Error creating Arabic insight:', arabicInsightError);
        } else {
          console.log(`✅ Created Arabic insight: ${arabicInsight.id}`);
          console.log(`\n🔗 View Arabic insight at: http://localhost:5173/lesson/${arabicLesson.id}/insights`);
        }
      }
    }

    console.log(`\n✨ SUCCESS! Test insights created!`);
    console.log(`\n🔗 View Quran insight at: http://localhost:5173/lesson/${quranLesson.id}/insights`);
    console.log(`\n📝 To view in app:`);
    console.log(`   1. Go to http://localhost:5173/dashboard`);
    console.log(`   2. Click on "Recordings History" or "Recent Recordings"`);
    console.log(`   3. Click "View AI Notes" on any lesson`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestInsights();
