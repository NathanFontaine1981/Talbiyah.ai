import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RecordingWebhookPayload {
  room_id: string;
  session_id: string;
  recording_id: string;
  recording_url: string;
  recording_size?: number;
  duration?: number;
  transcript_url?: string;
  metadata?: {
    lesson_id?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Handle GET requests (for 100ms webhook verification)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", message: "Webhook endpoint is ready" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const webhookData: RecordingWebhookPayload = await req.json();
    console.log("Received recording webhook:", webhookData);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find lesson by 100ms room_id
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes")
      .eq("100ms_room_id", webhookData.room_id)
      .single();

    if (lessonError || !lesson) {
      console.error("Lesson not found for room_id:", webhookData.room_id);
      // Return 200 OK even if lesson not found (for webhook verification tests)
      return new Response(
        JSON.stringify({
          success: true,
          message: "Webhook received but lesson not found (this is OK for test webhooks)"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create recording record
    const { data: recording, error: recordingError } = await supabase
      .from("lesson_recordings")
      .insert({
        lesson_id: lesson.id,
        "100ms_recording_id": webhookData.recording_id,
        "100ms_room_id": webhookData.room_id,
        recording_url: webhookData.recording_url,
        recording_size: webhookData.recording_size,
        duration_seconds: webhookData.duration,
        transcript_url: webhookData.transcript_url,
        has_transcript: !!webhookData.transcript_url,
        status: "available",
      })
      .select()
      .single();

    if (recordingError) {
      console.error("Error creating recording record:", recordingError);
      return new Response(
        JSON.stringify({ error: "Failed to create recording record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Recording saved:", recording.id);

    // If transcript is available, trigger insight generation
    if (webhookData.transcript_url) {
      console.log("Transcript available, fetching and generating insights...");

      try {
        // Fetch transcript
        const transcriptResponse = await fetch(webhookData.transcript_url);
        const transcriptData = await transcriptResponse.json();

        // Extract text from transcript (100ms format may vary)
        const transcriptText = JSON.stringify(transcriptData);

        // Trigger insight generation (async, don't wait)
        fetch(`${supabaseUrl}/functions/v1/process-lesson-transcript`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            lesson_id: lesson.id,
            recording_id: recording.id,
            transcript_text: transcriptText,
            subject_id: lesson.subject_id,
            teacher_id: lesson.teacher_id,
            learner_id: lesson.learner_id,
          }),
        }).catch(err => console.error("Error triggering insight generation:", err));
      } catch (error) {
        console.error("Error fetching transcript:", error);
        // Continue anyway - insights can be generated later
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recording_id: recording.id,
        lesson_id: lesson.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error handling recording webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
