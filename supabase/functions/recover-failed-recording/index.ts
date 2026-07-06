// Recover a course session whose 100ms recording job ended in `failed` status
// because the video composite sub-asset failed, even though a `room-composite`
// audio sub-asset is `completed`. Finds the audio asset, fetches a presigned URL,
// saves it to course_sessions, and kicks off transcribe-url which runs the
// ElevenLabs → generate-course-insights → notify-course-insights chain.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getHMSManagementToken } from "../_shared/hms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface HMSAsset {
  id: string;
  type: string;
  status: string;
  size: number;
  duration: number;
  path?: string;
}

async function listRoomRecordings(roomId: string, hmsToken: string): Promise<{ id: string; status: string; created_at: string }[]> {
  const r = await fetch(`https://api.100ms.live/v2/recordings?room_id=${roomId}&limit=20`, {
    headers: { Authorization: `Bearer ${hmsToken}` },
  });
  if (!r.ok) {
    console.error(`list recordings failed for room ${roomId}: ${r.status} ${await r.text()}`);
    return [];
  }
  const j = await r.json();
  return Array.isArray(j.data) ? j.data : [];
}

async function getRecordingAssets(recordingId: string, hmsToken: string): Promise<HMSAsset[]> {
  const r = await fetch(`https://api.100ms.live/v2/recordings/${recordingId}`, {
    headers: { Authorization: `Bearer ${hmsToken}` },
  });
  if (!r.ok) {
    console.error(`get recording ${recordingId} failed: ${r.status} ${await r.text()}`);
    return [];
  }
  const j = await r.json();
  return Array.isArray(j.recording_assets) ? j.recording_assets : [];
}

async function getPresignedUrl(assetId: string, hmsToken: string): Promise<string | null> {
  const r = await fetch(`https://api.100ms.live/v2/recording-assets/${assetId}/presigned-url`, {
    headers: { Authorization: `Bearer ${hmsToken}` },
  });
  if (!r.ok) {
    console.error(`presigned-url failed for asset ${assetId}: ${r.status} ${await r.text()}`);
    return null;
  }
  const j = await r.json();
  return j.url || null;
}

function pickAudioAsset(assets: HMSAsset[]): HMSAsset | null {
  const candidates = assets.filter(a =>
    a.status === "completed" &&
    (a.type === "room-composite" || a.type === "room-composite-legacy") &&
    a.size > 0,
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.size - a.size);
  return candidates[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { course_session_id, asset_id } = await req.json();
    if (!course_session_id) {
      return new Response(JSON.stringify({ error: "course_session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: session, error: sessionErr } = await supabase
      .from("course_sessions")
      .select("id, room_id, status, transcript")
      .eq("id", course_session_id)
      .single();

    if (sessionErr || !session) {
      return new Response(JSON.stringify({ error: "course_session not found", detail: sessionErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!session.room_id && !asset_id) {
      return new Response(JSON.stringify({ error: "course_session has no room_id and no asset_id provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hmsToken = await getHMSManagementToken();

    let chosen: HMSAsset | null = null;
    if (asset_id) {
      const r = await fetch(`https://api.100ms.live/v2/recording-assets/${asset_id}`, {
        headers: { Authorization: `Bearer ${hmsToken}` },
      });
      if (r.ok) chosen = await r.json();
    } else {
      // Collect every completed audio asset across every recording on this room and
      // pick the largest. A room can have multiple recordings (rejoin / brief test
      // session) so picking the newest can grab a 10-second accidental clip instead
      // of the real class. Largest-by-bytes is the right heuristic.
      const recordings = await listRoomRecordings(session.room_id!, hmsToken);
      const allAudio: HMSAsset[] = [];
      for (const rec of recordings) {
        const assets = await getRecordingAssets(rec.id, hmsToken);
        for (const a of assets) {
          if (
            a.status === "completed" &&
            (a.type === "room-composite" || a.type === "room-composite-legacy") &&
            a.size > 0
          ) {
            allAudio.push(a);
          }
        }
      }
      allAudio.sort((a, b) => b.size - a.size);
      chosen = allAudio[0] || null;
    }

    if (!chosen) {
      return new Response(JSON.stringify({
        error: "no completed room-composite audio asset found",
        room_id: session.room_id,
      }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Picked audio asset: id=${chosen.id} size=${chosen.size} duration=${chosen.duration}`);

    const presignedUrl = await getPresignedUrl(chosen.id, hmsToken);
    if (!presignedUrl) {
      return new Response(JSON.stringify({ error: "failed to fetch presigned url", asset_id: chosen.id }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from("course_sessions")
      .update({
        recording_url: presignedUrl,
        recording_asset_id: chosen.id,
        recording_expires_at: expiresAt.toISOString(),
        live_status: "ended",
        status: "recording",
        updated_at: new Date().toISOString(),
      })
      .eq("id", course_session_id);

    const transcribeResp = await fetch(`${supabaseUrl}/functions/v1/transcribe-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ audio_url: presignedUrl, course_session_id }),
    });

    const transcribeAccepted = transcribeResp.status === 202 || transcribeResp.ok;

    return new Response(JSON.stringify({
      success: true,
      course_session_id,
      asset_id: chosen.id,
      duration_seconds: chosen.duration,
      size_bytes: chosen.size,
      transcribe_started: transcribeAccepted,
      message: transcribeAccepted
        ? "Recording recovered. Transcription and insights generation started in background — check in ~5 min."
        : "Recording recovered, but transcribe-url did not accept. Check function logs.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recover-failed-recording error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message, stack: (e as Error).stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
