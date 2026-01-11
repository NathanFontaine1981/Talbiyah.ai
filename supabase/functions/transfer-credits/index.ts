import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { recipientEmail, credits, notes } = await req.json();

    // Validate input
    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid credit amount is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Maximum transfer limit
    if (credits > 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Maximum transfer is 100 credits per transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find recipient by email
    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', recipientEmail.toLowerCase().trim())
      .single();

    if (recipientError || !recipientProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient not found. Please check the email address.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Can't transfer to yourself
    if (recipientProfile.id === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'You cannot transfer credits to yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sender's profile for the email
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Call the transfer function
    const { data: transferResult, error: transferError } = await supabaseAdmin.rpc(
      'transfer_credits',
      {
        p_from_user_id: user.id,
        p_to_user_id: recipientProfile.id,
        p_credits: credits,
        p_notes: notes || null,
      }
    );

    if (transferError) {
      console.error('Transfer error:', transferError);
      return new Response(
        JSON.stringify({ success: false, error: transferError.message || 'Transfer failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check transfer result
    if (!transferResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: transferResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification email to recipient
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          to: recipientProfile.email,
          type: 'credit_transfer_received',
          data: {
            recipientName: recipientProfile.full_name,
            senderName: senderProfile?.full_name || 'A Talbiyah user',
            creditsAmount: credits,
            notes: notes || '',
          },
        }),
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the transfer if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transferResult.transfer_id,
        credits_transferred: transferResult.credits_transferred,
        new_balance: transferResult.new_balance,
        recipient_name: transferResult.recipient_name,
        message: `Successfully transferred ${credits} credit${credits > 1 ? 's' : ''} to ${transferResult.recipient_name}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
