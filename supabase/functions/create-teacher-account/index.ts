import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -----------------------------------------------
    // 0. Verify caller is an authenticated admin
    // -----------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller via their JWT
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check caller has Admin role
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", caller.id)
      .single();

    if (!callerProfile?.roles?.includes("Admin")) {
      return new Response(
        JSON.stringify({ error: "Only admins can create teacher accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 1. Parse request
    // -----------------------------------------------
    const { candidate_id } = await req.json();

    if (!candidate_id) {
      return new Response(
        JSON.stringify({ error: "candidate_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 2. Fetch candidate from recruitment_pipeline
    // -----------------------------------------------
    const { data: candidate, error: candidateError } = await supabase
      .from("recruitment_pipeline")
      .select("*")
      .eq("id", candidate_id)
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: "Candidate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (candidate.user_id) {
      return new Response(
        JSON.stringify({ error: "This candidate already has an account" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (candidate.pipeline_stage !== "approved") {
      return new Response(
        JSON.stringify({ error: "Only approved candidates can have accounts created" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 3. Check if email already has an auth account
    // -----------------------------------------------
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === candidate.email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      // Account already exists (signed up independently)
      userId = existingUser.id;
      console.log("Existing auth user found for email:", candidate.email);
    } else {
      // -----------------------------------------------
      // 4. Create Supabase auth user
      // -----------------------------------------------
      const tempPassword = crypto.randomUUID();

      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: candidate.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: candidate.full_name,
          source: "recruitment_pipeline",
        },
      });

      if (createUserError || !newUser?.user) {
        console.error("Failed to create auth user:", createUserError);
        return new Response(
          JSON.stringify({ error: `Failed to create account: ${createUserError?.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      console.log("Auth user created:", userId);
    }

    // -----------------------------------------------
    // 5. Ensure profiles row exists with correct data
    // -----------------------------------------------
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: candidate.full_name,
          email: candidate.email,
          roles: ["Teacher"],
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Failed to upsert profile:", profileError);
      // Non-fatal: profile trigger may have already created it
    }

    // If profile exists but doesn't have Teacher role, add it
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("roles")
      .eq("id", userId)
      .single();

    if (existingProfile && !existingProfile.roles?.includes("Teacher")) {
      const updatedRoles = [...(existingProfile.roles || []), "Teacher"];
      await supabase
        .from("profiles")
        .update({ roles: updatedRoles })
        .eq("id", userId);
    }

    // -----------------------------------------------
    // 6. Create teacher_profiles record
    // -----------------------------------------------
    const teacherProfileData: Record<string, unknown> = {
      user_id: userId,
      status: "approved",
      bio: candidate.bio || null,
      hourly_rate: candidate.expected_hourly_rate || null,
      tier: candidate.assigned_tier || null,
      current_tier: candidate.assigned_tier || null,
      teacher_type: candidate.teacher_type || "platform",
      years_experience: candidate.years_experience || null,
      education_level: candidate.education_level || null,
      languages_spoken: candidate.languages || [],
      subjects_taught: candidate.subjects || [],
      accepting_students: true,
      joined_at: new Date().toISOString(),
    };

    const { data: teacherProfile, error: tpError } = await supabase
      .from("teacher_profiles")
      .upsert(teacherProfileData, { onConflict: "user_id" })
      .select("id")
      .single();

    if (tpError) {
      console.error("Failed to create teacher_profiles:", tpError);
      return new Response(
        JSON.stringify({ error: `Failed to create teacher profile: ${tpError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Teacher profile created/updated:", teacherProfile.id);

    // -----------------------------------------------
    // 7. Link recruitment_pipeline to the new account
    // -----------------------------------------------
    const { error: linkError } = await supabase
      .from("recruitment_pipeline")
      .update({
        user_id: userId,
        teacher_profile_id: teacherProfile.id,
        pipeline_stage: "onboarding",
        pipeline_stage_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate_id);

    if (linkError) {
      console.error("Failed to link pipeline record:", linkError);
    }

    // Record pipeline history
    await supabase
      .from("recruitment_pipeline_history")
      .insert({
        candidate_id: candidate_id,
        from_stage: "approved",
        to_stage: "onboarding",
        changed_by: caller.id,
        notes: "Account created and moved to onboarding",
      });

    // -----------------------------------------------
    // 8. Generate password reset link
    // -----------------------------------------------
    const { data: resetData, error: resetError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: candidate.email,
        options: {
          redirectTo: `${Deno.env.get("SITE_URL") || "https://talbiyah.ai"}/teacher`,
        },
      });

    let loginLink: string | null = null;
    if (resetData?.properties?.action_link) {
      loginLink = resetData.properties.action_link;
    }
    if (resetError) {
      console.error("Failed to generate login link:", resetError);
    }

    // -----------------------------------------------
    // 9. Send welcome/onboarding email via Resend
    // -----------------------------------------------
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const loginSection = loginLink
          ? `<p style="margin: 0 0 16px 0; color: #334155; line-height: 1.8;">Click the button below to log in and start your onboarding:</p>
             <div style="text-align: center; margin: 24px 0;">
               <a href="${loginLink}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Log In to Talbiyah.ai</a>
             </div>
             <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px; text-align: center;">This link expires in 24 hours. If it expires, visit talbiyah.ai and use "Forgot password" with your email.</p>`
          : `<p style="margin: 0 0 16px 0; color: #334155; line-height: 1.8;">Visit <a href="https://talbiyah.ai" style="color: #10b981; font-weight: 600;">talbiyah.ai</a> and click "Forgot password" to set up your login.</p>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Nathan Fontaine - Talbiyah.ai <salams@talbiyah.ai>",
            to: [candidate.email],
            subject: "Welcome to the Talbiyah.ai Teaching Team!",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
                  <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">As-salamu alaykum, ${candidate.full_name}!</h1>
                  <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">You've been approved as a Talbiyah.ai teacher</p>
                </div>
                <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px;">Your account is ready</h2>
                  <p style="margin: 0 0 16px 0; color: #334155; line-height: 1.8;">
                    Congratulations! After reviewing your application, interview, and qualifications, we're delighted to welcome you to our teaching team.
                  </p>
                  ${loginSection}
                </div>
                <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px;">Your onboarding steps:</h3>
                  <ol style="margin: 0; padding-left: 20px; color: #334155; line-height: 2;">
                    <li>Complete your teacher profile</li>
                    <li>Set your weekly availability</li>
                    <li>Review the required onboarding resources</li>
                    <li>Set up your payment details</li>
                  </ol>
                </div>
                <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
                  <p style="margin: 0;">Questions? Reply to this email — we're here to help.</p>
                </div>
                <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
                  <p style="margin: 0;">Talbiyah.ai — At Your Service</p>
                </div>
              </div>
            `,
          }),
        });
        console.log("Welcome email sent to:", candidate.email);
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }
    }

    // -----------------------------------------------
    // 10. Return success
    // -----------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        teacher_profile_id: teacherProfile.id,
        email_sent: !!resendKey,
        login_link_generated: !!loginLink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating teacher account:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create teacher account" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
