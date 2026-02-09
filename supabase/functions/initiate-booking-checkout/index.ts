import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getHMSManagementToken } from "../_shared/hms.ts"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts"
import { corsHeaders, securityHeaders } from "../_shared/cors.ts"
import { requireCSRF } from "../_shared/csrf.ts"
import { logSecurityEventFromRequest } from "../_shared/securityLog.ts"

const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: responseHeaders })
  }

  const csrfError = requireCSRF(req, responseHeaders)
  if (csrfError) return csrfError

  const clientIP = getClientIP(req)
  const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.BOOKING)
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult, responseHeaders)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json();
    const { bookings: requestedBookings } = body;

    if (!requestedBookings || !Array.isArray(requestedBookings) || requestedBookings.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No bookings provided' }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for price locks (grandfather pricing)
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
            return { ...booking, price: finalPrice, locked_price: lockedPrice };
          }
        } catch {
          // Use provided price on error
        }
        return booking;
      })
    );

    // Process learner_id for bookings
    const bookingsWithLearner = await Promise.all(
      bookingsWithPriceLocks.map(async (booking: any) => {
        if (booking.learner_id) {
          return booking;
        }

        const { data: existingLearner } = await supabaseClient
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .limit(1);

        if (existingLearner && existingLearner.length > 0) {
          return { ...booking, learner_id: existingLearner[0].id };
        }

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
          throw new Error('Failed to create learner profile');
        }

        return { ...booking, learner_id: newLearner.id };
      })
    );

    // Check if this is an independent teacher insights-only checkout
    const isIndependentInsightsOnly = body.metadata?.is_independent_insights_only || body.is_independent_insights_only || false;

    const totalAmount = bookingsWithLearner.reduce((sum: number, booking: any) => {
      return sum + Math.round(booking.price * 100);
    }, 0);

    const sessionCount = requestedBookings.length;

    // Check if parent has sufficient credits
    const { data: parentCredits } = await supabaseClient
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .maybeSingle();

    const totalCreditsNeeded = bookingsWithLearner.reduce((sum: number, booking: any) => {
      const hours = (booking.duration || 60) / 60;
      return sum + hours;
    }, 0);

    // If parent has sufficient credits, use them
    if (parentCredits && parentCredits.credits_remaining >= totalCreditsNeeded) {
      try {
        const { data: newBalance, error: deductError } = await supabaseClient
          .rpc('deduct_user_credits', {
            p_user_id: user.id,
            p_credits: totalCreditsNeeded,
            p_lesson_id: null,
            p_notes: `Used for ${sessionCount} lesson booking(s)`
          });

        if (deductError) {
          throw new Error(`Failed to deduct credits: ${deductError.message}`);
        }

        const lessonsToCreate = bookingsWithLearner.map((booking: any) => {
          let scheduledTime: string;

          if (booking.scheduled_time) {
            scheduledTime = booking.scheduled_time;
          } else if (booking.date && booking.time) {
            scheduledTime = `${booking.date}T${booking.time}:00+00:00`;
          } else {
            throw new Error(`Missing scheduled_time or date/time for booking`);
          }

          const timestamp = new Date(scheduledTime);
          if (isNaN(timestamp.getTime())) {
            throw new Error(`Invalid timestamp format: ${scheduledTime}`);
          }

          return {
            learner_id: booking.learner_id,
            teacher_id: booking.teacher_id,
            subject_id: booking.subject,
            scheduled_time: scheduledTime,
            duration_minutes: booking.duration || 60,
            status: 'booked'
          };
        });

        const { data: createdLessons, error: lessonsError } = await supabaseClient
          .from('lessons')
          .insert(lessonsToCreate)
          .select('id');

        if (lessonsError) {
          // Refund credits
          await supabaseClient.rpc('add_user_credits', {
            p_user_id: user.id,
            p_credits: totalCreditsNeeded,
            p_purchase_id: null,
            p_notes: 'Refund: Lesson creation failed'
          });
          throw new Error(`Failed to create lessons: ${lessonsError.message}`);
        }

        const lessonIds = createdLessons.map((l: any) => l.id);
        await supabaseClient
          .from('lessons')
          .update({
            payment_method: 'credits',
            payment_status: 'paid',
            booked_at: new Date().toISOString(),
            price: bookingsWithLearner[0]?.price || 15.00,
            is_trial: false
          })
          .in('id', lessonIds);

        // Create 100ms rooms
        let managementToken: string | null = null
        try {
          managementToken = await getHMSManagementToken()
        } catch {
          // Continue without rooms
        }

        if (managementToken) {
          for (let i = 0; i < createdLessons.length; i++) {
            const lessonId = createdLessons[i].id;
            const booking = bookingsWithLearner[i];

            try {
              const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${managementToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: `lesson-${lessonId}`,
                  description: `Talbiyah.ai Lesson - ${booking.subject || 'Islamic Studies'}`,
                  template_id: Deno.env.get('HMS_TEMPLATE_ID') || '696bc294a090b0544dfda056',
                  region: 'eu',
                })
              });

              if (roomResponse.ok) {
                const roomData = await roomResponse.json();

                await supabaseClient
                  .from('lessons')
                  .update({ '100ms_room_id': roomData.id })
                  .eq('id', lessonId);

                await new Promise(resolve => setTimeout(resolve, 1000));
                const codesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomData.id}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${managementToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ enabled: true })
                });

                if (codesResponse.ok) {
                  const codesData = await codesResponse.json();

                  let teacherCode = null;
                  let studentCode = null;

                  if (codesData.data && Array.isArray(codesData.data)) {
                    codesData.data.forEach((codeObj: any) => {
                      if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
                        teacherCode = codeObj.code;
                      } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant' || codeObj.role === 'viewer') {
                        studentCode = codeObj.code;
                      }
                    });
                  }

                  if (teacherCode || studentCode) {
                    await supabaseClient
                      .from('lessons')
                      .update({
                        teacher_room_code: teacherCode,
                        student_room_code: studentCode
                      })
                      .eq('id', lessonId);
                  }
                }
              }
            } catch {
              // Continue with other lessons
            }
          }
        }

        // Send email notifications
        for (let i = 0; i < createdLessons.length; i++) {
          const lessonId = createdLessons[i].id;
          const booking = bookingsWithLearner[i];

          try {
            const { data: lessonData } = await supabaseClient
              .from('lessons')
              .select('id, scheduled_time, duration_minutes, subject_id, teacher_id, learner_id')
              .eq('id', lessonId)
              .single();

            if (!lessonData) continue;

            const { data: teacherProfile } = await supabaseClient
              .from('profiles')
              .select('full_name, email')
              .eq('id', lessonData.teacher_id)
              .single();

            let teacherEmail = teacherProfile?.email;
            if (!teacherEmail) {
              const { data: teacherProfileData } = await supabaseClient
                .from('teacher_profiles')
                .select('email')
                .eq('id', lessonData.teacher_id)
                .single();
              teacherEmail = teacherProfileData?.email;
            }

            const { data: learnerData } = await supabaseClient
              .from('learners')
              .select('name, parent_id')
              .eq('id', lessonData.learner_id)
              .single();

            const { data: parentProfile } = await supabaseClient
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();

            const parentEmail = user.email;

            const { data: subjectData } = await supabaseClient
              .from('subjects')
              .select('name')
              .eq('id', lessonData.subject_id)
              .single();

            const studentName = learnerData?.name || parentProfile?.full_name || 'Student';
            const subjectName = subjectData?.name || booking.subject || 'Lesson';

            if (teacherEmail) {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                },
                body: JSON.stringify({
                  type: 'teacher_new_booking',
                  recipient_email: teacherEmail,
                  recipient_name: teacherProfile?.full_name || 'Teacher',
                  data: {
                    student_name: studentName,
                    subject: subjectName,
                    scheduled_time: lessonData.scheduled_time,
                    duration_minutes: lessonData.duration_minutes || 60
                  }
                })
              });
            }

            if (parentEmail) {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                },
                body: JSON.stringify({
                  type: 'student_booking_confirmation',
                  recipient_email: parentEmail,
                  recipient_name: parentProfile?.full_name || 'Student',
                  data: {
                    teacher_name: teacherProfile?.full_name || 'Teacher',
                    subject: subjectName,
                    scheduled_time: lessonData.scheduled_time,
                    duration_minutes: lessonData.duration_minutes || 60
                  }
                })
              });
            }
          } catch {
            // Don't fail booking if email fails
          }
        }

        await logSecurityEventFromRequest(supabaseClient, req, {
          eventType: 'booking_created',
          userId: user.id,
          resourceType: 'lesson',
          resourceId: lessonIds.join(','),
          action: 'create',
          details: {
            payment_method: 'credits',
            credits_used: totalCreditsNeeded,
            lessons_count: createdLessons.length
          },
          severity: 'info'
        });

        return new Response(
          JSON.stringify({
            success: true,
            paid_with_credits: true,
            lessons: createdLessons,
            credits_used: totalCreditsNeeded,
            new_credit_balance: newBalance,
            message: 'Lessons booked successfully using your credits!'
          }),
          { headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (creditError: any) {
        console.error('Credit payment failed:', creditError.message);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Credit payment failed',
            details: creditError.message,
            fallback_to_stripe: true
          }),
          { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Proceed with Stripe checkout
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
      throw new Error('Failed to create pending booking');
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    const sessionText = sessionCount === 1 ? 'Session' : 'Sessions';
    const productName = isIndependentInsightsOnly
      ? `Talbiyah AI Insights (${sessionCount} ${sessionText})`
      : `${sessionCount} Learning ${sessionText}`;
    const sessionDescription = isIndependentInsightsOnly
      ? 'AI-powered study notes, quizzes & revision materials from your lesson recording'
      : requestedBookings
        .map((b: BookingRequest) => `${b.duration || 60}min ${b.subject}`)
        .join(', ');

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
      ...(isIndependentInsightsOnly ? { 'metadata[is_independent_insights]': 'true' } : {}),
      'payment_intent_data[metadata][pending_booking_id]': pendingBooking.id,
      'payment_intent_data[metadata][user_id]': user.id,
      'customer_email': user.email || ''
    })

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
      throw new Error(`Failed to create checkout session: ${error}`)
    }

    const session = await checkoutResponse.json()

    await logSecurityEventFromRequest(supabaseClient, req, {
      eventType: 'payment_initiated',
      userId: user.id,
      resourceType: 'checkout',
      resourceId: session.id,
      action: 'create',
      details: {
        amount: totalAmount / 100,
        session_count: sessionCount,
        pending_booking_id: pendingBooking.id
      },
      severity: 'info'
    });

    await supabaseClient
      .from('pending_bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', pendingBooking.id)

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
        pending_booking_id: pendingBooking.id,
        total_amount: totalAmount,
        session_count: sessionCount
      }),
      { headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Checkout error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
