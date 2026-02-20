import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ElevenLabs voice IDs - gender-aware, multilingual voices
const VOICES = {
  male: {
    arabic: 'onwK4e9ZLuTAKqWW03F9',  // Daniel - deep, reverent male voice
    english: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - clear male multilingual
  },
  female: {
    arabic: 'EXAVITQu4vr4xnSDxMaL',  // Sarah - clear female multilingual
    english: 'EXAVITQu4vr4xnSDxMaL',  // Sarah - clear female voice
  },
};

async function callElevenLabs(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<Response> {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    }
  );
}

Deno.serve(async (req: Request) => {
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
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, voice, language, gender } = body;
    console.log(`Received text length: ${text?.length || 0} chars, language: ${language || 'not specified'}, gender: ${gender || 'not specified'}`);

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Voice selection: explicit voice > gender + language > defaults
    let selectedVoiceId = voice;
    if (!selectedVoiceId) {
      const voiceGender = gender === 'female' ? 'female' : 'male';
      const voiceLang = language === 'english' ? 'english' : 'arabic';
      selectedVoiceId = VOICES[voiceGender][voiceLang];
    }

    console.log(`Using ElevenLabs with voice: ${selectedVoiceId}`);

    // Call ElevenLabs API with retry on rate limit
    let response = await callElevenLabs(processedText, selectedVoiceId, ELEVENLABS_API_KEY);

    console.log(`ElevenLabs response status: ${response.status}`);

    // Retry once after 3s on rate limit
    if (response.status === 429) {
      console.log('Rate limited, retrying after 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      response = await callElevenLabs(processedText, selectedVoiceId, ELEVENLABS_API_KEY);
      console.log(`ElevenLabs retry response status: ${response.status}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);

      if (response.status === 401) {
        throw new Error('ElevenLabs API key is invalid');
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Audio generation is busy. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (response.status === 400) {
        throw new Error('Invalid request to ElevenLabs');
      }

      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get the audio as a buffer
    const audioBuffer = await response.arrayBuffer();
    console.log(`Generated audio size: ${audioBuffer.byteLength} bytes`);

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
