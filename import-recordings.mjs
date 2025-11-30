import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU'
);

const HMS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjkwNWY3N2ViZDBkYWI1ZjlhMDE0NDk4IiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJpYXQiOjE3NjQxMTc1NDgsIm5iZiI6MTc2NDExNzU0OCwiZXhwIjoxNzY0NzIyMzQ4LCJqdGkiOiI2MzUyOTM0Yy0zOGUyLTQwZjItOTExNC1lZGQ5NmMxOTRmOGIifQ.SpuGRE6eJFgxvMocdEn1e1G2q5DYaXzPQSjl3gnbjPM';

async function importRecordings() {
  // Get recording assets from 100ms
  const response = await fetch('https://api.100ms.live/v2/recording-assets?limit=50', {
    headers: { 'Authorization': 'Bearer ' + HMS_TOKEN }
  });
  const data = await response.json();
  
  // Filter for composite/stream recordings (not individual tracks)
  const streamRecordings = data.data.filter(r => r.type === 'stream');
  console.log('Found', streamRecordings.length, 'stream recordings');
  
  // Get unique room IDs
  const roomIds = [...new Set(streamRecordings.map(r => r.room_id))];
  console.log('Unique room IDs:', roomIds);
  
  // Get lessons with matching room IDs
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, "100ms_room_id", learner_id, teacher_id')
    .in('100ms_room_id', roomIds);
    
  if (error) {
    console.error('Error fetching lessons:', error);
    return;
  }
  
  console.log('Matched lessons:', lessons?.length || 0);
  
  // Create a map of room_id -> lesson
  const roomToLesson = new Map();
  lessons?.forEach(l => roomToLesson.set(l['100ms_room_id'], l));
  
  // Group recordings by room_id and take one per room (longest duration)
  const recordingsByRoom = new Map();
  for (const rec of streamRecordings) {
    const existing = recordingsByRoom.get(rec.room_id);
    if (!existing || rec.duration > existing.duration) {
      recordingsByRoom.set(rec.room_id, rec);
    }
  }
  
  console.log('Unique room recordings to import:', recordingsByRoom.size);
  
  // Process each unique room recording
  for (const [roomId, recording] of recordingsByRoom) {
    const lesson = roomToLesson.get(roomId);
    if (!lesson) {
      console.log('No lesson found for room:', roomId);
      continue;
    }
    
    console.log('\nProcessing recording for lesson:', lesson.id);
    console.log('  Duration:', recording.duration, 'seconds');
    console.log('  Size:', Math.round(recording.size / 1024 / 1024), 'MB');
    
    // Get presigned URL
    const urlResponse = await fetch('https://api.100ms.live/v2/recording-assets/' + recording.id + '/presigned-url', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + HMS_TOKEN }
    });
    
    if (!urlResponse.ok) {
      console.log('  Failed to get presigned URL');
      continue;
    }
    
    const urlData = await urlResponse.json();
    console.log('  Got presigned URL');
    
    // Use the Edge Function to save (bypasses RLS)
    const saveResponse = await fetch('https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/handle-recording-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_id: recording.room_id,
        session_id: recording.session_id,
        recording_id: recording.id,
        recording_url: urlData.url,
        recording_size: recording.size,
        duration: recording.duration
      })
    });
    
    const result = await saveResponse.json();
    if (result.success) {
      console.log('  Saved to database via webhook handler!');
    } else {
      console.log('  Result:', JSON.stringify(result));
    }
    
    // Mark lesson as completed
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ status: 'completed' })
      .eq('id', lesson.id);
      
    if (updateError) {
      console.log('  Could not update lesson status:', updateError.message);
    } else {
      console.log('  Lesson marked as completed');
    }
  }
  
  console.log('\nDone!');
}

importRecordings();
