// Transcribe lesson/course recordings using Google Gemini audio understanding.
// A single verbatim request for a full-length recording reliably fails with
// MALFORMED_RESPONSE (confirmed in testing on ~60min lessons), so this chunks
// the request into ~20-minute time-range prompts against one uploaded file
// and concatenates the results in order.

const GEMINI_MODEL = "gemini-3.5-flash";
const CHUNK_MINUTES = 20;
const MAX_GENERATE_RETRIES = 4;
// Safety valve against a mislabeled/pathological recording spawning dozens
// of sequential chunk calls. 3 hours covers every real class comfortably.
const MAX_TOTAL_MINUTES = 180;
// Above this, refuse to fall back to full in-memory buffering — only the
// streaming upload path is safe at this size.
const SAFE_BUFFER_SIZE_MB = 100;

function formatTimestamp(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function initResumableUpload(contentLength: string, mimeType: string, apiKey: string): Promise<string | null> {
  const initResp = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": contentLength,
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: "recording" } }),
    }
  );
  const uploadUrl = initResp.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    console.error("[gemini] upload init failed:", await initResp.text());
    return null;
  }
  return uploadUrl;
}

async function pollUntilActive(fileInfo: any, apiKey: string): Promise<string | null> {
  const fileUri = fileInfo.file?.uri;
  const fileName = fileInfo.file?.name;
  if (!fileUri || !fileName) return null;

  let state = fileInfo.file.state;
  for (let i = 0; i < 30 && state !== "ACTIVE"; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const check = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
    const checkJson = await check.json();
    state = checkJson.state;
  }
  if (state !== "ACTIVE") {
    console.error(`[gemini] file never became ACTIVE (state=${state})`);
    return null;
  }
  return fileUri;
}

/**
 * Stream the recording directly from its source URL into Gemini's upload
 * endpoint — bytes flow through without ever buffering the whole file in
 * edge-function memory. This is what makes long (>35min) recordings safe;
 * the old buffer-then-upload approach is what caused OOM on those before.
 */
async function uploadAudioStreaming(recordingUrl: string, mimeType: string, apiKey: string): Promise<string | null> {
  const headResp = await fetch(recordingUrl, { method: "HEAD" });
  const contentLength = headResp.headers.get("content-length");
  if (!contentLength) {
    console.log("[gemini] no Content-Length on recording URL, can't stream upload");
    return null;
  }

  const uploadUrl = await initResumableUpload(contentLength, mimeType, apiKey);
  if (!uploadUrl) return null;

  const audioResp = await fetch(recordingUrl);
  if (!audioResp.ok || !audioResp.body) {
    console.error("[gemini] failed to open recording stream:", audioResp.status);
    return null;
  }

  const finishResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": contentLength,
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: audioResp.body,
    // Required by the Fetch spec when the request body is a stream.
    duplex: "half",
  } as any);
  if (!finishResp.ok) {
    console.error("[gemini] streaming upload finalize failed:", finishResp.status, await finishResp.text());
    return null;
  }
  return pollUntilActive(await finishResp.json(), apiKey);
}

/**
 * Fallback: download the whole file into memory, then upload. Only used
 * when streaming isn't available AND the file is small enough to buffer
 * safely — this is the path that already worked in testing for short
 * (<35min) lessons, kept as a safety net if streaming ever misbehaves.
 */
async function uploadAudioBuffered(recordingUrl: string, mimeType: string, apiKey: string): Promise<string | null> {
  const audioResp = await fetch(recordingUrl);
  if (!audioResp.ok) {
    console.error("[gemini] failed to download recording:", audioResp.status);
    return null;
  }
  const audioBytes = new Uint8Array(await audioResp.arrayBuffer());
  console.log(`[gemini] buffered ${(audioBytes.length / 1024 / 1024).toFixed(1)}MB`);

  const uploadUrl = await initResumableUpload(String(audioBytes.length), mimeType, apiKey);
  if (!uploadUrl) return null;

  const finishResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(audioBytes.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: audioBytes,
  });
  if (!finishResp.ok) {
    console.error("[gemini] buffered upload finalize failed:", finishResp.status, await finishResp.text());
    return null;
  }
  return pollUntilActive(await finishResp.json(), apiKey);
}

async function uploadAudioToGemini(recordingUrl: string, mimeType: string, apiKey: string): Promise<string | null> {
  try {
    const streamed = await uploadAudioStreaming(recordingUrl, mimeType, apiKey);
    if (streamed) return streamed;
    console.log("[gemini] streaming upload failed, checking if buffered fallback is safe...");
  } catch (error) {
    console.error("[gemini] streaming upload threw, checking if buffered fallback is safe:", error);
  }

  const headResp = await fetch(recordingUrl, { method: "HEAD" }).catch(() => null);
  const contentLength = headResp?.headers.get("content-length");
  const sizeMB = contentLength ? parseInt(contentLength, 10) / (1024 * 1024) : null;
  if (sizeMB !== null && sizeMB > SAFE_BUFFER_SIZE_MB) {
    console.error(`[gemini] recording is ${sizeMB.toFixed(0)}MB, too large to safely buffer as a fallback — giving up`);
    return null;
  }
  return uploadAudioBuffered(recordingUrl, mimeType, apiKey);
}

// Output budget per call. The MALFORMED_RESPONSE failure we hit on a full
// 60min request came from an unbounded generation; capping this makes the
// model stop cleanly (finishReason: "MAX_TOKENS") with usable partial text
// instead of failing outright — and tells us explicitly when it happened,
// rather than us guessing from audio duration.
const MAX_OUTPUT_TOKENS_PER_CALL = 8192;
// Safety cap on continuation round-trips within one time window, in case
// timestamp extraction ever fails to make progress.
const MAX_CONTINUATIONS_PER_WINDOW = 4;

