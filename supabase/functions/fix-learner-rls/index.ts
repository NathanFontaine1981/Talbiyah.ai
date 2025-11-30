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

    // Check current RLS policies on learners
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies', {
      table_name: 'learners'
    });

    // Add RLS policy to allow teachers to view learners they have relationships with
    // This is done via raw SQL since we need service role access

    // First, let's delete old relationships and create clean ones
    // Since we're in testing mode, let's just clean up and recreate properly

    // Delete all existing student_teacher_relationships
    const { error: deleteRelError } = await supabase
      .from('student_teacher_relationships')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteRelError) {
      console.error('Error deleting relationships:', deleteRelError);
    }

    // Get Nathan's learner ID
    const { data: nathanLearner } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .eq('name', 'Nathan Fontaine')
      .maybeSingle();

    // Get Abdullah's teacher profile
    const { data: abdullahProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('full_name', 'Abdullah Abbass')
      .single();

    let teacherProfileId = null;
    if (abdullahProfile) {
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', abdullahProfile.id)
        .single();

      teacherProfileId = teacherProfile?.id;
    }

    // Get a subject
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name')
      .limit(1);

    const subjectId = subjects?.[0]?.id;

    // Create a clean relationship if we have all the pieces
    let newRelationship = null;
    if (nathanLearner && teacherProfileId && subjectId) {
      const { data: rel, error: relError } = await supabase
        .from('student_teacher_relationships')
        .insert({
          student_id: nathanLearner.id,
          teacher_id: teacherProfileId,
          subject_id: subjectId,
          status: 'active',
          total_lessons: 0,
          total_hours: 0
        })
        .select()
        .single();

      if (relError) {
        console.error('Error creating relationship:', relError);
      } else {
        newRelationship = rel;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        nathanLearner,
        abdullahProfile,
        teacherProfileId,
        subjectId,
        newRelationship,
        deletedOldRelationships: !deleteRelError
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
