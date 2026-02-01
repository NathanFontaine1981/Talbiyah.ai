import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Transcribe a single chunk of audio with ElevenLabs
async function transcribeChunk(audioBlob: Blob, elevenLabsApiKey: string, chunkName: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.mp4");
    formData.append("model_id", "scribe_v1");
    formData.append("language_code", "ara");
    formData.append("tag_audio_events", "false");
    formData.append("diarize", "true");

    console.log(`Sending ${chunkName} to ElevenLabs Scribe API (${(audioBlob.size / 1024 / 1024).toFixed(1)}MB)...`);

    const scribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": elevenLabsApiKey },
      body: formData,
    });

    if (!scribeResponse.ok) {
      const errorText = await scribeResponse.text();
      console.error(`ElevenLabs error for ${chunkName}:`, scribeResponse.status, errorText);
      return null;
    }

    const scribeResult = await scribeResponse.json();

    // Format transcript with speaker labels if available
    if (scribeResult.words && Array.isArray(scribeResult.words)) {
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

    return scribeResult.text || null;
  } catch (error) {
    console.error(`Error transcribing ${chunkName}:`, error);
    return null;
  }
}

// Remove duplicate sentences between two transcript parts
function deduplicateTranscripts(first: string, second: string): string {
  const firstWords = first.split(/\s+/).slice(-50); // Last 50 words of first
  const secondWords = second.split(/\s+/);

  // Find overlap - look for where first's ending appears in second's beginning
  for (let overlapSize = Math.min(40, firstWords.length); overlapSize >= 5; overlapSize--) {
    const endOfFirst = firstWords.slice(-overlapSize).join(" ").toLowerCase();
    const startOfSecond = secondWords.slice(0, overlapSize).join(" ").toLowerCase();

    if (endOfFirst === startOfSecond) {
      console.log(`Found ${overlapSize} word overlap, removing duplicate`);
      // Remove the overlapping portion from the second transcript
      return first + "\n\n" + secondWords.slice(overlapSize).join(" ");
    }
  }

  // No overlap found, just combine with separator
  return first + "\n\n--- [Middle Section] ---\n\n" + second;
}

// Chunked transcription for large files using HTTP Range requests
// Downloads file in parts to avoid memory issues, transcribes each part
async function transcribeWithElevenLabsChunked(recordingUrl: string): Promise<string | null> {
  const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!elevenLabsApiKey) {
    console.log("ElevenLabs API key not configured");
    return null;
  }

  try {
    // Get file size
    console.log("Checking recording file size for chunked transcription...");
    const headResponse = await fetch(recordingUrl, { method: 'HEAD' });
    const totalSize = parseInt(headResponse.headers.get('content-length') || '0', 10);
    const fileSizeMB = totalSize / (1024 * 1024);

    console.log(`Recording size: ${fileSizeMB.toFixed(1)} MB`);

    // Check if server supports range requests
    const acceptRanges = headResponse.headers.get('accept-ranges');
    if (acceptRanges !== 'bytes') {
      console.log("Server doesn't support range requests, cannot chunk");
      return null;
    }

    const CHUNK_SIZE = 80 * 1024 * 1024; // 80MB chunks
    const transcripts: string[] = [];

    // Chunk 1: First portion (0 to 80MB) - Contains intro, opening, first teaching
    console.log("Downloading first chunk (intro + first portion)...");
    const chunk1End = Math.min(CHUNK_SIZE, totalSize - 1);
    const chunk1Response = await fetch(recordingUrl, {
      headers: { 'Range': `bytes=0-${chunk1End}` }
    });

    if (chunk1Response.ok || chunk1Response.status === 206) {
      const chunk1Blob = await chunk1Response.blob();
      console.log(`First chunk downloaded: ${(chunk1Blob.size / 1024 / 1024).toFixed(1)}MB`);

      const transcript1 = await transcribeChunk(chunk1Blob, elevenLabsApiKey, "first chunk");
      if (transcript1 && transcript1.length > 50) {
        transcripts.push("=== OPENING & FIRST PORTION ===\n" + transcript1);
      }
    }

    // Chunk 2: Middle portion (from ~45% of file) - Contains main teaching
    if (totalSize > CHUNK_SIZE * 1.5) {
      const chunk2Start = Math.floor(totalSize * 0.45);
      const chunk2End = Math.min(chunk2Start + CHUNK_SIZE, totalSize - 1);

      console.log(`Downloading middle chunk (${(chunk2Start / 1024 / 1024).toFixed(0)}MB - ${(chunk2End / 1024 / 1024).toFixed(0)}MB)...`);

      const chunk2Response = await fetch(recordingUrl, {
        headers: { 'Range': `bytes=${chunk2Start}-${chunk2End}` }
      });

      if (chunk2Response.ok || chunk2Response.status === 206) {
        const chunk2Blob = await chunk2Response.blob();
        console.log(`Middle chunk downloaded: ${(chunk2Blob.size / 1024 / 1024).toFixed(1)}MB`);

        const transcript2 = await transcribeChunk(chunk2Blob, elevenLabsApiKey, "middle chunk");
        if (transcript2 && transcript2.length > 50) {
          transcripts.push("=== MAIN TEACHING PORTION ===\n" + transcript2);
        }
      }
    }

    if (transcripts.length === 0) {
      console.log("No chunks were successfully transcribed");
      return null;
    }

    // Combine transcripts
    if (transcripts.length === 1) {
      return transcripts[0];
    }

    // Deduplicate and combine
    const combined = deduplicateTranscripts(transcripts[0], transcripts[1]);
    console.log(`Combined transcript length: ${combined.length} chars`);

    return combined;
  } catch (error) {
    console.error("Chunked transcription error:", error);
    return null;
  }
}

