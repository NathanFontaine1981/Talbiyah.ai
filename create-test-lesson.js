import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://boyrjgivpepjiboekwuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestLesson() {
  try {
    // Calculate time 5 minutes from now
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + 5);

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        learner_id: '5bb6b97d-028b-4fa0-bc0c-2eb22fa64558', // Nathan's learner ID
        teacher_id: '4c202a41-15a3-4d15-96b4-f763321c6133', // Ayodeji teacher profile ID
        subject_id: '12eef119-16e4-45ac-a7d9-1ec5291f83ed', // Quran subject
        scheduled_time: scheduledTime.toISOString(),
        duration_minutes: 60,
        status: 'booked',
        is_free_trial: false,
        '100ms_room_id': 'test-room-talbiyah-' + Math.floor(Math.random() * 100000)
      })
      .select();

    if (error) {
      console.error('Error creating lesson:', error);
      return;
    }

    console.log('✅ Test lesson created successfully:');
    console.log('Lesson ID:', data[0].id);
    console.log('Scheduled time:', data[0].scheduled_time);
    console.log('Room ID:', data[0]['100ms_room_id']);
    console.log('\n🎯 You can now log in and join this lesson!');
  } catch (error) {
    console.error('Failed to create lesson:', error);
  }
}

createTestLesson();
