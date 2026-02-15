import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"
import { corsHeaders, securityHeaders } from "../_shared/cors.ts"

const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: responseHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('Stripe is not configured')

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { group_session_id, success_url, cancel_url } = await req.json()
    if (!group_session_id) throw new Error('group_session_id is required')

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('group_sessions')
      .select('id, name, slug')
      .eq('id', group_session_id)
      .single()

    if (courseError || !course) throw new Error('Course not found')

    // Must be enrolled
    const { data: enrollment } = await supabase
      .from('group_session_participants')
      .select('id')
      .eq('group_session_id', group_session_id)
      .eq('student_id', user.id)
      .single()

    if (!enrollment) throw new Error('You must be enrolled in this course to purchase study notes')

    // Check not already purchased
    const { data: existingAccess } = await supabase
      .from('course_notes_access')
      .select('id, status')
      .eq('group_session_id', group_session_id)
      .eq('student_id', user.id)
      .single()

    if (existingAccess?.status === 'completed') {
      throw new Error('You already have access to study notes for this course')
    }

    // Count total sessions to calculate price: £2/session, max £10
    const { count: totalSessions } = await supabase
      .from('course_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('group_session_id', group_session_id)

    const sessionCount = totalSessions || 0
    const pricePence = Math.min(sessionCount * 200, 1000)

    if (pricePence <= 0) throw new Error('No sessions available for this course')

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    // Upsert pending access record (reuse if previous attempt was pending)
    const { data: accessRecord, error: accessError } = await supabase
      .from('course_notes_access')
      .upsert({
        group_session_id,
        student_id: user.id,
        amount: pricePence,
        status: 'pending',
      }, { onConflict: 'group_session_id,student_id' })
      .select()
      .single()

    if (accessError) {
      console.error('Access record error:', accessError)
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Study Notes: ${course.name}`,
              description: `AI-powered study notes for all ${sessionCount} sessions`,
              metadata: {
                group_session_id,
                type: 'course_notes',
              },
            },
            unit_amount: pricePence,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/course/${course.slug}?notes_unlocked=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/course/${course.slug}`,
      metadata: {
        type: 'course_notes_purchase',
        group_session_id,
        student_id: user.id,
        access_record_id: accessRecord?.id || '',
      },
    })

    // Update access record with Stripe session ID
    if (accessRecord) {
      await supabase
        .from('course_notes_access')
        .update({ stripe_session_id: checkoutSession.id })
        .eq('id', accessRecord.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
      }),
      { headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in course notes checkout:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
