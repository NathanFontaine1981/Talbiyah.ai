// Send reminder emails to enrolled students before course sessions
// Runs every 30 min via cron - sends:
//   - 24h reminder (day before)
//   - 1h reminder (just before)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ReminderType {
  windowStart: number; // minutes from now
  windowEnd: number;
  flag: '24h_reminder_sent' | '1h_reminder_sent';
  label: string;
}

const REMINDERS: ReminderType[] = [
  { windowStart: 23 * 60, windowEnd: 25 * 60, flag: '24h_reminder_sent', label: '24 hours' },
  { windowStart: 30, windowEnd: 90, flag: '1h_reminder_sent', label: '1 hour' },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const results = { reminders_sent: 0, errors: 0, skipped: 0 };

  try {
    for (const reminder of REMINDERS) {
      const now = Date.now();
      const windowStart = new Date(now + reminder.windowStart * 60000);
      const windowEnd = new Date(now + reminder.windowEnd * 60000);

      // Find course sessions in this reminder window where this reminder hasn't been sent
      const { data: sessions } = await supabase
        .from("course_sessions")
        .select(`
          id, session_number, session_date, room_code_guest, group_session_id,
          group_sessions!inner (id, name, slug, schedule_time, duration_minutes, teacher_id, profiles:teacher_id(full_name))
        `)
        .gte("session_date", windowStart.toISOString().split('T')[0])
        .lte("session_date", windowEnd.toISOString().split('T')[0])
        .is(reminder.flag, null);

      if (!sessions?.length) continue;

      for (const session of sessions) {
        const gs: any = session.group_sessions;
        if (!gs?.schedule_time) continue;

        // Compute exact session start datetime
        const sessionStart = new Date(`${session.session_date}T${gs.schedule_time}`);
        const minutesUntil = (sessionStart.getTime() - now) / 60000;

        // Make sure it's actually in our window
        if (minutesUntil < reminder.windowStart || minutesUntil > reminder.windowEnd) continue;

        // Get enrolled students with email_notifications enabled
        const { data: participants } = await supabase
          .from("group_session_participants")
          .select("student_id, profiles:student_id(full_name, email, email_notifications)")
          .eq("group_session_id", session.group_session_id);

        if (!participants?.length) {
          results.skipped++;
          continue;
        }

        const eligible = participants.filter((p: any) => {
          const prof = p.profiles;
          return prof?.email && prof?.email_notifications !== false;
        });

        if (!eligible.length) {
          results.skipped++;
          continue;
        }

        const teacherName = gs.profiles?.full_name || "Teacher";
        const sessionTimeStr = sessionStart.toLocaleString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
        });

        const courseUrl = `https://talbiyah.ai/course/${gs.slug}`;

        // Send to each enrolled student
        for (const p of eligible) {
          const prof: any = p.profiles;
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Talbiyah.ai <contact@talbiyah.ai>",
                to: [prof.email],
                subject: `Reminder: ${gs.name} starts in ${reminder.label}`,
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981, #0d9488); padding: 24px; border-radius: 12px 12px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">Class starts in ${reminder.label}</h1>
                    </div>
                    <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                      <p style="font-size: 16px; color: #374151;">Assalamu alaikum ${prof.full_name?.split(' ')[0] || ''},</p>
                      <p style="font-size: 16px; color: #374151;">A friendly reminder that <strong>${gs.name}</strong> Session ${session.session_number} is coming up.</p>
                      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0; color: #166534;"><strong>When:</strong> ${sessionTimeStr}</p>
                        <p style="margin: 0 0 8px 0; color: #166534;"><strong>Teacher:</strong> ${teacherName}</p>
                        <p style="margin: 0; color: #166534;"><strong>Duration:</strong> ${gs.duration_minutes} minutes</p>
                      </div>
                      <a href="${courseUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Course</a>
                      <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">You're receiving this because you're enrolled in ${gs.name}.</p>
                    </div>
                  </div>
                `,
              }),
            });
            results.reminders_sent++;
          } catch (e) {
            console.error(`Email failed for ${prof.email}:`, e);
            results.errors++;
          }
        }

        // Mark this reminder as sent for this session
        await supabase
          .from("course_sessions")
          .update({ [reminder.flag]: new Date().toISOString() })
          .eq("id", session.id);

        console.log(`Sent ${reminder.label} reminder to ${eligible.length} students for ${gs.name} session ${session.session_number}`);
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("send-course-reminders error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message, ...results }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
