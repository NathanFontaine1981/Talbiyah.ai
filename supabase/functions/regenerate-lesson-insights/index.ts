import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Try to get transcript from 100ms API
    if (lesson["100ms_room_id"]) {
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

    // Use ElevenLabs if no transcript OR transcript too short (100ms often fails for Arabic)
    if ((!transcriptText || transcriptText.length < 500) && lesson.recording_url) {
      console.log("Trying ElevenLabs transcription...");
      const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");

      if (elevenLabsApiKey) {
        try {
          const audioResponse = await fetch(lesson.recording_url);
          if (audioResponse.ok) {
            const audioBlob = await audioResponse.blob();
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.mp4");
            formData.append("model_id", "scribe_v1");
            // Don't set language_code - let ElevenLabs auto-detect for mixed Arabic/English
            formData.append("diarize", "true");

            const transcribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
              method: "POST",
              headers: { "xi-api-key": elevenLabsApiKey },
              body: formData,
            });

            if (transcribeResponse.ok) {
              const result = await transcribeResponse.json();
              transcriptText = result.text || result.transcript || "";
              console.log("ElevenLabs transcript, length:", transcriptText.length);
            }
          }
        } catch (e) {
          console.error("ElevenLabs error:", e);
        }
      }
    }

    if (!transcriptText || transcriptText.length < 50) {
      return new Response(
        JSON.stringify({ error: "No transcript available" }),
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
