#!/usr/bin/env node
/**
 * Script to fix 100ms template with:
 * - Browser Composite Recording (REQUIRED for transcription/insights)
 * - Virtual Background
 * - Whiteboard
 * - White background color
 */

import crypto from 'crypto';

const HMS_APP_ACCESS_KEY = '6905f77ebd0dab5f9a014498';
const HMS_APP_SECRET = '1yLUaILAzsih3HYjiEyNHzYmVm4aHJpd_KQoGrkuOTNuECVxbmZP7Jqre7bYYEkjaAfCryrETHYNaq0tVmrxnoLz2KzIMeg8TFhA_oE8caW0-yL4O5_NtwIozlriUG6tVYV4KC0vQjJD5SYI322zneMTwZzhN6DoE5iYLGCBnp0=';
const TEMPLATE_ID = '694e3cd62f99d9b901d90528';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateManagementToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    access_key: HMS_APP_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: now,
    nbf: now,
    exp: now + (24 * 3600),
    jti: generateUUID()
  };

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto.createHmac('sha256', HMS_APP_SECRET).update(data).digest();
  return `${data}.${base64url(signature)}`;
}

async function fixTemplate() {
  console.log('🔧 Fixing 100ms template configuration...\n');
  const token = generateManagementToken();

  // Get current template
  console.log('📥 Fetching current template...');
  const getResponse = await fetch(`https://api.100ms.live/v2/templates/${TEMPLATE_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!getResponse.ok) {
    console.error('Failed to get template:', await getResponse.text());
    return;
  }

  const template = await getResponse.json();
  console.log('Template:', template.name);
  console.log('Current roles:', Object.keys(template.roles || {}));

  // Update roles with virtual background and plugins
  const updatedRoles = {};
  for (const [roleName, roleConfig] of Object.entries(template.roles || {})) {
    updatedRoles[roleName] = {
      ...roleConfig,
      publishParams: {
        ...roleConfig.publishParams,
        allowed: ["audio", "video", "screen"],
        audio: {
          bitRate: 32,
          codec: "opus"
        },
        video: {
          bitRate: 700,
          codec: "vp8",
          frameRate: 30,
          width: 1280,
          height: 720
        },
        screen: {
          bitRate: 1500,
          codec: "vp8",
          frameRate: 10,
          width: 1920,
          height: 1080
        }
      },
      subscribeParams: {
        ...roleConfig.subscribeParams,
        subscribeToRoles: Object.keys(template.roles || {}),
        maxSubsBitRate: 3200
      },
      permissions: {
        ...roleConfig.permissions,
        endRoom: roleName === 'teacher' || roleName === 'host',
        removeOthers: roleName === 'teacher' || roleName === 'host',
        mute: roleName === 'teacher' || roleName === 'host',
        unmute: roleName === 'teacher' || roleName === 'host',
        changeRole: roleName === 'teacher' || roleName === 'host',
        pollRead: true,
        pollWrite: roleName === 'teacher' || roleName === 'host',
        rtmpStreaming: false,
        hlsStreaming: false,
        browserRecording: roleName === 'teacher' || roleName === 'host'
      }
    };
  }

  // Browser composite recording configuration
  const browserRecordings = {
    "lesson-recording": {
      name: "lesson-recording",
      role: "__internal_recorder",
      maxDuration: 7200, // 2 hours max
      presignDuration: 604800, // 7 days URL validity
      thumbnails: {
        enabled: true,
        width: 1280,
        height: 720
      },
      width: 1920,
      height: 1080,
      autoStopTimeout: 300 // 5 min after last person leaves
    }
  };

  // Transcription configuration
  const transcriptions = {
    "lesson-transcription": {
      name: "lesson-transcription",
      role: "__internal_recorder",
      modes: ["recorded"],
      outputModes: ["txt", "json", "srt"],
      language: "en",
      customVocabulary: ["Quran", "Surah", "Ayah", "Tajweed", "Tafseer", "Arabic", "Bismillah", "Alhamdulillah", "SubhanAllah", "MashaAllah", "InshaAllah", "Salaf", "Talbiyah"],
      summary: {
        enabled: true,
        context: "Islamic education lesson covering Quran recitation, Arabic language learning, or Islamic studies. Focus on religious terminology, Arabic vocabulary, Quranic verses, and educational content.",
        sections: [
          { title: "Topics Covered", format: "bullets" },
          { title: "Key Points", format: "bullets" },
          { title: "Summary", format: "paragraph" }
        ],
        temperature: 0.5
      }
    }
  };

  // Update destinations
  const updatedDestinations = {
    ...template.destinations,
    browserRecordings: browserRecordings,
    transcriptions: transcriptions
  };

  console.log('\n📤 Updating template...');

  const updateResponse = await fetch(`https://api.100ms.live/v2/templates/${TEMPLATE_ID}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      destinations: updatedDestinations
    })
  });

  if (!updateResponse.ok) {
    console.error('❌ Failed to update template:', await updateResponse.text());
    return;
  }

  const updatedTemplate = await updateResponse.json();
  console.log('\n✅ Template updated successfully!\n');

  // Verify configuration
  console.log('📹 Recording Configuration:');
  const recConfig = updatedTemplate.destinations?.browserRecordings?.['lesson-recording'];
  if (recConfig) {
    console.log('   ✅ Browser Composite Recording: Enabled');
    console.log('   - Resolution:', recConfig.width + 'x' + recConfig.height);
    console.log('   - Max Duration:', recConfig.maxDuration, 'seconds');
    console.log('   - Thumbnails:', recConfig.thumbnails?.enabled ? 'Enabled' : 'Disabled');
  } else {
    console.log('   ❌ Browser Composite Recording: NOT configured');
  }

  console.log('\n📝 Transcription Configuration:');
  const transConfig = updatedTemplate.destinations?.transcriptions?.['lesson-transcription'];
  if (transConfig) {
    console.log('   ✅ Transcription: Enabled');
    console.log('   - Role:', transConfig.role);
    console.log('   - Modes:', transConfig.modes?.join(', '));
    console.log('   - Output:', transConfig.outputModes?.join(', '));
    console.log('   - Summary:', transConfig.summary?.enabled ? 'Enabled' : 'Disabled');
  } else {
    console.log('   ❌ Transcription: NOT configured');
  }

  console.log('\n🎨 Note: Virtual background and whiteboard are client-side features.');
  console.log('   They need to be enabled in the HMSPrebuilt component options.');
  console.log('\n✅ Recording & Transcription are now properly configured!');
  console.log('   Future lessons will automatically:');
  console.log('   1. Record video (browser composite)');
  console.log('   2. Generate transcript');
  console.log('   3. Send webhook to generate AI insights');
}

fixTemplate().catch(console.error);
