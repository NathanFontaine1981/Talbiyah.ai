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

CRITICAL CITATION REQUIREMENTS:
- EVERY Quran reference MUST include the COMPLETE verse text in English + exact citation (Surah name Chapter:Verse)
- EVERY Hadith reference MUST include the COMPLETE hadith text in English + exact source (Book name and number, e.g., "Sahih Bukhari 1903")
- NEVER provide empty citations or references without full text
- If you cannot find an exact reference, acknowledge this rather than providing incomplete information

REQUIRED RESPONSE FORMAT (respond ONLY with valid JSON):
{
  "is_complex_referral": false,
  "answer": "A warm, family-friendly reflection on the topic with practical wisdom",
  "references": [
    {
      "type": "quran",
      "text": "By time, indeed mankind is in loss, except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.",
      "citation": "Surah Al-Asr 103:1-3"
    },
    {
      "type": "hadith",
      "text": "The Prophet (ﷺ) said: 'The best of you are those who are best to their families, and I am the best among you to my family.'",
      "citation": "Jami' at-Tirmidhi 3895"
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

SOURCE REQUIREMENTS - ABSOLUTELY MANDATORY:
- All Hadith MUST be from authentic collections (Sahih Bukhari, Sahih Muslim, Sunan Abu Dawud, Sunan Tirmidhi, Sunan An-Nasa'i, Sunan Ibn Majah)
- Follow the methodology of the Salaf (first three generations)
- EVERY Quran reference MUST include:
  * Full Surah name in English
  * Chapter number
  * Verse number
  * The COMPLETE verse text in English
  * Format: "Surah Al-Baqarah 2:183"
- EVERY Hadith reference MUST include:
  * The exact book name (e.g., "Sahih Bukhari", "Sahih Muslim", "Sunan Abu Dawud")
  * The specific hadith number from that collection
  * The COMPLETE hadith text in English (narrator chain not required, but the full content is mandatory)
  * Format: "Sahih Bukhari 1903" or "Sahih Muslim 2564"
- NEVER provide just citations without the full text
- NEVER say "as mentioned in the Quran" without citing the specific verse
- NEVER reference a hadith without providing the exact book and number

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
      "text": "O you who have believed, decreed upon you is fasting as it was decreed upon those before you that you may become righteous.",
      "citation": "Surah Al-Baqarah 2:183"
    },
    {
      "type": "hadith",
      "text": "The Prophet (ﷺ) said: 'Islam is built upon five pillars: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing prayer, paying zakah, fasting Ramadan, and performing Hajj.'",
      "citation": "Sahih Bukhari 8"
    }
  ],
  "jurisprudence_note": "If Ijma (consensus): State that scholars agree on this matter. If Ikhtilaf (difference): Explain both positions clearly with evidence for each side. Mention which scholars/madhahib hold each view. Example: 'The majority of scholars (Shafi'i, Maliki, Hanbali) hold position A based on [evidence], while the Hanafi school holds position B based on [evidence].' Always end with: 'Consult a qualified scholar for specific rulings.'"
}

CRITICAL CITATION RULES:
- For Quran: MUST include full surah name, chapter:verse number AND complete verse text
- For Hadith: MUST include exact book name (Sahih Bukhari, Sahih Muslim, etc.), hadith number AND complete hadith text
- EXAMPLE GOOD CITATION: {"type": "hadith", "text": "The Prophet (ﷺ) said: 'Whoever fasts Ramadan with faith and seeking reward from Allah, his previous sins will be forgiven.'", "citation": "Sahih Bukhari 1901"}
- EXAMPLE BAD CITATION: {"type": "hadith", "text": "", "citation": "Bukhari"} ❌ NEVER DO THIS
- If you cannot find the exact hadith number or verse, say "I cannot locate the specific reference for this" rather than providing incomplete citations

OR if complex/personal:
{
  "is_complex_referral": true,
  "answer": "This is a complex matter that requires tailored guidance from a qualified scholar. As a reference tool, I cannot provide specific rulings. Please consult with your local, trusted Imam or qualified Islamic scholar for a proper answer to your specific situation.",
  "references": [],
  "jurisprudence_note": ""
}

USER QUESTION: ${question}

Remember:
1. NEVER skip providing Quran verses with FULL text - must include complete verse in English
2. NEVER skip providing Hadith with FULL text - must include complete hadith in English
3. EVERY Quran citation MUST have: Surah name + chapter:verse number (e.g., "Surah Al-Baqarah 2:183")
4. EVERY Hadith citation MUST have: Exact book name + hadith number (e.g., "Sahih Bukhari 1903")
5. If there is Ikhtilaf, you MUST show BOTH sides with evidence from Quran/Hadith for each position
6. You are a REFERENCE TOOL, not a mufti - always remind users to consult scholars
7. CRITICAL: Respond with ONLY valid JSON, no additional text before or after
8. Citations without full text are FORBIDDEN - if you don't know the exact reference, say so clearly

EXAMPLES OF PROPER REFERENCES:
✅ CORRECT: {"type": "quran", "text": "Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater. And Allah knows that which you do.", "citation": "Surah Al-Ankabut 29:45"}
✅ CORRECT: {"type": "hadith", "text": "The Prophet (ﷺ) said: 'The best of you are those who are best to their families.'", "citation": "Jami' at-Tirmidhi 3895"}
❌ WRONG: {"type": "hadith", "text": "", "citation": "Bukhari"}
❌ WRONG: {"type": "quran", "text": "", "citation": "Quran"}

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
