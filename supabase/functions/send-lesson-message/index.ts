import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Blocked patterns (anti-poaching protection)
const BLOCKED_PATTERNS = [
  { pattern: /\b\d{10,11}\b/g, reason: "phone_number" },
  { pattern: /\b[\w\.-]+@[\w\.-]+\.\w+\b/g, reason: "email" },
  { pattern: /whatsapp/i, reason: "whatsapp" },
  { pattern: /telegram/i, reason: "telegram" },
  { pattern: /\bwa\.me\b/i, reason: "whatsapp" },
  { pattern: /\bt\.me\b/i, reason: "telegram" },
  { pattern: /facebook/i, reason: "facebook" },
  { pattern: /instagram/i, reason: "instagram" },
  { pattern: /\bdirect.?ly\b/i, reason: "external_contact" },
  { pattern: /\boutside\s+platform\b/i, reason: "external_contact" },
  { pattern: /\bpay\s+me\s+directly\b/i, reason: "external_contact" },
  { pattern: /\bskip\s+the\s+fee\b/i, reason: "external_contact" },
  { pattern: /\bless\s+expensive\b/i, reason: "external_contact" },
  { pattern: /\bcheaper\b/i, reason: "external_contact" },
  { pattern: /\bcontact\s+me\s+at\b/i, reason: "external_contact" },
  { pattern: /\bcall\s+me\b/i, reason: "phone_number" },
  { pattern: /\btext\s+me\b/i, reason: "phone_number" },
  { pattern: /\bmessage\s+me\s+on\b/i, reason: "external_contact" },
];

function containsSuspiciousContent(text: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { isSuspicious: true, reason };
    }
  }
  return { isSuspicious: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { lesson_id, template_code, message_data, reply_to_message_id } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Check rate limit
    const { data: withinLimit, error: rateLimitError } = await supabase.rpc(
      "check_message_rate_limit",
      { p_user_id: user.id }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (!withinLimit) {
      // Log rate limit violation
      await supabase.from("message_audit_log").insert({
        user_id: user.id,
        lesson_id: lesson_id,
        attempted_message: template_code,
        flagged_reason: "rate_limit",
      });

      throw new Error("Rate limit exceeded. Maximum 10 messages per day.");
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from("message_templates")
      .select("*")
      .eq("template_code", template_code)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      console.error("Template error:", templateError);
      throw new Error("Invalid message template");
    }

    // Get lesson and determine sender role
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(
        `
        id,
        learner_id,
        teacher_id,
        scheduled_time,
        learners!inner(id, parent_id),
        teacher_profiles!inner(id, user_id)
      `
      )
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      console.error("Lesson error:", lessonError);
      throw new Error("Lesson not found");
    }

    const isStudent = lesson.learners.parent_id === user.id;
    const isTeacher = lesson.teacher_profiles.user_id === user.id;

    if (!isStudent && !isTeacher) {
      throw new Error("Unauthorized for this lesson");
    }

    const senderRole = isStudent ? "student" : "teacher";

    // Verify template matches sender role
    if (template.sender_role !== senderRole) {
      throw new Error("Template not available for your role");
    }

    // Generate message text from template
    let messageText = template.template_text;

    // If template requires data, validate and substitute
    if (template.requires_data) {
      const requiredDataType = template.requires_data.type;

      if (!message_data || !message_data.value) {
        throw new Error("This message requires additional data");
      }

      // Validate data based on type
      if (requiredDataType === "datetime") {
        const datetime = new Date(message_data.value);
        if (isNaN(datetime.getTime())) {
          throw new Error("Invalid datetime provided");
        }
        const formattedDate = datetime.toLocaleString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const formattedTime = datetime.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        messageText = messageText.replace("{new_datetime}", formattedDate);
        messageText = messageText.replace("{time}", formattedTime);
      } else if (requiredDataType === "minutes") {
        const minutes = parseInt(message_data.value);
        const options = template.requires_data.options || [];
        if (!options.includes(minutes)) {
          throw new Error("Invalid minutes value");
        }
        messageText = messageText.replace("{minutes}", minutes.toString());
      } else if (requiredDataType === "text") {
        const text = message_data.value || "";
        const maxLength = template.requires_data.max_length || 100;

        if (text.length > maxLength) {
          throw new Error(
            `Text exceeds maximum length of ${maxLength} characters`
          );
        }

        // CRITICAL: Check for suspicious content in free text
        const suspiciousCheck = containsSuspiciousContent(text);
        if (suspiciousCheck.isSuspicious) {
          // Log to audit trail
          await supabase.from("message_audit_log").insert({
            user_id: user.id,
            lesson_id: lesson_id,
            attempted_message: text,
            flagged_reason: suspiciousCheck.reason!,
          });

          throw new Error(
            "Your message contains prohibited content. Please use the messaging templates provided."
          );
        }

        messageText = messageText.replace("{question}", text);
      }
    }

    // Final check: scan entire message for suspicious content
    const finalCheck = containsSuspiciousContent(messageText);
    if (finalCheck.isSuspicious) {
      await supabase.from("message_audit_log").insert({
        user_id: user.id,
        lesson_id: lesson_id,
        attempted_message: messageText,
        flagged_reason: finalCheck.reason!,
      });

      throw new Error("Message blocked due to policy violation");
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from("lesson_messages")
      .insert({
        lesson_id: lesson_id,
        sender_id: user.id,
        sender_role: senderRole,
        template_id: template.id,
        template_code: template_code,
        message_text: messageText,
        message_data: message_data,
        status: "sent",
        parent_message_id: reply_to_message_id || null,
      })
      .select(
        `
        *,
        sender:profiles!lesson_messages_sender_id_fkey(full_name, avatar_url)
      `
      )
      .single();

    if (messageError) {
      console.error("Message insert error:", messageError);
      throw messageError;
    }

    // Auto-reschedule logic: If teacher approves a student's reschedule request
    if (
      template_code === "teacher_approve" &&
      reply_to_message_id &&
      isTeacher
    ) {
      // Get the parent message to see if it was a reschedule request
      const { data: parentMessage } = await supabase
        .from("lesson_messages")
        .select("template_code, message_data")
        .eq("id", reply_to_message_id)
        .single();

      if (
        parentMessage &&
        (parentMessage.template_code === "student_reschedule" ||
          parentMessage.template_code === "teacher_counter") &&
        parentMessage.message_data?.value
      ) {
        // Update the lesson time
        const newDatetime = new Date(parentMessage.message_data.value);
        const { error: updateError } = await supabase
          .from("lessons")
          .update({
            scheduled_time: newDatetime.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", lesson_id);

        if (updateError) {
          console.error("Failed to update lesson time:", updateError);
        } else {
          console.log(
            `✅ Lesson ${lesson_id} rescheduled to ${newDatetime.toISOString()}`
          );
        }
      }
    }

    console.log(`✅ Message sent: ${template_code} for lesson ${lesson_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: newMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
