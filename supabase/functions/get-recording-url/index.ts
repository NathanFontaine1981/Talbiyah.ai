import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RecordingAsset {
  id: string;
  type: string;
  duration: number;
  size: number;
  path: string;
  status: string;
  metadata?: {
    resolution?: { width: number; height: number };
    stream_type?: string;
    peer_id?: string;
    user_id?: string;
  };
  created_at: string;
  presigned_url?: string;
  expires_at?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { lesson_id, room_id, session_id } = await req.json();

    if (!lesson_id && !room_id && !session_id) {
      return new Response(
        JSON.stringify({ error: "Either lesson_id, room_id, or session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let targetRoomId = room_id;
    let targetSessionId = session_id;

    // If lesson_id provided, look up the room_id
    if (lesson_id && !room_id) {
      const { data: lesson, error } = await supabase
        .from('lessons')
        .select('"100ms_room_id"')
        .eq('id', lesson_id)
        .single();

      if (error || !lesson) {
        return new Response(
          JSON.stringify({ error: "Lesson not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      targetRoomId = lesson['100ms_room_id'];
    }

    // Generate 100ms management token dynamically (auto-refreshes, never expires)
    let hmsToken: string;
    try {
      hmsToken = await getHMSManagementToken();
    } catch (tokenError) {
      console.error("Failed to generate 100ms token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to generate 100ms authentication token", details: String(tokenError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we have room_id but not session_id, get the most recent session
    if (targetRoomId && !targetSessionId) {
      // Try to get completed (inactive) sessions first (100ms requires limit between 10-100)
      const sessionsResponse = await fetch(
        `https://api.100ms.live/v2/sessions?room_id=${targetRoomId}&active=false&limit=10`,
        {
          headers: { "Authorization": `Bearer ${hmsToken}` }
        }
      );

      if (!sessionsResponse.ok) {
        const errorText = await sessionsResponse.text();
        console.error("100ms sessions API error:", errorText);

        // Fallback: try to get recording assets directly by room_id
        const assetsResponse = await fetch(
          `https://api.100ms.live/v2/recording-assets?room_id=${targetRoomId}`,
          {
            headers: { "Authorization": `Bearer ${hmsToken}` }
          }
        );

        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          if (assetsData.data && assetsData.data.length > 0) {
            // Get session_id from the first asset
            targetSessionId = assetsData.data[0].session_id;
          }
        }

        if (!targetSessionId) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch sessions from 100ms", details: errorText }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.data && sessionsData.data.length > 0) {
          // Get the most recent session with recordings
          targetSessionId = sessionsData.data[0].id;
        } else {
          // Fallback: try recording-assets endpoint
          const assetsResponse = await fetch(
            `https://api.100ms.live/v2/recording-assets?room_id=${targetRoomId}`,
            {
              headers: { "Authorization": `Bearer ${hmsToken}` }
            }
          );

          if (assetsResponse.ok) {
            const assetsData = await assetsResponse.json();
            if (assetsData.data && assetsData.data.length > 0) {
              targetSessionId = assetsData.data[0].session_id;
            }
          }

          if (!targetSessionId) {
            return new Response(
              JSON.stringify({ error: "No sessions found for this room" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    // Get recording assets for the session
    const assetsResponse = await fetch(
      `https://api.100ms.live/v2/recording-assets?session_id=${targetSessionId}`,
      {
        headers: { "Authorization": `Bearer ${hmsToken}` }
      }
    );

    if (!assetsResponse.ok) {
      const errorText = await assetsResponse.text();
      console.error("100ms assets API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch recording assets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assetsData = await assetsResponse.json();
    const assets: RecordingAsset[] = assetsData.data || [];

    // Filter for completed video assets
    const videoAssets = assets.filter(a =>
      a.status === 'completed' &&
      (a.type === 'stream' || a.type === 'room-composite' || a.type === 'room-vod')
    );

    // Get presigned URLs for each video asset
    const recordingsWithUrls = await Promise.all(
      videoAssets.map(async (asset) => {
        try {
          // Get presigned URL (valid for 24 hours)
          const presignedResponse = await fetch(
            `https://api.100ms.live/v2/recording-assets/${asset.id}/presigned-url?presign_duration=86400`,
            {
              headers: { "Authorization": `Bearer ${hmsToken}` }
            }
          );

          if (presignedResponse.ok) {
            const presignedData = await presignedResponse.json();
            return {
              ...asset,
              presigned_url: presignedData.url,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
          }
        } catch (e) {
          console.error(`Failed to get presigned URL for asset ${asset.id}:`, e);
        }
        return asset;
      })
    );

    // Also get the transcript if available
    const transcriptAsset = assets.find(a => a.type === 'transcript' && a.status === 'completed');
    let transcriptUrl = null;

    if (transcriptAsset) {
      try {
        const transcriptPresignedResponse = await fetch(
          `https://api.100ms.live/v2/recording-assets/${transcriptAsset.id}/presigned-url?presign_duration=86400`,
          {
            headers: { "Authorization": `Bearer ${hmsToken}` }
          }
        );

        if (transcriptPresignedResponse.ok) {
          const transcriptData = await transcriptPresignedResponse.json();
          transcriptUrl = transcriptData.url;
        }
      } catch (e) {
        console.error("Failed to get transcript presigned URL:", e);
      }
    }

    // Calculate recording age for 7-day warning
    const oldestRecording = recordingsWithUrls.length > 0
      ? new Date(recordingsWithUrls[0].created_at)
      : null;

    const daysUntilExpiry = oldestRecording
      ? Math.max(0, 7 - Math.floor((Date.now() - oldestRecording.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    // Find the best video to show (composite or regular stream)
    const compositeVideo = recordingsWithUrls.find(a =>
      a.type === 'room-composite' || a.metadata?.stream_type === 'composite'
    );
    const regularVideo = recordingsWithUrls.find(a =>
      a.type === 'stream' && a.metadata?.stream_type === 'regular'
    );
    const screenShare = recordingsWithUrls.find(a =>
      a.metadata?.stream_type === 'screen'
    );

    return new Response(
      JSON.stringify({
        success: true,
        session_id: targetSessionId,
        room_id: targetRoomId,
        recordings: {
          primary: compositeVideo || regularVideo,
          screen_share: screenShare,
          all: recordingsWithUrls
        },
        transcript_url: transcriptUrl,
        days_until_expiry: daysUntilExpiry,
        expires_warning: daysUntilExpiry !== null && daysUntilExpiry <= 2
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching recording:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
