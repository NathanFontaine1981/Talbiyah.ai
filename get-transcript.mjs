import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabase = createClient(
  'https://boyrjgivpepjiboekwuu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q'
);

const ROOM_ID = '69298254cd12050d5608f8d6';
const RECORDING_WITH_TRANSCRIPT = '692c0b7dcdada8de847b5e69';

// HMS credentials
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
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', HMS_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  return `${base64Header}.${base64Payload}.${signature}`;
}

async function getTranscript() {
  console.log('🔍 Fetching room data for:', ROOM_ID);

  // Call the get-room-sessions function
  const response = await fetch('https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/get-room-sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q'
    },
    body: JSON.stringify({ room_id: ROOM_ID })
  });

  const data = await response.json();

  console.log('\n📝 Transcriptions:', data.transcriptions?.length || 0);
  if (data.transcriptions && data.transcriptions.length > 0) {
    console.log(JSON.stringify(data.transcriptions, null, 2));
  }

  console.log('\n📹 Recordings:', data.recordings?.length || 0);
  if (data.recordings) {
    data.recordings.forEach(r => {
      console.log(`  - ID: ${r.id}, Status: ${r.status}, Assets: ${r.asset_types?.join(', ')}`);
    });
  }

  // Check if any recording has transcript
  const recordingWithTranscript = data.recordings?.find(r =>
    r.asset_types?.includes('transcript')
  );

  if (recordingWithTranscript) {
    console.log('\n✅ Found recording with transcript:', recordingWithTranscript.id);
  } else {
    console.log('\n⚠️ No transcript found in recordings');
  }

  // Try to get recording URL which might have transcript
  console.log('\n🔗 Fetching recording URLs...');
  const recResponse = await fetch('https://boyrjgivpepjiboekwuu.supabase.co/functions/v1/get-recording-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY4MjcwNywiZXhwIjoyMDc3MjU4NzA3fQ.8bjdYy46MPL58Z4l5yqW9WOEOMDoPU-BmqyZNdroZ_Q'
    },
    body: JSON.stringify({ room_id: ROOM_ID })
  });

  const recData = await recResponse.json();
  console.log('Recording data:', JSON.stringify(recData, null, 2));

  if (recData.transcript_url) {
    console.log('\n📄 Fetching transcript content...');
    const transcriptResponse = await fetch(recData.transcript_url);
    const transcript = await transcriptResponse.text();
    console.log('\n--- TRANSCRIPT ---');
    console.log(transcript.substring(0, 5000));
    console.log('--- END ---');
  }
}

getTranscript().catch(console.error);
