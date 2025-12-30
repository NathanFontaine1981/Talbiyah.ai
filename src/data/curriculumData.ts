// Master Content Manifest - The Full Brain Dump
// Curriculum for New Muslim / Explore sections

export interface CurriculumModule {
  id: string;
  moduleNumber: number;
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
  thumbnailType: 'space' | 'money' | 'stadium' | 'prayer' | 'nature' | 'scales';
  readTime: number; // minutes
  isLocked: boolean;
  content: string;
  keyPoints: string[];
}

export const curriculumModules: CurriculumModule[] = [
  {
    id: 'origin',
    moduleNumber: 0,
    title: 'The Origin Story',
    subtitle: 'The Pre-History',
    description: 'Before humans existed, there was a conversation. Before you were born, you made a promise.',
    videoUrl: '',
    thumbnailType: 'space',
    readTime: 8,
    isLocked: false,
    content: `
      The story begins before Earth, before humans, before time as we know it.

      **The 3 Creations**
      God created beings in stages:
      - **Angels** - Made from light. Pure obedience. No free will to disobey.
      - **Jinn** - Made from smokeless fire. Free will. Some obey, some rebel.
      - **Humans** - Made from clay. Free will. The final creation.

      **The Angelic Question**
      When God announced He would create humans, the angels asked:
      "Why create a being that will shed blood and cause corruption?"
      God's response: "I know what you do not know."

      **The First Sneeze**
      Adam's very first action after being created was a sneeze.
      Instinctively, he said "Alhamdulillah" (All praise to God).
      This reveals something profound: **Gratitude is our default setting.**

      **The Covenant (Day of Alast)**
      Before any soul entered a body, before any of us were born, God gathered all souls and asked:
      "Am I not your Lord?"
      Every soul replied: "Yes, we testify."

      This means you've already met your Creator. You've already acknowledged Him.
      This life is just a test to see if you remember that promise.
    `,
    keyPoints: [
      'Angels (Light), Jinn (Fire), Humans (Clay) - 3 creations',
      'Angels questioned human creation - God said "I know what you do not know"',
      'Adam\'s first action was gratitude (sneeze → Alhamdulillah)',
      'Before birth, every soul testified to God\'s lordship (Day of Alast)',
    ],
  },
  {
    id: 'worship',
    moduleNumber: 1,
    title: 'Redefining Worship',
    subtitle: 'The Definition',
    description: 'Worship isn\'t just prayer. It\'s whatever you prioritise most.',
    videoUrl: '',
    thumbnailType: 'money',
    readTime: 6,
    isLocked: false,
    content: `
      **The "God" Concept**

      Here's a question that might surprise you:
      What do you think about first thing in the morning?
      What do you sacrifice your time, energy, and relationships for?
      What would you never give up, no matter what?

      Whatever that is - that's what you worship.

      For some, it's money. For others, it's their career, their image, their family, their house.
      None of these are bad things. But when they become the *ultimate* priority, they become your god.

      **The Trade**

      Islam doesn't ask you to abandon the world. It asks you to reorder your priorities.

      You can have money, family, success - but if you prioritise the Creator above all,
      you get the best of this world AND the next.

      If you prioritise the world above the Creator, you might get the world...
      but you lose what comes after.

      **The Purpose**

      This life is not the destination. It's the testing ground.

      Every challenge, every blessing, every moment of ease and hardship -
      it's all a test to see what you prioritise when it matters most.
    `,
    keyPoints: [
      'Whatever you prioritise most IS what you worship',
      'Money, career, family can become "gods" if they\'re ultimate priorities',
      'Islam = reordering priorities, not abandoning the world',
      'Life is a testing ground, not the final destination',
    ],
  },
  {
    id: 'fear',
    moduleNumber: 2,
    title: 'The Fear of the Unknown',
    subtitle: 'The Barrier',
    description: 'Two stories about how fear kept me from something life-changing.',
    videoUrl: '',
    thumbnailType: 'stadium',
    readTime: 7,
    isLocked: false,
    content: `
      **The Bristol Rovers Story**

      I was 17 years old when I got the call to join Bristol Rovers.

      I was terrified. Moving to a new city. Leaving everything I knew.
      What if I failed? What if I didn't fit in? What if it was a mistake?

      I almost didn't go.

      But I went. And within weeks, I realised all that fear was for nothing.
      The city was fine. The people were welcoming. I'd built it up in my head.

      **The Mosque Story**

      For 2 years, I was curious about Islam but terrified to enter a mosque.

      What would people think? Would they know I didn't belong?
      Would they judge me? Would it be awkward?

      I drove past the mosque countless times. Never went in.

      Then one day, my teammate Diomansy Kamara took me.
      He just said "Come with me" and walked me through the door.

      What did I find inside?

      People smiling. People hugging. People welcoming a stranger.
      That's it. That was the "scary" mosque.

      **The Lesson**

      You cannot judge something from the outside.
      You cannot understand a way of life by looking through the window.

      The fear is almost always bigger than the reality.
    `,
    keyPoints: [
      'Fear of the unknown almost stopped me joining Bristol Rovers at 17',
      'Fear of the mosque kept me away for 2 years',
      'Diomansy Kamara walked me through the door - it was just smiling people',
      'You can\'t judge a way of life from the outside',
    ],
  },
  {
    id: 'protocol',
    moduleNumber: 3,
    title: 'The Protocol',
    subtitle: 'Al-Fatiha Logic',
    description: 'Why ask the middleman when you can ask the Owner directly?',
    videoUrl: '',
    thumbnailType: 'prayer',
    readTime: 8,
    isLocked: false,
    content: `
      **The Owner vs The Agent**

      Imagine you need something important. You have two options:

      Option A: Ask the agent, the middleman, the representative.
      Option B: Ask the Owner directly.

      Why would you ever choose Option A?

      In Islam, there are no middlemen. No priests required. No confession booth.
      You speak directly to the Creator of the universe.

      **The Mercy**

      Al-Fatiha (the opening chapter of the Quran) begins with:
      "In the name of God, the Most Merciful, the Especially Merciful."

      Two types of mercy:
      - **Ar-Rahman** (Most Merciful): General mercy for ALL creation
      - **Ar-Raheem** (Especially Merciful): Special mercy for those who connect with Him

      The sun shines on everyone. That's Ar-Rahman.
      But there's a special warmth for those who turn towards it. That's Ar-Raheem.

      **The Straight Path**

      In every prayer, Muslims ask for "the straight path."

      Not the path of those who earned anger (knew the truth, rejected it out of arrogance).
      Not the path of those who went astray (changed the rules, worshipped the messenger instead of the message).

      The straight path: Direct connection to the Source.
    `,
    keyPoints: [
      'No middlemen in Islam - speak directly to the Creator',
      'Two mercies: General (for all) and Special (for those who connect)',
      'Al-Fatiha is recited in every prayer - the protocol of connection',
      'The straight path avoids those who rejected truth or changed the message',
    ],
  },
  {
    id: 'wayoflife',
    moduleNumber: 4,
    title: 'Way of Life',
    subtitle: 'The Routine',
    description: 'Everyone has a religion. Yours might just be called something else.',
    videoUrl: '',
    thumbnailType: 'nature',
    readTime: 7,
    isLocked: false,
    content: `
      **The "Religion" Swap**

      You already have a religion. You just don't call it that.

      Think about it:
      - You have house rules (your family's "shariah")
      - You have a gym routine (your physical "prayer")
      - You have a diet (your nutritional "halal and haram")
      - You have values you won't compromise on (your "faith")

      Everyone lives by a code. The question is: who wrote your code?

      Did you write it yourself? Did society write it? Did your parents?
      Or did the One who created you provide a manual?

      **The Universal Submission**

      Here's something that might blow your mind:

      The sun is "Muslim."
      The trees are "Muslim."
      The atoms in your body are "Muslim."

      Wait, what?

      "Muslim" literally means "one who submits."

      The sun submits to the laws of physics - it doesn't choose to rebel.
      Trees submit to their nature - they don't decide to stop photosynthesising.
      Atoms follow their programming perfectly.

      Everything in the universe submits to the laws the Creator set for it.

      Except humans.

      We're the only creation given the choice to sync up or rebel.
      Islam is choosing to align with the same Source everything else obeys.

      **The Manual**

      The Quran covers everything:
      - Astronomy and embryology
      - Inheritance laws and marriage contracts
      - Business ethics and personal hygiene
      - Psychology and spirituality

      It's the manufacturer's manual for the human being.
    `,
    keyPoints: [
      'Everyone has a "religion" - routines, rules, values they live by',
      'The question is: who wrote your code?',
      'Everything in nature is "Muslim" (submitting to natural laws)',
      'Humans are unique - we must CHOOSE to submit',
      'The Quran is the manufacturer\'s manual for human beings',
    ],
  },
  {
    id: 'verdict',
    moduleNumber: 5,
    title: 'The Verdict',
    subtitle: 'The 3 Outcomes',
    description: 'On the Day of Judgement, humanity falls into three categories.',
    videoUrl: '',
    thumbnailType: 'scales',
    readTime: 6,
    isLocked: false,
    content: `
      **The Day of Accountability**

      Every soul will stand before the Creator.
      Every action recorded. Every intention known.
      No lawyers. No excuses. Just truth.

      Humanity will fall into three categories:

      **1. The Unaware**

      Those who genuinely never knew.
      The message never reached them clearly.
      They lived in a time or place where Islam was distorted or absent.

      God is the Most Just. He will not punish those who never had a fair chance to know.

      **2. The Rejectors**

      Those who saw the truth clearly.
      The evidence was undeniable - scientific, logical, spiritual.
      They understood. They knew.

      But they said "No."

      Why? Arrogance. Pride. Not wanting to change.
      Not wanting to admit they were wrong.
      Not wanting to submit.

      This is the dangerous category.

      **3. The Strivers**

      Those who believed.
      Those who tried.
      Those who failed.
      Those who asked for forgiveness.
      Those who got back up and tried again.

      Notice: perfection is not required.

      The successful ones aren't the perfect ones.
      They're the ones who kept trying, kept repenting, kept striving.

      **The Question**

      Which category will you be in?

      The Unaware? After seeing all this evidence, that's no longer an option.
      The Rejectors? That's a choice you can make, but consider the cost.
      The Strivers? This is the door that's open to you right now.
    `,
    keyPoints: [
      'The Unaware - never received the message clearly (God is Just)',
      'The Rejectors - saw the truth, said "No" out of arrogance',
      'The Strivers - believed, tried, failed, repented, kept going',
      'Perfection isn\'t required - persistence is',
      'After seeing the evidence, "unaware" is no longer an option',
    ],
  },
];

// Helper functions
export const getModuleById = (id: string): CurriculumModule | undefined => {
  return curriculumModules.find(m => m.id === id);
};

export const getNextModule = (currentId: string): CurriculumModule | undefined => {
  const currentIndex = curriculumModules.findIndex(m => m.id === currentId);
  if (currentIndex >= 0 && currentIndex < curriculumModules.length - 1) {
    return curriculumModules[currentIndex + 1];
  }
  return undefined;
};

export const getPreviousModule = (currentId: string): CurriculumModule | undefined => {
  const currentIndex = curriculumModules.findIndex(m => m.id === currentId);
  if (currentIndex > 0) {
    return curriculumModules[currentIndex - 1];
  }
  return undefined;
};

export default curriculumModules;
