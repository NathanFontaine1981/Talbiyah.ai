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

    // List available env vars for debugging
    const envVars = {
      hasUrl: !!Deno.env.get("SUPABASE_URL"),
      hasServiceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      hasDbUrl: !!Deno.env.get("SUPABASE_DB_URL"),
    };

    // Check current tiers structure
    const { data: tiers, error: tiersError } = await supabase
      .from('teacher_tiers')
      .select('*')
      .order('tier_level');

    // Check if retention columns exist by trying to query them
    const { data: tiersWithRetention, error: retentionError } = await supabase
      .from('teacher_tiers')
      .select('tier, tier_name, min_retention_rate, min_students_for_retention')
      .limit(1);

    const columnsExist = !retentionError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Checking database structure",
        envVars,
        columnsExist,
        retentionError: retentionError?.message,
        tiers: tiers,
        note: columnsExist
          ? "Retention columns already exist - you can run apply-retention-system"
          : "Retention columns don't exist - need to add via SQL editor in Supabase Dashboard"
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
