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

    // Get all relationships with their student_ids
    const { data: relationships, error: relError } = await supabase
      .from('student_teacher_relationships')
      .select('id, student_id, teacher_id');

    if (relError) throw relError;

    // Get student profiles
    const { data: studentProfiles, error: profError } = await supabase
      .from('profiles')
      .select('id, full_name, roles')
      .contains('roles', ['student']);

    if (profError) throw profError;

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
        // Find a student profile to use (Nathan Fontaine in this case)
        const nathan = studentProfiles?.find(p => p.full_name === 'Nathan Fontaine');

        if (nathan) {
          // Create learner with the relationship's student_id but with Nathan's parent_id and name
          const { data: newLearner, error: createError } = await supabase
            .from('learners')
            .insert({
              id: rel.student_id,  // Use the existing student_id from relationship
              parent_id: nathan.id,
              name: nathan.full_name,
            })
            .select()
            .single();

          if (createError) {
            results.push({ relationship_id: rel.id, error: createError.message });
          } else {
            results.push({ relationship_id: rel.id, learner_created: newLearner });
          }
        } else {
          results.push({ relationship_id: rel.id, error: 'No student profile found' });
        }
      } else {
        results.push({ relationship_id: rel.id, learner_exists: existingLearner });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        relationships_count: relationships?.length,
        student_profiles: studentProfiles,
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
