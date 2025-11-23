import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const HMS_MANAGEMENT_TOKEN = Deno.env.get('HMS_MANAGEMENT_TOKEN')
  const HMS_TEMPLATE_ID = Deno.env.get('HMS_TEMPLATE_ID') || '6905fb03033903926e627d60'

  console.log('🔑 HMS_MANAGEMENT_TOKEN:', HMS_MANAGEMENT_TOKEN ? 'Present' : 'Missing')
  console.log('📋 HMS_TEMPLATE_ID:', HMS_TEMPLATE_ID)

  const requestBody = {
    name: `Test-Room-${Date.now()}`,
    description: `Test room for debugging`,
    template_id: HMS_TEMPLATE_ID,
    region: 'in',
  }

  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))

  try {
    // Step 1: Create a test room
    console.log('\n📍 Step 1: Creating test room...')
    const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!roomResponse.ok) {
      const errorText = await roomResponse.text()
      console.error('❌ Room creation failed:', roomResponse.status, errorText)
      return new Response(JSON.stringify({
        error: 'Room creation failed',
        status: roomResponse.status,
        details: errorText
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    const roomData = await roomResponse.json()
    console.log('✅ Room created:', JSON.stringify(roomData, null, 2))

    const roomId = roomData.id

    // Step 2: Wait a bit
    console.log('\n⏳ Step 2: Waiting 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 3: Generate room codes
    console.log('\n📍 Step 3: Generating room codes for room:', roomId)
    const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled: true })
    })

    if (!roomCodesResponse.ok) {
      const errorText = await roomCodesResponse.text()
      console.error('❌ Room codes generation failed:', roomCodesResponse.status, errorText)
      return new Response(JSON.stringify({
        error: 'Room codes generation failed',
        status: roomCodesResponse.status,
        details: errorText,
        roomData: roomData
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    const roomCodesData = await roomCodesResponse.json()
    console.log('✅ Room codes response:', JSON.stringify(roomCodesData, null, 2))

    // Step 4: Analyze the response
    let teacherCode = null
    let studentCode = null

    if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
      console.log('\n📋 Analyzing room codes:')
      roomCodesData.data.forEach((codeObj, index) => {
        console.log(`  [${index}] Role: "${codeObj.role}", Code: "${codeObj.code}"`)

        if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
          teacherCode = codeObj.code
          console.log(`    ✓ Matched as TEACHER code`)
        } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
          studentCode = codeObj.code
          console.log(`    ✓ Matched as STUDENT code`)
        } else {
          console.log(`    ⚠️ Unknown role, not matched`)
        }
      })
    }

    console.log('\n🎯 Final assignments:')
    console.log('  Teacher code:', teacherCode)
    console.log('  Student code:', studentCode)

    return new Response(JSON.stringify({
      success: true,
      roomData: roomData,
      roomCodesData: roomCodesData,
      assignments: {
        teacherCode: teacherCode,
        studentCode: studentCode
      }
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
