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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify user is admin or teacher
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
    const isTeacher = profile?.roles?.includes('Teacher')

    if (!isAdmin && !isTeacher) {
      throw new Error('Only admins and teachers can create group session rooms')
    }

    const { group_session_id } = await req.json()

    if (!group_session_id) {
      throw new Error('group_session_id is required')
    }

    // Get group session details
    const { data: session, error: sessionError } = await supabase
      .from('group_sessions')
      .select(`
        id,
        name,
        teacher_id,
        subject_id,
        subjects(name),
        "100ms_room_id",
        teacher_room_code,
        student_room_code
      `)
      .eq('id', group_session_id)
      .single()

    if (sessionError || !session) {
      throw new Error('Group session not found')
    }

    // Check if room already exists
    if (session['100ms_room_id'] && session.teacher_room_code && session.student_room_code) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Room already exists',
          room: {
            id: session['100ms_room_id'],
            teacher_room_code: session.teacher_room_code,
            student_room_code: session.student_room_code
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate 100ms management token
    const managementToken = await getHMSManagementToken()

    // Create room name
    const subjectName = session.subjects?.name || 'Islamic Studies'
    const roomName = `group-${session.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`

    console.log('Creating 100ms room for group session:', { group_session_id, roomName })

    // Step 1: Create the room
    const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        description: `Group Session: ${session.name} - ${subjectName}`,
        template_id: '6905fb03033903926e627d60', // Talbiyah.ai template
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

    // Step 3: Create room codes
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
    let teacherCode = null
    let studentCode = null

    if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
      roomCodesData.data.forEach(codeObj => {
        if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
          teacherCode = codeObj.code
        } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
          studentCode = codeObj.code
        }
      })
    }

    // Fallback
    const allCodes = roomCodesData.data?.map(c => c.code) || []
    if (!teacherCode && allCodes.length > 0) teacherCode = allCodes[0]
    if (!studentCode && allCodes.length > 1) studentCode = allCodes[1]
    if (!studentCode && allCodes.length === 1) studentCode = allCodes[0]

    console.log('Room codes created:', { teacherCode, studentCode })

    // Step 5: Update group session with room info
    const { error: updateError } = await supabase
      .from('group_sessions')
      .update({
        '100ms_room_id': roomData.id,
        teacher_room_code: teacherCode,
        student_room_code: studentCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', group_session_id)

    if (updateError) {
      console.error('Failed to update group session:', updateError)
      throw new Error('Failed to save room info to database')
    }

    console.log('Group session updated with room info')

    return new Response(
      JSON.stringify({
        success: true,
        room: {
          id: roomData.id,
          name: roomData.name,
          teacher_room_code: teacherCode,
          student_room_code: studentCode
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating group session room:', error)
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
