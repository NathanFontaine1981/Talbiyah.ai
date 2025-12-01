import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe is not configured')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { group_session_id, success_url, cancel_url } = await req.json()

    if (!group_session_id) {
      throw new Error('group_session_id is required')
    }

    // Get group session details
    const { data: session, error: sessionError } = await supabase
      .from('group_sessions')
      .select(`
        id,
        name,
        is_free,
        price_per_session,
        max_participants,
        current_participants,
        status,
        teacher_id,
        subjects(name)
      `)
      .eq('id', group_session_id)
      .single()

    if (sessionError || !session) {
      throw new Error('Group session not found')
    }

    // Check if session is full
    if (session.current_participants >= session.max_participants) {
      throw new Error('This group session is full')
    }

    // Check if session is open
    if (session.status !== 'open') {
      throw new Error('This group session is not accepting enrollments')
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('group_session_participants')
      .select('id')
      .eq('group_session_id', group_session_id)
      .eq('student_id', user.id)
      .single()

    if (existingEnrollment) {
      throw new Error('You are already enrolled in this session')
    }

    // If session is free, enroll directly
    if (session.is_free) {
      // Enroll student
      const { error: enrollError } = await supabase
        .from('group_session_participants')
        .insert({
          group_session_id,
          student_id: user.id
        })

      if (enrollError) {
        throw new Error('Failed to enroll in session')
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: 'free_enrollment',
          message: 'Successfully enrolled in the free session'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For paid sessions, create Stripe checkout
    const price = session.price_per_session || 0
    if (price <= 0) {
      throw new Error('Invalid session price')
    }

    // Get user profile for Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name,
        metadata: {
          supabase_user_id: user.id
        }
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create pending payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('group_session_payments')
      .insert({
        group_session_id,
        student_id: user.id,
        amount: price,
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Payment record error:', paymentError)
      // Continue anyway - we can create it later
    }

    // Create Stripe checkout session
    const subjectName = session.subjects?.name || 'Islamic Studies'

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Group Session: ${session.name}`,
              description: `${subjectName} group class enrollment`,
              metadata: {
                group_session_id,
                type: 'group_session'
              }
            },
            unit_amount: price, // Already in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/group-classes?enrolled=${group_session_id}`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/group-classes?cancelled=true`,
      metadata: {
        type: 'group_session_enrollment',
        group_session_id,
        student_id: user.id,
        payment_record_id: paymentRecord?.id || ''
      }
    })

    // Update payment record with Stripe session ID
    if (paymentRecord) {
      await supabase
        .from('group_session_payments')
        .update({ stripe_session_id: checkoutSession.id })
        .eq('id', paymentRecord.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        type: 'checkout',
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in group session checkout:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
