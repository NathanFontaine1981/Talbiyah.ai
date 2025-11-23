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

    // Get user profile for metadata
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Check if Stripe account already exists
    const { data: existingSettings } = await supabaseClient
      .from('teacher_payment_settings')
      .select('stripe_account_id')
      .eq('teacher_id', teacher_id)
      .single()

    let accountId = existingSettings?.stripe_account_id

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB', // UK
        email: profile?.email || user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          teacher_id: teacher_id,
          user_id: user.id,
          platform: 'talbiyah',
        },
      })

      accountId = account.id

      // Save account ID to database
      await supabaseClient
        .from('teacher_payment_settings')
        .upsert({
          teacher_id: teacher_id,
          stripe_account_id: accountId,
          stripe_onboarding_completed: false,
        })
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${Deno.env.get('FRONTEND_URL')}/teacher/payment-settings?refresh=true`,
      return_url: `${Deno.env.get('FRONTEND_URL')}/teacher/payment-settings?success=true`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        account_id: accountId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
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
