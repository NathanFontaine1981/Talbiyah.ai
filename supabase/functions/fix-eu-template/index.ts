import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const EU_TEMPLATE_ID = "695721684f8717ae22337997";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const managementToken = await getHMSManagementToken();
    console.log("Got HMS management token");

    // Get current template first
    const getResponse = await fetch(
      `https://api.100ms.live/v2/templates/${EU_TEMPLATE_ID}`,
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

    const currentTemplate = await getResponse.json();
    console.log("Current template:", currentTemplate.name);

    // Build updated template matching the OLD working template
    const updatedTemplate = {
      // Keep existing destinations but update browserRecordings and transcriptions
      destinations: {
        browserRecordings: {
          "lesson-recording": {
            name: "lesson-recording",
            role: "__internal_recorder",
            width: 1280,
            height: 720,
            maxDuration: 14400,
            thumbnails: { width: 0, height: 0 },
            presignDuration: 259200,
            autoStart: true,
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
              "Quran", "Surah", "Ayah", "Tajweed", "Tafseer", "Arabic",
              "Bismillah", "Alhamdulillah", "SubhanAllah", "MashaAllah",
              "InshaAllah", "Salaf", "Talbiyah"
            ],
            summary: {
              enabled: true,
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
      },
      // Add the CRITICAL plugins configuration for transcription permissions
      plugins: {
        whiteboard: {
          permissions: {
            admin: ["host", "guest"],
            reader: ["__internal_recorder"],
            writer: ["host", "guest"]
          }
        },
        transcriptions: [
          {
            permissions: {
              admin: ["host", "guest"]
            },
            mode: "caption"
          }
        ],
        noiseCancellation: {
          enabled: true
        }
      }
    };

    // Update the template
    const updateResponse = await fetch(
      `https://api.100ms.live/v2/templates/${EU_TEMPLATE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${managementToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTemplate),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update template: ${error}`);
    }

    const result = await updateResponse.json();
    console.log("Template updated successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "EU Template fixed! Added transcription plugins and autoStart recording.",
        template_id: EU_TEMPLATE_ID,
        template_name: result.name,
        changes: [
          "Added autoStart: true to browser recording",
          "Enabled summary generation in transcription",
          "Added transcription plugin with host/guest permissions",
          "Enabled noise cancellation"
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fixing template:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
