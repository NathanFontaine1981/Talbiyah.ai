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

    // Get request body
    const { teacher_id } = await req.json()

    // Verify teacher belongs to authenticated user
    const { data: teacherProfile, error: teacherError } = await supabaseClient
      .from('teacher_profiles')
      .select('id, user_id')
      .eq('id', teacher_id)
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacherProfile) {
      throw new Error('Teacher profile not found or unauthorized')
    }

    // Get payment settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('teacher_payment_settings')
      .select('stripe_account_id')
      .eq('teacher_id', teacher_id)
      .single()

    if (settingsError || !settings?.stripe_account_id) {
      throw new Error('Stripe account not found')
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(settings.stripe_account_id)

    // Check if onboarding is complete
    const onboardingComplete = account.details_submitted && account.charges_enabled

    // Update database
    await supabaseClient
      .from('teacher_payment_settings')
      .update({
        stripe_onboarding_completed: onboardingComplete,
      })
      .eq('teacher_id', teacher_id)

    return new Response(
      JSON.stringify({
        success: true,
        onboarding_complete: onboardingComplete,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error refreshing Stripe Connect account:', error)
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
