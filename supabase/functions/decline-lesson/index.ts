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
    const {
      lesson_id,
      decline_reason,
      suggested_times, // Array of alternative timestamps
    } = await req.json();

    if (!lesson_id || !decline_reason) {
      return new Response(
        JSON.stringify({ error: "lesson_id and decline_reason are required" }),
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
        learner_id,
        teacher_id,
        scheduled_time,
        duration_minutes,
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

    // Update lesson to declined
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        confirmation_status: "declined",
        declined_at: new Date().toISOString(),
        decline_reason: decline_reason,
        suggested_alternative_times: suggested_times || null,
        status: "cancelled",
      })
      .eq("id", lesson_id);

    if (updateError) {
      console.error("Error updating lesson:", updateError);
      throw updateError;
    }

    // Return credit to student
    const { error: creditError } = await supabase.rpc("add_user_credits", {
      p_user_id: lesson.learners.parent_id,
      p_credits: 1,
      p_purchase_id: null,
      p_notes: `Credit returned - Lesson declined by teacher (${lesson_id})`,
    });

    if (creditError) {
      console.error("Error returning credit:", creditError);
      // Don't fail the whole operation if credit return fails
      // Log it for manual intervention
    }

    console.log(`❌ Lesson ${lesson_id} declined by teacher ${lesson.teacher_id}`);
    console.log(`💰 Credit returned to student ${lesson.learners.parent_id}`);
    console.log(`📧 Send decline notification to: ${lesson.learners.profiles.email}`);

    // Send email notification to student
    const teacherName = lesson.teacher_profiles?.profiles?.full_name || "Your teacher";
    const studentEmail = lesson.learners?.profiles?.email;
    const studentName = lesson.learners?.profiles?.full_name || "Student";

    if (studentEmail) {
      try {
        const notificationResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-notification-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              type: "lesson_declined",
              recipient_email: studentEmail,
              recipient_name: studentName,
              data: {
                teacher_name: teacherName,
                scheduled_time: lesson.scheduled_time,
                reason: decline_reason,
              },
            }),
          }
        );

        if (notificationResponse.ok) {
          console.log("✅ Decline notification email sent successfully");
        } else {
          const errorText = await notificationResponse.text();
          console.error("Failed to send email:", errorText);
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lesson declined and credit returned",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in decline-lesson:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
