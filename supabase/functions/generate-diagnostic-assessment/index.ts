import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { assessment_id } = await req.json();

    if (!assessment_id) {
      throw new Error("Assessment ID is required");
    }

    // Get the diagnostic assessment
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from("diagnostic_assessments")
      .select("*")
      .eq("id", assessment_id)
      .single();

    if (assessmentError || !assessment) {
      throw new Error("Assessment not found");
    }

    // Verify user owns this assessment
    if (assessment.student_id !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("roles")
        .eq("id", user.id)
        .single();

      if (!profile?.roles?.includes("admin")) {
        throw new Error("Unauthorized to access this assessment");
      }
    }

    // Check if already analyzed
    if (assessment.ai_preliminary_assessment) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Assessment already analyzed",
          assessment: assessment.ai_preliminary_assessment,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const preAssessmentResponses = assessment.pre_assessment_responses;

    // Use Anthropic Claude API
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("CLAUDE_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("AI API key not configured");
    }

    const prompt = `You are an experienced Islamic education advisor at Talbiyah.ai. We teach Quran using the Understanding → Fluency → Memorisation methodology:

UNDERSTANDING (Fahm): Know the meaning before memorising
FLUENCY (Itqan): Read correctly with Tajweed before memorising
MEMORISATION (Hifz): Built on understanding and fluency

Based on the following student questionnaire responses, provide a preliminary assessment to help the teacher prepare for a 20-minute diagnostic lesson.

Student Responses:
${JSON.stringify(preAssessmentResponses, null, 2)}

Provide your analysis in this exact JSON structure (return ONLY valid JSON, no markdown code blocks):
{
  "estimated_level": "Absolute Beginner | Beginner | Lower Intermediate | Upper Intermediate | Advanced",
  "level_reasoning": "2-3 sentences explaining why you assessed this level",
  "recommended_phase": "foundations | understanding | fluency | memorization",
  "phase_reasoning": "Which phase of our methodology should they start in and why",
  "methodology_fit": "strong | moderate | needs_education | misaligned",
  "methodology_notes": "How aligned is this student with our approach? Any concerns?",
  "identified_strengths": ["strength 1", "strength 2", "strength 3"],
  "potential_challenges": ["challenge 1", "challenge 2", "challenge 3"],
  "recommended_starting_point": "Specific recommendation for where to begin (e.g., 'Start with Arabic alphabet recognition' or 'Begin with Al-Fatiha meaning study')",
  "suggested_approach": "Teaching approach that would work best for this learner based on their learning style and age",
  "realistic_timeline": "Adjusted timeline estimate based on their goals, current level, and lesson frequency",
  "questions_for_teacher": ["Question 1 teacher should explore", "Question 2", "Question 3"],
  "red_flags": ["Any concerns or things teacher should be aware of"],
  "personalized_message": "A warm, encouraging 2-3 sentence message to include in the report that speaks directly to the student/parent about their upcoming assessment"
}`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`AI API error: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const content = anthropicData.content?.[0]?.text;

    if (!content) {
      console.error("No content in Anthropic response:", anthropicData);
      throw new Error("No content received from AI");
    }

    // Parse the JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis: " + (parseError instanceof Error ? parseError.message : "Unknown parse error"));
    }

    // Update the assessment with AI analysis
    const { error: updateError } = await supabaseClient
      .from("diagnostic_assessments")
      .update({
        ai_preliminary_assessment: analysis,
        recommended_phase: analysis.recommended_phase,
        methodology_alignment: analysis.methodology_fit,
        status: "ai_analyzed",
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq("id", assessment_id);

    if (updateError) {
      console.error("Failed to update assessment:", updateError);
      throw new Error("Failed to save AI analysis");
    }

    return new Response(
      JSON.stringify({
        success: true,
        assessment: analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-diagnostic-assessment:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
