import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { lesson_id, teacher_message } = await req.json();

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: "lesson_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        id,
        scheduled_time,
        duration_minutes,
        learner_id,
        teacher_id,
        subject_id,
        learners!inner(
          id,
          parent_id,
          profiles!inner(full_name, email)
        ),
        teacher_profiles!inner(
          profiles!inner(full_name)
        ),
        subjects(name)
      `)
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      console.error("Error fetching lesson:", lessonError);
      return new Response(
        JSON.stringify({ error: "Lesson not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update lesson to acknowledged
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        confirmation_status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
        teacher_acknowledgment_message: teacher_message || null,
      })
      .eq("id", lesson_id);

    if (updateError) {
      console.error("Error updating lesson:", updateError);
      throw updateError;
    }

    console.log(`✅ Lesson ${lesson_id} acknowledged by teacher ${lesson.teacher_id}`);
    console.log(`📧 Send acknowledgment email to: ${lesson.learners.profiles.email}`);

    // TODO: Send email notification to student
    // Include teacher message if provided
    // Remind that room opens 6 hours before lesson

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lesson acknowledged successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in acknowledge-lesson:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
