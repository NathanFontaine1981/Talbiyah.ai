import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LessonPayload {
  lesson_id: string;
  learner_id: string;
  duration_minutes: number;
  status: string;
  payment_status?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lesson_id, learner_id, duration_minutes, status, payment_status }: LessonPayload = await req.json();

    // Only process completed paid lessons
    if (status !== "completed" || payment_status !== "paid") {
      return new Response(
        JSON.stringify({ message: "Not a paid completed lesson" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user was referred
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey(id, full_name, email),
        referred:profiles!referrals_referred_user_id_fkey(id, full_name, email)
      `)
      .eq("referred_user_id", learner_id)
      .single();

    if (referralError || !referral) {
      return new Response(
        JSON.stringify({ message: "User was not referred" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lessonHours = duration_minutes / 60;
    const newLessonCount = (referral.completed_lessons || 0) + 1;
    const newTotalHours = (referral.total_hours || 0) + lessonHours;

    // Update referral record
    await supabase
      .from("referrals")
      .update({
        completed_lessons: newLessonCount,
        total_hours: newTotalHours,
        last_lesson_date: new Date().toISOString(),
      })
      .eq("id", referral.id);

    // Get or create referrer credits
    let { data: credits } = await supabase
      .from("referral_credits")
      .select("*")
      .eq("user_id", referral.referrer_id)
      .single();

    if (!credits) {
      const { data: newCredits } = await supabase
        .from("referral_credits")
        .insert({ user_id: referral.referrer_id })
        .select()
        .single();
      credits = newCredits;
    }

    // Get tier info
    const { data: tierInfo } = await supabase
      .from("referral_tiers")
      .select("*")
      .eq("tier", credits.tier)
      .single();

    const rewardsEarned: string[] = [];

    // ═══════════════════════════════════════
    // TRACK 1: CONVERSION BONUS (First lesson only)
    // ═══════════════════════════════════════
    if (newLessonCount === 1 && !referral.conversion_paid) {
      const conversionBonus = tierInfo.conversion_bonus;

      await supabase
        .from("referrals")
        .update({
          conversion_paid: true,
          credits_earned: conversionBonus,
        })
        .eq("id", referral.id);

      await supabase
        .from("referral_credits")
        .update({
          total_earned: credits.total_earned + conversionBonus,
          available_balance: credits.available_balance + conversionBonus,
        })
        .eq("user_id", referral.referrer_id);

      await supabase
        .from("referral_transactions")
        .insert({
          user_id: referral.referrer_id,
          referral_id: referral.id,
          type: "conversion_bonus",
          credit_amount: conversionBonus,
          description: `£${conversionBonus} bonus - ${referral.referred.full_name} completed first lesson`,
        });

      rewardsEarned.push(`Conversion bonus: £${conversionBonus}`);
    }

    // ═══════════════════════════════════════
    // TRACK 2: HOURLY REWARDS (Every 10 hours)
    // ═══════════════════════════════════════
    const newReferredHours = credits.referred_hours + lessonHours;
    const previousMilestone = Math.floor(credits.referred_hours / 10);
    const newMilestone = Math.floor(newReferredHours / 10);

    if (newMilestone > previousMilestone) {
      const hoursRewarded = newMilestone - previousMilestone;
      const creditPerHour = 15.0;
      const totalHourlyReward = hoursRewarded * creditPerHour * tierInfo.hourly_multiplier;

      await supabase
        .from("referral_credits")
        .update({
          referred_hours: newReferredHours,
          earned_hours: credits.earned_hours + hoursRewarded,
          available_hours: credits.available_hours + hoursRewarded,
          total_earned: credits.total_earned + totalHourlyReward,
          available_balance: credits.available_balance + totalHourlyReward,
        })
        .eq("user_id", referral.referrer_id);

      await supabase
        .from("referral_transactions")
        .insert({
          user_id: referral.referrer_id,
          referral_id: referral.id,
          type: "hourly_reward",
          credit_amount: totalHourlyReward,
          hours_amount: hoursRewarded,
          description: `£${totalHourlyReward.toFixed(2)} earned - ${newMilestone * 10}h referred milestone (${hoursRewarded}h free lessons)`,
        });

      rewardsEarned.push(`Hourly reward: £${totalHourlyReward.toFixed(2)} (${hoursRewarded}h free lessons)`);
    } else {
      // Just update hours count
      await supabase
        .from("referral_credits")
        .update({ referred_hours: newReferredHours })
        .eq("user_id", referral.referrer_id);
    }

    // ═══════════════════════════════════════
    // TIER CHECK & UPGRADE
    // ═══════════════════════════════════════
    if (newLessonCount === 1) {
      const newActiveCount = credits.active_referrals + 1;

      // Calculate new tier
      let newTier = "bronze";
      if (newActiveCount >= 20) newTier = "platinum";
      else if (newActiveCount >= 10) newTier = "gold";
      else if (newActiveCount >= 5) newTier = "silver";

      const tierUpgraded = newTier !== credits.tier;

      if (tierUpgraded) {
        const { data: newTierInfo } = await supabase
          .from("referral_tiers")
          .select("*")
          .eq("tier", newTier)
          .single();

        const unlockBonus = newTierInfo.unlock_bonus;

        await supabase
          .from("referral_credits")
          .update({
            tier: newTier,
            active_referrals: newActiveCount,
            total_earned: credits.total_earned + unlockBonus,
            available_balance: credits.available_balance + unlockBonus,
            transfer_limit_monthly: newTierInfo.transfer_limit_monthly,
            tier_unlocked_at: new Date().toISOString(),
          })
          .eq("user_id", referral.referrer_id);

        await supabase
          .from("referral_transactions")
          .insert({
            user_id: referral.referrer_id,
            type: "tier_unlock",
            credit_amount: unlockBonus,
            description: `${newTier.toUpperCase()} Tier Unlocked! £${unlockBonus} bonus`,
          });

        rewardsEarned.push(`🎉 ${newTier.toUpperCase()} TIER UNLOCKED! £${unlockBonus} bonus`);
      } else {
        await supabase
          .from("referral_credits")
          .update({ active_referrals: newActiveCount })
          .eq("user_id", referral.referrer_id);
      }
    }

    // ═══════════════════════════════════════
    // SEND NOTIFICATION (if rewards earned)
    // ═══════════════════════════════════════
    if (rewardsEarned.length > 0) {
      // Send email notification
      console.log(`Rewards earned for ${referral.referrer.email}:`, rewardsEarned);
      // TODO: Implement email notification via send-email function
    }

    return new Response(
      JSON.stringify({
        success: true,
        rewards: rewardsEarned,
        lesson_count: newLessonCount,
        total_hours: newTotalHours.toFixed(2),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error tracking referral rewards:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
