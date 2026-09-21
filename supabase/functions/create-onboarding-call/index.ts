// Admin-only: create a live video room to onboard a teacher, and email them the join link.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabase
      .from('profiles').select('roles, full_name').eq('id', user.id).single()
    if (!callerProfile?.roles?.includes('admin')) {
      throw new Error('Only admins can invite a teacher to an onboarding call')
    }

    const { teacher_id } = await req.json()
    if (!teacher_id) throw new Error('teacher_id is required')

    const { data: teacher } = await supabase
      .from('profiles').select('id, full_name, email').eq('id', teacher_id).single()
    if (!teacher?.email) throw new Error('Teacher not found or has no email on file')

    // Create the room via the existing generic room-creation function
    const roomResp = await fetch(`${supabaseUrl}/functions/v1/create-hms-room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({
        roomName: `Onboarding-${teacher.full_name?.replace(/\s+/g, '-') || teacher.id}-${Date.now()}`,
        description: `Teacher onboarding call: ${teacher.full_name || teacher.email}`,
      }),
    })
    const roomData = await roomResp.json()
    if (!roomResp.ok || !roomData.success) {
      throw new Error(roomData.error || 'Failed to create onboarding room')
    }

    const adminCode = roomData.room.codes?.teacher || roomData.room.roomCode
    const teacherCode = roomData.room.codes?.student || roomData.room.roomCode
    const adminJoinUrl = `https://talbiyah.app.100ms.live/meeting/${adminCode}`
    const teacherJoinUrl = `https://talbiyah.app.100ms.live/meeting/${teacherCode}`

    const { data: callRecord, error: insertError } = await supabase
      .from('teacher_onboarding_calls')
      .insert({
        teacher_id: teacher.id,
        invited_by: user.id,
        hms_room_id: roomData.room.id,
        admin_room_code: adminCode,
        teacher_room_code: teacherCode,
        status: 'invited',
      })
      .select()
      .single()
    if (insertError) console.error('Failed to log onboarding call:', insertError)

    // Email the teacher their join link (best-effort — don't fail the whole request on email issues)
    let emailSent = false
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (RESEND_API_KEY) {
      try {
        const firstName = teacher.full_name?.split(' ')[0] || ''
        const inviterName = callerProfile.full_name || 'Your Talbiyah admin'
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Talbiyah.ai <contact@talbiyah.ai>',
            to: [teacher.email],
            subject: `${inviterName} is inviting you to an onboarding call`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981, #0d9488); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">You're invited to an onboarding call</h1>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="font-size: 16px; color: #374151;">Assalamu alaikum ${firstName},</p>
                  <p style="font-size: 16px; color: #374151;">${inviterName} would like to walk you through the Talbiyah platform and what we expect from our teachers. Click below to join whenever you're ready.</p>
                  <a href="${teacherJoinUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0;">Join Onboarding Call</a>
                  <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">If the button doesn't work, copy this link: ${teacherJoinUrl}</p>
                </div>
              </div>
            `,
          }),
        })
        emailSent = emailResp.ok
        if (!emailResp.ok) console.error('Onboarding call email failed:', await emailResp.text())
      } catch (e) {
        console.error('Onboarding call email error:', e)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        admin_join_url: adminJoinUrl,
        teacher_join_url: teacherJoinUrl,
        email_sent: emailSent,
        call_id: callRecord?.id || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in create-onboarding-call:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
