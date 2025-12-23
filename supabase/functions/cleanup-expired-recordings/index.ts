import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Starting cleanup of expired recordings...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find recordings that have expired (older than 7 days and not already deleted)
    const { data: expiredRecordings, error: fetchError } = await supabase
      .from("lesson_recordings")
      .select("id, lesson_id, storage_path, recording_url")
      .lt("expires_at", new Date().toISOString())
      .is("deleted_at", null)
      .neq("status", "expired");

    if (fetchError) {
      console.error("Error fetching expired recordings:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch expired recordings" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!expiredRecordings || expiredRecordings.length === 0) {
      console.log("No expired recordings found");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired recordings to cleanup",
          deleted_count: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${expiredRecordings.length} expired recordings to cleanup`);

    let deletedCount = 0;
    let errorCount = 0;

    for (const recording of expiredRecordings) {
      try {
        // Delete from Supabase storage if storage_path exists
        if (recording.storage_path) {
          const { error: storageError } = await supabase.storage
            .from("lesson-recordings")
            .remove([recording.storage_path]);

          if (storageError) {
            console.error(`Error deleting storage file ${recording.storage_path}:`, storageError);
            errorCount++;
            continue;
          }
        }

        // Soft delete: update status and set deleted_at timestamp
        const { error: updateError } = await supabase
          .from("lesson_recordings")
          .update({
            status: "expired",
            deleted_at: new Date().toISOString(),
            download_url: null, // Remove download URL
            recording_url: null, // Remove external URL
          })
          .eq("id", recording.id);

        if (updateError) {
          console.error(`Error updating recording ${recording.id}:`, updateError);
          errorCount++;
        } else {
          deletedCount++;
          console.log(`Deleted recording ${recording.id}`);
        }
      } catch (error) {
        console.error(`Error processing recording ${recording.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Cleanup complete: ${deletedCount} deleted, ${errorCount} errors`);

    // Also clean up expired recording URLs from lessons table
    // Note: Insights remain - only the recording URL is cleared
    const { data: expiredLessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id")
      .lt("recording_expires_at", new Date().toISOString())
      .not("recording_url", "is", null);

    let lessonsCleared = 0;
    if (!lessonsError && expiredLessons && expiredLessons.length > 0) {
      console.log(`Found ${expiredLessons.length} lessons with expired recording URLs`);

      const { error: updateLessonsError } = await supabase
        .from("lessons")
        .update({ recording_url: null })
        .lt("recording_expires_at", new Date().toISOString())
        .not("recording_url", "is", null);

      if (!updateLessonsError) {
        lessonsCleared = expiredLessons.length;
        console.log(`Cleared ${lessonsCleared} expired recording URLs from lessons`);
      } else {
        console.error("Error clearing lesson recording URLs:", updateLessonsError);
      }
    }

    // Clean up expired diagnostic assessment recordings (30-day retention)
    // Note: Assessment data and admin reviews are preserved
    let assessmentsCleared = 0;
    try {
      const { data: expiredAssessments, error: assessmentsError } = await supabase
        .from("diagnostic_assessments")
        .select("id")
        .lt("recording_expires_at", new Date().toISOString())
        .not("recording_url", "is", null);

      if (!assessmentsError && expiredAssessments && expiredAssessments.length > 0) {
        console.log(`Found ${expiredAssessments.length} diagnostic assessments with expired recordings`);

        const { error: updateAssessmentsError } = await supabase
          .from("diagnostic_assessments")
          .update({ recording_url: null })
          .lt("recording_expires_at", new Date().toISOString())
          .not("recording_url", "is", null);

        if (!updateAssessmentsError) {
          assessmentsCleared = expiredAssessments.length;
          console.log(`Cleared ${assessmentsCleared} expired recording URLs from diagnostic assessments`);
        } else {
          console.error("Error clearing diagnostic assessment recording URLs:", updateAssessmentsError);
        }
      }
    } catch (assessmentError) {
      console.error("Error processing diagnostic assessment recordings:", assessmentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount,
        error_count: errorCount,
        total_processed: expiredRecordings.length,
        lessons_cleared: lessonsCleared,
        assessments_cleared: assessmentsCleared,
        note: "Insights and assessment data are preserved - only recording URLs are cleared (7 days for lessons, 30 days for assessments)",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in cleanup function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
