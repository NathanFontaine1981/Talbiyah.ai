import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

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
      translations: '131',
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

## 🎯 First Word Prompter (Verified from Quran.com)

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

**2. Verses Covered (Arabic & Translation)**
Display each verse that was studied in this lesson as a table. For each ayah include:
- Ayah number
- Full Arabic text (Uthmānī script with tashkīl/vowel marks)
- English translation

Use this table format:
| Ayah | Arabic | Translation |
|------|--------|-------------|
| 1 | بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ | In the name of Allah, the Most Gracious, the Most Merciful |

Include ALL verses covered in the lesson (typically 5-15 ayat).

---

**3. Flow of Meaning (Tafsīr Summary)**
Write a detailed English explanation of the verses in order, combining:
- Word-by-word or phrase-by-phrase breakdown where relevant
- Translation of key Arabic terms
- Tafsīr points from the teacher's explanation
- Context (when revealed, why, to whom)
- Key moral and spiritual messages

Break this into paragraphs, one for each group of related ayat. Use subheadings like "Ayat 1-3: [Theme]" to organize.

---

**4. Key Arabic Vocabulary**
List **15 important Arabic words** from the verses covered. For each word:
- Arabic word (Uthmānī script with tashkīl)
- Transliteration (with proper vowel marks)
- Root letters (3-letter root)
- English meaning
- Context/note (how it's used in the ayah)

Use this table format:
| Arabic | Transliteration | Root | Meaning | Note |
|--------|-----------------|------|---------|------|
| تَبَـٰرَكَ | tabāraka | ب-ر-ك | Blessed is He | Expresses abundance of blessing and greatness |

---

**5. Key Takeaways & Tadabbur Points**
List 7–10 short, impactful lessons or reflections that the student should remember.
These key points will help them answer the quiz below, so include all important facts.
Focus on what the verses teach about:
- Allah's names and attributes (with specific meanings)
- Human character and behaviour
- Spiritual growth and taqwa
- Practical application in daily life
- Connection to other verses/surahs

---

**6. Mini Quiz (Comprehension Check)**
Create 5 multiple-choice questions drawn from the Key Takeaways above.
Mix meaning, tafsīr context, vocabulary, and verse identification.
IMPORTANT: The quiz tests whether the student understood the Key Takeaways.

Format each question EXACTLY like this - put ✅ ONLY after the CORRECT answer:
**Q1.** What does "Ar-Raḥmān" specifically refer to?
A) Allah's mercy only for Muslims B) Allah's universal mercy for all creation ✅ C) Allah's anger toward sinners D) Allah's knowledge of everything

CRITICAL: Double-check that the ✅ is placed after the factually correct answer based on Islamic knowledge.

---

**7. Reflection Questions**
Provide 4–5 open-ended questions that help students apply the teachings to daily life.
Encourage deep thinking and self-assessment, not rote recall.
Make them personal and actionable.

---

**8. First Word Prompter (Memorization Aid)**
Create a table to help with memorization. For each ayah covered:
- Ayah number
- First word (Arabic with tashkīl)
- Transliteration
- Brief hint about the verse content

| Ayah | First Word | Transliteration | Hint |
|------|------------|-----------------|------|
| 1 | تَبَـٰرَكَ | tabāraka | Blessed is He who has dominion |

---

**9. Homework & Weekly Reflection Task**
List 3–4 practical follow-up tasks:
- 📖 Reading/recitation practice with specific verses
- 🎧 Listening recommendation (specific reciter)
- ✍️ Written reflection prompt
- 🤲 Practical action/du'a to implement

---

**10. Summary Takeaway**
End with a 3–4 sentence summary that captures:
- The main theme of the verses
- The spiritual message and emotional impact
- One key action point for the student

---

### QUIZ ANSWER VERIFICATION
Before finalizing the quiz, verify each answer is factually correct:
- Ar-Raḥmān = universal mercy for ALL creation (not just Muslims)
- Ar-Raḥīm = special mercy for believers
- Rabb al-'Ālamīn = Lord of all the worlds
- Mālik Yawm al-Dīn = Master of the Day of Judgment
Always mark the CORRECT answer with ✅

---

### 🧹 CLEAN-UP AND FILTER RULES
- **Include only content directly related to the Qur'an lesson** (tafsīr, translation, examples, reflections, Arabic analysis).
- **Exclude** all irrelevant conversation: greetings ("How are you?"), small talk, technical issues, setup chat, and off-topic discussion.
- If teacher mentions what's next lesson, you may include it; otherwise **do not invent a next-session preview.**

---

