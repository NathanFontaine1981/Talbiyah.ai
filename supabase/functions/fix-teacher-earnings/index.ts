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

    // 1. Get all completed lessons with teacher profile info (including tier)
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        teacher_id,
        duration_minutes,
        teacher_rate_at_booking,
        platform_fee,
        total_cost_paid,
        payment_currency,
        scheduled_time,
        teacher_profiles!inner(
          tier,
          profiles!inner(full_name)
        )
      `)
      .eq('status', 'completed')
      .not('teacher_id', 'is', null);

    if (lessonsError) {
      throw new Error(`Failed to get lessons: ${lessonsError.message}`);
    }

    console.log(`Found ${lessons?.length || 0} completed lessons`);

    // 2. Get tier rates
    const { data: tiers } = await supabase
      .from('teacher_tiers')
      .select('tier, teacher_hourly_rate, student_hourly_price');

    const tierRates: Record<string, { teacherRate: number; studentPrice: number }> = {};
    for (const tier of tiers || []) {
      tierRates[tier.tier] = {
        teacherRate: parseFloat(tier.teacher_hourly_rate) || 5,
        studentPrice: parseFloat(tier.student_hourly_price) || 15
      };
    }
    console.log('Tier rates:', tierRates);

    // 3. Get existing earnings to avoid duplicates
    const { data: existingEarnings } = await supabase
      .from('teacher_earnings')
      .select('lesson_id');

    const existingLessonIds = new Set(existingEarnings?.map(e => e.lesson_id) || []);
    console.log(`${existingLessonIds.size} lessons already have earnings`);

    // 4. Create earnings for lessons that don't have them
    const earningsToCreate = [];
    const earningsToUpdate = [];

    for (const lesson of lessons || []) {
      // Get teacher's tier and calculate earnings based on tier rate
      const teacherTier = (lesson.teacher_profiles as any)?.tier || 'newcomer';
      const tierInfo = tierRates[teacherTier] || { teacherRate: 5, studentPrice: 15 };

      // Calculate based on duration (30 min = half rate, 60 min = full rate)
      const durationHours = (lesson.duration_minutes || 60) / 60;
      const amountEarned = tierInfo.teacherRate * durationHours;
      const lessonPrice = tierInfo.studentPrice * durationHours;
      const platformFee = lessonPrice - amountEarned;

      const scheduledTime = new Date(lesson.scheduled_time);
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const status = scheduledTime < sevenDaysAgo ? 'cleared' : 'held';
      const clearedAt = new Date(scheduledTime.getTime() + 7 * 24 * 60 * 60 * 1000);

      const teacherName = (lesson.teacher_profiles as any)?.profiles?.full_name || 'Unknown';
      console.log(`Lesson ${lesson.id}: Teacher ${teacherName} (${teacherTier}), ${lesson.duration_minutes}min, earns £${amountEarned.toFixed(2)}`);

      const earningRecord = {
        lesson_id: lesson.id,
        teacher_id: lesson.teacher_id,
        amount_earned: amountEarned,
        platform_fee: platformFee,
        total_lesson_cost: lessonPrice,
        currency: lesson.payment_currency || 'gbp',
        status: status,
        lesson_completed_at: lesson.scheduled_time,
        hold_period_days: 7,
        cleared_at: clearedAt.toISOString(),
      };

      if (existingLessonIds.has(lesson.id)) {
        earningsToUpdate.push(earningRecord);
      } else {
        earningsToCreate.push(earningRecord);
      }
    }

    console.log(`Creating ${earningsToCreate.length} new earnings, updating ${earningsToUpdate.length} existing`);

    // 4. Insert new earnings
    let createdCount = 0;
    if (earningsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('teacher_earnings')
        .insert(earningsToCreate);

      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        createdCount = earningsToCreate.length;
      }
    }

    // 5. Update existing earnings with correct amounts
    let updatedCount = 0;
    for (const earning of earningsToUpdate) {
      const { error: updateError } = await supabase
        .from('teacher_earnings')
        .update({
          amount_earned: earning.amount_earned,
          platform_fee: earning.platform_fee,
          total_lesson_cost: earning.total_lesson_cost,
          status: earning.status,
          cleared_at: earning.cleared_at,
          updated_at: new Date().toISOString(),
        })
        .eq('lesson_id', earning.lesson_id);

      if (!updateError) {
        updatedCount++;
      }
    }

    // 6. Update hours_taught for each teacher based on completed lessons
    // Group lessons by teacher_id to calculate total hours
    const teacherHours: Record<string, number> = {};
    for (const lesson of lessons || []) {
      const teacherId = lesson.teacher_id;
      const hours = (lesson.duration_minutes || 60) / 60;
      teacherHours[teacherId] = (teacherHours[teacherId] || 0) + hours;
    }

    // Update each teacher's hours_taught
    for (const [teacherId, totalHours] of Object.entries(teacherHours)) {
      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({
          hours_taught: totalHours,
          completed_lessons: lessons?.filter(l => l.teacher_id === teacherId).length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId);

      if (updateError) {
        console.error(`Error updating hours for teacher ${teacherId}:`, updateError);
      } else {
        console.log(`Updated teacher ${teacherId}: ${totalHours} hours taught`);
      }
    }

    // 7. Get summary of all teacher earnings
    const { data: summary } = await supabase
      .from('teacher_earnings')
      .select(`
        teacher_id,
        amount_earned,
        status,
        teacher_profiles!inner(
          profiles!inner(full_name)
        )
      `);

    // Group by teacher
    const teacherSummary: Record<string, { name: string; pending: number; held: number; cleared: number; paid: number; total: number; hours: number }> = {};

    for (const earning of summary || []) {
      const teacherId = earning.teacher_id;
      const teacherName = (earning.teacher_profiles as any)?.profiles?.full_name || 'Unknown';

      if (!teacherSummary[teacherId]) {
        teacherSummary[teacherId] = {
          name: teacherName,
          pending: 0,
          held: 0,
          cleared: 0,
          paid: 0,
          total: 0,
          hours: teacherHours[teacherId] || 0
        };
      }

      const amount = parseFloat(earning.amount_earned) || 0;
      teacherSummary[teacherId].total += amount;

      switch (earning.status) {
        case 'pending': teacherSummary[teacherId].pending += amount; break;
        case 'held': teacherSummary[teacherId].held += amount; break;
        case 'cleared': teacherSummary[teacherId].cleared += amount; break;
        case 'paid': teacherSummary[teacherId].paid += amount; break;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: createdCount,
        updated: updatedCount,
        teachers: Object.values(teacherSummary),
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
