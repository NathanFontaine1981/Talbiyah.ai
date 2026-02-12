import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth: only allow service_role key (run-once admin task)
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    )

    // Get all connected accounts that have completed onboarding
    const { data: accounts, error: queryError } = await supabaseClient
      .from('teacher_payment_settings')
      .select('teacher_id, stripe_account_id')
      .not('stripe_account_id', 'is', null)
      .eq('stripe_onboarding_completed', true)

    if (queryError) throw queryError

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No existing accounts to update', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Found ${accounts.length} existing connected account(s) to update`)

    let updated = 0
    let failed = 0
    const errors: { teacher_id: string; error: string }[] = []

    for (const account of accounts) {
      try {
        await stripe.accounts.update(account.stripe_account_id, {
          settings: {
            payouts: {
              schedule: {
                interval: 'monthly',
                monthly_anchor: 1,
              },
            },
          },
        })
        updated++
        console.log(`Updated payout schedule for account ${account.stripe_account_id} (teacher: ${account.teacher_id})`)
      } catch (err) {
        failed++
        errors.push({ teacher_id: account.teacher_id, error: err.message })
        console.error(`Failed to update account ${account.stripe_account_id}:`, err.message)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: accounts.length,
        updated,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in set-existing-payout-schedules:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
