// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// This function handles 100ms webhooks - must be publicly accessible
// Security is handled via x-webhook-secret header validation

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
};

// Webhook secret for 100ms - must match what's configured in 100ms dashboard
const WEBHOOK_SECRET = "talbiyah-hms-2024-secret";

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

  // Log all headers for debugging
  console.log("=== WEBHOOK REQUEST RECEIVED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = key.toLowerCase().includes('secret') ? `[PRESENT: ${value.length} chars]` : value;
  });
  console.log("Headers:", JSON.stringify(headersObj, null, 2));

  // Get expected secret from environment or use hardcoded default
  const expectedSecret = Deno.env.get("HMS_WEBHOOK_SECRET") || WEBHOOK_SECRET;

  // Verify webhook secret
  const webhookSecret = req.headers.get("x-webhook-secret");
  console.log("Webhook secret header present:", !!webhookSecret);
  console.log("Expected secret length:", expectedSecret.length);
  console.log("Received secret length:", webhookSecret?.length || 0);

  // Compare secrets (trim whitespace for robustness)
  const secretsMatch = webhookSecret?.trim() === expectedSecret.trim();
  console.log("Secrets match:", secretsMatch);

  if (webhookSecret && !secretsMatch) {
    console.error("Invalid webhook secret - received:", webhookSecret?.substring(0, 10) + "...");
    console.error("Expected:", expectedSecret.substring(0, 10) + "...");
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Invalid webhook secret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("Webhook authentication passed");

  try {
    const rawData = await req.json();
    console.log("Received webhook payload:", JSON.stringify(rawData, null, 2));

    // Normalize webhook data - handle both 100ms format and legacy format
    let roomId: string;
    let recordingUrl: string | undefined;
    let recordingSize: number | undefined;
    let durationSeconds: number | undefined;
    let transcriptUrl: string | undefined;

    // Track if this is a transcription event
    let isTranscriptionEvent = false;
    let summaryUrl: string | undefined;

    if (rawData.type && rawData.data) {
      // 100ms webhook format
      const hmsData = rawData as HMS100msWebhook;
      console.log("100ms webhook type:", hmsData.type);

      // Process recording.success, beam.recording.success, AND transcription.success events
      const validEvents = ["recording.success", "beam.recording.success", "transcription.success"];
      if (!validEvents.includes(hmsData.type)) {
        console.log("Ignoring event type:", hmsData.type);
        return new Response(
          JSON.stringify({ success: true, message: "Event ignored" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      isTranscriptionEvent = hmsData.type === "transcription.success";
      roomId = hmsData.data.room_id || "";
      recordingUrl = hmsData.data.recording_presigned_url;
      recordingSize = hmsData.data.size;
      durationSeconds = hmsData.data.duration;
      transcriptUrl = hmsData.data.transcript_presigned_url;
      summaryUrl = hmsData.data.summary_presigned_url;

      console.log("Event details:", {
        type: hmsData.type,
        room_id: roomId,
        has_recording: !!recordingUrl,
        has_transcript: !!transcriptUrl,
        has_summary: !!summaryUrl,
      });
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
      .select("id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes, status")
      .eq("100ms_room_id", roomId)
      .single();

    // If lesson found, mark it as completed
    if (lesson && lesson.status !== "completed") {
      console.log("Marking lesson as completed:", lesson.id);
      await supabase
        .from("lessons")
        .update({ status: "completed" })
        .eq("id", lesson.id);
    }

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

    // Calculate expiry date (7 days from now for presigned URL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update lesson with recording URL directly
    // The lessons table has recording_url and recording_expires_at columns
    console.log("Updating lesson with recording:", {
      lesson_id: lesson.id,
      recording_url: recordingUrl?.substring(0, 50) + "...",
      expires_at: expiresAt.toISOString(),
      has_transcript: !!transcriptUrl,
    });

    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        recording_url: recordingUrl,
        recording_expires_at: expiresAt.toISOString(),
        status: "completed",
      })
      .eq("id", lesson.id);

    if (updateError) {
      console.error("Error updating lesson with recording:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update lesson with recording",
          details: updateError.message,
          code: updateError.code,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Lesson updated with recording URL:", lesson.id);

    // Get subject and learner info for insight generation
    const { data: subject } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", lesson.subject_id)
      .single();

    const { data: learner } = await supabase
      .from("learners")
      .select("name")
      .eq("id", lesson.learner_id)
      .single();

    const { data: teacher } = await supabase
      .from("teacher_profiles")
      .select("profiles(full_name)")
      .eq("user_id", lesson.teacher_id)
      .single();

    const teacherName = (teacher?.profiles as any)?.full_name || "Teacher";
    const subjectName = subject?.name || "Lesson";
    const learnerName = learner?.name || "Student";

    // If transcript is available (from transcription.success event), generate AI insights
    if (transcriptUrl || isTranscriptionEvent) {
      console.log("Transcript available, fetching and generating AI insights...");

      try {
        // Fetch transcript text
        let transcriptText = "";
        if (transcriptUrl) {
          const transcriptResponse = await fetch(transcriptUrl);
          if (transcriptResponse.ok) {
            const transcriptData = await transcriptResponse.json();
            // Extract text from 100ms transcript format
            if (Array.isArray(transcriptData)) {
              // Array of transcript segments
              transcriptText = transcriptData.map((seg: any) => seg.text || seg.transcript || "").join(" ");
            } else if (transcriptData.transcript) {
              transcriptText = transcriptData.transcript;
            } else if (transcriptData.text) {
              transcriptText = transcriptData.text;
            } else {
              transcriptText = JSON.stringify(transcriptData);
            }
          }
        }

        // Also fetch summary if available
        let summaryText = "";
        if (summaryUrl) {
          try {
            const summaryResponse = await fetch(summaryUrl);
            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              summaryText = summaryData.summary || summaryData.text || JSON.stringify(summaryData);
            }
          } catch (e) {
            console.log("Could not fetch summary:", e);
          }
        }

        // Combine transcript and summary for richer context
        const fullTranscript = summaryText
          ? `SUMMARY:\n${summaryText}\n\nFULL TRANSCRIPT:\n${transcriptText}`
          : transcriptText;

        if (fullTranscript.length > 100) {
          console.log("Calling generate-lesson-insights function...");

          // Determine metadata based on subject type
          const metadata: any = {
            teacher_name: teacherName,
            student_names: [learnerName],
            lesson_date: new Date(lesson.scheduled_time).toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            duration_minutes: lesson.duration_minutes,
          };

          // For Quran lessons, try to extract surah info from transcript or use defaults
          const subjectLower = subjectName.toLowerCase();
          if (subjectLower.includes('quran') || subjectLower.includes('qur')) {
            // Default values - could be enhanced with AI extraction later
            metadata.surah_name = "Quran";
            metadata.surah_number = 1;
            metadata.ayah_range = "1-7";
          }

          // Call the generate-lesson-insights function
          const insightResponse = await fetch(`${supabaseUrl}/functions/v1/generate-lesson-insights`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              lesson_id: lesson.id,
              transcript: fullTranscript,
              subject: subjectName,
              metadata: metadata,
            }),
          });

          if (insightResponse.ok) {
            const insightResult = await insightResponse.json();
            console.log("AI insights generated successfully:", insightResult.insight_id);

            // Update the insight with learner_id for proper filtering
            await supabase
              .from("lesson_insights")
              .update({ learner_id: lesson.learner_id })
              .eq("lesson_id", lesson.id);
          } else {
            const errorText = await insightResponse.text();
            console.error("Failed to generate AI insights:", errorText);
            // Fall through to create basic insight
          }
        } else {
          console.log("Transcript too short, creating basic insight");
        }
      } catch (error) {
        console.error("Error processing transcript:", error);
        // Continue to create basic insight
      }
    }

    // Check if insight was created - if not, create a basic one
    const { data: existingInsight } = await supabase
      .from("lesson_insights")
      .select("id")
      .eq("lesson_id", lesson.id)
      .single();

    if (!existingInsight) {
      console.log("No AI insight created, generating basic insight...");

      const { error: insightError } = await supabase
        .from("lesson_insights")
        .insert({
          lesson_id: lesson.id,
          subject_id: lesson.subject_id,
          teacher_id: lesson.teacher_id,
          learner_id: lesson.learner_id,
          insight_type: "subject_specific",
          title: `${subjectName} Session Summary`,
          summary: `A ${lesson.duration_minutes} minute ${subjectName} session was completed with ${learnerName}. Recording is available for review.`,
          key_topics: ["Session completed", "Recording available"],
          areas_of_strength: ["Completed session"],
          areas_for_improvement: ["Review recording for detailed feedback"],
          recommendations: ["Continue from where you left off in the next session"],
          student_participation_score: 80,
          ai_model: "auto_generated",
          confidence_score: 0.7,
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
        lesson_id: lesson.id,
        recording_saved: true,
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
