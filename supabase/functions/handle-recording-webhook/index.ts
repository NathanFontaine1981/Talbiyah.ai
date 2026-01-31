// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

// This function handles 100ms webhooks - must be publicly accessible
// Security is handled via x-webhook-secret header validation

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
};

/**
 * Constant-time string comparison to prevent timing attacks
 * Returns true if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

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
    // Transcript fields - 100ms uses multiple field names
    transcript_path?: string;
    transcript_presigned_url?: string;
    transcript_txt_presigned_url?: string;
    transcript_json_presigned_url?: string;
    transcript_srt_presigned_url?: string;
    // Transcription asset IDs (from transcription.started.success event)
    transcript_json_asset_id?: string;
    transcript_txt_asset_id?: string;
    transcript_srt_asset_id?: string;
    transcription_id?: string;
    // Summary fields
    summary_path?: string;
    summary_presigned_url?: string;
    summary_json_presigned_url?: string;
    summary_json_asset_id?: string;
  };
}

/**
 * Fetch presigned URL for a recording asset by ID
 */
async function getAssetPresignedUrl(assetId: string, hmsToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.100ms.live/v2/recording-assets/${assetId}/presigned-url`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${hmsToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.url || null;
    }
    console.error(`Failed to get presigned URL for asset ${assetId}:`, response.status);
    return null;
  } catch (error) {
    console.error(`Error fetching presigned URL for asset ${assetId}:`, error);
    return null;
  }
}

/**
 * Transcribe audio using ElevenLabs Scribe API
 * Best for Arabic/Quran content with mixed Arabic and English
 */
async function transcribeWithElevenLabs(recordingUrl: string): Promise<string | null> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

  if (!ELEVENLABS_API_KEY) {
    console.log("ELEVENLABS_API_KEY not configured, skipping ElevenLabs transcription");
    return null;
  }

  try {
    console.log("Downloading recording for ElevenLabs transcription...");

    // Fetch the recording
    const recordingResponse = await fetch(recordingUrl);
    if (!recordingResponse.ok) {
      console.error("Failed to fetch recording:", recordingResponse.status);
      return null;
    }

    const audioBlob = await recordingResponse.blob();
    console.log("Recording downloaded, size:", audioBlob.size, "bytes");

    // ElevenLabs Scribe supports files up to 1GB
    if (audioBlob.size > 1024 * 1024 * 1024) {
      console.log("Recording too large for ElevenLabs (>1GB), skipping");
      return null;
    }

    // Create form data for ElevenLabs Scribe API
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.mp4");
    formData.append("model_id", "scribe_v1"); // ElevenLabs Scribe model
    // Don't specify language_code to let it auto-detect (handles mixed Arabic/English better)

    console.log("Sending to ElevenLabs Scribe API...");
    const scribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!scribeResponse.ok) {
      const errorText = await scribeResponse.text();
      console.error("ElevenLabs Scribe API error:", scribeResponse.status, errorText);
      return null;
    }

    const result = await scribeResponse.json();
    const transcriptText = result.text || "";
    console.log("ElevenLabs transcription complete, length:", transcriptText.length);

    return transcriptText;
  } catch (error) {
    console.error("Error with ElevenLabs transcription:", error);
    return null;
  }
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

  // Get expected secret from environment variable only (no hardcoded fallback)
  const expectedSecret = Deno.env.get("HMS_WEBHOOK_SECRET");

  if (!expectedSecret) {
    console.error("HMS_WEBHOOK_SECRET environment variable not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify webhook secret
  const webhookSecret = req.headers.get("x-webhook-secret");

  if (!webhookSecret) {
    console.error("Missing x-webhook-secret header");
    return new Response(
      JSON.stringify({ error: "Unauthorized", message: "Missing webhook secret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Use constant-time comparison to prevent timing attacks
  const secretsMatch = constantTimeCompare(webhookSecret.trim(), expectedSecret.trim());

  if (!secretsMatch) {
    console.error("Invalid webhook secret");
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

      // Process recording.success, beam.recording.success, transcription.success, AND transcription.started.success events
      const validEvents = ["recording.success", "beam.recording.success", "transcription.success", "transcription.started.success"];
      if (!validEvents.includes(hmsData.type)) {
        console.log("Ignoring event type:", hmsData.type);
        return new Response(
          JSON.stringify({ success: true, message: "Event ignored" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      isTranscriptionEvent = hmsData.type === "transcription.success" || hmsData.type === "transcription.started.success";
      roomId = hmsData.data.room_id || "";
      recordingUrl = hmsData.data.recording_presigned_url;
      recordingSize = hmsData.data.size;
      durationSeconds = hmsData.data.duration;

      // Check all possible transcript URL fields (100ms uses different field names)
      transcriptUrl = hmsData.data.transcript_json_presigned_url ||
                      hmsData.data.transcript_txt_presigned_url ||
                      hmsData.data.transcript_presigned_url;

      // Check all possible summary URL fields
      summaryUrl = hmsData.data.summary_json_presigned_url ||
                   hmsData.data.summary_presigned_url;

      // Store session_id for later use if room_id lookup fails
      const sessionId = hmsData.data.session_id;

      // If transcription event has asset IDs instead of presigned URLs, fetch them
      if (isTranscriptionEvent && !transcriptUrl) {
        const transcriptAssetId = hmsData.data.transcript_json_asset_id || hmsData.data.transcript_txt_asset_id;
        const summaryAssetId = hmsData.data.summary_json_asset_id;

        if (transcriptAssetId || summaryAssetId) {
          console.log("Transcription event has asset IDs, fetching presigned URLs...");
          try {
            const hmsToken = await getHMSManagementToken();

            if (transcriptAssetId && !transcriptUrl) {
              transcriptUrl = await getAssetPresignedUrl(transcriptAssetId, hmsToken) || undefined;
              console.log("Got transcript URL from asset ID:", !!transcriptUrl);
            }

            if (summaryAssetId && !summaryUrl) {
              summaryUrl = await getAssetPresignedUrl(summaryAssetId, hmsToken) || undefined;
              console.log("Got summary URL from asset ID:", !!summaryUrl);
            }
          } catch (err) {
            console.error("Error fetching presigned URLs from asset IDs:", err);
          }
        }
      }

      console.log("Event details:", {
        type: hmsData.type,
        room_id: roomId,
        session_id: sessionId,
        has_recording: !!recordingUrl,
        has_transcript: !!transcriptUrl,
        has_summary: !!summaryUrl,
        transcript_url_source: hmsData.data.transcript_json_presigned_url ? 'json' :
                               hmsData.data.transcript_txt_presigned_url ? 'txt' :
                               hmsData.data.transcript_presigned_url ? 'generic' :
                               hmsData.data.transcript_json_asset_id ? 'json_asset' :
                               hmsData.data.transcript_txt_asset_id ? 'txt_asset' : 'none',
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

    // Find lesson by 100ms room_id - include tier info for conditional processing
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes, status, lesson_tier, free_insights_trial")
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

    // Determine what to generate based on tier
    // Premium tier OR free_insights_trial gets full features
    // Standard tier (legacy billing) gets no insights or recording saved
    // Default to premium behavior if tier not set (backwards compatibility)
    const lessonTier = lesson.lesson_tier || 'premium';
    const freeInsightsTrial = lesson.free_insights_trial || false;

    const shouldGenerateInsights =
      lessonTier === 'premium' ||
      freeInsightsTrial === true;

    const shouldSaveRecording =
      lessonTier === 'premium' ||
      freeInsightsTrial === true;

    console.log("Tier-based processing:", {
      lesson_id: lesson.id,
      lesson_tier: lessonTier,
      free_insights_trial: freeInsightsTrial,
      shouldGenerateInsights,
      shouldSaveRecording,
    });

    // Calculate expiry date (7 days from now for presigned URL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update lesson - only save recording URL for Premium tier or free trial
    console.log("Updating lesson with recording:", {
      lesson_id: lesson.id,
      recording_url: shouldSaveRecording ? recordingUrl?.substring(0, 50) + "..." : "SKIPPED (standard tier)",
      expires_at: expiresAt.toISOString(),
      has_transcript: !!transcriptUrl,
    });

    const updateData: Record<string, any> = {
      status: "completed",
    };

    // Only save recording URL for Premium tier or free trial
    if (shouldSaveRecording && recordingUrl) {
      updateData.recording_url = recordingUrl;
      updateData.recording_expires_at = expiresAt.toISOString();
    }

    const { error: updateError } = await supabase
      .from("lessons")
      .update(updateData)
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

    // Extract session_id for potential transcript API lookup
    const sessionId = (rawData as HMS100msWebhook).data?.session_id;

    // If no transcript URL in webhook, try to fetch from 100ms API (for recording.success events)
    if (!transcriptUrl && !isTranscriptionEvent && sessionId) {
      console.log("No transcript in webhook, attempting to fetch from 100ms API for session:", sessionId);

      try {
        const hmsToken = await getHMSManagementToken();

        // Query specifically for transcript assets (avoids pagination issues)
        console.log("Fetching transcript assets with type filter...");
        const transcriptResponse = await fetch(
          `https://api.100ms.live/v2/recording-assets?session_id=${sessionId}&type=transcript`,
          {
            headers: {
              'Authorization': `Bearer ${hmsToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (transcriptResponse.ok) {
          const transcriptData = await transcriptResponse.json();
          console.log("Found", transcriptData.data?.length || 0, "transcript assets for session");

          // Find transcript assets (prefer JSON, then TXT)
          const transcriptAsset = transcriptData.data?.find((asset: any) =>
            asset.status === 'completed' && asset.metadata?.output_mode === 'json'
          ) || transcriptData.data?.find((asset: any) =>
            asset.status === 'completed' && asset.metadata?.output_mode === 'txt'
          ) || transcriptData.data?.find((asset: any) =>
            asset.status === 'completed'
          );

          if (transcriptAsset) {
            console.log("Found transcript asset:", transcriptAsset.id, "type:", transcriptAsset.metadata?.output_mode);

            // Get presigned URL for transcript
            const presignResponse = await fetch(
              `https://api.100ms.live/v2/recording-assets/${transcriptAsset.id}/presigned-url`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${hmsToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (presignResponse.ok) {
              const presignData = await presignResponse.json();
              transcriptUrl = presignData.url;
              console.log("Got presigned URL for transcript");
            }
          } else {
            console.log("No completed transcript assets found yet");
          }
        } else {
          console.log("Could not fetch transcript assets:", transcriptResponse.status);
        }

        // Query specifically for summary assets (separate query to avoid pagination)
        if (!summaryUrl) {
          console.log("Fetching summary assets with type filter...");
          const summaryResponse = await fetch(
            `https://api.100ms.live/v2/recording-assets?session_id=${sessionId}&type=summary`,
            {
              headers: {
                'Authorization': `Bearer ${hmsToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            console.log("Found", summaryData.data?.length || 0, "summary assets for session");

            const summaryAsset = summaryData.data?.find((asset: any) =>
              asset.status === 'completed'
            );

            if (summaryAsset) {
              console.log("Found summary asset:", summaryAsset.id);

              const presignResponse = await fetch(
                `https://api.100ms.live/v2/recording-assets/${summaryAsset.id}/presigned-url`,
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${hmsToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (presignResponse.ok) {
                const presignData = await presignResponse.json();
                summaryUrl = presignData.url;
                console.log("Got presigned URL for summary");
              }
            } else {
              console.log("No completed summary assets found yet");
            }
          }
        }
      } catch (apiError) {
        console.error("Error fetching from 100ms API:", apiError);
      }
    }

    // If transcript is available (from webhook or API fetch), generate AI insights
    let transcriptText = "";

    if (transcriptUrl || isTranscriptionEvent) {
      console.log("Using 100ms transcript...");

      try {
        // Fetch transcript text from 100ms
        if (transcriptUrl) {
          console.log("Fetching transcript from URL...");
          const transcriptResponse = await fetch(transcriptUrl);
          if (transcriptResponse.ok) {
            // Try to parse as JSON first, fall back to text
            const contentType = transcriptResponse.headers.get('content-type') || '';
            let transcriptData: any;

            if (contentType.includes('application/json') || transcriptUrl.includes('.json')) {
              transcriptData = await transcriptResponse.json();
              // Extract text from 100ms JSON transcript format
              if (Array.isArray(transcriptData)) {
                // Array of transcript segments with speaker info
                transcriptText = transcriptData.map((seg: any) => {
                  const speaker = seg.speaker_name || seg.peer_name || 'Speaker';
                  const text = seg.text || seg.transcript || '';
                  return `${speaker}: ${text}`;
                }).join('\n');
              } else if (transcriptData.transcript) {
                transcriptText = transcriptData.transcript;
              } else if (transcriptData.text) {
                transcriptText = transcriptData.text;
              } else if (typeof transcriptData === 'string') {
                transcriptText = transcriptData;
              } else {
                // Last resort - stringify
                transcriptText = JSON.stringify(transcriptData);
              }
            } else {
              // Plain text transcript
              transcriptText = await transcriptResponse.text();
            }

            console.log("Fetched 100ms transcript, length:", transcriptText.length);
          } else {
            console.error("Failed to fetch transcript:", transcriptResponse.status);
          }
        }

        // For Arabic/Quran content, ALWAYS use ElevenLabs as primary transcription
        // 100ms transcription doesn't handle Arabic/Quran recitation well
        const subjectLower = subjectName.toLowerCase();
        const isArabicContent = subjectLower.includes('quran') || subjectLower.includes('qur') ||
                                subjectLower.includes('arabic') || subjectLower.includes('tajweed') ||
                                subjectLower.includes('tajwid') || subjectLower.includes('hifz');

        if (isArabicContent && recordingUrl) {
          console.log("Arabic/Quran content detected - using ElevenLabs Scribe as PRIMARY transcription...");
          const elevenLabsTranscript = await transcribeWithElevenLabs(recordingUrl);
          if (elevenLabsTranscript && elevenLabsTranscript.length > 100) {
            console.log("Using ElevenLabs transcript (best for Arabic), length:", elevenLabsTranscript.length);
            transcriptText = elevenLabsTranscript;
          } else {
            console.log("ElevenLabs failed or empty, falling back to 100ms transcript");
          }
        }

        // Also fetch summary if available
        let summaryText = "";
        if (summaryUrl) {
          try {
            console.log("Fetching summary from URL...");
            const summaryResponse = await fetch(summaryUrl);
            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              // Handle 100ms summary format with sections
              if (summaryData.sections && Array.isArray(summaryData.sections)) {
                summaryText = summaryData.sections.map((section: any) =>
                  `## ${section.title}\n${section.content || section.bullets?.join('\n- ') || ''}`
                ).join('\n\n');
              } else {
                summaryText = summaryData.summary || summaryData.text || JSON.stringify(summaryData);
              }
              console.log("Fetched summary, length:", summaryText.length);
            }
          } catch (e) {
            console.log("Could not fetch summary:", e);
          }
        }

        // Combine transcript and summary for richer context
        let fullTranscript = summaryText
          ? `SUMMARY:\n${summaryText}\n\nFULL TRANSCRIPT:\n${transcriptText}`
          : transcriptText;

        // Truncate if too long (Claude has 200k token limit, ~4 chars per token)
        const maxChars = 400000;
        if (fullTranscript.length > maxChars) {
          console.log(`Transcript too long (${fullTranscript.length} chars), truncating to ${maxChars} chars`);
          fullTranscript = fullTranscript.substring(0, maxChars) +
            "\n\n[... remainder of transcript truncated for processing ...]";
        }

        if (fullTranscript.length > 100 && shouldGenerateInsights) {
          console.log("Calling generate-lesson-insights function, transcript length:", fullTranscript.length);

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
        } else if (shouldGenerateInsights) {
          console.log("Transcript too short for AI insights, will create basic insight");
        } else {
          console.log("Standard tier lesson - skipping insight generation");
        }
      } catch (error) {
        console.error("Error processing transcript:", error);
        // Continue to create basic insight
      }
    }

    // If no 100ms transcript available, try Whisper for Arabic/Quran content
    if (!transcriptText && recordingUrl && shouldGenerateInsights) {
      const subjectLower = subjectName.toLowerCase();
      const isArabicContent = subjectLower.includes('quran') || subjectLower.includes('qur') ||
                              subjectLower.includes('arabic') || subjectLower.includes('tajweed') ||
                              subjectLower.includes('tajwid') || subjectLower.includes('hifz');

      if (isArabicContent) {
        console.log("No 100ms transcript available, trying ElevenLabs Scribe for Arabic content...");
        const whisperTranscript = await transcribeWithElevenLabs(recordingUrl);

        if (whisperTranscript && whisperTranscript.length > 100) {
          console.log("Got ElevenLabs transcript, length:", whisperTranscript.length);
          transcriptText = whisperTranscript;

          // Generate insights with Whisper transcript
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
            surah_name: "Quran",
            surah_number: 1,
            ayah_range: "1-7",
          };

          const insightResponse = await fetch(`${supabaseUrl}/functions/v1/generate-lesson-insights`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              lesson_id: lesson.id,
              transcript: whisperTranscript,
              subject: subjectName,
              metadata: metadata,
            }),
          });

          if (insightResponse.ok) {
            const insightResult = await insightResponse.json();
            console.log("AI insights generated from ElevenLabs transcript:", insightResult.insight_id);

            await supabase
              .from("lesson_insights")
              .update({ learner_id: lesson.learner_id })
              .eq("lesson_id", lesson.id);
          } else {
            const errorText = await insightResponse.text();
            console.error("Failed to generate AI insights from ElevenLabs:", errorText);
          }
        }
      }
    }

    // Check if insight was created - if not, create a basic one
    const { data: existingInsight } = await supabase
      .from("lesson_insights")
      .select("id")
      .eq("lesson_id", lesson.id)
      .single();

    // Only create basic insight for Premium tier or free trial
    if (!existingInsight && shouldGenerateInsights) {
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

        // Send admin alert for failed insight generation
        try {
          const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
          if (RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Talbiyah <alerts@talbiyah.ai>",
                to: ["contact@talbiyah.ai"],
                subject: `⚠️ Lesson Insights Failed - ${learnerName}`,
                html: `
                  <h2>Lesson Insights Generation Failed</h2>
                  <p>A lesson recording was received but insights could not be generated.</p>
                  <ul>
                    <li><strong>Student:</strong> ${learnerName}</li>
                    <li><strong>Teacher:</strong> ${teacherName}</li>
                    <li><strong>Subject:</strong> ${subjectName}</li>
                    <li><strong>Lesson ID:</strong> ${lesson.id}</li>
                    <li><strong>Scheduled:</strong> ${new Date(lesson.scheduled_time).toLocaleString('en-GB')}</li>
                    <li><strong>Error:</strong> ${insightError.message}</li>
                  </ul>
                  <p>Please check the lesson manually in the admin panel.</p>
                `,
              }),
            });
            console.log("Admin alert sent for failed insight generation");
          }
        } catch (alertError) {
          console.error("Failed to send admin alert:", alertError);
        }
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
  } catch (error: unknown) {
    console.error("Error handling recording webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
