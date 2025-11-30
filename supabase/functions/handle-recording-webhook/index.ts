import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 100ms webhook event types
interface HMS100msWebhook {
  version: string;
  id: string;
  timestamp: string;
  type: string;
  data: {
    room_id?: string;
    session_id?: string;
    recording_id?: string;
    recording_path?: string;
    recording_presigned_url?: string;
    size?: number;
    duration?: number;
    chat_recording_path?: string;
    chat_recording_presigned_url?: string;
    transcript_path?: string;
    transcript_presigned_url?: string;
    summary_path?: string;
    summary_presigned_url?: string;
  };
}

// Legacy format for backwards compatibility
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
    const rawData = await req.json();
    console.log("Received webhook payload:", JSON.stringify(rawData, null, 2));

    // Normalize webhook data - handle both 100ms format and legacy format
    let roomId: string;
    let recordingUrl: string | undefined;
    let recordingSize: number | undefined;
    let durationSeconds: number | undefined;
    let transcriptUrl: string | undefined;

    if (rawData.type && rawData.data) {
      // 100ms webhook format
      const hmsData = rawData as HMS100msWebhook;
      console.log("100ms webhook type:", hmsData.type);

      // Only process recording.success events
      if (hmsData.type !== "recording.success" && hmsData.type !== "beam.recording.success") {
        console.log("Ignoring non-recording event:", hmsData.type);
        return new Response(
          JSON.stringify({ success: true, message: "Event ignored" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      roomId = hmsData.data.room_id || "";
      recordingUrl = hmsData.data.recording_presigned_url;
      recordingSize = hmsData.data.size;
      durationSeconds = hmsData.data.duration;
      transcriptUrl = hmsData.data.transcript_presigned_url;
    } else {
      // Legacy format
      const legacyData = rawData as RecordingWebhookPayload;
      roomId = legacyData.room_id;
      recordingUrl = legacyData.recording_url;
      recordingSize = legacyData.recording_size;
      durationSeconds = legacyData.duration;
      transcriptUrl = legacyData.transcript_url;
    }

    if (!roomId) {
      console.error("No room_id in webhook data");
      return new Response(
        JSON.stringify({ error: "Missing room_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing recording for room:", roomId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find lesson by 100ms room_id
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes")
      .eq("100ms_room_id", roomId)
      .single();

    if (lessonError || !lesson) {
      console.error("Lesson not found for room_id:", roomId);
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

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create recording record
    console.log("Inserting recording with data:", {
      lesson_id: lesson.id,
      room_id: roomId,
      recording_url: recordingUrl?.substring(0, 50) + "...",
      recording_size: recordingSize,
      duration_seconds: durationSeconds,
      has_transcript: !!transcriptUrl,
      expires_at: expiresAt.toISOString(),
    });

    // Insert recording record
    const { data: recording, error: recordingError } = await supabase
      .from("lesson_recordings")
      .insert({
        lesson_id: lesson.id,
        room_id: roomId,
        recording_url: recordingUrl,
        recording_size: recordingSize,
        duration_seconds: durationSeconds,
        transcript_url: transcriptUrl,
        status: "available",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (recordingError) {
      console.error("Error creating recording record:", recordingError);
      console.error("Error details:", JSON.stringify(recordingError, null, 2));
      return new Response(
        JSON.stringify({
          error: "Failed to create recording record",
          details: recordingError.message,
          code: recordingError.code,
          hint: recordingError.hint
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Recording saved:", recording.id);

    // If transcript is available, trigger insight generation
    if (transcriptUrl) {
      console.log("Transcript available, fetching and generating insights...");

      try {
        // Fetch transcript
        const transcriptResponse = await fetch(transcriptUrl);
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
    } else {
      // No transcript - generate basic insights from lesson metadata
      console.log("No transcript available, generating basic insights...");

      // Get subject name
      const { data: subject } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", lesson.subject_id)
        .single();

      // Get learner name
      const { data: learner } = await supabase
        .from("learners")
        .select("name")
        .eq("id", lesson.learner_id)
        .single();

      // Create basic insight
      const { error: insightError } = await supabase
        .from("lesson_insights")
        .insert({
          lesson_id: lesson.id,
          teacher_id: lesson.teacher_id,
          learner_id: lesson.learner_id,
          subject_name: subject?.name || "Islamic Studies",
          summary: `${lesson.duration_minutes} minute ${subject?.name || "lesson"} session completed with ${learner?.name || "student"}.`,
          key_topics: [],
          areas_of_strength: [],
          areas_for_improvement: [],
          homework_suggestions: [],
          next_lesson_recommendations: "Continue from where you left off in the previous session.",
        });

      if (insightError) {
        console.error("Error creating basic insight:", insightError);
      } else {
        console.log("Basic insight created for lesson:", lesson.id);
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
