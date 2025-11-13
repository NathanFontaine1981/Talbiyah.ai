// Create a real 100ms room for the test lesson
const lessonId = '6ca078f0-044a-4961-8246-7f6139da3ccc';

const response = await fetch('https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/create-hms-room', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU'
  },
  body: JSON.stringify({
    roomName: 'Nathan-Test-Lesson-Nov9',
    description: 'Test lesson for Nathan - Quran with Understanding',
    bookingId: lessonId
  })
});

const data = await response.json();

if (data.success) {
  console.log('✅ 100ms room created successfully!');
  console.log('Room ID:', data.room.id);
  console.log('Room Name:', data.room.name);
  console.log('Teacher Code:', data.room.codes?.teacher || data.room.roomCode);
  console.log('Student Code:', data.room.codes?.student || data.room.roomCode);
  console.log('\nNow updating the lesson with the room code...');

  // Import supabase to update the lesson
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    'https://boyrjgivpepjiboekwuu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU'
  );

  const roomCode = data.room.codes?.student || data.room.roomCode;

  const { error: updateError } = await supabase
    .from('lessons')
    .update({ '100ms_room_id': roomCode })
    .eq('id', lessonId);

  if (updateError) {
    console.error('Error updating lesson:', updateError);
  } else {
    console.log('✅ Lesson updated with room code:', roomCode);
    console.log('\n🎉 You can now join the lesson!');
    console.log('Visit: http://localhost:5174/lesson/' + lessonId);
  }
} else {
  console.error('❌ Failed to create room:', data.error);
  console.error('Details:', data.details);
}
