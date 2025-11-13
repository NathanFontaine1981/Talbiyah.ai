// Shared email helper used by Supabase Edge Functions.
// Sends mail by calling the Netlify Function `send-email` via a shared secret.

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  fromEmail?: string
  fromName?: string
}

export async function sendEmail(params: SendEmailParams) {
  const {
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    replyTo,
    fromEmail,
    fromName,
  } = params

  const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('NETLIFY_SITE_URL') || ''
  const functionUrl = `${baseUrl}/.netlify/functions/send-email`
  const secret = Deno.env.get('EMAIL_FUNCTION_SECRET') || ''

  if (!baseUrl) {
    throw new Error('Missing PUBLIC_SITE_URL/NETLIFY_SITE_URL for email function URL')
  }

  if (!secret) {
    throw new Error('EMAIL_FUNCTION_SECRET is not configured')
  }

  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
    },
    body: JSON.stringify({ to, subject, html, text, cc, bcc, replyTo, fromEmail, fromName }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`send-email failed: ${res.status} ${errText}`)
  }

  return await res.json()
}

export function brandFrom() {
  const fromName = Deno.env.get('SMTP_FROM_NAME') || 'Talbiyah.ai'
  const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'contact@talbiyah.ai'
  return { fromName, fromEmail }
}


