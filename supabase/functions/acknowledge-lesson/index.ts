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

    // Get lesson details - use left joins to avoid missing data issues
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        id,
        scheduled_time,
        duration_minutes,
        learner_id,
        teacher_id,
        subject_id,
        subjects(name)
      `)
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      console.error("Error fetching lesson:", lessonError);
      return new Response(
        JSON.stringify({ error: "Lesson not found", details: lessonError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get learner info separately to handle missing data gracefully
    let studentEmail = "";
    let studentName = "Student";

    const { data: learnerData } = await supabase
      .from("learners")
      .select("id, name, parent_id")
      .eq("id", lesson.learner_id)
      .maybeSingle();

    if (learnerData?.parent_id) {
      const { data: parentProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", learnerData.parent_id)
        .maybeSingle();

      if (parentProfile) {
        studentName = parentProfile.full_name || learnerData.name || "Student";
        studentEmail = parentProfile.email || "";
      }
    } else if (learnerData) {
      studentName = learnerData.name || "Student";
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
    console.log(`📧 Send acknowledgment email to: ${studentEmail} (${studentName})`);

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
