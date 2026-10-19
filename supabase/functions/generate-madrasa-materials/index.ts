// Generates parent notes, homework and teacher activities for a madrasa session (lesson-log model:
// no transcript, no audio). Separate from generate-lesson-insights on purpose.
//
// Modes (POST JSON):
//   { session_id, teacher_emphasis?, overwrite? }  -> saves a DRAFT in madrasa_session_materials
//   { prep_unit_id }                               -> saves teacher activities in madrasa_unit_prep
//   { dry_run: true, age_band, units: [...], teacher_emphasis? } -> returns output, saves nothing (admin/service only)
//
// Privacy: this function never reads learners or attendance. The only free text from a person is the
// teacher's emphasis, and enrolled children's first names are redacted from it before the model sees it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  buildUserPrompt, checkOutput, MADRASA_MODEL, outputSchema, redactNames, SYSTEM_PROMPT,
  type MaterialsOutput, type Section, type UnitInput,
} from "../_shared/madrasaMaterials.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MAX_UNITS = 3;
const MAX_EMPHASIS = 1000;

interface Caller { isService: boolean; isPlatformAdmin: boolean; userId: string | null; client: ReturnType<typeof createClient> | null }

async function identify(req: Request, db: ReturnType<typeof createClient>): Promise<Caller | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  if (auth === `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return { isService: true, isPlatformAdmin: true, userId: null, client: null };
  }
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const { data: p } = await db.from("profiles").select("roles, is_admin").eq("id", user.id).maybeSingle();
  const roles: string[] = Array.isArray(p?.roles) ? p!.roles : [];
  const isPlatformAdmin = p?.is_admin === true || roles.some((r) => (r ?? "").toLowerCase() === "admin");
  return { isService: false, isPlatformAdmin, userId: user.id, client };
}

async function canManageClass(caller: Caller, classId: string): Promise<boolean> {
  if (caller.isService || caller.isPlatformAdmin) return true;
  // madrasa_can_manage_class is SECURITY DEFINER and keyed off auth.uid(), so call it as the user.
  const { data } = await caller.client!.rpc("madrasa_can_manage_class", { p_class: classId });
  return data === true;
}

async function callClaude(system: string, user: string, sections: Section[]) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MADRASA_MODEL,
      max_tokens: 16000,
      // No temperature: removed on this model family. Thinking is on by default; effort is the dial.
      output_config: { effort: "medium", format: { type: "json_schema", schema: outputSchema(sections) } },
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(140_000),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  if (data.stop_reason === "refusal") throw new Error("The model declined this request");
  if (data.stop_reason === "max_tokens") throw new Error("The model ran out of output tokens");
  const text = (data.content ?? []).find((b: { type: string }) => b.type === "text")?.text;
  if (!text) throw new Error("Empty response from the model");
  return { output: JSON.parse(text) as MaterialsOutput, usage: data.usage, model: data.model as string };
}

/** Generate, check, and retry once with the problems fed back if a hard rule was broken. */
async function generate(args: { ageBand: string; units: UnitInput[]; emphasis: string | null; sections: Section[] }) {
  const user = buildUserPrompt(args);
  let attempt = await callClaude(SYSTEM_PROMPT, user, args.sections);
  let checks = checkOutput(attempt.output, args.units, args.sections);
  let attempts = 1;
  if (checks.hard.length) {
    attempts = 2;
    const retryUser = `${user}\n\nYour previous answer broke these rules, so rewrite it and fix every one:\n- ${checks.hard.join("\n- ")}`;
    attempt = await callClaude(SYSTEM_PROMPT, retryUser, args.sections);
    checks = checkOutput(attempt.output, args.units, args.sections);
  }
  return { ...attempt, checks, attempts };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = await identify(req, db);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const rawEmphasis = typeof body.teacher_emphasis === "string" ? body.teacher_emphasis.slice(0, MAX_EMPHASIS) : null;

  try {
    // ---------------------------------------------------------------- dry run
    if (body.dry_run === true) {
      if (!caller.isPlatformAdmin) return json({ error: "dry_run is admin only" }, 403);
      const units = body.units as UnitInput[] | undefined;
      if (typeof body.age_band !== "string" || !Array.isArray(units) || !units.length || units.length > MAX_UNITS) {
        return json({ error: `dry_run needs age_band and 1-${MAX_UNITS} units` }, 400);
      }
      const sections = (body.sections as Section[] | undefined) ?? ["parent_notes", "homework", "teacher_activities"];
      const r = await generate({ ageBand: body.age_band, units, emphasis: rawEmphasis, sections });
      return json({ saved: false, model: r.model, attempts: r.attempts, usage: r.usage, checks: r.checks, output: r.output });
    }

    // -------------------------------------------------------------- unit prep
    if (typeof body.prep_unit_id === "string") {
      const { data: unit } = await db.from("madrasa_units").select("*").eq("id", body.prep_unit_id).maybeSingle();
      if (!unit) return json({ error: "Unit not found" }, 404);
      if (!(await canManageClass(caller, unit.class_id))) return json({ error: "Not allowed" }, 403);
      const { data: cls } = await db.from("madrasa_classes").select("age_band").eq("id", unit.class_id).single();

      const r = await generate({ ageBand: cls!.age_band, units: [unit], emphasis: null, sections: ["teacher_activities"] });
      const { error } = await db.from("madrasa_unit_prep").upsert({
        unit_id: unit.id,
        teacher_activities: r.output.teacher_activities ?? [],
        ai_model: r.model,
        generated_by: caller.userId,
        generated_at: new Date().toISOString(),
      }, { onConflict: "unit_id" });
      if (error) throw error;
      return json({ saved: true, kind: "unit_prep", attempts: r.attempts, checks: r.checks, output: r.output });
    }

    // ---------------------------------------------------------------- session
    if (typeof body.session_id === "string") {
      const { data: session } = await db.from("madrasa_sessions").select("*").eq("id", body.session_id).maybeSingle();
      if (!session) return json({ error: "Session not found" }, 404);
      if (!(await canManageClass(caller, session.class_id))) return json({ error: "Not allowed" }, 403);

      const { data: existing } = await db.from("madrasa_session_materials").select("status, edited_at").eq("session_id", session.id).maybeSingle();
      if (existing?.status === "published") return json({ error: "Already published; it cannot be regenerated" }, 409);
      if (existing?.edited_at && body.overwrite !== true) {
        return json({ error: "The draft has been edited. Send overwrite: true to replace it" }, 409);
      }

      const { data: links } = await db.from("madrasa_session_units").select("unit_id").eq("session_id", session.id);
      const unitIds = (links ?? []).map((l) => l.unit_id);
      if (!unitIds.length) return json({ error: "Tick at least one unit for this session first" }, 400);
      if (unitIds.length > MAX_UNITS) return json({ error: `At most ${MAX_UNITS} units per session` }, 400);
      const { data: unitRows } = await db.from("madrasa_units").select("*").in("id", unitIds).order("unit_number");
      const { data: cls } = await db.from("madrasa_classes").select("age_band").eq("id", session.class_id).single();

      // Redact enrolled children's first names from the teacher's free text before it reaches the model.
      const { data: roster } = await db.from("madrasa_class_enrolments").select("learners(first_name, name)").eq("class_id", session.class_id);
      const names = (roster ?? []).flatMap((e: { learners: { first_name: string | null; name: string | null } | null }) =>
        [e.learners?.first_name ?? "", ...(e.learners?.name ?? "").split(/\s+/)]);
      const emphasisSource = rawEmphasis ?? session.teacher_emphasis ?? "";
      const { text: emphasis, redactions } = redactNames(emphasisSource, names);

      const r = await generate({ ageBand: cls!.age_band, units: unitRows ?? [], emphasis: emphasis || null, sections: ["parent_notes", "homework", "teacher_activities"] });

      if (rawEmphasis !== null) await db.from("madrasa_sessions").update({ teacher_emphasis: rawEmphasis }).eq("id", session.id);
      const now = new Date().toISOString();
      const { error } = await db.from("madrasa_session_materials").upsert({
        session_id: session.id,
        status: "draft",
        parent_notes: r.output.parent_notes ?? null,
        homework: r.output.homework ?? null,
        teacher_activities: r.output.teacher_activities ?? [],
        ai_model: r.model,
        generated_at: now,
        edited_at: null,
      }, { onConflict: "session_id" });
      if (error) throw error;
      return json({ saved: true, kind: "session_draft", attempts: r.attempts, checks: r.checks, emphasis_redactions: redactions, output: r.output });
    }

    return json({ error: "Send session_id, prep_unit_id, or dry_run" }, 400);
  } catch (err) {
    console.error("generate-madrasa-materials:", err);
    return json({ error: (err as { message?: string })?.message ?? "Generation failed" }, 500);
  }
});
