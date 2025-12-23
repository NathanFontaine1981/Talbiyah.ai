import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

interface QuranInsightRequest {
  lesson_id: string;
  transcript: string;
  metadata: {
    surah_name: string;
    surah_number: number;
    ayah_range: string;
    teacher_name: string;
    student_names: string[];
    lesson_date: string;
  };
}

interface VerifiedVerse {
  ayahNumber: number;
  verseKey: string;
  firstWord: string;
  transliteration: string;
  translation: string;
  fullVerseUthmani: string;
  fullVerseTranslation: string;
}

/**
 * Fetch verified Quran verses from Quran.com API
 */
async function fetchVerifiedQuranData(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): Promise<VerifiedVerse[]> {
  try {
    const params = new URLSearchParams({
      language: 'en',
      words: 'true',
      word_fields: 'text_uthmani,text_simple,translation,transliteration',
      translations: '131', // Sahih International
      per_page: '50',
    });

    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_chapter/${surahNumber}?${params}`
    );

    if (!response.ok) {
      console.error('Failed to fetch from Quran API:', response.status);
      return [];
    }

    const data = await response.json();
    const verses: VerifiedVerse[] = [];

    for (const verse of data.verses) {
      if (verse.verse_number >= startAyah && verse.verse_number <= endAyah) {
        // Find the first actual word (not end marker)
        const firstWord = verse.words?.find(
          (w: { char_type_name: string; position: number }) =>
            w.char_type_name === 'word' && w.position === 1
        );

        verses.push({
          ayahNumber: verse.verse_number,
          verseKey: verse.verse_key,
          firstWord: firstWord?.text_uthmani || verse.text_uthmani?.split(' ')[0] || '',
          transliteration: firstWord?.transliteration?.text || '',
          translation: firstWord?.translation?.text || '',
          fullVerseUthmani: verse.text_uthmani,
          fullVerseTranslation: verse.translations?.[0]?.text || '',
        });
      }
    }

    return verses.sort((a, b) => a.ayahNumber - b.ayahNumber);
  } catch (error) {
    console.error('Error fetching Quran data:', error);
    return [];
  }
}

/**
 * Generate First Word Prompter section with verified data
 */
function generateFirstWordPrompterSection(verses: VerifiedVerse[]): string {
  if (verses.length === 0) return '';

  let section = `
---

**10. First Word Prompter (Verified from Quran.com)**

Use this for memorization practice - see the first word and try to recall the complete ayah!

| Ayah | First Word | Transliteration | Translation Hint |
|------|------------|-----------------|------------------|
`;

  for (const v of verses) {
    section += `| ${v.ayahNumber} | ${v.firstWord} | ${v.transliteration || '-'} | ${v.translation || '-'} |\n`;
  }

  section += `
**Practice Method:**
1. Cover the verse and look only at the first word
2. Try to recite the complete ayah from memory
3. Check your answer
4. Repeat until automatic

`;

  return section;
}

/**
 * Generate verified verses section for context
 */
function generateVerifiedVersesSection(verses: VerifiedVerse[]): string {
  if (verses.length === 0) return '';

  let section = `
---

**Verified Verses (from Quran.com API)**

`;

  for (const v of verses) {
    section += `**Ayah ${v.ayahNumber}:**
> ${v.fullVerseUthmani}

_"${v.fullVerseTranslation}"_

`;
  }

  return section;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    const { lesson_id, transcript, metadata }: QuranInsightRequest = await req.json();

    if (!lesson_id || !transcript || !metadata) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: lesson_id, transcript, and metadata are required" }),
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

    // Parse ayah range (e.g., "1-14" or "15-26")
    const ayahRangeMatch = metadata.ayah_range.match(/(\d+)\s*[-–]\s*(\d+)/);
    let startAyah = 1;
    let endAyah = 10;
    if (ayahRangeMatch) {
      startAyah = parseInt(ayahRangeMatch[1], 10);
      endAyah = parseInt(ayahRangeMatch[2], 10);
    }

    // Fetch verified Quran data from Quran.com API
    console.log(`Fetching verified Quran data for Surah ${metadata.surah_number}, Ayat ${startAyah}-${endAyah}...`);
    const verifiedVerses = await fetchVerifiedQuranData(metadata.surah_number, startAyah, endAyah);
    console.log(`Fetched ${verifiedVerses.length} verified verses from Quran.com API`);

    // Generate verified sections
    const firstWordPrompterSection = generateFirstWordPrompterSection(verifiedVerses);
    const verifiedVersesSection = generateVerifiedVersesSection(verifiedVerses);

    // Create a summary of verified first words to include in the prompt
    const verifiedFirstWordsContext = verifiedVerses.length > 0
      ? `\n\nVERIFIED FIRST WORDS (from Quran.com API - USE THESE EXACT VALUES):\n${verifiedVerses.map(v => `Ayah ${v.ayahNumber}: ${v.firstWord} (${v.transliteration})`).join('\n')}\n`
      : '';

    // Read the system prompt
    const systemPrompt = `You are Talbiyah Insights – Qur'an with Tadabbur.
Your task is to transform a Qur'an lesson transcript into structured, reflective, and easy-to-study notes.
The goal is to help students understand, internalise, and live by the Qur'an's meanings.

---

### 🕌 TALBIYAH INSIGHTS – QUR'ĀN WITH TADABBUR (UNDERSTANDING & REFLECTION)

**1. Lesson Information**
- Surah: [Name and Number]
- Verses Covered: [Ayah range]
- Teacher: [Name]
- Student(s): [Name(s)]
- Date: [Lesson date]
- Class Type: Qur'an with Tadabbur (Understanding & Reflection)

---

**2. Flow of Meaning (Tafsīr Summary)**
Write a clear English summary explaining the verses in order, combining translation, tafsīr, and discussion from class.
Show what Allah is saying, the context of each section, and the key moral messages.
Avoid repetition or filler text.

---

**3. Key Arabic Vocabulary**
List 6–10 important Arabic words mentioned or explained. For each:
- Arabic word (Uthmānī script)
- Transliteration
- Root (if known)
- English meaning
- Short example or note (if teacher gave one)

---

**4. Lessons & Tadabbur Points**
List 5–7 short, impactful lessons or reflections.
Focus on what the verses teach about Allah, human character, behaviour, and spiritual growth.

---

**5. Reflection Questions**
Provide 3–4 open-ended questions that help students apply the teachings to daily life.
Encourage thinking and self-assessment, not rote recall.

---

**6. Mini Quiz (Comprehension Check)**
Create 3–5 simple multiple-choice or matching questions drawn only from what was actually covered in class.
Mix meaning, tafṣīr context, and vocabulary.

Format example:
**Q1.** Where did Allah call Mūsā (ʿalayhi as-salām)?
A) Mount Uhud B) Madīnah ✅ C) Sacred Valley of Ṭuwā D) Mount Sinai

