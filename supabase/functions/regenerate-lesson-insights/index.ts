// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RegenerateRequest {
  lesson_id?: string;  // Optional - if provided, regenerate for specific lesson
  all_without_insights?: boolean;  // If true, regenerate for all lessons without insights
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RegenerateRequest = await req.json().catch(() => ({}));
    const results: any[] = [];

    // Get lessons to process
    let lessons: any[] = [];

    if (body.lesson_id) {
      // Get specific lesson
      const { data, error } = await supabase
        .from("lessons")
        .select("id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes, 100ms_room_id, status")
        .eq("id", body.lesson_id)
        .single();

      if (data) lessons = [data];
      if (error) {
        return new Response(
          JSON.stringify({ error: "Lesson not found", details: error.message }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (body.all_without_insights) {
      // Get all completed lessons without insights
      const { data: allLessons } = await supabase
        .from("lessons")
        .select("id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes, 100ms_room_id, status")
        .eq("status", "completed")
        .order("scheduled_time", { ascending: false })
        .limit(50);

      if (allLessons) {
        // Filter out lessons that already have insights
        for (const lesson of allLessons) {
          const { data: existingInsight } = await supabase
            .from("lesson_insights")
            .select("id")
            .eq("lesson_id", lesson.id)
            .maybeSingle();

          if (!existingInsight) {
            lessons.push(lesson);
          }
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Provide either lesson_id or all_without_insights: true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${lessons.length} lessons for insight generation`);

    // Get HMS token once for all requests
    let hmsToken: string;
    try {
      hmsToken = await getHMSManagementToken();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to generate HMS token", details: String(e) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const lesson of lessons) {
      const roomId = lesson["100ms_room_id"];
      if (!roomId) {
        results.push({ lesson_id: lesson.id, status: "skipped", reason: "No 100ms room ID" });
        continue;
      }

      console.log(`Processing lesson ${lesson.id} with room ${roomId}`);

      try {
        // Get sessions for this room using correct endpoint
        const sessionsResponse = await fetch(
          `https://api.100ms.live/v2/sessions?room_id=${roomId}&limit=10`,
          {
            headers: {
              "Authorization": `Bearer ${hmsToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!sessionsResponse.ok) {
          const errorText = await sessionsResponse.text();
          console.error(`Failed to fetch sessions for room ${roomId}: ${sessionsResponse.status} ${errorText}`);
          results.push({
            lesson_id: lesson.id,
            status: "error",
            reason: `Failed to fetch sessions: ${sessionsResponse.status}`,
          });
          continue;
        }

        const sessionsData = await sessionsResponse.json();
        const sessions = sessionsData.data || [];
        console.log(`Found ${sessions.length} sessions for room ${roomId}`);

        if (sessions.length === 0) {
          results.push({ lesson_id: lesson.id, status: "skipped", reason: "No sessions found" });
          continue;
        }

        // Find the most recent session with recording
        let transcriptUrl: string | undefined;
        let summaryUrl: string | undefined;
        let sessionUsed: string | undefined;

        for (const session of sessions) {
          const sessionId = session.id;
          console.log(`Checking session ${sessionId} for assets`);

          // Fetch recording assets for this session
          const assetsResponse = await fetch(
            `https://api.100ms.live/v2/recording-assets?session_id=${sessionId}`,
            {
              headers: {
                "Authorization": `Bearer ${hmsToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!assetsResponse.ok) continue;

          const assetsData = await assetsResponse.json();
          const assets = assetsData.data || [];

          console.log(`Found ${assets.length} assets for session ${sessionId}`);

          // Find transcript (prefer JSON)
          const transcriptAsset = assets.find((a: any) =>
            a.type === "transcript" && a.status === "completed" &&
            a.metadata?.output_mode === "json"
          ) || assets.find((a: any) =>
            a.type === "transcript" && a.status === "completed"
          );

          // Find summary
          const summaryAsset = assets.find((a: any) =>
            a.type === "summary" && a.status === "completed"
          );

          if (transcriptAsset) {
            console.log(`Found transcript asset: ${transcriptAsset.id}`);

            // Get presigned URL
            const presignResponse = await fetch(
              `https://api.100ms.live/v2/recording-assets/${transcriptAsset.id}/presigned-url`,
              {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${hmsToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (presignResponse.ok) {
              const presignData = await presignResponse.json();
              transcriptUrl = presignData.url;
              sessionUsed = sessionId;
            }
          }

          if (summaryAsset) {
            const presignResponse = await fetch(
              `https://api.100ms.live/v2/recording-assets/${summaryAsset.id}/presigned-url`,
              {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${hmsToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (presignResponse.ok) {
              const presignData = await presignResponse.json();
              summaryUrl = presignData.url;
            }
          }

          if (transcriptUrl) break;  // Found what we need
        }

        if (!transcriptUrl) {
          results.push({
            lesson_id: lesson.id,
            status: "skipped",
            reason: "No transcript found in any session",
          });
          continue;
        }

        // Fetch transcript content
        console.log("Fetching transcript content...");
        const transcriptResponse = await fetch(transcriptUrl);
        let transcriptText = "";

        if (transcriptResponse.ok) {
          const contentType = transcriptResponse.headers.get("content-type") || "";

          if (contentType.includes("application/json") || transcriptUrl.includes(".json")) {
            const transcriptData = await transcriptResponse.json();
            if (Array.isArray(transcriptData)) {
              transcriptText = transcriptData.map((seg: any) => {
                const speaker = seg.speaker_name || seg.peer_name || "Speaker";
                const text = seg.text || seg.transcript || "";
                return `${speaker}: ${text}`;
              }).join("\n");
            } else if (transcriptData.transcript) {
              transcriptText = transcriptData.transcript;
            } else if (transcriptData.text) {
              transcriptText = transcriptData.text;
            } else {
              transcriptText = JSON.stringify(transcriptData);
            }
          } else {
            transcriptText = await transcriptResponse.text();
          }
        }

        // Fetch summary if available
        let summaryText = "";
        if (summaryUrl) {
          const summaryResponse = await fetch(summaryUrl);
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            if (summaryData.sections && Array.isArray(summaryData.sections)) {
              summaryText = summaryData.sections.map((section: any) =>
                `## ${section.title}\n${section.content || section.bullets?.join("\n- ") || ""}`
              ).join("\n\n");
            } else {
              summaryText = summaryData.summary || summaryData.text || JSON.stringify(summaryData);
            }
          }
        }

        // Combine transcript and summary
        const fullTranscript = summaryText
          ? `SUMMARY:\n${summaryText}\n\nFULL TRANSCRIPT:\n${transcriptText}`
          : transcriptText;

        if (fullTranscript.length < 100) {
          results.push({
            lesson_id: lesson.id,
            status: "skipped",
            reason: "Transcript too short",
          });
          continue;
        }

        // Get subject info
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

        // Build metadata
        const metadata: any = {
          teacher_name: teacherName,
          student_names: [learnerName],
          lesson_date: new Date(lesson.scheduled_time).toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          duration_minutes: lesson.duration_minutes,
        };

        // For Quran lessons
        const subjectLower = subjectName.toLowerCase();
        if (subjectLower.includes("quran") || subjectLower.includes("qur")) {
          metadata.surah_name = "Quran";
          metadata.surah_number = 1;
          metadata.ayah_range = "1-7";
        }

        // Delete existing insight if any (in case we're re-generating)
        await supabase
          .from("lesson_insights")
          .delete()
          .eq("lesson_id", lesson.id);

        // Call generate-lesson-insights
        console.log("Calling generate-lesson-insights...");
        const insightResponse = await fetch(
          `${supabaseUrl}/functions/v1/generate-lesson-insights`,
          {
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
          }
        );

        if (insightResponse.ok) {
          const insightResult = await insightResponse.json();

          // Update learner_id on the insight
          await supabase
            .from("lesson_insights")
            .update({ learner_id: lesson.learner_id })
            .eq("lesson_id", lesson.id);

          results.push({
            lesson_id: lesson.id,
            status: "success",
            insight_id: insightResult.insight_id,
            session_used: sessionUsed,
            transcript_length: fullTranscript.length,
          });
        } else {
          const errorText = await insightResponse.text();
          results.push({
            lesson_id: lesson.id,
            status: "error",
            reason: "Failed to generate insights",
            details: errorText,
          });
        }
      } catch (lessonError: unknown) {
        const errorMessage = lessonError instanceof Error ? lessonError.message : String(lessonError);
        results.push({
          lesson_id: lesson.id,
          status: "error",
          reason: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: lessons.length,
        results: results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in regenerate-lesson-insights:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
