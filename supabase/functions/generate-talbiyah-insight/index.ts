import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InsightRequest {
  lesson_id: string;
  full_transcript: string;
  lesson_metadata?: {
    subject?: string;
    teacher_notes?: string;
    duration_minutes?: number;
  };
}

interface InsightResponse {
  summary: string;
  key_concepts: string[];
  homework_tasks: string[];
  reflection_questions: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { lesson_id, full_transcript, lesson_metadata }: InsightRequest = await req.json();

    if (!lesson_id || !full_transcript) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: lesson_id and full_transcript are required" }),
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

    const systemPrompt = `You are an AI assistant specialized in analyzing Islamic education lessons and generating comprehensive learning insights. Your task is to analyze lesson transcripts and create structured educational content.

LESSON TRANSCRIPT:
${full_transcript}

${lesson_metadata ? `LESSON METADATA:
Subject: ${lesson_metadata.subject || 'Not specified'}
Teacher Notes: ${lesson_metadata.teacher_notes || 'None'}
Duration: ${lesson_metadata.duration_minutes || 'Unknown'} minutes
` : ''}

Generate comprehensive learning insights in the following JSON format:

{
  "summary": "A concise 3-4 sentence summary of the entire lesson covering the main topics, teaching approach, and key learning objectives",
  "key_concepts": [
    "Concept 1: Clear explanation of the first major concept covered",
    "Concept 2: Clear explanation of the second major concept covered",
    "Concept 3: Clear explanation of the third major concept covered",
    "Concept 4: Clear explanation of additional concepts (include 4-6 total)"
  ],
  "homework_tasks": [
    "Task 1: Specific, actionable homework task with clear instructions",
    "Task 2: Another practical task that reinforces the lesson material",
    "Task 3: A task that encourages deeper reflection or practice",
    "Task 4: Additional practice task (include 4-5 total)"
  ],
  "reflection_questions": [
    "Question 1: Thought-provoking question about the main lesson theme",
    "Question 2: Question that connects lesson content to daily life",
    "Question 3: Question that encourages deeper understanding",
    "Question 4: Question about practical application (include 4-5 total)"
  ]
}

IMPORTANT GUIDELINES:
- Summary should be concise but comprehensive
- Key concepts should be specific, not generic
- Homework tasks should be actionable and measurable
- Reflection questions should encourage critical thinking
- All content should be appropriate for Islamic education context
- Use clear, professional language
- Respond ONLY with valid JSON, no additional text`;

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
          max_tokens: 2048,
          temperature: 0.5,
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

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response:", generatedText);
      return new Response(
        JSON.stringify({ error: "Invalid response format from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result: InsightResponse = JSON.parse(jsonMatch[0]);

    if (!result.summary || !result.key_concepts || !result.homework_tasks || !result.reflection_questions) {
      return new Response(
        JSON.stringify({ error: "Incomplete response from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: upsertError } = await supabase
      .from('talbiyah_insights')
      .upsert({
        lesson_id,
        full_transcript,
        summary: result.summary,
        key_concepts: result.key_concepts,
        homework_tasks: result.homework_tasks,
        reflection_questions: result.reflection_questions,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'lesson_id'
      });

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

    return new Response(
      JSON.stringify({
        success: true,
        lesson_id,
        insights: result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating Talbiyah insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
