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
    const { user_id, reason } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
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
      .select("id, email, full_name, roles, deleted_at")
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

    // Check if already soft-deleted
    if (targetUser.deleted_at) {
      return new Response(
        JSON.stringify({ error: "User is already soft-deleted", deleted_at: targetUser.deleted_at }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate hard delete date (1 year from now)
    const now = new Date();
    const hardDeleteAt = new Date(now);
    hardDeleteAt.setFullYear(hardDeleteAt.getFullYear() + 1);

    // Soft delete the user
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        deleted_at: now.toISOString(),
        hard_delete_at: hardDeleteAt.toISOString(),
        deleted_by: callingUser.id,
        deletion_reason: reason || null,
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error soft-deleting user:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to soft-delete user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Block user from logging in by updating auth metadata
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: {
        ...targetUser,
        account_suspended: true,
        suspended_at: now.toISOString()
      },
      ban_duration: "876000h" // ~100 years (effectively permanent until restored)
    });

    if (authUpdateError) {
      console.error("Error banning user:", authUpdateError);
      // Don't fail the request, the soft delete is still recorded
    }

    console.log(`User ${user_id} (${targetUser.email}) soft-deleted by admin ${callingUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetUser.full_name || targetUser.email} has been soft-deleted`,
        deleted_at: now.toISOString(),
        hard_delete_at: hardDeleteAt.toISOString(),
        user_id: user_id,
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
