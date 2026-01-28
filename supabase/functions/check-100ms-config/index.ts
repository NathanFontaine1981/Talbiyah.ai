import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL = "https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/handle-recording-webhook";
const EXPECTED_EVENTS = [
  "recording.success",
  "beam.recording.success",
  "transcription.success",
  "transcription.started.success"
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action = "check", fix = false } = await req.json().catch(() => ({}));

    // Generate fresh token (never expires during this request)
    console.log("🔑 Generating fresh 100ms management token...");
    const hmsToken = await getHMSManagementToken();

    const results: any = {
      timestamp: new Date().toISOString(),
      token_status: "✅ Fresh token generated",
      checks: [],
      issues: [],
      fixes_applied: [],
    };

    // 1. Check existing webhooks
    console.log("📡 Checking webhook configuration...");
    const webhooksResponse = await fetch("https://api.100ms.live/v2/webhooks", {
      headers: {
        "Authorization": `Bearer ${hmsToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!webhooksResponse.ok) {
      const errorText = await webhooksResponse.text();
      results.issues.push(`❌ Failed to fetch webhooks: ${webhooksResponse.status} - ${errorText}`);

      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhooksData = await webhooksResponse.json();
    const webhooks = webhooksData.data || webhooksData || [];

    results.existing_webhooks = webhooks.map((w: any) => ({
      id: w.id,
      url: w.url,
      events: w.events,
      enabled: w.enabled,
    }));

    // Check if our webhook exists and is properly configured
    const ourWebhook = webhooks.find((w: any) =>
      w.url === WEBHOOK_URL || w.url?.includes("handle-recording-webhook")
    );

    if (ourWebhook) {
      results.checks.push("✅ Webhook URL is configured");

      // Check if all required events are included
      const missingEvents = EXPECTED_EVENTS.filter(e => !ourWebhook.events?.includes(e));
      if (missingEvents.length > 0) {
        results.issues.push(`⚠️ Missing webhook events: ${missingEvents.join(", ")}`);
      } else {
        results.checks.push("✅ All required webhook events configured");
      }

      if (!ourWebhook.enabled) {
        results.issues.push("❌ Webhook is disabled");
      } else {
        results.checks.push("✅ Webhook is enabled");
      }
    } else {
      results.issues.push("❌ Recording webhook not configured");
    }

    // 2. Check template configuration
    const templateId = Deno.env.get("HMS_TEMPLATE_ID") || "694e3cd62f99d9b901d90528";
    console.log(`📹 Checking template ${templateId}...`);

    const templateResponse = await fetch(`https://api.100ms.live/v2/templates/${templateId}`, {
      headers: {
        "Authorization": `Bearer ${hmsToken}`,
        "Content-Type": "application/json",
      },
    });

    if (templateResponse.ok) {
      const templateData = await templateResponse.json();
      results.template = {
        id: templateId,
        name: templateData.name,
      };

      // Check recording settings
      const settings = templateData.settings || {};
      const recording = settings.recording || {};
      const transcription = settings.transcription || {};

      if (recording.enabled) {
        results.checks.push("✅ Recording is enabled on template");
      } else {
        results.issues.push("❌ Recording is NOT enabled on template");
      }

      if (transcription.enabled) {
        results.checks.push("✅ Transcription is enabled on template");
      } else {
        results.issues.push("❌ Transcription is NOT enabled on template");
      }

      results.template.recording = recording;
      results.template.transcription = transcription;
    } else {
      results.issues.push(`⚠️ Could not fetch template: ${templateResponse.status}`);
    }

    // 3. Apply fixes if requested
    if (fix && results.issues.length > 0) {
      console.log("🔧 Applying fixes...");

      // Fix webhook if missing or misconfigured
      if (!ourWebhook || results.issues.some(i => i.includes("webhook"))) {
        console.log("Creating/updating webhook...");

        const webhookPayload = {
          url: WEBHOOK_URL,
          events: EXPECTED_EVENTS,
          enabled: true,
        };

        const createResponse = await fetch("https://api.100ms.live/v2/webhooks", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hmsToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (createResponse.ok) {
          results.fixes_applied.push("✅ Created/updated webhook configuration");
        } else {
          const errorText = await createResponse.text();
          results.fixes_applied.push(`❌ Failed to create webhook: ${errorText}`);
        }
      }

      // Fix template if recording/transcription not enabled
      if (results.issues.some(i => i.includes("Recording") || i.includes("Transcription"))) {
        console.log("Updating template settings...");

        const templatePayload = {
          settings: {
            recording: {
              enabled: true,
              upload: {
                type: "s3",
                location: "eu-central-1",
              },
            },
            transcription: {
              enabled: true,
              modes: ["recorded"],
              output_modes: ["json", "txt"],
              custom_vocabulary: [
                "Quran", "Surah", "Ayah", "Tajweed", "Makharij", "Sifaat",
                "Allah", "Bismillah", "Alhamdulillah", "SubhanAllah", "Talbiyah",
                "Fatiha", "Baqarah", "Ikhlas", "Falaq", "Nas"
              ],
            },
          },
        };

        const updateResponse = await fetch(`https://api.100ms.live/v2/templates/${templateId}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hmsToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templatePayload),
        });

        if (updateResponse.ok) {
          results.fixes_applied.push("✅ Updated template with recording & transcription enabled");
        } else {
          const errorText = await updateResponse.text();
          results.fixes_applied.push(`❌ Failed to update template: ${errorText}`);
        }
      }
    }

    // Summary
    results.summary = {
      status: results.issues.length === 0 ? "✅ All Good" : "⚠️ Issues Found",
      total_checks: results.checks.length,
      total_issues: results.issues.length,
      fixes_applied: results.fixes_applied.length,
    };

    if (results.issues.length > 0 && !fix) {
      results.recommendation = "Run with {\"fix\": true} to automatically fix issues";
    }

    return new Response(
      JSON.stringify(results, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        hint: "Make sure HMS_APP_ACCESS_KEY and HMS_APP_SECRET are set in Supabase secrets"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
