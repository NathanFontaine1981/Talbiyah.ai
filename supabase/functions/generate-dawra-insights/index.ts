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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { course_session_id }: GenerateCourseInsightsRequest = await req.json();

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

    const course = session.group_sessions as any;
    const teacherName = course.teacher?.full_name || "Teacher";
    const courseName = course.name;

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

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
2. Filter out greetings, technical chat, and admin discussion from the start
3. Capture the teacher's SPECIFIC explanations, examples, and analogies — not generic content
4. All Arabic text must include full harakat (tashkeel)
5. Focus on what the teacher ACTUALLY said, not what you think they should have said
6. If Qur'anic verses are referenced, include the Arabic with tashkeel and English translation
7. Preserve the teacher's teaching style and emphasis in your notes

TRANSCRIPT:
${session.transcript}

Generate the study notes following the exact format specified in the system prompt.`;

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
        max_tokens: 8192,
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

    // Extract title from Session Overview or use session title
    const titleMatch = generatedText.match(
      /## Session Overview[\s\S]*?\*\*Session\*\*:\s*\d+/
    );
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
      // Update existing
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
      // Insert new
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
