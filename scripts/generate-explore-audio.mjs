#!/usr/bin/env node
/**
 * Generate Exploring Islam audio narrations using the existing generate-dua-audio edge function.
 * Saves MP3s to Supabase Storage "explore-audio" bucket.
 *
 * Usage: node scripts/generate-explore-audio.mjs [scene-id]
 *   - No args = generate all missing scenes
 *   - With arg = generate specific scene (e.g. "welcome")
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boyrjgivpepjiboekwuu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXJqZ2l2cGVwamlib2Vrd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODI3MDcsImV4cCI6MjA3NzI1ODcwN30.-BEMiplFBMTofQDc68bSGDhW4YkH8xTtiohk-IFfzzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// AI narrations for the new 20-scene flow (Daniel voice only — Nathan's scenes are recorded separately)
// Nathan scenes: welcome, what-we-know, something-created-us, what-are-you-for, my-discovery, court-session, your-verdict/begin
// These are stored as nathan-{sceneId}.mp3 and uploaded manually.
const NARRATIONS = {
  // PHASE A — "What We Know For Sure"
  'foundation': `Let's build our foundation together. I'm going to present eight truths, one by one. Things every human being knows. All I ask is that you confirm what you know to be true. Once we have this foundation, everything else becomes clearer.`,

  'reasoning-setup': `We all judge things against what we already know. If new information contradicts something you know for sure, you can rule it out. That's how your brain works. Evidence in, conclusion out. Let me give you a quick test. Nothing complicated. Just see if your brain is doing what it should be doing. Ready?`,

  // PHASE B — "Apply Your Logic"
  'the-evidence-within': `Remember, you agreed: our bodies work automatically. We think something and our body does it. Let's look closer at the evidence you carry with you every single day. Your eyes. 576 megapixels. Auto-focus in milliseconds. Self-cleaning. Adjusts to light instantly. Works for 80 plus years without replacement. No camera company has come close, and we have two of them. Your body. Cut yourself, it heals. Break a bone, it repairs. Get sick, your immune system fights back automatically. No machine fixes itself. Your body does it without you even thinking. Your brain. 86 billion neurons. Stores a lifetime of memories. Processes emotions, language, creativity, and consciousness itself. The most powerful supercomputers still can't replicate what sits between your ears. All of this, by accident? Or by design?`,

  'the-creator': `Science tells us the universe had a beginning. The Big Bang. Before that, nothing. If the universe was brought into existence, then it is a creation. And every creation needs something to create it. The universe didn't create itself, because it didn't exist yet. Something outside the universe must have brought it into being. Some ask: who created the Creator? But this question misunderstands what Creator means. Creation has a beginning, is in need. The Creator has no beginning, is self-sufficient, by definition uncreated. Asking who created the Creator is like asking a man when he gave birth. The question doesn't apply. Imagine you need to hang a picture on the wall but can't do it alone. You ask Person A for help. They say I can help, but only if someone helps me first. Person B says the same. If this chain goes forever, the picture never gets on the wall. But the picture is on the wall. The universe does exist. There must be someone who doesn't need help. That is the Creator.`,

  'the-answer': `So if something more intelligent than us created us and this universe, for a reason, would it really create us and then not tell us why? That doesn't make sense. If something designed you with this level of precision, intelligence, awareness, a body that maintains itself, it clearly had a plan. And it must have communicated that plan. There is one source, the Quran, that claims to be from the One who created us. It claims to contain why you were created, what happens when you die, laws for living, morals, justice, a complete code of life. That's a bold claim. So we need to examine it.`,

  // PHASE C — "The Evidence"
  'back-in-time': `Before we look at the evidence, you have to put yourself back in that time and understand what life was like. 7th century Arabia. No technology. No electricity. No printing press. Barefooted Bedouins of the desert. Most people couldn't read or write. They had the most eloquent poetry, but no science, no medicine, no astronomy. Imagine someone from that time hearing a conversation from today. "I'll fly to that country and be there in half an hour." They'd say: "Only birds fly. How can a human fly?" That's the gap between what they knew then and what we know now. Keep that in mind as we look at what this book says.`,

  'the-specialist': `Think about the best people in the world in their respective areas. A cardiologist, who spent their entire life becoming an expert in one area of the body. David Attenborough, a lifetime observing nature. An oceanologist, who spent their career studying the ocean. Each of these people spent a lifetime becoming the best at one thing. Yet somehow, the Quran, from 1400 years ago, covers the human body, the ocean, the mountains, the universe, embryology, law and morality, history and prophecy, nature and ecology. And gets nothing wrong. From a man who couldn't read or write. How? The author seems to know everything about everything.`,

  'the-verdict': `Consider what we've just seen. The Quran was revealed over 23 years. In bits and pieces, across completely different situations. In rhyming Arabic of the highest eloquence. And nothing, absolutely nothing, has contradicted itself. No ruling contradicts another ruling. No scientific description has been proven wrong. No prophecy has failed. Over 1400 years of scrutiny. There is one Quran. Every copy on earth is identical. 1400 years. One version. And the very first thing this book says to you: "This is the Book about which there is no doubt, a guidance for those who are mindful of God."`,

  // PHASE D — "The Closing"
  'prove-it': `So what do we say back? "You claim to be my Creator? Prove it. Show me. Give me evidence." And that's exactly what we just did. We examined what the Quran says about the human body, confirmed by modern science. We examined what it says about the universe, confirmed by modern science. We examined what it says about the natural world, confirmed by modern science. Zero contradictions over 1400 years, confirmed. One version, unchanged, confirmed. The evidence has been presented.`,
};

async function generateAudioViaEdgeFunction(text, sceneId) {
  console.log(`[${sceneId}] Generating audio (${text.length} chars)...`);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-dua-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      text,
      voice: 'onwK4e9ZLuTAKqWW03F9', // Daniel — male voice
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge function error ${response.status}: ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  console.log(`[${sceneId}] Got ${audioBuffer.byteLength} bytes`);
  return audioBuffer;
}

async function uploadToStorage(sceneId, audioBuffer) {
  const filename = `${sceneId}.mp3`;

  const { error } = await supabase.storage
    .from('explore-audio')
    .upload(filename, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from('explore-audio')
    .getPublicUrl(filename);

  return data.publicUrl;
}

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes('--force');
  const specificScene = args.find(a => !a.startsWith('--'));
  const scenes = specificScene
    ? { [specificScene]: NARRATIONS[specificScene] }
    : NARRATIONS;

  if (specificScene && !NARRATIONS[specificScene]) {
    console.error(`Unknown scene: ${specificScene}`);
    console.log('Available scenes:', Object.keys(NARRATIONS).join(', '));
    process.exit(1);
  }

  // Check which scenes already have audio
  const { data: existing } = await supabase.storage
    .from('explore-audio')
    .list('');

  const existingFiles = new Set((existing || []).map(f => f.name));

  const sceneIds = Object.keys(scenes);
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const sceneId of sceneIds) {
    const filename = `${sceneId}.mp3`;

    if (existingFiles.has(filename) && !specificScene && !forceAll) {
      console.log(`[${sceneId}] Already exists, skipping`);
      skipped++;
      continue;
    }

    try {
      const audioBuffer = await generateAudioViaEdgeFunction(scenes[sceneId], sceneId);
      const url = await uploadToStorage(sceneId, audioBuffer);
      console.log(`[${sceneId}] Uploaded: ${url}`);
      generated++;

      // Delay between generations to avoid rate limits
      if (sceneIds.indexOf(sceneId) < sceneIds.length - 1) {
        console.log('  Waiting 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error(`[${sceneId}] FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
