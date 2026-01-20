import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { room_id, debug_rls, teacher_id, learner_id, fix_rls } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (fix_rls) {
    // Check learners for a parent
    const { data: learners } = await supabase
      .from("learners")
      .select("id, name, parent_id")
      .eq("parent_id", teacher_id); // Using teacher_id param to pass parent_id

    return new Response(JSON.stringify({
      parent_id: teacher_id,
      learners: learners,
      count: learners?.length || 0
    }), { headers: { "Content-Type": "application/json" } });
  }

  if (debug_rls && teacher_id && learner_id) {
    const { data: teacher } = await supabase
      .from("teacher_profiles")
      .select("id, user_id")
      .eq("id", teacher_id)
      .single();

    const { data: learner } = await supabase
      .from("learners")
      .select("id, parent_id, name")
      .eq("id", learner_id)
      .single();

    return new Response(JSON.stringify({
      teacher_profile: teacher,
      learner: learner,
      rls_info: {
        teacher_user_id: teacher?.user_id,
        parent_user_id: learner?.parent_id
      }
    }), { headers: { "Content-Type": "application/json" } });
  }

  const { data, error } = await supabase
    .from("lessons")
    .select("id, subject_id, scheduled_time, teacher_id, learner_id")
    .eq("100ms_room_id", room_id)
    .single();

  return new Response(JSON.stringify({ data, error }), {
    headers: { "Content-Type": "application/json" }
  });
});
