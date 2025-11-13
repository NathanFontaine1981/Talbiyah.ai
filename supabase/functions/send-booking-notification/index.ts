import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

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

serve(async (req) => {
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
    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'contact@talbiyah.ai'
    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'Talbiyah.ai'

    if (!smtpUser || !smtpPassword) {
      console.error('❌ SMTP credentials not found in environment variables');
      throw new Error('SMTP credentials not configured')
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
                Please log in to your dashboard to confirm that you have seen this booking and are looking forward to teaching <strong>${student_name}</strong>.
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
                If you have any questions, please contact us at support@talbiyah.ai
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

    // Plain text version for email clients that don't support HTML
    const emailText = `
New Class Booking

Dear ${teacher_name},

You have a new class booking!

Booking Details:
- Student: ${student_name}
- Subject: ${subject_name}
- Date: ${formattedDate}
- Time: ${scheduled_time}
- Duration: ${duration_minutes} minutes

Please log in to your dashboard to confirm that you have seen this booking and are looking forward to teaching ${student_name}.

View in Dashboard: https://talbiyah.ai/dashboard

Best regards,
The Talbiyah.ai Team
    `;

    // Send email using SMTP (Google Workspace)
    console.log('📤 Sending email via Google Workspace SMTP...');

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: teacher_email,
      subject: `📚 New Class Booking - ${subject_name} with ${student_name}`,
      content: emailText,
      html: emailHtml,
    });

    await client.close();

    console.log('✅ Email sent successfully:', {
      to: teacher_email,
      from: fromEmail
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking notification sent successfully',
        to: teacher_email
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
