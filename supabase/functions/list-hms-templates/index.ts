import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getHMSManagementToken } from "../_shared/hms.ts"

const EU_TEMPLATE_ID = "695721684f8717ae22337997";

serve(async (req) => {
  let HMS_MANAGEMENT_TOKEN: string
  try {
    HMS_MANAGEMENT_TOKEN = await getHMSManagementToken()
    console.log('🔑 Generated fresh HMS token automatically')
  } catch (error: any) {
    console.error('❌ Failed to generate HMS token:', error.message)
    return new Response(JSON.stringify({
      error: 'Failed to generate HMS token',
      details: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }

  try {
    // Check if this is a fix request
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body, just list templates
    }

    // If action is "fix", update the EU template
    if (body.action === "fix") {
      console.log("Fixing EU template...");

      const updatedTemplate = {
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
                context: "This is an Islamic education lesson covering Quran recitation, Arabic language learning, or Islamic studies.",
                sections: [
                  { title: "Topics Covered", format: "bullets" },
                  { title: "Key Quranic Verses", format: "bullets" },
                  { title: "Arabic Vocabulary", format: "bullets" },
                  { title: "Summary", format: "paragraph" }
                ],
                temperature: 0.5
              }
            }
          }
        },
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

      const updateResponse = await fetch(
        `https://api.100ms.live/v2/templates/${EU_TEMPLATE_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HMS_MANAGEMENT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTemplate),
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to update template: ${error}`
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        });
      }

      const result = await updateResponse.json();
      return new Response(JSON.stringify({
        success: true,
        message: "EU Template fixed!",
        template_id: EU_TEMPLATE_ID,
        template_name: result.name,
        changes: [
          "Added autoStart: true to browser recording",
          "Enabled summary generation in transcription",
          "Added transcription plugin with host/guest permissions",
          "Enabled noise cancellation"
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default: list templates
    const response = await fetch('https://api.100ms.live/v2/templates', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({
        error: 'Failed to fetch templates',
        status: response.status,
        details: errorText
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: response.status
      })
    }

    const data = await response.json()
    console.log('Templates:', JSON.stringify(data, null, 2))

    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
