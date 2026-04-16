// Auto-recovery cron: runs every 30 minutes
// Finds completed lessons from last 48h with empty/stub insights
// Recovers audio from 100ms intermediate bucket and generates insights
// This catches lessons where the recording webhook failed

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function transcribeWithElevenLabs(audioUrl: string): Promise<string | null> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

  console.log("[sweep] Downloading audio...");
  const audioResp = await fetch(audioUrl);
  if (!audioResp.ok) throw new Error(`Failed to fetch audio: ${audioResp.status}`);
  const audioBlob = await audioResp.blob();
  console.log(`[sweep] Downloaded ${(audioBlob.size / 1024 / 1024).toFixed(1)}MB`);

  const formData = new FormData();
  formData.append("file", audioBlob, "lesson.mp4");
  formData.append("model_id", "scribe_v1");

  console.log("[sweep] Sending to ElevenLabs Scribe...");
  const scribeResp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
    body: formData,
  });

  if (!scribeResp.ok) {
    const error = await scribeResp.text();
    throw new Error(`ElevenLabs error: ${scribeResp.status} ${error}`);
  }

  const result = await scribeResp.json();
  return result.text || null;
}

async function findRecoverableAudio(roomId: string, hmsHeaders: Record<string, string>): Promise<string | null> {
  // Find sessions for this room
  const sessResp = await fetch(`https://api.100ms.live/v2/sessions?room_id=${roomId}`, { headers: hmsHeaders });
  if (!sessResp.ok) return null;
  const sessions = await sessResp.json();
  if (!sessions.data?.length) return null;

  for (const session of sessions.data) {
    const recsResp = await fetch(`https://api.100ms.live/v2/recordings?session_id=${session.id}`, { headers: hmsHeaders });
    if (!recsResp.ok) continue;
    const recs = await recsResp.json();

    for (const rec of recs.data || []) {
      const recResp = await fetch(`https://api.100ms.live/v2/recordings/${rec.id}`, { headers: hmsHeaders });
      if (!recResp.ok) continue;
      const recDetail = await recResp.json();

      for (const asset of recDetail.recording_assets || []) {
        if (asset.status === 'completed' && asset.type === 'room-composite' && asset.size > 0) {
          const urlResp = await fetch(`https://api.100ms.live/v2/recording-assets/${asset.id}/presigned-url`, { headers: hmsHeaders });
          if (!urlResp.ok) continue;
          const urlData = await urlResp.json();
          if (urlData.url) return urlData.url;
        }
      }
    }
  }
  return null;
}