// ElevenLabs transcription for Arabic/Quran content (much better accuracy)
// Best for lessons ≤35 minutes where file size is manageable
async function transcribeWithElevenLabs(recordingUrl: string, maxFileSizeMB: number = 100): Promise<string | null> {
  const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!elevenLabsApiKey) {
    console.log("ElevenLabs API key not configured");
    return null;
  }

  try {
    // Check file size first to avoid memory issues
    console.log("Checking recording file size...");
    const headResponse = await fetch(recordingUrl, { method: 'HEAD' });
    const contentLength = parseInt(headResponse.headers.get('content-length') || '0', 10);
    const fileSizeMB = contentLength / (1024 * 1024);

    console.log(`Recording size: ${fileSizeMB.toFixed(1)} MB`);

    if (fileSizeMB > maxFileSizeMB) {
      console.log(`File too large (${fileSizeMB.toFixed(1)}MB > ${maxFileSizeMB}MB), skipping ElevenLabs`);
      return null; // Signal to use AssemblyAI instead
    }

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

    // OPTIMIZATION: Check for cached transcript first to avoid slow re-transcription
    console.log("Checking for cached transcript...");
    const { data: existingInsights } = await supabase
      .from("lesson_insights")
      .select("raw_transcript")
      .eq("lesson_id", lesson_id)
      .maybeSingle();

    if (existingInsights?.raw_transcript && existingInsights.raw_transcript.length > 100) {
      console.log(`✅ Using cached transcript (${existingInsights.raw_transcript.length} chars) - skipping re-transcription`);
      transcriptText = existingInsights.raw_transcript;
    }

    // Only transcribe if we don't have a cached transcript
    if (!transcriptText || transcriptText.length < 100) {
    // Detect if this is Arabic/Quran content (ElevenLabs is much better for this)
    const isArabicContent = subjectName.toLowerCase().includes("quran") ||
      subjectName.toLowerCase().includes("arabic") ||
      subjectName.toLowerCase().includes("tajweed") ||
      subjectName.toLowerCase().includes("surah") ||
      !!surahName || !!surahNumber;

    // Determine if lesson is "long" (>35 min) - these need special handling
    const isLongLesson = lesson.duration_minutes && lesson.duration_minutes > 35;

    console.log("Content type detection:", { isArabicContent, subjectName, duration: lesson.duration_minutes, isLongLesson });

    // For long lessons (>35 min), use 100ms transcript first (no file download = no memory issues)
    // For short lessons with Arabic content, use ElevenLabs first (best quality)
    if (isLongLesson && lesson["100ms_room_id"]) {
      console.log(`Long lesson (${lesson.duration_minutes} min) - fetching 100ms transcript first (no download needed)...`);
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
                    console.log("Got 100ms transcript for long lesson, length:", transcriptText.length);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("100ms error for long lesson:", e);
      }
    } else if (isArabicContent && lesson.recording_url && !isLongLesson) {
      // Short Arabic lessons: Use ElevenLabs (best Arabic quality, file size is manageable)
      console.log("Arabic/Quran content detected - using ElevenLabs Scribe as PRIMARY transcription...");
      const elevenLabsTranscript = await transcribeWithElevenLabs(lesson.recording_url);
      if (elevenLabsTranscript && elevenLabsTranscript.length > 100) {
        console.log("Using ElevenLabs transcript (best for Arabic), length:", elevenLabsTranscript.length);
        transcriptText = elevenLabsTranscript;
      } else {
        console.log("ElevenLabs failed or too short, will try 100ms as fallback");
      }
    }

    // Try to get transcript from 100ms API (fallback for short lessons, or primary for non-Arabic)
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

    // If 100ms transcript is missing/short, try ElevenLabs as fallback
    if ((!transcriptText || transcriptText.length < 100) && lesson.recording_url) {
      // Check file size to decide between regular or chunked transcription
      const headResponse = await fetch(lesson.recording_url, { method: 'HEAD' });
      const fileSize = parseInt(headResponse.headers.get('content-length') || '0', 10);
      const fileSizeMB = fileSize / (1024 * 1024);

      if (fileSizeMB > 100) {
        // Large file: Use chunked transcription
        console.log(`Large file (${fileSizeMB.toFixed(0)}MB) - using chunked ElevenLabs transcription...`);
        const chunkedTranscript = await transcribeWithElevenLabsChunked(lesson.recording_url);
        if (chunkedTranscript && chunkedTranscript.length > 100) {
          console.log("Using chunked ElevenLabs transcript, length:", chunkedTranscript.length);
          transcriptText = chunkedTranscript;
        }
      } else {
        // Small file: Use regular transcription
        console.log("100ms transcript insufficient, trying ElevenLabs as fallback...");
        const elevenLabsTranscript = await transcribeWithElevenLabs(lesson.recording_url);
        if (elevenLabsTranscript && elevenLabsTranscript.length > 100) {
          console.log("Using ElevenLabs transcript as fallback, length:", elevenLabsTranscript.length);
          transcriptText = elevenLabsTranscript;
        }
      }
    }
    } // End of: if (!transcriptText || transcriptText.length < 100)

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
