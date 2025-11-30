import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateKhutbaRequest {
  topic: string;
  duration: 'short' | 'medium' | 'long';
  audience: 'youth' | 'general' | 'new_muslims';
  user_id?: string;
}

const DURATION_GUIDELINES = {
  short: 'Keep the main content brief (2-3 minutes of speaking). Include 1-2 Quran verses, 1 hadith, and 2-3 practical points.',
  medium: 'Provide moderate detail (5-7 minutes of speaking). Include 2-3 Quran verses, 2 hadith, and 4-5 practical points with examples.',
  long: 'Provide detailed exploration (10-12 minutes of speaking). Include 3-4 Quran verses, 2-3 hadith, detailed explanations, and 5-6 practical points with stories/examples.'
};

const AUDIENCE_GUIDELINES = {
  youth: 'Use relatable examples for young people. Reference school, social media, peer pressure, and modern challenges. Keep language simple and engaging.',
  general: 'Use balanced language suitable for all ages. Include examples from daily life, family, and community.',
  new_muslims: 'Avoid complex Arabic terms without explanation. Be welcoming and encouraging. Focus on foundational concepts and practical first steps.'
};

const SYSTEM_PROMPT = `You are an Islamic Khutba Generator. Your role is to create authentic, beneficial Friday khutbas following the Quran and Sunnah based on the understanding of the Salaf (first three generations).

STRICT REQUIREMENTS:

1. ONLY USE AUTHENTIC SOURCES:
   - Quran (always provide surah:ayah reference)
   - Sahih Bukhari, Sahih Muslim (always provide book/hadith number)
   - Other collections (Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah) ONLY if graded sahih
   - Classical scholars: Ibn Taymiyyah, Ibn Kathir, Imam Nawawi, Ibn Qayyim

2. FORBIDDEN:
   - NO weak or fabricated hadith
   - NO innovations (bid'ah)
   - NO sectarian bias - universal Sunni Islamic teaching
   - NO complex theological jargon without explanation

3. FORMATTING:
   - Arabic text MUST include FULL HARAKAT (diacritical marks: fatha, kasra, damma, sukun, shadda, tanwin)
   - Arabic text MUST have transliteration AND translation
   - All Quran verses MUST have surah:ayah reference
   - All Hadith MUST have source reference (book name and number)
   - Example of proper harakat: بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (NOT بسم الله الرحمن الرحيم)

4. CONTENT:
   - Must be appropriate for the specified duration
   - Must be suitable for the target audience
   - Focus on practical implementation
   - Include a clear call to action

RESPOND WITH ONLY VALID JSON matching this exact structure:
{
  "title": "Clear, descriptive title for the khutba",
  "first_khutbah": {
    "main_content": {
      "introduction": "2-3 paragraph introduction to the topic, setting the scene and importance",
      "quran_evidence": [
        {
          "arabic": "Full Arabic text of the verse",
          "transliteration": "Full transliteration",
          "translation": "English translation",
          "reference": "Surah Name X:Y",
          "explanation": "Brief explanation of how this verse relates to the topic"
        }
      ],
      "hadith_evidence": [
        {
          "arabic": "Arabic text if available, otherwise leave empty",
          "transliteration": "Transliteration if Arabic provided",
          "translation": "The Prophet (ﷺ) said: 'Full hadith text'",
          "reference": "Sahih Bukhari 1234 or Sahih Muslim 5678",
          "explanation": "Brief explanation of the hadith's relevance"
        }
      ],
      "practical_application": [
        "First practical point the congregation can implement",
        "Second practical point",
        "Third practical point"
      ],
      "call_to_action": "A motivating closing statement urging the congregation to action"
    }
  },
  "second_khutbah": {
    "reminder": "A brief 1-2 paragraph reminder related to the topic, reinforcing the main message"
  },
  "sources": [
    "Quran X:Y",
    "Sahih Bukhari 1234",
    "List all sources used"
  ]
}

IMPORTANT: The opening praise, testimony, opening verse, closing of first khutbah, second khutbah opening, duas, and salawat are FIXED and will be added automatically. You only need to provide the main content and reminder.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { topic, duration, audience, user_id }: GenerateKhutbaRequest = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Generate a Friday Khutba on the topic: "${topic}"

DURATION: ${duration.toUpperCase()}
${DURATION_GUIDELINES[duration]}

AUDIENCE: ${audience.replace('_', ' ').toUpperCase()}
${AUDIENCE_GUIDELINES[audience]}

Remember:
- Use ONLY authentic sources (Sahih hadith, Quran with proper references)
- ALL Arabic text MUST have FULL HARAKAT (fatha, kasra, damma, sukun, shadda, tanwin) - this is CRITICAL
- Include Arabic with transliteration and translation
- Make it practical and actionable
- Suitable for the ${audience === 'youth' ? 'young' : audience === 'new_muslims' ? 'new Muslim' : 'general'} audience

Generate the khutba content in the exact JSON format specified.`;

    console.log(`Generating khutba on: ${topic} (${duration}, ${audience})`);

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
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          temperature: 0.4,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate khutba", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedText = data.content?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "No response generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from response
    let khutbaContent: any;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : generatedText.trim();
      khutbaContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", generatedText);

      // Try to extract JSON more aggressively
      try {
        const startIdx = generatedText.indexOf('{');
        const endIdx = generatedText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          khutbaContent = JSON.parse(generatedText.slice(startIdx, endIdx + 1));
        } else {
          throw new Error("Could not find JSON in response");
        }
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Failed to parse khutba content", raw: generatedText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Add metadata
    khutbaContent.duration = duration;
    khutbaContent.audience = audience;

    console.log("Khutba generated successfully:", khutbaContent.title);

    return new Response(
      JSON.stringify(khutbaContent),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating khutba:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
