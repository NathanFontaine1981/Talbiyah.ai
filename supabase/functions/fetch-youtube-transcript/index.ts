import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch transcript using YouTube's timedtext API
async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  // First, get the video page to extract caption tracks
  const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoPageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch video page');
  }

  const html = await response.text();

  // Extract caption tracks from the page data
  const captionRegex = /"captionTracks":(\[.*?\])/;
  const match = html.match(captionRegex);

  if (!match) {
    // Try alternative pattern for older pages
    const altRegex = /playerCaptionsTracklistRenderer.*?"captionTracks":(\[.*?\])/;
    const altMatch = html.match(altRegex);
    if (!altMatch) {
      throw new Error('No captions available for this video');
    }
  }

  let captionTracks;
  try {
    // Find the captions data in the page
    const ytInitialPlayerResponse = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
    if (!ytInitialPlayerResponse) {
      throw new Error('Could not find player response');
    }

    const playerData = JSON.parse(ytInitialPlayerResponse[1]);
    captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions available for this video');
    }
  } catch (e) {
    throw new Error('No captions available for this video');
  }

  // Prefer English captions, fallback to first available
  const englishTrack = captionTracks.find(
    (track: { languageCode: string }) =>
      track.languageCode === 'en' || track.languageCode.startsWith('en')
  );
  const selectedTrack = englishTrack || captionTracks[0];

  if (!selectedTrack?.baseUrl) {
    throw new Error('No caption URL found');
  }

  // Fetch the actual transcript
  const transcriptResponse = await fetch(selectedTrack.baseUrl + '&fmt=json3');

  if (!transcriptResponse.ok) {
    throw new Error('Failed to fetch transcript data');
  }

  const transcriptData = await transcriptResponse.json();

  // Parse the transcript events
  const events = transcriptData.events || [];
  const segments: TranscriptSegment[] = [];

  for (const event of events) {
    if (event.segs) {
      const text = event.segs
        .map((seg: { utf8: string }) => seg.utf8)
        .join('')
        .trim();

      if (text) {
        segments.push({
          text,
          start: event.tStartMs / 1000,
          duration: (event.dDurationMs || 0) / 1000,
        });
      }
    }
  }

  // Combine into readable transcript
  const fullTranscript = segments
    .map(seg => seg.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return fullTranscript;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoUrl, videoId: providedVideoId } = await req.json();

    // Extract video ID from URL or use provided ID
    const videoId = providedVideoId || extractVideoId(videoUrl || '');

    if (!videoId) {
      return new Response(
        JSON.stringify({
          error: 'Invalid video URL or ID',
          message: 'Please provide a valid YouTube URL or video ID'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching transcript for video: ${videoId}`);

    const transcript = await fetchYouTubeTranscript(videoId);

    if (!transcript || transcript.length < 50) {
      return new Response(
        JSON.stringify({
          error: 'Transcript too short or empty',
          message: 'The video may not have captions or they are not accessible'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully fetched transcript: ${transcript.length} characters`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        transcript,
        length: transcript.length,
        source: 'youtube_auto'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching transcript:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch transcript',
        message: errorMessage,
        suggestion: 'You can manually paste the transcript instead'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
