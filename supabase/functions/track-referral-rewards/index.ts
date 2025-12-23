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

    // Get the learner's parent (profile) ID
    const { data: learner } = await supabase
      .from("learners")
      .select("parent_id")
      .eq("id", learner_id)
      .single();

    if (!learner?.parent_id) {
      return new Response(
        JSON.stringify({ message: "Learner has no parent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parentId = learner.parent_id;

    // Check if the parent (user) was referred
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey(id, full_name, email),
        referred:profiles!referrals_referred_user_id_fkey(id, full_name, email)
      `)
      .eq("referred_user_id", parentId)
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
    // TRACK 1: CONVERSION BONUS (First lesson only) - 1 credit
    // ═══════════════════════════════════════
    if (newLessonCount === 1 && !referral.conversion_paid) {
      const conversionBonus = 1; // 1 credit for first lesson

      await supabase
        .from("referrals")
        .update({
          conversion_paid: true,
          credits_earned: (referral.credits_earned || 0) + conversionBonus,
        })
        .eq("id", referral.id);

      await supabase
        .from("referral_credits")
        .update({
          active_referrals: (credits.active_referrals || 0) + 1,
          available_hours: (credits.available_hours || 0) + conversionBonus,
          earned_hours: (credits.earned_hours || 0) + conversionBonus,
        })
        .eq("user_id", referral.referrer_id);

      await supabase
        .from("referral_transactions")
        .insert({
          user_id: referral.referrer_id,
          referral_id: referral.id,
          type: "conversion_bonus",
          hours_amount: conversionBonus,
          description: `+${conversionBonus} credit - ${referral.referred?.full_name || 'Referral'} completed first lesson`,
        });

      rewardsEarned.push(`First lesson bonus: +${conversionBonus} credit`);
    }

    // ═══════════════════════════════════════
    // TRACK 2: HOURLY REWARDS (1 credit per 10 hours)
    // ═══════════════════════════════════════
    const newReferredHours = (credits.referred_hours || 0) + lessonHours;
    const previousMilestone = Math.floor((credits.referred_hours || 0) / 10);
    const newMilestone = Math.floor(newReferredHours / 10);

    if (newMilestone > previousMilestone) {
      const creditsEarned = newMilestone - previousMilestone; // 1 credit per 10h milestone

      await supabase
        .from("referral_credits")
        .update({
          referred_hours: newReferredHours,
          earned_hours: (credits.earned_hours || 0) + creditsEarned,
          available_hours: (credits.available_hours || 0) + creditsEarned,
        })
        .eq("user_id", referral.referrer_id);

      await supabase
        .from("referral_transactions")
        .insert({
          user_id: referral.referrer_id,
          referral_id: referral.id,
          type: "hourly_reward",
          hours_amount: creditsEarned,
          description: `+${creditsEarned} credit - ${newMilestone * 10}h milestone reached`,
        });

      rewardsEarned.push(`Milestone reward: +${creditsEarned} credit (${newMilestone * 10}h total)`);
    } else {
      // Just update hours count
      await supabase
        .from("referral_credits")
        .update({ referred_hours: newReferredHours })
        .eq("user_id", referral.referrer_id);
    }

    // ═══════════════════════════════════════
    // MILESTONE CHECK & BONUS (5, 10, 20 referrals)
    // ═══════════════════════════════════════
    if (newLessonCount === 1) {
      const newActiveCount = (credits.active_referrals || 0) + 1;

      // Calculate new tier based on active referrals
      let newTier = "bronze";
      if (newActiveCount >= 20) newTier = "platinum";
      else if (newActiveCount >= 10) newTier = "gold";
      else if (newActiveCount >= 5) newTier = "silver";

      const tierUpgraded = newTier !== credits.tier;

      if (tierUpgraded) {
        // Milestone bonuses: Silver = 5 credits, Gold = 10 credits, Platinum = recognition only
        let milestoneBonus = 0;
        if (newTier === "silver") milestoneBonus = 5;
        else if (newTier === "gold") milestoneBonus = 10;

        await supabase
          .from("referral_credits")
          .update({
            tier: newTier,
            available_hours: (credits.available_hours || 0) + milestoneBonus,
            earned_hours: (credits.earned_hours || 0) + milestoneBonus,
            tier_unlocked_at: new Date().toISOString(),
          })
          .eq("user_id", referral.referrer_id);

        if (milestoneBonus > 0) {
          await supabase
            .from("referral_transactions")
            .insert({
              user_id: referral.referrer_id,
              type: "milestone_bonus",
              hours_amount: milestoneBonus,
              description: `+${milestoneBonus} credits - ${newActiveCount} referrals milestone!`,
            });
        }

        const milestoneMessage = newTier === "platinum"
          ? `🎉 PLATINUM STATUS - ${newActiveCount} referrals!`
          : `🎉 ${newActiveCount} Referrals Milestone! +${milestoneBonus} credits`;
        rewardsEarned.push(milestoneMessage);
      }
    }

    // ═══════════════════════════════════════
    // SEND NOTIFICATION (if rewards earned)
    // ═══════════════════════════════════════
    if (rewardsEarned.length > 0 && referral.referrer?.email) {
      // Send email notification
      console.log(`Rewards earned for ${referral.referrer.email}:`, rewardsEarned);

      // Calculate total credits earned in this batch
      const totalCreditsEarned = rewardsEarned.reduce((sum, r) => sum + (r.credits || 0), 0);

      // Get current user credit balance
      const { data: userCredits } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", referral.referrer_id)
        .maybeSingle();

      try {
        await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: "referral_reward",
            recipient_email: referral.referrer.email,
            recipient_name: referral.referrer.full_name || "User",
            data: {
              credits_earned: totalCreditsEarned,
              referred_name: referral.referred?.full_name || "Your referral",
              total_credits: userCredits?.balance || totalCreditsEarned,
            },
          }),
        });
        console.log("✅ Referral reward notification sent");
      } catch (emailError) {
        console.error("Failed to send referral reward email:", emailError);
      }
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
