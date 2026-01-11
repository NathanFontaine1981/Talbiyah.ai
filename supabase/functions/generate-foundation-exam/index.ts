import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExamQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!profile?.roles?.includes("Admin")) {
      throw new Error("Admin access required");
    }

    const { video_id, transcript, video_title, category_name } = await req.json();

    if (!video_id || !transcript) {
      throw new Error("video_id and transcript are required");
    }

    if (transcript.length < 100) {
      throw new Error("Transcript is too short to generate meaningful questions");
    }

    // Use Anthropic Claude API
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("CLAUDE_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("AI API key not configured");
    }

    const prompt = `You are an Islamic education expert creating an exam for a video lesson. The exam should test comprehension of the key concepts discussed in the video.

Video Title: ${video_title || 'Foundation Lesson'}
Category: ${category_name || 'Islamic Foundations'}

Transcript:
${transcript.substring(0, 15000)} ${transcript.length > 15000 ? '... (truncated)' : ''}

Generate exactly 10 multiple-choice questions based on this content. Each question should:
1. Test understanding of a key concept from the video
2. Have 4 answer options (A, B, C, D)
3. Have only ONE correct answer
4. Include a brief explanation for why the correct answer is right
5. Use clear, respectful Islamic terminology
6. Cover different parts of the video content

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "questions": [
    {
      "question": "The question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Important:
- correctAnswer is the index (0-3) of the correct option
- Make questions progressively cover the video from beginning to end
- Avoid trick questions - test genuine understanding
- Use accurate Islamic terminology and transliteration`;

    console.log(`Generating exam for video: ${video_id}`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.[0]?.text;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let examData;
    try {
      // Remove any potential markdown code blocks
      const cleanJson = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      examData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse exam questions from AI response");
    }

    const questions: ExamQuestion[] = examData.questions;

    if (!questions || !Array.isArray(questions) || questions.length < 5) {
      throw new Error("AI did not generate enough valid questions");
    }

    // Validate question structure
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
          typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error("Invalid question structure in AI response");
      }
    }

    // Save the exam to the database
    const { data: exam, error: examError } = await supabaseClient
      .from("foundation_exams")
      .upsert({
        video_id,
        questions,
        passing_score: 70,
        generated_by: 'ai',
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'video_id'
      })
      .select()
      .single();

    if (examError) {
      console.error("Error saving exam:", examError);
      throw new Error("Failed to save exam to database");
    }

    console.log(`Successfully generated ${questions.length} questions for video ${video_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        exam_id: exam.id,
        question_count: questions.length,
        questions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating exam:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
