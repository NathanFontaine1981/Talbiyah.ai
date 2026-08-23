import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Called by Lesson.tsx the moment a teacher or student actually joins the 100ms
// room. If it's at/near lesson time and the other party hasn't joined yet,
// nudges them once (email + in-app notification) so they know someone's waiting.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: { user: caller }, error: callerError } =
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { lesson_id, role } = await req.json()
    if (!lesson_id || (role !== 'teacher' && role !== 'student')) {
      return new Response(JSON.stringify({ error: 'lesson_id and role (teacher|student) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, teacher_id, learner_id, subject_id, scheduled_time, duration_minutes, status, teacher_joined_at, student_joined_at, teacher_join_nudge_sent, student_join_nudge_sent')
      .eq('id', lesson_id)
      .single()
    if (lessonError || !lesson) {
      return new Response(JSON.stringify({ error: 'Lesson not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: teacherProfile } = await supabase
      .from('teacher_profiles').select('user_id').eq('id', lesson.teacher_id).single()
    const { data: teacherAccount } = teacherProfile
      ? await supabase.from('profiles').select('id, full_name, email').eq('id', teacherProfile.user_id).single()
      : { data: null }

    const { data: learner } = await supabase
      .from('learners').select('parent_id, name, first_name').eq('id', lesson.learner_id).single()
    const { data: studentAccount } = learner
      ? await supabase.from('profiles').select('id, full_name, email').eq('id', learner.parent_id).single()
      : { data: null }

    // The caller must actually be the party they claim to be for this lesson.
    const claimedAccountId = role === 'teacher' ? teacherAccount?.id : studentAccount?.id
    if (!claimedAccountId || caller.id !== claimedAccountId) {
      return new Response(JSON.stringify({ error: 'You are not a party to this lesson in that role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Record the join. Fine to overwrite on repeat joins (e.g. a reload) — only
    // used as a "has the other party arrived yet" check, not an audit log.
    const joinedAtColumn = role === 'teacher' ? 'teacher_joined_at' : 'student_joined_at'
    await supabase.from('lessons').update({ [joinedAtColumn]: new Date().toISOString() }).eq('id', lesson.id)

    const UNRESOLVED_STATUSES = ['booked', 'confirmed', 'scheduled']
    const scheduled = new Date(lesson.scheduled_time)
    const now = new Date()
    const windowStart = new Date(scheduled.getTime() - 15 * 60000)
    const windowEnd = new Date(scheduled.getTime() + (Number(lesson.duration_minutes) || 60) * 60000 + 15 * 60000)
    const withinWindow = now >= windowStart && now <= windowEnd

    if (!withinWindow || !UNRESOLVED_STATUSES.includes(lesson.status)) {
      return new Response(JSON.stringify({ success: true, nudged: false, reason: 'outside lesson window or lesson resolved' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const otherJoinedAt = role === 'teacher' ? lesson.student_joined_at : lesson.teacher_joined_at
    const alreadyNudged = role === 'teacher' ? lesson.student_join_nudge_sent : lesson.teacher_join_nudge_sent
    const nudgeFlagColumn = role === 'teacher' ? 'student_join_nudge_sent' : 'teacher_join_nudge_sent'
    const recipient = role === 'teacher' ? studentAccount : teacherAccount
    const joinerName = role === 'teacher'
      ? (teacherAccount?.full_name || 'Your teacher')
      : (learner?.first_name || learner?.name || 'Your student')

    if (otherJoinedAt || alreadyNudged || !recipient?.email) {
      return new Response(JSON.stringify({ success: true, nudged: false, reason: 'other party already joined, already nudged, or no recipient email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: subject } = await supabase.from('subjects').select('name').eq('id', lesson.subject_id).maybeSingle()
    const lessonUrl = `https://talbiyah.ai/lesson/${lesson.id}`

    try {
      await supabase.from('notifications').insert({
        user_id: recipient.id,
        title: `${joinerName} is waiting for you!`,
        message: `${joinerName} has joined your ${subject?.name || 'lesson'} — join now to get started.`,
        type: 'lesson_partner_waiting',
        data: { link: `/lesson/${lesson.id}`, lesson_id: lesson.id },
      })
    } catch (notifError) {
      console.error('Failed to insert in-app notification:', notifError)
    }

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: 'lesson_partner_waiting',
          recipient_email: recipient.email,
          recipient_name: recipient.full_name || 'there',
          data: {
            joiner_name: joinerName,
            subject_name: subject?.name || 'lesson',
            lesson_url: lessonUrl,
          },
        }),
      })
    } catch (emailError) {
      console.error('Failed to send partner-waiting email:', emailError)
    }

    await supabase.from('lessons').update({ [nudgeFlagColumn]: true }).eq('id', lesson.id)

    return new Response(JSON.stringify({ success: true, nudged: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('Error in notify-lesson-partner:', error)
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
