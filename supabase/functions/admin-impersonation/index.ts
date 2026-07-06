import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Admin "act as student" impersonation lifecycle — a single function with two
// actions so it uses only one edge-function slot:
//   { action: 'start', target_user_id } -> mint a magic-link token for the target
//   { action: 'end',   log_id }         -> stamp ended_at on the audit row
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Case-insensitive admin check — the codebase has both 'admin' and 'Admin'.
function hasAdminRole(roles: string[] | null | undefined): boolean {
  return Array.isArray(roles) && roles.some((r) => (r ?? "").toLowerCase() === "admin");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization header" }, 401);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");

    // Verify the caller and require admin (server-side — never trust the client).
    const { data: { user: callingUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !callingUser) return json({ error: "Invalid authorization token" }, 401);

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", callingUser.id)
      .single();

    if (!hasAdminRole(adminProfile?.roles)) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const action = body?.action ?? "start";

    // ---- END: stamp the audit row -------------------------------------------
    if (action === "end") {
      const { log_id } = body;
      if (!log_id) return json({ error: "log_id is required" }, 400);

      const { error: updateError } = await supabase
        .from("admin_impersonation_log")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", log_id)
        .eq("admin_id", callingUser.id)
        .is("ended_at", null);

      if (updateError) {
        console.error("Failed to stamp ended_at:", updateError);
        return json({ error: "Failed to close impersonation log" }, 500);
      }
      return json({ success: true });
    }

    // ---- START: mint a session for the target -------------------------------
    const { target_user_id } = body;
    if (!target_user_id) return json({ error: "target_user_id is required" }, 400);
    if (target_user_id === callingUser.id) {
      return json({ error: "Cannot impersonate your own account" }, 400);
    }

    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id, email, full_name, roles")
      .eq("id", target_user_id)
      .single();

    if (targetError || !targetProfile) return json({ error: "Target user not found" }, 404);
    if (hasAdminRole(targetProfile.roles)) {
      return json({ error: "Cannot impersonate another admin" }, 403);
    }

    // Auth email is the source of truth for magic-link minting (profiles.email
    // is sometimes empty). Fall back to the profile email if needed.
    const { data: targetAuth } = await supabase.auth.admin.getUserById(target_user_id);
    const targetEmail = targetAuth?.user?.email || targetProfile.email;
    if (!targetEmail) return json({ error: "Target user has no email to impersonate" }, 400);

    // Mint a magic-link token. The client exchanges token_hash via
    // supabase.auth.verifyOtp({ type: 'magiclink', token_hash }) to become the student.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: targetEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("generateLink failed:", linkError);
      return json({ error: "Failed to mint impersonation session" }, 500);
    }

    const { data: logRow } = await supabase
      .from("admin_impersonation_log")
      .insert({
        admin_id: callingUser.id,
        target_user_id: target_user_id,
        user_agent: req.headers.get("user-agent") ?? null,
      })
      .select("id")
      .single();

    return json({
      token_hash: linkData.properties.hashed_token,
      email: targetEmail,
      target_name: targetProfile.full_name || "Student",
      log_id: logRow?.id ?? null,
    });
  } catch (error) {
    console.error("admin-impersonation error:", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
