// Helper function to generate 100ms Management Token from App Secret
// This ensures we always have a valid token without manual renewal

export async function generateHMSManagementToken(): Promise<string> {
  const appAccessKey = Deno.env.get('HMS_APP_ACCESS_KEY')
  const appSecret = Deno.env.get('HMS_APP_SECRET')

  if (!appAccessKey || !appSecret) {
    throw new Error('HMS_APP_ACCESS_KEY and HMS_APP_SECRET must be set')
  }

  const now = Math.floor(Date.now() / 1000)
  const validityDays = 7

  const payload = {
    access_key: appAccessKey,
    type: 'management',
    version: 2,
    iat: now,
    nbf: now,
    exp: now + (validityDays * 24 * 60 * 60),
    jti: crypto.randomUUID()
  }

  // Create JWT
  const header = { typ: 'JWT', alg: 'HS256' }

  const base64Header = btoa(JSON.stringify(header))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const base64Payload = btoa(JSON.stringify(payload))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  // Sign with HMAC SHA256
  const encoder = new TextEncoder()
  const keyData = encoder.encode(appSecret)
  const messageData = encoder.encode(`${base64Header}.${base64Payload}`)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${base64Header}.${base64Payload}.${base64Signature}`
}