---

**7. Homework & Weekly Reflection Task**
List 2–4 practical follow-up tasks based on the lesson:
reading, listening, writing reflection, vocabulary revision, or a moral action challenge.
Keep them short and achievable.

---

**8. Flashcard Challenge (Optional)**
If vocabulary was discussed, suggest students create flashcards:
> Write Arabic on one side and English meaning on the other; review each card three times before next lesson.

---

**9. Summary Takeaway**
End with a 2–3 sentence summary that captures the spiritual message and emotional impact of the verses studied.

---

### 🧹 CLEAN-UP AND FILTER RULES
- **Include only content directly related to the Qur'an lesson** (tafṣīr, translation, examples, reflections, Arabic analysis).
- **Exclude** all irrelevant conversation: greetings ("How are you?"), small talk, technical issues, setup chat, and off-topic discussion.
- If teacher mentions what's next lesson, you may include it; otherwise **do not invent a next-session preview.**

---

### FORMATTING RULES
1. Follow this exact order and headings for consistency.
2. Write in warm, educational, and reflective tone.
3. Keep Arabic in standard Uthmānī script.
4. Use clear spacing, bullets, and tables for readability.
5. Stay faithful to what was actually said in the lesson — never add outside tafṣīr unless teacher quoted it.`;

    const userPrompt = `Generate Talbiyah Insights for this lesson:

METADATA:
- Surah: ${metadata.surah_name} (${metadata.surah_number})
- Verses: ${metadata.ayah_range}
- Teacher: ${metadata.teacher_name}
- Students: ${metadata.student_names.join(', ')}
- Date: ${metadata.lesson_date}
${verifiedFirstWordsContext}
TRANSCRIPT:
${transcript}

IMPORTANT: If you include a First Word Prompter section, you MUST use the VERIFIED FIRST WORDS provided above. Do NOT guess or generate first words - they have been verified from the Quran.com API.

Generate the insights following the exact format specified in the system prompt. Use the actual lesson information provided above.`;

    console.log("Calling Claude API to generate Quran insights...");

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
          max_tokens: 4096,
          temperature: 0.3,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate insights", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    let generatedText = data.content?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "No response generated from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Append verified First Word Prompter section (guaranteed accurate from Quran.com API)
    if (firstWordPrompterSection) {
      generatedText = generatedText + firstWordPrompterSection;
      console.log("Appended verified First Word Prompter section from Quran.com API");
    }

    console.log("Insights generated successfully, saving to database...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const processingTime = Date.now() - startTime;

    // Save to lesson_insights table
    const { data: savedInsight, error: upsertError } = await supabase
      .from('lesson_insights')
      .upsert({
        lesson_id,
        insight_type: 'quran_tadabbur',
        title: `Qur'an Insights: ${metadata.surah_name} (${metadata.ayah_range})`,
        summary: generatedText.substring(0, 500), // First 500 chars as summary
        detailed_insights: {
          content: generatedText,
          metadata: metadata,
          generated_at: new Date().toISOString(),
          verified_verses: verifiedVerses, // Store verified Quran data
          quran_api_source: 'quran.com/api/v4',
        },
        ai_model: 'claude-3-5-sonnet-20241022',
        confidence_score: 0.90,
        processing_time_ms: processingTime,
      }, {
        onConflict: 'lesson_id'
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error saving insights:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save insights to database", details: upsertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Insights saved successfully:", savedInsight.id);

    // Analyze transcript for suspicious content (contact sharing, etc.)
    try {
      console.log("Analyzing transcript for suspicious content...");

      // Get lesson details for teacher/student IDs
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('teacher_id, learner_id')
        .eq('id', lesson_id)
        .single();

      const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-lesson-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          content: transcript,
          lesson_id: lesson_id,
          source: 'transcript',
          teacher_id: lessonData?.teacher_id,
          student_id: lessonData?.learner_id
        })
      });

      if (analyzeResponse.ok) {
        const analyzeResult = await analyzeResponse.json();
        if (analyzeResult.flags && analyzeResult.flags.length > 0) {
          console.log(`Content moderation: Found ${analyzeResult.flags.length} suspicious patterns in transcript`);
        } else {
          console.log("Content moderation: No suspicious content detected in transcript");
        }
      } else {
        console.error("Content moderation analysis failed:", await analyzeResponse.text());
      }
    } catch (contentAnalysisError) {
      // Don't fail the whole request if content analysis fails
      console.error("Error during content moderation analysis:", contentAnalysisError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        lesson_id,
        insight_id: savedInsight.id,
        content: generatedText,
        processing_time_ms: processingTime,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating Quran insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
