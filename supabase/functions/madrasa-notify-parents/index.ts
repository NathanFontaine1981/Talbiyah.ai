// Emails the parents of a class a short "notes are ready" message: ONE summary sentence + a portal link,
// never the notes themselves. Called by the teacher UI right after Publish.
//
// Idempotent: a parent gets at most one 'publish' email per session (unique index on madrasa_notification_log).
// Re-emailing after an edit is explicit: send { force: true } and it goes out as an 'update'.
// Never emails reserved test domains (example.com etc.). { dry_run: true } sends nothing and returns the plan.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { firstSentence, isTestAddress, notesEmailSubject, publishedNotesEmail } from "../_shared/madrasaEmail.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Where the email's "Read the full notes" link points. Per-environment config, no code change to flip:
//   branch preview : supabase secrets set MADRASA_PORTAL_BASE_URL=https://feat-madrasa--talbiyah.netlify.app
//   production     : supabase secrets set MADRASA_PORTAL_BASE_URL=https://talbiyah.ai   (or unset it: that is the default)
const BASE_URL = (Deno.env.get("MADRASA_PORTAL_BASE_URL") ?? "https://talbiyah.ai").replace(/\/+$/, "");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // ---- who is calling
  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Unauthorized" }, 401);
  const isService = auth === `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
  let userClient: ReturnType<typeof createClient> | null = null;
  if (!isService) {
    userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return json({ error: "Unauthorized" }, 401);
  }

  let body: { session_id?: string; force?: boolean; dry_run?: boolean };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!body.session_id) return json({ error: "session_id is required" }, 400);

  const { data: session } = await db.from("madrasa_sessions").select("id, class_id, session_date").eq("id", body.session_id).maybeSingle();
  if (!session) return json({ error: "Session not found" }, 404);

  if (!isService) {
    const { data: ok } = await userClient!.rpc("madrasa_can_manage_class", { p_class: session.class_id });
    if (ok !== true) return json({ error: "Not allowed" }, 403);
  }

  const { data: materials } = await db.from("madrasa_session_materials").select("status, parent_notes, parents_notified_at").eq("session_id", session.id).maybeSingle();
  if (!materials || materials.status !== "published") return json({ error: "Publish the notes before emailing parents" }, 409);

  const kind: "publish" | "update" = body.force ? "update" : "publish";
  const { data: cls } = await db.from("madrasa_classes").select("name").eq("id", session.class_id).single();

  // ---- recipients: one email per parent, naming only that parent's own children in this class
  const { data: enrol } = await db.from("madrasa_class_enrolments")
    .select("learners(first_name, name, parent_id)").eq("class_id", session.class_id).eq("status", "active");
  const byParent = new Map<string, string[]>();
  for (const e of (enrol ?? []) as unknown as { learners: { first_name: string | null; name: string | null; parent_id: string } | null }[]) {
    if (!e.learners) continue;
    const list = byParent.get(e.learners.parent_id) ?? [];
    list.push((e.learners.first_name || e.learners.name || "").trim());
    byParent.set(e.learners.parent_id, list);
  }

  const { data: already } = await db.from("madrasa_notification_log").select("parent_id")
    .eq("session_id", session.id).eq("kind", "publish").eq("status", "sent");
  const alreadyEmailed = new Set((already ?? []).map((r) => r.parent_id as string));

  const summary = firstSentence(materials.parent_notes ?? "");
  if (!summary) return json({ error: "The notes have no opening sentence to use as a summary" }, 409);
  const portalUrl = `${BASE_URL}/madrasa/family?note=${session.id}`;

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const results: { parent_id: string; status: string; detail?: string }[] = [];

  for (const [parentId, childNames] of byParent) {
    if (kind === "publish" && alreadyEmailed.has(parentId)) { results.push({ parent_id: parentId, status: "already_emailed" }); continue; }

    const { data: prof } = await db.from("profiles").select("email").eq("id", parentId).maybeSingle();
    let email = prof?.email as string | null | undefined;
    if (!email) email = (await db.auth.admin.getUserById(parentId)).data.user?.email;
    if (!email) {
      if (!body.dry_run) await db.from("madrasa_notification_log").insert({ session_id: session.id, parent_id: parentId, kind, status: "no_email" });
      results.push({ parent_id: parentId, status: "no_email" });
      continue;
    }
    if (isTestAddress(email)) {
      if (!body.dry_run) await db.from("madrasa_notification_log").insert({ session_id: session.id, parent_id: parentId, kind, status: "skipped_test_address" });
      results.push({ parent_id: parentId, status: "skipped_test_address" });
      continue;
    }

    const mail = publishedNotesEmail({ summary, portalUrl, childFirstName: childNames.length === 1 ? childNames[0] : undefined, className: cls?.name, updated: kind === "update" });
    const subject = notesEmailSubject({ kind, childNames });

    if (body.dry_run) { results.push({ parent_id: parentId, status: "would_send", detail: subject }); continue; }
    if (!resendKey) return json({ error: "RESEND_API_KEY is not configured" }, 500);

    // Claim the 'publish' slot first so a concurrent call cannot double-send; roll the claim back on failure.
    let claimId: string | null = null;
    if (kind === "publish") {
      const { data: claim, error: claimErr } = await db.from("madrasa_notification_log")
        .insert({ session_id: session.id, parent_id: parentId, kind, status: "sent" }).select("id").single();
      if (claimErr) { results.push({ parent_id: parentId, status: "already_emailed" }); continue; }
      claimId = claim.id;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Talbiyah.ai <contact@talbiyah.ai>", reply_to: "contact@talbiyah.ai", to: [email], subject, html: mail.html, text: mail.text }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = String((payload as { message?: string }).message ?? res.status).slice(0, 300);
      if (claimId) await db.from("madrasa_notification_log").delete().eq("id", claimId);
      await db.from("madrasa_notification_log").insert({ session_id: session.id, parent_id: parentId, kind, status: "error", error: detail });
      results.push({ parent_id: parentId, status: "error", detail });
      continue;
    }
    const messageId = (payload as { id?: string }).id ?? null;
    if (claimId) await db.from("madrasa_notification_log").update({ provider_message_id: messageId }).eq("id", claimId);
    else await db.from("madrasa_notification_log").insert({ session_id: session.id, parent_id: parentId, kind, status: "sent", provider_message_id: messageId });
    results.push({ parent_id: parentId, status: "sent" });
  }

  if (!body.dry_run && results.some((r) => r.status === "sent")) {
    await db.from("madrasa_session_materials").update({ parents_notified_at: new Date().toISOString() }).eq("session_id", session.id);
  }
  const count = (s: string) => results.filter((r) => r.status === s).length;
  return json({ kind, dry_run: body.dry_run === true, portal_base_url: BASE_URL, sent: count("sent"), already_emailed: count("already_emailed"), skipped_test_address: count("skipped_test_address"), errors: count("error"), no_email: count("no_email"), results });
});
