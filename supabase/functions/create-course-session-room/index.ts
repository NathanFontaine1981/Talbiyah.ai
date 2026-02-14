import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { getHMSManagementToken } from "../_shared/hms.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.roles?.includes('admin')
    const isTeacher = profile?.roles?.includes('teacher')

    if (!isAdmin && !isTeacher) {
      throw new Error('Only admins and teachers can start course classes')
    }

    const { course_session_id } = await req.json()

    if (!course_session_id) {
      throw new Error('course_session_id is required')
    }

    // Get course session details
    const { data: session, error: sessionError } = await supabase
      .from('course_sessions')
      .select(`
        id,
        session_number,
        title,
        group_session_id,
        room_id,
        room_code_host,
        room_code_guest,
        live_status,
        group_sessions!inner(
          id,
          name,
          teacher_id
        )
      `)
      .eq('id', course_session_id)
      .single()

    if (sessionError || !session) {
      throw new Error('Course session not found')
    }

    // Verify user is the course teacher or admin
    const courseTeacherId = session.group_sessions?.teacher_id
    if (!isAdmin && user.id !== courseTeacherId) {
      throw new Error('Only the course teacher can start this class')
    }

    // If room already exists, just set live and return existing codes
    if (session.room_id && session.room_code_host && session.room_code_guest) {
      // Update live_status to 'live' (teacher rejoining)
      await supabase
        .from('course_sessions')
        .update({ live_status: 'live', updated_at: new Date().toISOString() })
        .eq('id', course_session_id)

      console.log('Rejoining existing room for course session:', course_session_id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Room already exists - rejoining',
          room: {
            id: session.room_id,
            host_code: session.room_code_host,
            guest_code: session.room_code_guest,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate 100ms management token
    const managementToken = await getHMSManagementToken()

    const courseName = session.group_sessions?.name || 'Course'
    const roomName = `course-${courseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-s${session.session_number}-${Date.now()}`

    console.log('Creating 100ms room for course session:', { course_session_id, roomName })

    // Step 1: Create the room
    const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        description: `Course: ${courseName} - Session ${session.session_number}${session.title ? `: ${session.title}` : ''}`,
        template_id: '696bc294a090b0544dfda056',
        region: 'eu',
      })
    })

    if (!roomResponse.ok) {
      const error = await roomResponse.text()
      throw new Error(`Failed to create room: ${error}`)
    }

    const roomData = await roomResponse.json()
    console.log('Room created:', roomData.id)

    // Step 2: Wait for room initialization
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Step 3: Create room codes with retry
    let roomCodesData = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomData.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: true })
      })

      if (roomCodesResponse.ok) {
        roomCodesData = await roomCodesResponse.json()
        break
      }

      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    if (!roomCodesData) {
      throw new Error('Failed to create room codes')
    }

    // Step 4: Extract room codes
    let hostCode = null
    let guestCode = null

    if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
      roomCodesData.data.forEach((codeObj: any) => {
        if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
          hostCode = codeObj.code
        } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
          guestCode = codeObj.code
        }
      })
    }

    // Fallback
    const allCodes = roomCodesData.data?.map((c: any) => c.code) || []
    if (!hostCode && allCodes.length > 0) hostCode = allCodes[0]
    if (!guestCode && allCodes.length > 1) guestCode = allCodes[1]
    if (!guestCode && allCodes.length === 1) guestCode = allCodes[0]

    console.log('Room codes created:', { hostCode, guestCode })

    // Step 5: Update course session with room info and set live
    const { error: updateError } = await supabase
      .from('course_sessions')
      .update({
        room_id: roomData.id,
        room_code_host: hostCode,
        room_code_guest: guestCode,
        live_status: 'live',
        updated_at: new Date().toISOString()
      })
      .eq('id', course_session_id)

    if (updateError) {
      console.error('Failed to update course session:', updateError)
      throw new Error('Failed to save room info to database')
    }

    console.log('Course session updated with room info, live_status = live')

    return new Response(
      JSON.stringify({
        success: true,
        room: {
          id: roomData.id,
          name: roomData.name,
          host_code: hostCode,
          guest_code: guestCode,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating course session room:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
