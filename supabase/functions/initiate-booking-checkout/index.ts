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

    // ✨ NEW: Check if parent has sufficient credits to cover booking
    console.log('💳 Checking parent credit balance...');
    const { data: parentCredits, error: creditsError } = await supabaseClient
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creditsError) {
      console.error('⚠️ Error checking credits:', creditsError);
    }

    // Calculate total credits needed (duration in hours)
    const totalCreditsNeeded = bookingsWithLearner.reduce((sum: number, booking: any) => {
      const hours = (booking.duration || 60) / 60; // Convert minutes to hours
      return sum + hours;
    }, 0);

    console.log('💳 Credit check:', {
      parentCreditsAvailable: parentCredits?.credits_remaining || 0,
      totalCreditsNeeded,
      canPayWithCredits: (parentCredits?.credits_remaining || 0) >= totalCreditsNeeded
    });

    // If parent has sufficient credits, use them instead of Stripe
    if (parentCredits && parentCredits.credits_remaining >= totalCreditsNeeded) {
      console.log('✅ Parent has sufficient credits! Processing with credits...');

      try {
        // Deduct credits from parent's account
        const { data: newBalance, error: deductError } = await supabaseClient
          .rpc('deduct_user_credits', {
            p_user_id: user.id,
            p_credits: totalCreditsNeeded,
            p_lesson_id: null, // Will update after lessons are created
            p_notes: `Used for ${sessionCount} lesson booking(s)`
          });

        if (deductError) {
          console.error('❌ Failed to deduct credits:', deductError);
          throw new Error(`Failed to deduct credits: ${deductError.message}`);
        }

        console.log('✅ Credits deducted successfully. New balance:', newBalance);

        // Create lessons using minimal required columns only
        // This avoids schema cache issues with newer columns
        console.log('📝 Creating lessons with booking data:');
        bookingsWithLearner.forEach((booking: any, index: number) => {
          console.log(`Lesson ${index + 1}:`, {
            date: booking.date,
            time: booking.time,
            scheduled_time: booking.scheduled_time,
            learner_id: booking.learner_id,
            teacher_id: booking.teacher_id,
            subject: booking.subject,
            duration: booking.duration
          });
        });

        const lessonsToCreate = bookingsWithLearner.map((booking: any) => {
          // Construct proper timestamp
          let scheduledTime: string;

          if (booking.scheduled_time) {
            // If full timestamp already provided
            scheduledTime = booking.scheduled_time;
          } else if (booking.date && booking.time) {
            // Construct from separate date and time
            // booking.date format: "2025-11-20" (YYYY-MM-DD)
            // booking.time format: "11:00" (HH:MM)
            scheduledTime = `${booking.date}T${booking.time}:00+00:00`;
          } else {
            console.error('❌ Missing date/time for booking:', JSON.stringify(booking, null, 2));
            throw new Error(`Missing scheduled_time or date/time for booking. Date: ${booking.date}, Time: ${booking.time}`);
          }

          // Validate timestamp format
          const timestamp = new Date(scheduledTime);
          if (isNaN(timestamp.getTime())) {
            console.error('❌ Invalid timestamp:', scheduledTime);
            console.error('Booking data:', JSON.stringify(booking, null, 2));
            throw new Error(`Invalid timestamp format: ${scheduledTime}`);
          }

          console.log(`✓ Constructed timestamp: ${scheduledTime}`);

          // Only insert columns that exist in schema cache
          // Schema cache doesn't recognize: price, payment_method, payment_status, booked_at, is_trial
          return {
            learner_id: booking.learner_id,
            teacher_id: booking.teacher_id,
            subject_id: booking.subject,
            scheduled_time: scheduledTime,
            duration_minutes: booking.duration || 60,
            status: 'booked'
          };
        });

        console.log('📋 Final lessons to create:', JSON.stringify(lessonsToCreate, null, 2));

        const { data: createdLessons, error: lessonsError } = await supabaseClient
          .from('lessons')
          .insert(lessonsToCreate)
          .select('id');

        if (lessonsError) {
          console.error('❌ Failed to create lessons:', lessonsError);
          // Refund the credits since lesson creation failed
          await supabaseClient.rpc('add_user_credits', {
            p_user_id: user.id,
            p_credits: totalCreditsNeeded,
            p_purchase_id: null,
            p_notes: 'Refund: Lesson creation failed'
          });
          throw new Error(`Failed to create lessons: ${lessonsError.message}`);
        }

        console.log('✅ Lessons created successfully. Now updating payment fields...');

        // Update payment fields using UPDATE (bypasses schema cache)
        const lessonIds = createdLessons.map((l: any) => l.id);
        const { error: updateError } = await supabaseClient
          .from('lessons')
          .update({
            payment_method: 'credits',
            payment_status: 'paid',
            booked_at: new Date().toISOString(),
            price: bookingsWithLearner[0]?.price || 15.00,
            is_trial: false
          })
          .in('id', lessonIds);

        if (updateError) {
          console.error('⚠️ Failed to update payment fields:', updateError);
          // Don't throw - lessons are created, just payment fields missing
        } else {
          console.log('✅ Payment fields updated successfully');
        }

        console.log('✅ Credit booking complete:', {
          lessonsCount: createdLessons.length,
          lessonIds,
          creditsUsed: totalCreditsNeeded,
          newBalance
        });

        // Return success response (no Stripe checkout needed)
        return new Response(
          JSON.stringify({
            success: true,
            paid_with_credits: true,
            lessons: createdLessons,
            credits_used: totalCreditsNeeded,
            new_credit_balance: newBalance,
            message: 'Lessons booked successfully using your credits!'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (creditError: any) {
        console.error('💥 Credit payment failed:', {
          error: creditError,
          message: creditError.message,
          stack: creditError.stack,
          userId: user.id,
          creditsNeeded: totalCreditsNeeded
        });

        // Return error instead of falling back to Stripe
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Credit payment failed',
            details: creditError.message,
            fallback_to_stripe: true
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else if (parentCredits && parentCredits.credits_remaining > 0) {
      console.log('⚠️ Parent has some credits but not enough:', {
        available: parentCredits.credits_remaining,
        needed: totalCreditsNeeded,
        shortfall: totalCreditsNeeded - parentCredits.credits_remaining
      });
      // TODO: Future enhancement - allow partial credit payment + Stripe for remainder
    } else {
      console.log('ℹ️ Parent has no credits. Proceeding with Stripe checkout...');
    }

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
      'payment_intent_data[metadata][pending_booking_id]': pendingBooking.id,
      'payment_intent_data[metadata][user_id]': user.id,
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
