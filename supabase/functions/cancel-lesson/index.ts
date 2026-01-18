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
    const { lesson_id, reason } = await req.json()

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: 'lesson_id is required' }),
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
        payment_status,
        total_cost_paid,
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
        JSON.stringify({ error: 'You can only cancel your own lessons' }),
        { status: 403, headers: responseHeaders }
      )
    }

    // Check if lesson can be cancelled (not already completed/cancelled)
    if (lesson.status === 'completed' || lesson.status === 'cancelled_by_student' || lesson.status === 'cancelled_by_teacher') {
      return new Response(
        JSON.stringify({ error: 'This lesson cannot be cancelled' }),
        { status: 400, headers: responseHeaders }
      )
    }

    // Check if lesson time has elapsed
    const now = new Date()
    const lessonTime = new Date(lesson.scheduled_time)

    // Policy: Can cancel up until the scheduled lesson time
    // If lesson time has passed, credit is forfeited - no cancellation allowed
    if (now >= lessonTime) {
      return new Response(
        JSON.stringify({
          error: 'This lesson time has already passed. The credit has been forfeited and cannot be refunded.',
          lesson_elapsed: true,
          scheduled_time: lesson.scheduled_time
        }),
        { status: 400, headers: responseHeaders }
      )
    }

    // Cancel the lesson
    const { error: updateError } = await supabaseAdmin
      .from('lessons')
      .update({
        status: 'cancelled_by_student',
        cancelled_at: new Date().toISOString(),
        is_late_cancellation: false // Not late since we validated 2+ hours
      })
      .eq('id', lesson_id)

    if (updateError) {
      console.error('Error updating lesson status:', updateError)
      throw new Error(`Database error: ${updateError.message}`)
    }

    console.log(`✅ Lesson ${lesson_id} cancelled by student ${user.id}`)

    // Refund credit to user's account
    // 1 credit = 60 min, 0.5 credit = 30 min
    const creditsToRefund = lesson.duration_minutes === 30 ? 0.5 : 1

    // Get or create user credits record
    const { data: existingCredits } = await supabaseAdmin
      .from('user_credits')
      .select('id, credits_remaining')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingCredits) {
      // Update existing credits
      await supabaseAdmin
        .from('user_credits')
        .update({
          credits_remaining: existingCredits.credits_remaining + creditsToRefund,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCredits.id)

      console.log(`💰 Refunded ${creditsToRefund} credits to user ${user.id}. New balance: ${existingCredits.credits_remaining + creditsToRefund}`)
    } else {
      // Create new credits record
      await supabaseAdmin
        .from('user_credits')
        .insert({
          user_id: user.id,
          credits_remaining: creditsToRefund,
          credits_purchased: 0
        })

      console.log(`💰 Created credits record with ${creditsToRefund} refunded credits for user ${user.id}`)
    }

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
              type: 'lesson_cancelled',
              recipient_email: studentEmail,
              recipient_name: lesson.learners?.name || 'Student',
              data: {
                teacher_name: 'Your teacher',
                scheduled_time: lesson.scheduled_time,
                subject: lesson.subjects?.name || 'Lesson',
                reason: 'You cancelled this lesson. Your credit has been refunded to your account.'
              }
            }),
          }
        )
        console.log('✅ Cancellation confirmation email sent to student')
      } catch (emailError) {
        console.error('❌ Failed to send cancellation email:', emailError)
      }
    }

    // Notify teacher about the cancellation
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
                type: 'lesson_cancelled',
                recipient_email: teacherEmail,
                recipient_name: 'Teacher',
                data: {
                  teacher_name: lesson.learners?.name || 'A student',
                  scheduled_time: lesson.scheduled_time,
                  subject: lesson.subjects?.name || 'Lesson',
                  reason: reason || 'The student cancelled this lesson.'
                }
              }),
            }
          )
          console.log('✅ Cancellation notification email sent to teacher')
        }
      }
    } catch (teacherEmailError) {
      console.error('❌ Failed to send teacher notification:', teacherEmailError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lesson cancelled successfully. Your credit has been refunded.',
        credits_refunded: creditsToRefund
      }),
      { status: 200, headers: responseHeaders }
    )

  } catch (error) {
    console.error('Error cancelling lesson:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Failed to cancel lesson', details: errorMessage }),
      { status: 500, headers: responseHeaders }
    )
  }
})
