import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");

    // Get the calling user
    const { data: { user: callingUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if calling user is admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", callingUser.id)
      .single();

    if (!adminProfile?.roles?.includes("admin")) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { user_id, confirm } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Require explicit confirmation for hard delete
    if (confirm !== "PERMANENTLY_DELETE") {
      return new Response(
        JSON.stringify({ error: "Please confirm hard delete by passing confirm: 'PERMANENTLY_DELETE'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deleting yourself
    if (user_id === callingUser.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the target user
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email, full_name, roles")
      .eq("id", user_id)
      .single();

    if (userError || !targetUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deleting other admins
    if (targetUser.roles?.includes("admin")) {
      return new Response(
        JSON.stringify({ error: "Cannot delete admin accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting hard delete for user ${user_id} (${targetUser.email})`);

    // Get all lessons where user is teacher or learner (for cascading)
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .or(`teacher_id.eq.${user_id},learner_id.eq.${user_id}`);

    const lessonIds = lessons?.map(l => l.id) || [];

    // Delete in dependency order
    const deletions = [];

    // 1. Lesson-related data (if there are lessons)
    if (lessonIds.length > 0) {
      // Lesson insights
      const d1 = await supabase.from("lesson_insights").delete().or(`teacher_id.eq.${user_id},learner_id.eq.${user_id}`);
      deletions.push({ table: "lesson_insights", error: d1.error });

      // Lesson details
      const d2 = await supabase.from("lesson_details").delete().in("lesson_id", lessonIds);
      deletions.push({ table: "lesson_details", error: d2.error });

      // Lesson messages
      const d3 = await supabase.from("lesson_messages").delete().in("lesson_id", lessonIds);
      deletions.push({ table: "lesson_messages", error: d3.error });

      // Lesson recordings
      const d4 = await supabase.from("lesson_recordings").delete().in("lesson_id", lessonIds);
      deletions.push({ table: "lesson_recordings", error: d4.error });

      // Lesson feedback
      const d5 = await supabase.from("lesson_feedback").delete().in("lesson_id", lessonIds);
      deletions.push({ table: "lesson_feedback", error: d5.error });
    }

    // 2. Homework submissions
    const d6 = await supabase.from("homework_submissions").delete().or(`learner_id.eq.${user_id},teacher_id.eq.${user_id}`);
    deletions.push({ table: "homework_submissions", error: d6.error });

    // 3. Lessons
    const d7 = await supabase.from("lessons").delete().or(`teacher_id.eq.${user_id},learner_id.eq.${user_id}`);
    deletions.push({ table: "lessons", error: d7.error });

    // 4. Bookings
    const d8 = await supabase.from("bookings").delete().or(`student_id.eq.${user_id},teacher_id.eq.${user_id}`);
    deletions.push({ table: "bookings", error: d8.error });

    // 5. Pending bookings
    const d9 = await supabase.from("pending_bookings").delete().eq("user_id", user_id);
    deletions.push({ table: "pending_bookings", error: d9.error });

    // 6. Cart items
    const d10 = await supabase.from("cart_items").delete().eq("user_id", user_id);
    deletions.push({ table: "cart_items", error: d10.error });

    // 7. Learners (children of this parent)
    const d11 = await supabase.from("learners").delete().eq("parent_id", user_id);
    deletions.push({ table: "learners", error: d11.error });

    // 8. Teacher availability tables
    const d12 = await supabase.from("teacher_availability").delete().eq("teacher_id", user_id);
    deletions.push({ table: "teacher_availability", error: d12.error });

    const d13 = await supabase.from("teacher_availability_recurring").delete().eq("teacher_id", user_id);
    deletions.push({ table: "teacher_availability_recurring", error: d13.error });

    const d14 = await supabase.from("teacher_availability_one_off").delete().eq("teacher_id", user_id);
    deletions.push({ table: "teacher_availability_one_off", error: d14.error });

    const d15 = await supabase.from("blocked_dates").delete().eq("teacher_id", user_id);
    deletions.push({ table: "blocked_dates", error: d15.error });

    // 9. Teacher profile
    const d16 = await supabase.from("teacher_profiles").delete().eq("id", user_id);
    deletions.push({ table: "teacher_profiles", error: d16.error });

    // 10. Teacher earnings
    const d17 = await supabase.from("teacher_earnings").delete().eq("teacher_id", user_id);
    deletions.push({ table: "teacher_earnings", error: d17.error });

    // 11. Credit-related
    const d18 = await supabase.from("credit_transactions").delete().eq("user_id", user_id);
    deletions.push({ table: "credit_transactions", error: d18.error });

    const d19 = await supabase.from("credit_purchases").delete().eq("user_id", user_id);
    deletions.push({ table: "credit_purchases", error: d19.error });

    const d20 = await supabase.from("user_credits").delete().eq("user_id", user_id);
    deletions.push({ table: "user_credits", error: d20.error });

    // 12. Referrals
    const d21 = await supabase.from("referral_transactions").delete().eq("user_id", user_id);
    deletions.push({ table: "referral_transactions", error: d21.error });

    const d22 = await supabase.from("referrals").delete().or(`referrer_id.eq.${user_id},referred_user_id.eq.${user_id}`);
    deletions.push({ table: "referrals", error: d22.error });

    // 13. Islamic content
    const d23 = await supabase.from("saved_khutbahs").delete().eq("user_id", user_id);
    deletions.push({ table: "saved_khutbahs", error: d23.error });

    const d24 = await supabase.from("imam_conversations").delete().eq("user_id", user_id);
    deletions.push({ table: "imam_conversations", error: d24.error });

    // 14. Diagnostic assessments
    const d25 = await supabase.from("diagnostic_assessments").delete().or(`student_id.eq.${user_id},teacher_id.eq.${user_id}`);
    deletions.push({ table: "diagnostic_assessments", error: d25.error });

    // 15. User achievements and feedback
    const d26 = await supabase.from("user_achievements").delete().eq("user_id", user_id);
    deletions.push({ table: "user_achievements", error: d26.error });

    const d27 = await supabase.from("user_feedback").delete().eq("user_id", user_id);
    deletions.push({ table: "user_feedback", error: d27.error });

    // 16. Student progress tables
    const d28 = await supabase.from("student_curriculum_progress").delete().eq("student_id", user_id);
    deletions.push({ table: "student_curriculum_progress", error: d28.error });

    const d29 = await supabase.from("student_milestone_progress").delete().eq("student_id", user_id);
    deletions.push({ table: "student_milestone_progress", error: d29.error });

    const d30 = await supabase.from("student_surah_progress").delete().eq("student_id", user_id);
    deletions.push({ table: "student_surah_progress", error: d30.error });

    const d31 = await supabase.from("quran_progress").delete().eq("student_id", user_id);
    deletions.push({ table: "quran_progress", error: d31.error });

    const d32 = await supabase.from("arabic_learner_progress").delete().eq("learner_id", user_id);
    deletions.push({ table: "arabic_learner_progress", error: d32.error });

    // 17. Student-teacher relationships
    const d33 = await supabase.from("student_teachers").delete().or(`student_id.eq.${user_id},teacher_id.eq.${user_id}`);
    deletions.push({ table: "student_teachers", error: d33.error });

    const d34 = await supabase.from("student_teacher_relationships").delete().or(`student_id.eq.${user_id},teacher_id.eq.${user_id}`);
    deletions.push({ table: "student_teacher_relationships", error: d34.error });

    // 18. Matchmaking profile
    const d35 = await supabase.from("matchmaking_profiles").delete().eq("user_id", user_id);
    deletions.push({ table: "matchmaking_profiles", error: d35.error });

    // 19. Finally, delete profile
    const d36 = await supabase.from("profiles").delete().eq("id", user_id);
    deletions.push({ table: "profiles", error: d36.error });

    // 20. Delete from auth.users
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user_id);
    deletions.push({ table: "auth.users", error: authDeleteError });

    // Log any errors
    const errors = deletions.filter(d => d.error);
    if (errors.length > 0) {
      console.error("Some deletions had errors:", errors);
    }

    console.log(`User ${user_id} (${targetUser.email}) hard-deleted by admin ${callingUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetUser.full_name || targetUser.email} has been permanently deleted`,
        user_id: user_id,
        deletion_summary: {
          total_tables: deletions.length,
          errors: errors.length,
          error_details: errors.map(e => ({ table: e.table, error: e.error?.message }))
        }
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
