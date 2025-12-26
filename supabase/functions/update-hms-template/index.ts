import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TEMPLATE_ID = "694e3cd62f99d9b901d90528";

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

    // Update template with proper browser recording configuration
    // Browser recording captures all participants in a composite view
    const updatedDestinations = {
      ...template.destinations,
      browserRecordings: {
        "composite-recording": {
          name: "composite-recording",
          width: 1920,
          height: 1080,
          maxDuration: 7200, // 2 hours max
          presignDuration: 604800, // 7 days
          role: "__internal_recorder",
          autoStopTimeout: 300, // Stop 5 minutes after last peer leaves
          recording: {
            upload: {
              type: "gs",
              location: "talbiyah-lesson-recordings",
              prefix: "recordings/",
              credentials: {
                key: Deno.env.get("GCS_ACCESS_KEY") || "",
                secretKey: Deno.env.get("GCS_SECRET_KEY") || ""
              },
              options: {
                region: "europe-west2"
              }
            },
            thumbnails: {
              enabled: true,
              width: 1280,
              height: 720,
              offsets: [2, 30, 60]
            }
          }
        }
      },
      // Update transcription to be active and triggered
      transcriptions: {
        "lesson-transcription": {
          name: "lesson-transcription",
          role: "__internal_recorder",
          modes: ["recorded"], // Transcribe the recording
          outputModes: ["txt", "json", "srt"],
          language: "en",
          summary: {
            enabled: true,
            context: "This is an Islamic education lesson covering Quran, Arabic language, or Islamic studies. Focus on religious terminology, Arabic vocabulary, and educational content.",
            sections: [
              { title: "Topics Covered", format: "bullets" },
              { title: "Key Vocabulary", format: "bullets" },
              { title: "Main Takeaways", format: "bullets" },
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
