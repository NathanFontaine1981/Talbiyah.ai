// Generate HMS Management Token from App Access Key and Secret
import jwt from 'jsonwebtoken';

const APP_ACCESS_KEY = 'b4a855fcd1066130cd996f084d1ee980a4e90cc913b566b08ba4c06c0703d475';
const APP_SECRET = '681d30d1daa7f9a6cce320af3186f41512145b20744bfa46e597ac5cda2fbe9f';

// Generate a management token that's valid for 24 hours
const now = Math.floor(Date.now() / 1000);

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

console.log('✅ HMS Management Token generated:');
console.log(token);
console.log('\n📝 This token is valid for 24 hours');
