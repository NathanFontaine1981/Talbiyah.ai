import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Check recent pending bookings
  const { data: pendingBookings, error: pbError } = await supabase
    .from('pending_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('Recent pending bookings:', JSON.stringify(pendingBookings, null, 2))

  // Check if any have stripe_session_id
  const withStripe = pendingBookings?.filter(pb => pb.stripe_session_id) || []
  console.log(`Pending bookings with stripe_session_id: ${withStripe.length}`)

  // Check for the specific session
  const targetSession = 'cs_test_b11pjlg7sk3Q5LTePrV0jK2GtbltQjLHGJJWN8OGxgjfvpU1jpHpFIoW4Q'
  const booking = pendingBookings?.find(pb => pb.stripe_session_id === targetSession)

  if (booking) {
    console.log('Found booking for target session:', JSON.stringify(booking, null, 2))

    // Check for lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('learner_id', booking.booking_data?.[0]?.learner_id || 'none')
      .order('created_at', { ascending: false })
      .limit(5)

    console.log('Recent lessons for this learner:', JSON.stringify(lessons, null, 2))

    return new Response(JSON.stringify({
      pending_bookings_count: pendingBookings?.length || 0,
      with_stripe_session: withStripe.length,
      target_session_found: true,
      booking: booking,
      lessons: lessons || [],
      error: pbError || lessonsError
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    pending_bookings_count: pendingBookings?.length || 0,
    with_stripe_session: withStripe.length,
    target_session_found: false,
    all_bookings: pendingBookings,
    error: pbError
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  })
})
