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
    const { room_id, session_id } = await req.json();
    const token = await getHMSManagementToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // Get session details
    const sessResp = await fetch(`https://api.100ms.live/v2/sessions/${session_id}`, { headers });
    const session = sessResp.ok ? await sessResp.json() : { error: await sessResp.text(), status: sessResp.status };

    // Get peer history events for this session
    const eventsResp = await fetch(`https://api.100ms.live/v2/analytics/events?session_id=${session_id}&limit=100`, { headers });
    const events = eventsResp.ok ? await eventsResp.json() : { error: await eventsResp.text(), status: eventsResp.status };

    // Get peer-events
    const peersResp = await fetch(`https://api.100ms.live/v2/sessions/${session_id}/peers`, { headers });
    const peers = peersResp.ok ? await peersResp.json() : { error: await peersResp.text() };

    // Get active recordings for room
    const activeRec = await fetch(`https://api.100ms.live/v2/recordings?room_id=${room_id}`, { headers });
    const allRecs = activeRec.ok ? await activeRec.json() : { error: await activeRec.text() };

    return new Response(JSON.stringify({ session, events, peers, all_recordings: allRecs }, null, 2), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
