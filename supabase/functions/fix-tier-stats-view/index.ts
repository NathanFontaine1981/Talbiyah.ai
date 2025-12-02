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

    // Since we can't drop/create views via RPC, we'll compute the values
    // dynamically using the existing view structure

    // Get teacher tiers for reference
    const { data: tiers, error: tiersError } = await supabase
      .from('teacher_tiers')
      .select('tier, tier_name, min_hours_taught, requires_manual_approval')
      .eq('requires_manual_approval', false)
      .order('min_hours_taught', { ascending: true });

    if (tiersError) {
      throw new Error(`Failed to get tiers: ${tiersError.message}`);
    }

    // Get teacher profiles with hours
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select(`
        id,
        user_id,
        current_tier,
        hours_taught,
        completed_lessons,
        profiles!inner(full_name)
      `)
      .eq('status', 'approved');

    if (teachersError) {
      throw new Error(`Failed to get teachers: ${teachersError.message}`);
    }

    // Calculate next tier and hours needed for each teacher
    const teacherStats = teachers?.map(teacher => {
      const hoursTaught = teacher.hours_taught || 0;

      // Find next auto-promotable tier
      const nextTier = tiers?.find(t => t.min_hours_taught > hoursTaught);

      return {
        teacher_id: teacher.id,
        teacher_name: (teacher.profiles as any)?.full_name || 'Unknown',
        tier: teacher.current_tier || 'newcomer',
        hours_taught: hoursTaught,
        completed_lessons: teacher.completed_lessons || 0,
        next_auto_tier: nextTier?.tier || null,
        next_tier_name: nextTier?.tier_name || null,
        hours_to_next_tier: nextTier ? Math.max(0, nextTier.min_hours_taught - hoursTaught) : null,
        min_hours_for_next: nextTier?.min_hours_taught || null
      };
    }) || [];

    return new Response(
      JSON.stringify({
        success: true,
        message: "Teacher tier stats calculated",
        tiers: tiers,
        teachers: teacherStats
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
