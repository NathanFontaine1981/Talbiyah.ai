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
  console.log('Current HLS destinations:', Object.keys(template.destinations?.hlsDestinations || {}));
  console.log('Current transcriptions:', Object.keys(template.destinations?.transcriptions || {}));
  console.log('');

  // The HLS destination is what's being used for recording
  // We need to ensure proper video recording configuration
  // The key is that HLS recording captures the composed view

  const hlsDestinationId = Object.keys(template.destinations?.hlsDestinations || {})[0];

  if (!hlsDestinationId) {
    console.error('No HLS destination found in template');
    return;
  }

  console.log('Found HLS destination:', hlsDestinationId);

  // Get the current HLS config
  const currentHls = template.destinations.hlsDestinations[hlsDestinationId];

  // Update with proper recording configuration that captures all participants
  // Keep existing layers to avoid validation errors
  const updatedHls = {
    ...currentHls,
    // Ensure recording is enabled with proper settings
    recording: {
      ...currentHls.recording,
      hlsVod: true,
      presignDuration: 604800 // 7 days
    }
  };

  const updatedDestinations = {
    ...template.destinations,
    hlsDestinations: {
      [hlsDestinationId]: updatedHls
    },
    // Update transcription config
    transcriptions: {
      "lesson-transcription": {
        name: "lesson-transcription",
        role: "__internal_recorder",
        modes: ["recorded"],
        outputModes: ["txt", "json", "srt"],
        language: "en",
        summary: {
          enabled: true,
          context: "Islamic education lesson covering Quran, Arabic language, or Islamic studies.",
          sections: [
            { title: "Topics Covered", format: "bullets" },
            { title: "Key Vocabulary", format: "bullets" },
            { title: "Summary", format: "paragraph" }
          ],
          temperature: 0.5
        }
      }
    }
  };

  console.log('Updating template with enhanced recording...');

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

  // Now check and display the current configuration
  console.log('📹 Recording Configuration:');
  const hlsConfig = updatedTemplate.destinations?.hlsDestinations?.[Object.keys(updatedTemplate.destinations?.hlsDestinations || {})[0]];
  if (hlsConfig) {
    console.log('   - HLS VOD Recording:', hlsConfig.recording?.hlsVod ? 'Enabled' : 'Disabled');
    console.log('   - Max Duration:', hlsConfig.maxDuration, 'seconds');
    console.log('   - Recording Layers:', hlsConfig.recording?.layers?.length || 0);
  }

  console.log('\n📝 Transcription Configuration:');
  console.log('   - Transcriptions:', Object.keys(updatedTemplate.destinations?.transcriptions || {}));

  console.log('\n⚠️  The black screen issue is likely caused by:');
  console.log('   1. HLS streaming records the STREAM output, not webcams');
  console.log('   2. If no one is sharing screen, the stream may be blank');
  console.log('');
  console.log('💡 To fix this, you need to enable "Beam" or "Browser Recording"');
  console.log('   in the 100ms Dashboard under Template > Destinations.');
  console.log('   This records the composite view of all participants.');
}

updateTemplate().catch(console.error);
