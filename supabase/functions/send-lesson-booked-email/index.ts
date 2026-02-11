import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface LessonBookedPayload {
  lesson_id: string;
  student_email: string;
  student_name: string;
  teacher_name: string;
  subject: string;
  scheduled_time: string;
  duration_minutes: number;
  lesson_url: string;
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

    const payload: LessonBookedPayload = await req.json();
    console.log("Sending lesson booked email for lesson:", payload.lesson_id);

    const lessonDate = new Date(payload.scheduled_time);
    const formattedDate = lessonDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = lessonDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Talbiyah.ai <notifications@talbiyah.ai>",
        to: [payload.student_email],
        subject: `✅ Lesson Confirmed with ${payload.teacher_name} - ${formattedDate}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

              <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Lesson Confirmed!</h1>
                <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 0;">Your lesson is booked and ready</p>
              </div>

              <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #10b981;">
                <h2 style="margin: 0 0 20px 0; color: #0f172a; font-size: 22px;">📅 Lesson Details</h2>

                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                  <strong style="color: #64748b; font-size: 14px; display: block; margin-bottom: 4px;">TEACHER</strong>
                  <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 600;">${payload.teacher_name}</p>
                </div>

                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                  <strong style="color: #64748b; font-size: 14px; display: block; margin-bottom: 4px;">SUBJECT</strong>
                  <p style="margin: 0; color: #0f172a; font-size: 16px;">${payload.subject}</p>
                </div>

                <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                  <strong style="color: #64748b; font-size: 14px; display: block; margin-bottom: 4px;">DATE & TIME</strong>
                  <p style="margin: 0; color: #0f172a; font-size: 16px;">${formattedDate}</p>
                  <p style="margin: 4px 0 0 0; color: #06b6d4; font-size: 18px; font-weight: 600;">${formattedTime}</p>
                </div>

                <div>
                  <strong style="color: #64748b; font-size: 14px; display: block; margin-bottom: 4px;">DURATION</strong>
                  <p style="margin: 0; color: #0f172a; font-size: 16px;">${payload.duration_minutes} minutes</p>
                </div>
              </div>

              <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px;">⏰ Important Reminders</h3>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  <li style="margin-bottom: 8px;">You'll receive a reminder email 1 hour before your lesson</li>
                  <li style="margin-bottom: 8px;">Please join 5 minutes early to test your camera and microphone</li>
                  <li style="margin-bottom: 8px;">Make sure you're in a quiet environment with good internet</li>
                  <li>Have any materials ready (Quran, notebook, etc.)</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${payload.lesson_url}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Lesson Details
                </a>
              </div>

              <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px;">💡 What to Expect</h3>
                <p style="margin: 0 0 12px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                  After your lesson, you'll automatically receive personalised Talbiyah Insights - AI-generated study notes and quizzes based on YOUR actual conversation with ${payload.teacher_name}.
                </p>
                <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">
                  This helps reinforce what you learned and makes review easier!
                </p>
              </div>

              <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
                <p style="margin: 0 0 10px 0;">Need to reschedule or have questions?</p>
                <p style="margin: 0;">Reply to this email or visit your <a href="https://talbiyah.ai/dashboard" style="color: #06b6d4; text-decoration: none;">Dashboard</a></p>
              </div>

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
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Lesson booked email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending lesson booked email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
