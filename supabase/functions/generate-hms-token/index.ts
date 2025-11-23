import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const HMS_APP_ACCESS_KEY = Deno.env.get('HMS_APP_ACCESS_KEY')
  const HMS_APP_SECRET = Deno.env.get('HMS_APP_SECRET')

  console.log('🔑 HMS_APP_ACCESS_KEY:', HMS_APP_ACCESS_KEY ? 'Present' : 'Missing')
  console.log('🔑 HMS_APP_SECRET:', HMS_APP_SECRET ? 'Present' : 'Missing')

  if (!HMS_APP_ACCESS_KEY || !HMS_APP_SECRET) {
    return new Response(JSON.stringify({
      error: 'Missing HMS credentials',
      details: 'HMS_APP_ACCESS_KEY or HMS_APP_SECRET not found in environment'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }

  try {
    // Generate management token using app credentials
    // The token is a JWT that needs to be signed with the app secret

    // According to 100ms docs, we need to create a JWT with:
    // - access_key in payload
    // - type: "management"
    // - version: 2
    // - iat: issued at timestamp
    // - exp: expiration (we'll set it to 1 year from now)

    const encoder = new TextEncoder()

    // Header
    const header = {
      alg: "HS256",
      typ: "JWT"
    }

    // Payload
    const now = Math.floor(Date.now() / 1000)
    const jti = crypto.randomUUID()
    const payload = {
      access_key: HMS_APP_ACCESS_KEY,
      type: "management",
      version: 2,
      jti: jti,
      iat: now,
      nbf: now,
      exp: now + (365 * 24 * 60 * 60) // 1 year from now
    }

    // Base64url encode
    const base64url = (str: string) => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
    }

    const encodedHeader = base64url(JSON.stringify(header))
    const encodedPayload = base64url(JSON.stringify(payload))

    // Create signature
    const message = `${encodedHeader}.${encodedPayload}`
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(HMS_APP_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    )

    const encodedSignature = base64url(String.fromCharCode(...new Uint8Array(signature)))
    const token = `${message}.${encodedSignature}`

    console.log('✅ Generated new management token')
    console.log('Token expires in 1 year')

    return new Response(JSON.stringify({
      success: true,
      token: token,
      expires_at: new Date((now + (365 * 24 * 60 * 60)) * 1000).toISOString(),
      message: 'Copy this token and update HMS_MANAGEMENT_TOKEN in Supabase secrets'
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
