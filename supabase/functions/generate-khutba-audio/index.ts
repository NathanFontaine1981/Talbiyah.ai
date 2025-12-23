import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not set');
      throw new Error('OpenAI API key not configured');
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { text, voice } = body;
    console.log(`Received text length: ${text?.length || 0} chars`);

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    // OpenAI TTS has a 4096 character limit per request
    const MAX_CHARS = 4096;
    let processedText = text.trim();
    if (processedText.length > MAX_CHARS) {
      // Try to truncate at a sentence boundary
      const truncated = processedText.substring(0, MAX_CHARS);
      const lastPeriod = truncated.lastIndexOf('.');
      processedText = lastPeriod > MAX_CHARS * 0.8
        ? truncated.substring(0, lastPeriod + 1)
        : truncated + '...';
      console.log(`Text truncated from ${text.length} to ${processedText.length} characters`);
    }

    // OpenAI TTS voices:
    // alloy - neutral, balanced
    // echo - warm, conversational
    // fable - British, narrative
    // onyx - deep, authoritative (good for khutbah)
    // nova - friendly, warm
    // shimmer - clear, expressive
    const selectedVoice = voice || 'onyx'; // Default to onyx for formal khutbah tone

    console.log(`Using OpenAI TTS with voice: ${selectedVoice}`);

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // Use tts-1-hd for higher quality (costs more)
        input: processedText,
        voice: selectedVoice,
        response_format: 'mp3',
        speed: 0.95, // Slightly slower for clarity in religious content
      }),
    });

    console.log(`OpenAI TTS response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      throw new Error(`OpenAI TTS API error: ${response.status} - ${errorText.substring(0, 200)}`);
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
    console.error('Error generating audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
