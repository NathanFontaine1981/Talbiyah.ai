import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// This function runs daily to permanently delete users whose grace period has expired
// Should be called via cron job or Supabase scheduled function

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: Verify this is called from an authorized source (cron job)
    // For now, this function can only be called with service role key
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        // If a user token is provided, verify they're admin
        const { data: profile } = await supabase
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
      }
    }

    console.log("Starting cleanup of expired soft-deleted users...");

    // Find all users whose hard_delete_at has passed
    const now = new Date().toISOString();
    const { data: expiredUsers, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, deleted_at, hard_delete_at")
      .not("deleted_at", "is", null)
      .not("hard_delete_at", "is", null)
      .lt("hard_delete_at", now);

    if (fetchError) {
      console.error("Error fetching expired users:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch expired users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log("No expired users to clean up");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired users to clean up",
          deleted_count: 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${expiredUsers.length} expired users to delete`);

    const results = [];

    for (const user of expiredUsers) {
      console.log(`Deleting expired user: ${user.id} (${user.email})`);

      try {
        // Get all lessons for this user
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`);

        const lessonIds = lessons?.map(l => l.id) || [];

        // Delete in dependency order (same as hard-delete-user)
        if (lessonIds.length > 0) {
          await supabase.from("lesson_insights").delete().or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`);
          await supabase.from("lesson_details").delete().in("lesson_id", lessonIds);
          await supabase.from("lesson_messages").delete().in("lesson_id", lessonIds);
          await supabase.from("lesson_recordings").delete().in("lesson_id", lessonIds);
          await supabase.from("lesson_feedback").delete().in("lesson_id", lessonIds);
        }

        await supabase.from("homework_submissions").delete().or(`learner_id.eq.${user.id},teacher_id.eq.${user.id}`);
        await supabase.from("lessons").delete().or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`);
        await supabase.from("bookings").delete().or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`);
        await supabase.from("pending_bookings").delete().eq("user_id", user.id);
        await supabase.from("cart_items").delete().eq("user_id", user.id);
        await supabase.from("learners").delete().eq("parent_id", user.id);
        await supabase.from("teacher_availability").delete().eq("teacher_id", user.id);
        await supabase.from("teacher_availability_recurring").delete().eq("teacher_id", user.id);
        await supabase.from("teacher_availability_one_off").delete().eq("teacher_id", user.id);
        await supabase.from("blocked_dates").delete().eq("teacher_id", user.id);
        await supabase.from("teacher_profiles").delete().eq("id", user.id);
        await supabase.from("teacher_earnings").delete().eq("teacher_id", user.id);
        await supabase.from("credit_transactions").delete().eq("user_id", user.id);
        await supabase.from("credit_purchases").delete().eq("user_id", user.id);
        await supabase.from("user_credits").delete().eq("user_id", user.id);
        await supabase.from("referral_transactions").delete().eq("user_id", user.id);
        await supabase.from("referrals").delete().or(`referrer_id.eq.${user.id},referred_user_id.eq.${user.id}`);
        await supabase.from("saved_khutbahs").delete().eq("user_id", user.id);
        await supabase.from("imam_conversations").delete().eq("user_id", user.id);
        await supabase.from("diagnostic_assessments").delete().or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`);
        await supabase.from("user_achievements").delete().eq("user_id", user.id);
        await supabase.from("user_feedback").delete().eq("user_id", user.id);
        await supabase.from("student_curriculum_progress").delete().eq("student_id", user.id);
        await supabase.from("student_milestone_progress").delete().eq("student_id", user.id);
        await supabase.from("student_surah_progress").delete().eq("student_id", user.id);
        await supabase.from("quran_progress").delete().eq("student_id", user.id);
        await supabase.from("arabic_learner_progress").delete().eq("learner_id", user.id);
        await supabase.from("student_teachers").delete().or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`);
        await supabase.from("student_teacher_relationships").delete().or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`);
        await supabase.from("matchmaking_profiles").delete().eq("user_id", user.id);
        await supabase.from("profiles").delete().eq("id", user.id);

        // Delete from auth
        await supabase.auth.admin.deleteUser(user.id);

        results.push({ id: user.id, email: user.email, success: true });
        console.log(`Successfully deleted user ${user.id}`);

      } catch (err) {
        console.error(`Error deleting user ${user.id}:`, err);
        results.push({ id: user.id, email: user.email, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Cleanup complete: ${successCount} deleted, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup complete: ${successCount} users permanently deleted`,
        deleted_count: successCount,
        failed_count: failCount,
        results: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
