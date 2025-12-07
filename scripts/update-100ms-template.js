#!/usr/bin/env node
/**
 * Script to update 100ms template with Browser Composite Recording
 * Run with: node scripts/update-100ms-template.js
 */

import crypto from 'crypto';

const HMS_APP_ACCESS_KEY = '6905f77ebd0dab5f9a014498';
const HMS_APP_SECRET = '1yLUaILAzsih3HYjiEyNHzYmVm4aHJpd_KQoGrkuOTNuECVxbmZP7Jqre7bYYEkjaAfCryrETHYNaq0tVmrxnoLz2KzIMeg8TFhA_oE8caW0-yL4O5_NtwIozlriUG6tVYV4KC0vQjJD5SYI322zneMTwZzhN6DoE5iYLGCBnp0=';
const TEMPLATE_ID = '6905fb03033903926e627d60';

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

async function updateTemplate() {
  console.log('Generating 100ms management token...');
  const token = generateManagementToken();
  console.log('Token generated successfully\n');

  // Get current template
  console.log('Fetching current template...');
  const getResponse = await fetch(`https://api.100ms.live/v2/templates/${TEMPLATE_ID}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!getResponse.ok) {
    console.error('Failed to get template:', await getResponse.text());
    return;
  }

  const template = await getResponse.json();
  console.log('Current template:', template.name);
  console.log('Current browser recordings:', Object.keys(template.destinations?.browserRecordings || {}));
  console.log('Current transcriptions:', Object.keys(template.destinations?.transcriptions || {}));
  console.log('');

  // Update destinations - keep existing config and add/update transcription
  const updatedDestinations = {
    ...template.destinations,
    // Add transcription config for recorded mode (post-session transcription)
    transcriptions: {
      "lesson-transcription": {
        name: "lesson-transcription",
        role: "host",
        modes: ["recorded"],
        outputModes: ["txt", "json", "srt"],
        customVocabulary: ["Quran", "Surah", "Ayah", "Tajweed", "Tafseer", "Arabic", "Bismillah", "Alhamdulillah", "SubhanAllah", "MashaAllah", "InshaAllah"],
        summary: {
          enabled: true,
          context: "This is an Islamic education lesson covering Quran recitation, Arabic language learning, or Islamic studies. Focus on religious terminology, Arabic vocabulary, Quranic verses, and educational content.",
          sections: [
            { title: "Topics Covered", format: "bullets" },
            { title: "Key Quranic Verses", format: "bullets" },
            { title: "Arabic Vocabulary", format: "bullets" },
            { title: "Main Takeaways", format: "bullets" },
            { title: "Summary", format: "paragraph" }
          ],
          temperature: 0.5
        }
      }
    }
  };

  console.log('Updating template with transcription enabled...');

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
    console.error('Failed to update template:', await updateResponse.text());
    return;
  }

  const updatedTemplate = await updateResponse.json();
  console.log('\n✅ Template updated successfully!\n');

  // Display the current configuration
  console.log('📹 Recording Configuration:');
  const browserRecordings = updatedTemplate.destinations?.browserRecordings || {};
  if (Object.keys(browserRecordings).length > 0) {
    console.log('   - Browser Composite Recording: Enabled');
    const firstRecording = Object.values(browserRecordings)[0];
    console.log('   - Resolution:', firstRecording.width + 'x' + firstRecording.height);
    console.log('   - Max Duration:', firstRecording.maxDuration, 'seconds');
  } else {
    console.log('   - Browser Composite Recording: Not configured');
  }

  console.log('\n📝 Transcription Configuration:');
  const transcriptions = updatedTemplate.destinations?.transcriptions || {};
  if (Object.keys(transcriptions).length > 0) {
    Object.entries(transcriptions).forEach(([key, config]) => {
      console.log(`   - ${key}:`);
      console.log(`     • Role: ${config.role}`);
      console.log(`     • Modes: ${config.modes?.join(', ')}`);
      console.log(`     • Output: ${config.outputModes?.join(', ')}`);
      console.log(`     • Summary: ${config.summary?.enabled ? 'Enabled' : 'Disabled'}`);
    });
  } else {
    console.log('   - No transcriptions configured');
  }

  console.log('\n✅ Transcription is now enabled for future lessons!');
  console.log('   After each lesson ends, 100ms will automatically:');
  console.log('   1. Generate a transcript from the recording');
  console.log('   2. Send a webhook with the transcript URL');
  console.log('   3. Your system will then generate AI insights');
}

updateTemplate().catch(console.error);
