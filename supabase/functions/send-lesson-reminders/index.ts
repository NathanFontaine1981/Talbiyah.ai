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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Running lesson reminder cron job...");

    // Get lessons starting in 55-65 minutes (to catch lessons in the 1-hour window)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 65 * 60000);
    const fiftyFiveMinutesFromNow = new Date(now.getTime() + 55 * 60000);

    const { data: upcomingLessons, error } = await supabase
      .from("lessons")
      .select(`
        id,
        scheduled_time,
        duration_minutes,
        subject_id,
        subjects (name),
        learner_id,
        teacher_id
      `)
      .gte("scheduled_time", fiftyFiveMinutesFromNow.toISOString())
      .lte("scheduled_time", oneHourFromNow.toISOString())
      .in("status", ["confirmed", "scheduled"])
      .is("reminder_sent", null);

    if (error) {
      console.error("Error fetching upcoming lessons:", error);
      throw error;
    }

    console.log(`Found ${upcomingLessons?.length || 0} lessons needing reminders`);

    if (!upcomingLessons || upcomingLessons.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reminders_sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let sentCount = 0;

    for (const lesson of upcomingLessons) {
      try {
        // Get student info
        const { data: { user: studentUser } } = await supabase.auth.admin.getUserById(lesson.learner_id);
        const { data: studentProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", lesson.learner_id)
          .single();

        // Get teacher info
        const { data: teacherProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", lesson.teacher_id)
          .single();

        if (!studentUser?.email || !studentProfile || !teacherProfile) {
          console.error(`Missing data for lesson ${lesson.id}`);
          continue;
        }

        // Send reminder email
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: "lesson_reminder_1h",
            recipient_email: studentUser.email,
            recipient_name: studentProfile.full_name,
            data: {
              teacher_name: teacherProfile.full_name,
              subject: lesson.subjects?.name || "Lesson",
              scheduled_time: lesson.scheduled_time,
              lesson_url: `https://talbiyah.ai/lesson/${lesson.id}`,
            },
          }),
        });

        if (emailResponse.ok) {
          // Mark reminder as sent
          await supabase
            .from("lessons")
            .update({ reminder_sent: true })
            .eq("id", lesson.id);

          sentCount++;
          console.log(`Sent reminder for lesson ${lesson.id}`);
        } else {
          console.error(`Failed to send reminder for lesson ${lesson.id}`);
        }
      } catch (lessonError) {
        console.error(`Error processing lesson ${lesson.id}:`, lessonError);
      }
    }

    console.log(`Successfully sent ${sentCount} reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: sentCount,
        total_lessons: upcomingLessons.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in lesson reminder cron:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
