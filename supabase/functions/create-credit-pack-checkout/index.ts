import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pack_type } = await req.json() // 'light', 'standard', or 'intensive'

    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

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

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
