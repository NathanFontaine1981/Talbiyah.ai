import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

interface BookingRequest {
  teacher_id: string;
  date: string;
  time: string;
  subject: string;
  duration?: number;
  price: number;
  use_free_session?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  console.log('💳 INITIATE BOOKING CHECKOUT START:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  try {
    // Create client with service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Create separate client with anon key for user authentication
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user using the auth client
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      console.error('❌ Unauthorized checkout attempt');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('👤 User authenticated:', {
      userId: user.id,
      email: user.email
    });

    // Extract bookings array from request body
    const body = await req.json();
    const { bookings: requestedBookings } = body;

    if (!requestedBookings || !Array.isArray(requestedBookings) || requestedBookings.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No bookings provided'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📋 Checkout request:', {
      userId: user.id,
      bookingsCount: requestedBookings?.length || 0,
      bookings: requestedBookings
    });

    // ✨ ENHANCEMENT: Check for price locks (grandfather pricing)
    // Apply price locks for each booking if student has booked with teacher before
    console.log('🔐 Checking for price locks...');
    const bookingsWithPriceLocks = await Promise.all(
      requestedBookings.map(async (booking: BookingRequest) => {
        try {
          const { data: lockedPrice, error: priceError } = await supabaseClient
            .rpc('get_student_teacher_price', {
              student_id_param: user.id,
              teacher_id_param: booking.teacher_id
            });

          if (!priceError && lockedPrice !== null) {
            const hours = (booking.duration || 60) / 60;
            const finalPrice = lockedPrice * hours;
            console.log(`   ✅ Price lock applied for ${booking.teacher_id}: £${lockedPrice}/hr → £${finalPrice}`);
            return { ...booking, price: finalPrice, locked_price: lockedPrice };
          }
        } catch (error) {
          console.log(`   ⚠️  Price lock check failed for ${booking.teacher_id}:`, error);
        }

        // No price lock or error - use provided price
        console.log(`   📌 Using provided price for ${booking.teacher_id}: £${booking.price}`);
        return booking;
      })
    );

    // Determine learner_id for the bookings
    console.log('👶 Determining learner_id for user:', user.id);
    let learnerId: string;

    const { data: existingLearner } = await supabaseClient
      .from('learners')
      .select('id')
      .eq('parent_id', user.id)
      .maybeSingle();

    if (existingLearner) {
      learnerId = existingLearner.id;
      console.log('   ✅ Found existing learner:', learnerId);
    } else {
      // Create new learner for this user
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const { data: newLearner, error: learnerError } = await supabaseClient
        .from('learners')
        .insert({
          parent_id: user.id,
          name: profile?.full_name || 'Student',
          gamification_points: 0
        })
        .select('id')
        .single();

      if (learnerError || !newLearner) {
        console.error('❌ Failed to create learner:', learnerError);
        throw new Error('Failed to create learner profile');
      }

      learnerId = newLearner.id;
      console.log('   ✅ Created new learner:', learnerId);
    }

    // Add learner_id to all bookings
    const bookingsWithLearner = bookingsWithPriceLocks.map((booking: any) => ({
      ...booking,
      learner_id: learnerId
    }));

    // Calculate total amount from the booking prices (with price locks applied)
    const totalAmount = bookingsWithLearner.reduce((sum: number, booking: any) => {
      return sum + Math.round(booking.price * 100); // Convert pounds to pence
    }, 0);

    const sessionCount = requestedBookings.length;

    console.log('💰 Total amount:', {
      totalPounds: totalAmount / 100,
      totalPence: totalAmount,
      sessionCount
    });

    // Create a single pending booking record (with learner_id and price locks applied)
    const { data: pendingBooking, error: pendingError } = await supabaseClient
      .from('pending_bookings')
      .insert({
        user_id: user.id,
        booking_data: bookingsWithLearner,
        total_amount: totalAmount,
        session_count: sessionCount,
        status: 'pending'
      })
      .select()
      .single();

    if (pendingError || !pendingBooking) {
      console.error('❌ Failed to create pending booking:', pendingError);
      throw new Error('Failed to create pending booking');
    }

    console.log('✅ Pending booking created:', {
      id: pendingBooking.id,
      sessionCount,
      totalAmount
    });

    // Get Stripe configuration
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.error('❌ Stripe secret key not found');
      throw new Error('Stripe secret key not configured')
    }

    // Create product description
    const sessionText = sessionCount === 1 ? 'Session' : 'Sessions';
    const productName = `${sessionCount} Learning ${sessionText}`;
    const sessionDescription = requestedBookings
      .map((b: BookingRequest) => `${b.duration || 60}min ${b.subject}`)
      .join(', ');

    console.log('🛒 Creating Stripe checkout session...');

    const checkoutData = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'gbp',
      'line_items[0][price_data][unit_amount]': totalAmount.toString(),
      'line_items[0][price_data][product_data][name]': productName,
      'line_items[0][price_data][product_data][description]': sessionDescription,
      'line_items[0][quantity]': '1',
      mode: 'payment',
      allow_promotion_codes: 'true',
      success_url: `${req.headers.get('origin') || 'https://talbiyah.ai'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://talbiyah.ai'}/cart`,
      'metadata[pending_booking_id]': pendingBooking.id,
      'metadata[user_id]': user.id,
      'metadata[session_count]': sessionCount.toString(),
      'metadata[total_amount]': totalAmount.toString(),
      'customer_email': user.email || ''
    })

    console.log('📋 Stripe checkout data:', {
      currency: 'gbp',
      amount: totalAmount,
      productName,
      sessionDescription,
      pendingBookingId: pendingBooking.id,
      userEmail: user.email
    });

    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: checkoutData
    })

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text()
      console.error('❌ Stripe checkout session creation failed:', {
        status: checkoutResponse.status,
        error
      });
      throw new Error(`Failed to create checkout session: ${error}`)
    }

    const session = await checkoutResponse.json()

    console.log('✅ Stripe checkout session created:', {
      sessionId: session.id,
      url: session.url,
      mode: session.mode,
      paymentStatus: session.payment_status
    });

    // Update pending booking with Stripe session ID
    const { error: linkError } = await supabaseClient
      .from('pending_bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', pendingBooking.id)

    if (linkError) {
      console.error('⚠️ Failed to link pending booking to Stripe session:', linkError);
    } else {
      console.log('✅ Pending booking linked to Stripe session');
    }

    const result = {
      success: true,
      checkout_url: session.url,
      session_id: session.id,
      pending_booking_id: pendingBooking.id,
      total_amount: totalAmount,
      session_count: sessionCount
    };

    console.log('🎉 CHECKOUT INITIATION COMPLETE:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 CHECKOUT INITIATION ERROR:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
