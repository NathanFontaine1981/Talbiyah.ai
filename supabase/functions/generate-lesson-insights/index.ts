import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LessonInsightRequest {
  lesson_id: string;
  transcript: string;
  subject: string; // 'quran', 'arabic', etc.
  metadata: {
    // For Quran lessons
    surah_name?: string;
    surah_number?: number;
    ayah_range?: string;
    // Common fields
    teacher_name: string;
    student_names: string[];
    lesson_date: string;
    duration_minutes?: number;
  };
}

// System prompts
const QURAN_PROMPT = `You are Talbiyah Insights – Qur'an with Tadabbur.
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

const ARABIC_PROMPT = `## 📚 TALBIYAH INSIGHTS – ARABIC LANGUAGE TEMPLATE

You are Talbiyah Insights – Arabic Language.
Your task is to transform an Arabic language class transcript into structured, reflective, and easy-to-study notes.
The goal is for students to be able to revise everything that was taught in detail — including vocabulary, grammar, pronunciation, conversation, and practice questions.
The output should feel like a complete revision pack, not a short summary.
It should help the student feel like they can open it anytime in their dashboard and learn directly from it, as if the teacher is still with them.

---

### 1️⃣ Lesson Summary
* Give a short and simple summary of what was taught in the class.
* Mention the grammar focus, the main vocabulary topics, and what type of speaking or reading practice was done.
* Include 3–5 bullet points that highlight the most important learning goals.
* The tone should be friendly, clear, and motivating.

---

### 2️⃣ Key Sentences from the Class
* Extract 5–10 of the most useful Arabic sentences that appeared in the class.
* Show them in a 3-column table:

| Arabic | Transliteration | English Meaning |
|--------|----------------|-----------------|
| Example Arabic sentence | Transliteration | English translation |

* Choose sentences that demonstrate grammar points, daily-life vocabulary, or conversation patterns.
* Ensure they are accurate and beneficial for revision.

---

### 3️⃣ Vocabulary List (with Tashkīl)
* Collect all new or important words mentioned during the lesson.
* Each word should include its transliteration, English meaning, word type (noun, verb, adjective, etc.), and one short example sentence.
* Use a clear table format:

| Arabic (with Tashkīl) | Transliteration | English Meaning | Word Type | Example |
|-----------------------|----------------|-----------------|-----------|---------|
| فُرْنٌ | furnun | oven | noun | يُوجَدُ فُرْنٌ فِي المَطْبَخِ |

* Include at least 10–20 words if possible.
* Add tashkīl (vowel markings) for every word to help pronunciation.

---

### 4️⃣ Grammar Focus
* Summarise every grammar point that the teacher explained in this lesson.
* Use numbered sections (1️⃣, 2️⃣, 3️⃣, etc.) for each rule.
* For each point, include:
  - The rule name or topic (e.g. Future Tense (سَـ + Present Verb)).
  - A short explanation (2–4 sentences).
  - Two Arabic example sentences from the transcript or based on it.

Example format:
1️⃣ Future Tense (سَـ + Present Verb)
Used to express "will" or future action.
Example:
* سَيَقْرَأُ الطَّالِبُ الكِتَابَ – The student will read the book.
* سَنَذْهَبُ إِلَى المَدِينَةِ – We will go to the city.

---

### 5️⃣ Teacher Notes & Corrections
* List the pronunciation corrections, grammar mistakes, or reminders given by the teacher.
* Use bullet points, each starting with ✅.

Example:
✅ Say سَأَقْضِي not *sayyafi* for "I will spend."
✅ Pronounce خ from the throat, not like the English "k."
✅ After كَمْ, always use the singular form of the noun (كَمْ كِتَابًا؟).

---

### 6️⃣ Conversation Practice (Role-Play)
* Turn key parts of the lesson into short Arabic dialogues that the student can practise.
* Use Teacher (T) and Student (S) labels and include English translations underneath.

Example:
T: أَيْنَ تَشْرَبُ القَهْوَةَ؟
S: أَشْرَبُ القَهْوَةَ فِي المَقْهَى.
(Where do you drink coffee? I drink coffee in the café.)

Include at least 2–3 short dialogues per lesson if possible.

---

### 7️⃣ Pronunciation Practice
* Identify the letters or sounds the teacher corrected or emphasised.
* Give a short note on how to pronounce them correctly.
* Include a few example words to practise.

Example:
Focus on ق (qāf) and خ (khā') — both come from the back of the throat.
Drill with words like: قَرْيَة, خَرَجَ, أَخْرَجَ.

---

### 8️⃣ Key Takeaways
* Write a short list (3–5 bullet points) summarising what the student can now do after this lesson.
* Keep it positive and clear.

Example:
* Can form sentences using the future tense.
* Can use يُوجَدُ / تُوجَدُ correctly for "there is/are."
* Can ask and answer "how many?" questions.
* Can pronounce خ, ق, and ط accurately.

---

### 9️⃣ Mini Quiz
* Create at least 10 quiz questions that test vocabulary, grammar, and sentence understanding.
* Include different question types:
  - Arabic ↔️ English translation
  - Multiple choice
  - Fill-in-the-blank
  - True/False
* Always mark the correct answer with a ✅ symbol.

Example:
1. Translate: We will spend the holiday on the beach. → سَنَقْضِي العُطْلَةَ عَلَى الشَّاطِئِ ✅
2. What does "كَمْ كِتَابًا؟" mean?
   a) Whose books? b) How many books? ✅ c) Where are the books?
