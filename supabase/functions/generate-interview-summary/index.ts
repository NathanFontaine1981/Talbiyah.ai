import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -----------------------------------------------
    // 1. Verify admin authentication
    // -----------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!profile?.roles?.includes("admin")) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 2. Parse request
    // -----------------------------------------------
    const { interview_id } = await req.json();

    if (!interview_id) {
      return new Response(
        JSON.stringify({ error: "interview_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 3. Fetch interview with candidate data
    // -----------------------------------------------
    const { data: interview, error: interviewError } = await serviceClient
      .from("recruitment_interviews")
      .select(
        "*, recruitment_pipeline(full_name, email, subjects, qualifications_summary, years_experience)"
      )
      .eq("id", interview_id)
      .single();

    if (interviewError || !interview) {
      return new Response(
        JSON.stringify({ error: "Interview not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!interview.interview_notes) {
      return new Response(
        JSON.stringify({ error: "No interview notes to summarize" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidate = interview.recruitment_pipeline;

    // -----------------------------------------------
    // 4. Call Claude API
    // -----------------------------------------------
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating interview summary for interview:", interview_id);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are an interview assessment assistant for Talbiyah.ai, an Islamic education platform. Please provide a structured summary of the following teacher interview.

Candidate: ${candidate.full_name}
Subjects: ${candidate.subjects?.join(", ") || "Not specified"}
Experience: ${candidate.years_experience || "Unknown"} years
Qualifications: ${candidate.qualifications_summary || "Not provided"}

Interview Notes:
${interview.interview_notes}

Ratings (out of 5):
- Teaching Demo: ${interview.teaching_demo_rating || "Not rated"}
- Communication: ${interview.communication_rating || "Not rated"}
- Knowledge: ${interview.knowledge_rating || "Not rated"}
- Personality: ${interview.personality_rating || "Not rated"}
- Overall: ${interview.overall_rating || "Not rated"}

Please provide:
1. A brief summary of the interview (2-3 sentences)
2. Key strengths identified
3. Areas for improvement
4. Recommended tier level (newcomer/apprentice/skilled/expert/master)
5. Overall recommendation (Approve / Reject / Further Review)
6. Any specific notes or concerns`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to generate summary",
          details: errorText,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const summary = aiResult.content?.[0]?.text;

    if (!summary) {
      return new Response(
        JSON.stringify({ error: "No summary generated from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI summary generated successfully");

    // -----------------------------------------------
    // 5. Update interview record with summary
    // -----------------------------------------------
    const { error: updateError } = await serviceClient
      .from("recruitment_interviews")
      .update({
        ai_summary: summary,
        ai_model: "claude-sonnet-4-20250514",
      })
      .eq("id", interview_id);

    if (updateError) {
      console.error("Failed to save AI summary:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to save summary",
          details: updateError.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 6. Return success
    // -----------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        summary,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating interview summary:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate interview summary",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
