import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generateHMSAuthToken } from "../_shared/hms.ts";

// Admin-gated: mint a 100ms auth token so an admin can join a lesson's live room
// as a visible `host` (see/hear/talk/moderate) for support & debugging. Binds to
// the lesson's 100ms_room_id directly, so it works even if the teacher/student
// room CODES are broken (the usual reason we're joining to debug).

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Verify caller + require admin (server-side, case-insensitive).
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

    const { lesson_id } = await req.json();
    if (!lesson_id) return json({ error: "lesson_id is required" }, 400);

    // Load the room id (+ a friendly label). Service-role read, so RLS can't block it.
    // NB: teacher_profiles has TWO FKs to profiles (user_id and rate_override_by) —
    // the embed must name the user_id one or PostgREST rejects it as ambiguous
    // (PGRST201) and every join attempt 404s as "Lesson not found".
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`"100ms_room_id", subjects(name), teacher_profiles(profiles!teacher_profiles_user_id_fkey(full_name)), learners(name)`)
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) return json({ error: "Lesson not found" }, 404);

    const roomId = (lesson as Record<string, unknown>)["100ms_room_id"] as string | null;
    if (!roomId) {
      return json({ error: "This lesson has no video room yet (100ms_room_id missing)." }, 400);
    }

    // deno-lint-ignore no-explicit-any
    const subjectName = (lesson as any).subjects?.name ?? "Lesson";
    // deno-lint-ignore no-explicit-any
    const teacherName = (lesson as any).teacher_profiles?.profiles?.full_name ?? "Teacher";
    // deno-lint-ignore no-explicit-any
    const learnerName = (lesson as any).learners?.name ?? "Student";
    const label = `${subjectName} — ${teacherName} & ${learnerName}`;

    // Mint a host auth token for this admin + room.
    const userId = `admin_${callingUser.id}`;
    const authToken = await generateHMSAuthToken(roomId, userId, "host", "4h");

    console.log(`🎧 Admin ${callingUser.id} joining lesson ${lesson_id} room ${roomId}`);

    return json({ authToken, room_id: roomId, user_id: userId, label });
  } catch (error) {
    console.error("admin-join-lesson error:", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
