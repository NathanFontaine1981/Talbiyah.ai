import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { code, percentOff, name } = await req.json()

    console.log('Creating coupon:', { percentOff, name })

    // Create coupon
    const coupon = await stripe.coupons.create({
      percent_off: percentOff,
      duration: 'forever',
      name: name || `${percentOff}% Discount`,
    })

    console.log('Coupon created:', coupon.id)

    // Create promotion code
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code,
      active: true,
    })

    console.log('Promotion code created:', promotionCode.code)

    return new Response(
      JSON.stringify({
        success: true,
        coupon: {
          id: coupon.id,
          percent_off: coupon.percent_off,
          name: coupon.name,
        },
        promotionCode: {
          id: promotionCode.id,
          code: promotionCode.code,
          active: promotionCode.active,
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error creating discount code:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
