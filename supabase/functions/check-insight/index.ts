import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const { lesson_id } = await req.json();

    if (!lesson_id) {
      return new Response(JSON.stringify({ error: 'lesson_id is required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("lesson_insights")
      .select("id, lesson_id, teacher_id, learner_id, insight_type, title, created_at, detailed_insights")
      .eq("lesson_id", lesson_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      count: data?.length || 0,
      insights: data?.map(i => ({
        id: i.id,
        lesson_id: i.lesson_id,
        teacher_id: i.teacher_id,
        learner_id: i.learner_id,
        insight_type: i.insight_type,
        title: i.title,
        created_at: i.created_at,
        has_content: !!i.detailed_insights?.content,
        content_length: i.detailed_insights?.content?.length || 0
      })),
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error('check-insight error:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
