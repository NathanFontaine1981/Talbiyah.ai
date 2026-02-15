// Wudu (Ablution) Data - Shafi'i Madhab

export interface WuduStep {
  id: string;
  order: number;
  title: string;
  arabicTitle: string;
  transliteration: string;
  description: string;
  detailedDescription: string;
  timesToRepeat?: number;
  dua?: {
    arabic: string;
    transliteration: string;
    translation: string;
    reference?: string;
  };
  tips: string[];
  icon: string;
}

export interface WuduInvalidator {
  id: string;
  title: string;
  description: string;
  icon: string;
  reference?: string;
}

// =============================================================================
// WUDU STEPS (Shafi'i Madhab)
// =============================================================================

export const wuduSteps: WuduStep[] = [
  {
    id: 'niyyah',
    order: 1,
    title: 'Intention (Niyyah)',
    arabicTitle: 'النية',
    transliteration: 'An-Niyyah',
    description: 'Make the intention in your heart to perform wudu for the sake of Allah.',
    detailedDescription:
      'The intention is made in the heart at the moment you begin washing. In the Shafi\'i madhab, the niyyah is a pillar (rukn) of wudu - without it, the wudu is invalid. You do not need to say it out loud; sincerely intending in your heart is sufficient.',
    tips: [
      'The intention must coincide with the first act of washing (the face)',
      'You do not need to speak the intention out loud',
      'Simply intend: "I am performing wudu to worship Allah"',
    ],
    icon: '💭',
  },
  {
    id: 'bismillah',
    order: 2,
    title: 'Say Bismillah',
    arabicTitle: 'بسم الله',
    transliteration: 'Bismillah',
    description: 'Begin by saying "Bismillah" (In the name of Allah).',
    detailedDescription:
      'Saying Bismillah at the start of wudu is a recommended sunnah. It reminds you that even this simple act of washing is done for Allah\'s sake and with His blessing.',
    dua: {
      arabic: 'بِسْمِ اللهِ',
      transliteration: 'Bismillah',
      translation: 'In the name of Allah',
      reference: 'Sunan Abu Dawud 101, Sunan Ibn Majah 397',
    },
    tips: [
      'Say it before you begin any washing',
      'If you forget, you can say it when you remember',
    ],
    icon: '🤲',
  },
  {
    id: 'wash-hands',
    order: 3,
    title: 'Wash the Hands',
    arabicTitle: 'غسل اليدين',
    transliteration: 'Ghasl al-Yadayn',
    description: 'Wash both hands up to the wrists three times.',
    detailedDescription:
      'Begin by washing your hands up to the wrists. Make sure water reaches between the fingers and under any rings. Start with the right hand, then the left. This is a sunnah that cleanses your hands before you use them to wash the rest of your body.',
    timesToRepeat: 3,
    tips: [
      'Interlace your fingers to ensure water reaches between them',
      'Remove rings so water reaches the skin underneath',
      'Start with the right hand each time',
    ],
    icon: '🖐️',
  },
  {
    id: 'rinse-mouth',
    order: 4,
    title: 'Rinse the Mouth',
    arabicTitle: 'المضمضة',
    transliteration: 'Al-Madmadah',
    description: 'Take water into the mouth, swirl it around, and spit it out. Repeat three times.',
    detailedDescription:
      'Take a handful of water with your right hand, put it into your mouth, swirl it around thoroughly to cleanse the inside of your mouth, then spit it out. This is a sunnah act that purifies the mouth before you stand in prayer reciting Quran.',
    timesToRepeat: 3,
    tips: [
      'Swirl the water around your entire mouth',
      'Use a miswak or toothbrush before wudu for extra reward',
      'If fasting, be gentle and avoid swallowing water',
    ],
    icon: '💧',
  },
  {
    id: 'sniff-nose',
    order: 5,
    title: 'Sniff Water into the Nose',
    arabicTitle: 'الاستنشاق والاستنثار',
    transliteration: 'Al-Istinshaq wal-Istinthar',
    description: 'Sniff water gently into the nostrils and blow it out. Repeat three times.',
    detailedDescription:
      'Take water with your right hand, sniff it gently into your nostrils (istinshaq), then blow it out with your left hand (istinthar). This cleanses the nasal passages. Be gentle - you do not need to draw water deep into your nose.',
    timesToRepeat: 3,
    tips: [
      'Use your right hand to sniff water in',
      'Use your left hand to blow it out',
      'Be gentle - do not force water too far up',
      'If fasting, be extra gentle to avoid swallowing water',
    ],
    icon: '👃',
  },
  {
    id: 'wash-face',
    order: 6,
    title: 'Wash the Face',
    arabicTitle: 'غسل الوجه',
    transliteration: 'Ghasl al-Wajh',
    description: 'Wash the entire face from the hairline to the chin, and from ear to ear. Three times.',
    detailedDescription:
      'This is the first obligatory (fard) act of wudu. The face extends from the normal hairline to the bottom of the chin vertically, and from ear to ear horizontally. Make sure water covers every part of this area. If you have a beard, run your wet fingers through it.',
    timesToRepeat: 3,
    tips: [
      'Ensure water reaches the hairline, temples, and under the chin',
      'If you have a thick beard, run wet fingers through it (takhlil)',
      'This is a pillar (rukn) of wudu - it cannot be skipped',
    ],
    icon: '😊',
  },
  {
    id: 'wash-arms',
    order: 7,
    title: 'Wash the Arms',
    arabicTitle: 'غسل اليدين إلى المرفقين',
    transliteration: "Ghasl al-Yadayn ila al-Mirfaqayn",
    description: 'Wash both arms from the fingertips to the elbows, including the elbows. Three times.',
    detailedDescription:
      'This is the second obligatory act. Wash from the fingertips all the way to and including the elbows. Start with the right arm, then the left. Ensure water covers every part of the forearm and the elbow joint itself.',
    timesToRepeat: 3,
    tips: [
      'Always start with the right arm before the left',
      'Include the elbows - they are part of the washed area',
      'Make sure water reaches every part, including between fingers',
      'Roll up sleeves high enough so they do not block the elbows',
    ],
    icon: '💪',
  },
  {
    id: 'wipe-head',
    order: 8,
    title: 'Wipe the Head',
    arabicTitle: 'مسح الرأس',
    transliteration: 'Mash ar-Ra\'s',
    description: 'Wipe over the head with wet hands, from the front to the back and back to the front.',
    detailedDescription:
      'This is the third obligatory act. Wet your hands, then wipe from the front of your head (hairline) to the back, then bring your hands back to the front. In the Shafi\'i madhab, wiping even a small part of the head is sufficient, but wiping the entire head is the sunnah.',
    tips: [
      'Use fresh water for wiping (not the water left from washing arms)',
      'The Shafi\'i madhab requires wiping at least part of the head',
      'Wiping the entire head from front to back and back is the sunnah',
      'This is done only once, not three times',
    ],
    icon: '🧕',
  },
  {
    id: 'wipe-ears',
    order: 9,
    title: 'Wipe the Ears',
    arabicTitle: 'مسح الأذنين',
    transliteration: 'Mash al-Udhnayn',
    description: 'Wipe the inside and outside of both ears with wet fingers.',
    detailedDescription:
      'After wiping the head, use your index fingers to wipe the inside of the ears and your thumbs to wipe behind the ears. This is a sunnah act. Use the same water from wiping the head or take fresh water.',
    tips: [
      'Insert index fingers into the ear openings and wipe the inner folds',
      'Use thumbs to wipe behind the ears',
      'This is done once, not three times',
    ],
    icon: '👂',
  },
  {
    id: 'wash-feet',
    order: 10,
    title: 'Wash the Feet',
    arabicTitle: 'غسل القدمين',
    transliteration: 'Ghasl al-Qadamayn',
    description: 'Wash both feet up to and including the ankles. Three times.',
    detailedDescription:
      'This is the fourth obligatory act. Wash from the toes to and including the ankle bones. Make sure water reaches between the toes and covers the entire foot including the heels and ankle bones. Start with the right foot, then the left.',
    timesToRepeat: 3,
    tips: [
      'Start with the right foot',
      'Use your little finger to wash between the toes',
      'Ensure water reaches the heels and ankle bones',
      'The ankle bones must be included in the washing',
    ],
    icon: '🦶',
  },
];

