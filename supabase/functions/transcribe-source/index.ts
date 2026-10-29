// Transcribe audio/video directly from a URL via ElevenLabs Scribe, using the
// `source_url` input so ElevenLabs fetches the file server-side. This avoids the
// edge-function memory limit that makes transcribe-url crash ("Memory limit
// exceeded") on long sessions whose recordings are 200MB+.
//
// SCOPE: this function ONLY transcribes and saves the transcript to
// course_sessions. It deliberately does NOT generate study notes and does NOT
// notify students — so it can be used to recover a session without emailing
// anyone. Note generation stays a separate, explicit step.

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
    const { audio_url, course_session_id } = await req.json();
    if (!audio_url || !course_session_id) {
      return new Response(JSON.stringify({ error: "audio_url and course_session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Background task: ElevenLabs downloads from source_url itself (no buffering here).
    // @ts-ignore
    EdgeRuntime.waitUntil((async () => {
      try {
        const form = new FormData();
        form.append("model_id", "scribe_v1");
        // Current param is source_url; cloud_storage_url is the deprecated alias.
        form.append("source_url", audio_url);

        console.log(`[transcribe-source] Sending source_url to ElevenLabs for session ${course_session_id}...`);
        const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
          body: form,
        });

        const bodyText = await resp.text();
        if (!resp.ok) {
          console.error(`[transcribe-source] ElevenLabs error ${resp.status}: ${bodyText.slice(0, 500)}`);
          return;
        }

        let transcript = "";
        try { transcript = (JSON.parse(bodyText).text) || ""; } catch { transcript = ""; }
        console.log(`[transcribe-source] Transcribed ${transcript.length} chars`);

        if (transcript.length < 20) {
          console.error("[transcribe-source] Transcript too short; not saving.");
          return;
        }

        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { error: updErr } = await supabase
          .from("course_sessions")
          .update({ transcript, transcript_source: "upload", status: "transcript_added" })
          .eq("id", course_session_id);
        if (updErr) { console.error(`[transcribe-source] Save failed: ${updErr.message}`); return; }
        console.log(`[transcribe-source] Saved transcript (${transcript.length} chars) for ${course_session_id}`);
      } catch (e) {
        console.error("[transcribe-source] Background error:", (e as Error).message);
      }
    })());

    return new Response(JSON.stringify({
      success: true,
      message: "Transcription started via source_url. Transcript will be saved in a few minutes (no notes generated, no emails sent).",
    }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
