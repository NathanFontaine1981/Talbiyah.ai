import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { corsHeaders, securityHeaders } from "../_shared/cors.ts";

const responseHeaders = {
  ...corsHeaders,
  ...securityHeaders,
};

// Sanitize string to prevent XSS in HTML emails
function sanitizeForHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

type NotificationType =
  | "lesson_reminder_1h"
  | "lesson_time_changed"
  | "lesson_cancelled"
  | "teacher_message"
  | "tier_promotion"
  | "tier_eligible_for_review"
  | "lesson_acknowledged"
  | "lesson_declined"
  | "teacher_application_received"
  | "referral_reward"
  | "hours_transferred"
  | "teacher_new_booking"
  | "teacher_approved"
  | "welcome"
  | "credit_purchase_confirmation"
  | "student_booking_confirmation";

interface NotificationPayload {
  type: NotificationType;
  recipient_email: string;
  recipient_name: string;
  data: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: responseHeaders });
  }

  // Rate limiting: 5 emails per hour per IP
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.EMAIL);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult, responseHeaders);
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const payload: NotificationPayload = await req.json();

    // Validate required fields
    if (!payload.type || !payload.recipient_email || !payload.recipient_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...responseHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!isValidEmail(payload.recipient_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...responseHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize recipient name to prevent XSS
    payload.recipient_name = sanitizeForHtml(payload.recipient_name);

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
      case "tier_promotion":
        emailContent = getTierPromotionEmail(payload);
        break;
      case "tier_eligible_for_review":
        emailContent = getTierEligibleEmail(payload);
        break;
      case "lesson_acknowledged":
        emailContent = getLessonAcknowledgedEmail(payload);
        break;
      case "lesson_declined":
        emailContent = getLessonDeclinedEmail(payload);
        break;
      case "teacher_application_received":
        emailContent = getTeacherApplicationEmail(payload);
        break;
      case "referral_reward":
        emailContent = getReferralRewardEmail(payload);
        break;
      case "hours_transferred":
        emailContent = getHoursTransferredEmail(payload);
        break;
      case "teacher_new_booking":
        emailContent = getTeacherNewBookingEmail(payload);
        break;
      case "teacher_approved":
        emailContent = getTeacherApprovedEmail(payload);
        break;
      case "welcome":
        emailContent = getWelcomeEmail(payload);
        break;
      case "credit_purchase_confirmation":
        emailContent = getCreditPurchaseEmail(payload);
        break;
      case "student_booking_confirmation":
        emailContent = getStudentBookingConfirmationEmail(payload);
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
        headers: { ...responseHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log detailed error server-side
    console.error("Error sending notification email:", error instanceof Error ? error.message : "Unknown error");

    // Return generic error to client
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      {
        status: 500,
        headers: { ...responseHeaders, "Content-Type": "application/json" },
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

function getTierPromotionEmail(payload: NotificationPayload) {
  const { new_tier_name, new_tier_icon, hourly_rate } = payload.data;

  return {
    subject: `🎉 Congratulations! You've been promoted to ${new_tier_name}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #10b981 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">${new_tier_icon}</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">You've Been Promoted!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Welcome to ${new_tier_name} tier</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #10b981;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              MashAllah! Your dedication and hard work have paid off. You have been promoted to <strong>${new_tier_name}</strong> tier on Talbiyah.ai!
            </p>

            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px;">🌟 Your New Benefits:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #047857;">
                <li style="margin-bottom: 8px;">Higher hourly rate: <strong>£${hourly_rate}/hour</strong></li>
                <li style="margin-bottom: 8px;">Increased visibility to students</li>
                <li style="margin-bottom: 8px;">Priority in search results</li>
                <li>Access to premium teaching tools</li>
              </ul>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/teacher/tiers" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Your Tier Dashboard
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

function getTierEligibleEmail(payload: NotificationPayload) {
  const { eligible_tier_name, hours_taught, average_rating } = payload.data;

  return {
    subject: `📊 You're eligible for ${eligible_tier_name} tier!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #f59e0b 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">📊</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Tier Upgrade Pending Review</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">You've hit the metrics for ${eligible_tier_name}!</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #8b5cf6;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Great news! Based on your teaching performance, you are now eligible for the <strong>${eligible_tier_name}</strong> tier. Your promotion is pending admin review.
            </p>

            <div style="background: #f5f3ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #5b21b6; font-size: 16px;">📈 Your Stats:</h3>
              <p style="margin: 0 0 8px 0; color: #6b21a8;">Hours Taught: <strong>${hours_taught}</strong></p>
              <p style="margin: 0; color: #6b21a8;">Average Rating: <strong>${average_rating}/5</strong></p>
            </div>

            <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
              Our team will review your application and notify you once approved.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
          </div>
        </body>
      </html>
    `
  };
}

function getLessonAcknowledgedEmail(payload: NotificationPayload) {
  const { teacher_name, scheduled_time, subject } = payload.data;
  const lessonDate = new Date(scheduled_time);
  const formattedTime = lessonDate.toLocaleString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    subject: `✅ Lesson Confirmed - ${teacher_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Lesson Confirmed!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Your teacher has accepted the booking</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #10b981;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Great news! <strong>${teacher_name}</strong> has confirmed your lesson booking.
            </p>

            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px;">📅 Lesson Details:</h3>
              <p style="margin: 0 0 8px 0; color: #047857;">Subject: <strong>${subject}</strong></p>
              <p style="margin: 0 0 8px 0; color: #047857;">Teacher: <strong>${teacher_name}</strong></p>
              <p style="margin: 0; color: #047857;">Time: <strong>${formattedTime}</strong></p>
            </div>
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

function getLessonDeclinedEmail(payload: NotificationPayload) {
  const { teacher_name, scheduled_time, reason } = payload.data;
  const lessonDate = new Date(scheduled_time);
  const formattedTime = lessonDate.toLocaleString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    subject: `⚠️ Lesson Request Declined - ${teacher_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">⚠️</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Lesson Request Declined</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Your credits have been refunded</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #f59e0b;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Unfortunately, <strong>${teacher_name}</strong> was unable to accept your lesson request for ${formattedTime}.
            </p>

            ${reason ? `
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">REASON:</p>
              <p style="margin: 0; color: #78350f; font-size: 14px;">${reason}</p>
            </div>
            ` : ''}

            <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">💳 Refund Information</h3>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                Your lesson credit has been automatically refunded.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/teachers" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Find Another Teacher
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

function getTeacherApplicationEmail(payload: NotificationPayload) {
  const { applicant_name, applicant_email, subjects, education_level } = payload.data;

  return {
    subject: `📝 New Teacher Application - ${applicant_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">📝</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">New Teacher Application</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Action required: Review application</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #8b5cf6;">
            <div style="background: #f5f3ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #5b21b6; font-size: 16px;">👤 Applicant Details:</h3>
              <p style="margin: 0 0 8px 0; color: #6b21a8;">Name: <strong>${applicant_name}</strong></p>
              <p style="margin: 0 0 8px 0; color: #6b21a8;">Email: <strong>${applicant_email}</strong></p>
              <p style="margin: 0 0 8px 0; color: #6b21a8;">Education: <strong>${education_level || 'Not specified'}</strong></p>
              <p style="margin: 0; color: #6b21a8;">Subjects: <strong>${subjects?.join(', ') || 'Not specified'}</strong></p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/admin/teachers" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Review Application
            </a>
          </div>

          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai Admin</p>
          </div>
        </body>
      </html>
    `
  };
}

function getReferralRewardEmail(payload: NotificationPayload) {
  const { credits_earned, referred_name, total_credits } = payload.data;

  return {
    subject: `🎁 You earned ${credits_earned} credits from a referral!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ec4899 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">🎁</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Referral Reward Earned!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">+${credits_earned} credits added</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #f59e0b;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              <strong>${referred_name}</strong> signed up using your referral link and you've earned <strong>${credits_earned} credits</strong>!
            </p>

            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">YOUR TOTAL CREDITS:</p>
              <p style="margin: 0; color: #78350f; font-size: 32px; font-weight: 700;">${total_credits}</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/refer" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ec4899 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Share & Earn More
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

function getHoursTransferredEmail(payload: NotificationPayload) {
  const { hours_transferred, from_teacher, to_teacher, is_sender } = payload.data;

  return {
    subject: `🔄 ${hours_transferred} teaching hours transferred`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">🔄</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Hours Transfer ${is_sender ? 'Sent' : 'Received'}</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">${hours_transferred} hours transferred</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #8b5cf6;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              ${is_sender
                ? `You have transferred <strong>${hours_transferred} teaching hours</strong> to <strong>${to_teacher}</strong>.`
                : `You have received <strong>${hours_transferred} teaching hours</strong> from <strong>${from_teacher}</strong>.`
              }
            </p>

            <div style="background: #f0fdfa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #0d9488; font-size: 16px;">📊 Transfer Details:</h3>
              <p style="margin: 0 0 8px 0; color: #0f766e;">From: <strong>${from_teacher}</strong></p>
              <p style="margin: 0 0 8px 0; color: #0f766e;">To: <strong>${to_teacher}</strong></p>
              <p style="margin: 0; color: #0f766e;">Hours: <strong>${hours_transferred}</strong></p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/teacher/tiers" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Your Stats
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

function getTeacherNewBookingEmail(payload: NotificationPayload) {
  const { student_name, subject, scheduled_time, duration_minutes } = payload.data;
  const lessonDate = new Date(scheduled_time);
  const formattedDate = lessonDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = lessonDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: `📚 New Lesson Booking - ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">📚</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">New Lesson Booked!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">A student has booked a lesson with you</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #10b981;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Great news! <strong>${student_name}</strong> has booked a lesson with you.
            </p>

            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px;">📅 Lesson Details:</h3>
              <p style="margin: 0 0 8px 0; color: #047857;">Student: <strong>${student_name}</strong></p>
              <p style="margin: 0 0 8px 0; color: #047857;">Subject: <strong>${subject}</strong></p>
              <p style="margin: 0 0 8px 0; color: #047857;">Date: <strong>${formattedDate}</strong></p>
              <p style="margin: 0 0 8px 0; color: #047857;">Time: <strong>${formattedTime}</strong></p>
              <p style="margin: 0; color: #047857;">Duration: <strong>${duration_minutes} minutes</strong></p>
            </div>

            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                ⏰ <strong>Action Required:</strong> Please acknowledge this booking within 24 hours to confirm the lesson.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/teacher" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
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

function getTeacherApprovedEmail(payload: NotificationPayload): { subject: string; html: string } {
  return {
    subject: `🎉 Congratulations! Your Talbiyah.ai Teacher Application is Approved!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">You're Approved!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Welcome to the Talbiyah.ai teaching team</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #10b981;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Alhamdulillah! We're thrilled to inform you that your application to teach on Talbiyah.ai has been <strong>approved</strong>!
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              You are now part of our community of qualified teachers helping Muslims around the world learn the Quran and Arabic.
            </p>

            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px;">📋 Next Steps:</h3>
              <ol style="margin: 0; padding-left: 20px; color: #047857;">
                <li style="margin-bottom: 10px;"><strong>Set Your Availability</strong> - Add your teaching schedule so students can book lessons</li>
                <li style="margin-bottom: 10px;"><strong>Complete Your Profile</strong> - Add a professional photo and bio to attract students</li>
                <li style="margin-bottom: 10px;"><strong>Wait for Bookings</strong> - You'll receive email notifications when students book lessons</li>
              </ol>
            </div>

            <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                💡 <strong>Tip:</strong> Teachers who complete their profile and add availability within 24 hours get more bookings!
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/teacher/availability" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Set Your Availability Now
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

function getWelcomeEmail(payload: NotificationPayload): { subject: string; html: string } {
  return {
    subject: `Welcome to Talbiyah.ai - Your Islamic Learning Journey Begins! 🌙`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Talbiyah.ai</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

          <!-- Header with gradient -->
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 32px;">As-salamu alaykum ${payload.recipient_name}! 🌙</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Welcome to Talbiyah.ai</p>
          </div>

          <!-- Founder introduction -->
          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 24px;">From Premier League to At Your Service</h2>
              <p style="margin: 0; color: #64748b; font-size: 16px;">A Personal Message from Nathan Fontaine, Founder</p>
            </div>

            <p style="margin: 0 0 16px 0; color: #334155; line-height: 1.8;">
              I'm Nathan Fontaine, and I want to personally welcome you to Talbiyah.ai. My journey from playing football for Bristol Rovers, Wigan Athletic, and West Bromwich Albion to founding this platform has been guided by my love for Islam.
            </p>

            <p style="margin: 0 0 16px 0; color: #334155; line-height: 1.8;">
              I embraced Islam during my time in the Premier League with Wigan Athletic - a moment that transformed my life forever. For over 20 years, I've been dedicated to learning and sharing Islamic knowledge.
            </p>

            <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: white; font-size: 16px; line-height: 1.7; font-style: italic;">
                "Talbiyah.ai represents everything I've learned about combining dedication, discipline, and technology to serve the Muslim community. At Your Service isn't just our tagline - it's my personal commitment to you."
              </p>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; text-align: right;">- Nathan Fontaine</p>
            </div>
          </div>

          <!-- What makes us different -->
          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin: 0 0 20px 0; color: #0f172a; font-size: 22px;">What Makes Talbiyah.ai Different</h3>

            <div style="margin-bottom: 16px;">
              <strong style="color: #0f172a;">1. AI-Powered Study Notes</strong>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">After each lesson, receive personalized Talbiyah Insights - study notes and quizzes generated from YOUR actual conversation with your teacher.</p>
            </div>

            <div style="margin-bottom: 16px;">
              <strong style="color: #0f172a;">2. 3-Stage Quran Mastery</strong>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Understanding → Fluency → Memorization. We track all three stages so you truly master the Quran, not just memorize it.</p>
            </div>

            <div style="margin-bottom: 16px;">
              <strong style="color: #0f172a;">3. Hand-Picked Teachers</strong>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Every teacher is qualified, background-checked, and monitored to ensure the highest quality Islamic education.</p>
            </div>

            <div>
              <strong style="color: #0f172a;">4. Sadaqah Jariyah Built-In</strong>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Our referral system means every person you invite earns you ongoing rewards - even after you pass away.</p>
            </div>
          </div>

          <!-- Get started CTA -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <h3 style="margin: 0 0 16px 0; color: white; font-size: 22px;">Start Your Free 30-Minute Trial!</h3>
            <p style="margin: 0 0 24px 0; color: rgba(255,255,255,0.95); font-size: 16px;">
              Experience the difference for yourself - completely free, no credit card required
            </p>
            <a href="https://talbiyah.netlify.app/teachers" style="display: inline-block; background: white; color: #0f172a; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Browse Our Teachers
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
            <p style="margin: 5px 0 0 0;">AI-Powered Islamic Learning</p>
          </div>

        </body>
      </html>
    `
  };
}

function getStudentBookingConfirmationEmail(payload: NotificationPayload): { subject: string; html: string } {
  const { teacher_name, subject, scheduled_time, duration_minutes } = payload.data;
  const lessonDate = new Date(scheduled_time);
  const formattedDate = lessonDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = lessonDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: `✅ Lesson Booked - ${subject} with ${teacher_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Lesson Booked!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">Your lesson has been confirmed</p>
          </div>

          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 2px solid #10b981;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Great news! Your lesson with <strong>${teacher_name}</strong> has been successfully booked.
            </p>

            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px;">📅 Lesson Details:</h3>
              <p style="margin: 0 0 8px 0; color: #047857;">Teacher: <strong>${teacher_name}</strong></p>
              <p style="margin: 0 0 8px 0; color: #047857;">Subject: <strong>${subject}</strong></p>
              <p style="margin: 0 0 8px 0; color: #047857;">Date: <strong>${formattedDate}</strong></p>
              <p style="margin: 0 0 8px 0; color: #047857;">Time: <strong>${formattedTime}</strong></p>
              <p style="margin: 0; color: #047857;">Duration: <strong>${duration_minutes} minutes</strong></p>
            </div>

            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">📝 Before Your Lesson:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin-bottom: 8px;">Test your camera and microphone</li>
                <li style="margin-bottom: 8px;">Find a quiet space with good lighting</li>
                <li style="margin-bottom: 8px;">Have your materials ready (Quran, notebook)</li>
                <li>Join 5 minutes early</li>
              </ul>
            </div>

            <div style="background: #dbeafe; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                ⏰ <strong>Reminder:</strong> You'll receive another email 1 hour before your lesson starts.
              </p>
            </div>
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

function getCreditPurchaseEmail(payload: NotificationPayload): { subject: string; html: string } {
  const { credits, amount, pack_type, new_balance } = payload.data;

  return {
    subject: `✅ Payment Confirmed - ${credits} Credits Added to Your Account`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

          <!-- Header with gradient -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
            <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px;">Payment Confirmed!</h1>
            <p style="color: rgba(255, 255, 255, 0.95); font-size: 18px; margin: 0;">${credits} credits have been added to your account</p>
          </div>

          <!-- Main content -->
          <div style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid #10b981;">
            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px;">
              <strong>As-salamu alaykum ${payload.recipient_name},</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #334155; font-size: 16px; line-height: 1.6;">
              Thank you for your purchase! Your payment has been processed successfully and your credits are ready to use.
            </p>

            <!-- Purchase Details -->
            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px;">📋 Purchase Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #047857; border-bottom: 1px solid #a7f3d0;">Pack Type:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right; border-bottom: 1px solid #a7f3d0; text-transform: capitalize;">${pack_type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857; border-bottom: 1px solid #a7f3d0;">Credits Added:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right; border-bottom: 1px solid #a7f3d0;">${credits} credits</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857; border-bottom: 1px solid #a7f3d0;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right; border-bottom: 1px solid #a7f3d0;">£${amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #047857;">New Balance:</td>
                  <td style="padding: 8px 0; color: #065f46; font-weight: 700; text-align: right; font-size: 18px;">${new_balance} credits</td>
                </tr>
              </table>
            </div>

            <!-- What's Next -->
            <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">🎓 What's Next?</h3>
              <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                Your credits can be used to book lessons with any of our qualified teachers. Each credit equals one hour of learning.
              </p>
            </div>

            <!-- Refund Policy Note -->
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                💡 <strong>Refund Policy:</strong> Unused credits can be refunded within 7 days of purchase. Contact support for assistance.
              </p>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://talbiyah.netlify.app/teachers" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Book a Lesson Now
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">Talbiyah.ai - At Your Service</p>
            <p style="margin: 5px 0 0 0;">Questions? Reply to this email for support</p>
          </div>

        </body>
      </html>
    `
  };
}
