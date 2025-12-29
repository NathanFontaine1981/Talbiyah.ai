import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TranscriptProcessRequest {
  lesson_id: string;
  recording_id: string;
  transcript_text: string;
  subject_id: string;
  teacher_id: string;
  learner_id: string;
}

interface AIInsight {
  title: string;
  summary: string;
  student_participation_score: number;
  comprehension_level: string;
  areas_of_strength: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  key_topics: string[];
  vocabulary_used: string[];
  questions_asked: number;
  teacher_feedback: string;
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
    const { lesson_id, recording_id, transcript_text, subject_id, teacher_id, learner_id }: TranscriptProcessRequest = await req.json();

    if (!lesson_id || !transcript_text) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subject name for context
    const { data: subject } = await supabase
      .from("subjects")
      .select("name, description")
      .eq("id", subject_id)
      .single();

    const subjectName = subject?.name || "Islamic Studies";
    const subjectDescription = subject?.description || "";

    const systemPrompt = `You are an expert Islamic education analyst. Analyze this lesson transcript and generate detailed insights.

SUBJECT: ${subjectName}
${subjectDescription ? `SUBJECT DESCRIPTION: ${subjectDescription}` : ''}

LESSON TRANSCRIPT:
${transcript_text}

Analyze the transcript and generate comprehensive insights in the following JSON format:

{
  "title": "A concise title summarizing the lesson focus",
  "summary": "A detailed 4-5 sentence summary of the lesson covering main topics, teaching methods, and outcomes",
  "student_participation_score": 75,
  "comprehension_level": "intermediate",
  "areas_of_strength": [
    "Specific strength 1",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "areas_for_improvement": [
    "Specific area 1",
    "Specific area 2"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "key_topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "vocabulary_used": [
    "Arabic term 1 (translation)",
    "Arabic term 2 (translation)",
    "Technical term 3"
  ],
  "questions_asked": 5,
  "teacher_feedback": "Constructive feedback from teacher perspective, highlighting what went well and suggestions for next lesson"
}

GUIDELINES:
- student_participation_score: 0-100 based on engagement, questions, responses
- comprehension_level: "beginner", "intermediate", "advanced", or "mastery"
- Focus on Islamic education context (Quran, Arabic, Islamic studies, etc.)
- Be specific and actionable
- Highlight both strengths and growth areas
- Provide constructive, encouraging feedback
- Count actual questions asked by student in transcript

Respond ONLY with valid JSON, no additional text.`;

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
          max_tokens: 3000,
          temperature: 0.4,
          messages: [
            {
              role: "user",
              content: systemPrompt
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate insights" }),
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
        JSON.stringify({ error: "No response from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON:", generatedText);
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const insights: AIInsight = JSON.parse(jsonMatch[0]);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Store insights in database
    const { data: savedInsight, error: insertError } = await supabase
      .from("lesson_insights")
      .insert({
        lesson_id,
        recording_id,
        subject_id,
        teacher_id,
        learner_id,
        insight_type: "subject_specific",
        title: insights.title,
        summary: insights.summary,
        detailed_insights: insights,
        student_participation_score: insights.student_participation_score,
        comprehension_level: insights.comprehension_level,
        areas_of_strength: insights.areas_of_strength,
        areas_for_improvement: insights.areas_for_improvement,
        recommendations: insights.recommendations,
        key_topics: insights.key_topics,
        vocabulary_used: insights.vocabulary_used,
        questions_asked: insights.questions_asked,
        teacher_feedback: insights.teacher_feedback,
        ai_model: "claude-sonnet-4-20250514",
        confidence_score: 0.85,
        processing_time_ms: processingTime,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving insights:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save insights" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Insights generated and saved:", savedInsight.id);

    return new Response(
      JSON.stringify({
        success: true,
        insight_id: savedInsight.id,
        lesson_id,
        processing_time_ms: processingTime,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing transcript:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
