// Client-side request signing for sensitive API calls
// Generates HMAC signatures to verify request integrity

/**
 * Generate HMAC-SHA256 signature for request payload
 */
async function generateSignature(
  payload: string,
  secret: string,
  timestamp: number
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}.${payload}`);
  const keyData = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create signed headers for a request
 * @param payload - The request body as a string
 * @returns Headers with signature and timestamp
 */
export async function createSignedHeaders(
  payload: string
): Promise<{ 'x-signature': string; 'x-timestamp': string } | null> {
  // Get signing secret from environment
  const signingSecret = import.meta.env.VITE_REQUEST_SIGNING_SECRET;

  // If no secret configured, return null (signing disabled)
  if (!signingSecret) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateSignature(payload, signingSecret, timestamp);

  return {
    'x-signature': signature,
    'x-timestamp': timestamp.toString(),
  };
}

/**
 * Make a signed fetch request
 * Automatically adds signature headers if signing is enabled
 */
export async function signedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const body = options.body as string | undefined;

  if (body && typeof body === 'string') {
    const signedHeaders = await createSignedHeaders(body);

    if (signedHeaders) {
      options.headers = {
        ...options.headers,
        ...signedHeaders,
      };
    }
  }

  return fetch(url, options);
}
