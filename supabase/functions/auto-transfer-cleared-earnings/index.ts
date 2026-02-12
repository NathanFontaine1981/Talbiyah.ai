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
    // Auth: only allow service_role key (cron-invoked)
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

    console.log('Starting auto-transfer of cleared earnings...')

    // Get all teachers eligible for auto-payout
    const { data: eligibleTeachers, error: rpcError } = await supabaseClient
      .rpc('get_teachers_eligible_for_auto_payout')

    if (rpcError) {
      console.error('Error fetching eligible teachers:', rpcError)
      throw rpcError
    }

    if (!eligibleTeachers || eligibleTeachers.length === 0) {
      console.log('No teachers eligible for auto-payout')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No teachers eligible for auto-payout',
          processed: 0,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Found ${eligibleTeachers.length} eligible teacher(s)`)

    const results: { teacher_id: string; status: string; amount?: number; error?: string }[] = []

    // Process each teacher sequentially
    for (const teacher of eligibleTeachers) {
      const { teacher_id, stripe_account_id, cleared_balance, earnings_count, earning_ids } = teacher

      console.log(`Processing teacher ${teacher_id}: £${cleared_balance} from ${earnings_count} earnings`)

      try {
        // Create payout record (status: processing)
        const { data: payout, error: payoutCreateError } = await supabaseClient
          .from('teacher_payouts')
          .insert({
            teacher_id,
            total_amount: cleared_balance,
            currency: 'gbp',
            earnings_count,
            payout_method: 'stripe_connect',
            status: 'processing',
            notes: `Auto-payout for ${earnings_count} cleared earnings`,
          })
          .select()
          .single()

        if (payoutCreateError) {
          throw new Error(`Failed to create payout record: ${payoutCreateError.message}`)
        }

        // Create Stripe Transfer to connected account
        const amountInPence = Math.round(Number(cleared_balance) * 100)

        const transfer = await stripe.transfers.create({
          amount: amountInPence,
          currency: 'gbp',
          destination: stripe_account_id,
          metadata: {
            teacher_id,
            payout_id: payout.id,
            platform: 'talbiyah',
            type: 'auto_payout',
          },
        })

        // Update payout to completed with Stripe transfer ID
        await supabaseClient
          .from('teacher_payouts')
          .update({
            status: 'completed',
            external_payout_id: transfer.id,
            completed_at: new Date().toISOString(),
          })
          .eq('id', payout.id)

        // Update earnings to 'paid' status
        await supabaseClient
          .from('teacher_earnings')
          .update({
            status: 'paid',
            payout_id: payout.id,
            paid_at: new Date().toISOString(),
          })
          .in('id', earning_ids)

        // Send success notification
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-payout-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              payout_id: payout.id,
              teacher_id,
              type: 'completed',
            }),
          })
        } catch (emailErr) {
          console.error(`Failed to send payout notification for teacher ${teacher_id}:`, emailErr.message)
        }

        results.push({ teacher_id, status: 'completed', amount: Number(cleared_balance) })
        console.log(`Successfully transferred £${cleared_balance} to teacher ${teacher_id} (transfer: ${transfer.id})`)

      } catch (err) {
        console.error(`Failed to process payout for teacher ${teacher_id}:`, err.message)

        // Try to mark payout as failed if it was created
        try {
          const { data: existingPayout } = await supabaseClient
            .from('teacher_payouts')
            .select('id')
            .eq('teacher_id', teacher_id)
            .eq('status', 'processing')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (existingPayout) {
            await supabaseClient
              .from('teacher_payouts')
              .update({
                status: 'failed',
                failed_at: new Date().toISOString(),
                failure_reason: err.message,
              })
              .eq('id', existingPayout.id)

            // Send failure notification
            try {
              await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-payout-notification`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${serviceRoleKey}`,
                },
                body: JSON.stringify({
                  payout_id: existingPayout.id,
                  teacher_id,
                  type: 'failed',
                }),
              })
            } catch (emailErr) {
              console.error(`Failed to send failure notification for teacher ${teacher_id}:`, emailErr.message)
            }
          }
        } catch (updateErr) {
          console.error(`Failed to update payout record for teacher ${teacher_id}:`, updateErr.message)
        }

        results.push({ teacher_id, status: 'failed', error: err.message })
      }
    }

    const succeeded = results.filter(r => r.status === 'completed').length
    const failed = results.filter(r => r.status === 'failed').length
    const totalTransferred = results
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    console.log(`Auto-transfer complete: ${succeeded} succeeded, ${failed} failed, £${totalTransferred} transferred`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded,
        failed,
        total_transferred: totalTransferred,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in auto-transfer-cleared-earnings:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
