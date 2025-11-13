import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { roomCode, userId, role } = requestData
    
    const managementToken = Deno.env.get('HMS_MANAGEMENT_TOKEN')
    if (!managementToken) {
      throw new Error('HMS Management Token not found in environment variables')
    }

    if (!roomCode) {
      throw new Error('Room code is required')
    }

    const finalUserId = userId || `user_${Date.now()}`
    const finalRole = role || 'guest'
    
    console.log('🎯 GENERATING AUTH TOKEN FOR:', {
      roomCode,
      userId: finalUserId,
      role: finalRole,
      codeLength: roomCode.length,
      codeFormat: roomCode.includes('-') ? 'FORMATTED_CODE' : 'RAW_ID'
    })

    // Step 1: Verify the room code exists and is enabled
    console.log('🔍 Verifying room code exists:', roomCode)
    
    try {
      const verifyResponse = await fetch(`https://api.100ms.live/v2/room-codes/code/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (verifyResponse.ok) {
        const codeInfo = await verifyResponse.json()
        console.log('✅ Room code verified:', {
          code: codeInfo.code,
          enabled: codeInfo.enabled,
          room_id: codeInfo.room_id,
          role: codeInfo.role
        })

        if (!codeInfo.enabled) {
          // Try to enable the room code
          console.log('🔧 Attempting to enable room code...')
          
          const enableResponse = await fetch(`https://api.100ms.live/v2/room-codes/code/${roomCode}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${managementToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              enabled: true
            })
          })

          if (enableResponse.ok) {
            console.log('✅ Room code enabled successfully')
          } else {
            console.warn('⚠️ Failed to enable room code, proceeding anyway')
          }
        }
      } else {
        console.warn('⚠️ Room code verification failed:', verifyResponse.status)
        // Continue anyway - the code might still work for auth token generation
      }
    } catch (verifyError) {
      console.warn('⚠️ Room code verification error:', verifyError.message)
      // Continue anyway
    }

    // Step 2: Generate auth token with retry logic
    let authToken = null
    let lastError = null
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Auth token generation attempt ${attempt}/${maxRetries}`)
      
      try {
        const tokenResponse = await fetch('https://api.100ms.live/v2/auth-tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_code: roomCode,  // Always use room_code parameter for codes
            user_id: finalUserId,
            role: finalRole,
            type: 'app'
          })
        })

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          authToken = tokenData.token
          console.log('✅ Auth token generated successfully on attempt', attempt)
          break
        } else {
          const errorText = await tokenResponse.text()
          lastError = {
            status: tokenResponse.status,
            error: errorText,
            attempt: attempt
          }
          
          console.error(`❌ Auth token attempt ${attempt} failed:`, {
            status: tokenResponse.status,
            error: errorText
          })

          // If it's a "not found" error, wait a bit before retrying (room code might need time to propagate)
          if (tokenResponse.status === 404 && attempt < maxRetries) {
            console.log(`⏳ Waiting 2 seconds before retry ${attempt + 1}...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      } catch (fetchError) {
        lastError = {
          status: 'network_error',
          error: fetchError.message,
          attempt: attempt
        }
        
        console.error(`❌ Network error on attempt ${attempt}:`, fetchError.message)
        
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting 1 second before retry ${attempt + 1}...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    if (!authToken) {
      // If all attempts failed, provide detailed error information
      let errorMessage = 'Failed to generate auth token after multiple attempts'
      let suggestion = 'Please check your HMS configuration and room code'
      
      if (lastError) {
        if (lastError.status === 404) {
          errorMessage = 'Room code not found or not yet available'
          suggestion = 'The room code might be newly created and not yet propagated. Please wait a few moments and try again.'
        } else if (lastError.status === 401) {
          errorMessage = 'HMS Management Token is invalid or expired'
          suggestion = 'Please generate a new HMS Management Token from your 100ms dashboard'
        } else if (lastError.status === 403) {
          errorMessage = 'Access denied - insufficient permissions'
          suggestion = 'Check your HMS template configuration and role permissions'
        } else {
          errorMessage = `HMS API error: ${lastError.error}`
        }
      }

      console.error('🚨 FINAL AUTH TOKEN GENERATION FAILURE:', {
        roomCode,
        lastError,
        errorMessage,
        suggestion
      })

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          suggestion: suggestion,
          details: {
            roomCode: roomCode,
            attempts: maxRetries,
            lastError: lastError,
            troubleshooting: {
              checkRoomCode: 'Verify the room code exists in your 100ms dashboard',
              checkTemplate: 'Ensure your Azhari Academy template is configured correctly',
              checkToken: 'Verify HMS_MANAGEMENT_TOKEN is valid and has proper permissions',
              timing: 'Room codes might need a few moments to become available after creation'
            },
            timestamp: new Date().toISOString()
          }
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

    console.log('🎉 AUTH TOKEN GENERATED SUCCESSFULLY:', { 
      roomCode, 
      userId: finalUserId, 
      role: finalRole,
      tokenLength: authToken.length,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        authToken: authToken,
        roomCode: roomCode,
        userId: finalUserId,
        role: finalRole,
        debug: {
          roomCodeVerified: true,
          tokenGenerated: true,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ CRITICAL ERROR IN AUTH TOKEN GENERATION:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        suggestion: 'Please check your HMS configuration and try again',
        details: {
          originalError: error.message,
          timestamp: new Date().toISOString(),
          troubleshooting: {
            checkConfig: 'Verify HMS_MANAGEMENT_TOKEN is set correctly',
            checkRoom: 'Confirm room codes exist and are enabled in 100ms dashboard',
            checkNetwork: 'Ensure network connectivity to 100ms API',
            retryLater: 'Room codes might need time to propagate after creation'
          }
        }
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