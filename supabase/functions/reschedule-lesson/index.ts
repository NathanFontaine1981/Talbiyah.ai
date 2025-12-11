import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, securityHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const responseHeaders = {
    ...corsHeaders,
    ...securityHeaders,
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
  }

  try {
    const { lesson_id, new_scheduled_time } = await req.json()

    if (!lesson_id || !new_scheduled_time) {
      return new Response(
        JSON.stringify({ error: 'lesson_id and new_scheduled_time are required' }),
        { status: 400, headers: responseHeaders }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: responseHeaders }
      )
    }

    // Create client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Create service client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: responseHeaders }
      )
    }

    // Get the lesson details
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select(`
        id,
        learner_id,
        teacher_id,
        subject_id,
        scheduled_time,
        duration_minutes,
        status,
        rescheduled_count,
        subjects(name),
        learners(parent_id, name)
      `)
      .eq('id', lesson_id)
      .single()

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { status: 404, headers: responseHeaders }
      )
    }

    // Check if user owns this lesson (is the parent/student)
    const isOwner = lesson.learners?.parent_id === user.id
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: 'You can only reschedule your own lessons' }),
        { status: 403, headers: responseHeaders }
      )
    }

    // Check if lesson can be rescheduled (not already completed/cancelled)
    if (lesson.status === 'completed' || lesson.status === 'cancelled_by_student' || lesson.status === 'cancelled_by_teacher') {
      return new Response(
        JSON.stringify({ error: 'This lesson cannot be rescheduled' }),
        { status: 400, headers: responseHeaders }
      )
    }

    // Limit reschedules to once per lesson
    if ((lesson.rescheduled_count || 0) >= 1) {
      return new Response(
        JSON.stringify({ error: 'This lesson has already been rescheduled once. Please cancel and rebook if needed.' }),
        { status: 400, headers: responseHeaders }
      )
    }

    // Validate new time is in the future
    const newTime = new Date(new_scheduled_time)
    const now = new Date()
    if (newTime <= now) {
      return new Response(
        JSON.stringify({ error: 'New time must be in the future' }),
        { status: 400, headers: responseHeaders }
      )
    }

    // Check teacher availability for the new time
    const dayOfWeek = newTime.getDay()
    const timeString = newTime.toTimeString().substring(0, 5) // HH:MM format

    const { data: availability } = await supabaseAdmin
      .from('teacher_availability')
      .select('*')
      .eq('teacher_id', lesson.teacher_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .lte('start_time', timeString)
      .gte('end_time', timeString)

    if (!availability || availability.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Teacher is not available at this time. Please choose a different slot.' }),
        { status: 400, headers: responseHeaders }
      )
    }

    // Check for conflicting lessons at the new time
    const lessonEndTime = new Date(newTime.getTime() + lesson.duration_minutes * 60 * 1000)

    const { data: conflictingLessons } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('teacher_id', lesson.teacher_id)
      .neq('id', lesson_id)
      .not('status', 'in', '(cancelled_by_teacher,cancelled_by_student)')
      .gte('scheduled_time', newTime.toISOString())
      .lt('scheduled_time', lessonEndTime.toISOString())

    if (conflictingLessons && conflictingLessons.length > 0) {
      return new Response(
        JSON.stringify({ error: 'This time slot is already booked. Please choose a different time.' }),
        { status: 400, headers: responseHeaders }
      )
    }

    // Store old time for notification
    const oldScheduledTime = lesson.scheduled_time

    // Update the lesson with new time
    const { error: updateError } = await supabaseAdmin
      .from('lessons')
      .update({
        scheduled_time: new_scheduled_time,
        rescheduled_count: (lesson.rescheduled_count || 0) + 1,
        rescheduled_at: new Date().toISOString(),
        rescheduled_from: oldScheduledTime,
        // Reset confirmation status so teacher can re-acknowledge
        confirmation_status: 'pending'
      })
      .eq('id', lesson_id)

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Lesson ${lesson_id} rescheduled from ${oldScheduledTime} to ${new_scheduled_time}`)

    // Send notification email to student
    const studentEmail = user.email
    if (studentEmail) {
      try {
        await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              type: 'lesson_time_changed',
              recipient_email: studentEmail,
              recipient_name: lesson.learners?.name || 'Student',
              data: {
                teacher_name: 'Your teacher',
                old_time: oldScheduledTime,
                new_time: new_scheduled_time,
                subject: lesson.subjects?.name || 'Lesson'
              }
            }),
          }
        )
        console.log('✅ Reschedule confirmation email sent to student')
      } catch (emailError) {
        console.error('❌ Failed to send reschedule email:', emailError)
      }
    }

    // Notify teacher about the reschedule
    try {
      const { data: teacherProfile } = await supabaseAdmin
        .from('teacher_profiles')
        .select('user_id')
        .eq('id', lesson.teacher_id)
        .single()

      if (teacherProfile?.user_id) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(teacherProfile.user_id)
        const teacherEmail = authUser?.user?.email

        if (teacherEmail) {
          await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                type: 'lesson_time_changed',
                recipient_email: teacherEmail,
                recipient_name: 'Teacher',
                data: {
                  teacher_name: lesson.learners?.name || 'A student',
                  old_time: oldScheduledTime,
                  new_time: new_scheduled_time,
                  subject: lesson.subjects?.name || 'Lesson'
                }
              }),
            }
          )
          console.log('✅ Reschedule notification email sent to teacher')
        }
      }
    } catch (teacherEmailError) {
      console.error('❌ Failed to send teacher notification:', teacherEmailError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lesson rescheduled successfully',
        old_time: oldScheduledTime,
        new_time: new_scheduled_time
      }),
      { status: 200, headers: responseHeaders }
    )

  } catch (error) {
    console.error('Error rescheduling lesson:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to reschedule lesson' }),
      { status: 500, headers: responseHeaders }
    )
  }
})
