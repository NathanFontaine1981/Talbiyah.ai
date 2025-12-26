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

async function triggerTranscription() {
  const token = generateToken();
  const roomId = process.argv[2] || '6944344f3b1755a1488cbe39';

  console.log('Fetching sessions for room:', roomId);

  // Get sessions
  const sessionsRes = await fetch(`https://api.100ms.live/v2/sessions?room_id=${roomId}&limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sessions = await sessionsRes.json();

  if (!sessions.data?.length) {
    console.log('No sessions found');
    return;
  }

  const session = sessions.data[0];
  console.log('Session ID:', session.id);
  console.log('Session ended at:', session.ended_at);

  // Get recording job ID from assets
  const assetsRes = await fetch(`https://api.100ms.live/v2/recording-assets?session_id=${session.id}&limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const assets = await assetsRes.json();

  if (!assets.data?.length) {
    console.log('No recording assets found');
    return;
  }

  const recordingId = assets.data[0].recording_id;
  console.log('Recording ID:', recordingId);

  // Try to start transcription using the recordings API
  console.log('\nStarting transcription via /v2/recordings/:recording_id/transcription/start...');

  const startRes = await fetch(`https://api.100ms.live/v2/recordings/${recordingId}/transcription/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      output_modes: ['txt', 'json', 'srt'],
      summary: {
        enabled: true,
        context: "Islamic education lesson",
        sections: [
          { title: "Topics Covered", format: "bullets" },
          { title: "Summary", format: "paragraph" }
        ]
      }
    })
  });

  console.log('Response status:', startRes.status);
  const result = await startRes.text();
  console.log('Response:', result);

  // Also try the rooms API
  console.log('\n\nTrying /v2/rooms/:room_id/start-transcription...');

  const startRes2 = await fetch(`https://api.100ms.live/v2/rooms/${roomId}/start-transcription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meeting_url: "", // Not applicable for recorded mode
      output_modes: ['txt', 'json']
    })
  });

  console.log('Response status:', startRes2.status);
  const result2 = await startRes2.text();
  console.log('Response:', result2);
}

triggerTranscription().catch(console.error);
