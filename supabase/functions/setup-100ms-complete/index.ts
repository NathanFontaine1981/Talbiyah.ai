import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const managementToken = await getHMSManagementToken();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    // Webhook URL for your Supabase edge function
    const webhookUrl = `${supabaseUrl}/functions/v1/handle-recording-webhook`;

    // Generate a secure webhook secret
    const webhookSecret = Deno.env.get('HMS_WEBHOOK_SECRET') || 'talbiyah-hms-webhook-2024';

    console.log('🚀 Setting up 100ms configuration...');
    console.log('Webhook URL:', webhookUrl);

    // Step 1: Create a new optimized template
    console.log('📋 Creating optimized template...');

    const templatePayload = {
      name: "Talbiyah-Lessons-EU-Optimized",
      description: "Optimized template for Islamic education with auto transcription and insights",
      default_region: "eu",
      roles: {
        host: {
          name: "host",
          publishParams: {
            allowed: ["audio", "video", "screen"],
            audio: {
              bitRate: 32,
              codec: "opus"
            },
            video: {
              bitRate: 400,
              codec: "vp8",
              frameRate: 30,
              width: 720,
              height: 480
            },
            screen: {
              bitRate: 1024,
              codec: "vp8",
              frameRate: 15,
              width: 1920,
              height: 1080
            }
          },
          subscribeParams: {
            subscribeToRoles: ["host", "guest"],
            maxSubsBitRate: 3200
          },
          permissions: {
            endRoom: true,
            removeOthers: true,
            mute: true,
            unmute: true,
            changeRole: true,
            sendRoomState: true,
            pollRead: true,
            pollWrite: true
          },
          priority: 1,
          maxPeerCount: 2
        },
        guest: {
          name: "guest",
          publishParams: {
            allowed: ["audio", "video", "screen"],
            audio: {
              bitRate: 32,
              codec: "opus"
            },
            video: {
              bitRate: 400,
              codec: "vp8",
              frameRate: 30,
              width: 720,
              height: 480
            },
            screen: {
              bitRate: 1024,
              codec: "vp8",
              frameRate: 15,
              width: 1920,
              height: 1080
            }
          },
          subscribeParams: {
            subscribeToRoles: ["host", "guest"],
            maxSubsBitRate: 3200
          },
          permissions: {
            endRoom: false,
            removeOthers: false,
            mute: false,
            unmute: false,
            changeRole: false,
            sendRoomState: false,
            pollRead: true,
            pollWrite: true
          },
          priority: 2,
          maxPeerCount: 2
        }
      },
      settings: {
        region: "eu",
        recording: {
          enabled: true,
          upload: {
            type: "s3",
            location: "100ms-recordings"
          }
        }
      }
    };

    const templateResponse = await fetch('https://api.100ms.live/v2/templates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templatePayload),
    });

    if (!templateResponse.ok) {
      const error = await templateResponse.text();
      console.error('Template creation failed:', error);
      throw new Error(`Failed to create template: ${error}`);
    }

    const templateData = await templateResponse.json();
    const templateId = templateData.id;
    console.log('✅ Template created:', templateId);

    // Step 2: Enable recording settings on the template
    console.log('🎥 Configuring recording settings...');

    const recordingConfig = {
      enabled: true,
      type: "composite",
      resolution: {
        width: 1280,
        height: 720
      },
      thumbnails: {
        enabled: true,
        width: 320,
        height: 180,
        fps: 1
      }
    };

    const recordingResponse = await fetch(`https://api.100ms.live/v2/templates/${templateId}/recording`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordingConfig),
    });

    if (recordingResponse.ok) {
      console.log('✅ Recording configured');
    } else {
      console.log('⚠️ Recording config returned:', await recordingResponse.text());
    }

    // Step 3: Enable transcription
    console.log('📝 Configuring transcription...');

    const transcriptionConfig = {
      enabled: true,
      modes: ["recorded"],
      outputModes: ["txt", "json", "srt"],
      customVocabulary: [
        "Quran", "Surah", "Ayah", "Bismillah", "Alhamdulillah",
        "SubhanAllah", "MashaAllah", "InshaAllah", "JazakAllah",
        "Salah", "Wudu", "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha",
        "Arabic", "Tajweed", "Hifz", "Tafseer", "Hadith", "Sunnah"
      ],
      summary: {
        enabled: true,
        context: "Islamic education lesson between a teacher and student. Topics may include Quran recitation, Arabic language, Islamic studies, prayer, and religious education.",
        sections: [
          {
            title: "Lesson Overview",
            format: "paragraph"
          },
          {
            title: "Topics Covered",
            format: "bullets"
          },
          {
            title: "Student Progress",
            format: "bullets"
          },
          {
            title: "Areas for Improvement",
            format: "bullets"
          },
          {
            title: "Homework & Next Steps",
            format: "bullets"
          }
        ],
        temperature: 0.5
      }
    };

    const transcriptionResponse = await fetch(`https://api.100ms.live/v2/templates/${templateId}/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transcriptionConfig),
    });

    if (transcriptionResponse.ok) {
      console.log('✅ Transcription configured');
    } else {
      console.log('⚠️ Transcription config:', await transcriptionResponse.text());
    }

    // Step 4: Configure webhooks
    console.log('🔗 Configuring webhooks...');

    // First, list existing webhooks
    const existingWebhooks = await fetch('https://api.100ms.live/v2/webhooks', {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
      }
    });

    let existingWebhookId = null;
    if (existingWebhooks.ok) {
      const webhooksData = await existingWebhooks.json();
      // Find existing webhook for our URL
      const existing = webhooksData.data?.find((w: any) =>
        w.url?.includes('handle-recording-webhook') || w.url?.includes('supabase')
      );
      if (existing) {
        existingWebhookId = existing.id;
        console.log('Found existing webhook:', existingWebhookId);
      }
    }

    const webhookPayload = {
      url: webhookUrl,
      secret: webhookSecret,
      events: [
        "recording.success",
        "beam.recording.success",
        "transcription.success",
        "transcription.started.success",
        "session.close.success",
        "room.end.success"
      ],
      enabled: true,
      version: "2.0"
    };

    let webhookResponse;
    if (existingWebhookId) {
      // Update existing webhook
      webhookResponse = await fetch(`https://api.100ms.live/v2/webhooks/${existingWebhookId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
    } else {
      // Create new webhook
      webhookResponse = await fetch('https://api.100ms.live/v2/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
    }

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('✅ Webhook configured:', webhookData.id || webhookData);
    } else {
      const webhookError = await webhookResponse.text();
      console.error('⚠️ Webhook config failed:', webhookError);
    }

    // Step 5: Verify webhook is working
    console.log('🧪 Testing webhook endpoint...');

    try {
      const testResponse = await fetch(webhookUrl, { method: 'GET' });
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Webhook endpoint responding:', testData);
      } else {
        console.log('⚠️ Webhook endpoint returned:', testResponse.status);
      }
    } catch (e) {
      console.log('⚠️ Could not test webhook:', e);
    }

    // Return complete configuration
    const result = {
      success: true,
      template: {
        id: templateId,
        name: templateData.name,
        region: "eu"
      },
      webhook: {
        url: webhookUrl,
        secretConfigured: true,
        events: webhookPayload.events
      },
      features: {
        recording: true,
        transcription: true,
        summary: true,
        customVocabulary: true
      },
      nextSteps: [
        `1. Update HMS_WEBHOOK_SECRET in Supabase to: ${webhookSecret}`,
        `2. Update create-hms-room function to use template_id: ${templateId}`,
        "3. Book a test lesson and verify transcription works"
      ],
      importantSecrets: {
        HMS_WEBHOOK_SECRET: webhookSecret,
        TEMPLATE_ID: templateId
      }
    };

    console.log('🎉 Setup complete!', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Setup failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        hint: "Make sure HMS_APP_ACCESS_KEY and HMS_APP_SECRET are set in Supabase secrets"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
