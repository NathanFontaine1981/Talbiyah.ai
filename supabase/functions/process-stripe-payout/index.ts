import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile?.roles || !profile.roles.includes('admin')) {
      throw new Error('Admin access required')
    }

    // Get request body
    const { teacher_id } = await req.json()

    // Get teacher payment settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('teacher_payment_settings')
      .select('stripe_account_id, stripe_onboarding_completed')
      .eq('teacher_id', teacher_id)
      .single()

    if (settingsError || !settings) {
      throw new Error('Payment settings not found')
    }

    if (!settings.stripe_account_id || !settings.stripe_onboarding_completed) {
      throw new Error('Stripe account not set up or onboarding incomplete')
    }

    // Get cleared earnings for this teacher
    const { data: clearedEarnings, error: earningsError } = await supabaseClient
      .from('teacher_earnings')
      .select('id, amount_earned')
      .eq('teacher_id', teacher_id)
      .eq('status', 'cleared')

    if (earningsError) throw earningsError

    if (!clearedEarnings || clearedEarnings.length === 0) {
      throw new Error('No cleared earnings to payout')
    }

    const totalAmount = clearedEarnings.reduce((sum, e) => sum + Number(e.amount_earned), 0)

    // Convert to pence for Stripe (GBP smallest unit)
    const amountInPence = Math.round(totalAmount * 100)

    // Create payout record first
    const { data: payout, error: payoutCreateError } = await supabaseClient
      .from('teacher_payouts')
      .insert({
        teacher_id: teacher_id,
        total_amount: totalAmount,
        currency: 'gbp',
        earnings_count: clearedEarnings.length,
        payout_method: 'stripe_connect',
        status: 'processing',
        processed_by: user.id,
        notes: `Stripe Connect payout for ${clearedEarnings.length} lessons`,
      })
      .select()
      .single()

    if (payoutCreateError) throw payoutCreateError

    try {
      // Create Stripe payout (transfer to connected account)
      const transfer = await stripe.transfers.create({
        amount: amountInPence,
        currency: 'gbp',
        destination: settings.stripe_account_id,
        metadata: {
          teacher_id: teacher_id,
          payout_id: payout.id,
          platform: 'talbiyah',
        },
      })

      // Update payout record with Stripe transfer ID
      await supabaseClient
        .from('teacher_payouts')
        .update({
          status: 'completed',
          external_payout_id: transfer.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', payout.id)

      // Update earnings to 'paid' status and link to payout
      await supabaseClient
        .from('teacher_earnings')
        .update({
          status: 'paid',
          payout_id: payout.id,
          paid_at: new Date().toISOString(),
        })
        .in('id', clearedEarnings.map(e => e.id))

      return new Response(
        JSON.stringify({
          success: true,
          payout_id: payout.id,
          transfer_id: transfer.id,
          amount: totalAmount,
          currency: 'gbp',
          earnings_count: clearedEarnings.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (stripeError) {
      // Mark payout as failed
      await supabaseClient
        .from('teacher_payouts')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: stripeError.message,
        })
        .eq('id', payout.id)

      throw stripeError
    }
  } catch (error) {
    console.error('Error processing Stripe payout:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
