import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, user_id } = await req.json();

    if (!audio) {
      throw new Error('Audio data is required');
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Claude can process audio through its multimodal capabilities
    // We send the audio as base64 encoded data
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'audio/webm',
                  data: audio
                }
              },
              {
                type: 'text',
                text: `Please transcribe this audio recording of an Islamic khutba (Friday sermon).

Instructions:
- Transcribe the speech accurately word for word
- If Arabic phrases are spoken, transcribe them in Arabic script
- Preserve any Quran verses or hadith citations as spoken
- If the speaker says "peace be upon him" or similar, you can write ﷺ
- Format paragraphs naturally based on topic changes or pauses
- Do not add any commentary, just provide the transcription

Transcribe the audio now:`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    const transcription = result.content[0].text;

    return new Response(
      JSON.stringify({
        transcription: transcription,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Transcription failed',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
