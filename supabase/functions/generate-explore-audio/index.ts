import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Liam - clear male multilingual voice (same as generate-dua-audio)
const VOICE_ID = 'TX3LPaxmHKxFdv7VOQHJ';

// All scene narrations for the Exploring Islam intro
// Key = filename (without .mp3), Value = narration text
const SCENE_NARRATIONS: Record<string, string> = {
  'welcome': `My duty is to convey the message that I found. "The duty of the Messenger is only to convey the message." Quran, chapter 5, verse 99. I want to share what I found, in full detail, and take you through my journey, from my lenses. Take your time. There's no rush. Digest each point before moving on.`,

  'what-we-know': `Before I share anything with you, let's start with what every single human being on this earth already knows. Not opinions. Not beliefs. Not theories. Facts that no one, regardless of their religion, culture, or background, can deny. I want to build a foundation with you. Things we both agree on. Things that will never change. Once we have that foundation, everything else becomes clearer.`,

  'foundation-part-1': `Let's build our foundation together. I'm going to present some truths, one by one. All I ask is that you confirm what you know to be true.`,

  'foundation-part-2': `Let's keep building. Four more truths that every human being knows.`,

  'your-foundation': `These are things you've confirmed you know to be true. They will never change. You can always stand on them. Now, let's put your thinking to the test.`,

  'reasoning-setup': `We all judge things against what we already know. If new information contradicts something you know for sure, you can rule it out. That's how your brain works. Evidence in, conclusion out. Let me give you a quick test. Nothing complicated. Just see if your brain is doing what it should be doing. Ready?`,

  'you-proved-something': `You didn't guess. You didn't go with your feelings. You used evidence to eliminate the impossible and narrow down to what's possible. This is exactly how we should approach the biggest question of all: Why are we here? You've already agreed that you exist, you had a beginning, and you're going to die. You've just proved you can think critically. Now let's apply the same brain you just used to life's biggest question.`,

  'something-brought-us-here': `Remember, you agreed: we exist. We had a beginning. We didn't choose to be here. So something must have brought us into existence. Because it's impossible for nothing to create something. Zero plus zero equals zero. Nothing plus nothing equals nothing. So how can no intelligence create intelligence? Surely something more intelligent created all the intelligence and sophistication we see around us.`,

  'phone-in-desert': `Imagine you're walking through a desert. Nothing around for miles. Just sand. Then you find a smartphone lying on the ground. Calendars. Messages. A camera with incredible clarity. Apps. Precision engineering. Did this phone design itself?`,

  'body-evidence': `Remember, you agreed: our bodies work automatically. We think something and our body does it. Let's look closer at the evidence you carry with you every single day. Your eyes. 576 megapixels. Auto-focus in milliseconds. Self-cleaning. Adjusts to light instantly. Works for 80 plus years without replacement. No camera company has come close, and we have two of them. Your body. Cut yourself, it heals. Break a bone, it repairs. Get sick, your immune system fights back automatically. No machine fixes itself. Your body does it without you even thinking. Your brain. 86 billion neurons. Stores a lifetime of memories. Processes emotions, language, creativity, and consciousness itself. The most powerful supercomputers still can't replicate what sits between your ears. All of this, by accident? Or by design?`,

  'what-we-observe': `It's not just our bodies. Look at the world around you. Day and night, every 24 hours, like clockwork. The sun rises, the sun sets. Never misses. The seasons. Summer, things grow and blossom. Winter, leaves fall, things appear dead. But they're not gone forever. When it warms up again, it all comes back. A cycle. Designed. Reproduction. A baby comes from a man and a woman. It grows inside the mother through stages. We didn't design this process. It just works. Ecosystems. Communities of bees, colonies of ants, each with roles, systems, order. The entire natural world runs with a precision that we observe but didn't create. Everything we observe points to order, systems, and design. Not chaos. Not randomness.`,

  'something-different': `Animals live by survival of the fittest. Kill or be killed. The lion doesn't feel guilt after a hunt. It's just survival. But human beings? We're different. We have a sense of justice. We know when something is wrong, even when it doesn't affect us personally. We have love. Not just instinct, but deep, conscious love for people. A desire to be good. To help, to be fair, to be kind. Why? Where does that come from? We see injustice happen around the world, and something inside us says, "that's wrong." Where did that come from? How do we just have justice inside of us? How do we just have love? There are so many things common between all human beings, across every culture, every continent, every era. We all share a sense of right and wrong. That's not random. That's built in.`,

  'creator-vs-creation': `Science tells us the universe had a beginning. The Big Bang. A moment when space, time, and matter came into existence. Before that, nothing. If the universe was brought into existence, then it is a creation. And every creation needs something to create it, something that was already there. The universe didn't create itself. It couldn't have, because it didn't exist yet. Something outside the universe must have brought it into being. Whatever that something is, must be the Creator.`,

  'the-question-redundant': `Some ask: if everything needs a creator, who created the Creator? But this question misunderstands what Creator means. Let me define two words. Creation: has a beginning, is in need of something else to exist, cannot bring itself into existence. Creator: has no beginning, always existed, is self-sufficient, not in need of anything, by definition is uncreated. Asking "who created the Creator" is like asking a man: "when did you give birth to your child?" The question doesn't apply. Men don't give birth. Creators aren't created.`,

  'picture-on-wall': `Imagine you need to hang a picture on the wall, but you can't do it alone. You ask Person A for help. They say: "I can help, but only if someone helps me first." So you ask Person B. Same answer. And Person C, and Person D, all the same. If this chain goes on forever, the picture would never get on the wall. But the picture is on the wall. The universe does exist. That means at some point, there must be someone who doesn't need help, someone self-sufficient who can act without depending on another. That is the Creator.`,

  'what-are-you-for': `Ask yourself about any body part and you know the answer. Feet, to walk. Eyes, to see. Ears, to hear. Hands, to feel and hold. But what are you for? What are we doing here? Why do we have all these faculties? We didn't make our own faculties. We didn't design our eyes or choose to have a heartbeat. Something gave us all of this. Imagine a Boeing 747. All those buttons, the engines, the fuel system. Would you ever believe the wind blew, the sand shifted, metal dropped from the sky, and it just assembled itself into a working aeroplane? You'd say that's impossible. And you'd be right. We never come to that conclusion in any area of life. So why would we think differently about ourselves?`,

  'the-plane': `We find ourselves living in this world. We didn't decide to be here. We didn't choose to be here. But here we are. And we know one thing for sure: one day, we are going to pass away. We don't know when, but it's certain. So the question is: is that the end? Do we just live, do what we want, die, and that's it? Nothing afterwards? Or does what we do in our lives actually matter? Imagine you wake up on a plane. You don't know how you got there. What would you immediately think? What am I doing on this plane? Where is it heading? How did I get on here? It would be strange to just turn on the TV, order some food, and enjoy yourself, without knowing what's happening or where you're going. This is us. We're on a journey we didn't choose, heading towards an end we can't escape. Every part of us has clear purpose. So surely the whole of us has a purpose too. The answer must exist. It's up to us to find it.`,

  'answer-must-exist': `So if we establish that something more intelligent than us created us and this universe, for a reason, would it really create us and then not tell us why? That doesn't make sense. If something created you with purpose-built parts, eyes to see, ears to hear, a brain to think, a heart that beats on its own, it clearly had a plan. And if it had a plan, it must have communicated that plan. Otherwise, what's the point? The answer must be here, somewhere in the world. It's up to us to find it. And that's exactly what I set out to do.`,

  'invitation': `So I did some investigating. And I found a claim. There is one source, the Quran, that claims to be from the One who created us. And it doesn't just say believe. It says: here's why you're here, here's what happens when you die, and here's how to live. It claims to contain: why you were created and your purpose, what happened to people before us, what happens when you die and what comes after, how the world was created, laws for living, inheritance, family, food, business, morals, justice, how to treat your parents and spouse, a complete code of life. That's a bold claim. So we need to examine it.`,

  'examine-the-claim': `If you find a book on the floor, there are only a few possibilities for where it came from. Option one: one human being wrote it. Option two: a group of human beings wrote it. Option three: it came from something else, the Creator. Now consider this: the Quran came over 1400 years ago. Imagine someone from back then hearing a conversation from today, phones, AI, flying across the world in hours. They wouldn't understand a word. So if this book from 1400 years ago contains information that couldn't have been known at that time, but we've since discovered to be true, that tells us something. Let's cross-check what it says with what we now know for sure. All I ask is an open mind.`,

  'beliefs-change': `Think about it, we update our beliefs all the time when new evidence comes in. Before telephones: "Talk to someone miles away? Impossible." Before planes: "Humans flying through the sky? Ridiculous." Before Concorde: "London to New York in 3 hours? Unbelievable." The impossible became possible. Then it became normal. We all carry beliefs right now. The question is, are we willing to examine them when evidence is presented?`,

  'court-session': `The case of: the Quran versus reasonable doubt. You are the judge and jury. I will present evidence. You will decide. Your duty: examine each piece of evidence with an open mind. Accept what convinces you. Question what doesn't. At the end, you will deliver your verdict. Is this book from the Creator, or isn't it?`,

  'back-in-time': `Before we look at the evidence, you have to put yourself back in that time and understand what life was like. 7th century Arabia. No technology. No electricity. No printing press. Barefooted Bedouins of the desert. Most people couldn't read or write. They had the most eloquent poetry, but no science, no medicine, no astronomy. Imagine someone from that time hearing a conversation from today. "I'll fly to that country and be there in half an hour." They'd say: "Only birds fly. How can a human fly?" That's the gap between what they knew then and what we know now. Keep that in mind as we look at what this book says.`,

  'the-specialist': `Think about the best people in the world in their respective areas. A cardiologist, who spent their entire life becoming an expert in one area of the body, the heart. Years of study, training, practice. Just to be a specialist in that one thing. David Attenborough, everyone knows him for observing nature. Animals, ecosystems, life forms. He spent a lifetime doing just that. If he tried to switch to something else, he'd never be as good. An oceanologist, who spent their career studying the ocean. Currents, salinity, marine life. One subject, one lifetime. Each of these people spent a lifetime becoming the best at one thing. Yet somehow, the Quran, from 1400 years ago, covers the human body, the ocean, the mountains, the universe, embryology, law and morality, history and prophecy, nature and ecology. And gets nothing wrong. From a man who couldn't read or write, in a civilisation that knew nothing about these fields. How? Somebody give me a clear explanation of where this book came from. Because the author seems to know everything about everything.`,

  'no-contradictions': `Consider what we've just seen. Now consider this. The Quran was revealed over 23 years. In bits and pieces, across different situations. In rhyming Arabic of the highest eloquence. Covering laws, morals, science, history, prophecy, and the unseen. And nothing, absolutely nothing, has contradicted itself. No ruling contradicts another ruling. No scientific description has been proven wrong. No prophecy has failed. Over 1400 years of scrutiny. What's the probability of human beings compiling this information, perfectly, in one book, one time, not messing anything up?`,

  'one-book': `When you find a book that makes a claim, the first thing you check is: is it authentic? Are there other versions? Has it been changed? Is there any copy that says something different? There is one Quran. Every copy on earth is identical. 1400 years. One version. And the very first thing this book says to you, the opening of the second chapter: "This is the Book about which there is no doubt, a guidance for those who are mindful of God." It opens by telling you: there's no doubt in this. It's the manual for mankind.`,

  'prove-it': `So what do we say back? "You claim to be my Creator? Prove it. Show me. Give me evidence." I need to be able to cross-check things. I need to see what's what. That's all I'm asking, proof. And that's exactly what we just did. We examined what the Quran says about the human body, confirmed by modern science. We examined what it says about the universe, confirmed by modern science. We examined what it says about the natural world, confirmed by modern science. Zero contradictions over 1400 years, confirmed. One version, unchanged, confirmed. Now it's your turn to deliver the verdict. Based on what you've seen, where do you think this book came from?`,
};

