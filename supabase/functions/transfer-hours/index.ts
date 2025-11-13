import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransferRequest {
  to_email: string;
  hours_amount: number;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to_email, hours_amount, message }: TransferRequest = await req.json();

    // Validate input
    if (!to_email || !hours_amount || hours_amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid input: to_email and hours_amount required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sender's credits
    const { data: senderCredits } = await supabase
      .from("referral_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!senderCredits) {
      return new Response(
        JSON.stringify({ error: "Sender not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Check tier (must be Silver+)
    if (senderCredits.tier === "bronze") {
      return new Response(
        JSON.stringify({ error: "Must be Silver tier or higher to transfer hours. Refer 5 users to unlock!" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if enough hours available
    if (senderCredits.available_hours < hours_amount) {
      return new Response(
        JSON.stringify({
          error: `Only ${senderCredits.available_hours.toFixed(1)}h available. You tried to transfer ${hours_amount}h.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check monthly transfer limit
    const now = new Date();
    const lastReset = new Date(senderCredits.last_transfer_reset);

    // Reset counter if new month
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await supabase
        .from("referral_credits")
        .update({
          transfers_this_month: 0,
          last_transfer_reset: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        })
        .eq("user_id", user.id);

      senderCredits.transfers_this_month = 0;
    }

    if (senderCredits.transfers_this_month + hours_amount > senderCredits.transfer_limit_monthly) {
      return new Response(
        JSON.stringify({
          error: `Monthly transfer limit: ${senderCredits.transfer_limit_monthly}h. You've used ${senderCredits.transfers_this_month}h this month.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find recipient
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", to_email)
      .single();

    if (!recipient) {
      return new Response(
        JSON.stringify({ error: "Recipient email not found. They must create an account first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cannot transfer to self
    if (recipient.id === user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot transfer hours to yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create recipient credits
    let { data: recipientCredits } = await supabase
      .from("referral_credits")
      .select("*")
      .eq("user_id", recipient.id)
      .single();

    if (!recipientCredits) {
      const { data: newCredits } = await supabase
        .from("referral_credits")
        .insert({ user_id: recipient.id })
        .select()
        .single();
      recipientCredits = newCredits;
    }

    // Calculate credit value (£15 per hour)
    const creditValue = hours_amount * 15.0;

    // Perform transfer
    // 1. Deduct from sender
    await supabase
      .from("referral_credits")
      .update({
        available_hours: senderCredits.available_hours - hours_amount,
        available_balance: senderCredits.available_balance - creditValue,
        transferred_hours: senderCredits.transferred_hours + hours_amount,
        transfers_this_month: senderCredits.transfers_this_month + hours_amount,
      })
      .eq("user_id", user.id);

    // 2. Add to recipient
    await supabase
      .from("referral_credits")
      .update({
        available_hours: recipientCredits.available_hours + hours_amount,
        available_balance: recipientCredits.available_balance + creditValue,
        total_earned: recipientCredits.total_earned + creditValue,
      })
      .eq("user_id", recipient.id);

    // 3. Record transactions
    await supabase
      .from("referral_transactions")
      .insert([
        {
          user_id: user.id,
          type: "transfer_out",
          hours_amount: -hours_amount,
          credit_amount: -creditValue,
          transfer_to_user_id: recipient.id,
          transfer_message: message,
          description: `Transferred ${hours_amount}h to ${recipient.full_name}`,
        },
        {
          user_id: recipient.id,
          type: "transfer_in",
          hours_amount: hours_amount,
          credit_amount: creditValue,
          transfer_from_user_id: user.id,
          transfer_message: message,
          description: `Received ${hours_amount}h from ${senderProfile.full_name}`,
        },
      ]);

    // 4. Send notification emails
    console.log(`Transfer complete: ${hours_amount}h from ${senderProfile.email} to ${recipient.email}`);
    // TODO: Implement email notifications

    return new Response(
      JSON.stringify({
        success: true,
        transferred: hours_amount,
        recipient: recipient.full_name,
        remaining: (senderCredits.available_hours - hours_amount).toFixed(1),
        transfers_remaining_this_month: senderCredits.transfer_limit_monthly - (senderCredits.transfers_this_month + hours_amount),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error transferring hours:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
