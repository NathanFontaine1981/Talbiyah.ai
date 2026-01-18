import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { getHMSManagementToken } from "../_shared/hms.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

// Diagnostic assessments have 30-day recording retention (vs 7 days for regular lessons)
const ASSESSMENT_RECORDING_RETENTION_DAYS = 30

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create a client with the user's token to verify their identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Use service role for the actual operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const {
      assessment_id,
      teacher_id,
      scheduled_time,
      learner_id
    } = await req.json()

    if (!assessment_id) {
      return new Response(
        JSON.stringify({ error: 'assessment_id is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!teacher_id) {
      return new Response(
        JSON.stringify({ error: 'teacher_id is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!scheduled_time) {
      return new Response(
        JSON.stringify({ error: 'scheduled_time is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log('📋 Booking diagnostic assessment:', { assessment_id, teacher_id, scheduled_time, learner_id })

    // Verify the assessment exists and belongs to this user
    const { data: assessment, error: assessmentError } = await supabase
      .from('diagnostic_assessments')
      .select('id, student_id, status')
      .eq('id', assessment_id)
      .single()

    if (assessmentError || !assessment) {
      return new Response(
        JSON.stringify({ error: 'Assessment not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (assessment.student_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to book this assessment' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verify teacher exists and is approved
    const { data: teacher, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('id, user_id, status')
      .eq('id', teacher_id)
      .single()

    if (teacherError || !teacher) {
      return new Response(
        JSON.stringify({ error: 'Teacher not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (teacher.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Teacher is not available for bookings' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create 100ms room for the assessment
    console.log('🎥 Creating 100ms room for diagnostic assessment...')

    let managementToken: string
    try {
      managementToken = await getHMSManagementToken()
    } catch (tokenError) {
      console.error('Failed to generate 100ms token:', tokenError)
      throw new Error(`Failed to generate HMS management token: ${tokenError.message}`)
    }

    const roomName = `diagnostic-${assessment_id.substring(0, 8)}`

    // Create room
    const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        description: `Diagnostic Assessment Session - 20 minutes`,
        template_id: '696bc294a090b0544dfda056', // Talbiyah Europe workspace template
        region: 'eu',
      })
    })

    if (!roomResponse.ok) {
      const error = await roomResponse.text()
      console.error('Failed to create room:', error)
      throw new Error(`Failed to create video room: ${error}`)
    }

    const roomData = await roomResponse.json()
    console.log('✅ Room created:', roomData.id)

    // Wait for room initialization
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Create room codes
    let teacherCode = null
    let studentCode = null

    const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomData.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled: true })
    })

    if (roomCodesResponse.ok) {
      const roomCodesData = await roomCodesResponse.json()
      console.log('✅ Room codes created')

      if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
        roomCodesData.data.forEach((codeObj: any) => {
          if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
            teacherCode = codeObj.code
          } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
            studentCode = codeObj.code
          }
        })

        // Fallback
        const allCodes = roomCodesData.data.map((c: any) => c.code)
        if (!teacherCode && allCodes.length > 0) teacherCode = allCodes[0]
        if (!studentCode && allCodes.length > 1) studentCode = allCodes[1]
        if (!studentCode && allCodes.length === 1) studentCode = allCodes[0]
      }
    } else {
      console.error('Failed to create room codes:', await roomCodesResponse.text())
      throw new Error('Failed to create room codes for video session')
    }

    // Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Calculate recording expiration (30 days from scheduled time)
    const scheduledDate = new Date(scheduled_time)
    const recordingExpiresAt = new Date(scheduledDate)
    recordingExpiresAt.setDate(recordingExpiresAt.getDate() + ASSESSMENT_RECORDING_RETENTION_DAYS)

    // Update the diagnostic assessment with room details
    const { error: updateError } = await supabase
      .from('diagnostic_assessments')
      .update({
        teacher_id: teacher_id,
        scheduled_time: scheduled_time,
        room_id: roomData.id,
        teacher_room_code: teacherCode,
        student_room_code: studentCode,
        recording_expires_at: recordingExpiresAt.toISOString(),
        status: 'lesson_scheduled',
        learner_id: learner_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessment_id)

    if (updateError) {
      console.error('Failed to update assessment:', updateError)
      throw new Error(`Failed to update assessment: ${updateError.message}`)
    }

    // Create a diagnostic teacher payment record (£3 for the teacher)
    const { error: paymentError } = await supabase
      .from('diagnostic_teacher_payments')
      .insert({
        diagnostic_assessment_id: assessment_id,
        teacher_id: teacher_id,
        amount: 3.00,
        status: 'pending'
      })

    if (paymentError) {
      console.warn('Failed to create teacher payment record:', paymentError)
      // Don't fail the booking if payment record creation fails
    }

    console.log('✅ Diagnostic assessment booked successfully:', {
      assessment_id,
      teacher_id,
      scheduled_time,
      room_id: roomData.id,
      teacher_room_code: teacherCode,
      student_room_code: studentCode,
      recording_expires_at: recordingExpiresAt.toISOString()
    })

    return new Response(
      JSON.stringify({
        success: true,
        assessment: {
          id: assessment_id,
          teacher_id,
          scheduled_time,
          room_id: roomData.id,
          teacher_room_code: teacherCode,
          student_room_code: studentCode,
          recording_expires_at: recordingExpiresAt.toISOString(),
          status: 'lesson_scheduled'
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('Error booking diagnostic assessment:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to book diagnostic assessment',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