async function generateAudio(text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (response.status === 429) {
    // Rate limited — wait and retry
    console.log('Rate limited, waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return generateAudio(text, voiceId, apiKey);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${errorText}`);
  }

  return response.arrayBuffer();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not set');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request — optionally generate only specific scenes
    let scenesToGenerate: string[] = Object.keys(SCENE_NARRATIONS);
    try {
      const body = await req.json();
      if (body.scenes && Array.isArray(body.scenes)) {
        scenesToGenerate = body.scenes.filter((s: string) => SCENE_NARRATIONS[s]);
      }
    } catch {
      // No body = generate all
    }

    const results: Record<string, { status: string; url?: string; error?: string }> = {};

    for (const sceneId of scenesToGenerate) {
      const text = SCENE_NARRATIONS[sceneId];
      const filename = `${sceneId}.mp3`;

      try {
        // Check if already exists
        const { data: existing } = await supabase.storage
          .from('explore-audio')
          .list('', { search: filename });

        if (existing && existing.some(f => f.name === filename)) {
          console.log(`${sceneId}: already exists, skipping`);
          const { data: urlData } = supabase.storage
            .from('explore-audio')
            .getPublicUrl(filename);
          results[sceneId] = { status: 'exists', url: urlData.publicUrl };
          continue;
        }

        console.log(`${sceneId}: generating audio (${text.length} chars)...`);

        // Generate audio
        const audioBuffer = await generateAudio(text, VOICE_ID, ELEVENLABS_API_KEY);
        console.log(`${sceneId}: got ${audioBuffer.byteLength} bytes`);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('explore-audio')
          .upload(filename, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('explore-audio')
          .getPublicUrl(filename);

        results[sceneId] = { status: 'generated', url: urlData.publicUrl };
        console.log(`${sceneId}: uploaded successfully`);

        // Small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (err: any) {
        console.error(`${sceneId}: error — ${err.message}`);
        results[sceneId] = { status: 'error', error: err.message };
      }
    }

    return new Response(
      JSON.stringify({ results, total: scenesToGenerate.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
