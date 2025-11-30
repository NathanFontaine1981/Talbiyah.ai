import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { lesson_id, summary, key_topics, areas_of_strength, areas_for_improvement, next_lesson_recommendations } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, teacher_id, learner_id, subject_id, subjects(name)")
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found", details: lessonError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete existing insight if any
    await supabase.from("lesson_insights").delete().eq("lesson_id", lesson_id);

    // Create insight - using only columns that exist
    const insightData: Record<string, unknown> = {
      lesson_id: lesson.id,
      teacher_id: lesson.teacher_id,
      learner_id: lesson.learner_id,
      summary: summary || "Lesson completed successfully."
    };

    // Add optional fields if provided
    if (key_topics) insightData.key_topics = key_topics;
    if (areas_of_strength) insightData.areas_of_strength = areas_of_strength;
    if (areas_for_improvement) insightData.areas_for_improvement = areas_for_improvement;
    if (next_lesson_recommendations) insightData.next_lesson_recommendations = next_lesson_recommendations;

    const { data: insight, error: insightError } = await supabase
      .from("lesson_insights")
      .insert(insightData)
      .select()
      .single();

    if (insightError) {
      console.error("Insert error:", insightError);
      return new Response(
        JSON.stringify({ error: "Failed to create insight", details: insightError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, insight }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
