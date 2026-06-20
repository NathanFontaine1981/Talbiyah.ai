// Student/parent (or teacher) reports that a lesson's insights haven't come through.
// We log the report (best-effort), email an admin alert, and auto-trigger recovery so
// the lesson may self-heal before anyone has to look at it.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const ADMIN_EMAIL = "contact@talbiyah.ai";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { lesson_id, learner_id, description } = await req.json();
    if (!lesson_id) {
      return new Response(JSON.stringify({ error: "lesson_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Identify the reporter from their JWT (best-effort)
    let reporterId: string | null = null;
    let reporterEmail: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader) {
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        reporterId = user?.id ?? null;
        reporterEmail = user?.email ?? null;
      } catch (_) { /* ignore - report still proceeds */ }
    }

    // Gather lesson context for the alert (best-effort)
    let subjectName = "Lesson";
    let teacherName = "Teacher";
    let studentName = "Student";
    let lessonDate = "";
    try {
      const { data: lesson } = await admin
        .from("lessons")
        .select("scheduled_time, subject_id, learner_id, teacher_id")
        .eq("id", lesson_id)
        .single();
      if (lesson) {
        if (lesson.scheduled_time) {
          lessonDate = new Date(lesson.scheduled_time).toLocaleString("en-GB", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          });
        }
        const [{ data: subj }, { data: learner }, { data: teacher }] = await Promise.all([
          admin.from("subjects").select("name").eq("id", lesson.subject_id).maybeSingle(),
          admin.from("learners").select("name").eq("id", lesson.learner_id ?? learner_id).maybeSingle(),
          admin.from("teacher_profiles").select("profiles(full_name)").eq("id", lesson.teacher_id).maybeSingle(),
        ]);
        subjectName = subj?.name || subjectName;
        studentName = (learner as any)?.name || studentName;
        teacherName = (teacher as any)?.profiles?.full_name || teacherName;
      }
    } catch (e) {
      console.error("[report-insight-problem] context lookup error:", (e as Error).message);
    }

    // Log the report (best-effort: table may not exist yet)
    try {
      await admin.from("insight_issue_reports").insert({
        lesson_id,
        learner_id: learner_id ?? null,
        reported_by: reporterId,
        reporter_email: reporterEmail,
        description: description ?? null,
        recovery_triggered: true,
      });
    } catch (e) {
      console.error("[report-insight-problem] log insert skipped:", (e as Error).message);
    }

    // Auto-trigger recovery (fire-and-forget) so the lesson may self-heal
    try {
      await fetch(`${supabaseUrl}/functions/v1/recover-lesson-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ lesson_id }),
      });
    } catch (e) {
      console.error("[report-insight-problem] recovery trigger error:", (e as Error).message);
    }

    // Email an admin alert (reassuring tone — no alarming wording)
    const insightsUrl = `https://talbiyah.ai/student/insights/${lesson_id}`;
    const html = `
      <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); border-radius: 16px; padding: 28px; text-align: center;">
          <div style="font-size: 44px;">🛎️</div>
          <h1 style="color:#fff; margin: 8px 0 0; font-size: 22px;">A student is waiting on lesson insights</h1>
        </div>
        <div style="padding: 24px 8px; color: #0f172a;">
          <p style="font-size:15px; color:#334155;">${esc(studentName)} reported that the insights for their lesson haven't come through yet. We've automatically started a recovery attempt — it may resolve on its own within a few minutes. Details below in case it needs a manual look.</p>
          <table style="width:100%; border-collapse:collapse; font-size:14px; margin:16px 0;">
            <tr><td style="padding:6px 0; color:#64748b;">Subject</td><td style="padding:6px 0; font-weight:600;">${esc(subjectName)}</td></tr>
            <tr><td style="padding:6px 0; color:#64748b;">Lesson date</td><td style="padding:6px 0; font-weight:600;">${esc(lessonDate || "—")}</td></tr>
            <tr><td style="padding:6px 0; color:#64748b;">Teacher</td><td style="padding:6px 0; font-weight:600;">${esc(teacherName)}</td></tr>
            <tr><td style="padding:6px 0; color:#64748b;">Student</td><td style="padding:6px 0; font-weight:600;">${esc(studentName)}</td></tr>
            <tr><td style="padding:6px 0; color:#64748b;">Reported by</td><td style="padding:6px 0; font-weight:600;">${esc(reporterEmail || "unknown")}</td></tr>
            <tr><td style="padding:6px 0; color:#64748b;">Lesson ID</td><td style="padding:6px 0; font-family:monospace; font-size:12px;">${esc(lesson_id)}</td></tr>
          </table>
          ${description ? `<div style="background:#f1f5f9; border-radius:8px; padding:12px 14px; font-size:14px; color:#334155;"><strong>Their note:</strong><br>${esc(description)}</div>` : ""}
          <p style="margin-top:18px;"><a href="${insightsUrl}" style="display:inline-block; background:#059669; color:#fff; text-decoration:none; padding:10px 18px; border-radius:10px; font-weight:600; font-size:14px;">Open lesson insights</a></p>
          <p style="color:#94a3b8; font-size:12px; margin-top:18px;">Auto-recovery has been triggered. Full detail in Supabase Edge Function logs (recover-lesson-insights).</p>
        </div>
      </div>`;

    try {
      const emailResp = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          type: "custom",
          recipient_email: ADMIN_EMAIL,
          recipient_name: "Talbiyah Admin",
          subject: `🛎️ Insights awaited — ${subjectName} lesson${lessonDate ? ` (${lessonDate})` : ""}`,
          html,
        }),
      });
      if (!emailResp.ok) console.error("[report-insight-problem] admin email error:", await emailResp.text());
    } catch (e) {
      console.error("[report-insight-problem] admin email error:", (e as Error).message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Thanks — we've been notified and started recovering your insights.",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[report-insight-problem] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