async function recoverSingleLesson(
  lessonId: string,
  roomId: string,
  supabase: ReturnType<typeof createClient>,
  hmsHeaders: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[sweep] Recovering lesson ${lessonId}...`);

    // Find audio
    const audioUrl = await findRecoverableAudio(roomId, hmsHeaders);
    if (!audioUrl) return { success: false, error: "no_audio_available" };

    // Transcribe
    const transcript = await transcribeWithElevenLabs(audioUrl);
    if (!transcript || transcript.length < 100) return { success: false, error: "transcription_failed" };
    console.log(`[sweep] Transcribed ${transcript.length} chars`);

    // Get lesson metadata
    const { data: lesson } = await supabase
      .from("lessons")
      .select("scheduled_time, duration_minutes, learner_id, teacher_id, subject_id")
      .eq("id", lessonId).single();
    if (!lesson) return { success: false, error: "lesson_not_found" };

    const { data: subject } = await supabase.from("subjects").select("name").eq("id", lesson.subject_id).single();
    const { data: learner } = await supabase.from("learners").select("name").eq("id", lesson.learner_id).single();
    const { data: teacher } = await supabase.from("teacher_profiles").select("profiles(full_name)").eq("id", lesson.teacher_id).single();

    const metadata = {
      teacher_name: (teacher?.profiles as any)?.full_name || "Teacher",
      student_names: [learner?.name || "Student"],
      lesson_date: new Date(lesson.scheduled_time).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }),
      duration_minutes: lesson.duration_minutes,
    };

    // Generate insights
    const insightResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-lesson-insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        lesson_id: lessonId,
        transcript,
        subject: subject?.name || "Lesson",
        metadata,
      }),
    });

    if (!insightResp.ok) {
      return { success: false, error: `insight_generation_failed: ${await insightResp.text()}` };
    }

    const result = await insightResp.json();
    console.log(`[sweep] SUCCESS: lesson=${lessonId} insight=${result.insight_id}`);
    return { success: true };
  } catch (e) {
    console.error(`[sweep] ERROR recovering ${lessonId}:`, (e as Error).message);
    return { success: false, error: (e as Error).message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const token = await getHMSManagementToken();
    const hmsHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // Find lessons completed in last 48h with empty insights
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: completedLessons } = await supabase
      .from("lessons")
      .select("id, 100ms_room_id, scheduled_time, subjects(name)")
      .eq("status", "completed")
      .gte("scheduled_time", cutoff)
      .not("100ms_room_id", "is", null)
      .order("scheduled_time", { ascending: false });

    if (!completedLessons?.length) {
      return new Response(JSON.stringify({ message: "No completed lessons in last 48h" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check which have empty/stub insights
    const needsRecovery: typeof completedLessons = [];

    for (const lesson of completedLessons) {
      const { data: insights } = await supabase
        .from("lesson_insights")
        .select("id, ai_model, detailed_insights")
        .eq("lesson_id", lesson.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      const latestInsight = insights?.[0];
      const content = (latestInsight?.detailed_insights as any)?.content || "";

      // Needs recovery if: no insight, or stub insight (auto_generated with no content)
      if (!latestInsight || (latestInsight.ai_model === "auto_generated" && content.length === 0)) {
        needsRecovery.push(lesson);
      }
    }

    console.log(`[sweep] Found ${needsRecovery.length} lessons needing recovery out of ${completedLessons.length} completed`);

    if (needsRecovery.length === 0) {
      return new Response(JSON.stringify({
        message: "All recent lessons have insights",
        total_checked: completedLessons.length,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Recover each lesson in background
    const recoveryPromises = needsRecovery.map(lesson =>
      recoverSingleLesson(lesson.id, lesson["100ms_room_id"]!, supabase, hmsHeaders)
    );

    // @ts-ignore
    EdgeRuntime.waitUntil(
      Promise.allSettled(recoveryPromises).then(async (results) => {
        const successes: string[] = [];
        const failures: string[] = [];

        results.forEach((r, i) => {
          const lesson = needsRecovery[i];
          const subjectName = (lesson.subjects as any)?.name || "Unknown";
          const date = new Date(lesson.scheduled_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
          if (r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value?.success) {
            successes.push(`${date} - ${subjectName}`);
          } else {
            const err = r.status === "fulfilled" ? (r as PromiseFulfilledResult<any>).value?.error : (r as PromiseRejectedResult).reason;
            failures.push(`${date} - ${subjectName}: ${err}`);
          }
        });

        console.log(`[sweep] Complete: ${successes.length} recovered, ${failures.length} failed`);

        // Send email alert for any failures OR successes (so Nathan knows what happened)
        if (failures.length > 0 || successes.length > 0) {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            try {
              const statusEmoji = failures.length > 0 ? "⚠️" : "✅";
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Talbiyah.ai <contact@talbiyah.ai>",
                  to: ["contact@talbiyah.ai"],
                  subject: `${statusEmoji} Talbiyah Insights: ${successes.length} recovered, ${failures.length} failed`,
                  html: `
                    <div style="font-family: sans-serif; max-width: 600px;">
                      <h2 style="color: #065f46;">Lesson Insights Recovery Report</h2>
                      ${failures.length > 0 ? `
                        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                          <strong style="color: #991b1b;">⚠️ ${failures.length} lesson(s) could not recover insights:</strong>
                          <ul>${failures.map(f => `<li>${f}</li>`).join("")}</ul>
                        </div>
                      ` : ""}
                      ${successes.length > 0 ? `
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                          <strong style="color: #166534;">✅ ${successes.length} lesson(s) recovered successfully:</strong>
                          <ul>${successes.map(s => `<li>${s}</li>`).join("")}</ul>
                        </div>
                      ` : ""}
                      <p style="color: #6b7280; font-size: 12px;">Sent by sweep-failed-recordings cron • Check Supabase Edge Function logs for details</p>
                    </div>
                  `,
                }),
              });
              console.log("[sweep] Alert email sent");
            } catch (emailErr) {
              console.error("[sweep] Failed to send alert email:", emailErr);
            }
          }
        }
      })
    );

    return new Response(JSON.stringify({
      message: `Recovery started for ${needsRecovery.length} lessons`,
      lessons: needsRecovery.map(l => ({
        id: l.id,
        date: l.scheduled_time,
        subject: (l.subjects as any)?.name,
      })),
    }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[sweep] Error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
