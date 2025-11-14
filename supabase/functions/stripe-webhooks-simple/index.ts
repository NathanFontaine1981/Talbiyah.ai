import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const event = JSON.parse(body)

    console.log('Webhook received:', event.type)

    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const session = event.data.object
    const pendingBookingId = session.metadata?.pending_booking_id

    if (!pendingBookingId) {
      console.error('No pending_booking_id in metadata')
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get pending booking
    const { data: pendingBooking, error: pbError } = await supabase
      .from('pending_bookings')
      .select('*')
      .eq('id', pendingBookingId)
      .single()

    if (pbError || !pendingBooking) {
      console.error('Failed to get pending booking:', pbError)
      throw new Error('Pending booking not found')
    }

    const bookingData = Array.isArray(pendingBooking.booking_data)
      ? pendingBooking.booking_data[0]
      : pendingBooking.booking_data

    // Get learner_id (from booking_data or fall back to finding/creating learner for user)
    let learnerId = bookingData.learner_id;

    if (!learnerId) {
      console.log('⚠️ No learner_id in booking_data, determining for user:', pendingBooking.user_id);

      const { data: existingLearner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', pendingBooking.user_id)
        .maybeSingle();

      if (existingLearner) {
        learnerId = existingLearner.id;
        console.log('   ✅ Found existing learner:', learnerId);
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', pendingBooking.user_id)
          .maybeSingle();

        const { data: newLearner } = await supabase
          .from('learners')
          .insert({
            parent_id: pendingBooking.user_id,
            name: profile?.full_name || 'Student',
            gamification_points: 0
          })
          .select('id')
          .single();

        learnerId = newLearner?.id;
        console.log('   ✅ Created new learner:', learnerId);
      }
    }

    // Create lesson directly with correct Talbiyah schema
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        learner_id: learnerId,
        teacher_id: bookingData.teacher_id,
        subject_id: bookingData.subject_id,
        scheduled_time: bookingData.scheduled_time,
        duration_minutes: bookingData.duration || 30,
        total_cost_paid: bookingData.price,
        payment_status: 'paid',
        status: 'booked',
        teacher_room_code: null,
        student_room_code: null,
        '100ms_room_id': null,
      })
      .select()
      .single()

    if (lessonError) {
      console.error('Failed to create lesson:', lessonError)
      throw lessonError
    }

    console.log('✅ Lesson created:', lesson.id)

    // Update pending booking
    await supabase
      .from('pending_bookings')
      .update({ status: 'paid' })
      .eq('id', pendingBookingId)

    return new Response(JSON.stringify({
      received: true,
      lesson_id: lesson.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({
      received: true,
      error: error.message
    }), {
      status: 200, // Return 200 so Stripe doesn't retry
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
