import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { room_id } = await req.json();

    if (!room_id) {
      return new Response(JSON.stringify({ error: 'room_id is required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("lessons")
      .select("id, subject_id, scheduled_time, teacher_id, learner_id")
      .eq("100ms_room_id", room_id)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.code === 'PGRST116' ? 404 : 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error('lookup-lesson error:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
