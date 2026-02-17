// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN ASSIGN TEACHER TIER
// Allows admins to manually assign or override teacher tiers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Authenticate admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Admin access required.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      teacher_id,
      new_tier,
      reason,
      application_id,
      disable_auto_progression = false,
      pay_region,
      rate_override,
    } = await req.json();

    // Validate tier
    const { data: tierData, error: tierError } = await supabaseClient
      .from("teacher_tiers")
      .select("*")
      .eq("tier", new_tier)
      .single();

    if (tierError || !tierData) {
      return new Response(
        JSON.stringify({
          error: `Invalid tier: ${new_tier}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current teacher info
    const { data: teacher, error: teacherError } = await supabaseClient
      .from("teacher_profiles")
      .select("*")
      .eq("id", teacher_id)
      .single();

    if (teacherError || !teacher) {
      return new Response(
        JSON.stringify({
          error: "Teacher not found",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const old_tier = teacher.tier;

    // Determine the hourly rate based on region and override
    let effectiveRate = tierData.teacher_hourly_rate;
    if (rate_override != null && rate_override !== '') {
      effectiveRate = Number(rate_override);
    } else if (pay_region === 'uk' && tierData.uk_teacher_hourly_rate) {
      effectiveRate = tierData.uk_teacher_hourly_rate;
    } else if (pay_region === 'international' && tierData.international_teacher_hourly_rate) {
      effectiveRate = tierData.international_teacher_hourly_rate;
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      tier: new_tier,
      tier_assigned_at: new Date().toISOString(),
      tier_assigned_by: user.id,
      manual_tier_override: true,
      tier_progression_eligible: !disable_auto_progression,
      hourly_rate: effectiveRate,
    };

    if (pay_region) {
      updatePayload.pay_region = pay_region;
    }

    if (rate_override != null && rate_override !== '') {
      updatePayload.rate_override = Number(rate_override);
      updatePayload.rate_override_reason = reason;
      updatePayload.rate_override_by = user.id;
      updatePayload.rate_override_at = new Date().toISOString();
    }

    // Update teacher tier
    const { error: updateError } = await supabaseClient
      .from("teacher_profiles")
      .update(updatePayload)
      .eq("id", teacher_id);

    if (updateError) {
      throw updateError;
    }

    // Record in history
    await supabaseClient
      .from("teacher_tier_history")
      .insert({
        teacher_id,
        from_tier: old_tier,
        to_tier: new_tier,
        promotion_type: "manual",
        promotion_reason: reason,
        hours_at_promotion: teacher.hours_taught,
        rating_at_promotion: teacher.average_rating,
        promoted_by: user.id,
      });

    // Update application if provided
    if (application_id) {
      await supabaseClient
        .from("teacher_tier_applications")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reason,
          assigned_tier: new_tier,
          assigned_rate: effectiveRate,
        })
        .eq("id", application_id);
    }

    // Get teacher email for notification
    const { data: teacherAuth } = await supabaseClient.auth.admin.getUserById(teacher_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Teacher tier updated from ${old_tier} to ${new_tier}`,
        teacher_email: teacherAuth?.user?.email,
        old_tier,
        new_tier,
        new_hourly_rate: effectiveRate,
        pay_region: pay_region || 'international',
        new_student_price: tierData.student_hourly_price,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error assigning tier:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
