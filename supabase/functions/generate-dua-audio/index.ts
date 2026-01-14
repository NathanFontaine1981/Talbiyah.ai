import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ElevenLabs voice IDs - using multilingual voices that work well with Arabic
const VOICES = {
  // Arabic/Islamic content - deep, reverent male voice
  arabic: 'onwK4e9ZLuTAKqWW03F9', // Daniel - works well with Arabic
  // English translations - clear female voice
  english: 'EXAVITQu4vr4xnSDxMaL', // Sarah - clear pronunciation
  // Alternative Arabic voice
  arabic_alt: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - multilingual
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY not set');
      throw new Error('ElevenLabs API key not configured');
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { text, voice, language } = body;
    console.log(`Received text length: ${text?.length || 0} chars, language: ${language || 'not specified'}`);

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    // ElevenLabs has a 5000 character limit for the standard plan
    const MAX_CHARS = 5000;
    let processedText = text.trim();
    if (processedText.length > MAX_CHARS) {
      const truncated = processedText.substring(0, MAX_CHARS);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastArabicStop = truncated.lastIndexOf('۔');
      const lastBreak = Math.max(lastPeriod, lastArabicStop);
      processedText = lastBreak > MAX_CHARS * 0.7
        ? truncated.substring(0, lastBreak + 1)
        : truncated;
      console.log(`Text truncated from ${text.length} to ${processedText.length} characters`);
    }

    // Voice selection
    let selectedVoiceId = voice;
    if (!selectedVoiceId) {
      if (language === 'arabic') {
        selectedVoiceId = VOICES.arabic;
      } else if (language === 'english') {
        selectedVoiceId = VOICES.english;
      } else {
        selectedVoiceId = VOICES.arabic; // Default for Islamic content
      }
    }

    console.log(`Using ElevenLabs with voice: ${selectedVoiceId}`);

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: processedText,
          model_id: 'eleven_multilingual_v2', // Best for Arabic
          voice_settings: {
            stability: 0.75, // Higher stability for clear recitation
            similarity_boost: 0.75,
            style: 0.5, // Some expressiveness
            use_speaker_boost: true
          }
        }),
      }
    );

    console.log(`ElevenLabs response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);

      // Check for specific error types
      if (response.status === 401) {
        throw new Error('ElevenLabs API key is invalid');
      } else if (response.status === 429) {
        throw new Error('ElevenLabs rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error('Invalid request to ElevenLabs');
      }

      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get the audio as a buffer
    const audioBuffer = await response.arrayBuffer();
    console.log(`Generated audio size: ${audioBuffer.byteLength} bytes`);

    // Return the audio directly
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error generating dua audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
