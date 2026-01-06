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
    const { audio, user_id, media_type, lesson_type } = await req.json();

    if (!audio) {
      throw new Error('Audio data is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Determine file extension from media type
    const audioMediaType = media_type || 'audio/mp3';
    let fileExtension = 'mp3';
    if (audioMediaType.includes('webm')) fileExtension = 'webm';
    else if (audioMediaType.includes('wav')) fileExtension = 'wav';
    else if (audioMediaType.includes('m4a')) fileExtension = 'm4a';
    else if (audioMediaType.includes('mpeg')) fileExtension = 'mp3';
    else if (audioMediaType.includes('ogg')) fileExtension = 'ogg';

    console.log(`Transcribing audio with media type: ${audioMediaType}, extension: ${fileExtension}, lesson type: ${lesson_type || 'general'}`);

    // Decode base64 audio
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([bytes], { type: audioMediaType });
    formData.append('file', audioBlob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    // Add language hint for Arabic content
    if (lesson_type === 'quran') {
      // Don't set language - let Whisper auto-detect since lessons may be mixed Arabic/English
      formData.append('prompt', 'This is a Quran lesson with Arabic recitation and English explanations. Transcribe Arabic verses in Arabic script.');
    }

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', response.status, errorText);
      throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
    }

    const transcription = await response.text();
    console.log(`Transcription complete: ${transcription.length} characters`);

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
