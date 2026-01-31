import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ReferralPayload {
  referrer_id: string;
  referred_id: string;
  referral_code: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: ReferralPayload = await req.json();

    console.log("Processing referral notification:", payload);

    // Get referrer details
    const { data: referrer, error: referrerError } = await supabase
      .from("profiles")
      .select("full_name, id")
      .eq("id", payload.referrer_id)
      .single();

    if (referrerError || !referrer) {
      console.error("Referrer not found:", referrerError);
      return new Response(
        JSON.stringify({ error: "Referrer not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get referrer's email from auth.users
    const { data: { user: referrerUser }, error: authError } = await supabase.auth.admin.getUserById(payload.referrer_id);

    if (authError || !referrerUser?.email) {
      console.error("Referrer email not found:", authError);
      return new Response(
        JSON.stringify({ error: "Referrer email not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get referred user details
    const { data: referred, error: referredError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", payload.referred_id)
      .single();

    if (referredError || !referred) {
      console.error("Referred user not found:", referredError);
      return new Response(
        JSON.stringify({ error: "Referred user not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Talbiyah.ai <contact@talbiyah.ai>",
        to: [referrerUser.email],
        subject: "🎉 New Referral Sign Up - Someone Joined Using Your Link!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Referral Sign Up</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

              <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🎉 Great News!</h1>
                <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Someone just joined using your referral link</p>
              </div>

              <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
                <p style="margin: 0 0 20px 0; font-size: 16px;">As-salamu alaykum <strong>${referrer.full_name}</strong>,</p>

                <p style="margin: 0 0 20px 0; font-size: 16px;"><strong>${referred.full_name}</strong> just signed up to Talbiyah.ai using your referral code <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #06b6d4;">${payload.referral_code}</code></p>

                <div style="background: white; border-left: 4px solid #06b6d4; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 15px; color: #64748b;">
                    <strong style="color: #0f172a;">Your Reward:</strong> Once they complete their first paid lesson, you'll both receive credits as a reward!
                  </p>
                </div>
              </div>

              <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 2px solid #fbbf24;">
                <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px;">💡 Sadaqah Jariyah - Ongoing Reward</h3>
                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">
                  Every hour they spend learning about Islam, you earn rewards too. This is an ongoing charity (Sadaqah Jariyah) that will continue to benefit you, even after you pass away, in sha Allah.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://talbiyah.ai/my-referrals" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View All My Referrals
                </a>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #64748b; font-size: 14px;">
                <p style="margin: 0 0 10px 0;">Keep sharing your referral link to earn more rewards!</p>
                <p style="margin: 0;"><strong>Your referral code:</strong> <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${payload.referral_code}</code></p>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
                <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
                <p style="margin: 5px 0 0 0;">AI-Powered Islamic Learning</p>
              </div>

            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    // Mark the notification as sent in the referrals table
    await supabase
      .from("referrals")
      .update({ notification_sent: true })
      .eq("referrer_id", payload.referrer_id)
      .eq("referred_user_id", payload.referred_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral notification sent",
        email_id: emailResult.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending referral notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
