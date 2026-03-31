// @ts-ignore - Deno types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateCourseInsightsRequest {
  course_session_id: string;
  mode?: "study_notes" | "teaching_plan";
  images?: { base64: string; media_type: string }[];
}

const COURSE_INSIGHT_PROMPT = `You are an expert Islamic studies note-taker and curriculum designer. Your role is to produce comprehensive, beautifully structured study notes from a course (intensive course) session transcript.

IMPORTANT RULES:
- Use British English spelling throughout (e.g. summarise, organised, programme, behaviour, colour, realise, centre)
- All Arabic text MUST include full harakat (tashkeel/diacritical marks) — e.g. بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ not بسم الله الرحمن الرحيم
- Capture the teacher's SPECIFIC voice, examples, and explanations — not generic textbook content
- Filter out greetings, admin chat, "can you hear me", technical issues from the start of the transcript
- Be thorough but well-organised — students will use these as revision notes

OUTPUT FORMAT (use these exact markdown headers):

## Session Overview
- **Course**: [course name]
- **Teacher**: [teacher name]
- **Session**: [number] of [total]
- **Date**: [formatted date]
- **Summary**: [2-3 sentence overview of what was covered]

---

## Key Themes Covered

For each theme (3-5 themes):
### [Theme Title]
[2-3 paragraphs explaining the theme as the teacher presented it, including their specific examples, analogies, and emphasis points]

---

## Qur'anic Verses Referenced

For each verse mentioned:
> **[Surah Name] ([Surah Number]:[Ayah Number])**
>
> [Full Arabic text with tashkeel]
>
> *[English translation]*

**Context from the teacher:** [How the teacher explained or connected this verse]

---

## Key Arabic Vocabulary

| Arabic (with tashkeel) | Transliteration | Root | Meaning | Teacher's Explanation |
|---|---|---|---|---|
| [word] | [transliteration] | [root letters] | [meaning] | [how the teacher explained it] |

---

## Hadith References

For each hadith mentioned:
> **Hadith:** [Text of the hadith]
>
> **Source:** [Collection and number if known]
>
> **Context:** [How the teacher used this hadith in the lesson]

*Note: Please verify exact hadith references independently — transcription may contain minor inaccuracies.*

---

## Stories & Examples

For each story or illustrative example the teacher shared:
### [Brief Title]
[Retell the story/example as the teacher told it, preserving their narrative style and the lesson they drew from it]

---

## Connection to Previous Sessions

[If previous session summaries are provided, explain how this session builds on what came before. Reference specific themes, verses, or concepts that were introduced earlier and developed further in this session.]

[If this is Session 1, write: "This is the opening session of the course, establishing the foundational themes that will be explored throughout."]

---

## Reflections & Action Points

Practical takeaways from this session (5-7 points):
1. **[Action]**: [Brief explanation of how to implement this]
2. ...

---

## Mini Quiz

Test your understanding of this session (5-8 questions):

**Q1.** [Question text]
- A) [Option]
- B) [Option]
- C) [Option]
- D) [Option]

**Answer:** [Correct letter]) [Brief explanation]

---

## Key Takeaways

5-7 bullet points summarising the most important lessons:
- [Takeaway 1]
- [Takeaway 2]
- ...

---

## Preparation for Next Session

[Based on the teacher's comments about what's coming next, suggest what students should review or think about before the next session. If the teacher didn't mention this, provide a general suggestion based on the themes covered.]`;

