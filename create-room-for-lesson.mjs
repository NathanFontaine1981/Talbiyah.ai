const MANAGEMENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NjI1NjAwNTUsImV4cCI6MTc2MzE2NDg1NSwianRpIjoiNTcyZjgzYWMtNDQzMC00NDAzLWE5OTctYWJmNzc5NmE3YzQwIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NjI1NjAwNTUsImFjY2Vzc19rZXkiOiI2OTA1Zjc3ZWJkMGRhYjVmOWEwMTQ0OTgifQ.2zkr68GOvEQ2GqkEPdAQN6IM0C8guLbRhueGNDnn3Ng';
const LESSON_ID = '30a7dd02-7e85-4abb-a661-d5b25e5e157b';
const SUPABASE_URL = 'https://boyrjgivpepjiboekwuu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

async function createRoomAndUpdateLesson() {
  try {
    console.log('🚀 Creating 100ms room...');

    // Step 1: Create room using 100ms API
    const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Lesson-${LESSON_ID}-${Date.now()}`,
        description: 'Quran with Understanding - Test Student',
        template_id: '6905fb03033903926e627d60',
        region: 'in',
      })
    });

    if (!roomResponse.ok) {
      const error = await roomResponse.text();
      throw new Error(`Failed to create room: ${error}`);
    }

    const roomData = await roomResponse.json();
    console.log('✅ Room created:', roomData.id);

    // Step 2: Wait for room initialization
    console.log('⏳ Waiting for room initialization...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Create room codes
    console.log('🔑 Creating room codes...');
    const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomData.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enabled: true
      })
    });

    if (!roomCodesResponse.ok) {
      const error = await roomCodesResponse.text();
      throw new Error(`Failed to create room codes: ${error}`);
    }

    const roomCodesData = await roomCodesResponse.json();
    console.log('✅ Room codes created:', roomCodesData);

    // Extract room codes
    let teacherCode = null;
    let studentCode = null;

    if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
      roomCodesData.data.forEach(codeObj => {
        if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
          teacherCode = codeObj.code;
        } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
          studentCode = codeObj.code;
        }
      });
    }

    // Fallback
    const allCodes = roomCodesData.data || [];
    if (!teacherCode && allCodes.length > 0) teacherCode = allCodes[0].code;
    if (!studentCode && allCodes.length > 1) studentCode = allCodes[1].code;
    if (!studentCode && allCodes.length === 1) studentCode = allCodes[0].code;

    console.log('🎯 Room Codes:', { teacherCode, studentCode });

    // Step 4: Wait for propagation
    console.log('⏳ Waiting for HMS propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 5: Update lesson in database
    console.log('💾 Updating lesson in database...');
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/lessons?id=eq.${LESSON_ID}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        '100ms_room_id': roomData.id,
        status: 'booked'
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update lesson: ${error}`);
    }

    const updatedLesson = await updateResponse.json();
    console.log('✅ Lesson updated:', updatedLesson);

    console.log('\n🎉 SUCCESS! Room is ready:');
    console.log('Room ID:', roomData.id);
    console.log('Teacher Code:', teacherCode);
    console.log('Student Code:', studentCode);
    console.log('Lesson ID:', LESSON_ID);
    console.log('\n✅ You can now log in and access the lesson!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createRoomAndUpdateLesson();
