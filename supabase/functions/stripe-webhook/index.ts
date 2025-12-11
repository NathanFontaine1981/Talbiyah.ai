import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { getHMSManagementToken } from '../_shared/hms.ts'
import { corsHeaders, securityHeaders } from '../_shared/cors.ts'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '../_shared/rateLimit.ts'
import { logPaymentEvent, logSecurityEventFromRequest } from '../_shared/securityLog.ts'

// Stripe webhooks come from Stripe servers, not browsers - allow Stripe's origin
const stripeWebhookHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-requested-with',
  'Access-Control-Max-Age': '86400',
  ...securityHeaders,
}

// Verify Stripe webhook signature
async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<Stripe.Event> {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      secret
    )
    return event
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    throw new Error(`Webhook signature verification failed: ${err.message}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: stripeWebhookHeaders
    })
  }

  // Rate limiting: 100 webhook calls per minute (replay protection)
  const clientIP = getClientIP(req)
  const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.WEBHOOK)
  if (!rateLimitResult.allowed) {
    // Log rate limit exceeded (create temp client for logging)
    const tempClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    await logSecurityEventFromRequest(tempClient, req, {
      eventType: 'rate_limit_exceeded',
      resourceType: 'webhook',
      resourceId: 'stripe-webhook',
      action: 'blocked',
      severity: 'warning',
    })
    return rateLimitResponse(rateLimitResult, stripeWebhookHeaders)
  }

  try {
    const body = await req.text()

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment');
      throw new Error('Stripe secret key not found')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let event: Stripe.Event

    // Verify webhook signature if secret is configured
    const signature = req.headers.get('stripe-signature')

    // SECURITY: Always require webhook signature verification in production
    if (!webhookSecret) {
      console.error('❌ CRITICAL: STRIPE_WEBHOOK_SECRET not configured - rejecting webhook')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured. Contact administrator.' }),
        { status: 500, headers: { ...stripeWebhookHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 401, headers: { ...stripeWebhookHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    event = await verifyStripeSignature(body, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object

        // Check if this is a credit pack purchase
        const packType = session.metadata?.pack_type
        const pendingBookingId = session.metadata?.pending_booking_id

        if (packType) {
          // Handle credit pack purchase
          const userId = session.metadata.user_id
          const credits = parseInt(session.metadata.credits)
          const amount = session.amount_total / 100 // Convert from pence to pounds

          // Create purchase record
          const { data: purchase, error: purchaseError } = await supabaseClient
            .from('credit_purchases')
            .insert({
              user_id: userId,
              pack_size: credits,
              pack_price: amount,
              credits_added: credits,
              stripe_payment_id: session.payment_intent,
              stripe_checkout_session_id: session.id,
              purchase_date: new Date().toISOString(),
              refund_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            })
            .select()
            .single()

          if (purchaseError) {
            console.error('Failed to create purchase record:', purchaseError.message);
            break
          }

          // Add credits to user balance using the database function
          const { data: newBalance, error: creditsError } = await supabaseClient
            .rpc('add_user_credits', {
              p_user_id: userId,
              p_credits: credits,
              p_purchase_id: purchase.id,
              p_notes: `Purchased ${packType} pack (${credits} credits)`
            })

          if (creditsError) {
            console.error('Failed to add credits:', creditsError.message);
          }

          // Log successful payment
          await logPaymentEvent(
            supabaseClient,
            req,
            'payment_completed',
            userId,
            session.payment_intent as string,
            amount,
            { type: 'credit_pack', pack_type: packType, credits }
          )

          // Send confirmation email for credit purchase
          try {
            // Get user email from profiles
            const { data: userProfile } = await supabaseClient
              .from('profiles')
              .select('full_name')
              .eq('id', userId)
              .single()

            if (session.customer_details?.email) {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                },
                body: JSON.stringify({
                  type: 'credit_purchase_confirmation',
                  recipient_email: session.customer_details.email,
                  recipient_name: userProfile?.full_name || 'Valued Customer',
                  data: {
                    credits: credits,
                    amount: amount,
                    pack_type: packType,
                    new_balance: newBalance || credits
                  }
                })
              })
            }
          } catch (emailErr) {
            // Don't fail the webhook if email fails
            console.error('Failed to send credit purchase email:', emailErr.message)
          }

          break
        }

        // Handle group session enrollment payments
        const groupSessionId = session.metadata?.group_session_id
        const paymentType = session.metadata?.type

        if (paymentType === 'group_session_enrollment' && groupSessionId) {
          const studentId = session.metadata.student_id
          const paymentRecordId = session.metadata.payment_record_id

          // Update payment record
          if (paymentRecordId) {
            const { error: updatePaymentError } = await supabaseClient
              .from('group_session_payments')
              .update({
                status: 'completed',
                stripe_payment_intent_id: session.payment_intent,
                paid_at: new Date().toISOString()
              })
              .eq('id', paymentRecordId)

            if (updatePaymentError) {
              console.error('Failed to update payment record:', updatePaymentError.message);
            }
          }

          // Enroll student in the group session
          const { data: existingEnrollment } = await supabaseClient
            .from('group_session_participants')
            .select('id')
            .eq('group_session_id', groupSessionId)
            .eq('student_id', studentId)
            .single()

          if (!existingEnrollment) {
            const { error: enrollError } = await supabaseClient
              .from('group_session_participants')
              .insert({
                group_session_id: groupSessionId,
                student_id: studentId
              })

            if (enrollError) {
              console.error('Failed to enroll student:', enrollError.message);
            }
          }

          break
        }

        if (!pendingBookingId) {
          // No pending booking - might be a different payment type
          break
        }

        // Fetch pending booking
        const { data: pendingBooking, error: fetchError } = await supabaseClient
          .from('pending_bookings')
          .select('*')
          .eq('id', pendingBookingId)
          .single()

        if (fetchError || !pendingBooking) {
          console.error('Failed to fetch pending booking:', fetchError?.message);
          break
        }

        if (!pendingBooking.booking_data || !Array.isArray(pendingBooking.booking_data)) {
          console.error('Invalid booking_data in pending booking');
          break
        }

        // Generate fresh 100ms token automatically
        let HMS_MANAGEMENT_TOKEN: string | null = null
        try {
          HMS_MANAGEMENT_TOKEN = await getHMSManagementToken()
        } catch (error) {
          console.error('Failed to generate HMS token:', error.message)
        }
        const HMS_TEMPLATE_ID = Deno.env.get('HMS_TEMPLATE_ID') || '6905fb03033903926e627d60'

        const createdLessons = []

        for (const bookingData of pendingBooking.booking_data) {

          // Create 100ms room
          let roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`
          let teacherRoomCode = null
          let studentRoomCode = null

          if (HMS_MANAGEMENT_TOKEN) {
            try {
              const roomResponse = await fetch('https://api.100ms.live/v2/rooms', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
                },
                body: JSON.stringify({
                  name: `Lesson-${bookingData.teacher_id}-${bookingData.subject}-${Date.now()}`,
                  description: `Paid lesson`,
                  template_id: HMS_TEMPLATE_ID,
                  region: 'in',
                }),
              })

              if (roomResponse.ok) {
                const roomData = await roomResponse.json()
                roomId = roomData.id

                await new Promise(resolve => setTimeout(resolve, 2000))

                const roomCodesResponse = await fetch(`https://api.100ms.live/v2/room-codes/room/${roomId}`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ enabled: true })
                })

                if (roomCodesResponse.ok) {
                  const roomCodesData = await roomCodesResponse.json()

                  if (roomCodesData.data && Array.isArray(roomCodesData.data)) {
                    roomCodesData.data.forEach(codeObj => {
                      if (codeObj.role === 'host' || codeObj.role === 'teacher' || codeObj.role === 'moderator') {
                        teacherRoomCode = codeObj.code
                      } else if (codeObj.role === 'guest' || codeObj.role === 'student' || codeObj.role === 'participant') {
                        studentRoomCode = codeObj.code
                      }
                    })

                    const allCodes = roomCodesData.data
                    if (!teacherRoomCode && allCodes.length > 0) {
                      teacherRoomCode = allCodes[0].code
                    }
                    if (!studentRoomCode && allCodes.length > 1) {
                      studentRoomCode = allCodes[1].code
                    }
                    if (!studentRoomCode && allCodes.length === 1) {
                      studentRoomCode = allCodes[0].code
                    }
                  }
                } else {
                  console.error('Room codes response failed:', roomCodesResponse.status)
                }
              }
            } catch (error) {
              console.error('Error creating 100ms room:', error.message)
            }
          }

          // Combine date and time into scheduled_time
          const scheduledTime = `${bookingData.date}T${bookingData.time}:00`

          // Create lesson (exactly like free sessions do)
          const { data: lesson, error: lessonError} = await supabaseClient
            .from('lessons')
            .insert({
              learner_id: bookingData.learner_id,
              teacher_id: bookingData.teacher_id,
              subject_id: bookingData.subject_id || bookingData.subject,
              scheduled_time: scheduledTime,
              duration_minutes: bookingData.duration || 60,
              status: 'booked',
              is_free_trial: false,
              teacher_rate_at_booking: bookingData.price,
              platform_fee: 0,
              total_cost_paid: bookingData.price,
              payment_id: session.payment_intent,
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
              payment_status: 'completed',
              payment_amount: bookingData.price,
              paid_at: new Date().toISOString(),
              '100ms_room_id': roomId,
              teacher_room_code: teacherRoomCode,
              student_room_code: studentRoomCode,
            })
            .select()
            .single()

          if (lessonError) {
            console.error('Failed to create lesson:', lessonError.message)
          } else {
            createdLessons.push(lesson)
          }
        }

        if (createdLessons.length > 0) {
          await supabaseClient
            .from('pending_bookings')
            .update({ status: 'completed' })
            .eq('id', pendingBookingId)

          // Log successful booking payment
          await logPaymentEvent(
            supabaseClient,
            req,
            'payment_completed',
            pendingBooking.user_id,
            session.payment_intent as string,
            pendingBooking.total_amount / 100,
            { type: 'lesson_booking', lessons_count: createdLessons.length }
          )

          // Send email notifications for each booked lesson
          for (const lesson of createdLessons) {
            try {
              // Get teacher and student profiles
              const { data: teacherProfile } = await supabaseClient
                .from('profiles')
                .select('full_name, email')
                .eq('id', lesson.teacher_id)
                .single()

              const { data: studentProfile } = await supabaseClient
                .from('profiles')
                .select('full_name, email')
                .eq('id', lesson.learner_id)
                .single()

              // Get subject name
              const { data: subjectData } = await supabaseClient
                .from('subjects')
                .select('name')
                .eq('id', lesson.subject_id)
                .single()

              const lessonDate = new Date(lesson.scheduled_time)
              const formattedDate = lessonDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
              const formattedTime = lessonDate.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })

              // Send email to teacher about new booking
              if (teacherProfile?.email) {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                  },
                  body: JSON.stringify({
                    type: 'teacher_new_booking',
                    recipient_email: teacherProfile.email,
                    recipient_name: teacherProfile.full_name || 'Teacher',
                    data: {
                      student_name: studentProfile?.full_name || 'Student',
                      subject: subjectData?.name || 'Lesson',
                      scheduled_time: lesson.scheduled_time,
                      duration_minutes: lesson.duration_minutes || 60
                    }
                  })
                })
              }

              // Send confirmation email to student
              if (studentProfile?.email) {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                  },
                  body: JSON.stringify({
                    type: 'student_booking_confirmation',
                    recipient_email: studentProfile.email,
                    recipient_name: studentProfile.full_name || 'Student',
                    data: {
                      teacher_name: teacherProfile?.full_name || 'Teacher',
                      subject: subjectData?.name || 'Lesson',
                      scheduled_time: lesson.scheduled_time,
                      duration_minutes: lesson.duration_minutes || 60
                    }
                  })
                })
              }
            } catch (emailErr) {
              // Don't fail the webhook if email fails
              console.error('Failed to send booking notification email:', emailErr.message)
            }
          }
        } else {
          await supabaseClient
            .from('pending_bookings')
            .update({ status: 'failed' })
            .eq('id', pendingBookingId)

          // Log failed booking
          await logPaymentEvent(
            supabaseClient,
            req,
            'payment_failed',
            pendingBooking.user_id,
            session.payment_intent as string,
            pendingBooking.total_amount / 100,
            { type: 'lesson_booking', reason: 'no_lessons_created' }
          )
        }

        break
      }

      default:
        // Unhandled event type - no action needed
        break
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    // Log detailed error for debugging (server-side only)
    console.error('Webhook error:', error instanceof Error ? error.message : 'Unknown error');

    // Return generic error to client (don't expose internal details)
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed'
      }),
      {
        status: 400,
        headers: {
          ...stripeWebhookHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
