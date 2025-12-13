import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface WelcomeEmailPayload {
  user_id: string;
  email: string;
  full_name: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const payload: WelcomeEmailPayload = await req.json();
    console.log("Sending welcome email to:", payload.email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Nathan Fontaine - Talbiyah.ai <welcome@talbiyah.ai>",
        to: [payload.email],
        subject: "Welcome to Talbiyah.ai - Your Islamic Learning Journey Begins! 🌙",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Talbiyah.ai</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

              <!-- Header with gradient -->
              <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0 0 10px 0; font-size: 32px;">As-salamu alaykum ${payload.full_name}! 🌙</h1>
                <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Welcome to Talbiyah.ai</p>
              </div>

              <!-- Founder introduction -->
              <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                  <div style="flex: 1;">
                    <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 24px;">From Premier League to At Your Service</h2>
                    <p style="margin: 0; color: #64748b; font-size: 16px;">A Personal Message from Nathan Fontaine, Founder</p>
                  </div>
                </div>

                <p style="margin: 0 0 16px 0; color: #334155; line-height: 1.8;">
                  I'm Nathan Fontaine, and I want to personally welcome you to Talbiyah.ai. My journey from playing football for Bristol Rovers, Wigan Athletic, and West Bromwich Albion to founding this platform has been guided by my love for Islam.
                </p>

                <p style="margin: 0 0 16px 0; color: #334155; line-height: 1.8;">
                  I embraced Islam during my time in the Premier League with Wigan Athletic - a moment that transformed my life forever. For over 20 years, I've been dedicated to learning and sharing Islamic knowledge.
                </p>

                <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0; color: white; font-size: 16px; line-height: 1.7; font-style: italic;">
                    "Talbiyah.ai represents everything I've learned about combining dedication, discipline, and technology to serve the Muslim community. At Your Service isn't just our tagline - it's my personal commitment to you."
                  </p>
                  <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; text-align: right;">- Nathan Fontaine</p>
                </div>
              </div>

              <!-- What makes us different -->
              <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #0f172a; font-size: 22px;">✨ What Makes Talbiyah.ai Different</h3>

                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items-start; margin-bottom: 12px;">
                    <div style="background: #06b6d4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; font-weight: bold;">1</div>
                    <div>
                      <strong style="color: #0f172a;">AI-Powered Study Notes</strong>
                      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">After each lesson, receive personalized Talbiyah Insights - study notes and quizzes generated from YOUR actual conversation with your teacher.</p>
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items-start; margin-bottom: 12px;">
                    <div style="background: #06b6d4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; font-weight: bold;">2</div>
                    <div>
                      <strong style="color: #0f172a;">3-Stage Quran Mastery</strong>
                      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Understanding → Fluency → Memorization. We track all three stages so you truly master the Quran, not just memorize it.</p>
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items-start; margin-bottom: 12px;">
                    <div style="background: #06b6d4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; font-weight: bold;">3</div>
                    <div>
                      <strong style="color: #0f172a;">Hand-Picked Teachers</strong>
                      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Every teacher is qualified, background-checked, and monitored to ensure the highest quality Islamic education.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div style="display: flex; align-items-start;">
                    <div style="background: #06b6d4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; font-weight: bold;">4</div>
                    <div>
                      <strong style="color: #0f172a;">Sadaqah Jariyah Built-In</strong>
                      <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Our referral system means every person you invite earns you ongoing rewards - even after you pass away.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Get started CTA -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
                <h3 style="margin: 0 0 16px 0; color: white; font-size: 22px;">🎁 Start Your Free 30-Minute Trial!</h3>
                <p style="margin: 0 0 24px 0; color: rgba(255,255,255,0.95); font-size: 16px;">
                  Experience the difference for yourself - completely free, no credit card required
                </p>
                <a href="https://talbiyah.ai/teachers" style="display: inline-block; background: white; color: #0f172a; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Browse Our Teachers
                </a>
              </div>

              <!-- Next steps -->
              <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #0f172a; font-size: 20px;">📋 Your Next Steps:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #334155;">
                  <li style="margin-bottom: 12px; line-height: 1.6;">Browse our qualified teachers and read their reviews</li>
                  <li style="margin-bottom: 12px; line-height: 1.6;">Book your FREE 30-minute trial lesson (no payment needed)</li>
                  <li style="margin-bottom: 12px; line-height: 1.6;">Choose between Quran with Understanding or Arabic Language</li>
                  <li style="line-height: 1.6;">After your lesson, receive your personalized AI-generated study notes!</li>
                </ol>
              </div>

              <!-- Support -->
              <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
                <p style="margin: 0 0 10px 0;">Need help getting started? We're here for you!</p>
                <p style="margin: 0;">Reply to this email or visit our <a href="https://talbiyah.ai" style="color: #06b6d4; text-decoration: none;">Help Center</a></p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
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

    const result = await emailResponse.json();
    console.log("Welcome email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
