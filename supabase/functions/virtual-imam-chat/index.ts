import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  question: string;
  session_id: string;
  user_id?: string;
  request_type?: 'question' | 'khutbah_reflection';
}

interface ChatResponse {
  answer: string;
  references: Array<{
    type: 'quran' | 'hadith';
    text: string;
    citation: string;
  }>;
  jurisprudence_note: string;
  is_complex_referral: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { question, session_id, user_id, request_type = 'question' }: ChatRequest = await req.json();

    if (!question || !session_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: question and session_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const khutbahPrompt = `You are generating a Weekly Khutbah Reflection for families. Focus on practical implementation in a 30-minute 'Family Hour' session over the weekend.

Generate a reflection based on: ${question}

REQUIRED RESPONSE FORMAT (respond ONLY with valid JSON):
{
  "is_complex_referral": false,
  "answer": "A warm, family-friendly reflection on the topic with practical wisdom",
  "references": [
    {
      "type": "quran",
      "text": "The actual verse text in English",
      "citation": "Surah Name Chapter:Verse"
    },
    {
      "type": "hadith",
      "text": "The actual hadith text",
      "citation": "Source (e.g., Sahih Bukhari 1903)"
    }
  ],
  "jurisprudence_note": "Brief scholarly context if relevant",
  "family_action_points": [
    "Action 1: Specific activity for 30-minute Family Hour (e.g., 'Gather the family after dinner and read Surah Al-Asr together, discussing the value of time')",
    "Action 2: Another practical family activity (e.g., 'Each family member shares one blessing they're grateful for and make dua together')",
    "Action 3: Simple weekend implementation (e.g., 'Set aside 30 minutes on Saturday morning for family Quran recitation and reflection')"
  ]
}

Focus the action points on:
- 30-minute weekend Family Hour activities
- Age-appropriate engagement for all family members
- Practical implementation of the Islamic reminder
- Building family bonds through worship`;

    const systemPrompt = `You are a Virtual Imam AI Assistant (Talbiyah Bot) specializing in Qur'an and authentic Sunnah. You are programmed to provide answers ONLY by citing authentic, established Islamic sources based on the understanding of the first three generations (Salaf).

CRITICAL CONSTRAINTS:
1. You MUST respond in a friendly, conversational, and encouraging tone
2. Your content MUST be 100% sourced from authentic Islamic references
3. You MUST cite specific Quranic verses (Surah and Ayah) and/or authentic Hadith
4. You MUST explain whether the matter is consensus (Ijma) or has differences of opinion (Ikhtilaf)
5. You MUST follow the methodology of the Salaf (first three generations)

COMPLEX QUESTION HANDLING:
If the question is:
- Too complex or nuanced for a general answer
- Requires personal/tailored guidance (medical ethics, personal finance, family disputes)
- Outside verified knowledge base
- Requires context-specific fatwa

You MUST refuse politely and respond with: "This is a complex matter that requires tailored guidance. Please consult with your local, trusted Imam for a bespoke answer."

REQUIRED RESPONSE FORMAT (respond ONLY with valid JSON):
{
  "is_complex_referral": false,
  "answer": "Your friendly, comprehensive answer here",
  "references": [
    {
      "type": "quran",
      "text": "The actual verse text in English",
      "citation": "Surah Name Chapter:Verse (e.g., Surah Al-Baqarah 2:183)"
    },
    {
      "type": "hadith",
      "text": "The actual hadith text",
      "citation": "Source (e.g., Sahih Bukhari 1903, Sahih Muslim 1151)"
    }
  ],
  "jurisprudence_note": "Explanation of whether this is Ijma (consensus) or Ikhtilaf (difference of opinion) among the four major schools"
}

OR if complex/personal:
{
  "is_complex_referral": true,
  "answer": "This is a complex matter that requires tailored guidance. Please consult with your local, trusted Imam for a bespoke answer.",
  "references": [],
  "jurisprudence_note": ""
}

USER QUESTION: ${question}

Remember: Be warm and encouraging, but absolutely strict about authentic sources. If you cannot provide authentic references, mark it as complex and refer to local Imam.`;

    const finalPrompt = request_type === 'khutbah_reflection' ? khutbahPrompt : systemPrompt;

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          temperature: 0.4,
          messages: [
            {
              role: "user",
              content: finalPrompt
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get response from Virtual Imam", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const generatedText = data.content?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "No response generated from Virtual Imam" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response:", generatedText);
      return new Response(
        JSON.stringify({ error: "Invalid response format from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result: ChatResponse = JSON.parse(jsonMatch[0]);

    if (!result.answer) {
      return new Response(
        JSON.stringify({ error: "Incomplete response from Virtual Imam" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user_id || null,
        question,
        answer: result.answer,
        source_references: result.references || [],
        jurisprudence_note: result.jurisprudence_note || null,
        is_complex_referral: result.is_complex_referral || false,
        session_id,
        metadata: {
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || 'unknown',
        }
      });

    if (insertError) {
      console.error("Error saving conversation:", insertError);
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in Virtual Imam chat:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
