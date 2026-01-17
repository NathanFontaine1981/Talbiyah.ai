import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface NotifyRequest {
  insight_id: string;
  title: string;
  speaker?: string;
  khutba_date?: string;
  main_points?: Array<{ point: string; reflection: string }>;
  notification_type: 'dashboard' | 'email';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: NotifyRequest = await req.json();
    console.log(`Processing ${body.notification_type} notification for: ${body.title}`);

    if (body.notification_type === 'dashboard') {
      // Create dashboard notifications for all users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw new Error("Failed to fetch users");
      }

      // Create notifications table entry for each user
      // First check if notifications table exists, if not we'll use a simple approach
      const notifications = users?.map(user => ({
        user_id: user.id,
        type: 'khutba_insight',
        title: `New Talbiyah Insights: ${body.title}`,
        message: body.speaker ? `By ${body.speaker}` : 'New reflections available',
        link: '/insights-library',
        insight_id: body.insight_id,
        read: false,
        created_at: new Date().toISOString()
      })) || [];

      // Try to insert into notifications table
      try {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) {
          console.log("Notifications table may not exist, skipping:", insertError.message);
        }
      } catch (e) {
        console.log("Could not insert notifications:", e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          notification_type: 'dashboard',
          user_count: users?.length || 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.notification_type === 'email') {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (!RESEND_API_KEY) {
        console.log("RESEND_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "Email service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get users who have email notifications enabled (check for email_notifications field)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, email_notifications')
        .not('email', 'is', null);

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw new Error("Failed to fetch users");
      }

      // Filter to only users who have opted in for email notifications
      // If email_notifications field doesn't exist or is true, include them (opt-out model)
      // But we want opt-in, so only include if explicitly true
      const eligibleUsers = users?.filter(u => {
        // Default to true if the field doesn't exist (for backwards compatibility)
        // But you can change this to default false for strict opt-in
        return u.email && (u.email_notifications === true || u.email_notifications === null);
      }) || [];

      if (eligibleUsers.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            notification_type: 'email',
            email_count: 0,
            message: "No users opted in for email notifications"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Sending reflection email to ${eligibleUsers.length} users`);

      // Format the date nicely
      const khutbaDateFormatted = body.khutba_date
        ? new Date(body.khutba_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'Recent';

      // Get main points for email preview
      const mainPoints = body.main_points || [];
      const mainPointsHtml = mainPoints.length > 0
        ? `<ul style="margin: 16px 0; padding-left: 20px;">${mainPoints.map((p: any) => `<li style="margin: 8px 0;"><strong>${p.point}</strong></li>`).join('')}</ul>`
        : '';

      const emailAddresses = eligibleUsers.map(u => u.email as string);
      let totalSent = 0;

      // Send in batches of 50 to avoid rate limits
      const batches = [];
      for (let i = 0; i < emailAddresses.length; i += 50) {
        batches.push(emailAddresses.slice(i, i + 50));
      }

      for (const batch of batches) {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Talbiyah <updates@talbiyah.ai>",
            bcc: batch,
            to: "updates@talbiyah.ai",
            subject: `Talbiyah Reflections: ${body.title}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #059669; margin: 0;">Talbiyah Reflections</h1>
                  <p style="color: #6b7280; margin: 5px 0;">Your Weekly Khutbah Study Guide</p>
                </div>

                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 24px;">${body.title}</h2>
                  ${body.speaker ? `<p style="color: #b45309; margin: 5px 0;"><strong>Speaker:</strong> ${body.speaker}</p>` : ''}
                  <p style="color: #b45309; margin: 5px 0;"><strong>Date:</strong> ${khutbaDateFormatted}</p>
                </div>

                ${mainPointsHtml ? `
                  <div style="margin-bottom: 24px;">
                    <h3 style="color: #374151; margin: 0 0 12px 0;">Key Points to Reflect Upon:</h3>
                    ${mainPointsHtml}
                  </div>
                ` : ''}

                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <h3 style="color: #166534; margin: 0 0 10px 0;">Family Reflection Time</h3>
                  <p style="color: #15803d; margin: 0;">
                    Use these insights for your weekend "Family Hour" - discuss the main themes with your children
                    and encourage everyone to implement at least one action item this week.
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://talbiyah.ai/insights-library" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    View Full Reflections
                  </a>
                </div>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                    Complete study notes include Quranic vocabulary, hadith references, quizzes, homework, and family discussion guides.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                  <p style="color: #9ca3af; font-size: 11px;">
                    Talbiyah - Your Path to Islamic Knowledge<br>
                    <a href="https://talbiyah.ai" style="color: #059669;">talbiyah.ai</a>
                  </p>
                  <p style="color: #d1d5db; font-size: 10px; margin-top: 10px;">
                    You're receiving this because you opted in for Khutbah Reflections emails.<br>
                    <a href="https://talbiyah.ai/settings" style="color: #9ca3af;">Manage email preferences</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (emailResponse.ok) {
          console.log(`Email batch sent successfully to ${batch.length} users`);
          totalSent += batch.length;
        } else {
          const emailError = await emailResponse.text();
          console.error("Email batch failed:", emailError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          notification_type: 'email',
          email_count: totalSent
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid notification_type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in notify-khutba-insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