// =============================================================================
// DUA AFTER WUDU
// =============================================================================

export const duaAfterWudu = {
  arabic:
    'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
  transliteration:
    "Ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh. Allahumma-j'alni minat-tawwabeena waj'alni minal-mutatahhireen",
  translation:
    'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His servant and Messenger. O Allah, make me among those who repent and make me among those who purify themselves.',
  reference: 'Sahih Muslim 234, Sunan at-Tirmidhi 55',
};

// =============================================================================
// WUDU INVALIDATORS (Shafi'i Madhab)
// =============================================================================

export const wuduInvalidators: WuduInvalidator[] = [
  {
    id: 'exit-private-parts',
    title: 'Anything exiting the private parts',
    description:
      'Any substance that exits from the front or back passages invalidates wudu. This includes urine, stool, gas (passing wind), and any other discharge.',
    icon: '🚫',
    reference: "Quran 4:43, Sahih al-Bukhari 135",
  },
  {
    id: 'deep-sleep',
    title: 'Deep sleep',
    description:
      'Sleep that causes you to lose awareness of your surroundings invalidates wudu. Light dozing while firmly seated does not break wudu in the Shafi\'i madhab, but deep sleep in any position does.',
    icon: '😴',
    reference: 'Sunan Abu Dawud 203, Sunan at-Tirmidhi 96',
  },
  {
    id: 'loss-of-consciousness',
    title: 'Loss of consciousness',
    description:
      'Fainting, being under anesthesia, intoxication, or any state where you lose control of your awareness invalidates wudu.',
    icon: '💫',
    reference: 'Scholarly consensus (ijma\')',
  },
  {
    id: 'touching-private-parts',
    title: 'Touching private parts with the palm',
    description:
      'In the Shafi\'i madhab, touching your own private parts (front or back) directly with the inner surface of the hand or fingers (without a barrier) invalidates wudu.',
    icon: '✋',
    reference: 'Sunan Abu Dawud 181, Sunan an-Nasa\'i 163',
  },
  {
    id: 'skin-contact',
    title: 'Skin-to-skin contact with non-mahram opposite gender',
    description:
      'In the Shafi\'i madhab, direct skin contact between a man and a marriageable (non-mahram) woman invalidates the wudu of both. This does not apply to mahram relatives (parents, siblings, children, etc.).',
    icon: '🤝',
    reference: 'Quran 4:43 (interpretation of "lamastum")',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getWuduStepsByOrder = (): WuduStep[] => {
  return [...wuduSteps].sort((a, b) => a.order - b.order);
};

export const getWuduStepById = (id: string): WuduStep | undefined => {
  return wuduSteps.find((s) => s.id === id);
};
