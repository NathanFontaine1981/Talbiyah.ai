import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { recording_id } = await req.json();
    const token = await getHMSManagementToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const endpoints = [
      `https://api.100ms.live/v2/recordings/${recording_id}`,
      `https://api.100ms.live/v2/recording-jobs/${recording_id}`,
      `https://api.100ms.live/v2/recording-assets/${recording_id}`,
    ];

    const results: any = {};
    for (const url of endpoints) {
      try {
        const r = await fetch(url, { headers });
        results[url] = { status: r.status, body: r.ok ? await r.json() : await r.text() };
      } catch (e) {
        results[url] = { error: (e as Error).message };
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
