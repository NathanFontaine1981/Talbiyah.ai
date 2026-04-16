// Notify enrolled students when a course class goes live
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
    const { course_session_id, guest_code } = await req.json();
    if (!course_session_id) {
      return new Response(JSON.stringify({ error: "course_session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // Get session + course
    const { data: session } = await supabase
      .from("course_sessions")
      .select(`
        id, session_number, room_code_guest, group_session_id, live_notified_at,
        group_sessions!inner (id, name, slug, teacher_id, profiles:teacher_id(full_name))
      `)
      .eq("id", course_session_id)
      .single();
    if (!session) throw new Error("Session not found");

    // Don't double-notify
    if (session.live_notified_at) {
      return new Response(JSON.stringify({ success: true, skipped: "already_notified" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const gs: any = session.group_sessions;
    const teacherName = gs?.profiles?.full_name || "your teacher";
    const guestRoomCode = guest_code || session.room_code_guest;
    const joinUrl = `https://talbiyah.ai/course/${gs?.slug}/live/${session.session_number}`;

    // Get enrolled students with email_notifications enabled
    const { data: participants } = await supabase
      .from("group_session_participants")
      .select("student_id, profiles:student_id(full_name, email, email_notifications)")
      .eq("group_session_id", session.group_session_id);

    if (!participants?.length) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "no_participants" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const eligible = participants.filter((p: any) => p.profiles?.email && p.profiles?.email_notifications !== false);
    let notified = 0;

    for (const p of eligible) {
      const prof: any = p.profiles;
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Talbiyah.ai <contact@talbiyah.ai>",
            to: [prof.email],
            subject: `🔴 Live now: ${gs.name} Session ${session.session_number}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🔴 Class is Live</h1>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="font-size: 16px; color: #374151;">Assalamu alaikum ${prof.full_name?.split(" ")[0] || ""},</p>
                  <p style="font-size: 16px; color: #374151;"><strong>${gs.name}</strong> Session ${session.session_number} has just started with ${teacherName}.</p>
                  <a href="${joinUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0;">Join Class Now</a>
                  ${guestRoomCode ? `<p style="font-size: 13px; color: #6b7280;">Room code: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${guestRoomCode}</code></p>` : ""}
                  <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Study notes will be emailed to you after class.</p>
                </div>
              </div>
            `,
          }),
        });
        if (r.ok) notified++;
        else console.error(`Email to ${prof.email} failed:`, await r.text());
      } catch (e) {
        console.error(`Email error for ${prof.email}:`, e);
      }
    }

    // Mark as notified
    await supabase
      .from("course_sessions")
      .update({ live_notified_at: new Date().toISOString() })
      .eq("id", course_session_id);

    return new Response(JSON.stringify({ success: true, notified, total: eligible.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("notify-class-live error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
