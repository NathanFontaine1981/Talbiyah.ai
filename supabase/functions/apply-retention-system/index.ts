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

    const results: string[] = [];

    // 1. Update teacher_tiers with retention requirements
    const retentionRequirements = [
      { tier: 'newcomer', min_retention_rate: 0, min_students_for_retention: 0 },
      { tier: 'apprentice', min_retention_rate: 50, min_students_for_retention: 5 },
      { tier: 'skilled', min_retention_rate: 60, min_students_for_retention: 10 },
      { tier: 'expert', min_retention_rate: 70, min_students_for_retention: 15 },
      { tier: 'master', min_retention_rate: 80, min_students_for_retention: 20 },
    ];

    for (const req of retentionRequirements) {
      const { error } = await supabase
        .from('teacher_tiers')
        .update({
          min_retention_rate: req.min_retention_rate,
          min_students_for_retention: req.min_students_for_retention,
        })
        .eq('tier', req.tier);

      if (error) {
        // Column might not exist yet, that's OK
        results.push(`Note: Could not update ${req.tier}: ${error.message}`);
      } else {
        results.push(`Updated ${req.tier} tier: ${req.min_retention_rate}% retention, ${req.min_students_for_retention} min students`);
      }
    }

    // 2. Calculate retention for each teacher
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select('id, user_id, profiles!inner(full_name)')
      .eq('status', 'approved');

    if (teachersError) {
      throw new Error(`Failed to get teachers: ${teachersError.message}`);
    }

    const teacherRetention: any[] = [];

    for (const teacher of teachers || []) {
      // Get lesson counts per student for this teacher
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('learner_id')
        .eq('teacher_id', teacher.id)
        .eq('status', 'completed')
        .not('learner_id', 'is', null);

      if (lessonsError) {
        results.push(`Error getting lessons for ${teacher.id}: ${lessonsError.message}`);
        continue;
      }

      // Count lessons per student
      const studentLessonCounts: Record<string, number> = {};
      for (const lesson of lessons || []) {
        if (lesson.learner_id) {
          studentLessonCounts[lesson.learner_id] = (studentLessonCounts[lesson.learner_id] || 0) + 1;
        }
      }

      const totalUniqueStudents = Object.keys(studentLessonCounts).length;
      const returningStudents = Object.values(studentLessonCounts).filter(count => count >= 2).length;

      // Only calculate retention rate if we have enough students (minimum 5)
      let retentionRate = 0;
      if (totalUniqueStudents >= 5) {
        retentionRate = Math.round((returningStudents / totalUniqueStudents) * 100 * 100) / 100;
      }

      // Update teacher profile with retention data
      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({
          retention_rate: retentionRate,
          returning_students: returningStudents,
          total_unique_students: totalUniqueStudents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teacher.id);

      const teacherName = (teacher.profiles as any)?.full_name || 'Unknown';

      if (updateError) {
        results.push(`Note: Could not update retention for ${teacherName}: ${updateError.message}`);
      }

      teacherRetention.push({
        teacher_id: teacher.id,
        teacher_name: teacherName,
        total_unique_students: totalUniqueStudents,
        returning_students: returningStudents,
        retention_rate: retentionRate,
        retention_status: totalUniqueStudents < 5 ? 'Need 5+ students' : `${retentionRate}%`,
      });
    }

    // 3. Get updated tier info
    const { data: tiers } = await supabase
      .from('teacher_tiers')
      .select('tier, tier_name, min_hours_taught, min_retention_rate, min_students_for_retention')
      .order('tier_level');

    return new Response(
      JSON.stringify({
        success: true,
        message: "Student retention system applied",
        results,
        tiers,
        teacherRetention,
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
