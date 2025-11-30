import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { room_id, recording_id } = await req.json();

    if (!room_id && !recording_id) {
      return new Response(
        JSON.stringify({ error: "room_id or recording_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Fetching transcript for room:', room_id, 'recording:', recording_id);

    // Generate fresh management token
    const token = await getHMSManagementToken();

    // Build query URL - filter by type=transcript to find transcript assets
    let assetsUrl = 'https://api.100ms.live/v2/recording-assets';
    const params = ['type=transcript'];
    if (room_id) params.push(`room_id=${room_id}`);
    if (recording_id) params.push(`job_id=${recording_id}`);
    assetsUrl += '?' + params.join('&');

    // Get recording assets
    console.log('📦 Fetching recording assets from:', assetsUrl);
    const assetsRes = await fetch(assetsUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!assetsRes.ok) {
      const error = await assetsRes.text();
      console.error('Failed to fetch assets:', error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch recording assets", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assetsData = await assetsRes.json();
    console.log('Found', assetsData.data?.length || 0, 'assets');
    console.log('Asset data:', JSON.stringify(assetsData.data?.slice(0, 3)));

    // Get the first transcript asset (or the one matching recording_id)
    const transcriptAsset = assetsData.data?.[0];

    if (!transcriptAsset) {
      console.log('No transcript asset found');
      return new Response(
        JSON.stringify({
          success: false,
          message: "No transcript found for this recording",
          assets: assetsData.data?.map((a: { id: string; type: string }) => ({ id: a.id, type: a.type }))
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Found transcript asset:', transcriptAsset.id);

    // Get presigned URL for transcript
    const urlRes = await fetch(`https://api.100ms.live/v2/recording-assets/${transcriptAsset.id}/presigned-url`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!urlRes.ok) {
      const error = await urlRes.text();
      console.error('Failed to get presigned URL:', error);
      return new Response(
        JSON.stringify({ error: "Failed to get transcript URL", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const urlData = await urlRes.json();
    console.log('📄 Got presigned URL, fetching transcript content...');

    // Fetch transcript content
    const transcriptRes = await fetch(urlData.url);
    const contentType = transcriptRes.headers.get('content-type');

    let transcriptContent;
    if (contentType?.includes('json')) {
      transcriptContent = await transcriptRes.json();
    } else {
      transcriptContent = await transcriptRes.text();
    }

    console.log('✅ Transcript fetched successfully');

    return new Response(
      JSON.stringify({
        success: true,
        transcript_asset_id: transcriptAsset.id,
        content_type: contentType,
        transcript: transcriptContent
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
