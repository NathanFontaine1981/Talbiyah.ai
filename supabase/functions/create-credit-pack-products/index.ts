import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

serve(async (req) => {
  try {
    const stripe = await import('https://esm.sh/stripe@13.0.0')
    const stripeClient = new stripe.default(STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    // Create products for each credit pack
    const packs = [
      {
        name: '4 Lesson Credits',
        description: 'Light Pack - 4 lessons (£14 per lesson)',
        price: 5600, // £56.00 in pence
        credits: 4,
        metadata: { pack_type: 'light', credits: '4' }
      },
      {
        name: '8 Lesson Credits',
        description: 'Standard Pack - 8 lessons (£13 per lesson) - MOST POPULAR',
        price: 10400, // £104.00 in pence
        credits: 8,
        metadata: { pack_type: 'standard', credits: '8' }
      },
      {
        name: '16 Lesson Credits',
        description: 'Intensive Pack - 16 lessons (£12 per lesson)',
        price: 19200, // £192.00 in pence
        credits: 16,
        metadata: { pack_type: 'intensive', credits: '16' }
      }
    ]

    const createdProducts = []

    for (const pack of packs) {
      // Create product
      const product = await stripeClient.products.create({
        name: pack.name,
        description: pack.description,
        metadata: pack.metadata
      })

      // Create price
      const price = await stripeClient.prices.create({
        product: product.id,
        unit_amount: pack.price,
        currency: 'gbp',
        metadata: { credits: pack.credits.toString() }
      })

      createdProducts.push({
        product_id: product.id,
        price_id: price.id,
        ...pack
      })
    }

    return new Response(JSON.stringify({
      success: true,
      products: createdProducts
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
