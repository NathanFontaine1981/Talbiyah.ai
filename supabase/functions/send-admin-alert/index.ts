import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertPayload {
  flag_id: string;
  flag_type: string;
  lesson_id: string;
  flagged_content: string;
  context: string;
  severity?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AlertPayload = await req.json();
    console.log(`Sending admin alert for flag: ${payload.flag_id}`);

    if (!payload.flag_id || !payload.lesson_id || !payload.flagged_content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        scheduled_time,
        teacher_id,
        learner_id,
        teacher:profiles!lessons_teacher_id_fkey(full_name, email),
        learner:profiles!lessons_learner_id_fkey(full_name, email)
      `)
      .eq('id', payload.lesson_id)
      .single();

    if (lessonError) {
      console.error('Error fetching lesson:', lessonError);
    }

    // Get admin emails from profiles with admin role
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .contains('roles', ['admin']);

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      throw new Error('Failed to fetch admin list');
    }

    // If no admins found, use fallback email
    const adminList = (!admins || admins.length === 0)
      ? [{ id: 'fallback', email: 'contact@talbiyah.ai', full_name: 'Admin' }]
      : admins;

    if (!admins || admins.length === 0) {
      console.log('No admins found in database, using fallback email: contact@talbiyah.ai');
    }

    // Check if Resend API key is configured
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format lesson time
    const lessonTime = lesson?.scheduled_time
      ? new Date(lesson.scheduled_time).toLocaleString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Unknown';

    // Get teacher and learner names safely
    const teacherName = (lesson?.teacher as any)?.full_name || 'Unknown Teacher';
    const teacherEmail = (lesson?.teacher as any)?.email || 'Unknown';
    const learnerName = (lesson?.learner as any)?.full_name || 'Unknown Student';
    const learnerEmail = (lesson?.learner as any)?.email || 'Unknown';

    // Determine severity styling
    const severity = payload.severity || 'warning';
    const severityColor = severity === 'critical' ? '#dc2626' : '#f59e0b';
    const severityBg = severity === 'critical' ? '#fef2f2' : '#fffbeb';
    const severityLabel = severity === 'critical' ? 'CRITICAL' : 'WARNING';

    // Flag type labels
    const flagTypeLabels: Record<string, string> = {
      email: 'Email Address Detected',
      phone: 'Phone Number Detected',
      social_media: 'Social Media Reference',
      file_share: 'File Sharing Link',
      keyword: 'Suspicious Keywords'
    };

    const flagLabel = flagTypeLabels[payload.flag_type] || payload.flag_type;

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Suspicious Activity Alert</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${severityColor} 0%, #991b1b 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">🚨</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Suspicious Activity Detected</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">${severityLabel} - Immediate Review Required</p>
          </div>

          <!-- Alert Details -->
          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid ${severityColor};">

            <!-- Severity Badge -->
            <div style="background: ${severityBg}; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
              <span style="background: ${severityColor}; color: white; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;">
                ${severityLabel}: ${flagLabel}
              </span>
            </div>

            <!-- Flagged Content -->
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px;">Flagged Content:</h3>
              <p style="margin: 0; color: #7f1d1d; font-size: 18px; font-weight: 600; word-break: break-all;">
                "${escapeHtml(payload.flagged_content)}"
              </p>
            </div>

            <!-- Context -->
            ${payload.context ? `
            <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; color: #475569; font-size: 16px;">Context:</h3>
              <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                "${escapeHtml(payload.context.substring(0, 500))}${payload.context.length > 500 ? '...' : ''}"
              </p>
            </div>
            ` : ''}

            <!-- Lesson Details -->
            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 16px;">Lesson Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #047857; border-bottom: 1px solid #a7f3d0;">Lesson ID:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right; border-bottom: 1px solid #a7f3d0; font-family: monospace; font-size: 12px;">${payload.lesson_id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857; border-bottom: 1px solid #a7f3d0;">Teacher:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right; border-bottom: 1px solid #a7f3d0;">${escapeHtml(teacherName)}<br><span style="font-weight: 400; font-size: 12px; color: #047857;">${escapeHtml(teacherEmail)}</span></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857; border-bottom: 1px solid #a7f3d0;">Student:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right; border-bottom: 1px solid #a7f3d0;">${escapeHtml(learnerName)}<br><span style="font-weight: 400; font-size: 12px; color: #047857;">${escapeHtml(learnerEmail)}</span></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857;">Scheduled Time:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right;">${lessonTime}</td>
                </tr>
              </table>
            </div>

            <!-- Detection Info -->
            <div style="background: #eff6ff; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                <strong>Flag ID:</strong> ${payload.flag_id}<br>
                <strong>Detected At:</strong> ${new Date().toLocaleString('en-GB')}
              </p>
            </div>
          </div>

          <!-- Action Required -->
          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">Action Required:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #78350f;">
              <li style="margin-bottom: 8px;">Review the flagged content and lesson context</li>
              <li style="margin-bottom: 8px;">Check if this appears to be an attempt to communicate off-platform</li>
              <li style="margin-bottom: 8px;">Mark the flag as reviewed in the admin dashboard</li>
              <li>Take appropriate action if policy violation is confirmed</li>
            </ul>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.ai/admin/content-moderation" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
              Review in Admin Dashboard
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai Content Moderation System</p>
            <p style="margin: 5px 0 0 0;">This is an automated alert - do not reply to this email</p>
          </div>
        </body>
      </html>
    `;

    // Send email to all admins (or fallback)
    const emailPromises = adminList.map(async (admin) => {
      if (!admin.email) return null;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Talbiyah.ai Alerts <alerts@talbiyah.ai>",
            to: [admin.email],
            subject: `🚨 [${severityLabel}] Suspicious Activity in Lesson - ${flagLabel}`,
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send alert to ${admin.email}:`, errorText);
          return { admin: admin.email, success: false, error: errorText };
        }

        const result = await response.json();
        console.log(`Alert sent to ${admin.email}:`, result.id);
        return { admin: admin.email, success: true, email_id: result.id };
      } catch (error) {
        console.error(`Error sending to ${admin.email}:`, error);
        return { admin: admin.email, success: false, error: String(error) };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r?.success).length;

    // Update flag to mark admin as notified
    await supabase
      .from('lesson_content_flags')
      .update({ admin_notified: true })
      .eq('id', payload.flag_id);

    console.log(`Admin alerts sent: ${successCount}/${adminList.length}`);

    return new Response(
      JSON.stringify({
        message: `Alert sent to ${successCount} admins`,
        results: results.filter(r => r !== null)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending admin alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to escape HTML
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
