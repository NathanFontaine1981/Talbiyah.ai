export interface JummahStep {
  id: number;
  title: string;
  titleArabic: string;
  description: string;
  hadithText: string;
  hadithReference: string;
  tips: string[];
  ttsText: string;
}

export const JUMMAH_INTRO = {
  title: "The Day of Jumu'ah",
  description:
    "Friday (Jumu'ah) is the best day of the week in Islam. The Prophet ﷺ said: \"The best day on which the sun rises is Friday. On it Adam was created, on it he was admitted to Paradise, and on it he was expelled from it.\" (Sahih Muslim 854). Following these sunnahs helps us maximise the blessings of this special day.",
};

export const JUMMAH_STEPS: JummahStep[] = [
  {
    id: 1,
    title: 'Make Ghusl (Full Body Wash)',
    titleArabic: 'الغُسل',
    description:
      'Performing ghusl (a full ritual bath) before Jummah prayer is a strongly emphasised sunnah. It purifies you physically and spiritually before gathering with the community.',
    hadithText:
      'The Prophet ﷺ said: "Taking a bath on Friday is obligatory (wajib) for every adult."',
    hadithReference: 'Sahih al-Bukhari 877',
    tips: [
      'Perform ghusl after Fajr and before heading to the masjid',
      'Use miswak (tooth stick) or brush your teeth as part of preparation',
      'Apply attar (perfume) after ghusl — the Prophet ﷺ encouraged this',
    ],
    ttsText:
      'Step 1: Make Ghusl. Performing ghusl, a full ritual bath, before Jummah prayer is a strongly emphasised sunnah. The Prophet, peace be upon him, said: Taking a bath on Friday is obligatory for every adult. Narrated in Sahih al-Bukhari, hadith 877.',
  },
  {
    id: 2,
    title: 'Wear Your Best Clothes',
    titleArabic: 'أحسن الثياب',
    description:
      'Jummah is a weekly Eid. Dressing well shows respect for the gathering and the day. Wear clean, pleasant-smelling clothes — ideally your best.',
    hadithText:
      'The Prophet ﷺ said: "There is nothing wrong with any one of you, if he can afford it, buying two garments for Friday, other than his work clothes."',
    hadithReference: 'Sahih al-Bukhari 883',
    tips: [
      'Keep a set of clothes specifically for Friday prayer',
      'White clothing is preferred but not required',
      'Apply non-alcoholic perfume (attar) before leaving home',
    ],
    ttsText:
      'Step 2: Wear Your Best Clothes. Jummah is a weekly Eid. The Prophet, peace be upon him, said: There is nothing wrong with any one of you buying two garments for Friday, other than his work clothes. Narrated in Sahih al-Bukhari, hadith 883.',
  },
  {
    id: 3,
    title: 'Read Surah Al-Kahf',
    titleArabic: 'سورة الكهف',
    description:
      'Reading Surah Al-Kahf (Chapter 18) on Friday is a well-known sunnah. It provides light and protection between two Fridays. You can read it any time from Maghrib on Thursday until Maghrib on Friday.',
    hadithText:
      '"Whoever reads Surah Al-Kahf on Friday, a light will shine for him between two Fridays."',
    hadithReference: 'Sahih al-Jaami 6470',
    tips: [
      'Read it in the morning before heading to the masjid',
      'If time is short, listen to it being recited — scholars say this counts',
      'Surah Al-Kahf has 110 ayahs and takes about 30-40 minutes to read',
    ],
    ttsText:
      'Step 3: Read Surah Al-Kahf. Reading Surah Al-Kahf on Friday provides light and protection between two Fridays. The hadith says: Whoever reads Surah Al-Kahf on Friday, a light will shine for him between two Fridays. This is recorded in Sahih al-Jaami, hadith 6470.',
  },
  {
    id: 4,
    title: 'Go to the Masjid Early',
    titleArabic: 'التبكير إلى المسجد',
    description:
      'Arriving early to the masjid on Friday carries immense reward. The earlier you arrive, the greater the reward — like offering a camel, cow, ram, hen, or egg in charity.',
    hadithText:
      'The Prophet ﷺ said: "On the day of Jummah, the angels stand at the door of the mosque and write down the names of the people in the order of their arrival. The first to arrive is like one who sacrifices a camel, then a cow, then a ram, then a hen, then an egg. When the imam comes out, the angels fold up their scrolls and listen to the khutbah."',
    hadithReference: 'Sahih al-Bukhari 929',
    tips: [
      'Aim to arrive at least 30 minutes before the khutbah begins',
      'Use the waiting time to pray nafl, read Quran, or make dhikr',
      'Sit close to the imam if possible',
    ],
    ttsText:
      'Step 4: Go to the Masjid Early. Arriving early to the masjid on Friday carries immense reward. The Prophet, peace be upon him, said that the first to arrive is like one who sacrifices a camel, then a cow, then a ram. When the imam comes out, the angels fold up their scrolls. Narrated in Sahih al-Bukhari, hadith 929.',
  },
  {
    id: 5,
    title: "Walk, Don't Rush",
    titleArabic: 'المشي بسكينة',
    description:
      'When going to the masjid, walk with calm and dignity. Even if the prayer has started, do not run — join wherever you can with tranquillity.',
    hadithText:
      'The Prophet ﷺ said: "When you hear the iqaamah, proceed to offer the prayer with calmness and solemnity and do not make haste. Pray what you catch up with, and complete what you miss."',
    hadithReference: 'Sahih al-Bukhari 908',
    tips: [
      'Leave home early so you do not need to rush',
      'Walk with a measured pace — this itself is an act of worship',
      'If you arrive late, join the prayer wherever the imam is',
    ],
    ttsText:
      "Step 5: Walk, Don't Rush. The Prophet, peace be upon him, said: When you hear the iqaamah, proceed to offer the prayer with calmness and solemnity and do not make haste. Narrated in Sahih al-Bukhari, hadith 908.",
  },
  {
    id: 6,
    title: 'Do Not Speak During the Khutbah',
    titleArabic: 'الإنصات للخطبة',
    description:
      "Once the imam begins the khutbah (sermon), it is obligatory to listen attentively. Talking, fidgeting with your phone, or even telling someone to be quiet invalidates the reward of your Jummah.",
    hadithText:
      'The Prophet ﷺ said: "If you say to your companion on Friday while the imam is delivering the khutbah, \'Be quiet and listen,\' you have engaged in idle talk."',
    hadithReference: 'Sahih al-Bukhari 934',
    tips: [
      'Put your phone on silent before the khutbah starts',
      'If someone next to you is talking, gently signal with your hand instead of speaking',
      'Focus on the khutbah as though the Prophet ﷺ himself is addressing you',
    ],
    ttsText:
      "Step 6: Do Not Speak During the Khutbah. The Prophet, peace be upon him, said: If you say to your companion on Friday while the imam is delivering the khutbah, Be quiet and listen, you have engaged in idle talk. Narrated in Sahih al-Bukhari, hadith 934.",
  },
  {
    id: 7,
    title: "Make Du'a at the Special Time",
    titleArabic: 'ساعة الإجابة',
    description:
      "There is a special hour on Friday when du'as are accepted. Scholars differ on exactly when it is, but two strong opinions are: between the two khutbahs, and in the last hour before Maghrib.",
    hadithText:
      'The Prophet ﷺ said: "There is an hour on Friday during which a Muslim does not ask Allah for anything but He gives it to him." He indicated with his hand that it is a very short time.',
    hadithReference: 'Sahih al-Bukhari 935',
    tips: [
      "Make du'a between the two khutbahs (when the imam sits briefly)",
      "Dedicate 15-20 minutes before Maghrib on Friday for focused du'a",
      "Prepare a du'a list so you don't forget what to ask for",
      'Send salawaat (blessings) on the Prophet ﷺ abundantly on Friday',
    ],
    ttsText:
      "Step 7: Make Du'a at the Special Time. The Prophet, peace be upon him, said: There is an hour on Friday during which a Muslim does not ask Allah for anything but He gives it to him. Narrated in Sahih al-Bukhari, hadith 935. Scholars say this may be between the two khutbahs or in the last hour before Maghrib.",
  },
];
