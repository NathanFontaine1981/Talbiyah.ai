// Synchronous test endpoint to debug transcription pipeline
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const logs: string[] = [];
  const log = (msg: string) => { logs.push(msg); console.log(msg); };

  try {
    const { audio_url, course_session_id } = await req.json();
    log(`[test] Starting: url=${audio_url?.slice(0, 60)}... session=${course_session_id}`);

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) return new Response(JSON.stringify({ error: "no key", logs }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    log(`[test] Have ElevenLabs key: ${ELEVENLABS_API_KEY.length} chars`);

    log("[test] Downloading...");
    const resp = await fetch(audio_url);
    if (!resp.ok) return new Response(JSON.stringify({ error: `download failed: ${resp.status}`, logs }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const blob = await resp.blob();
    log(`[test] Downloaded ${blob.size} bytes, type=${blob.type}`);

    log("[test] Sending to ElevenLabs...");
    const formData = new FormData();
    formData.append("file", blob, "test.m4a");
    formData.append("model_id", "scribe_v1");

    const scribeResp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: formData,
    });
    log(`[test] ElevenLabs status: ${scribeResp.status}`);
    const scribeText = await scribeResp.text();
    log(`[test] ElevenLabs response: ${scribeText.slice(0, 500)}`);

    if (!scribeResp.ok) {
      return new Response(JSON.stringify({ error: "elevenlabs_failed", status: scribeResp.status, response: scribeText, logs }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = JSON.parse(scribeText);
    const transcript = result.text || "";
    log(`[test] Transcript: ${transcript.length} chars`);
    log(`[test] Preview: ${transcript.slice(0, 200)}`);

    if (course_session_id && transcript.length > 20) {
      log("[test] Saving to course_session...");
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { error: updErr } = await supabase
        .from("course_sessions")
        .update({ transcript, transcript_source: "test", status: "transcript_added" })
        .eq("id", course_session_id);
      log(`[test] Save result: ${updErr?.message || 'OK'}`);

      log("[test] Generating course insights...");
      const insResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-course-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({ course_session_id }),
      });
      log(`[test] Insights response: ${insResp.status}`);
      const insText = await insResp.text();
      log(`[test] Insights body: ${insText.slice(0, 500)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      transcript_length: transcript.length,
      transcript_preview: transcript.slice(0, 300),
      logs,
    }, null, 2), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, stack: (e as Error).stack, logs }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
