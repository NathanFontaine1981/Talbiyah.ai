import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check learners table
    const { data: learners, error: learnersError } = await supabase
      .from('learners')
      .select('*');

    // Check lessons with learner_id
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, learner_id, teacher_id, status, scheduled_time')
      .not('learner_id', 'is', null)
      .limit(20);

    // Check student_teacher_relationships
    const { data: relationships, error: relError } = await supabase
      .from('student_teacher_relationships')
      .select('*');

    // Check parent_children
    const { data: parentChildren, error: pcError } = await supabase
      .from('parent_children')
      .select('*');

    // Check profiles for student/parent roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, roles')
      .or('roles.cs.{student},roles.cs.{parent}');

    // Get unique learner_ids from lessons
    const uniqueLearnerIds = [...new Set(lessons?.map(l => l.learner_id) || [])];

    // Check if those learner_ids exist in learners table
    const { data: matchingLearners } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .in('id', uniqueLearnerIds);

    // Check if learner_ids match profile ids
    const { data: matchingProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueLearnerIds);

    return new Response(
      JSON.stringify({
        summary: {
          learners_count: learners?.length || 0,
          lessons_with_learner_id: lessons?.length || 0,
          relationships_count: relationships?.length || 0,
          parent_children_count: parentChildren?.length || 0,
          student_parent_profiles: profiles?.length || 0,
          unique_learner_ids_in_lessons: uniqueLearnerIds.length,
          learner_ids_found_in_learners: matchingLearners?.length || 0,
          learner_ids_found_in_profiles: matchingProfiles?.length || 0,
        },
        unique_learner_ids: uniqueLearnerIds,
        learners: learners,
        matching_learners: matchingLearners,
        matching_profiles: matchingProfiles,
        relationships: relationships,
        parent_children: parentChildren,
        sample_lessons: lessons?.slice(0, 5),
        errors: {
          learners: learnersError?.message,
          lessons: lessonsError?.message,
          relationships: relError?.message,
          parentChildren: pcError?.message,
          profiles: profilesError?.message,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
