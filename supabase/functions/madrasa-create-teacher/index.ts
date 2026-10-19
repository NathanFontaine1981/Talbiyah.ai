// Admin-only: create a madrasa teacher (or org admin) account and attach them to an organisation.
// Deliberately NOT a teacher_profiles row: madrasa teachers are org members only, so they can never
// appear on /teachers or be booked through Stripe.
import { corsHeaders } from "../_shared/cors.ts";
import { isEmail, json, passwordAllowed, requireAdmin, serviceClient } from "../_shared/madrasaAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const db = serviceClient();
  const denied = await requireAdmin(req, db);
  if (denied) return denied;

  let body: { email?: string; full_name?: string; organisation_id?: string; role?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim();
  const role = body.role ?? "teacher";
  if (!isEmail(email) || !fullName || !body.organisation_id) {
    return json({ error: "email, full_name and organisation_id are required" }, 400);
  }
  if (!["teacher", "admin"].includes(role)) return json({ error: "role must be teacher or admin" }, 400);
  const pwError = passwordAllowed(email, body.password);
  if (pwError) return json({ error: pwError }, 400);

  const { data: org } = await db.from("madrasa_organisations").select("id").eq("id", body.organisation_id).maybeSingle();
  if (!org) return json({ error: "organisation not found" }, 404);

  // selected_role 'student' keeps handle_new_user() from creating a pending teacher_profiles row.
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: fullName, selected_role: "student" },
  });
  if (createError || !created.user) {
    const exists = /already|registered|exists/i.test(createError?.message ?? "");
    return json({ error: createError?.message ?? "Could not create user" }, exists ? 409 : 500);
  }
  const userId = created.user.id;

  try {
    const { error: profileError } = await db.from("profiles").update({
      email,
      full_name: fullName,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    }).eq("id", userId);
    if (profileError) throw profileError;

    const { error: memberError } = await db.from("madrasa_org_members").insert({
      organisation_id: body.organisation_id, user_id: userId, role,
    });
    if (memberError) throw memberError;

    let setPasswordLink: string | null = null;
    if (!body.password) {
      const { data: link } = await db.auth.admin.generateLink({ type: "recovery", email });
      setPasswordLink = link?.properties?.action_link ?? null;
    }
    return json({ user_id: userId, role, set_password_link: setPasswordLink });
  } catch (err) {
    await db.auth.admin.deleteUser(userId);
    return json({ error: `Rolled back: ${(err as { message?: string })?.message ?? String(err)}` }, 500);
  }
});
