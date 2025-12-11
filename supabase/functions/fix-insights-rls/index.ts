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

    // Execute RLS policy fixes using raw SQL via rpc
    const sqlStatements = [
      // Drop existing policies
      `DROP POLICY IF EXISTS "lesson_insights_select_policy" ON lesson_insights`,
      `DROP POLICY IF EXISTS "lesson_insights_insert_policy" ON lesson_insights`,
      `DROP POLICY IF EXISTS "lesson_insights_update_policy" ON lesson_insights`,
      `DROP POLICY IF EXISTS "Users can view their own insights" ON lesson_insights`,
      `DROP POLICY IF EXISTS "Service role can insert insights" ON lesson_insights`,
      `DROP POLICY IF EXISTS "Teachers can update insights" ON lesson_insights`,
      `DROP POLICY IF EXISTS "Users can update their insights" ON lesson_insights`,

      // Enable RLS
      `ALTER TABLE lesson_insights ENABLE ROW LEVEL SECURITY`,

      // Create SELECT policy
      `CREATE POLICY "Users can view their own insights" ON lesson_insights
        FOR SELECT
        USING (
          auth.uid() = learner_id
          OR auth.uid() = teacher_id
          OR auth.uid() IN (SELECT parent_id FROM learners WHERE id = learner_id AND parent_id IS NOT NULL)
          OR auth.uid() IN (SELECT user_id FROM learners WHERE id = learner_id AND user_id IS NOT NULL)
        )`,

      // Create INSERT policy
      `CREATE POLICY "Service role can insert insights" ON lesson_insights
        FOR INSERT
        WITH CHECK (true)`,

      // Create UPDATE policy
      `CREATE POLICY "Users can update their insights" ON lesson_insights
        FOR UPDATE
        USING (
          auth.uid() = teacher_id
          OR auth.uid() = learner_id
          OR auth.uid() IN (SELECT parent_id FROM learners WHERE id = learner_id AND parent_id IS NOT NULL)
          OR auth.uid() IN (SELECT user_id FROM learners WHERE id = learner_id AND user_id IS NOT NULL)
        )`,
    ];

    const results = [];
    for (const sql of sqlStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query: sql });
        if (error) {
          results.push({ sql: sql.substring(0, 50) + "...", error: error.message });
        } else {
          results.push({ sql: sql.substring(0, 50) + "...", success: true });
        }
      } catch (e) {
        results.push({ sql: sql.substring(0, 50) + "...", error: e.message });
      }
    }

    return new Response(
      JSON.stringify({ message: "RLS fix attempted", results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