### FORMATTING RULES
1. Follow this exact order and headings for consistency.
2. Write in warm, educational, and reflective tone.
3. Keep Arabic in standard Uthmānī script with full tashkīl (vowel marks).
4. Use clear spacing, bullets, and tables for readability.
5. Stay faithful to what was actually said in the lesson — supplement with authentic tafsīr only where needed for clarity.
6. Always include ALL verses that were covered in the lesson.`;

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
    let verifiedVerses: VerifiedVerse[] = [];
    let firstWordPrompterSection = '';
    let verifiedFirstWordsContext = '';

    const subjectLower = subject.toLowerCase();
    const isQuranLesson = subjectLower.includes('quran') || subjectLower.includes('qur');

    if (isQuranLesson) {
      systemPrompt = QURAN_PROMPT;
      insightType = 'subject_specific';
      title = `Qur'an Insights: ${metadata.surah_name || 'Lesson'} ${metadata.ayah_range ? `(${metadata.ayah_range})` : ''}`;

      // Fetch verified Quran data from Quran.com API
      if (metadata.surah_number && metadata.ayah_range) {
        const ayahRangeMatch = metadata.ayah_range.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (ayahRangeMatch) {
          const startAyah = parseInt(ayahRangeMatch[1], 10);
          const endAyah = parseInt(ayahRangeMatch[2], 10);

          console.log(`Fetching verified Quran data for Surah ${metadata.surah_number}, Ayat ${startAyah}-${endAyah}...`);
          verifiedVerses = await fetchVerifiedQuranData(metadata.surah_number, startAyah, endAyah);
          console.log(`Fetched ${verifiedVerses.length} verified verses from Quran.com API`);

          // Generate verified First Word Prompter section
          firstWordPrompterSection = generateFirstWordPrompterSection(verifiedVerses);

          // Create context for AI prompt
          if (verifiedVerses.length > 0) {
            verifiedFirstWordsContext = `\n\nVERIFIED FIRST WORDS (from Quran.com API - USE THESE EXACT VALUES):\n${verifiedVerses.map(v => `Ayah ${v.ayahNumber}: ${v.firstWord} (${v.transliteration})`).join('\n')}\n`;
          }
        }
      }
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
${verifiedFirstWordsContext}
TRANSCRIPT:
${transcript}

${isQuranLesson && verifiedVerses.length > 0 ? 'IMPORTANT: If you include a First Word Prompter section, you MUST use the VERIFIED FIRST WORDS provided above. Do NOT guess or generate first words - they have been verified from the Quran.com API.\n\n' : ''}Generate the insights following the exact format specified in the system prompt.`;

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

    // Append verified First Word Prompter section for Quran lessons
    if (isQuranLesson && firstWordPrompterSection) {
      generatedText = generatedText + firstWordPrompterSection;
      console.log("Appended verified First Word Prompter section from Quran.com API");
    }

    console.log("Insights generated successfully, saving to database...");

    // Extract key topics from the generated content
    const extractKeyTopics = (content: string, isQuran: boolean): string[] => {
      const topics: string[] = [];

      if (isQuran) {
        // Check for tafsir content
        if (content.toLowerCase().includes('tafsīr') || content.toLowerCase().includes('tafsir') || content.includes('Flow of Meaning')) {
          topics.push('Tafsir');
        }
        // Check for tadabbur/reflection content
        if (content.toLowerCase().includes('tadabbur') || content.includes('Reflection')) {
          topics.push('Tadabbur');
        }
        // Check for memorization content
        if (content.toLowerCase().includes('memoriz') || content.includes('First Word Prompter') || content.toLowerCase().includes('hifz')) {
          topics.push('Memorization');
        }
        // Check for vocabulary
        if (content.includes('Arabic Vocabulary') || content.includes('Key Arabic')) {
          topics.push('Vocabulary');
        }
        // Check for quiz
        if (content.includes('Mini Quiz') || content.includes('Comprehension Check')) {
          topics.push('Quiz');
        }
      } else {
        // Arabic lessons
        if (content.includes('Grammar Focus') || content.toLowerCase().includes('grammar')) {
          topics.push('Grammar');
        }
        if (content.includes('Vocabulary List') || content.toLowerCase().includes('vocabulary')) {
          topics.push('Vocabulary');
        }
        if (content.includes('Conversation Practice') || content.toLowerCase().includes('dialogue')) {
          topics.push('Conversation');
        }
        if (content.includes('Pronunciation') || content.toLowerCase().includes('pronunciation')) {
          topics.push('Pronunciation');
        }
      }

      return topics;
    };

    const keyTopics = extractKeyTopics(generatedText, isQuranLesson);
    console.log("Extracted key topics:", keyTopics);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const processingTime = Date.now() - startTime;

    // Fetch lesson to get teacher_id and learner_id for RLS
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('teacher_id, learner_id, subject_id')
      .eq('id', lesson_id)
      .single();

    if (lessonError || !lessonData) {
      console.error("Error fetching lesson data:", lessonError);
      return new Response(
        JSON.stringify({ error: "Lesson not found", details: lessonError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Lesson data fetched:", { teacher_id: lessonData.teacher_id, learner_id: lessonData.learner_id });

    // Check if insight already exists for this lesson
    const { data: existingInsight } = await supabase
      .from('lesson_insights')
      .select('id')
      .eq('lesson_id', lesson_id)
      .single();

    let savedInsight;
    let saveError;

    // Build detailed insights object with verified Quran data if available
    const detailedInsightsData = {
      content: generatedText,
      subject: subject,
      metadata: metadata,
      generated_at: new Date().toISOString(),
      ...(isQuranLesson && verifiedVerses.length > 0 && {
        verified_verses: verifiedVerses,
        quran_api_source: 'quran.com/api/v4',
      }),
    };

    if (existingInsight) {
      // Update existing - ensure teacher_id, learner_id, subject_id are set for RLS
      const { data, error } = await supabase
        .from('lesson_insights')
        .update({
          teacher_id: lessonData.teacher_id,
          learner_id: lessonData.learner_id,
          subject_id: lessonData.subject_id,
          insight_type: insightType,
          title: title,
          summary: generatedText.substring(0, 500),
          key_topics: keyTopics,
          detailed_insights: detailedInsightsData,
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
      // Insert new - include teacher_id, learner_id, subject_id for RLS
      const { data, error } = await supabase
        .from('lesson_insights')
        .insert({
          lesson_id,
          teacher_id: lessonData.teacher_id,
          learner_id: lessonData.learner_id,
          subject_id: lessonData.subject_id,
          insight_type: insightType,
          title: title,
          summary: generatedText.substring(0, 500),
          key_topics: keyTopics,
          detailed_insights: detailedInsightsData,
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
