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

    const recResp = await fetch(`https://api.100ms.live/v2/recordings/${recording_id}`, { headers });
    if (!recResp.ok) {
      return new Response(JSON.stringify({ error: await recResp.text() }), { status: recResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const rec = await recResp.json();

    const assetUrls: any[] = [];
    for (const asset of rec.recording_assets || []) {
      if (asset.status === 'completed') {
        const urlResp = await fetch(`https://api.100ms.live/v2/recording-assets/${asset.id}/presigned-url`, { headers });
        const urlData = urlResp.ok ? await urlResp.json() : { error: await urlResp.text() };
        assetUrls.push({
          id: asset.id,
          type: asset.type,
          output_mode: asset.metadata?.output_mode,
          status: asset.status,
          duration: asset.duration,
          size: asset.size,
          presigned_url: urlData.url || null,
        });
      } else {
        assetUrls.push({
          id: asset.id,
          type: asset.type,
          status: asset.status,
        });
      }
    }

    return new Response(JSON.stringify({ assets: assetUrls }, null, 2), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
