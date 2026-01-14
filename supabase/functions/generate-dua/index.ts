import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateDuaRequest {
  category: string;
  subcategory?: string;
  suggestedNames: string[];
  language?: 'both' | 'arabic' | 'english';
  user_id?: string;
}

interface GeneratedDua {
  title: string;
  titleArabic: string;
  arabic: string;
  transliteration: string;
  english: string;
  namesUsed: string[];
  structure: {
    hamd: string;
    salawat: string;
    request: string;
    closing: string;
  };
}

const CATEGORY_GUIDANCE: Record<string, string> = {
  forgiveness: `The person is seeking forgiveness (istighfar) and turning back to Allah in repentance (tawbah).
    Focus on: acknowledging shortcomings without specifics, sincere regret, hope in Allah's mercy, resolve to improve.
    Do NOT ask for details about specific sins - maintain privacy and dignity.`,

  guidance: `The person is seeking guidance (hidaya) and clarity in their path.
    Focus on: asking for light (nur), wisdom (hikma), clarity in decisions, following the straight path.`,

  protection: `The person is seeking protection (hifz) from harm, evil, and dangers.
    Focus on: seeking refuge, asking for safety, protection from seen and unseen harm, security for family.`,

  gratitude: `The person wants to express thankfulness (shukr) to Allah.
    Focus on: acknowledging blessings, praising Allah's generosity, asking to be among the grateful.`,

  hardship: `The person is going through a difficult time and needs strength.
    Focus on: relying on Allah (tawakkul), patience (sabr), asking for ease, trusting in Allah's wisdom.`,

  anxiety: `The person is experiencing worry, stress, or mental distress.
    Focus on: peace of heart (sakinah), relief from worry, tranquility, trust in Allah's plan.`,

  health: `The person is seeking health and healing (shifa).
    Focus on: asking for cure, strength, wellness, trusting in Allah as the ultimate Healer.`,

  provision: `The person is seeking sustenance and provision (rizq).
    Focus on: halal provision, barakah (blessing), contentment, asking from Allah's vast treasures.`,

  family: `The person is making dua for family blessings and children.
    Focus on: righteous offspring, family harmony, protection for loved ones, coolness of eyes.`,

  knowledge: `The person is seeking beneficial knowledge and understanding.
    Focus on: useful knowledge, deep understanding, ability to implement knowledge, wisdom.`,

  patience: `The person is seeking patience and steadfastness.
    Focus on: endurance (sabr), firmness (istiqama), perseverance, trusting in Allah's timing.`,

  success: `The person is seeking success and achievement (tawfiq).
    Focus on: divine help, good outcomes, blessings in endeavors, ease in affairs.`
};

const SYSTEM_PROMPT = `You are an expert Islamic scholar helping Muslims craft sincere, personalized duas.

STRICT REQUIREMENTS:

1. DUA STRUCTURE (MUST follow this exact order):
   a) HAMD (Praise): Begin by praising Allah using the appropriate Name(s) from the provided list
   b) SALAWAT: Send blessings on Prophet Muhammad (pbuh)
   c) REQUEST: Express the supplication based on the category
   d) CLOSING: End with salawat on the Prophet (pbuh)

2. ARABIC TEXT REQUIREMENTS:
   - MUST include FULL HARAKAT (diacritical marks: fatha, kasra, damma, sukun, shadda, tanwin)
   - Use authentic Arabic expressions and phrases from Quran/Sunnah where possible
   - Example of proper harakat: بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (NOT بسم الله الرحمن الرحيم)

3. PRIVACY AND SINCERITY:
   - NEVER ask the person to detail specific sins, private matters, or embarrassing details
   - Keep the dua general enough to apply to their category without exposing private affairs
   - The dua should feel personal yet maintain the dignity of the supplicant
   - Encourage sincerity (ikhlas) in the heart rather than elaborate words

4. AUTHENTICITY:
   - Use expressions and phrases that are authentically Islamic
   - You may incorporate or draw inspiration from authentic duas from Quran and Sunnah
   - Avoid innovations (bid'ah) or expressions foreign to Islamic tradition

5. TONE:
   - Humble and submissive before Allah
   - Hopeful in Allah's mercy and response
   - Sincere and heartfelt, not mechanical or formulaic

RESPOND WITH ONLY VALID JSON matching this exact structure:
{
  "title": "Short descriptive title in English",
  "titleArabic": "Short title in Arabic",
  "arabic": "Full Arabic text of the dua with complete harakat",
  "transliteration": "Full transliteration of the Arabic",
  "english": "Full English translation/meaning",
  "namesUsed": ["List", "of", "Allah's", "Names", "used"],
  "structure": {
    "hamd": "The praise portion only (Arabic with harakat)",
    "salawat": "The salawat portion (Arabic with harakat)",
    "request": "The main request portion (Arabic with harakat)",
    "closing": "The closing salawat (Arabic with harakat)"
  }
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { category, subcategory, suggestedNames, language, user_id }: GenerateDuaRequest = await req.json();

    if (!category) {
      return new Response(
        JSON.stringify({ error: "Category is required" }),
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

    const categoryGuidance = CATEGORY_GUIDANCE[category] ||
      `The person is making a general dua related to: ${category}. Help them supplicate appropriately.`;

    const namesContext = suggestedNames && suggestedNames.length > 0
      ? `Use these Names of Allah which are most appropriate for this type of dua: ${suggestedNames.join(', ')}`
      : 'Choose appropriate Names of Allah based on the nature of the request.';

    const userPrompt = `Generate a personalized dua for someone seeking: ${category.toUpperCase()}
${subcategory ? `Specific focus: ${subcategory}` : ''}

CATEGORY GUIDANCE:
${categoryGuidance}

NAMES OF ALLAH TO USE:
${namesContext}

IMPORTANT REMINDERS:
- Structure: Hamd (praise with appropriate Name) → Salawat → Request → Closing salawat
- Arabic MUST have full harakat (this is CRITICAL)
- Keep it sincere, humble, and hopeful
- Do NOT ask for private details - keep the dua general enough for dignity
- Make it feel personal and heartfelt, not generic

Generate the dua in the exact JSON format specified.`;

    console.log(`Generating dua for category: ${category}`);

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
          max_tokens: 4096,
          temperature: 0.5,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate dua", details: errorText }),
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
    let duaContent: GeneratedDua;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : generatedText.trim();
      duaContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", generatedText);

      // Try to extract JSON more aggressively
      try {
        const startIdx = generatedText.indexOf('{');
        const endIdx = generatedText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          duaContent = JSON.parse(generatedText.slice(startIdx, endIdx + 1));
        } else {
          throw new Error("Could not find JSON in response");
        }
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Failed to parse dua content", raw: generatedText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Add metadata
    const result = {
      ...duaContent,
      category,
      subcategory,
      generatedAt: new Date().toISOString()
    };

    console.log("Dua generated successfully:", duaContent.title);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating dua:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
