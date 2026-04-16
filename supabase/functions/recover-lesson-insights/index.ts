// Recover failed lesson recordings:
// 1. Pull audio from 100ms intermediate bucket via API
// 2. Transcribe via ElevenLabs Scribe
// 3. Call generate-lesson-insights to create study notes

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

  console.log("Downloading audio from 100ms intermediate bucket...");
  const audioResp = await fetch(audioUrl);
  if (!audioResp.ok) throw new Error(`Failed to fetch audio: ${audioResp.status}`);
  const audioBlob = await audioResp.blob();
  console.log(`Downloaded ${audioBlob.size} bytes`);

  const formData = new FormData();
  formData.append("file", audioBlob, "lesson.mp4");
  formData.append("model_id", "scribe_v1");

  console.log("Sending to ElevenLabs Scribe...");
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

async function recoverLesson(lesson_id: string): Promise<void> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = await getHMSManagementToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const { data: lesson, error: lessonErr } = await supabase
    .from("lessons")
    .select("id, 100ms_room_id, scheduled_time, duration_minutes, learner_id, teacher_id, subject_id")
    .eq("id", lesson_id)
    .single();
  if (lessonErr || !lesson) throw new Error(`Lesson not found: ${lessonErr?.message}`);
  if (!lesson["100ms_room_id"]) throw new Error("Lesson has no room_id");

  const { data: subject } = await supabase.from("subjects").select("name").eq("id", lesson.subject_id).single();
  const { data: learner } = await supabase.from("learners").select("name").eq("id", lesson.learner_id).single();
  const { data: teacher } = await supabase.from("teacher_profiles").select("user_id, profiles(full_name)").eq("id", lesson.teacher_id).single();

  console.log("[recover] Lesson:", lesson.id, subject?.name);

  const sessResp = await fetch(`https://api.100ms.live/v2/sessions?room_id=${lesson["100ms_room_id"]}`, { headers });
  if (!sessResp.ok) throw new Error(`Failed to get sessions: ${await sessResp.text()}`);
  const sessions = await sessResp.json();
  if (!sessions.data?.length) throw new Error("No sessions found for this room");

  let transcript = "";
  for (const session of sessions.data) {
    const recsResp = await fetch(`https://api.100ms.live/v2/recordings?session_id=${session.id}`, { headers });
    if (!recsResp.ok) continue;
    const recs = await recsResp.json();

    for (const rec of recs.data || []) {
      const recDetailResp = await fetch(`https://api.100ms.live/v2/recordings/${rec.id}`, { headers });
      if (!recDetailResp.ok) continue;
      const recDetail = await recDetailResp.json();

      for (const asset of recDetail.recording_assets || []) {
        if (asset.status === 'completed' && asset.type === 'room-composite' && asset.size > 0) {
          const urlResp = await fetch(`https://api.100ms.live/v2/recording-assets/${asset.id}/presigned-url`, { headers });
          if (!urlResp.ok) continue;
          const urlData = await urlResp.json();
          if (urlData.url) {
            console.log(`[recover] Found audio asset: ${asset.id}, size: ${asset.size}`);
            const text = await transcribeWithElevenLabs(urlData.url);
            if (text && text.length > 100) {
              transcript = text;
              break;
            }
          }
        }
      }
      if (transcript) break;
    }
    if (transcript) break;
  }

  if (!transcript) throw new Error("No audio recording found or transcription failed");
  console.log(`[recover] Transcribed ${transcript.length} characters`);

  const teacherName = (teacher?.profiles as any)?.full_name || "Teacher";
  const studentName = learner?.name || "Student";
  const subjectName = subject?.name || "Lesson";

  const metadata: any = {
    teacher_name: teacherName,
    student_names: [studentName],
    lesson_date: new Date(lesson.scheduled_time).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }),
    duration_minutes: lesson.duration_minutes,
  };

  const insightResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-lesson-insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      lesson_id: lesson.id,
      transcript,
      subject: subjectName,
      metadata,
    }),
  });

  if (!insightResp.ok) {
    throw new Error(`generate-lesson-insights failed: ${await insightResp.text()}`);
  }

  const insightResult = await insightResp.json();
  console.log(`[recover] SUCCESS lesson=${lesson_id} insight=${insightResult.insight_id}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { lesson_id } = await req.json();
    if (!lesson_id) {
      return new Response(JSON.stringify({ error: "lesson_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Run recovery in background so we don't hit edge function timeout
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Runtime
    EdgeRuntime.waitUntil(recoverLesson(lesson_id).catch(e => console.error("[recover] FAILED:", lesson_id, e.message)));

    return new Response(JSON.stringify({
      success: true,
      lesson_id,
      message: "Recovery started in background. Check lesson_insights table in 3-5 minutes.",
    }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
