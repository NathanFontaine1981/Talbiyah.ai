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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🤖 Running auto-acknowledge job...");

    // Auto-acknowledge lessons pending > 24 hours
    const { data: autoAcknowledged, error } = await supabase.rpc(
      "auto_acknowledge_pending_lessons"
    );

    if (error) {
      console.error("Error auto-acknowledging lessons:", error);
      throw error;
    }

    const count = autoAcknowledged?.length || 0;
    console.log(`✅ Auto-acknowledged ${count} lesson(s)`);

    // Send emails for auto-acknowledged lessons
    if (autoAcknowledged && autoAcknowledged.length > 0) {
      for (const lesson of autoAcknowledged) {
        console.log(`📧 Auto-acknowledged lesson ${lesson.lesson_id}:`);
        console.log(`   Student: ${lesson.student_name}`);
        console.log(`   Teacher: ${lesson.teacher_name}`);
        console.log(`   Scheduled: ${lesson.scheduled_time}`);

        // TODO: Send email notifications
        // To Student: "Your lesson has been confirmed (auto-acknowledged)"
        // To Teacher: "Reminder: Lesson auto-acknowledged - room opens 6 hours before"
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        auto_acknowledged_count: count,
        lessons: autoAcknowledged || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in auto-acknowledge-lessons:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
