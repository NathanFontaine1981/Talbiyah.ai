// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotifyRequest {
  course_insight_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { course_insight_id }: NotifyRequest = await req.json();

    if (!course_insight_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: course_insight_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the insight with course and session details
    const { data: insight, error: insightError } = await supabase
      .from("course_insights")
      .select(`
        id, title, summary, group_session_id,
        course_sessions!inner (session_number, title, session_date),
        group_sessions!inner (
          name, slug, is_public,
          teacher:profiles!group_sessions_teacher_id_fkey (full_name)
        )
      `)
      .eq("id", course_insight_id)
      .single();

    if (insightError || !insight) {
      console.error("Error fetching insight:", insightError);
      return new Response(
        JSON.stringify({ error: "Insight not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const course = insight.group_sessions as any;
    const session = insight.course_sessions as any;
    const teacherName = course.teacher?.full_name || "Teacher";
    const courseName = course.name;
    const slug = course.slug;
    const sessionNumber = session.session_number;

    // Fetch enrolled students with email preferences
    const { data: participants, error: participantsError } = await supabase
      .from("group_session_participants")
      .select(`
        student_id,
        profiles!inner (id, email, full_name, email_notifications)
      `)
      .eq("group_session_id", insight.group_session_id);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch enrolled students" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to users with email enabled
    const eligibleUsers =
      participants?.filter((p: any) => {
        const profile = p.profiles;
        return (
          profile?.email &&
          (profile.email_notifications === true ||
            profile.email_notifications === null)
        );
      }) || [];

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (eligibleUsers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          email_count: 0,
          message: "No enrolled students with email notifications enabled",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending study notes email to ${eligibleUsers.length} enrolled students`);

    const sessionDate = session.session_date
      ? new Date(session.session_date).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    // Extract key themes from summary for email preview
    const summaryPreview = insight.summary || "New study notes are ready for review.";

    // Build the insights URL
    const insightsUrl = slug
      ? `https://talbiyah.ai/course/${slug}/session/${sessionNumber}`
      : `https://talbiyah.ai/course`;

    const sessionTitle = session.title || insight.title || `Session ${sessionNumber}`;
    const emailSubject = `Study Notes Ready: ${courseName} - Session ${sessionNumber}: ${sessionTitle}`;

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0;">Talbiyah Study Notes</h1>
          <p style="color: #6b7280; margin: 5px 0;">${courseName}</p>
        </div>

        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 22px;">Session ${sessionNumber}: ${sessionTitle}</h2>
          <p style="color: #1d4ed8; margin: 5px 0;"><strong>Teacher:</strong> ${teacherName}</p>
          ${sessionDate ? `<p style="color: #1d4ed8; margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>` : ""}
        </div>

        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #166534; margin: 0 0 10px 0;">Session Summary</h3>
          <p style="color: #15803d; margin: 0; line-height: 1.6;">${summaryPreview}</p>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0;">What's Inside</h3>
          <ul style="color: #b45309; margin: 8px 0; padding-left: 20px; line-height: 1.8;">
            <li>Key themes and teacher's explanations</li>
            <li>Qur'anic verses with Arabic and translation</li>
            <li>Vocabulary, hadith references, and stories</li>
            <li>Mini quiz to test your understanding</li>
            <li>Action points and preparation for next session</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${insightsUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View Full Study Notes
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            These AI-generated study notes capture the key teachings from each session to help you revise and reflect.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9ca3af; font-size: 11px;">
            Talbiyah - Your Path to Islamic Knowledge<br>
            <a href="https://talbiyah.ai" style="color: #059669;">talbiyah.ai</a>
          </p>
          <p style="color: #d1d5db; font-size: 10px; margin-top: 10px;">
            You're receiving this because you're enrolled in ${courseName}.<br>
            <a href="https://talbiyah.ai/settings" style="color: #9ca3af;">Manage email preferences</a>
          </p>
        </div>
      </div>
    `;

    const emailAddresses = eligibleUsers.map(
      (u: any) => u.profiles.email as string
    );
    let totalSent = 0;

    // Send in batches of 50
    const batches: string[][] = [];
    for (let i = 0; i < emailAddresses.length; i += 50) {
      batches.push(emailAddresses.slice(i, i + 50));
    }

    for (const batch of batches) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Talbiyah <updates@talbiyah.ai>",
          bcc: batch,
          to: "updates@talbiyah.ai",
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (emailResponse.ok) {
        console.log(`Email batch sent to ${batch.length} students`);
        totalSent += batch.length;
      } else {
        const emailError = await emailResponse.text();
        console.error("Email batch failed:", emailError);
      }
    }

    // Update insight with notification status
    await supabase
      .from("course_insights")
      .update({
        notifications_sent: true,
        notification_count: totalSent,
      })
      .eq("id", course_insight_id);

    console.log(`Notifications complete: ${totalSent} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        email_count: totalSent,
        total_enrolled: participants?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-course-insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
