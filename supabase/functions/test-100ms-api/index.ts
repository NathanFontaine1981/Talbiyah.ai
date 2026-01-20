import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getHMSManagementToken } from "../_shared/hms.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  const HMS_TEMPLATE_ID = Deno.env.get('HMS_TEMPLATE_ID') || '696bc294a090b0544dfda056'

  let HMS_MANAGEMENT_TOKEN: string
  try {
    HMS_MANAGEMENT_TOKEN = await getHMSManagementToken()
    console.log('🔑 HMS_MANAGEMENT_TOKEN: Generated fresh token automatically')
  } catch (error) {
    console.error('❌ Failed to generate HMS token:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to generate HMS token',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
  console.log('📋 HMS_TEMPLATE_ID:', HMS_TEMPLATE_ID)

  // Check if this is an update_template action
  let action = 'test'
  try {
    const body = await req.json()
    action = body.action || 'test'
  } catch {
    // No body or invalid JSON, default to test action
  }

  try {
    // Handle update_template action
    if (action === 'update_template') {
      console.log('\n📍 Updating template with browser recording and transcription...')

      // Get current template
      const getResponse = await fetch(
        `https://api.100ms.live/v2/templates/${HMS_TEMPLATE_ID}`,
        {
          headers: {
            Authorization: `Bearer ${HMS_MANAGEMENT_TOKEN}`,
          },
        }
      )

      if (!getResponse.ok) {
        const error = await getResponse.text()
        throw new Error(`Failed to get template: ${error}`)
      }

      const template = await getResponse.json()
      console.log('Current template:', template.name)

      // Update template with proper browser recording configuration
      const updatedDestinations = {
        ...template.destinations,
        browserRecordings: {
          "composite-recording": {
            name: "composite-recording",
            width: 1920,
            height: 1080,
            maxDuration: 7200,
            presignDuration: 604800,
            role: "__internal_recorder",
            autoStopTimeout: 300,
            recording: {
              upload: {
                type: "gs",
                location: "talbiyah-lesson-recordings",
                prefix: "recordings/",
                credentials: {
                  key: Deno.env.get("GCS_ACCESS_KEY") || "",
                  secretKey: Deno.env.get("GCS_SECRET_KEY") || ""
                },
                options: {
                  region: "europe-west2"
                }
              },
              thumbnails: {
                enabled: true,
                width: 1280,
                height: 720,
                offsets: [2, 30, 60]
              }
            }
          }
        },
        transcriptions: {
          "lesson-transcription": {
            name: "lesson-transcription",
            role: "__internal_recorder",
            modes: ["recorded"],
            outputModes: ["txt", "json", "srt"],
            language: "en",
            summary: {
              enabled: true,
              context: "Islamic education lesson - Quran, Arabic, or Islamic studies",
              sections: [
                { title: "Topics Covered", format: "bullets" },
                { title: "Key Vocabulary", format: "bullets" },
                { title: "Summary", format: "paragraph" }
              ],
              temperature: 0.5
            }
          }
        }
      }

      const updateResponse = await fetch(
        `https://api.100ms.live/v2/templates/${HMS_TEMPLATE_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HMS_MANAGEMENT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destinations: updatedDestinations,
          }),
        }
      )

      if (!updateResponse.ok) {
        const error = await updateResponse.text()
        throw new Error(`Failed to update template: ${error}`)
      }

      const updatedTemplate = await updateResponse.json()
      console.log("Template updated successfully")

      return new Response(
        JSON.stringify({
          success: true,
          message: "Template updated with browser recording and transcription",
          template_id: HMS_TEMPLATE_ID,
          browserRecordings: Object.keys(updatedTemplate.destinations?.browserRecordings || {}),
          transcriptions: Object.keys(updatedTemplate.destinations?.transcriptions || {}),
        }, null, 2),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Default test action - create a test room
    const requestBody = {
      name: `Test-Room-${Date.now()}`,
      description: `Test room for debugging`,
      template_id: HMS_TEMPLATE_ID,
      region: 'eu',
    }

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))

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
