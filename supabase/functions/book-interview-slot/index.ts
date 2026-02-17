import { corsHeaders } from "../_shared/cors.ts";
import { getHMSManagementToken } from "../_shared/hms.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, slot_id } = await req.json();

    if (!token || !slot_id) {
      return new Response(
        JSON.stringify({ error: "token and slot_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // -----------------------------------------------
    // 1. Validate booking token
    // -----------------------------------------------
    const { data: bookingToken, error: tokenError } = await supabase
      .from("interview_booking_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !bookingToken) {
      return new Response(
        JSON.stringify({ error: "Invalid booking token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (bookingToken.used) {
      return new Response(
        JSON.stringify({ error: "This booking token has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(bookingToken.expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: "This booking token has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 2. Validate interview slot
    // -----------------------------------------------
    const { data: slot, error: slotError } = await supabase
      .from("admin_interview_slots")
      .select("*")
      .eq("id", slot_id)
      .single();

    if (slotError || !slot) {
      return new Response(
        JSON.stringify({ error: "Interview slot not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (slot.is_booked) {
      return new Response(
        JSON.stringify({ error: "This interview slot has already been booked" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    if (slot.date < today) {
      return new Response(
        JSON.stringify({ error: "This interview slot is in the past" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 3. Get candidate from recruitment pipeline
    // -----------------------------------------------
    const { data: candidate, error: candidateError } = await supabase
      .from("recruitment_pipeline")
      .select("*")
      .eq("id", bookingToken.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: "Candidate not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------
    // 4. Create 100ms room
    // -----------------------------------------------
    console.log("Creating 100ms room for interview...");

    const managementToken = await getHMSManagementToken();

    const roomResponse = await fetch("https://api.100ms.live/v2/rooms", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${managementToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `interview-${candidate.id.substring(0, 8)}-${slot.date}`,
        template_id: "696bc294a090b0544dfda056",
        region: "eu",
      }),
    });

    if (!roomResponse.ok) {
      const roomErr = await roomResponse.text();
      console.error("Failed to create 100ms room:", roomErr);
      throw new Error(`Failed to create video room: ${roomErr}`);
    }

    const room = await roomResponse.json();
    console.log("100ms room created:", room.id);

    // -----------------------------------------------
    // 5. Get room codes
    // -----------------------------------------------
    const codesResponse = await fetch(
      `https://api.100ms.live/v2/room-codes/room/${room.id}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${managementToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!codesResponse.ok) {
      const codesErr = await codesResponse.text();
      console.error("Failed to get room codes:", codesErr);
      throw new Error(`Failed to create room codes: ${codesErr}`);
    }

    const codes = await codesResponse.json();
    const hostCode = codes.data?.find((c: any) => c.role === "host")?.code;
    const guestCode = codes.data?.find((c: any) => c.role === "guest")?.code;

    if (!hostCode || !guestCode) {
      console.error("Room codes data:", JSON.stringify(codes.data));
      throw new Error("Could not retrieve host and guest room codes");
    }

    // -----------------------------------------------
    // 6. Create recruitment_interviews record
    // -----------------------------------------------
    const { data: interview, error: interviewError } = await supabase
      .from("recruitment_interviews")
      .insert({
        candidate_id: candidate.id,
        slot_id: slot.id,
        scheduled_date: slot.date,
        scheduled_time: slot.start_time,
        duration_minutes: slot.duration_minutes,
        hms_room_id: room.id,
        room_code_admin: hostCode,
        room_code_candidate: guestCode,
        status: "scheduled",
        interviewer_id: slot.admin_id,
      })
      .select()
      .single();

    if (interviewError || !interview) {
      console.error("Failed to create interview record:", interviewError);
      throw new Error(`Failed to create interview record: ${interviewError?.message}`);
    }

    console.log("Interview record created:", interview.id);

    // -----------------------------------------------
    // 7. Update admin_interview_slots
    // -----------------------------------------------
    const { error: slotUpdateError } = await supabase
      .from("admin_interview_slots")
      .update({
        is_booked: true,
        booked_by_candidate_id: candidate.id,
      })
      .eq("id", slot.id);

    if (slotUpdateError) {
      console.error("Failed to update slot:", slotUpdateError);
    }

    // -----------------------------------------------
    // 8. Mark booking token as used
    // -----------------------------------------------
    const { error: tokenUpdateError } = await supabase
      .from("interview_booking_tokens")
      .update({
        used: true,
        used_at: new Date().toISOString(),
        interview_id: interview.id,
      })
      .eq("token", token);

    if (tokenUpdateError) {
      console.error("Failed to update booking token:", tokenUpdateError);
    }

    // -----------------------------------------------
    // 9. Update recruitment_pipeline stage
    // -----------------------------------------------
    const previousStage = candidate.pipeline_stage;

    const { error: pipelineUpdateError } = await supabase
      .from("recruitment_pipeline")
      .update({
        pipeline_stage: "interview_scheduled",
        interview_id: interview.id,
        pipeline_stage_updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id);

    if (pipelineUpdateError) {
      console.error("Failed to update pipeline stage:", pipelineUpdateError);
    }

    // -----------------------------------------------
    // 10. Insert pipeline history record
    // -----------------------------------------------
    const { error: historyError } = await supabase
      .from("recruitment_pipeline_history")
      .insert({
        candidate_id: candidate.id,
        from_stage: previousStage,
        to_stage: "interview_scheduled",
        notes: "Interview booked via invite link",
      });

    if (historyError) {
      console.error("Failed to insert pipeline history:", historyError);
    }

    // -----------------------------------------------
    // 11. Send confirmation email via Resend
    // -----------------------------------------------
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Nathan Fontaine - Talbiyah.ai <salams@talbiyah.ai>",
            to: [candidate.email],
            subject: `Interview Confirmed - ${slot.date} at ${slot.start_time}`,
            html: `<p>As-salamu alaykum ${candidate.full_name},</p>
               <p>Your interview has been confirmed for <strong>${slot.date}</strong> at <strong>${slot.start_time}</strong> (London time).</p>
               <p>Join the video call here: <a href="https://talbiyah.ai/lesson/interview?roomCode=${guestCode}">Join Interview</a></p>
               <p>Jazakallahu khairan,<br/>Nathan Ellington<br/>Founder, Talbiyah.ai</p>`,
          }),
        });

        if (!emailResponse.ok) {
          const emailErr = await emailResponse.text();
          console.error("Failed to send confirmation email:", emailErr);
        } else {
          console.log("Confirmation email sent to:", candidate.email);
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    } else {
      console.warn("RESEND_API_KEY not set, skipping confirmation email");
    }

    // -----------------------------------------------
    // 12. Return success
    // -----------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        interview: {
          scheduled_date: slot.date,
          scheduled_time: slot.start_time,
          duration_minutes: slot.duration_minutes,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error booking interview slot:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to book interview slot",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
