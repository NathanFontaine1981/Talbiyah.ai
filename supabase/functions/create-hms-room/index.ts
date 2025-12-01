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
    const { roomName, description, bookingId } = requestData

    // Generate 100ms management token dynamically (auto-refreshes, never expires)
    let managementToken: string
    try {
      managementToken = await getHMSManagementToken()
    } catch (tokenError) {
      console.error('Failed to generate 100ms token:', tokenError)
      throw new Error(`Failed to generate HMS management token: ${tokenError.message}`)
    }

    if (!roomName) {
      throw new Error('Room name is required')
    }

    console.log('🚀 CREATING HMS ROOM:', { roomName, bookingId })

    // Step 1: Create room using 100ms Management API
    const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        description: description || `Live Islamic Learning Session: ${roomName}`,
        template_id: '6905fb03033903926e627d60', // Talbiyah.ai template
        region: 'eu', // EU region for UK users - lowest latency
      })
    })

    if (!roomResponse.ok) {
      const error = await roomResponse.text()
      console.error('❌ Failed to create room:', error)
      
      if (roomResponse.status === 401) {
        throw new Error('HMS Management Token is invalid or expired.')
      } else if (roomResponse.status === 403) {
        throw new Error('Access denied. Please check your HMS permissions.')
      } else if (roomResponse.status === 404) {
        throw new Error('Template not found. Please verify your template ID.')
      }
      
      throw new Error(`Failed to create room: ${error}`)
    }

    const roomData = await roomResponse.json()
    console.log('✅ Room created successfully:', {
      id: roomData.id,
      name: roomData.name,
      templateId: roomData.template_id
    })

    if (!roomData.id) {
      throw new Error('Room creation returned invalid data - missing room ID')
    }

    // Step 2: Wait for room to be fully initialized
    console.log('⏳ Initial wait for room initialization...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Step 3: Create room codes for all roles with proper error handling and retries
    console.log('🔑 Creating room codes with retry logic...')
    
    let roomCodesData = null
    let lastError = null
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Room code creation attempt ${attempt}/${maxRetries}`)
      
      try {
        const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomData.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enabled: true
          })
        })

        if (roomCodesResponse.ok) {
          roomCodesData = await roomCodesResponse.json()
          console.log('✅ Room codes created successfully on attempt', attempt)
          break
        } else {
          const error = await roomCodesResponse.text()
          lastError = { status: roomCodesResponse.status, error, attempt }
          console.error(`❌ Room codes attempt ${attempt} failed:`, error)
          
          // Wait before retry if not the last attempt
          if (attempt < maxRetries) {
            console.log(`⏳ Waiting 3 seconds before retry ${attempt + 1}...`)
            await new Promise(resolve => setTimeout(resolve, 3000))
          }
        }
      } catch (fetchError) {
        lastError = { status: 'network_error', error: fetchError.message, attempt }
        console.error(`❌ Network error on attempt ${attempt}:`, fetchError.message)
        
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting 2 seconds before retry ${attempt + 1}...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    if (!roomCodesData) {
      console.error('🚨 All room code creation attempts failed:', lastError)
      throw new Error(`Failed to create room codes after ${maxRetries} attempts: ${lastError?.error}`)
    }

    console.log('✅ Room codes response:', roomCodesData)

    // Step 4: Extract and validate room codes
    const codes = {}
    let teacherCode = null
    let studentCode = null

    if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
      roomCodesData.data.forEach(codeObj => {
        codes[codeObj.role] = codeObj.code
        
        // Map roles to our application roles
        if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
          teacherCode = codeObj.code
        } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant' || codeObj.role === 'viewer') {
          studentCode = codeObj.code
        }
      })
    }

    // Fallback assignment if specific roles not found
    const allCodes = Object.values(codes)
    if (!teacherCode && allCodes.length > 0) teacherCode = allCodes[0]
    if (!studentCode && allCodes.length > 1) studentCode = allCodes[1]
    if (!studentCode && allCodes.length === 1) studentCode = allCodes[0]

    console.log('🎯 ROOM CODES MAPPING:', {
      allCodes: codes,
      teacherCode,
      studentCode,
      hasDistinctCodes: teacherCode !== studentCode,
      totalCodes: Object.keys(codes).length
    })

    // Step 5: Ensure room codes are enabled and wait for propagation
    console.log('🔧 Ensuring room codes are enabled...')
    
    const enablePromises = []
    
    if (teacherCode) {
      enablePromises.push(
        fetch(`https://api.100ms.live/v2/room-codes/code/${teacherCode}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled: true })
        }).then(res => {
          if (res.ok) {
            console.log('✅ Teacher code enabled:', teacherCode)
          } else {
            console.warn('⚠️ Teacher code enable failed (may already be enabled):', teacherCode)
          }
        }).catch(err => {
          console.warn('⚠️ Teacher code enable error:', err.message)
        })
      )
    }

    if (studentCode && studentCode !== teacherCode) {
      enablePromises.push(
        fetch(`https://api.100ms.live/v2/room-codes/code/${studentCode}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled: true })
        }).then(res => {
          if (res.ok) {
            console.log('✅ Student code enabled:', studentCode)
          } else {
            console.warn('⚠️ Student code enable failed (may already be enabled):', studentCode)
          }
        }).catch(err => {
          console.warn('⚠️ Student code enable error:', err.message)
        })
      )
    }

    // Wait for all enable operations to complete
    await Promise.all(enablePromises)

    // Step 6: Additional wait for HMS propagation
    console.log('⏳ Waiting for HMS system propagation...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Step 7: Verify room codes are working with comprehensive testing
    console.log('🧪 Testing room codes with retry logic...')
    
    const testCode = async (code, codeName, retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`🔍 Testing ${codeName} code (attempt ${attempt}/${retries}):`, code)
        
        try {
          const testTokenResponse = await fetch('https://api.100ms.live/v2/auth-tokens', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${managementToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              room_code: code,
              user_id: 'test-user-' + Date.now(),
              role: codeName.toLowerCase(),
              type: 'app'
            })
          })

          if (testTokenResponse.ok) {
            console.log(`✅ ${codeName} code verified and working:`, code)
            return true
          } else {
            const testError = await testTokenResponse.text()
            console.warn(`⚠️ ${codeName} code test attempt ${attempt} failed:`, testError)
            
            // If it's a "not found" error and we have retries left, wait and retry
            if (testTokenResponse.status === 404 && attempt < retries) {
              console.log(`⏳ Waiting 3 seconds before retry...`)
              await new Promise(resolve => setTimeout(resolve, 3000))
            }
          }
        } catch (testError) {
          console.warn(`⚠️ ${codeName} code test attempt ${attempt} network error:`, testError.message)
          
          if (attempt < retries) {
            console.log(`⏳ Waiting 2 seconds before retry...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      console.error(`❌ ${codeName} code failed all test attempts:`, code)
      return false
    }

    // Test both codes
    const teacherCodeWorking = teacherCode ? await testCode(teacherCode, 'Teacher') : false
    const studentCodeWorking = studentCode ? await testCode(studentCode, 'Student') : false

    if (!teacherCodeWorking && !studentCodeWorking) {
      console.error('🚨 CRITICAL: No room codes are working after verification')
      throw new Error('Room codes were created but are not functioning. This may be a 100ms propagation issue.')
    }

    // Step 8: Final verification that codes are available via room code lookup
    console.log('🔍 Final verification via room code lookup...')
    
    if (teacherCode) {
      try {
        const lookupResponse = await fetch(`https://api.100ms.live/v2/room-codes/code/${teacherCode}`, {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
          }
        })
        
        if (lookupResponse.ok) {
          const lookupData = await lookupResponse.json()
          console.log('✅ Teacher code lookup successful:', {
            code: lookupData.code,
            enabled: lookupData.enabled,
            room_id: lookupData.room_id
          })
        }
      } catch (lookupError) {
        console.warn('⚠️ Teacher code lookup failed:', lookupError.message)
      }
    }

    const responseData = {
      success: true,
      room: {
        id: roomData.id,
        name: roomData.name,
        templateId: '684b54d6033903926e6127a1',
        createdAt: roomData.created_at || new Date().toISOString(),
        
        // Provide primary room code for compatibility
        roomCode: teacherCode || studentCode,
        
        // Provide distinct codes if available
        codes: teacherCode && studentCode ? {
          teacher: teacherCode,
          student: studentCode
        } : null,
        
        // Raw API response for debugging
        allRoleCodes: codes,
        
        debug: {
          roomCodesCreated: true,
          availableRoles: Object.keys(codes),
          hasDistinctCodes: teacherCode !== studentCode,
          teacherCodeWorking,
          studentCodeWorking,
          strategy: 'comprehensive_validation',
          propagationWaitTime: '8_seconds',
          retryAttempts: maxRetries,
          timestamp: new Date().toISOString()
        }
      }
    }

    console.log('🎉 ROOM CREATION COMPLETE WITH VERIFICATION:', {
      roomId: roomData.id,
      roomName: roomData.name,
      teacherCode,
      studentCode,
      teacherCodeWorking,
      studentCodeWorking,
      totalCodes: Object.keys(codes).length
    })

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error creating HMS room:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: {
          timestamp: new Date().toISOString(),
          step: error.message.includes('room codes') ? 'room_code_creation' : 'room_creation',
          suggestion: error.message.includes('token') 
            ? 'Check HMS_MANAGEMENT_TOKEN validity and permissions'
            : error.message.includes('template')
            ? 'Verify template ID exists and has proper role configuration'
            : error.message.includes('propagation')
            ? 'Try again in a few minutes - this may be a temporary HMS issue'
            : 'Check HMS configuration and try again',
          troubleshooting: {
            checkToken: 'Verify HMS_APP_ACCESS_KEY and HMS_APP_SECRET are set in Supabase secrets',
            checkTemplate: 'Ensure template 684b54d6033903926e6127a1 exists',
            checkRoles: 'Verify template has host and guest roles configured',
            retryLater: 'Room codes may need more time to propagate in HMS system'
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