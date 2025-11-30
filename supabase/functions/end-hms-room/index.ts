import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getHMSManagementToken } from "../_shared/hms.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  let requestData
  try {
    requestData = await req.json()
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  try {
    const { roomId, lessonId } = requestData

    // Generate 100ms management token dynamically (auto-refreshes, never expires)
    let managementToken: string
    try {
      managementToken = await getHMSManagementToken()
    } catch (tokenError) {
      console.error('Failed to generate 100ms token:', tokenError)
      throw new Error(`Failed to generate HMS management token: ${tokenError.message}`)
    }

    if (!roomId) {
      throw new Error('Room ID is required')
    }

    console.log('🛑 ENDING HMS ROOM:', { roomId, lessonId })

    // End the active session in the room using 100ms API
    // This will kick all participants out of the room
    const endSessionResponse = await fetch(`https://api.100ms.live/v2/active-rooms/${roomId}/end-room`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Session ended by teacher',
        lock: false // Don't lock the room, just end the current session
      })
    })

    if (!endSessionResponse.ok) {
      const error = await endSessionResponse.text()
      console.error('❌ Failed to end room:', error)

      // If room is not active (404), that's okay - it means no one is in there
      if (endSessionResponse.status === 404) {
        console.log('ℹ️ Room was not active (no participants)')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Room was not active',
            roomId
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      throw new Error(`Failed to end room: ${error}`)
    }

    const result = await endSessionResponse.json()
    console.log('✅ Room ended successfully:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Room ended successfully',
        roomId,
        result
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error ending HMS room:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
