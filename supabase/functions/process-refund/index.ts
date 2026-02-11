import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
    // Auth check - requires authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { purchase_id, reason } = await req.json();

    if (!purchase_id) {
      return new Response(
        JSON.stringify({ error: 'purchase_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('id', purchase_id)
      .eq('user_id', user.id) // Ensure user owns this purchase
      .single();

    if (purchaseError || !purchase) {
      return new Response(
        JSON.stringify({ error: 'Purchase not found or not authorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already refunded
    if (purchase.refunded_at) {
      return new Response(
        JSON.stringify({ error: 'This purchase has already been refunded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if within refund window (14 days - UK Consumer Contracts Regulations 2013)
    const refundDeadline = new Date(purchase.refund_deadline);
    if (new Date() > refundDeadline) {
      return new Response(
        JSON.stringify({
          error: 'Refund window has expired',
          message: 'Refunds must be requested within 14 days of purchase'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's current credit balance
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single();

    if (creditsError) {
      return new Response(
        JSON.stringify({ error: 'Could not verify credit balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate refundable credits (user must have enough credits)
    const creditsToRefund = purchase.credits_added;
    const currentBalance = userCredits?.credits_remaining || 0;

    if (currentBalance < creditsToRefund) {
      // Partial refund - user has used some credits
      const usedCredits = creditsToRefund - currentBalance;
      const refundableCredits = currentBalance;
      const refundPercentage = refundableCredits / creditsToRefund;
      const refundAmount = Math.floor(purchase.pack_price * refundPercentage * 100); // in pence

      if (refundableCredits <= 0) {
        return new Response(
          JSON.stringify({
            error: 'No credits available to refund',
            message: `You have used all ${creditsToRefund} credits from this purchase`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Process partial refund
      const refund = await stripe.refunds.create({
        payment_intent: purchase.stripe_payment_id,
        amount: refundAmount,
        reason: 'requested_by_customer',
      });

      // Deduct credits
      const { error: deductError } = await supabase.rpc('deduct_user_credits', {
        p_user_id: user.id,
        p_credits: refundableCredits,
        p_lesson_id: null,
        p_notes: `Partial refund: ${refundableCredits} credits (${usedCredits} were used)`
      });

      if (deductError) {
        console.error('Failed to deduct credits after partial refund:', deductError.message);
        return new Response(
          JSON.stringify({ error: 'Refund processed but credit deduction failed. Contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update purchase record
      await supabase
        .from('credit_purchases')
        .update({
          refunded_at: new Date().toISOString(),
          refund_amount: refundAmount / 100,
          refund_type: 'partial',
          refund_reason: reason || 'User requested refund',
          stripe_refund_id: refund.id
        })
        .eq('id', purchase_id);

      return new Response(
        JSON.stringify({
          success: true,
          refund_type: 'partial',
          credits_refunded: refundableCredits,
          credits_used: usedCredits,
          amount_refunded: refundAmount / 100,
          message: `Partial refund processed: £${(refundAmount / 100).toFixed(2)} for ${refundableCredits} unused credits`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Full refund - user hasn't used any credits from this purchase
    const refundAmount = Math.floor(purchase.pack_price * 100); // in pence

    const refund = await stripe.refunds.create({
      payment_intent: purchase.stripe_payment_id,
      amount: refundAmount,
      reason: 'requested_by_customer',
    });

    // Deduct all credits
    const { error: deductError } = await supabase.rpc('deduct_user_credits', {
      p_user_id: user.id,
      p_credits: creditsToRefund,
      p_lesson_id: null,
      p_notes: `Full refund: ${creditsToRefund} credits`
    });

    if (deductError) {
      console.error('Failed to deduct credits after full refund:', deductError.message);
      return new Response(
        JSON.stringify({ error: 'Refund processed but credit deduction failed. Contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update purchase record
    await supabase
      .from('credit_purchases')
      .update({
        refunded_at: new Date().toISOString(),
        refund_amount: purchase.pack_price,
        refund_type: 'full',
        refund_reason: reason || 'User requested refund',
        stripe_refund_id: refund.id
      })
      .eq('id', purchase_id);

    return new Response(
      JSON.stringify({
        success: true,
        refund_type: 'full',
        credits_refunded: creditsToRefund,
        amount_refunded: purchase.pack_price,
        message: `Full refund processed: £${purchase.pack_price.toFixed(2)} for ${creditsToRefund} credits`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing refund:', error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process refund' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
