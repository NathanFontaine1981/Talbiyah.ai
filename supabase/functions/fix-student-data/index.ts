import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get parent_id and learner_name from request body
    const { parent_id, learner_name } = await req.json().catch(() => ({}));

    if (!parent_id) {
      return new Response(
        JSON.stringify({ error: "parent_id is required in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify parent exists
    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', parent_id)
      .maybeSingle();

    if (parentError || !parentProfile) {
      return new Response(
        JSON.stringify({ error: "Parent profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = learner_name || parentProfile.full_name;

    // Get all relationships with their student_ids
    const { data: relationships, error: relError } = await supabase
      .from('student_teacher_relationships')
      .select('id, student_id, teacher_id');

    if (relError) throw relError;

    // For each relationship, create a learner if one doesn't exist
    const results = [];

    for (const rel of relationships || []) {
      // Check if learner exists
      const { data: existingLearner } = await supabase
        .from('learners')
        .select('id, name, parent_id')
        .eq('id', rel.student_id)
        .maybeSingle();

      if (!existingLearner) {
        // Create learner with the relationship's student_id
        const { data: newLearner, error: createError } = await supabase
          .from('learners')
          .insert({
            id: rel.student_id,
            parent_id: parent_id,
            name: name,
          })
          .select()
          .single();

        if (createError) {
          results.push({ relationship_id: rel.id, error: createError.message });
        } else {
          results.push({ relationship_id: rel.id, learner_created: newLearner });
        }
      } else {
        results.push({ relationship_id: rel.id, learner_exists: existingLearner });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parent_used: parentProfile,
        relationships_count: relationships?.length,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
