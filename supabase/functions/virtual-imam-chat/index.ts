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
- Building family bonds through worship

CRITICAL: Your response must be ONLY valid JSON in the format shown above. Do not include any text before or after the JSON.`;

    const systemPrompt = `You are the Islamic Source Reference tool - a research assistant that helps people find relevant Quranic verses and authentic Hadith based on the understanding of the Salaf (first three generations).

CRITICAL ROLE DEFINITION:
- You are NOT a mufti, scholar, or imam
- You are a REFERENCE TOOL that finds and cites Islamic sources
- Your purpose is to help people locate relevant evidence from Quran and authentic Sunnah
- You MUST always remind users to consult qualified scholars for religious rulings

MANDATORY REQUIREMENTS FOR EVERY RESPONSE:
1. ALWAYS provide AT LEAST ONE Quranic verse with the FULL verse text in English
2. ALWAYS provide AT LEAST ONE authentic Hadith with the FULL hadith text
3. If there is Ikhtilaf (difference of opinion), you MUST:
   - Explain that scholars differ on this matter
   - Present BOTH sides of the argument
   - Provide Quranic verses and/or Hadith supporting EACH position
   - Mention which scholars or madhahib hold each view
   - Never favor one side - remain neutral and present evidence for both
4. You MUST include the actual text of verses and hadiths, not just citations
5. You MUST explain whether the matter is Ijma (consensus) or Ikhtilaf (difference of opinion)

SOURCE REQUIREMENTS:
- All Hadith MUST be from authentic collections (Sahih Bukhari, Sahih Muslim, Sunan Abu Dawud, Sunan Tirmidhi, Sunan An-Nasa'i, Sunan Ibn Majah)
- Follow the methodology of the Salaf (first three generations)
- Provide specific citations: Surah name, chapter, and verse number for Quran; Collection and number for Hadith

COMPLEX QUESTION HANDLING:
If the question is:
- Too complex or nuanced for a general answer
- Requires personal/tailored guidance (medical ethics, personal finance, family disputes)
- Outside verified knowledge base
- Requires context-specific fatwa

You MUST refuse politely and respond with: "This is a complex matter that requires tailored guidance from a qualified scholar. As a reference tool, I can only provide source citations. Please consult with your local, trusted Imam or qualified scholar for a proper ruling on this matter."

REQUIRED RESPONSE FORMAT (respond ONLY with valid JSON):
{
  "is_complex_referral": false,
  "answer": "Your comprehensive response explaining the topic. If there is Ikhtilaf, present BOTH positions with their evidence. ALWAYS end with: 'Note: This is a reference tool providing Islamic sources. Please consult a qualified scholar or imam for specific rulings on your situation.'",
  "references": [
    {
      "type": "quran",
      "text": "The COMPLETE verse text in English - this is MANDATORY, never just the citation",
      "citation": "Surah Name Chapter:Verse (e.g., Surah Al-Baqarah 2:183)"
    },
    {
      "type": "hadith",
      "text": "The COMPLETE hadith text in English - this is MANDATORY, never just the citation",
      "citation": "Complete source (e.g., Sahih Bukhari 1903, Sahih Muslim 1151)"
    }
  ],
  "jurisprudence_note": "If Ijma (consensus): State that scholars agree on this matter. If Ikhtilaf (difference): Explain both positions clearly with evidence for each side. Mention which scholars/madhahib hold each view. Example: 'The majority of scholars (Shafi'i, Maliki, Hanbali) hold position A based on [evidence], while the Hanafi school holds position B based on [evidence].' Always end with: 'Consult a qualified scholar for specific rulings.'"
}

OR if complex/personal:
{
  "is_complex_referral": true,
  "answer": "This is a complex matter that requires tailored guidance from a qualified scholar. As a reference tool, I cannot provide specific rulings. Please consult with your local, trusted Imam or qualified Islamic scholar for a proper answer to your specific situation.",
  "references": [],
  "jurisprudence_note": ""
}

USER QUESTION: ${question}

Remember:
1. NEVER skip providing Quran verses with FULL text
2. NEVER skip providing Hadith with FULL text
3. If there is Ikhtilaf, you MUST show BOTH sides with evidence
4. You are a REFERENCE TOOL, not a mufti
5. ALWAYS remind users to consult qualified scholars
6. CRITICAL: Respond with ONLY valid JSON, no additional text before or after

Your response must be valid JSON only.`;

    const finalPrompt = request_type === 'khutbah_reflection' ? khutbahPrompt : systemPrompt;

    const systemMessage = request_type === 'khutbah_reflection'
      ? "You are an Islamic Source Reference tool generating family-friendly Islamic reflections. You MUST respond ONLY with valid JSON in the exact format specified."
      : "You are an Islamic Source Reference tool - NOT a mufti or scholar. Your role is to find and cite relevant Quranic verses and authentic Hadith. You MUST respond ONLY with valid JSON in the exact format specified. Do not include any text before or after the JSON.";

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
          model: "claude-3-haiku-20240307",
          max_tokens: 4096,
          temperature: 0.3,
          system: systemMessage,
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
        JSON.stringify({ error: "Failed to get response from Islamic Source Reference", details: errorText }),
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
        JSON.stringify({ error: "No response generated from Islamic Source Reference" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result: ChatResponse;

    // Try to parse JSON from the response
    try {
      // First, try to find JSON in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not extract JSON from response:", generatedText);
        // Fallback: Create a simple response from the text
        result = {
          is_complex_referral: false,
          answer: generatedText.trim() || "I apologize, but I couldn't generate a proper response. Please try asking your question again.",
          references: [],
          jurisprudence_note: ""
        };
      } else {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError, "Text:", generatedText);
          // Fallback: Try to extract answer from malformed JSON
          const answerMatch = generatedText.match(/"answer"\s*:\s*"([^"]+)"/);
          result = {
            is_complex_referral: false,
            answer: answerMatch ? answerMatch[1] : "I apologize, but I encountered an error generating a response. Please try rephrasing your question.",
            references: [],
            jurisprudence_note: ""
          };
        }
      }
    } catch (error) {
      console.error("Unexpected error in parsing:", error);
      result = {
        is_complex_referral: false,
        answer: "I apologize, but I encountered an error. Please try again.",
        references: [],
        jurisprudence_note: ""
      };
    }

    if (!result.answer) {
      return new Response(
        JSON.stringify({ error: "Incomplete response from Islamic Source Reference" }),
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
      .from('imam_conversations')
      .insert({
        user_id: user_id || null,
        question,
        answer: result.answer
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
    console.error("Error in Islamic Source Reference chat:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
