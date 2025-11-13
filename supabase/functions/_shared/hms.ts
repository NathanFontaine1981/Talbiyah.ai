// HMS (100ms) JWT token generation utility
// This generates fresh JWT tokens automatically using your permanent app credentials

// JWT implementation for Deno
async function base64url(input: ArrayBuffer): Promise<string> {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(input)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function hmacSha256(key: CryptoKey, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return await crypto.subtle.sign('HMAC', key, encoder.encode(data))
}

async function importKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function createJWT(payload: any, secret: string, expiresIn: string = '24h'): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  let exp: number
  
  // Parse expiresIn (only handle 'h' for hours)
  if (expiresIn.endsWith('h')) {
    const hours = parseInt(expiresIn.slice(0, -1))
    exp = now + (hours * 3600)
  } else {
    exp = now + 86400 // Default 24 hours
  }

  const finalPayload = {
    ...payload,
    iat: now,
    nbf: now,
    exp,
    jti: generateUUID()
  }

  const encoder = new TextEncoder()
  const headerB64 = await base64url(encoder.encode(JSON.stringify(header)))
  const payloadB64 = await base64url(encoder.encode(JSON.stringify(finalPayload)))
  
  const data = `${headerB64}.${payloadB64}`
  const key = await importKey(secret)
  const signature = await hmacSha256(key, data)
  const signatureB64 = await base64url(signature)
  
  return `${data}.${signatureB64}`
}

/**
 * Generate a fresh HMS management token automatically
 * This eliminates the need to manually refresh tokens every 7-14 days
 */
export async function generateHMSManagementToken(): Promise<string> {
  const appAccessKey = Deno.env.get('HMS_APP_ACCESS_KEY')
  const appSecret = Deno.env.get('HMS_APP_SECRET')
  
  if (!appAccessKey || !appSecret) {
    throw new Error('HMS_APP_ACCESS_KEY and HMS_APP_SECRET must be set in environment variables')
  }
  
  const payload = {
    access_key: appAccessKey,
    type: 'management',
    version: 2
  }
  
  // Generate token valid for 23 hours (refresh before expiry)
  const token = await createJWT(payload, appSecret, '23h')
  
  console.log('🔑 Generated fresh HMS management token', {
    access_key: appAccessKey.substring(0, 8) + '...',
    expires_in: '23h',
    timestamp: new Date().toISOString()
  })
  
  return token
}

/**
 * Get HMS management token - either generate fresh one or use existing
 */
export async function getHMSManagementToken(): Promise<string> {
  // Always generate fresh token to avoid expiry issues
  return await generateHMSManagementToken()
}