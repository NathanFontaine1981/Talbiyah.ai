// Send welcome email when a student enrols in a course
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { group_session_id, student_id } = await req.json();
    if (!group_session_id || !student_id) {
      return new Response(JSON.stringify({ error: "group_session_id and student_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // Get course details
    const { data: course } = await supabase
      .from("group_sessions")
      .select("name, slug, description, schedule_day, schedule_time, duration_minutes, location, delivery_mode, teacher_id, profiles:teacher_id(full_name)")
      .eq("id", group_session_id)
      .single();
    if (!course) throw new Error("Course not found");

    // Get student details
    const { data: student } = await supabase
      .from("profiles")
      .select("full_name, email, email_notifications")
      .eq("id", student_id)
      .single();
    if (!student?.email) throw new Error("Student email not found");

    // Respect email_notifications opt-out
    if (student.email_notifications === false) {
      return new Response(JSON.stringify({ success: true, skipped: "email_notifications_disabled" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find next upcoming session for this course
    const today = new Date().toISOString().split("T")[0];
    const { data: nextSession } = await supabase
      .from("course_sessions")
      .select("session_number, session_date")
      .eq("group_session_id", group_session_id)
      .gte("session_date", today)
      .order("session_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    const teacherName = (course.profiles as any)?.full_name || "your teacher";
    const courseUrl = `https://talbiyah.ai/course/${course.slug}`;
    const firstName = student.full_name?.split(" ")[0] || "";

    let nextSessionStr = "";
    if (nextSession?.session_date && course.schedule_time) {
      const dt = new Date(`${nextSession.session_date}T${course.schedule_time}`);
      nextSessionStr = dt.toLocaleString("en-GB", {
        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
      });
    }

    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Talbiyah.ai <contact@talbiyah.ai>",
        to: [student.email],
        subject: `Welcome to ${course.name}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #0d9488); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${course.name}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">You're enrolled. We're glad to have you.</p>
            </div>
            <div style="background: white; padding: 28px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #374151;">Assalamu alaikum ${firstName},</p>
              <p style="font-size: 16px; color: #374151;">${course.description || "You've successfully enrolled in this course."}</p>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px;">Course Details</h3>
                <p style="margin: 4px 0; color: #166534;"><strong>Teacher:</strong> ${teacherName}</p>
                <p style="margin: 4px 0; color: #166534;"><strong>Schedule:</strong> ${course.schedule_day}s at ${course.schedule_time?.slice(0, 5) || ""}</p>
                <p style="margin: 4px 0; color: #166534;"><strong>Duration:</strong> ${course.duration_minutes} minutes</p>
                ${course.location ? `<p style="margin: 4px 0; color: #166534;"><strong>Location:</strong> ${course.location} (${course.delivery_mode || "in_person"})</p>` : ""}
                ${nextSessionStr ? `<p style="margin: 12px 0 4px 0; color: #166534;"><strong>Next session:</strong> ${nextSessionStr}</p>` : ""}
              </div>

              <p style="font-size: 14px; color: #6b7280; margin: 16px 0;">You'll get a reminder email 24 hours and 1 hour before each session. After each class, study notes will be emailed to you automatically.</p>

              <a href="${courseUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">View Course</a>

              <p style="font-size: 12px; color: #9ca3af; margin-top: 28px; padding-top: 16px; border-top: 1px solid #f3f4f6;">You're receiving this because you enrolled in ${course.name}. Manage your email preferences in your account settings.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResp.ok) {
      const err = await emailResp.text();
      throw new Error(`Email send failed: ${err}`);
    }

    return new Response(JSON.stringify({ success: true, sent_to: student.email }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("send-enrollment-welcome error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