const TEACHING_PLAN_PROMPT = `You are creating an interactive teaching plan for Nathan and Kareem to deliver a Wednesday evening class for new Muslim brothers at Cheadle Masjid. This is for the "Exploring Islam" course using Islamic Studies Books 1-4 by Dr. Abu Ameenah Bilal Philips.

CONTEXT:
- Class: 7:15-8:30 PM (with Isha prayer break around 8:00 PM)
- Students: 10 adult male reverts (new Muslims)
- Teachers: Nathan (former footballer, BBC commentator) and Kareem
- Teaching method: Read from the book → Stop at marked points → Discuss → Engage → Continue
- The book will ALWAYS be read - your job is to add the interactive layer

YOUR TASK:
Create a teaching guide that adds life, engagement, and real-world connection to the book content. The teachers will READ the book text themselves - you provide what to SAY and DO in addition to make it stick.

STRUCTURE OF THE TEACHING PLAN:

## OPENING HOOK (2-3 MINUTES)
Create an attention-grabbing scenario, question, or story that:
- Relates directly to the chapter topic
- Makes students curious
- Can be from real life, hypothetical scenarios, or current events
- Should provoke thought or emotion
- Sets up the "why should I care?" for the lesson

## STOP POINTS THROUGHOUT THE CHAPTER

Mark 8-13 stop points where teachers should pause reading. At EACH stop point include:

### 1. DISCUSSION QUESTIONS
- 1-3 open-ended questions to ask the group
- Include expected answers or discussion direction

### 2. REAL-LIFE SCENARIOS & EXAMPLES
At least 5-7 powerful scenarios throughout the lesson:
- Before/After Islam scenarios
- Daily life situations (work, family, social media, money)
- Modern relatable examples (technology, social pressure, career)
- Historical/biographical examples (companions, Mike Tyson, Muhammad Ali)
- Analogies from nature/everyday objects (trees, buildings, sports)

### 3. INTERACTIVE ELEMENTS
3-5 interactive moments:
- Stand up physically
- Show of hands
- Turn to neighbour and discuss
- Quick 30-second reflection
- Share one word/phrase

### 4. RECAP MOMENTS
After complex concepts, include recap moments

### 5. CHECKING FOR UNDERSTANDING
Include checkpoints throughout

FORMATTING:

**OPENING HOOK (2-3 MIN)**
[Detailed scenario with exact wording]

**PAGE [X] - [SECTION TITLE] ([X] MIN)**

🛑 STOP #[N]: After "[exact line from book]"

❓ QUESTION: "[Exact question to ask]"
Expected answers: [List possible responses]

💡 SCENARIO: "[Title of scenario]"
[Full detailed scenario with exact wording]

✓ KEY POINT: "[Main teaching point]"
[Explanation/clarification]

🎯 INTERACTIVE: "[What students do]"
[Exact instructions]

📝 RECAP: "[Summary prompt]"
[What to review]

**WRAP-UP & ISHA BREAK (3-5 MIN)**
[Quick recap, one reflection question, transition to prayer]

**AFTER FOOD DISCUSSION (10-15 MIN)**
[5-7 deeper discussion questions for informal conversation]

**HOMEWORK/ACTION STEPS**
[3-5 practical things to do this week]

TONE & STYLE:

For Nathan's parts:
- Direct, no-nonsense, from personal experience
- Use sports/physical analogies
- "Let me tell you..." / "Here's the thing..."
- Can be blunt but loving

For Kareem's parts:
- More scholarly references
- Explains Arabic terms
- Provides deeper context
- Calmer, more measured delivery

Both should speak conversationally, use "you" and "we", be warm and encouraging, challenge without condemning.

SCENARIO GUIDELINES:
- Specific and detailed
- Relatable to new Muslims in UK
- Show internal thought process
- Present a choice or dilemma
- Include emotions (how it FEELS)
- Use modern language and contexts

PACING:
Total time: 75 minutes
- Opening: 2-3 min
- Teaching with stops: 45-50 min
- Wrap-up: 3-5 min
- Isha prayer: ~15 min
- Food & discussion: 10-15 min

Mark estimated time for each section and indicate which teacher handles each section.

CHECKLIST:
- Attention-grabbing opening hook
- 8-13 clearly marked stop points
- At least 1 question per stop point
- 5-7 powerful scenarios throughout
- 3-5 interactive physical moments
- 2-3 group tasks where everyone shares
- 2-3 recap moments for complex concepts
- Multiple "check for understanding" prompts
- Wrap-up with quick review
- After-food discussion questions
- Practical homework/action steps
- Time estimates for each section
- Balance between Nathan and Kareem
- Mix of challenge and encouragement
- Connection to new Muslim experience`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { course_session_id, mode = "study_notes", images }: GenerateCourseInsightsRequest = await req.json();

    if (!course_session_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: course_session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the course session with its course details
    const { data: session, error: sessionError } = await supabase
      .from("course_sessions")
      .select(`
        id, session_number, title, session_date, transcript, status,
        group_session_id,
        group_sessions!inner (
          id, name, teacher_id, description, custom_insight_prompt,
          teacher:profiles!group_sessions_teacher_id_fkey (full_name)
        )
      `)
      .eq("id", course_session_id)
      .single();

    if (sessionError || !session) {
      console.error("Error fetching course session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Course session not found", details: sessionError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const course = session.group_sessions as any;
    const teacherName = course.teacher?.full_name || "Teacher";
    const courseName = course.name;

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // MODE: TEACHING PLAN (from book page images)
    // ============================================================
    if (mode === "teaching_plan") {
      if (!images || images.length === 0) {
        return new Response(
          JSON.stringify({ error: "No book page images provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Generating teaching plan for session ${session.session_number} of "${courseName}" from ${images.length} images...`);

      const sessionDate = session.session_date
        ? new Date(session.session_date).toLocaleDateString("en-GB", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })
        : "Date not recorded";

      // Build multi-modal message with images
      const messageContent: any[] = [
        {
          type: "text",
          text: `Generate an interactive teaching plan for this session.\n\nSESSION METADATA:\n- Course: ${courseName}\n- Teachers: Nathan and Brother Kareem\n- Session Number: ${session.session_number}\n- Session Title: ${session.title || "Untitled"}\n- Date: ${sessionDate}\n\nThe following images are pages from the book that will be read aloud in class. Create a teaching plan with stop points, discussion questions, scenarios, and interactive elements based on the content in these pages.`,
        },
        ...images.map((img: { base64: string; media_type: string }) => ({
          type: "image",
          source: {
            type: "base64",
            media_type: img.media_type,
            data: img.base64,
          },
        })),
      ];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16384,
          temperature: 0.4,
          system: TEACHING_PLAN_PROMPT,
          messages: [{ role: "user", content: messageContent }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Claude API error (teaching plan):", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to generate teaching plan", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const generatedPlan = data.content?.[0]?.text;

      if (!generatedPlan) {
        return new Response(
          JSON.stringify({ error: "No teaching plan generated from AI" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const processingTime = Date.now() - startTime;
      console.log(`Teaching plan generated in ${processingTime}ms, saving...`);

      // Save teaching plan to course_sessions
      const { error: saveError } = await supabase
        .from("course_sessions")
        .update({
          teaching_plan: generatedPlan,
          teaching_plan_generated_at: new Date().toISOString(),
        })
        .eq("id", course_session_id);

      if (saveError) {
        console.error("Error saving teaching plan:", saveError);
        return new Response(
          JSON.stringify({ error: "Failed to save teaching plan", details: saveError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: "teaching_plan",
          course_session_id,
          teaching_plan: generatedPlan,
          processing_time_ms: processingTime,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // MODE: STUDY NOTES (from transcript) — default
    // ============================================================
    if (!session.transcript) {
      return new Response(
        JSON.stringify({ error: "No transcript available for this session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark session as generating
    await supabase
      .from("course_sessions")
      .update({ status: "generating" })
      .eq("id", course_session_id);

    // Fetch previous session summaries for continuity
    let previousSessionContext = "";
    if (session.session_number > 1) {
      const { data: previousInsights } = await supabase
        .from("course_insights")
        .select(`
          title, summary,
          course_sessions!inner (session_number, title, session_date)
        `)
        .eq("group_session_id", session.group_session_id)
        .order("created_at", { ascending: true });

      if (previousInsights && previousInsights.length > 0) {
        const summaries = previousInsights.map((pi: any) => {
          const ds = pi.course_sessions;
          return `Session ${ds.session_number} (${ds.session_date}): "${ds.title || pi.title}" — ${pi.summary || "No summary available"}`;
        });
        previousSessionContext = `\n\nPREVIOUS SESSION SUMMARIES (for continuity):\n${summaries.join("\n")}`;
      }
    }

    // Count total sessions for this course
    const { count: totalSessions } = await supabase
      .from("course_sessions")
      .select("id", { count: "exact", head: true })
      .eq("group_session_id", session.group_session_id);

    // Use custom prompt if the teacher set one, otherwise use default
    const systemPrompt = course.custom_insight_prompt || COURSE_INSIGHT_PROMPT;

    const sessionDate = session.session_date
      ? new Date(session.session_date).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date not recorded";

    const userPrompt = `Generate comprehensive study notes for this course session.

SESSION METADATA:
- Course: ${courseName}
- Teacher: ${teacherName}
- Session Number: ${session.session_number} of ${totalSessions || "ongoing"}
- Session Title: ${session.title || "Untitled"}
- Date: ${sessionDate}
${course.description ? `- Course Description: ${course.description}` : ""}
${previousSessionContext}

CRITICAL INSTRUCTIONS:
1. Read the ENTIRE transcript carefully before generating notes
2. Filter out greetings, technical chat, admin discussion, food/logistics talk, and off-topic conversation
3. Capture the teacher's SPECIFIC explanations, examples, and analogies — not generic content
4. All Arabic text must include full harakat (tashkeel)
5. Focus on what the teacher ACTUALLY said, not what you think they should have said
6. If Qur'anic verses are referenced, include the Arabic with tashkeel and English translation
7. Preserve the teacher's teaching style and emphasis in your notes
8. These notes are for students who MISSED the class — they should be able to learn the material from notes alone
9. Include the "aha moments" and powerful points from the lesson
10. Keep the spirit of the interactive class in the notes — include key discussion points and student reflections

TRANSCRIPT:
${session.transcript}

Generate the study notes following the exact format specified in the system prompt. Be thorough — cover everything taught, not just a summary.`;

    console.log(`Calling Claude API for course session ${session.session_number} of "${courseName}"...`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);

      // Reset session status on failure
      await supabase
        .from("course_sessions")
        .update({ status: "transcript_added" })
        .eq("id", course_session_id);

      return new Response(
        JSON.stringify({ error: "Failed to generate insights", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedText = data.content?.[0]?.text;

    if (!generatedText) {
      await supabase
        .from("course_sessions")
        .update({ status: "transcript_added" })
        .eq("id", course_session_id);

      return new Response(
        JSON.stringify({ error: "No response generated from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log(`Insights generated in ${processingTime}ms, saving to database...`);

    // Extract summary from the generated content
    const summaryMatch = generatedText.match(
      /\*\*Summary\*\*:\s*(.+?)(?:\n|$)/
    );
    const summary = summaryMatch
      ? summaryMatch[1].trim()
      : generatedText.substring(0, 500);

    const insightTitle =
      session.title ||
      `${courseName} - Session ${session.session_number}`;

    // Build detailed insights JSONB
    const detailedInsights: Record<string, unknown> = {
      content: generatedText,
      course_name: courseName,
      teacher_name: teacherName,
      session_number: session.session_number,
      session_date: session.session_date,
      generated_at: new Date().toISOString(),
    };

    // Extract quiz questions for interactive use
    const quizMatch = generatedText.match(
      /## Mini Quiz([\s\S]*?)(?=\n---|\n## )/
    );
    if (quizMatch) {
      detailedInsights.quiz_section = quizMatch[1].trim();
    }

    // Extract key takeaways
    const takeawaysMatch = generatedText.match(
      /## Key Takeaways([\s\S]*?)(?=\n---|\n## |$)/
    );
    if (takeawaysMatch) {
      detailedInsights.key_takeaways = takeawaysMatch[1].trim();
    }

    // Check if insight already exists for this session
    const { data: existingInsight } = await supabase
      .from("course_insights")
      .select("id")
      .eq("course_session_id", course_session_id)
      .limit(1);

    let savedInsight;
    let saveError;

    if (existingInsight && existingInsight.length > 0) {
      const result = await supabase
        .from("course_insights")
        .update({
          title: insightTitle,
          summary,
          insights_content: generatedText,
          detailed_insights: detailedInsights,
          ai_model: "claude-sonnet-4-20250514",
          confidence_score: 0.85,
          processing_time_ms: processingTime,
        })
        .eq("id", existingInsight[0].id)
        .select()
        .single();
      savedInsight = result.data;
      saveError = result.error;
    } else {
      const result = await supabase
        .from("course_insights")
        .insert({
          course_session_id,
          group_session_id: session.group_session_id,
          title: insightTitle,
          summary,
          insights_content: generatedText,
          detailed_insights: detailedInsights,
          ai_model: "claude-sonnet-4-20250514",
          confidence_score: 0.85,
          processing_time_ms: processingTime,
        })
        .select()
        .single();
      savedInsight = result.data;
      saveError = result.error;
    }

    if (saveError) {
      console.error("Error saving insight:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save insight", details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark session as published
    await supabase
      .from("course_sessions")
      .update({ status: "published" })
      .eq("id", course_session_id);

    console.log(`Course insight saved successfully: ${savedInsight.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        mode: "study_notes",
        insight_id: savedInsight.id,
        course_session_id,
        title: insightTitle,
        summary,
        processing_time_ms: processingTime,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-course-insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
