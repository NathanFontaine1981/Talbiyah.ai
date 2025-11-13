import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

serve(async (req) => {
  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeKey || !webhookSecret) {
      throw new Error('Stripe keys not configured')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('No Stripe signature found')
      return new Response('No signature', { status: 400 })
    }

    // Get the raw body
    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('Webhook verified:', event.type)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)

        const lessonId = session.metadata?.lesson_id
        if (!lessonId) {
          console.error('No lesson_id in session metadata')
          break
        }

        // Update lesson with payment intent ID
        const { error: updateError } = await supabaseClient
          .from('lessons')
          .update({
            stripe_payment_intent_id: session.payment_intent as string,
            payment_status: 'processing'
          })
          .eq('id', lessonId)

        if (updateError) {
          console.error('Error updating lesson:', updateError)
        }

        // Log event
        await supabaseClient.rpc('log_payment_event', {
          p_lesson_id: lessonId,
          p_event_type: 'checkout_completed',
          p_stripe_event_id: event.id,
          p_payment_intent_id: session.payment_intent as string,
          p_checkout_session_id: session.id,
          p_payment_status: 'processing',
          p_raw_event_data: event.data.object
        })

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)

        const lessonId = paymentIntent.metadata?.lesson_id
        if (!lessonId) {
          console.error('No lesson_id in payment intent metadata')
          break
        }

        // Update lesson status to paid and scheduled
        const { error: updateError } = await supabaseClient
          .from('lessons')
          .update({
            payment_status: 'completed',
            status: 'scheduled',
            payment_id: paymentIntent.id, // Store in old field for compatibility
            paid_at: new Date().toISOString()
          })
          .eq('id', lessonId)

        if (updateError) {
          console.error('Error updating lesson:', updateError)
        } else {
          console.log('Lesson marked as paid:', lessonId)
        }

        // Log event
        await supabaseClient.rpc('log_payment_event', {
          p_lesson_id: lessonId,
          p_event_type: 'payment_succeeded',
          p_stripe_event_id: event.id,
          p_amount: paymentIntent.amount / 100, // Convert from cents
          p_currency: paymentIntent.currency,
          p_payment_intent_id: paymentIntent.id,
          p_payment_status: 'completed',
          p_raw_event_data: event.data.object
        })

        // Check if this is the student's first booking with this teacher
        const { data: existingLessons } = await supabaseClient
          .from('lessons')
          .select('id')
          .eq('student_id', paymentIntent.metadata?.student_id)
          .eq('teacher_id', paymentIntent.metadata?.teacher_id)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: true })

        if (existingLessons && existingLessons.length === 1 && existingLessons[0].id === lessonId) {
          // This is first paid lesson - create price lock
          const { data: lesson } = await supabaseClient
            .from('lessons')
            .select(`
              student_id,
              teacher_id,
              payment_amount,
              teacher_profiles!teacher_id(current_tier)
            `)
            .eq('id', lessonId)
            .single()

          if (lesson) {
            await supabaseClient
              .from('student_pricing_locks')
              .insert({
                student_id: lesson.student_id,
                teacher_id: lesson.teacher_id,
                locked_price: lesson.payment_amount,
                locked_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 12 months
                original_tier: lesson.teacher_profiles?.current_tier || 'newcomer'
              })
              .onConflict('student_id,teacher_id')
              .ignoreDuplicates()

            console.log('Created price lock for first lesson')
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)

        const lessonId = paymentIntent.metadata?.lesson_id
        if (!lessonId) {
          console.error('No lesson_id in payment intent metadata')
          break
        }

        // Update lesson status to failed
        const { error: updateError } = await supabaseClient
          .from('lessons')
          .update({
            payment_status: 'failed',
            status: 'cancelled'
          })
          .eq('id', lessonId)

        if (updateError) {
          console.error('Error updating lesson:', updateError)
        }

        // Log event with error details
        await supabaseClient.rpc('log_payment_event', {
          p_lesson_id: lessonId,
          p_event_type: 'payment_failed',
          p_stripe_event_id: event.id,
          p_payment_intent_id: paymentIntent.id,
          p_payment_status: 'failed',
          p_error_code: paymentIntent.last_payment_error?.code || null,
          p_error_message: paymentIntent.last_payment_error?.message || null,
          p_raw_event_data: event.data.object
        })

        // TODO: Send notification to student about failed payment

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('Charge refunded:', charge.id)

        // Find lesson by payment intent
        const { data: lesson, error: findError } = await supabaseClient
          .from('lessons')
          .select('id')
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .single()

        if (findError || !lesson) {
          console.error('Could not find lesson for refund:', charge.payment_intent)
          break
        }

        const refundAmount = charge.amount_refunded / 100 // Convert from cents

        // Update lesson status
        const { error: updateError } = await supabaseClient
          .from('lessons')
          .update({
            payment_status: 'refunded',
            refund_amount: refundAmount,
            refunded_at: new Date().toISOString(),
            refund_reason: charge.refunds?.data[0]?.reason || 'Customer request'
          })
          .eq('id', lesson.id)

        if (updateError) {
          console.error('Error updating lesson refund:', updateError)
        }

        // Log event
        await supabaseClient.rpc('log_payment_event', {
          p_lesson_id: lesson.id,
          p_event_type: 'refund_issued',
          p_stripe_event_id: event.id,
          p_amount: refundAmount,
          p_currency: charge.currency,
          p_payment_intent_id: charge.payment_intent as string,
          p_payment_status: 'refunded',
          p_raw_event_data: event.data.object
        })

        // TODO: Send notification to student and teacher about refund

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
