import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface NotifyRequest {
  recommendation_id: string;
  title: string;
  note?: string;
  recommended_by?: string;
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
    console.log(`Processing ${body.notification_type} notification for recommendation: ${body.title}`);

    if (body.notification_type === 'dashboard') {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw new Error("Failed to fetch users");
      }

      const notifications = users?.map(user => ({
        user_id: user.id,
        type: 'talbiyah_recommends',
        title: `Talbiyah Recommends: ${body.title}`,
        message: body.recommended_by ? `Picked by ${body.recommended_by}` : 'A new video worth watching',
        data: {
          link: '/talbiyah-recommends',
          recommendation_id: body.recommendation_id
        },
        read: false,
        created_at: new Date().toISOString()
      })) || [];

      try {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) {
          console.log("Could not insert notifications:", insertError.message);
        }
      } catch (e) {
        console.log("Could not insert notifications:", e);
      }

      await supabase
        .from('curated_recommendations')
        .update({ notified_dashboard_at: new Date().toISOString() })
        .eq('id', body.recommendation_id);

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

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, email_notifications')
        .not('email', 'is', null);

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw new Error("Failed to fetch users");
      }

      const eligibleUsers = users?.filter(u => {
        return u.email && (u.email_notifications === true || u.email_notifications === null);
      }) || [];

      if (eligibleUsers.length === 0) {
        await supabase
          .from('curated_recommendations')
          .update({ notified_email_at: new Date().toISOString(), notified_email_count: 0 })
          .eq('id', body.recommendation_id);

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

      console.log(`Sending recommendation email to ${eligibleUsers.length} users`);

      const emailAddresses = eligibleUsers.map(u => u.email as string);
      let totalSent = 0;

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
            subject: `Talbiyah Recommends: ${body.title}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #059669; margin: 0;">Talbiyah Recommends</h1>
                  <p style="color: #6b7280; margin: 5px 0;">Something worth watching</p>
                </div>

                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 24px;">${body.title}</h2>
                  ${body.recommended_by ? `<p style="color: #b45309; margin: 5px 0;"><strong>Picked by:</strong> ${body.recommended_by}</p>` : ''}
                  ${body.note ? `<p style="color: #92400e; margin: 10px 0 0 0;">${body.note}</p>` : ''}
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://talbiyah.ai/talbiyah-recommends" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Watch Now
                  </a>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                  <p style="color: #9ca3af; font-size: 11px;">
                    Talbiyah - Your Path to Islamic Knowledge<br>
                    <a href="https://talbiyah.ai" style="color: #059669;">talbiyah.ai</a>
                  </p>
                  <p style="color: #d1d5db; font-size: 10px; margin-top: 10px;">
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

      await supabase
        .from('curated_recommendations')
        .update({
          notified_email_at: new Date().toISOString(),
          notified_email_count: totalSent
        })
        .eq('id', body.recommendation_id);

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
    console.error("Error in notify-talbiyah-recommends:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
