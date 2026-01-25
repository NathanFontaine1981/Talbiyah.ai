// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROCESS TEACHER TIER APPLICATION
// Handles applications for Expert/Master tiers requiring manual approval
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const {
      requested_tier,
      application_reason,
      years_experience,
      english_proficiency,
      intro_video_url,
      recitation_sample_url,
      certificates,
    } = await req.json();

    // Validate requested tier
    if (!["expert", "master"].includes(requested_tier)) {
      return new Response(
        JSON.stringify({
          error: "Can only apply for Expert or Master tier",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get teacher profile
    const { data: teacherProfile, error: profileError } = await supabaseClient
      .from("teacher_profiles")
      .select("*, teacher_tiers!inner(*)")
      .eq("id", user.id)
      .single();

    if (profileError || !teacherProfile) {
      return new Response(
        JSON.stringify({
          error: "Teacher profile not found. Please complete your teacher setup first.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already at or above requested tier
    const { data: requestedTierData } = await supabaseClient
      .from("teacher_tiers")
      .select("*")
      .eq("tier", requested_tier)
      .single();

    const { data: currentTierData } = await supabaseClient
      .from("teacher_tiers")
      .select("*")
      .eq("tier", teacherProfile.tier)
      .single();

    if (currentTierData && requestedTierData) {
      if (currentTierData.tier_level >= requestedTierData.tier_level) {
        return new Response(
          JSON.stringify({
            error: `You are already ${currentTierData.tier_name} tier or higher`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for pending application
    const { data: existingApp } = await supabaseClient
      .from("teacher_tier_applications")
      .select("*")
      .eq("teacher_id", user.id)
      .in("status", ["pending", "under_review", "interview_scheduled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingApp) {
      return new Response(
        JSON.stringify({
          error: `You already have a ${existingApp.status} application. Status: ${existingApp.status}`,
          application_id: existingApp.id,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tier pricing info
    const requested_rate = requestedTierData?.teacher_hourly_rate || 0;

    // Create application
    const { data: application, error: appError } = await supabaseClient
      .from("teacher_tier_applications")
      .insert({
        teacher_id: user.id,
        requested_tier,
        requested_rate,
        application_reason,
        years_experience,
        english_proficiency,
        intro_video_url,
        recitation_sample_url,
        certificates,
        status: "pending",
      })
      .select()
      .single();

    if (appError) {
      throw appError;
    }

    // Auto-assign initial status based on requirements
    let auto_status = "pending";
    let review_notes = "";

    // Expert tier basic requirements
    if (requested_tier === "expert") {
      if (teacherProfile.hours_taught < 250) {
        review_notes = `Only ${teacherProfile.hours_taught}h taught (need 250h). Consider gaining more experience.`;
      } else if (teacherProfile.average_rating < 4.5) {
        review_notes = `Rating ${teacherProfile.average_rating} (need 4.5+). Focus on improving student satisfaction.`;
      } else if (english_proficiency !== "fluent" && english_proficiency !== "native") {
        review_notes = "English proficiency should be Fluent (C1+) for Expert tier.";
      } else {
        auto_status = "under_review";
        review_notes = "Meets basic requirements. Pending credential verification and interview.";
      }
    }

    // Master tier basic requirements
    if (requested_tier === "master") {
      if (teacherProfile.hours_taught < 500) {
        review_notes = `Only ${teacherProfile.hours_taught}h taught (need 500h). Expert tier recommended first.`;
      } else if (teacherProfile.average_rating < 4.7) {
        review_notes = `Rating ${teacherProfile.average_rating} (need 4.7+). Exceptional record required for Master.`;
      } else if (english_proficiency !== "native") {
        review_notes = "Master tier requires native/near-native English proficiency.";
      } else {
        auto_status = "under_review";
        review_notes = "Meets basic requirements. Pending advanced credential verification and demonstration.";
      }
    }

    // Update application status
    await supabaseClient
      .from("teacher_tier_applications")
      .update({
        status: auto_status,
        review_notes,
      })
      .eq("id", application.id);

    // Send notification to admins
    // Note: roles is an array field, use contains() instead of eq()
    const { data: admins } = await supabaseClient
      .from("profiles")
      .select("id, email, full_name")
      .contains("roles", ["admin"]);

    // Use first admin's email or fallback to contact@talbiyah.ai
    const adminEmail = admins?.[0]?.email || "contact@talbiyah.ai";
    const adminName = admins?.[0]?.full_name || "Admin";

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          type: "teacher_application_received",
          recipient_email: adminEmail,
          recipient_name: adminName,
          data: {
            applicant_name: user.full_name || "Unknown",
            applicant_email: user.email,
            subjects: selected_subjects || [],
            education_level: qualifications?.education_level,
          },
        }),
      });
      console.log("✅ Admin notification sent for new teacher application to", adminEmail);
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
    }

    console.log(`New ${requested_tier} tier application from ${user.email}`, admins);

    return new Response(
      JSON.stringify({
        success: true,
        application_id: application.id,
        status: auto_status,
        message:
          auto_status === "under_review"
            ? "Application submitted! An admin will review your credentials and schedule an interview."
            : "Application submitted! Please address the feedback and reapply when ready.",
        review_notes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing application:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
