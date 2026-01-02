import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

interface BookingNotification {
  teacher_email: string;
  teacher_name: string;
  student_name: string;
  subject_name: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  booking_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  console.log('📧 SEND BOOKING NOTIFICATION:', {
    method: req.method,
    timestamp: new Date().toISOString()
  });

  try {
    // Verify authentication - allow service role key OR user token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is a service role key call (from internal functions)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const isServiceRole = authHeader.includes(serviceRoleKey || "NEVER_MATCH");

    if (!isServiceRole) {
      // Verify user token if not service role
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log('🔐 Auth verified:', isServiceRole ? 'service role' : 'user token');

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not found in environment variables');
      throw new Error('RESEND_API_KEY not configured');
    }

    const body: BookingNotification = await req.json()
    const {
      teacher_email,
      teacher_name,
      student_name,
      subject_name,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      booking_id
    } = body

    console.log('📋 Notification details:', {
      teacher_email,
      teacher_name,
      student_name,
      subject_name,
      scheduled_date,
      scheduled_time
    });

    // Format the date nicely
    const dateObj = new Date(scheduled_date);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create the email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Class Booking</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                📚 New Class Booking
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Dear <strong>${teacher_name}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                Great news! You have a new class booking. Here are the details:
              </p>

              <!-- Booking Details Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #0891b2; font-size: 18px; font-weight: bold;">
                      Booking Details
                    </h2>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Student:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${student_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Subject:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${subject_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Date:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Time:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${scheduled_time}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Duration:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${duration_minutes} minutes</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                Please log in to your dashboard to view this booking and prepare for your lesson with <strong>${student_name}</strong>.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://talbiyah.ai/dashboard" style="display: inline-block; padding: 16px 32px; background-color: #0891b2; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View in Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong>The Talbiyah.ai Team</strong>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                If you have any questions, please contact us at contact@talbiyah.ai
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email using Resend
    console.log('📤 Sending email via Resend...');

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Talbiyah.ai <lessons@talbiyah.ai>",
        to: [teacher_email],
        subject: `📚 New Class Booking - ${subject_name} with ${student_name}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();

    console.log('✅ Email sent successfully via Resend:', {
      to: teacher_email,
      email_id: result.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking notification sent successfully',
        to: teacher_email,
        email_id: result.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('💥 Error sending booking notification:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
