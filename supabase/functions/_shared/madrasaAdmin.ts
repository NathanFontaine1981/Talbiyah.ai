import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// Callers must be a platform admin (profiles.is_admin or 'admin' in roles) or the service role
// (used for seeding / ops scripts). Returns an error Response, or null when allowed.
export async function requireAdmin(req: Request, db: SupabaseClient): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization header" }, 401);

  if (authHeader === `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) return null;

  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error } = await callerClient.auth.getUser();
  if (error || !user) return json({ error: "Unauthorized" }, 401);

  const { data: profile } = await db
    .from("profiles")
    .select("roles, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const roles: string[] = Array.isArray(profile?.roles) ? profile!.roles : [];
  const isAdmin = profile?.is_admin === true || roles.some((r) => (r ?? "").toLowerCase() === "admin");
  return isAdmin ? null : json({ error: "Admin only" }, 403);
}

// Admin-chosen passwords are only honoured for reserved example.com test addresses.
export function passwordAllowed(email: string, password?: string): string | null {
  if (!password) return null;
  if (!email.toLowerCase().endsWith("@example.com")) return "password may only be set for @example.com test accounts";
  if (password.length < 10) return "password must be at least 10 characters";
  return null;
}

export const isEmail = (s: unknown): s is string =>
  typeof s === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
