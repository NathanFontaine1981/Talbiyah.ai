import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayoutNotificationRequest {
  payout_id: string
  teacher_id: string
  type: 'completed' | 'failed' | 'pending'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { payout_id, teacher_id, type }: PayoutNotificationRequest = await req.json()

    // Get payout details
    const { data: payout, error: payoutError } = await supabaseClient
      .from('teacher_payouts')
      .select(`
        *,
        teacher_profiles!inner(
          user_id,
          profiles!inner(email, full_name)
        )
      `)
      .eq('id', payout_id)
      .single()

    if (payoutError || !payout) {
      throw new Error('Payout not found')
    }

    const teacherEmail = payout.teacher_profiles.profiles.email
    const teacherName = payout.teacher_profiles.profiles.full_name
    const amount = payout.total_amount
    const currency = payout.currency.toUpperCase()

    // Format amount
    const formattedAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount)

    // Create email content based on type
    let subject = ''
    let htmlContent = ''
    let textContent = ''

    if (type === 'completed') {
      subject = `✅ Payout Completed - ${formattedAmount}`

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">💰 Payout Completed</h1>
          </div>

          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">Hi ${teacherName},</p>

            <p style="font-size: 16px; color: #374151;">
              Great news! Your payout has been successfully processed.
            </p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h2 style="margin: 0 0 15px 0; color: #10b981; font-size: 20px;">Payout Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: bold; font-size: 18px; text-align: right;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Lessons:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: bold; text-align: right;">${payout.earnings_count}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Method:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${payout.payout_method.replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${new Date().toLocaleDateString('en-GB')}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              ${payout.payout_method === 'stripe_connect'
                ? 'The funds should arrive in your bank account within 2-3 business days.'
                : 'Please allow 3-5 business days for the transfer to complete.'}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('FRONTEND_URL')}/teacher/earnings"
                 style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Earnings Dashboard
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Thank you for being part of Talbiyah.ai!
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              Best regards,<br>
              The Talbiyah.ai Team
            </p>
          </div>

          <div style="background: #e5e7eb; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              © 2025 Talbiyah.ai. All rights reserved.
            </p>
          </div>
        </div>
      `

      textContent = `
Hi ${teacherName},

Great news! Your payout has been successfully processed.

Payout Details:
- Amount: ${formattedAmount}
- Lessons: ${payout.earnings_count}
- Method: ${payout.payout_method.replace('_', ' ')}
- Date: ${new Date().toLocaleDateString('en-GB')}

${payout.payout_method === 'stripe_connect'
  ? 'The funds should arrive in your bank account within 2-3 business days.'
  : 'Please allow 3-5 business days for the transfer to complete.'}

View your earnings dashboard: ${Deno.env.get('FRONTEND_URL')}/teacher/earnings

Thank you for being part of Talbiyah.ai!

Best regards,
The Talbiyah.ai Team
      `
    } else if (type === 'failed') {
      subject = `❌ Payout Failed - Action Required`

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Payout Failed</h1>
          </div>

          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">Hi ${teacherName},</p>

            <p style="font-size: 16px; color: #374151;">
              Unfortunately, we were unable to process your payout of <strong>${formattedAmount}</strong>.
            </p>

            <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin: 0 0 10px 0; color: #ef4444;">Reason:</h3>
              <p style="margin: 0; color: #991b1b;">${payout.failure_reason || 'Unknown error'}</p>
            </div>

            <p style="font-size: 14px; color: #374151;">
              Please update your payment settings and ensure your bank details are correct.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('FRONTEND_URL')}/teacher/payment-settings"
                 style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Update Payment Settings
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              If you need assistance, please contact our support team.
            </p>
          </div>
        </div>
      `

      textContent = `
Hi ${teacherName},

Unfortunately, we were unable to process your payout of ${formattedAmount}.

Reason: ${payout.failure_reason || 'Unknown error'}

Please update your payment settings: ${Deno.env.get('FRONTEND_URL')}/teacher/payment-settings

If you need assistance, please contact our support team.

Best regards,
The Talbiyah.ai Team
      `
    }

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email send')
      console.log('Would send email to:', teacherEmail)
      console.log('Subject:', subject)
      console.log('Content:', textContent)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sending skipped (RESEND_API_KEY not configured)',
          details: { to: teacherEmail, subject }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Send email using Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Talbiyah.ai <payouts@talbiyah.ai>',
        to: teacherEmail,
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      throw new Error(`Resend API error: ${errorData}`)
    }

    const resendData = await resendResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        recipient: teacherEmail,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending payout notification:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
