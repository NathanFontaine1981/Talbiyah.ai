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
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the target user
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email, full_name, deleted_at, hard_delete_at")
      .eq("id", user_id)
      .single();

    if (userError || !targetUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is soft-deleted
    if (!targetUser.deleted_at) {
      return new Response(
        JSON.stringify({ error: "User is not deleted, nothing to restore" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Restore the user - clear deletion fields
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        deleted_at: null,
        hard_delete_at: null,
        deleted_by: null,
        deletion_reason: null,
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error restoring user:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to restore user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unban user in auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: {
        account_suspended: false,
        suspended_at: null
      },
      ban_duration: "none" // Remove the ban
    });

    if (authUpdateError) {
      console.error("Error unbanning user:", authUpdateError);
      // Don't fail the request, the restore is still recorded
    }

    console.log(`User ${user_id} (${targetUser.email}) restored by admin ${callingUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetUser.full_name || targetUser.email} has been restored`,
        user_id: user_id,
        previously_deleted_at: targetUser.deleted_at,
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
