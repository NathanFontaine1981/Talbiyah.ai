import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "nathanlfontaine@gmail.com";

const categoryLabels: Record<string, string> = {
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  content_suggestion: "Content Suggestion",
  ui_improvement: "UI/UX Improvement",
  teacher_feedback: "Teacher Feedback",
  other: "Other",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { suggestion } = await req.json();

    if (!suggestion) {
      throw new Error("Suggestion data is required");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      // Don't fail the request, just log it
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - no API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryLabel = categoryLabels[suggestion.category] || "Other";
    const submitterName = suggestion.name || suggestion.user_name || "Anonymous User";
    const submitterEmail = suggestion.email || suggestion.user_email || "No email provided";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 20px; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          .category { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
          .description { background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px; }
          .meta { font-size: 14px; color: #6b7280; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">💡 New User Suggestion</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Someone has submitted feedback on Talbiyah.ai</p>
          </div>
          <div class="content">
            <div class="category">${categoryLabel}</div>
            <div class="title">${suggestion.title}</div>
            <div class="description">
              ${suggestion.description.replace(/\n/g, '<br>')}
            </div>
            <div class="meta">
              <p><strong>From:</strong> ${submitterName}</p>
              <p><strong>Email:</strong> ${submitterEmail}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
            </div>
            <div style="margin-top: 20px;">
              <a href="https://talbiyah.ai/admin/suggestions" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View in Admin Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            This is an automated notification from Talbiyah.ai
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Talbiyah.ai <contact@talbiyah.ai>",
        to: [ADMIN_EMAIL],
        subject: `💡 New Suggestion: ${suggestion.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email:", error);
      // Don't fail the request, just log it
      return new Response(
        JSON.stringify({ success: true, message: "Email failed but suggestion saved" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Suggestion notification email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in notify-suggestion:", error);
    // Don't fail - the suggestion is already saved
    return new Response(
      JSON.stringify({ success: true, message: "Email notification failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
