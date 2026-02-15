// Common Salah Mistakes Data

export type MistakeCategory = 'position' | 'focus' | 'invalidator' | 'general';
export type MistakeSeverity = 'invalidates' | 'major' | 'minor';

export interface SalahMistake {
  id: string;
  title: string;
  category: MistakeCategory;
  icon: string;
  mistakeDescription: string;
  correction: string;
  severity: MistakeSeverity;
  reference?: string;
  tips?: string[];
}

// =============================================================================
// COMMON SALAH MISTAKES
// =============================================================================

export const salahMistakes: SalahMistake[] = [
  {
    id: 'laughing',
    title: 'Laughing Out Loud',
    category: 'invalidator',
    icon: '😂',
    mistakeDescription:
      'Laughing audibly (with sound) during prayer completely invalidates the salah. Even a chuckle that produces sound breaks the prayer.',
    correction:
      'If you feel the urge to laugh, try to suppress it. If you laugh out loud, you must restart the prayer from the beginning. Smiling without sound does not invalidate the prayer, though it is still discouraged.',
    severity: 'invalidates',
    reference: 'Scholarly consensus based on hadith narrations',
    tips: [
      'Lower your gaze to the place of sujood to avoid visual distractions',
      'If something funny comes to mind, seek refuge in Allah from Shaytan',
      'Practice building focus (khushu) gradually',
    ],
  },
  {
    id: 'eating-drinking',
    title: 'Eating or Drinking',
    category: 'invalidator',
    icon: '🍽️',
    mistakeDescription:
      'Eating or drinking anything during prayer - even something small - completely invalidates the salah.',
    correction:
      'Finish all food and drink before starting prayer. If you accidentally swallow something (like saliva mixed with food remnants stuck between teeth), your prayer is still valid. But intentionally eating or drinking, even a sip of water, requires you to restart.',
    severity: 'invalidates',
    reference: 'Scholarly consensus (ijma\')',
    tips: [
      'Finish eating and drinking before the prayer time becomes tight',
      'Rinse your mouth well during wudu to remove food particles',
    ],
  },
  {
    id: 'forearms-flat-sujood',
    title: 'Forearms Flat on the Ground in Sujood',
    category: 'position',
    icon: '🐕',
    mistakeDescription:
      'Laying the forearms flat on the ground during sujood (prostration) resembles the posture of a dog and was specifically prohibited by the Prophet (peace be upon him).',
    correction:
      'Keep your elbows raised off the ground during sujood. Your palms should be flat on the ground beside your head or shoulders, but your forearms and elbows should be lifted. Leave space between your arms and your sides.',
    severity: 'major',
    reference: 'Sahih al-Bukhari 822, Sahih Muslim 493',
    tips: [
      'Place your palms flat on the ground at shoulder level',
      'Keep your elbows raised and away from the ground',
      'Leave a gap between your arms and your torso',
      'Your upper arms should not press against your sides',
    ],
  },
  {
    id: 'seven-body-parts',
    title: 'Not Prostrating on All 7 Body Parts',
    category: 'position',
    icon: '🦶',
    mistakeDescription:
      'The Prophet (peace be upon him) commanded prostration on seven body parts: the forehead (with the nose), both palms, both knees, and the toes of both feet. Many people neglect their toes or lift their nose.',
    correction:
      'Ensure all seven body parts touch the ground simultaneously during sujood: (1) forehead with nose, (2) right palm, (3) left palm, (4) right knee, (5) left knee, (6) right toes (bent toward Qibla), (7) left toes (bent toward Qibla).',
    severity: 'major',
    reference: 'Sahih al-Bukhari 812, Sahih Muslim 490',
    tips: [
      'Tuck your toes so they point toward the Qibla',
      'Make sure your nose touches the ground along with your forehead',
      'Keep both palms flat on the ground, not lifted',
    ],
  },
  {
    id: 'eyes-wandering',
    title: 'Eyes Wandering During Prayer',
    category: 'focus',
    icon: '👀',
    mistakeDescription:
      'Looking around, up at the ceiling, or at other people during prayer is strongly discouraged. The Prophet (peace be upon him) warned against raising the gaze to the sky during prayer.',
    correction:
      'Keep your eyes focused on the place of sujood (prostration) while standing and in ruku. During tashahhud, look at your index finger. This helps maintain focus and humility.',
    severity: 'minor',
    reference: 'Sahih al-Bukhari 750, Sahih Muslim 428',
    tips: [
      'Practice keeping your gaze at the spot where your forehead will touch the ground',
      'Pray facing a plain wall if possible to minimize distractions',
      'During tashahhud, focus on your index finger as you raise it',
    ],
  },
  {
    id: 'excessive-movement',
    title: 'Excessive Unnecessary Movement',
    category: 'general',
    icon: '🔄',
    mistakeDescription:
      'Fidgeting, adjusting clothes repeatedly, scratching, playing with a phone, or making continuous unnecessary movements during prayer. Three or more consecutive unnecessary movements can invalidate the prayer in the Shafi\'i madhab.',
    correction:
      'Stay as still as possible during prayer. Small, necessary movements (like adjusting a slipping garment once) are forgiven. But continuous or excessive movements show a lack of focus and can invalidate the prayer.',
    severity: 'major',
    reference: 'Based on principles from Sahih al-Bukhari 1217',
    tips: [
      'Put your phone on silent and away from reach before praying',
      'Adjust your clothes before starting prayer',
      'If you need to scratch, do it minimally and quickly',
      'Three consecutive unnecessary movements can invalidate the prayer',
    ],
  },
  {
    id: 'incorrect-hand-placement',
    title: 'Incorrect Hand Placement While Standing',
    category: 'position',
    icon: '🙏',
    mistakeDescription:
      'Leaving hands hanging at the sides, clasping them behind the back, or placing them too low (at the navel or below). Some people also interlock their fingers, which is discouraged.',
    correction:
      'In the Shafi\'i madhab, place your right hand over the left hand (or wrist/forearm) on the chest, below the chest or above the navel. This is the sunnah position that shows attentiveness and humility before Allah.',
    severity: 'minor',
    reference: 'Sahih Muslim 401, Sunan Abu Dawud 759',
    tips: [
      'Right hand over left hand or wrist',
      'Place them on the upper chest area',
      'Keep your hands relaxed, not gripping tightly',
    ],
  },
  {
    id: 'incorrect-sitting',
    title: 'Incorrect Sitting Position',
    category: 'position',
    icon: '🧘',
    mistakeDescription:
      'Sitting cross-legged, sitting on both feet flat, or not positioning the feet correctly during tashahhud. The sitting posture has a specific sunnah form.',
    correction:
      'For the sitting between two sujoods and the first tashahhud: sit on your left foot (laid flat) with the right foot upright and toes pointing toward the Qibla (iftirash). For the final tashahhud: sit with the left foot under the right shin and the right foot upright (tawarruk).',
    severity: 'minor',
    reference: 'Sahih al-Bukhari 828, Sahih Muslim 579',
    tips: [
      'Iftirash (regular sitting): left foot flat under you, right foot upright with toes toward Qibla',
      'Tawarruk (final sitting): left foot comes out to the right side, sit on the ground',
      'Practice the positions outside of prayer until they feel natural',
    ],
  },
  {
    id: 'rushing-positions',
    title: 'Rushing Between Positions (Pecking)',
    category: 'general',
    icon: '⚡',
    mistakeDescription:
      'Moving too quickly between positions without achieving stillness (tuma\'ninah) in each one. Some people barely touch their forehead to the ground in sujood or rush through ruku without holding the position. The Prophet (peace be upon him) called this "pecking" like a crow.',
    correction:
      'Every position in prayer requires tuma\'ninah - a moment of complete stillness where every bone settles into place. Stay in ruku, sujood, and sitting positions long enough to say the dhikr at least once, and remain still before moving to the next position.',
    severity: 'major',
    reference: 'Sahih al-Bukhari 791, Sahih Muslim 397 (Hadith of the man who prayed badly)',
    tips: [
      'Count to 3 slowly in each position as a minimum',
      'Say "Subhana Rabbiyal Adheem" 3 times in ruku',
      'Say "Subhana Rabbiyal A\'la" 3 times in sujood',
      'Pause briefly when rising or lowering between positions',
      'The Prophet (peace be upon him) said: "The worst thief is the one who steals from his prayer" by rushing',
    ],
  },
  {
    id: 'lack-of-khushu',
    title: 'Lack of Khushu (Mindful Presence)',
    category: 'focus',
    icon: '🧠',
    mistakeDescription:
      'Praying on autopilot without understanding or reflecting on what you are saying. The mind wanders to work, food, plans, or other worldly matters throughout the prayer.',
    correction:
      'Khushu (humble focus) is the soul of prayer. Try to understand the meaning of what you recite. Before praying, take a moment to remind yourself you are about to stand before Allah. Visualize the Ka\'bah. Remember that this could be your last prayer.',
    severity: 'minor',
    reference: 'Quran 23:1-2 - "Successful indeed are the believers, those who are humble in their prayers"',
    tips: [
      'Learn the meaning of everything you say in prayer (this app helps!)',
      'Take 30 seconds before starting to calm your mind',
      'Imagine you can see Allah, or that He sees you (ihsan)',
      'Pray as if it is your last prayer',
      'Start small - focus deeply on just Al-Fatiha at first',
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getMistakesByCategory = (category: MistakeCategory): SalahMistake[] => {
  return salahMistakes.filter((m) => m.category === category);
};

export const getMistakesBySeverity = (severity: MistakeSeverity): SalahMistake[] => {
  return salahMistakes.filter((m) => m.severity === severity);
};

export const getInvalidatingMistakes = (): SalahMistake[] => {
  return salahMistakes.filter((m) => m.severity === 'invalidates');
};

export const categoryLabels: Record<MistakeCategory, string> = {
  position: 'Position',
  focus: 'Focus',
  invalidator: 'Invalidators',
  general: 'General',
};

export const severityLabels: Record<MistakeSeverity, string> = {
  invalidates: 'Invalidates Prayer',
  major: 'Major Mistake',
  minor: 'Minor Mistake',
};

export const severityColors: Record<MistakeSeverity, { bg: string; text: string; border: string }> = {
  invalidates: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  major: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  minor: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};
