// Transcribe audio from a URL using ElevenLabs Scribe
// Returns transcript text. Runs as background task for large files.

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
    const { audio_url, lesson_id, course_session_id } = await req.json();
    if (!audio_url) {
      return new Response(JSON.stringify({ error: "audio_url required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Run in background for large files
    // @ts-ignore
    EdgeRuntime.waitUntil((async () => {
      try {
        console.log("[transcribe-url] Downloading audio...");
        const audioResp = await fetch(audio_url);
        if (!audioResp.ok) { console.error("[transcribe-url] Download failed:", audioResp.status); return; }
        const audioBlob = await audioResp.blob();
        console.log(`[transcribe-url] Downloaded ${(audioBlob.size / 1024 / 1024).toFixed(1)}MB`);

        const formData = new FormData();
        formData.append("file", audioBlob, "lesson.mp4");
        formData.append("model_id", "scribe_v1");

        console.log("[transcribe-url] Sending to ElevenLabs...");
        const scribeResp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
          body: formData,
        });

        if (!scribeResp.ok) {
          console.error("[transcribe-url] ElevenLabs error:", scribeResp.status, await scribeResp.text());
          return;
        }

        const result = await scribeResp.json();
        const transcript = result.text || "";
        console.log(`[transcribe-url] Transcribed ${transcript.length} chars`);

        // Course session flow
        if (course_session_id && transcript.length > 20) {
          const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

          // Save transcript
          await supabase
            .from("course_sessions")
            .update({
              transcript,
              transcript_source: "browser_recording",
              status: "transcript_added",
            })
            .eq("id", course_session_id);
          console.log(`[transcribe-url] Saved transcript for course_session ${course_session_id}`);

          // Generate course insights
          const insightResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-course-insights`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ course_session_id }),
          });

          if (insightResp.ok) {
            const r = await insightResp.json();
            console.log(`[transcribe-url] Course insights generated: ${r.insight_id}`);

            // Notify students
            if (r.insight_id) {
              await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-course-insights`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({ course_insight_id: r.insight_id }),
              }).catch(e => console.error("[transcribe-url] notify failed:", e));
            }
          } else {
            console.error("[transcribe-url] Course insight generation failed:", await insightResp.text());
          }
          return;
        }

        // Lesson flow (original)
        if (lesson_id && transcript.length > 100) {
          // Save transcript to lesson_insights and trigger insight generation
          const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

          // Get lesson metadata
          const { data: lesson } = await supabase.from("lessons").select("scheduled_time, duration_minutes, learner_id, teacher_id, subject_id").eq("id", lesson_id).single();
          if (!lesson) { console.error("[transcribe-url] Lesson not found"); return; }

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

          console.log("[transcribe-url] Generating insights...");
          const insightResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-lesson-insights`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              lesson_id,
              transcript,
              subject: subject?.name || "Lesson",
              metadata,
            }),
          });

          if (insightResp.ok) {
            const r = await insightResp.json();
            console.log(`[transcribe-url] SUCCESS: insight=${r.insight_id}`);
          } else {
            console.error("[transcribe-url] Insight generation failed:", await insightResp.text());
          }
        }
      } catch (e) {
        console.error("[transcribe-url] Background error:", (e as Error).message, (e as Error).stack);
      }
    })());

    return new Response(JSON.stringify({
      success: true,
      message: "Transcription and insight generation started in background. Check in 5 minutes.",
    }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
