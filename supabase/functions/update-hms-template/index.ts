import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TEMPLATE_ID = "696bc294a090b0544dfda056"; // Talbiyah Europe workspace

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const managementToken = await getHMSManagementToken();
    console.log("Got HMS management token");

    // Get current template
    const getResponse = await fetch(
      `https://api.100ms.live/v2/templates/${TEMPLATE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${managementToken}`,
        },
      }
    );

    if (!getResponse.ok) {
      const error = await getResponse.text();
      throw new Error(`Failed to get template: ${error}`);
    }

    const template = await getResponse.json();
    console.log("Current template:", template.name);

    // Update template to match working old template settings
    // Key changes: Enable summary, add autoStart for recording
    const updatedDestinations = {
      ...template.destinations,
      browserRecordings: {
        "lesson-recording": {
          name: "lesson-recording",
          role: "__internal_recorder",
          width: 1280,
          height: 720,
          maxDuration: 14400, // 4 hours max (like old template)
          thumbnails: {
            width: 0,
            height: 0
          },
          presignDuration: 259200, // 3 days (like old template)
          autoStart: true, // CRITICAL: Auto-start recording when room starts
          autoStopTimeout: 0
        }
      },
      rtmpDestinations: {},
      hlsDestinations: {},
      transcriptions: {
        "lesson-transcription": {
          name: "lesson-transcription",
          role: "__internal_recorder",
          modes: ["recorded", "live", "caption"],
          outputModes: ["txt", "json", "srt"],
          language: "en",
          customVocabulary: [
            "Quran", "Surah", "Ayah", "Ayaat", "Tajweed", "Tafseer", "Tafsir",
            "Arabic", "Bismillah", "Alhamdulillah", "SubhanAllah", "MashaAllah",
            "InshaAllah", "JazakAllah", "Talbiyah", "Salah", "Wudu", "Dua",
            "Fatiha", "Baqarah", "Imran", "Nisa", "Maida", "Anam", "Araf",
            "Makharij", "Ghunnah", "Idgham", "Ikhfa", "Iqlab", "Izhar",
            "Madd", "Qalqalah", "Tafkheem", "Tarqeeq", "Tanween", "Sukoon"
          ],
          summary: {
            enabled: true, // CRITICAL: Enable summary generation
            context: "This is an Islamic education lesson covering Quran recitation, Arabic language learning, or Islamic studies. Focus on religious terminology, Arabic vocabulary, Quranic verses, and educational content. Transcribe both teacher and student speech.",
            sections: [
              { title: "Topics Covered", format: "bullets" },
              { title: "Key Quranic Verses", format: "bullets" },
              { title: "Arabic Vocabulary", format: "bullets" },
              { title: "Questions and Answers", format: "bullets" },
              { title: "Summary", format: "paragraph" }
            ],
            temperature: 0.5
          }
        }
      }
    };

    // Update the template
    const updateResponse = await fetch(
      `https://api.100ms.live/v2/templates/${TEMPLATE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${managementToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destinations: updatedDestinations,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update template: ${error}`);
    }

    const updatedTemplate = await updateResponse.json();
    console.log("Template updated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Template updated with composite recording and transcription",
        template_id: TEMPLATE_ID,
        browserRecordings: Object.keys(updatedTemplate.destinations?.browserRecordings || {}),
        transcriptions: Object.keys(updatedTemplate.destinations?.transcriptions || {}),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating template:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
