import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, securityHeaders } from "../_shared/cors.ts"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts"
import { requireCSRF } from "../_shared/csrf.ts"
import { logSecurityEventFromRequest } from "../_shared/securityLog.ts"

const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
  }

  // CSRF protection
  const csrfError = requireCSRF(req, responseHeaders)
  if (csrfError) return csrfError

  // Rate limiting: 5 payment attempts per hour per IP
  const clientIP = getClientIP(req)
  const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.BOOKING)
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult, responseHeaders)
  }

  try {
    const body = await req.json()
    const { pack_type } = body

    // Validate pack_type
    if (!pack_type || typeof pack_type !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Create service client for logging
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...responseHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Pack configurations
    const packs = {
      light: {
        credits: 4,
        price: 5600, // £56.00 (£14/lesson)
        name: '4 Lesson Credits',
        description: 'Light Pack - 4 lessons (£14 per lesson)'
      },
      standard: {
        credits: 8,
        price: 10400, // £104.00 (£13/lesson)
        name: '8 Lesson Credits',
        description: 'Standard Pack - 8 lessons (£13 per lesson) - MOST POPULAR'
      },
      intensive: {
        credits: 16,
        price: 19200, // £192.00 (£12/lesson)
        name: '16 Lesson Credits',
        description: 'Intensive Pack - 16 lessons (£12 per lesson)'
      }
    }

    const pack = packs[pack_type as keyof typeof packs]
    if (!pack) throw new Error('Invalid pack type')

    console.log('Creating checkout for pack:', pack_type, pack)

    // Create Stripe checkout session
    const stripe = await import('https://esm.sh/stripe@13.0.0')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    const origin = req.headers.get('origin') || 'http://localhost:5173'

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${origin}/credit-purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/buy-credits?cancelled=true`,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: pack.price,
            product_data: {
              name: pack.name,
              description: pack.description,
              metadata: {
                pack_type,
                credits: pack.credits.toString()
              }
            }
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        pack_type,
        credits: pack.credits.toString(),
      },
    })

    console.log('Created checkout session:', session.id)

    // Log payment initiated
    await logSecurityEventFromRequest(supabaseService, req, {
      eventType: 'payment_initiated',
      userId: user.id,
      resourceType: 'credit_pack',
      resourceId: session.id,
      action: 'create',
      details: {
        pack_type,
        credits: pack.credits,
        amount: pack.price / 100
      },
      severity: 'info'
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    // Log error server-side only
    console.error('Credit pack checkout error:', error instanceof Error ? error.message : 'Unknown error')

    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 400,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
