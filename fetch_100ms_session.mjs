import jwt from 'jsonwebtoken';

// 100ms credentials - you'll need to provide these
const HMS_ACCESS_KEY = '6905f77ebd0dab5f9a014498';
const HMS_SECRET = 'rP1s-lRQdWWXTGKCECMH05dwMfnRYMFqsOLMXi5rYw-m2U49OIBFPqlzNxPkx5VGmCHuAy8NG2fOokpz3q2r5x_j4QvUOkfT-DxkJiZy_6mBs-Eo7r9dStjKk1Jb_cO2mWPLe__PcxLLwwvtVIoPefTnW-jUxMnhHdvkbSN7jj8=';

const ROOM_ID = '692957edcd12050d5608f4ca';

// Generate management token
function generateManagementToken() {
  const payload = {
    access_key: HMS_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    jti: crypto.randomUUID()
  };

  return jwt.sign(payload, HMS_SECRET, { algorithm: 'HS256' });
}

async function fetchRoomSessions() {
  const token = generateManagementToken();
  console.log('Generated token:', token.substring(0, 50) + '...');

  // Get room details
  console.log('\n📍 Fetching room details...');
  const roomRes = await fetch(`https://api.100ms.live/v2/rooms/${ROOM_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!roomRes.ok) {
    console.log('Room error:', await roomRes.text());
    return;
  }
  const room = await roomRes.json();
  console.log('Room:', JSON.stringify(room, null, 2));

  // Get sessions for this room
  console.log('\n📹 Fetching sessions...');
  const sessionsRes = await fetch(`https://api.100ms.live/v2/sessions?room_id=${ROOM_ID}&limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!sessionsRes.ok) {
    console.log('Sessions error:', await sessionsRes.text());
    return;
  }
  const sessions = await sessionsRes.json();
  console.log('Sessions:', JSON.stringify(sessions, null, 2));

  // If there are sessions, get recordings
  if (sessions.data && sessions.data.length > 0) {
    for (const session of sessions.data) {
      console.log(`\n🎬 Fetching recordings for session ${session.id}...`);
      const recRes = await fetch(`https://api.100ms.live/v2/recordings?room_id=${ROOM_ID}&session_id=${session.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (recRes.ok) {
        const recordings = await recRes.json();
        console.log('Recordings:', JSON.stringify(recordings, null, 2));
      }
    }
  }

  // Also check for any active recordings
  console.log('\n📼 Checking all recordings for room...');
  const allRecRes = await fetch(`https://api.100ms.live/v2/recordings?room_id=${ROOM_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (allRecRes.ok) {
    const allRec = await allRecRes.json();
    console.log('All recordings:', JSON.stringify(allRec, null, 2));
  }
}

fetchRoomSessions().catch(console.error);
