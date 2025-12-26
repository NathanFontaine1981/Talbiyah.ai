#!/usr/bin/env node
/**
 * Script to create a basic insight for a lesson that is missing one
 * Run with: node scripts/create-basic-insight.js <lesson_id>
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boyrjgivpepjiboekwuu.supabase.co';
// This is a service role key - be careful with it
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createBasicInsight(lessonId) {
  console.log('Creating basic insight for lesson:', lessonId);

  // Get lesson details
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      subject_id,
      teacher_id,
      learner_id,
      scheduled_time,
      duration_minutes,
      status,
      subjects!inner(name),
      learners!inner(name)
    `)
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson) {
    console.error('Lesson not found:', lessonError);
    return;
  }

  console.log('Found lesson:', lesson);

  const subjectName = lesson.subjects?.name || 'Lesson';
  const learnerName = lesson.learners?.name || 'Student';

  // Check if insight already exists
  const { data: existingInsight } = await supabase
    .from('lesson_insights')
    .select('id')
    .eq('lesson_id', lessonId)
    .single();

  if (existingInsight) {
    console.log('Insight already exists:', existingInsight.id);
    return;
  }

  // Create basic insight
  const { data: insight, error: insightError } = await supabase
    .from('lesson_insights')
    .insert({
      lesson_id: lesson.id,
      subject_id: lesson.subject_id,
      teacher_id: lesson.teacher_id,
      learner_id: lesson.learner_id,
      insight_type: 'subject_specific',
      title: `${subjectName} Session Summary`,
      summary: `A ${lesson.duration_minutes} minute ${subjectName} session was completed with ${learnerName}. Recording is available for review. AI-powered insights will be available for future lessons with improved transcription.`,
      key_topics: ['Session completed', 'Recording available'],
      areas_of_strength: ['Completed full lesson'],
      areas_for_improvement: ['Continue practicing regularly'],
      recommendations: ['Review the recording to consolidate learning', 'Continue from where you left off in the next session'],
      student_participation_score: 80,
      ai_model: 'manual_creation',
      confidence_score: 0.7,
    })
    .select('id')
    .single();

  if (insightError) {
    console.error('Error creating insight:', insightError);
    return;
  }

  console.log('✅ Basic insight created:', insight.id);
}

const lessonId = process.argv[2] || '6c770466-6cc4-4093-be44-c5b2e1e8d419';
createBasicInsight(lessonId).catch(console.error);
