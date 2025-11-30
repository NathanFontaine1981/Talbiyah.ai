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

    // Add RLS policy to allow teachers to view learners they have relationships with
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policy if exists
        DROP POLICY IF EXISTS "Teachers can view their students' learner profiles" ON learners;

        -- Create new policy for teachers to view learners they have relationships with
        CREATE POLICY "Teachers can view their students' learner profiles" ON learners
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM student_teacher_relationships str
              JOIN teacher_profiles tp ON str.teacher_id = tp.id
              WHERE str.student_id = learners.id
              AND tp.user_id = auth.uid()
            )
          );
      `
    });

    if (policyError) {
      // Try alternative approach - just add the policy without exec_sql
      return new Response(
        JSON.stringify({
          error: 'Cannot execute SQL directly. Please run this SQL in the Supabase SQL editor:',
          sql: `
-- Allow teachers to view learners they have relationships with
DROP POLICY IF EXISTS "Teachers can view their students" ON learners;

CREATE POLICY "Teachers can view their students" ON learners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_teacher_relationships str
      JOIN teacher_profiles tp ON str.teacher_id = tp.id
      WHERE str.student_id = learners.id
      AND tp.user_id = auth.uid()
    )
  );
          `,
          policyError: policyError.message
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'RLS policy added for teachers to view learners'
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
