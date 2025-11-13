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

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount,
        error_count: errorCount,
        total_processed: expiredRecordings.length,
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
