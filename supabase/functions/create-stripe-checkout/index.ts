import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { corsHeaders, securityHeaders } from "../_shared/cors.ts"

const responseHeaders = {
  ...responseHeaders,
  ...securityHeaders,
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const {
      teacher_id,
      duration,
      scheduled_time,
      subject_id,
      discount_code
    } = await req.json()

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Invalid authentication')
    }

    const student_id = user.id

    console.log('Creating checkout for:', { teacher_id, student_id, duration, scheduled_time })

    // Validate inputs
    if (!teacher_id || !duration || !scheduled_time) {
      throw new Error('Missing required fields: teacher_id, duration, scheduled_time')
    }

    if (duration < 30 || duration > 180) {
      throw new Error('Duration must be between 30 and 180 minutes')
    }

    // Get teacher profile with tier
    const { data: teacher, error: teacherError } = await supabaseClient
      .from('teacher_profiles')
      .select(`
        id,
        user_id,
        current_tier,
        hourly_rate,
        teacher_tiers!current_tier(student_price)
      `)
      .eq('id', teacher_id)
      .single()

    if (teacherError || !teacher) {
      throw new Error('Teacher not found')
    }

    // Get student profile
    const { data: studentProfile, error: studentError } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', student_id)
      .single()

    if (studentError || !studentProfile) {
      throw new Error('Student profile not found')
    }

    // Calculate price with price locks
    const { data: priceData, error: priceError } = await supabaseClient
      .rpc('get_student_price_for_teacher', {
        p_student_id: student_id,
        p_teacher_id: teacher_id
      })

    let hourlyRate: number
    if (priceError || !priceData) {
      // Fallback to teacher tier price
      hourlyRate = teacher.teacher_tiers?.student_price || teacher.hourly_rate
      console.log('Using fallback price:', hourlyRate)
    } else {
      hourlyRate = priceData
      console.log('Using price lock:', hourlyRate)
    }

    // Calculate total amount
    const hours = duration / 60
    let totalAmount = hourlyRate * hours

    // Apply discount code if provided
    let discount_amount = 0
    if (discount_code) {
      const { data: discount, error: discountError } = await supabaseClient
        .from('promo_codes')
        .select('*')
        .eq('code', discount_code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (discount && !discountError) {
        // Check if discount is still valid
        const now = new Date()
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null

        if (!validUntil || validUntil > now) {
          // Check usage limits
          if (!discount.max_uses || discount.current_uses < discount.max_uses) {
            // Apply discount based on type
            if (discount.discount_type === 'percentage') {
              discount_amount = totalAmount * (discount.discount_value / 100)
            } else if (discount.discount_type === 'fixed') {
              discount_amount = Math.min(discount.discount_value, totalAmount)
            } else if (discount.discount_type === 'free_lesson') {
              // Free lesson - full discount up to the lesson price
              discount_amount = totalAmount
            }

            totalAmount -= discount_amount

            // Update promo code usage count
            await supabaseClient
              .from('promo_codes')
              .update({ current_uses: discount.current_uses + 1 })
              .eq('id', discount.id)
          }
        }
      }
    }

    // Minimum charge of £0.50
    totalAmount = Math.max(totalAmount, 0.50)

    // Convert to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(totalAmount * 100)

    console.log('Payment calculation:', {
      hourlyRate,
      hours,
      subtotal: hourlyRate * hours,
      discount_amount,
      totalAmount,
      amountInCents
    })

    // Check for existing Stripe customer
    let stripeCustomerId: string | undefined

    const { data: existingLessons } = await supabaseClient
      .from('lessons')
      .select('stripe_customer_id')
      .eq('student_id', student_id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single()

    if (existingLessons?.stripe_customer_id) {
      stripeCustomerId = existingLessons.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: studentProfile.email,
        name: studentProfile.full_name,
        metadata: {
          user_id: student_id
        }
      })
      stripeCustomerId = customer.id
    }

    // Create pending lesson record first (to get lesson_id for metadata)
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .insert({
        student_id,
        teacher_id,
        scheduled_time,
        duration,
        subject_id: subject_id || null,
        status: 'pending',
        payment_status: 'pending',
        payment_amount: totalAmount,
        payment_currency: 'gbp',
        stripe_customer_id: stripeCustomerId
      })
      .select()
      .single()

    if (lessonError || !lesson) {
      throw new Error('Failed to create lesson record: ' + lessonError?.message)
    }

    console.log('Created pending lesson:', lesson.id)

    // Get subject name if provided
    let subjectName = 'Lesson'
    if (subject_id) {
      const { data: subject } = await supabaseClient
        .from('subjects')
        .select('name')
        .eq('id', subject_id)
        .single()

      if (subject) {
        subjectName = subject.name
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${subjectName} Lesson`,
              description: `${duration}-minute lesson on ${new Date(scheduled_time).toLocaleString('en-GB', {
                dateStyle: 'long',
                timeStyle: 'short'
              })}`,
              metadata: {
                teacher_id,
                duration: duration.toString()
              }
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout?cancelled=true`,
      metadata: {
        lesson_id: lesson.id,
        student_id,
        teacher_id,
        duration: duration.toString(),
        scheduled_time,
      },
      payment_intent_data: {
        metadata: {
          lesson_id: lesson.id,
          student_id,
          teacher_id,
        }
      }
    })

    // Update lesson with checkout session ID
    await supabaseClient
      .from('lessons')
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: 'processing'
      })
      .eq('id', lesson.id)

    // Log payment event
    await supabaseClient.rpc('log_payment_event', {
      p_lesson_id: lesson.id,
      p_event_type: 'checkout_created',
      p_checkout_session_id: session.id,
      p_amount: totalAmount,
      p_currency: 'gbp',
      p_payment_status: 'processing',
      p_customer_id: stripeCustomerId
    })

    console.log('Stripe checkout session created:', session.id)

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        sessionUrl: session.url,
        lessonId: lesson.id,
        amount: totalAmount
      }),
      {
        status: 200,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error creating checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
