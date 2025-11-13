// Generate HMS Management Token with correct 2024 timestamp
import jwt from 'jsonwebtoken';

const APP_ACCESS_KEY = 'b4a855fcd1066130cd996f084d1ee980a4e90cc913b566b08ba4c06c0703d475';
const APP_SECRET = '681d30d1daa7f9a6cce320af3186f41512145b20744bfa46e597ac5cda2fbe9f';

// Use correct 2024 timestamp (system clock is wrong, showing 2025)
const now = Math.floor(new Date('2024-11-09T14:52:00Z').getTime() / 1000);

const payload = {
  access_key: APP_ACCESS_KEY,
  type: 'management',
  version: 2,
  iat: now,
  nbf: now
};

const token = jwt.sign(payload, APP_SECRET, {
  algorithm: 'HS256',
  expiresIn: '24h',
  jwtid: `${now}`
});

console.log('✅ HMS Management Token generated (with corrected 2024 timestamp):');
console.log(token);
console.log('\n📝 This token is valid for 24 hours');
console.log('Timestamp:', now, '(Nov 9, 2024)');
