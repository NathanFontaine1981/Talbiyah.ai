import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ElevenLabs transcription for Arabic/Quran content (much better accuracy)
async function transcribeWithElevenLabs(recordingUrl: string): Promise<string | null> {
  const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!elevenLabsApiKey) {
    console.log("ElevenLabs API key not configured");
    return null;
  }

  try {
    console.log("Downloading recording for ElevenLabs transcription...");

    // Download the recording
    const recordingResponse = await fetch(recordingUrl);
    if (!recordingResponse.ok) {
      console.error("Failed to download recording:", recordingResponse.status);
      return null;
    }

    const recordingBlob = await recordingResponse.blob();
    console.log("Recording downloaded, size:", recordingBlob.size, "bytes");

    // Create form data for ElevenLabs
    const formData = new FormData();
    formData.append("file", recordingBlob, "recording.mp4");
    formData.append("model_id", "scribe_v1");
    formData.append("language_code", "ara"); // Arabic primary - ElevenLabs handles code-switching
    formData.append("tag_audio_events", "false");
    formData.append("diarize", "true"); // Enable speaker diarization

    console.log("Sending to ElevenLabs Scribe API...");

    const scribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
      },
      body: formData,
    });

    if (!scribeResponse.ok) {
      const errorText = await scribeResponse.text();
      console.error("ElevenLabs Scribe error:", scribeResponse.status, errorText);
      return null;
    }

    const scribeResult = await scribeResponse.json();
    console.log("ElevenLabs Scribe result received");

    // Format transcript with speaker labels if available
    if (scribeResult.words && Array.isArray(scribeResult.words)) {
      // Group words by speaker
      let currentSpeaker = "";
      let segments: string[] = [];
      let currentText = "";

      for (const word of scribeResult.words) {
        const speaker = word.speaker_id || "Speaker";
        if (speaker !== currentSpeaker) {
          if (currentText) {
            segments.push(`${currentSpeaker}: ${currentText.trim()}`);
          }
          currentSpeaker = speaker;
          currentText = word.text || "";
        } else {
          currentText += " " + (word.text || "");
        }
      }
      if (currentText) {
        segments.push(`${currentSpeaker}: ${currentText.trim()}`);
      }

      return segments.join("\n");
    }

    // Fallback to simple text
    return scribeResult.text || null;
  } catch (error) {
    console.error("ElevenLabs transcription error:", error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lesson_id, surah_name, surah_number, ayah_range } = await req.json();

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: "lesson_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Manual surah override for accurate Quran.com data fetching
    const manualSurahName = surah_name;
    const manualSurahNumber = surah_number ? parseInt(surah_number, 10) : undefined;
    const manualAyahRange = ayah_range;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Regenerating insights for lesson:", lesson_id);

    // Fetch lesson with all needed data
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        id, subject_id, teacher_id, learner_id, scheduled_time, duration_minutes,
        recording_url, "100ms_room_id",
        subjects(name), learners(name),
        teacher_profiles!lessons_teacher_id_fkey(profiles(full_name))
      `)
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found", details: lessonError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const teacherName = (lesson.teacher_profiles as any)?.profiles?.full_name || "Teacher";
    const subjectName = (lesson.subjects as any)?.name || "Lesson";
    const learnerName = (lesson.learners as any)?.name || "Student";
    const lessonTitle = subjectName; // Subject name contains surah info like "Quran with Understanding"

    // Use manual surah info if provided, otherwise try to parse from title
    let surahName: string | undefined = manualSurahName;
    let surahNumber: number | undefined = manualSurahNumber;
    let ayahRange: string | undefined = manualAyahRange;

    if (!surahName && !surahNumber) {
      // Pattern: "Surah An-Najm (53:1-18)" or "Surah Al-Kahf (18)" or "Surah Name (number), Ayat X-Y"
      const surahMatch = lessonTitle.match(/[Ss]urah\s+([A-Za-z\-']+)\s*(?:\((\d+)(?::(\d+)-(\d+))?\))?/);
      if (surahMatch) {
        surahName = surahMatch[1];
        if (surahMatch[2]) surahNumber = parseInt(surahMatch[2], 10);
        if (surahMatch[3] && surahMatch[4]) {
          ayahRange = `${surahMatch[3]}-${surahMatch[4]}`;
        }
      }

      // Also try to extract ayah range from title like "Ayat 1-18" or "(1-18)"
      if (!ayahRange) {
        const ayahMatch = lessonTitle.match(/(?:[Aa]yat?\s*)?(\d+)\s*[-–]\s*(\d+)/);
        if (ayahMatch) {
          ayahRange = `${ayahMatch[1]}-${ayahMatch[2]}`;
        }
      }
    }

    console.log("Surah info:", { surahName, surahNumber, ayahRange, lessonTitle, manual: !!manualSurahNumber });

    let transcriptText = "";

    // Detect if this is Arabic/Quran content (ElevenLabs is much better for this)
    const isArabicContent = subjectName.toLowerCase().includes("quran") ||
      subjectName.toLowerCase().includes("arabic") ||
      subjectName.toLowerCase().includes("tajweed") ||
      subjectName.toLowerCase().includes("surah") ||
      !!surahName || !!surahNumber;

    console.log("Content type detection:", { isArabicContent, subjectName });

    // For Arabic/Quran content, use ElevenLabs as PRIMARY transcription
    if (isArabicContent && lesson.recording_url) {
      console.log("Arabic/Quran content detected - using ElevenLabs Scribe as PRIMARY transcription...");
      const elevenLabsTranscript = await transcribeWithElevenLabs(lesson.recording_url);
      if (elevenLabsTranscript && elevenLabsTranscript.length > 100) {
        console.log("Using ElevenLabs transcript (best for Arabic), length:", elevenLabsTranscript.length);
        transcriptText = elevenLabsTranscript;
      } else {
        console.log("ElevenLabs failed or too short, will try 100ms as fallback");
      }
    }

    // Try to get transcript from 100ms API (fallback for Arabic, primary for non-Arabic)
    if (!transcriptText && lesson["100ms_room_id"]) {
      console.log("Fetching transcript from 100ms...");
      try {
        const hmsToken = await getHMSManagementToken();

        const sessionsResponse = await fetch(
          `https://api.100ms.live/v2/sessions?room_id=${lesson["100ms_room_id"]}&limit=5`,
          { headers: { 'Authorization': `Bearer ${hmsToken}` } }
        );

        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          const latestSession = sessionsData.data?.[0];

          if (latestSession?.id) {
            const transcriptResponse = await fetch(
              `https://api.100ms.live/v2/recording-assets?session_id=${latestSession.id}&type=transcript`,
              { headers: { 'Authorization': `Bearer ${hmsToken}` } }
            );

            if (transcriptResponse.ok) {
              const transcriptData = await transcriptResponse.json();
              const transcriptAsset = transcriptData.data?.find((a: any) => a.status === 'completed');

              if (transcriptAsset) {
                const presignResponse = await fetch(
                  `https://api.100ms.live/v2/recording-assets/${transcriptAsset.id}/presigned-url`,
                  { headers: { 'Authorization': `Bearer ${hmsToken}` } }
                );

                if (presignResponse.ok) {
                  const { url } = await presignResponse.json();
                  const transcriptFetch = await fetch(url);

                  if (transcriptFetch.ok) {
                    const contentType = transcriptFetch.headers.get('content-type') || '';
                    if (contentType.includes('json') || url.includes('.json')) {
                      const jsonData = await transcriptFetch.json();
                      if (Array.isArray(jsonData)) {
                        transcriptText = jsonData.map((seg: any) =>
                          `${seg.speaker_name || seg.peer_name || 'Speaker'}: ${seg.text || ''}`
                        ).join('\n');
                      } else {
                        transcriptText = jsonData.transcript || jsonData.text || JSON.stringify(jsonData);
                      }
                    } else {
                      transcriptText = await transcriptFetch.text();
                    }
                    console.log("Got 100ms transcript, length:", transcriptText.length);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("100ms error:", e);
      }
    }

    // If 100ms transcript is missing/short, try ElevenLabs as last resort (even for non-Arabic)
    if ((!transcriptText || transcriptText.length < 100) && lesson.recording_url && !isArabicContent) {
      console.log("100ms transcript insufficient, trying ElevenLabs as fallback...");
      const elevenLabsTranscript = await transcribeWithElevenLabs(lesson.recording_url);
      if (elevenLabsTranscript && elevenLabsTranscript.length > 100) {
        console.log("Using ElevenLabs transcript as fallback, length:", elevenLabsTranscript.length);
        transcriptText = elevenLabsTranscript;
      }
    }

    if (!transcriptText || transcriptText.length < 50) {
      return new Response(
        JSON.stringify({ error: "No transcript available", recording_url: lesson.recording_url ? "exists" : "missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call generate-lesson-insights
    const insightResponse = await fetch(`${supabaseUrl}/functions/v1/generate-lesson-insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        lesson_id: lesson.id,
        transcript: transcriptText,
        subject: subjectName,
        lesson_title: lessonTitle,
        metadata: {
          teacher_name: teacherName,
          student_names: [learnerName],
          lesson_date: new Date(lesson.scheduled_time).toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          }),
          duration_minutes: lesson.duration_minutes,
          surah_name: surahName,
          surah_number: surahNumber,
          ayah_range: ayahRange,
        },
      }),
    });

    if (insightResponse.ok) {
      const result = await insightResponse.json();
      return new Response(
        JSON.stringify({ success: true, ...result, transcript_length: transcriptText.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorText = await insightResponse.text();
      return new Response(
        JSON.stringify({ error: "Failed to generate insights", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
