/**
 * Dua Blocks Data & Types
 * Building blocks for the modular dua composer based on classical Islamic dua architecture
 */

export type DuaBlockType = 'hamd' | 'salawat' | 'admission' | 'request' | 'others' | 'closing';

export interface DuaBlock {
  id: string;
  block_type: DuaBlockType;
  category_id: string | null;
  arabic_text: string;
  transliteration: string;
  english_translation: string;
  source: string | null;
  allah_names: string[] | null;
  is_core: boolean;
  display_order: number;
}

export interface UserDuaComposition {
  id: string;
  user_id: string;
  title: string | null;
  hamd_block_id: string | null;
  salawat_block_id: string | null;
  admission_block_id: string | null;
  request_block_ids: string[];
  others_block_id: string | null;
  closing_block_id: string | null;
  custom_text: string | null;
  category_id: string | null;
  is_favorite: boolean;
  audio_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DuaBlockSet {
  id: string;
  name: string;
  name_arabic: string | null;
  category_id: string | null;
  description: string | null;
  hamd_block_id: string | null;
  salawat_block_id: string | null;
  admission_block_id: string | null;
  request_block_ids: string[];
  others_block_id: string | null;
  closing_block_id: string | null;
  is_featured: boolean;
  display_order: number;
}

export interface CustomBlockText {
  text: string;
  transliteration?: string;
}

export interface ComposedDua {
  hamdBlock: DuaBlock | null;
  salawatBlock: DuaBlock | null;
  admissionBlock: DuaBlock | null;
  requestBlocks: DuaBlock[];
  othersBlock: DuaBlock | null;
  closingBlock: DuaBlock | null;
  customText: string;
  // Custom text for each block type (alternative to selecting a pre-built block)
  customHamd?: CustomBlockText;
  customSalawat?: CustomBlockText;
  customAdmission?: CustomBlockText;
  customRequest?: CustomBlockText;
  customOthers?: CustomBlockText;
  customClosing?: CustomBlockText;
}

// Block type display information
export const BLOCK_TYPE_INFO: Record<DuaBlockType, {
  name: string;
  nameArabic: string;
  description: string;
  icon: string;
  step: number;
}> = {
  hamd: {
    name: 'Praise (Hamd)',
    nameArabic: 'الحمد',
    description: 'Begin by praising Allah with His beautiful Names and attributes',
    icon: '1',
    step: 1
  },
  salawat: {
    name: 'Blessings (Salawat)',
    nameArabic: 'الصلوات',
    description: 'Send blessings upon the Prophet Muhammad (peace be upon him)',
    icon: '2',
    step: 2
  },
  admission: {
    name: 'Admission',
    nameArabic: 'الاعتراف',
    description: 'Express humility and acknowledge your need for Allah',
    icon: '3',
    step: 3
  },
  request: {
    name: 'Request',
    nameArabic: 'الطلب',
    description: 'Make your supplication - the heart of your dua',
    icon: '4',
    step: 4
  },
  others: {
    name: 'For Others',
    nameArabic: 'للآخرين',
    description: 'Include prayers for parents, family, and the Ummah',
    icon: '5',
    step: 5
  },
  closing: {
    name: 'Closing',
    nameArabic: 'الختام',
    description: 'Close with salawat and trust in Allah',
    icon: '6',
    step: 6
  }
};

// Block type order for the stepper
export const BLOCK_TYPE_ORDER: DuaBlockType[] = [
  'hamd',
  'salawat',
  'admission',
  'request',
  'others',
  'closing'
];

// Helper to get full composed text
export function getComposedArabicText(composition: ComposedDua): string {
  const parts: string[] = [];

  if (composition.hamdBlock) {
    parts.push(composition.hamdBlock.arabic_text);
  } else if (composition.customHamd?.text) {
    parts.push(composition.customHamd.text);
  }
  if (composition.salawatBlock) {
    parts.push(composition.salawatBlock.arabic_text);
  } else if (composition.customSalawat?.text) {
    parts.push(composition.customSalawat.text);
  }
  if (composition.admissionBlock) {
    parts.push(composition.admissionBlock.arabic_text);
  } else if (composition.customAdmission?.text) {
    parts.push(composition.customAdmission.text);
  }
  composition.requestBlocks.forEach(block => {
    parts.push(block.arabic_text);
  });
  if (composition.customRequest?.text) {
    parts.push(composition.customRequest.text);
  }
  if (composition.customText) {
    parts.push(composition.customText);
  }
  if (composition.othersBlock) {
    parts.push(composition.othersBlock.arabic_text);
  } else if (composition.customOthers?.text) {
    parts.push(composition.customOthers.text);
  }
  if (composition.closingBlock) {
    parts.push(composition.closingBlock.arabic_text);
  } else if (composition.customClosing?.text) {
    parts.push(composition.customClosing.text);
  }

  return parts.join('\n\n');
}

export function getComposedTransliteration(composition: ComposedDua): string {
  const parts: string[] = [];

  if (composition.hamdBlock) {
    parts.push(composition.hamdBlock.transliteration);
  } else if (composition.customHamd?.transliteration) {
    parts.push(composition.customHamd.transliteration);
  }
  if (composition.salawatBlock) {
    parts.push(composition.salawatBlock.transliteration);
  } else if (composition.customSalawat?.transliteration) {
    parts.push(composition.customSalawat.transliteration);
  }
  if (composition.admissionBlock) {
    parts.push(composition.admissionBlock.transliteration);
  } else if (composition.customAdmission?.transliteration) {
    parts.push(composition.customAdmission.transliteration);
  }
  composition.requestBlocks.forEach(block => {
    parts.push(block.transliteration);
  });
  if (composition.customRequest?.transliteration) {
    parts.push(composition.customRequest.transliteration);
  }
  if (composition.othersBlock) {
    parts.push(composition.othersBlock.transliteration);
  } else if (composition.customOthers?.transliteration) {
    parts.push(composition.customOthers.transliteration);
  }
  if (composition.closingBlock) {
    parts.push(composition.closingBlock.transliteration);
  } else if (composition.customClosing?.transliteration) {
    parts.push(composition.customClosing.transliteration);
  }

  return parts.join('\n\n');
}

export function getComposedEnglish(composition: ComposedDua): string {
  const parts: string[] = [];

  if (composition.hamdBlock) {
    parts.push(composition.hamdBlock.english_translation);
  } else if (composition.customHamd?.text) {
    parts.push(composition.customHamd.text);
  }
  if (composition.salawatBlock) {
    parts.push(composition.salawatBlock.english_translation);
  } else if (composition.customSalawat?.text) {
    parts.push(composition.customSalawat.text);
  }
  if (composition.admissionBlock) {
    parts.push(composition.admissionBlock.english_translation);
  } else if (composition.customAdmission?.text) {
    parts.push(composition.customAdmission.text);
  }
  composition.requestBlocks.forEach(block => {
    parts.push(block.english_translation);
  });
  if (composition.customRequest?.text) {
    parts.push(composition.customRequest.text);
  }
  if (composition.customText) {
    parts.push(composition.customText);
  }
  if (composition.othersBlock) {
    parts.push(composition.othersBlock.english_translation);
  } else if (composition.customOthers?.text) {
    parts.push(composition.customOthers.text);
  }
  if (composition.closingBlock) {
    parts.push(composition.closingBlock.english_translation);
  } else if (composition.customClosing?.text) {
    parts.push(composition.customClosing.text);
  }

  return parts.join('\n\n');
}

// Get all Names of Allah used in the composition
export function getComposedNames(composition: ComposedDua): string[] {
  const names = new Set<string>();

  const addNames = (block: DuaBlock | null) => {
    if (block?.allah_names) {
      block.allah_names.forEach(name => names.add(name));
    }
  };

  addNames(composition.hamdBlock);
  addNames(composition.salawatBlock);
  addNames(composition.admissionBlock);
  composition.requestBlocks.forEach(addNames);
  addNames(composition.othersBlock);
  addNames(composition.closingBlock);

  return Array.from(names);
}

// Check if composition is complete (has all required blocks or custom text)
export function isCompositionComplete(composition: ComposedDua): boolean {
  const hasHamd = composition.hamdBlock || composition.customHamd?.text;
  const hasSalawat = composition.salawatBlock || composition.customSalawat?.text;
  const hasAdmission = composition.admissionBlock || composition.customAdmission?.text;
  const hasRequest = composition.requestBlocks.length > 0 || composition.customRequest?.text || composition.customText;
  const hasOthers = composition.othersBlock || composition.customOthers?.text;
  const hasClosing = composition.closingBlock || composition.customClosing?.text;

  return !!(hasHamd && hasSalawat && hasAdmission && hasRequest && hasOthers && hasClosing);
}

// Get completion percentage
export function getCompositionProgress(composition: ComposedDua): number {
  let completed = 0;
  const total = 6;

  if (composition.hamdBlock || composition.customHamd?.text) completed++;
  if (composition.salawatBlock || composition.customSalawat?.text) completed++;
  if (composition.admissionBlock || composition.customAdmission?.text) completed++;
  if (composition.requestBlocks.length > 0 || composition.customRequest?.text || composition.customText) completed++;
  if (composition.othersBlock || composition.customOthers?.text) completed++;
  if (composition.closingBlock || composition.customClosing?.text) completed++;

  return Math.round((completed / total) * 100);
}

// Educational content for Learn tab
export interface DuaEducationTopic {
  id: string;
  title: string;
  titleArabic: string;
  content: string;
  blockType?: DuaBlockType;
  hadithReference?: string;
}

export const DUA_EDUCATION_TOPICS: DuaEducationTopic[] = [
  {
    id: 'structure',
    title: 'The Structure of Dua',
    titleArabic: 'هيكل الدعاء',
    content: `The scholars of Islam have identified a beautiful structure for making dua that follows the Sunnah of the Prophet (peace be upon him) and the practice of the righteous predecessors.

This structure consists of six parts:
1. **Hamd (Praise)** - Begin by praising Allah
2. **Salawat** - Send blessings upon the Prophet
3. **Admission** - Express humility and acknowledge your weakness
4. **Request** - Make your actual supplication
5. **For Others** - Include your parents, family, and the Ummah
6. **Closing** - End with salawat and trust in Allah

This structure is not obligatory, but following it increases the chances of acceptance and teaches us proper adab (etiquette) with Allah.`,
  },
  {
    id: 'hamd-importance',
    title: 'Why We Begin with Praise',
    titleArabic: 'لماذا نبدأ بالحمد',
    content: `The Prophet (peace be upon him) said: "When one of you prays, let him begin with praise of Allah, then let him send blessings upon the Prophet, then let him ask for whatever he wishes." (Tirmidhi)

Beginning with praise (Hamd) acknowledges Allah's majesty and our place as His servants. It reminds us that everything we have is from Him, and that He alone deserves all praise.

The Quran itself begins with "Al-hamdu lillahi Rabbil 'alamin" - showing us the importance of starting with praise.`,
    blockType: 'hamd',
    hadithReference: 'Tirmidhi'
  },
  {
    id: 'salawat-importance',
    title: 'The Power of Salawat',
    titleArabic: 'قوة الصلاة على النبي',
    content: `The Prophet (peace be upon him) said: "Every dua is suspended until blessings are sent upon the Prophet." (Tabarani)

Sending salawat upon the Prophet is one of the most beloved deeds to Allah. It connects our dua to the best of creation and serves as a means of drawing closer to Allah.

Umar ibn al-Khattab said: "Dua remains between heaven and earth and does not rise until you send blessings upon your Prophet."`,
    blockType: 'salawat',
    hadithReference: 'Tabarani'
  },
  {
    id: 'admission-importance',
    title: 'Humility Before Allah',
    titleArabic: 'التواضع أمام الله',
    content: `Expressing our weakness and need before Allah is essential. Allah says: "And your Lord says, 'Call upon Me; I will respond to you.'" (Quran 40:60)

The Prophet Yunus (peace be upon him), when he was in the belly of the whale, called out with complete humility: "There is no god but You, glory be to You, indeed I have been among the wrongdoers."

This admission of our shortcomings opens the doors of mercy and shows Allah that we understand our place as His servants.`,
    blockType: 'admission'
  },
  {
    id: 'request-tips',
    title: 'Making Your Request',
    titleArabic: 'تقديم طلبك',
    content: `When making your request to Allah:

1. **Be specific** - Allah knows what you need, but asking specifically shows your reliance on Him
2. **Be hopeful** - The Prophet said: "None of you should say, 'O Allah, forgive me if You will.' Rather, let him be firm in asking."
3. **Repeat** - Repetition shows persistence and sincerity
4. **Use Allah's Names** - Call upon Allah by the Names most relevant to your request (e.g., Ar-Razzaq for provision, Ash-Shafi for healing)
5. **Be patient** - Allah answers in three ways: He gives you what you asked for, He gives you something better, or He saves the reward for the Hereafter`,
    blockType: 'request'
  },
  {
    id: 'others-importance',
    title: 'Praying for Others',
    titleArabic: 'الدعاء للآخرين',
    content: `The Prophet (peace be upon him) said: "The dua of a Muslim for his brother in his absence is answered. At his head there is an angel appointed, and whenever he makes dua for his brother with something good, the angel says: 'Amin, and for you the same.'" (Muslim)

Including others in your dua - especially your parents - is a sign of a believing heart. The Quran teaches us: "My Lord, have mercy upon them as they brought me up when I was small." (17:24)

Don't forget the Ummah: "O Allah, forgive the Muslim men and Muslim women."`,
    blockType: 'others',
    hadithReference: 'Sahih Muslim'
  },
  {
    id: 'best-times',
    title: 'Best Times for Dua',
    titleArabic: 'أفضل أوقات الدعاء',
    content: `Certain times are more likely for dua to be accepted:

1. **Last third of the night** - Allah descends to the lowest heaven and asks: "Who is calling upon Me that I may answer?"
2. **Between Adhan and Iqamah** - The Prophet said dua at this time is not rejected
3. **During prostration (Sujud)** - "The closest a servant is to his Lord is when he is prostrating"
4. **The last hour of Friday** - A special time of acceptance
5. **When it rains** - The Prophet said dua at this time is answered
6. **While fasting** - The fasting person's dua is not rejected
7. **When traveling** - The traveler's dua is answered`,
  },
  {
    id: 'etiquette',
    title: 'Etiquette of Dua',
    titleArabic: 'آداب الدعاء',
    content: `Follow these guidelines for proper dua etiquette:

1. **Face the Qiblah** if possible
2. **Raise your hands** - The Prophet raised his hands in dua
3. **Have wudu** - Being in a state of purity is preferred
4. **Lower your voice** - Allah says: "Call upon your Lord in humility and privately" (7:55)
5. **Have certainty** - Be certain that Allah hears and will respond
6. **Don't be hasty** - Don't say "I made dua but it wasn't answered"
7. **Eat halal** - The Prophet mentioned that earning haram prevents dua from being accepted
8. **Be persistent** - Keep making dua and don't give up`,
  }
];
