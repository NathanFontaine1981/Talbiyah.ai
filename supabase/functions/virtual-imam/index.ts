import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { question } = await req.json()

    if (!question || !question.trim()) {
      throw new Error('Question is required')
    }

    // Call Claude API
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: `You are an Islamic scholar assistant helping students learn about Islam.
Your role is to:
- Answer questions about the Quran, Hadith, and Islamic teachings
- Provide authentic references from Quran and Sahih Hadith when possible
- Be respectful, knowledgeable, and educational
- Use clear, accessible language for students
- Include verse numbers when quoting Quran (e.g., "Quran 2:255")
- Include Hadith sources when referencing Hadith (e.g., "Sahih Bukhari 1:2")
- If a question is outside Islamic topics, politely redirect to Islamic learning
- Always maintain scholarly accuracy and authenticity`,
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json()
      throw new Error(errorData.error?.message || 'Failed to get response from Claude')
    }

    const data = await claudeResponse.json()
    const answer = data.content[0].text

    // Save conversation to database
    const { error: insertError } = await supabaseClient
      .from('imam_conversations')
      .insert({
        user_id: user.id,
        question: question.trim(),
        answer: answer,
      })

    if (insertError) {
      console.error('Error saving conversation:', insertError)
      // Don't throw - still return the answer even if save fails
    }

    return new Response(
      JSON.stringify({ answer }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
