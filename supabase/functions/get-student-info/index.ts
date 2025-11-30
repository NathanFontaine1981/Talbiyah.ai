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

    const { student_ids } = await req.json();

    if (!student_ids || !Array.isArray(student_ids)) {
      return new Response(
        JSON.stringify({ error: 'student_ids array required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get learner info for these student IDs
    const { data: learners, error } = await supabase
      .from('learners')
      .select('id, name, parent_id')
      .in('id', student_ids);

    if (error) throw error;

    // Get parent profiles for those learners
    const parentIds = learners?.map(l => l.parent_id).filter(Boolean) || [];

    const { data: parents } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', parentIds);

    // Build response mapping student_id to their info
    const studentInfoMap: Record<string, { name: string; avatar_url: string | null }> = {};

    for (const learner of learners || []) {
      const parent = parents?.find(p => p.id === learner.parent_id);
      studentInfoMap[learner.id] = {
        name: parent?.full_name || learner.name || 'Student',
        avatar_url: parent?.avatar_url || null
      };
    }

    return new Response(
      JSON.stringify({ students: studentInfoMap }),
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
