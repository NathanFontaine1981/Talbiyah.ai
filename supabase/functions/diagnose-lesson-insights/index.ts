import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lesson_id, hours_ago = 24 } = await req.json().catch(() => ({}));

    // Get recent lessons
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours_ago);

    let query = supabase
      .from("lessons")
      .select(`
        id,
        scheduled_time,
        status,
        "100ms_room_id",
        recording_url,
        recording_expires_at,
        lesson_tier,
        free_insights_trial,
        duration_minutes,
        subjects(name),
        learners(name),
        teacher_profiles!lessons_teacher_id_fkey(profiles(full_name))
      `)
      .order("scheduled_time", { ascending: false });

    if (lesson_id) {
      query = query.eq("id", lesson_id);
    } else {
      query = query.gte("scheduled_time", cutoffTime.toISOString()).limit(20);
    }

    const { data: lessons, error: lessonsError } = await query;

    if (lessonsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch lessons", details: lessonsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For each lesson, check if insights exist and diagnose issues
    const diagnostics = await Promise.all(
      (lessons || []).map(async (lesson: any) => {
        // Check for existing insights
        const { data: insight, error: insightError } = await supabase
          .from("lesson_insights")
          .select("id, title, ai_model, created_at")
          .eq("lesson_id", lesson.id)
          .maybeSingle();

        // Determine issues
        const issues: string[] = [];
        const status: string[] = [];

        // Check room ID
        if (!lesson["100ms_room_id"]) {
          issues.push("❌ No 100ms room ID - video room was never created");
        } else {
          status.push("✅ Has 100ms room ID");
        }

        // Check recording
        if (!lesson.recording_url) {
          issues.push("❌ No recording URL - recording may not have started or webhook not received");
        } else {
          status.push("✅ Has recording URL");

          // Check if recording expired
          if (lesson.recording_expires_at) {
            const expiresAt = new Date(lesson.recording_expires_at);
            if (expiresAt < new Date()) {
              issues.push("⚠️ Recording URL has expired");
            }
          }
        }

        // Check tier
        const tier = lesson.lesson_tier || 'premium';
        if (tier === 'standard' && !lesson.free_insights_trial) {
          issues.push("ℹ️ Standard tier - insights not generated (paid lesson)");
        } else {
          status.push(`✅ Tier: ${tier} (insights enabled)`);
        }

        // Check insights
        if (insight) {
          status.push(`✅ Insight exists: "${insight.title}" (${insight.ai_model})`);
        } else {
          issues.push("❌ No insight generated");
        }

        // Check lesson status
        if (lesson.status !== 'completed') {
          issues.push(`⚠️ Lesson status is "${lesson.status}" (not completed)`);
        } else {
          status.push("✅ Lesson marked completed");
        }

        return {
          lesson_id: lesson.id,
          scheduled_time: lesson.scheduled_time,
          subject: lesson.subjects?.name,
          learner: lesson.learners?.name,
          teacher: lesson.teacher_profiles?.profiles?.full_name,
          status: lesson.status,
          has_room_id: !!lesson["100ms_room_id"],
          has_recording: !!lesson.recording_url,
          has_insight: !!insight,
          insight_title: insight?.title,
          issues,
          ok_status: status,
        };
      })
    );

    // Summary
    const summary = {
      total_lessons: diagnostics.length,
      with_insights: diagnostics.filter(d => d.has_insight).length,
      missing_insights: diagnostics.filter(d => !d.has_insight).length,
      missing_recording: diagnostics.filter(d => !d.has_recording).length,
      missing_room_id: diagnostics.filter(d => !d.has_room_id).length,
    };

    // Recommendations
    const recommendations: string[] = [];

    if (summary.missing_room_id > 0) {
      recommendations.push("Some lessons don't have 100ms room IDs. Check if rooms are being created on booking.");
    }

    if (summary.missing_recording > 0 && summary.missing_room_id === 0) {
      recommendations.push(
        "Lessons have room IDs but no recordings. Possible causes:",
        "  1. Recording wasn't started (teacher needs to join first)",
        "  2. 100ms webhook not configured - check 100ms dashboard",
        "  3. Webhook URL: Check if handle-recording-webhook is receiving requests"
      );
    }

    if (summary.missing_insights > 0 && summary.missing_recording === 0) {
      recommendations.push(
        "Recordings exist but no insights. Check:",
        "  1. Transcript may be too short or empty",
        "  2. generate-lesson-insights function may be failing",
        "  3. Check edge function logs for errors"
      );
    }

    return new Response(
      JSON.stringify({
        summary,
        recommendations,
        lessons: diagnostics,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Diagnostic error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
