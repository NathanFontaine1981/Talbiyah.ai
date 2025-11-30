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
    // Connect directly to Postgres using service role
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");

    if (!dbUrl) {
      // Alternative: Use the Management API or just return the SQL to run manually
      return new Response(
        JSON.stringify({
          message: "Please run this SQL in Supabase SQL Editor:",
          sql: `
-- Allow teachers to view learners they have relationships with
DROP POLICY IF EXISTS "Teachers can view their students" ON public.learners;

CREATE POLICY "Teachers can view their students" ON public.learners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_teacher_relationships str
      JOIN public.teacher_profiles tp ON str.teacher_id = tp.id
      WHERE str.student_id = learners.id
      AND tp.user_id = auth.uid()
    )
  );
          `
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
