#!/usr/bin/env node
import crypto from 'crypto';

const HMS_APP_ACCESS_KEY = '6905f77ebd0dab5f9a014498';
const HMS_APP_SECRET = '1yLUaILAzsih3HYjiEyNHzYmVm4aHJpd_KQoGrkuOTNuECVxbmZP7Jqre7bYYEkjaAfCryrETHYNaq0tVmrxnoLz2KzIMeg8TFhA_oE8caW0-yL4O5_NtwIozlriUG6tVYV4KC0vQjJD5SYI322zneMTwZzhN6DoE5iYLGCBnp0=';

function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    access_key: HMS_APP_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: now,
    nbf: now,
    exp: now + 86400,
    jti: `mgmt-${now}`
  };

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto.createHmac('sha256', HMS_APP_SECRET).update(data).digest();
  return `${data}.${base64url(signature)}`;
}

async function checkSession() {
  const token = generateToken();
  const roomId = '6944344f3b1755a1488cbe39';

  // Get sessions for the room
  console.log('Fetching sessions for room:', roomId);
  const sessionsRes = await fetch(`https://api.100ms.live/v2/sessions?room_id=${roomId}&limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const sessionsData = await sessionsRes.json();
  console.log('Sessions response:', JSON.stringify(sessionsData, null, 2));

  if (sessionsData.data && sessionsData.data.length > 0) {
    const sessionId = sessionsData.data[0].id;
    console.log('\nFetching recording assets for session:', sessionId);

    const assetsRes = await fetch(`https://api.100ms.live/v2/recording-assets?session_id=${sessionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const assetsData = await assetsRes.json();
    console.log('Recording assets:', JSON.stringify(assetsData, null, 2));

    // Check for transcript
    const transcriptAsset = assetsData.data?.find(a => a.type === 'transcript');
    if (transcriptAsset) {
      console.log('\n✅ Transcript found! ID:', transcriptAsset.id, 'Status:', transcriptAsset.status);

      // Get presigned URL
      const presignRes = await fetch(`https://api.100ms.live/v2/recording-assets/${transcriptAsset.id}/presigned-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const presignData = await presignRes.json();
      console.log('Transcript URL:', presignData.url?.substring(0, 100) + '...');
    } else {
      console.log('\n❌ No transcript found in recording assets');

      // Check for beam/composite recording
      const beamAsset = assetsData.data?.find(a => a.type === 'room-composite' || a.type === 'room-vod' || (a.type === 'stream' && a.metadata?.stream_type === 'composite'));
      if (beamAsset) {
        console.log('\n📹 Beam/composite recording found:', beamAsset.id);
      }

      // List all asset types
      console.log('\nAll asset types found:', [...new Set(assetsData.data?.map(a => a.type))]);
    }

    // Try to start transcription manually
    console.log('\n\nAttempting to start transcription for session...');
    const startTranscriptionRes = await fetch(`https://api.100ms.live/v2/recordings/${sessionsData.data[0].recording?.id || assetsData.data?.[0]?.recording_id}/transcription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modes: ['recorded'],
        output_modes: ['txt', 'json'],
        summary: { enabled: true }
      })
    });

    console.log('Start transcription response:', startTranscriptionRes.status);
    const transcriptionResult = await startTranscriptionRes.json();
    console.log('Result:', JSON.stringify(transcriptionResult, null, 2));
  }
}

checkSession().catch(console.error);
