import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type NotificationType =
  | "lesson_reminder_1h"
  | "lesson_time_changed"
  | "lesson_cancelled"
  | "teacher_message";

interface NotificationPayload {
  type: NotificationType;
  recipient_email: string;
  recipient_name: string;
  data: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const payload: NotificationPayload = await req.json();
    console.log("Sending notification email:", payload.type);

    let emailContent: { subject: string; html: string };

    switch (payload.type) {
      case "lesson_reminder_1h":
        emailContent = getLessonReminderEmail(payload);
        break;
      case "lesson_time_changed":
        emailContent = getLessonTimeChangedEmail(payload);
        break;
      case "lesson_cancelled":
        emailContent = getLessonCancelledEmail(payload);
        break;
      case "teacher_message":
        emailContent = getTeacherMessageEmail(payload);
        break;
      default:
        throw new Error(`Unknown notification type: ${payload.type}`);
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Talbiyah.ai <notifications@talbiyah.ai>",
        to: [payload.recipient_email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Notification email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getLessonReminderEmail(payload: NotificationPayload) {
  const { teacher_name, subject, scheduled_time, lesson_url } = payload.data;
  const lessonDate = new Date(scheduled_time);
  const formattedTime = lessonDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: `⏰ Reminder: Your lesson with ${teacher_name} starts in 1 hour!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">⏰</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Your Lesson Starts in 1 Hour!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Get ready for class</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #f59e0b;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              This is a friendly reminder that your lesson with <strong>${teacher_name}</strong> starts at <strong style="color: #f59e0b;">${formattedTime}</strong>.
            </p>

            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">📝 Pre-Lesson Checklist:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin-bottom: 8px;">Test your camera and microphone</li>
                <li style="margin-bottom: 8px;">Find a quiet space with good lighting</li>
                <li style="margin-bottom: 8px;">Check your internet connection</li>
                <li style="margin-bottom: 8px;">Have your materials ready (Quran, notebook)</li>
                <li>Join 5 minutes early</li>
              </ul>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${lesson_url}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
              Join Lesson Now
            </a>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
          </div>
        </body>
      </html>
    `
  };
}

function getLessonTimeChangedEmail(payload: NotificationPayload) {
  const { teacher_name, old_time, new_time, subject } = payload.data;
  const oldDate = new Date(old_time);
  const newDate = new Date(new_time);

  const formattedOldTime = oldDate.toLocaleString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedNewTime = newDate.toLocaleString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: `⚠️ Lesson Time Changed - ${teacher_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Lesson Time Changed</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 0;">Your lesson has been rescheduled</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #f59e0b;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
              Your lesson with <strong>${teacher_name}</strong> has been rescheduled.
            </p>

            <div style="background: #fee2e2; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">PREVIOUS TIME:</p>
              <p style="margin: 4px 0 0 0; color: #7f1d1d; font-size: 16px; text-decoration: line-through;">${formattedOldTime}</p>
            </div>

            <div style="background: #d1fae5; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">NEW TIME:</p>
              <p style="margin: 4px 0 0 0; color: #064e3b; font-size: 18px; font-weight: 600;">${formattedNewTime}</p>
            </div>

            <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
              Subject: <strong>${subject}</strong>
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View in Dashboard
            </a>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
          </div>
        </body>
      </html>
    `
  };
}

function getLessonCancelledEmail(payload: NotificationPayload) {
  const { teacher_name, scheduled_time, subject, reason } = payload.data;
  const lessonDate = new Date(scheduled_time);
  const formattedTime = lessonDate.toLocaleString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: `❌ Lesson Cancelled - ${teacher_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Lesson Cancelled</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 0;">We apologize for the inconvenience</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #ef4444;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
              We're sorry to inform you that your lesson with <strong>${teacher_name}</strong> has been cancelled.
            </p>

            <div style="background: #fee2e2; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 600;">CANCELLED LESSON:</p>
              <p style="margin: 0 0 4px 0; color: #7f1d1d; font-size: 16px;"><strong>${subject}</strong></p>
              <p style="margin: 0; color: #7f1d1d; font-size: 14px;">${formattedTime}</p>
            </div>

            ${reason ? `
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px; font-weight: 600;">REASON:</p>
              <p style="margin: 0; color: #334155; font-size: 14px;">${reason}</p>
            </div>
            ` : ''}

            <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">💳 Refund Information</h3>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                Your lesson credit has been automatically refunded to your account. You can use it to book another lesson at any time.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/teachers" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Book Another Lesson
            </a>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
          </div>
        </body>
      </html>
    `
  };
}

function getTeacherMessageEmail(payload: NotificationPayload) {
  const { teacher_name, message_preview, lesson_subject } = payload.data;

  return {
    subject: `💬 New Message from ${teacher_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">New Message from Your Teacher</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 16px; margin: 0;">${teacher_name} sent you a message</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #8b5cf6;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px;">
              Your teacher <strong>${teacher_name}</strong> has sent you a message regarding your <strong>${lesson_subject}</strong> lesson.
            </p>

            <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #5b21b6; font-size: 14px; font-weight: 600;">MESSAGE PREVIEW:</p>
              <p style="margin: 0; color: #6b21a8; font-size: 15px; line-height: 1.6; font-style: italic;">"${message_preview}"</p>
            </div>

            <div style="background: #dbeafe; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                💡 <strong>Tip:</strong> Responding promptly to your teacher's messages helps maintain a productive learning relationship and ensures you don't miss any important lesson information.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Read & Reply
            </a>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
          </div>
        </body>
      </html>
    `
  };
}
