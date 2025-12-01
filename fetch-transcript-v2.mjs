import * as crypto from 'crypto';

const HMS_ACCESS_KEY = '6905f77ebd0dab5f9a014498';
const HMS_SECRET = 'wq4CVTy08YH1NqXPMxYdlh7xXBGX6PjgjlJRXaX5K7Dj9Wx8Kz3k4wDplNScjxBL_t8bKNBV8Q4TFXvlHvxHqI2C-JuDh3KPaqvMTJSuvAeQRtJGPBtO6LlPTixZT3-LlHHKDJnwO-Jp8bH3KLXKXCUaXMdpbAc64AV_gM_h9I3c';

function generateHMSToken() {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400;
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    access_key: HMS_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: now,
    nbf: now,
    exp: exp,
    jti: crypto.randomUUID()
  };
  
  // base64url encoding
  const base64url = (obj) => {
    const jsonStr = JSON.stringify(obj);
    const base64 = Buffer.from(jsonStr).toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  
  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);
  
  const signature = crypto.createHmac('sha256', HMS_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function getRecordingAssets() {
  const token = generateHMSToken();
  console.log('Generated token:', token.substring(0, 50) + '...');
  
  // Get recording assets
  const response = await fetch(`https://api.100ms.live/v2/recording-assets?room_id=69298254cd12050d5608f8d6`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log('\nRecording assets response:', JSON.stringify(data, null, 2));
  
  // Find transcript asset
  if (data.data) {
    const transcriptAsset = data.data.find(a => a.type === 'transcript');
    if (transcriptAsset) {
      console.log('\n✅ Found transcript asset:', transcriptAsset.id);
      
      // Get presigned URL for transcript
      const urlResponse = await fetch(`https://api.100ms.live/v2/recording-assets/${transcriptAsset.id}/presigned-url`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const urlData = await urlResponse.json();
      console.log('\nTranscript URL data:', JSON.stringify(urlData, null, 2));
      
      if (urlData.url) {
        console.log('\n📄 Fetching transcript content...');
        const transcriptResponse = await fetch(urlData.url);
        const contentType = transcriptResponse.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        const transcript = await transcriptResponse.text();
        console.log('\n--- TRANSCRIPT ---');
        console.log(transcript);
        console.log('--- END ---');
      }
    } else {
      console.log('\n❌ No transcript asset found in recording assets');
    }
  }
}

getRecordingAssets().catch(console.error);
