import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { room_id } = await req.json();
    if (!room_id) {
      return new Response(JSON.stringify({ error: "room_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = await getHMSManagementToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // 1. Get room details
    const roomResp = await fetch(`https://api.100ms.live/v2/rooms/${room_id}`, { headers });
    const room = roomResp.ok ? await roomResp.json() : { error: await roomResp.text() };

    // 2. Get sessions for this room
    const sessionsResp = await fetch(`https://api.100ms.live/v2/sessions?room_id=${room_id}`, { headers });
    const sessions = sessionsResp.ok ? await sessionsResp.json() : { error: await sessionsResp.text() };

    // 3. For each session, get recording assets
    const sessionAssets = [];
    if (sessions.data && Array.isArray(sessions.data)) {
      for (const session of sessions.data) {
        // Get all asset types - recording, transcript, summary
        const assetTypes = ['', 'recording', 'transcript', 'summary'];
        const assetsBytype = {};
        for (const type of assetTypes) {
          const url = type
            ? `https://api.100ms.live/v2/recording-assets?session_id=${session.id}&type=${type}`
            : `https://api.100ms.live/v2/recording-assets?session_id=${session.id}`;
          const resp = await fetch(url, { headers });
          if (resp.ok) {
            const data = await resp.json();
            assetsBytype[type || 'all'] = data.data || [];
          } else {
            assetsBytype[type || 'all'] = { error: await resp.text() };
          }
        }
        // Get peers from session
        const peersResp = await fetch(`https://api.100ms.live/v2/sessions/${session.id}/peers`, { headers });
        const peers = peersResp.ok ? await peersResp.json() : { error: await peersResp.text() };

        // Get recordings via the recordings endpoint
        const recsResp = await fetch(`https://api.100ms.live/v2/recordings?session_id=${session.id}`, { headers });
        const recs = recsResp.ok ? await recsResp.json() : { error: await recsResp.text() };

        sessionAssets.push({
          session_id: session.id,
          created_at: session.created_at,
          updated_at: session.updated_at,
          active: session.active,
          peers_count: peers.data?.length || 0,
          peers: peers.data || peers,
          recording_assets: assetsBytype,
          recordings: recs,
        });
      }
    }

    return new Response(JSON.stringify({
      room,
      sessions: sessions.data || sessions,
      session_assets: sessionAssets,
    }, null, 2), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
