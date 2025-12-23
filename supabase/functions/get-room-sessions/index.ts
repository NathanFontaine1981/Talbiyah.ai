import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { room_id } = await req.json();

    if (!room_id) {
      return new Response(
        JSON.stringify({ error: "room_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('🔍 Fetching data for room:', room_id);

    // Generate fresh management token
    const token = await getHMSManagementToken();

    // Get room details
    console.log('📍 Fetching room details...');
    const roomRes = await fetch(`https://api.100ms.live/v2/rooms/${room_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let roomData = null;
    if (roomRes.ok) {
      roomData = await roomRes.json();
      console.log('✅ Room:', roomData);
    } else {
      console.log('⚠️ Room fetch failed:', await roomRes.text());
    }

    // Get sessions for this room
    console.log('📹 Fetching sessions...');
    const sessionsRes = await fetch(`https://api.100ms.live/v2/sessions?room_id=${room_id}&limit=20`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let sessions = [];
    if (sessionsRes.ok) {
      const sessionsData = await sessionsRes.json();
      sessions = sessionsData.data || [];
      console.log('✅ Found', sessions.length, 'sessions');
    }

    // Get recordings for this room
    console.log('🎬 Fetching recordings...');
    const recordingsRes = await fetch(`https://api.100ms.live/v2/recordings?room_id=${room_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let recordings = [];
    if (recordingsRes.ok) {
      const recordingsData = await recordingsRes.json();
      recordings = recordingsData.data || [];
      console.log('✅ Found', recordings.length, 'recordings');
    }

    // Get transcriptions if any
    console.log('📝 Fetching transcriptions...');
    let transcriptions = [];
    for (const session of sessions) {
      const transRes = await fetch(`https://api.100ms.live/v2/transcriptions?session_id=${session.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (transRes.ok) {
        const transData = await transRes.json();
        if (transData.data && transData.data.length > 0) {
          transcriptions.push(...transData.data);
        }
      }
    }
    console.log('✅ Found', transcriptions.length, 'transcriptions');

    return new Response(
      JSON.stringify({
        success: true,
        room: roomData,
        sessions,
        recordings,
        transcriptions
      }, null, 2),
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