/** Last "MM:SS" or "H:MM:SS" timestamp mentioned in the text, if any. */
function extractLastTimestamp(text: string): string | null {
  const matches = text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g);
  return matches && matches.length > 0 ? matches[matches.length - 1] : null;
}

async function callGemini(
  fileUri: string,
  mimeType: string,
  prompt: string,
  apiKey: string
): Promise<{ text: string; finishReason: string } | null> {
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { file_data: { file_uri: fileUri, mime_type: mimeType } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS_PER_CALL },
  });

  for (let attempt = 1; attempt <= MAX_GENERATE_RETRIES; attempt++) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body }
    );
    const json = await resp.json();

    if (!json.error) {
      const candidate = json.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p.text).join("") || "";
      const finishReason = candidate?.finishReason || "UNKNOWN";
      // MAX_TOKENS still returns usable partial text — that's the point of
      // capping the budget, so treat it as success, not a failure to retry.
      if (text) return { text, finishReason };
      console.error(`[gemini] no text in response (attempt ${attempt}, finishReason=${finishReason}):`, JSON.stringify(json).slice(0, 300));
    } else if (json.error.status === "UNAVAILABLE" && attempt < MAX_GENERATE_RETRIES) {
      console.log(`[gemini] overloaded (attempt ${attempt}), retrying...`);
    } else {
      console.error(`[gemini] generate error:`, JSON.stringify(json).slice(0, 300));
    }
    await new Promise((r) => setTimeout(r, attempt * 5000));
  }
  return null;
}

/**
 * Transcribe one time window, self-continuing on the model's own output
 * budget rather than a fixed number of calls. If a call is cut off by
 * MAX_TOKENS, the last timestamp it actually reached is pulled from its own
 * output and used to resume precisely — so dense, fast-paced audio gets
 * split into more/smaller calls automatically, and sparse audio (e.g. long
 * silent stretches during recitation) doesn't waste calls on empty ground.
 */
async function transcribeWindow(
  fileUri: string,
  mimeType: string,
  startSec: number,
  endSec: number,
  apiKey: string
): Promise<string | null> {
  const startTs = formatTimestamp(startSec);
  const endTs = formatTimestamp(endSec);
  const parts: string[] = [];
  let resumeFrom = startTs;

  for (let cont = 0; cont <= MAX_CONTINUATIONS_PER_WINDOW; cont++) {
    const prompt = cont === 0
      ? `This is an Islamic education lesson with mixed Arabic (Quranic recitation / Islamic terms) and English speech. Transcribe ONLY the audio from ${startTs} to ${endTs}, verbatim. Render Arabic speech in Arabic script (never transliteration), English speech in English. Prefix each new speaker turn or roughly every minute with its timestamp in MM:SS format. Do not summarize, translate, or continue past ${endTs}. If ${startTs} is past the end of the recording, return nothing.`
      : `Continue the SAME verbatim transcription task from before. Resume exactly from timestamp ${resumeFrom} in the audio — do not repeat anything you already transcribed before that point. Continue up to ${endTs}, same formatting rules as before (Arabic in Arabic script, timestamps in MM:SS).`;

    const result = await callGemini(fileUri, mimeType, prompt, apiKey);
    if (!result) break;
    parts.push(result.text.trim());

    if (result.finishReason !== "MAX_TOKENS") break; // finished this window cleanly

    const lastTs = extractLastTimestamp(result.text);
    if (!lastTs || lastTs === resumeFrom) {
      console.error(`[gemini] window ${startTs}-${endTs} cut off but couldn't extract progress, stopping continuation`);
      break;
    }
    console.log(`[gemini] window ${startTs}-${endTs} hit output cap, continuing from ${lastTs}...`);
    resumeFrom = lastTs;
  }

  return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * Transcribe a lesson/course recording with Gemini. Chunks into ~20-minute
 * windows against one uploaded file. Returns null if the upload fails or
 * every chunk fails — callers should fall back to another transcription
 * source in that case, same as they already do on ElevenLabs failure.
 */
export async function transcribeWithGemini(
  recordingUrl: string,
  durationMinutes: number | null
): Promise<string | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.log("[gemini] GEMINI_API_KEY not configured, skipping");
    return null;
  }

  try {
    // Duration may be unknown (course sessions don't track it) — default to
    // a single 40-minute window since most classes run under that.
    const totalMinutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 40;
    if (totalMinutes > MAX_TOTAL_MINUTES) {
      console.error(`[gemini] recording duration (${totalMinutes}min) exceeds safety cap of ${MAX_TOTAL_MINUTES}min, skipping`);
      return null;
    }

    const fileUri = await uploadAudioToGemini(recordingUrl, "audio/mp4", apiKey);
    if (!fileUri) return null;

    const chunkCount = Math.max(1, Math.ceil(totalMinutes / CHUNK_MINUTES));

    const parts: string[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const startSec = i * CHUNK_MINUTES * 60;
      const endSec = Math.min((i + 1) * CHUNK_MINUTES * 60, totalMinutes * 60 + 120); // +2min buffer past nominal end
      console.log(`[gemini] transcribing window ${i + 1}/${chunkCount} (${formatTimestamp(startSec)}-${formatTimestamp(endSec)})...`);
      const windowText = await transcribeWindow(fileUri, "audio/mp4", startSec, endSec, apiKey);
      if (windowText) parts.push(windowText);
    }

    const combined = parts.join("\n\n");
    console.log(`[gemini] combined transcript length: ${combined.length}`);
    return combined.length > 50 ? combined : null;
  } catch (error) {
    console.error("[gemini] transcription error:", error);
    return null;
  }
}
