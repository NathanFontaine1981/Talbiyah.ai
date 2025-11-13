import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

TRANSCRIPT:
${transcript}

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
    const generatedText = data.content?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "No response generated from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