3. True or False: "مُعَلِّمَانِ" means two teachers ✅

---

### 🔟 Homework / Practice Tasks
* List 3–5 things the student should do before the next lesson.
* Include a mix of writing, speaking, and reading tasks.
* Keep each one short and actionable.

Example:
📝 Write 5 sentences using أَخْرَجَ in past and future forms.
🗣️ Practise reading the dialogue aloud and record yourself.
📖 Revise vocabulary flashcards for "places" and "daily actions."
🎧 Listen to a short Arabic clip and try to repeat each sentence clearly.

---

### 11️⃣ Talbiyah Insights Summary (Final Reflection)
* End with a short paragraph that encourages the student and links this lesson to their Arabic journey.
* Make it sound personal and reflective.

Example:
> This lesson strengthened your ability to speak about everyday activities using accurate Arabic grammar and pronunciation.
> Review these notes carefully to build confidence, and practise daily so that Arabic becomes more natural for you.

---

### RULES FOR THE AI
* Always produce detailed notes, not short bullet points.
* Each section above must be included in the output.
* Always show Arabic words with Tashkīl where possible.
* Use simple English explanations that any beginner can understand.
* Keep the tone friendly, encouraging, and easy to follow.
* Do not include Qur'an or Hadith unless the Arabic lesson was based on them.
* Always include at least 15 new vocabulary words and 10 quiz questions.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();

  try {
    const { lesson_id, transcript, subject, metadata }: LessonInsightRequest = await req.json();

    if (!lesson_id || !transcript || !subject || !metadata) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: lesson_id, transcript, subject, and metadata are required" }),
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

    // Determine which prompt to use based on subject
    let systemPrompt: string;
    let insightType: string;
    let title: string;

    const subjectLower = subject.toLowerCase();

    if (subjectLower.includes('quran') || subjectLower.includes('qur')) {
      systemPrompt = QURAN_PROMPT;
      insightType = 'subject_specific';
      title = `Qur'an Insights: ${metadata.surah_name || 'Lesson'} ${metadata.ayah_range ? `(${metadata.ayah_range})` : ''}`;
    } else if (subjectLower.includes('arabic')) {
      systemPrompt = ARABIC_PROMPT;
      insightType = 'subject_specific';
      title = `Arabic Language Insights: ${metadata.lesson_date}`;
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported subject for insights generation: ${subject}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build user prompt based on subject type
    let userPrompt = `Generate Talbiyah Insights for this ${subject} lesson:

METADATA:`;

    if (metadata.surah_name && metadata.surah_number) {
      userPrompt += `
- Surah: ${metadata.surah_name} (${metadata.surah_number})
- Verses: ${metadata.ayah_range}`;
    }

    userPrompt += `
- Teacher: ${metadata.teacher_name}
- Students: ${metadata.student_names.join(', ')}
- Date: ${metadata.lesson_date}`;

    if (metadata.duration_minutes) {
      userPrompt += `
- Duration: ${metadata.duration_minutes} minutes`;
    }

    userPrompt += `

TRANSCRIPT:
${transcript}

Generate the insights following the exact format specified in the system prompt.`;

    console.log(`Calling Claude API to generate ${subject} insights...`);

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
          max_tokens: 8192, // Increased for detailed Arabic notes
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

    // Check if insight already exists for this lesson
    const { data: existingInsight } = await supabase
      .from('lesson_insights')
      .select('id')
      .eq('lesson_id', lesson_id)
      .single();

    let savedInsight;
    let saveError;

    if (existingInsight) {
      // Update existing
      const { data, error } = await supabase
        .from('lesson_insights')
        .update({
          insight_type: insightType,
          title: title,
          summary: generatedText.substring(0, 500),
          detailed_insights: {
            content: generatedText,
            subject: subject,
            metadata: metadata,
            generated_at: new Date().toISOString(),
          },
          ai_model: 'claude-sonnet-4-20250514',
          confidence_score: 0.90,
          processing_time_ms: processingTime,
        })
        .eq('id', existingInsight.id)
        .select()
        .single();
      savedInsight = data;
      saveError = error;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('lesson_insights')
        .insert({
          lesson_id,
          insight_type: insightType,
          title: title,
          summary: generatedText.substring(0, 500),
          detailed_insights: {
            content: generatedText,
            subject: subject,
            metadata: metadata,
            generated_at: new Date().toISOString(),
          },
          ai_model: 'claude-sonnet-4-20250514',
          confidence_score: 0.90,
          processing_time_ms: processingTime,
        })
        .select()
        .single();
      savedInsight = data;
      saveError = error;
    }

    if (saveError) {
      console.error("Error saving insights:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save insights to database", details: saveError.message }),
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
        insight_type: insightType,
        content: generatedText,
        processing_time_ms: processingTime,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating lesson insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
