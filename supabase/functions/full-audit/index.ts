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

    const audit: Record<string, any> = {};

    // 1. Core Tables Check
    const tables = [
      'profiles', 'learners', 'lessons', 'teacher_profiles', 'teacher_tiers',
      'subjects', 'student_teacher_relationships', 'lesson_messages',
      'message_templates', 'user_credits', 'credit_purchases', 'credit_transactions',
      'teacher_earnings', 'teacher_payouts', 'lesson_insights', 'lesson_recordings',
      'group_sessions', 'group_session_enrollments', 'homework_submissions',
      'parent_children', 'promo_codes'
    ];

    const tableCounts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        tableCounts[table] = error ? -1 : (count || 0);
      } catch {
        tableCounts[table] = -1;
      }
    }
    audit.tables = tableCounts;

    // 2. Teacher Stats
    const { data: teachers } = await supabase
      .from('teacher_profiles')
      .select(`
        id, current_tier, hours_taught, completed_lessons,
        retention_rate, returning_students, total_unique_students,
        status, profiles!inner(full_name)
      `)
      .eq('status', 'approved');

    audit.teachers = {
      count: teachers?.length || 0,
      details: teachers?.map(t => ({
        name: (t.profiles as any)?.full_name,
        tier: t.current_tier,
        hours: t.hours_taught,
        lessons: t.completed_lessons,
        retention: t.retention_rate,
        students: t.total_unique_students
      }))
    };

    // 3. Tier Configuration
    const { data: tiers } = await supabase
      .from('teacher_tiers')
      .select('tier, tier_name, min_hours_taught, min_retention_rate, hourly_rate')
      .order('min_hours_taught');
    audit.tiers = tiers;

    // 4. Recent Lessons
    const { data: recentLessons, count: lessonCount } = await supabase
      .from('lessons')
      .select('id, status, scheduled_time, learner_id, teacher_id', { count: 'exact' })
      .order('scheduled_time', { ascending: false })
      .limit(10);

    audit.lessons = {
      total: lessonCount,
      byStatus: {},
      recent: recentLessons?.map(l => ({
        status: l.status,
        time: l.scheduled_time,
        hasLearner: !!l.learner_id
      }))
    };

    // Count by status
    const statuses = ['booked', 'scheduled', 'confirmed', 'completed', 'cancelled', 'missed'];
    for (const status of statuses) {
      const { count } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      audit.lessons.byStatus[status] = count || 0;
    }

    // 5. Credits System
    const { data: credits } = await supabase
      .from('user_credits')
      .select('user_id, credits_balance')
      .gt('credits_balance', 0);

    audit.credits = {
      usersWithCredits: credits?.length || 0,
      totalBalance: credits?.reduce((sum, c) => sum + (c.credits_balance || 0), 0) || 0
    };

    // 6. Insights
    const { count: insightCount } = await supabase
      .from('lesson_insights')
      .select('*', { count: 'exact', head: true });
    audit.insights = { count: insightCount };

    // 7. Recordings
    const { count: recordingCount } = await supabase
      .from('lesson_recordings')
      .select('*', { count: 'exact', head: true });
    audit.recordings = { count: recordingCount };

    // 8. Check for common issues
    const issues: string[] = [];

    // Lessons without learner_id
    const { count: orphanLessons } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .is('learner_id', null);
    if ((orphanLessons || 0) > 0) {
      issues.push(`${orphanLessons} lessons without learner_id`);
    }

    // Teachers with no tier
    const { count: noTierTeachers } = await supabase
      .from('teacher_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .is('current_tier', null);
    if ((noTierTeachers || 0) > 0) {
      issues.push(`${noTierTeachers} approved teachers without tier`);
    }

    audit.issues = issues.length > 0 ? issues : ['No issues found'];

    // 9. Summary Score
    let score = 100;
    if (tableCounts.learners === 0) score -= 15;
    if (tableCounts.lessons === 0) score -= 15;
    if (tableCounts.teacher_profiles === 0) score -= 10;
    if ((orphanLessons || 0) > 5) score -= 10;
    if (issues.length > 2) score -= 10;

    audit.summary = {
      score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      status: score >= 80 ? 'PRODUCTION READY' : 'NEEDS FIXES'
    };

    return new Response(
      JSON.stringify(audit, null, 2),
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
