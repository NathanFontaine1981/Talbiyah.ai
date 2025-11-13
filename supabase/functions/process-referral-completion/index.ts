import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProcessReferralRequest {
  referral_id: string;
  referred_user_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { referral_id, referred_user_id }: ProcessReferralRequest = await req.json();

    if (!referral_id || !referred_user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get referral details
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select(`
        *,
        tier:referral_tiers(*)
      `)
      .eq("id", referral_id)
      .single();

    if (referralError || !referral) {
      return new Response(
        JSON.stringify({ error: "Referral not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all completed lessons for this referral with their durations
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, status, duration_minutes")
      .eq("learner_id", referred_user_id)
      .eq("status", "completed");

    if (lessonsError) {
      throw lessonsError;
    }

    const hasCompletedLessons = lessons && lessons.length > 0;
    let totalRewards = 0;
    const rewardsGiven = [];

    if (hasCompletedLessons) {
      // Calculate total hours completed
      const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
      const totalHours = totalMinutes / 60;

      // INITIAL REWARD: First lesson completion
      if (!referral.initial_reward_paid && referral.tier) {
        const initialRewardHours = referral.tier.initial_reward_hours || 1.0;

        // Mark referral as completed if not already
        if (referral.status === "pending") {
          await supabase
            .from("referrals")
            .update({ status: "completed" })
            .eq("id", referral_id);
        }

        // Mark initial reward as paid
        await supabase
          .from("referrals")
          .update({ initial_reward_paid: true })
          .eq("id", referral_id);

        // Add initial reward to learner's credits
        await supabase
          .from("learners")
          .update({
            learning_credits: supabase.rpc("increment_credits", { amount: initialRewardHours })
          })
          .eq("parent_id", referral.referrer_id);

        // Record reward in history
        await supabase
          .from("referral_rewards_history")
          .insert({
            user_id: referral.referrer_id,
            referral_id: referral_id,
            reward_type: "credit",
            reward_amount: initialRewardHours,
            reward_description: `Initial referral reward: ${initialRewardHours}h free lessons (${referral.tier.tier_name} tier)`
          });

        totalRewards += initialRewardHours;
        rewardsGiven.push({
          type: "initial",
          hours: initialRewardHours
        });
      }

      // ONGOING REWARDS: Every 10 hours milestone
      if (referral.tier) {
        const hoursPerMilestone = referral.tier.hours_per_milestone || 10;
        const ongoingRate = referral.tier.ongoing_reward_rate || 1.0;
        const currentMilestone = Math.floor(totalHours / hoursPerMilestone);
        const lastMilestone = referral.last_hours_milestone || 0;

        if (currentMilestone > lastMilestone) {
          const milestonesEarned = currentMilestone - lastMilestone;
          const ongoingReward = milestonesEarned * ongoingRate;

          // Update tracked hours and milestone
          await supabase
            .from("referrals")
            .update({
              total_hours_tracked: totalHours,
              last_hours_milestone: currentMilestone
            })
            .eq("id", referral_id);

          // Add ongoing reward to learner's credits
          await supabase
            .from("learners")
            .update({
              learning_credits: supabase.rpc("increment_credits", { amount: ongoingReward })
            })
            .eq("parent_id", referral.referrer_id);

          // Record reward in history
          await supabase
            .from("referral_rewards_history")
            .insert({
              user_id: referral.referrer_id,
              referral_id: referral_id,
              reward_type: "milestone",
              reward_amount: ongoingReward,
              reward_description: `Ongoing reward: ${milestonesEarned} milestone(s) reached (${currentMilestone * hoursPerMilestone}h total) - ${ongoingReward}h earned (${referral.tier.tier_name} tier)`
            });

          totalRewards += ongoingReward;
          rewardsGiven.push({
            type: "ongoing",
            hours: ongoingReward,
            milestones: milestonesEarned,
            totalMilestones: currentMilestone
          });
        }
      }

      // Check for new achievements (only on initial completion)
      if (!referral.initial_reward_paid) {
        const { data: newAchievements, error: achievementError } = await supabase
          .rpc("check_achievements", { user_id_param: referral.referrer_id });

        if (!achievementError && newAchievements && newAchievements.length > 0) {
          for (const achievement of newAchievements) {
            if (achievement.credits_reward > 0) {
              await supabase
                .from("learners")
                .update({
                  learning_credits: supabase.rpc("increment_credits", { amount: achievement.credits_reward })
                })
                .eq("parent_id", referral.referrer_id);

              await supabase
                .from("referral_rewards_history")
                .insert({
                  user_id: referral.referrer_id,
                  reward_type: "achievement",
                  reward_amount: achievement.credits_reward,
                  reward_description: `Achievement unlocked: ${achievement.achievement_name}`
                });

              rewardsGiven.push({
                type: "achievement",
                name: achievement.achievement_name,
                hours: achievement.credits_reward
              });
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          total_rewards_hours: totalRewards,
          tier: referral.tier?.tier_name || "Bronze",
          rewards_given: rewardsGiven,
          referred_total_hours: (totalMinutes / 60).toFixed(2)
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "No completed lessons yet" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing referral:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
