// Admin-only: create a madrasa parent account + their children (as normal learners).
//
// End state is identical to a parent who finished /onboarding on the 1:1 side:
//   profiles(role='parent', roles=['student','parent'], onboarding_completed=true, name/phone/contact set)
//   learners(parent_id) + parent_children rows for each child.
// So the parent skips the onboarding wizard now, and can use the 1:1 platform later with their
// children already in place - nothing half-created.
import { corsHeaders } from "../_shared/cors.ts";
import { isEmail, json, passwordAllowed, requireAdmin, serviceClient } from "../_shared/madrasaAdmin.ts";

interface ChildInput {
  first_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender?: "Male" | "Female";
}

const ageFrom = (dob: string) => {
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
};
// Mirrors src/utils/ageCalculations.ts calculateSchoolYear (age 7 -> Year 3).
const schoolYearFrom = (age: number) =>
  age < 3 ? "Pre-Nursery" : age > 17 ? "Adult" : (age === 3 ? "Nursery" : age === 4 ? "Reception" : `Year ${age - 4}`);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const db = serviceClient();
  const denied = await requireAdmin(req, db);
  if (denied) return denied;

  let body: { email?: string; full_name?: string; phone?: string; password?: string; children?: ChildInput[] };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim();
  const children = body.children ?? [];
  if (!isEmail(email) || !fullName) return json({ error: "email and full_name are required" }, 400);
  if (!children.length) return json({ error: "at least one child is required" }, 400);
  for (const c of children) {
    if (!c.first_name?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(c.date_of_birth ?? "")) {
      return json({ error: "each child needs first_name and date_of_birth (YYYY-MM-DD)" }, 400);
    }
    if (c.gender && !["Male", "Female"].includes(c.gender)) return json({ error: "gender must be Male or Female" }, 400);
  }
  const pwError = passwordAllowed(email, body.password);
  if (pwError) return json({ error: pwError }, 400);

  // 1. Auth user (email pre-confirmed so they are not bounced by the verify-email gate).
  //    handle_new_user() creates the profile, credits row and referral code.
  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: fullName, selected_role: "parent", phone: body.phone ?? "" },
  });
  if (createError || !created.user) {
    const exists = /already|registered|exists/i.test(createError?.message ?? "");
    return json({ error: createError?.message ?? "Could not create user" }, exists ? 409 : 500);
  }
  const parentId = created.user.id;

  try {
    // 2. Mark 1:1 onboarding as done, with the same fields the wizard would have saved.
    const { error: profileError } = await db.from("profiles").update({
      email,
      full_name: fullName,
      preferred_contact: "email",
      how_heard_about_us: "madrasa",
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    }).eq("id", parentId);
    if (profileError) throw profileError;

    // 3. Children = normal learners + parent_children (what the wizard creates).
    const childIds: { id: string; first_name: string }[] = [];
    for (const c of children) {
      const age = ageFrom(c.date_of_birth);
      const first = c.first_name.trim();
      const { data: learner, error: learnerError } = await db.from("learners").insert({
        parent_id: parentId,
        name: first,
        first_name: first,
        date_of_birth: c.date_of_birth,
        age,
        school_year: schoolYearFrom(age),
        gender: c.gender ?? null,
      }).select("id").single();
      if (learnerError) throw learnerError;

      const { error: pcError } = await db.from("parent_children").insert({
        parent_id: parentId,
        child_id: learner.id,
        child_name: first,
        child_age: age,
        child_gender: c.gender ?? null,
        child_dob: c.date_of_birth,
        has_account: false,
        account_id: null,
      });
      if (pcError) throw pcError;
      childIds.push({ id: learner.id, first_name: first });
    }

    // 4. Real parents get a set-password link (returned to the admin, not emailed here).
    let setPasswordLink: string | null = null;
    if (!body.password) {
      const { data: link } = await db.auth.admin.generateLink({ type: "recovery", email });
      setPasswordLink = link?.properties?.action_link ?? null;
    }

    return json({ parent_id: parentId, children: childIds, set_password_link: setPasswordLink });
  } catch (err) {
    // Don't leave a half-built account behind.
    await db.auth.admin.deleteUser(parentId);
    return json({ error: `Rolled back: ${(err as { message?: string })?.message ?? String(err)}` }, 500);
  }
});
