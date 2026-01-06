// Salah Tutorial Data - Shafi'i Madhab
// Complete prayer data with word-by-word breakdowns and spiritual context

export interface ArabicWord {
  arabic: string;
  transliteration: string;
  meaning: string;
}

export interface SalahRecitation {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  words: ArabicWord[];
  reference?: string; // Hadith or Quran reference
  spiritualContext?: string;
  divinePerspective?: {
    text: string;
    hadithSource?: string;
  };
  timesToRepeat?: number;
  audioUrl?: string;
}

export interface SalahPosition {
  id: string;
  name: string;
  arabicName: string;
  transliteration: string;
  iconType: 'standing' | 'bowing' | 'prostrating' | 'sitting' | 'hands-raised';
  description: string;
  physicalDescription?: string;
  recitations: SalahRecitation[];
  transitionSaying?: string;
  order: number;
}

export interface SalahRakah {
  number: number;
  positions: string[]; // Position IDs
  notes?: string;
}

// =============================================================================
// SALAH POSITIONS DATA
// =============================================================================

export const salahPositions: SalahPosition[] = [
  // ---------------------------------------------------------------------------
  // 1. TAKBIR AL-IHRAM (Opening Takbir)
  // ---------------------------------------------------------------------------
  {
    id: 'takbir-opening',
    name: 'Opening Takbir',
    arabicName: 'تكبيرة الإحرام',
    transliteration: 'Takbirat al-Ihram',
    iconType: 'hands-raised',
    description: 'The prayer begins with raising your hands and declaring Allah\'s greatness',
    physicalDescription: 'Raise both hands to the level of your ears (or shoulders), with palms facing the Qibla, fingers spread naturally',
    order: 1,
    recitations: [
      {
        id: 'takbir',
        arabic: 'اللهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
        reference: 'Sahih al-Bukhari 757, Sahih Muslim 392',
        words: [
          { arabic: 'اللهُ', transliteration: 'Allahu', meaning: 'Allah' },
          { arabic: 'أَكْبَرُ', transliteration: 'Akbar', meaning: 'is Greater / the Greatest' }
        ],
        spiritualContext: 'With this declaration, you enter a sacred state. You are saying Allah is greater than everything - your worries, your work, your distractions. This takbir creates an invisible barrier between you and the dunya (worldly life). From this moment, you are standing before the King of Kings.',
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 2. QIYAM - OPENING SUPPLICATION (DUA AL-ISTIFTAH)
  // ---------------------------------------------------------------------------
  {
    id: 'standing-opening',
    name: 'Opening Supplication',
    arabicName: 'دعاء الاستفتاح',
    transliteration: "Du'a al-Istiftah",
    iconType: 'standing',
    description: 'A beautiful opening supplication glorifying Allah before reciting Fatiha',
    physicalDescription: 'Stand upright, place your right hand over your left hand on your chest, eyes looking at the place of prostration',
    order: 2,
    recitations: [
      {
        id: 'istiftah',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ',
        transliteration: "Subhanaka Allahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruk",
        translation: 'Glory be to You, O Allah, and praise be to You. Blessed is Your name, exalted is Your majesty, and there is no god but You.',
        reference: 'Sunan Abu Dawud 775, Sunan an-Nasa\'i 900',
        words: [
          { arabic: 'سُبْحَانَكَ', transliteration: 'Subhanaka', meaning: 'Glory be to You' },
          { arabic: 'اللَّهُمَّ', transliteration: 'Allahumma', meaning: 'O Allah' },
          { arabic: 'وَبِحَمْدِكَ', transliteration: 'wa bihamdika', meaning: 'and with Your praise' },
          { arabic: 'وَتَبَارَكَ', transliteration: 'wa tabaraka', meaning: 'and blessed is' },
          { arabic: 'اسْمُكَ', transliteration: 'ismuka', meaning: 'Your name' },
          { arabic: 'وَتَعَالَى', transliteration: "wa ta'ala", meaning: 'and exalted is' },
          { arabic: 'جَدُّكَ', transliteration: 'jadduka', meaning: 'Your majesty' },
          { arabic: 'وَلَا', transliteration: 'wa la', meaning: 'and there is no' },
          { arabic: 'إِلَٰهَ', transliteration: 'ilaha', meaning: 'god' },
          { arabic: 'غَيْرُكَ', transliteration: 'ghayruka', meaning: 'other than You' }
        ],
        spiritualContext: 'You begin by glorifying Allah and praising Him. You acknowledge that His name is blessed, His majesty is exalted, and there is no deity worthy of worship except Him. This prepares your heart for the sacred conversation ahead.'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 3. TA'AWWUDH (Seeking Refuge)
  // ---------------------------------------------------------------------------
  {
    id: 'standing-taawwudh',
    name: 'Seeking Refuge',
    arabicName: 'التعوذ',
    transliteration: "At-Ta'awwudh",
    iconType: 'standing',
    description: 'Seeking refuge in Allah from Shaytan before reciting Quran',
    physicalDescription: 'Remain standing with hands folded on chest',
    order: 3,
    recitations: [
      {
        id: 'taawwudh',
        arabic: 'أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: "A'udhu billahi minash-shaytanir-rajeem",
        translation: 'I seek refuge in Allah from the accursed Shaytan',
        reference: 'Quran 16:98, Sahih al-Bukhari 6115',
        words: [
          { arabic: 'أَعُوذُ', transliteration: "A'udhu", meaning: 'I seek refuge' },
          { arabic: 'بِاللهِ', transliteration: 'billahi', meaning: 'in Allah' },
          { arabic: 'مِنَ', transliteration: 'mina', meaning: 'from' },
          { arabic: 'الشَّيْطَانِ', transliteration: 'ash-shaytani', meaning: 'the Shaytan' },
          { arabic: 'الرَّجِيمِ', transliteration: 'ar-rajeem', meaning: 'the accursed/outcast' }
        ],
        spiritualContext: 'Before reciting Allah\'s words, you seek His protection from the one who wants to distract you. Shaytan tries hardest to disturb you in salah because he knows its value.'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 4. BASMALA
  // ---------------------------------------------------------------------------
  {
    id: 'standing-basmala',
    name: 'Basmala',
    arabicName: 'البسملة',
    transliteration: 'Al-Basmala',
    iconType: 'standing',
    description: 'Beginning in the name of Allah',
    physicalDescription: 'Remain standing with hands folded on chest',
    order: 4,
    recitations: [
      {
        id: 'basmala',
        arabic: 'بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ',
        transliteration: 'Bismillahir-Rahmanir-Raheem',
        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
        reference: 'Quran 1:1, Sunan an-Nasa\'i 906',
        words: [
          { arabic: 'بِسْمِ', transliteration: 'Bismi', meaning: 'In the name of' },
          { arabic: 'اللهِ', transliteration: 'Allahi', meaning: 'Allah' },
          { arabic: 'الرَّحْمَٰنِ', transliteration: 'Ar-Rahmani', meaning: 'the Most Gracious' },
          { arabic: 'الرَّحِيمِ', transliteration: 'Ar-Raheem', meaning: 'the Most Merciful' }
        ],
        spiritualContext: 'You invoke Allah\'s two names of mercy. Ar-Rahman is His universal mercy for all creation, Ar-Raheem is His special mercy for the believers. You begin the Quran surrounded by mercy.'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 5. SURAH AL-FATIHA (The Conversation with Allah)
  // ---------------------------------------------------------------------------
  {
    id: 'standing-fatiha',
    name: 'Al-Fatiha',
    arabicName: 'سورة الفاتحة',
    transliteration: 'Surah Al-Fatiha',
    iconType: 'standing',
    description: 'The Opening - A direct conversation between you and Allah',
    physicalDescription: 'Remain standing with hands folded on chest',
    order: 5,
    recitations: [
      {
        id: 'fatiha-1',
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        transliteration: 'Alhamdu lillahi Rabbil-aalameen',
        translation: 'All praise is due to Allah, Lord of all the worlds',
        reference: 'Quran 1:2',
        words: [
          { arabic: 'الْحَمْدُ', transliteration: 'Alhamdu', meaning: 'All praise' },
          { arabic: 'لِلَّهِ', transliteration: 'lillahi', meaning: 'is for Allah' },
          { arabic: 'رَبِّ', transliteration: 'Rabbi', meaning: 'Lord of' },
          { arabic: 'الْعَالَمِينَ', transliteration: 'al-aalameen', meaning: 'all the worlds' }
        ],
        spiritualContext: 'You begin by praising Allah - not asking, but giving. This is the etiquette of speaking to a King. You acknowledge He is Rabb - not just Lord, but the One who nurtures, sustains, and guides all of creation.',
        divinePerspective: {
          text: 'Allah says: "My servant has praised Me."',
          hadithSource: 'Sahih Muslim 395'
        }
      },
      {
        id: 'fatiha-2',
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        transliteration: 'Ar-Rahmanir-Raheem',
        translation: 'The Most Gracious, the Most Merciful',
        reference: 'Quran 1:3',
        words: [
          { arabic: 'الرَّحْمَٰنِ', transliteration: 'Ar-Rahmani', meaning: 'The Most Gracious' },
          { arabic: 'الرَّحِيمِ', transliteration: 'Ar-Raheem', meaning: 'The Most Merciful' }
        ],
        spiritualContext: 'Again you mention His mercy - emphasizing that the Lord of all worlds is not harsh, but overwhelmingly merciful. His mercy encompasses everything.',
        divinePerspective: {
          text: 'Allah says: "My servant has extolled Me."',
          hadithSource: 'Sahih Muslim 395'
        }
      },
      {
        id: 'fatiha-3',
        arabic: 'مَالِكِ يَوْمِ الدِّينِ',
        transliteration: 'Maliki yawmid-deen',
        translation: 'Master of the Day of Judgment',
        reference: 'Quran 1:4',
        words: [
          { arabic: 'مَالِكِ', transliteration: 'Maliki', meaning: 'Master/Owner of' },
          { arabic: 'يَوْمِ', transliteration: 'yawmi', meaning: 'the Day of' },
          { arabic: 'الدِّينِ', transliteration: 'ad-deen', meaning: 'Judgment/Recompense' }
        ],
        spiritualContext: 'You acknowledge that a Day is coming when all will stand before Him. On that Day, no king, no president, no one will have any authority except Allah. This keeps your heart humble.',
        divinePerspective: {
          text: 'Allah says: "My servant has glorified Me."',
          hadithSource: 'Sahih Muslim 395'
        }
      },
      {
        id: 'fatiha-4',
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        transliteration: "Iyyaka na'budu wa iyyaka nasta'een",
        translation: 'You alone we worship, and You alone we ask for help',
        reference: 'Quran 1:5',
        words: [
          { arabic: 'إِيَّاكَ', transliteration: 'Iyyaka', meaning: 'You alone' },
          { arabic: 'نَعْبُدُ', transliteration: "na'budu", meaning: 'we worship' },
          { arabic: 'وَإِيَّاكَ', transliteration: 'wa iyyaka', meaning: 'and You alone' },
          { arabic: 'نَسْتَعِينُ', transliteration: "nasta'een", meaning: 'we ask for help' }
        ],
        spiritualContext: 'This is the central verse - the pivot of the entire Fatiha. "You alone" comes first for emphasis. You dedicate your worship exclusively to Allah and admit you cannot do anything without His help. This is the essence of Islam.',
        divinePerspective: {
          text: 'Allah says: "This is between Me and My servant, and My servant shall have what he asks for."',
          hadithSource: 'Sahih Muslim 395'
        }
      },
      {
        id: 'fatiha-5',
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        transliteration: 'Ihdinas-siratal-mustaqeem',
        translation: 'Guide us to the straight path',
        reference: 'Quran 1:6',
        words: [
          { arabic: 'اهْدِنَا', transliteration: 'Ihdina', meaning: 'Guide us' },
          { arabic: 'الصِّرَاطَ', transliteration: 'as-sirata', meaning: 'to the path' },
          { arabic: 'الْمُسْتَقِيمَ', transliteration: 'al-mustaqeem', meaning: 'the straight' }
        ],
        spiritualContext: 'NOW you make your request. After praising Allah and acknowledging His sovereignty, you ask for the most important thing: guidance. Not money, not health, not success - guidance. Because with guidance, everything else follows.',
        divinePerspective: {
          text: 'Allah says: "This is for My servant, and My servant shall have what he asks for."',
          hadithSource: 'Sahih Muslim 395'
        }
      },
      {
        id: 'fatiha-6',
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ',
        transliteration: "Siratal-latheena an'amta 'alayhim",
        translation: 'The path of those You have blessed',
        reference: 'Quran 1:7',
        words: [
          { arabic: 'صِرَاطَ', transliteration: 'Sirata', meaning: 'The path of' },
          { arabic: 'الَّذِينَ', transliteration: 'allatheena', meaning: 'those who' },
          { arabic: 'أَنْعَمْتَ', transliteration: "an'amta", meaning: 'You have blessed' },
          { arabic: 'عَلَيْهِمْ', transliteration: "'alayhim", meaning: 'upon them' }
        ],
        spiritualContext: 'You specify which path - the path of the prophets, the truthful, the martyrs, and the righteous. You are asking to walk in the footsteps of the best of humanity.',
        divinePerspective: {
          text: 'Allah says: "This is for My servant, and My servant shall have what he asks for."',
          hadithSource: 'Sahih Muslim 395'
        }
      },
      {
        id: 'fatiha-7',
        arabic: 'غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        transliteration: "Ghayril-maghdubi 'alayhim wa lad-dalleen",
        translation: 'Not of those who earned Your anger, nor of those who went astray',
        reference: 'Quran 1:7',
        words: [
          { arabic: 'غَيْرِ', transliteration: 'Ghayri', meaning: 'Not of' },
          { arabic: 'الْمَغْضُوبِ', transliteration: 'al-maghdubi', meaning: 'those who earned anger' },
          { arabic: 'عَلَيْهِمْ', transliteration: "'alayhim", meaning: 'upon them' },
          { arabic: 'وَلَا', transliteration: 'wa la', meaning: 'and not' },
          { arabic: 'الضَّالِّينَ', transliteration: 'ad-dalleen', meaning: 'those who went astray' }
        ],
        spiritualContext: 'You seek protection from two dangers: those who knew the truth but rejected it (earning anger), and those who lost their way through ignorance. You ask for knowledge AND the ability to act upon it.',
        divinePerspective: {
          text: 'Allah says: "This is for My servant, and My servant shall have what he asks for."',
          hadithSource: 'Sahih Muslim 395'
        }
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 6. AMEEN
  // ---------------------------------------------------------------------------
  {
    id: 'standing-ameen',
    name: 'Ameen',
    arabicName: 'آمين',
    transliteration: 'Ameen',
    iconType: 'standing',
    description: 'Sealing your dua with a request for acceptance',
    physicalDescription: 'Remain standing, say Ameen after completing Fatiha',
    order: 6,
    recitations: [
      {
        id: 'ameen',
        arabic: 'آمِينَ',
        transliteration: 'Ameen',
        translation: 'O Allah, accept/answer',
        reference: 'Sahih al-Bukhari 782, Sahih Muslim 410',
        words: [
          { arabic: 'آمِينَ', transliteration: 'Ameen', meaning: 'O Allah, accept our prayer' }
        ],
        spiritualContext: 'Ameen is not part of the Quran - it is your seal on the dua of Fatiha. The Prophet (peace be upon him) said: "When the Imam says Ameen, say Ameen, for whoever\'s Ameen coincides with the Ameen of the angels, his previous sins will be forgiven."'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 7. RUKU (BOWING)
  // ---------------------------------------------------------------------------
  {
    id: 'ruku',
    name: 'Bowing',
    arabicName: 'ركوع',
    transliteration: "Ruku'",
    iconType: 'bowing',
    description: 'Bowing in humility before Allah',
    physicalDescription: 'Bow from the waist, back straight and parallel to the ground, hands on knees with fingers spread, head in line with back',
    order: 7,
    transitionSaying: 'Allahu Akbar',
    recitations: [
      {
        id: 'ruku-dhikr',
        arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
        transliteration: "Subhana Rabbiyal-'Adheem",
        translation: 'Glory be to my Lord, the Magnificent',
        reference: 'Sahih Muslim 772, Abu Dawud 871',
        timesToRepeat: 3,
        words: [
          { arabic: 'سُبْحَانَ', transliteration: 'Subhana', meaning: 'Glory be to' },
          { arabic: 'رَبِّيَ', transliteration: 'Rabbiya', meaning: 'my Lord' },
          { arabic: 'الْعَظِيمِ', transliteration: "al-'Adheem", meaning: 'the Magnificent/Supreme' }
        ],
        spiritualContext: 'In bowing, you humble your body before the One who deserves all glory. You declare Allah\'s magnificence (Adheem) - He is beyond any imperfection or limitation. Your physical lowering reflects your spiritual submission.'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 8. RISING FROM RUKU
  // ---------------------------------------------------------------------------
  {
    id: 'rising-from-ruku',
    name: 'Rising from Bowing',
    arabicName: 'الاعتدال من الركوع',
    transliteration: "Al-I'tidal",
    iconType: 'standing',
    description: 'Standing up straight after bowing',
    physicalDescription: 'Rise to full standing position, hands at sides or on chest',
    order: 8,
    recitations: [
      {
        id: 'sami-allah',
        arabic: 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ',
        transliteration: "Sami'Allahu liman hamidah",
        translation: 'Allah hears the one who praises Him',
        reference: 'Sahih al-Bukhari 795, Sahih Muslim 392',
        words: [
          { arabic: 'سَمِعَ', transliteration: "Sami'a", meaning: 'Hears/has heard' },
          { arabic: 'اللهُ', transliteration: 'Allahu', meaning: 'Allah' },
          { arabic: 'لِمَنْ', transliteration: 'liman', meaning: 'the one who' },
          { arabic: 'حَمِدَهُ', transliteration: 'hamidah', meaning: 'praises Him' }
        ],
        spiritualContext: 'As you rise, you announce that Allah hears those who praise Him. This is a promise and an encouragement - your praise does not go unheard!'
      },
      {
        id: 'rabbana-lakal-hamd',
        arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ',
        transliteration: 'Rabbana wa lakal-hamd',
        translation: 'Our Lord, to You belongs all praise',
        reference: 'Sahih al-Bukhari 796, Sahih Muslim 392',
        words: [
          { arabic: 'رَبَّنَا', transliteration: 'Rabbana', meaning: 'Our Lord' },
          { arabic: 'وَلَكَ', transliteration: 'wa laka', meaning: 'and to You' },
          { arabic: 'الْحَمْدُ', transliteration: 'al-hamd', meaning: 'is all praise' }
        ],
        spiritualContext: 'You respond immediately with praise. You are answering the call - Allah hears the one who praises Him, so you praise Him right away!'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 9. SUJOOD (PROSTRATION)
  // ---------------------------------------------------------------------------
  {
    id: 'sujood',
    name: 'Prostration',
    arabicName: 'سجود',
    transliteration: 'Sujood',
    iconType: 'prostrating',
    description: 'The closest position to Allah',
    physicalDescription: 'Prostrate with seven body parts touching the ground: forehead with nose, both palms, both knees, and toes of both feet. Elbows raised, not touching the ground.',
    order: 9,
    transitionSaying: 'Allahu Akbar',
    recitations: [
      {
        id: 'sujood-dhikr',
        arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
        transliteration: "Subhana Rabbiyal-A'la",
        translation: 'Glory be to my Lord, the Most High',
        reference: 'Sahih Muslim 772, Abu Dawud 871',
        timesToRepeat: 3,
        words: [
          { arabic: 'سُبْحَانَ', transliteration: 'Subhana', meaning: 'Glory be to' },
          { arabic: 'رَبِّيَ', transliteration: 'Rabbiya', meaning: 'my Lord' },
          { arabic: 'الْأَعْلَى', transliteration: "al-A'la", meaning: 'the Most High' }
        ],
        spiritualContext: 'The Prophet (peace be upon him) said: "The closest a servant is to his Lord is when he is in prostration." You put the highest part of your body (your face) on the lowest place (the ground) for the Most High (Al-A\'la). This is the ultimate humility and the position where dua is most readily accepted.'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 10. SITTING BETWEEN PROSTRATIONS
  // ---------------------------------------------------------------------------
  {
    id: 'sitting-between-sujood',
    name: 'Sitting Between Prostrations',
    arabicName: 'الجلسة بين السجدتين',
    transliteration: 'Al-Jalsa bayn as-Sajdatayn',
    iconType: 'sitting',
    description: 'A brief sitting between the two prostrations',
    physicalDescription: 'Sit upright on your left foot, with your right foot upright and toes pointing toward the Qibla',
    order: 10,
    transitionSaying: 'Allahu Akbar',
    recitations: [
      {
        id: 'between-sujood',
        arabic: 'رَبِّ اغْفِرْ لِي',
        transliteration: 'Rabbighfir lee',
        translation: 'My Lord, forgive me',
        reference: 'Abu Dawud 850, Ibn Majah 897',
        timesToRepeat: 1,
        words: [
          { arabic: 'رَبِّ', transliteration: 'Rabbi', meaning: 'My Lord' },
          { arabic: 'اغْفِرْ', transliteration: 'ighfir', meaning: 'forgive' },
          { arabic: 'لِي', transliteration: 'lee', meaning: 'me' }
        ],
        spiritualContext: 'Between prostrations, you ask for the most important thing: forgiveness. This simple dua is profound - you acknowledge your shortcomings and turn to the One who loves to forgive.'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 11. TASHAHHUD
  // ---------------------------------------------------------------------------
  {
    id: 'tashahhud',
    name: 'Tashahhud',
    arabicName: 'التشهد',
    transliteration: 'At-Tashahhud',
    iconType: 'sitting',
    description: 'The testimony of faith and greetings',
    physicalDescription: 'Sit on your left foot with right foot upright. Place hands on thighs, right index finger extended and pointing during the shahada.',
    order: 11,
    recitations: [
      {
        id: 'tashahhud',
        arabic: 'التَّحِيَّاتُ الْمُبَارَكَاتُ الصَّلَوَاتُ الطَّيِّبَاتُ لِلَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللهِ الصَّالِحِينَ',
        transliteration: "At-tahiyyatul-mubarakatus-salawatut-tayyibatu lillah. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-saliheen",
        translation: 'All blessed greetings, prayers, and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah.',
        reference: 'Sahih Muslim 402 (Shafi\'i version)',
        words: [
          { arabic: 'التَّحِيَّاتُ', transliteration: 'At-tahiyyatu', meaning: 'The greetings' },
          { arabic: 'الْمُبَارَكَاتُ', transliteration: 'al-mubarakatu', meaning: 'the blessed things' },
          { arabic: 'الصَّلَوَاتُ', transliteration: 'as-salawatu', meaning: 'the prayers' },
          { arabic: 'الطَّيِّبَاتُ', transliteration: 'at-tayyibatu', meaning: 'the good things' },
          { arabic: 'لِلَّهِ', transliteration: 'lillah', meaning: 'are for Allah' },
          { arabic: 'السَّلَامُ', transliteration: 'As-salamu', meaning: 'Peace' },
          { arabic: 'عَلَيْكَ', transliteration: "'alayka", meaning: 'be upon you' },
          { arabic: 'أَيُّهَا', transliteration: 'ayyuha', meaning: 'O' },
          { arabic: 'النَّبِيُّ', transliteration: 'an-nabiyyu', meaning: 'Prophet' },
          { arabic: 'وَرَحْمَةُ', transliteration: 'wa rahmatu', meaning: 'and the mercy of' },
          { arabic: 'اللهِ', transliteration: 'Allahi', meaning: 'Allah' },
          { arabic: 'وَبَرَكَاتُهُ', transliteration: 'wa barakatuh', meaning: 'and His blessings' },
          { arabic: 'السَّلَامُ', transliteration: 'As-salamu', meaning: 'Peace' },
          { arabic: 'عَلَيْنَا', transliteration: "'alayna", meaning: 'be upon us' },
          { arabic: 'وَعَلَى', transliteration: "wa 'ala", meaning: 'and upon' },
          { arabic: 'عِبَادِ', transliteration: "'ibadi", meaning: 'the servants of' },
          { arabic: 'اللهِ', transliteration: 'Allahi', meaning: 'Allah' },
          { arabic: 'الصَّالِحِينَ', transliteration: 'as-saliheen', meaning: 'the righteous' }
        ],
        spiritualContext: 'In tashahhud, you greet Allah with all good things, then send peace upon the Prophet (peace be upon him), then upon yourself and all righteous Muslims everywhere. You become connected to the entire ummah in this moment.'
      },
      {
        id: 'shahada',
        arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ',
        transliteration: 'Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan rasulullah',
        translation: 'I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah',
        reference: 'Sahih Muslim 402',
        words: [
          { arabic: 'أَشْهَدُ', transliteration: 'Ash-hadu', meaning: 'I bear witness' },
          { arabic: 'أَنْ', transliteration: 'an', meaning: 'that' },
          { arabic: 'لَا', transliteration: 'la', meaning: 'there is no' },
          { arabic: 'إِلَٰهَ', transliteration: 'ilaha', meaning: 'god' },
          { arabic: 'إِلَّا', transliteration: 'illa', meaning: 'except' },
          { arabic: 'اللهُ', transliteration: 'Allah', meaning: 'Allah' },
          { arabic: 'وَأَشْهَدُ', transliteration: 'wa ash-hadu', meaning: 'and I bear witness' },
          { arabic: 'أَنَّ', transliteration: 'anna', meaning: 'that' },
          { arabic: 'مُحَمَّدًا', transliteration: 'Muhammadan', meaning: 'Muhammad' },
          { arabic: 'رَسُولُ', transliteration: 'rasulu', meaning: 'is the Messenger of' },
          { arabic: 'اللهِ', transliteration: 'Allahi', meaning: 'Allah' }
        ],
        spiritualContext: 'This is the shahada - the testimony of faith that makes someone a Muslim. You renew this testimony in every prayer, reaffirming your faith in Allah\'s oneness and Muhammad\'s prophethood. Raise your index finger here as a symbol of tawheed.'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 12. SALAWAT (DUROOD IBRAHIM)
  // ---------------------------------------------------------------------------
  {
    id: 'salawat',
    name: 'Salawat',
    arabicName: 'الصلاة على النبي',
    transliteration: 'As-Salat alan-Nabi',
    iconType: 'sitting',
    description: 'Sending blessings upon the Prophet Ibrahim and Muhammad',
    physicalDescription: 'Remain in the sitting position from tashahhud',
    order: 12,
    recitations: [
      {
        id: 'durood-ibrahim',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
        transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad, kama sallayta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammad, kama barakta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid",
        translation: 'O Allah, send Your grace upon Muhammad and upon the family of Muhammad, as You sent Your grace upon Ibrahim and upon the family of Ibrahim. You are indeed Praiseworthy, Most Glorious. O Allah, send Your blessings upon Muhammad and upon the family of Muhammad, as You sent Your blessings upon Ibrahim and upon the family of Ibrahim. You are indeed Praiseworthy, Most Glorious.',
        reference: 'Sahih al-Bukhari 3370, Sahih Muslim 406',
        words: [
          { arabic: 'اللَّهُمَّ', transliteration: 'Allahumma', meaning: 'O Allah' },
          { arabic: 'صَلِّ', transliteration: 'salli', meaning: 'send grace/prayers' },
          { arabic: 'عَلَى', transliteration: "'ala", meaning: 'upon' },
          { arabic: 'مُحَمَّدٍ', transliteration: 'Muhammadin', meaning: 'Muhammad' },
          { arabic: 'وَعَلَى', transliteration: "wa 'ala", meaning: 'and upon' },
          { arabic: 'آلِ', transliteration: 'ali', meaning: 'the family of' },
          { arabic: 'مُحَمَّدٍ', transliteration: 'Muhammad', meaning: 'Muhammad' },
          { arabic: 'كَمَا', transliteration: 'kama', meaning: 'as' },
          { arabic: 'صَلَّيْتَ', transliteration: 'sallayta', meaning: 'You sent grace' },
          { arabic: 'عَلَى', transliteration: "'ala", meaning: 'upon' },
          { arabic: 'إِبْرَاهِيمَ', transliteration: 'Ibrahima', meaning: 'Ibrahim' },
          { arabic: 'وَعَلَى', transliteration: "wa 'ala", meaning: 'and upon' },
          { arabic: 'آلِ', transliteration: 'ali', meaning: 'the family of' },
          { arabic: 'إِبْرَاهِيمَ', transliteration: 'Ibrahima', meaning: 'Ibrahim' },
          { arabic: 'إِنَّكَ', transliteration: 'innaka', meaning: 'indeed You are' },
          { arabic: 'حَمِيدٌ', transliteration: 'Hamidun', meaning: 'Praiseworthy' },
          { arabic: 'مَجِيدٌ', transliteration: 'Majid', meaning: 'Most Glorious' }
        ],
        spiritualContext: 'You ask Allah to bless Prophet Muhammad as He blessed Prophet Ibrahim. The Prophet (peace be upon him) said: "Whoever sends one blessing upon me, Allah will send ten blessings upon him." This is your investment that returns tenfold!'
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 13. TASLEEM (ENDING)
  // ---------------------------------------------------------------------------
  {
    id: 'tasleem',
    name: 'Tasleem',
    arabicName: 'التسليم',
    transliteration: 'At-Tasleem',
    iconType: 'sitting',
    description: 'Ending the prayer with greetings of peace',
    physicalDescription: 'Turn your head to the right, then to the left, each time saying the salam',
    order: 13,
    recitations: [
      {
        id: 'salam-right',
        arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ',
        transliteration: "As-salamu 'alaykum wa rahmatullah",
        translation: 'Peace be upon you and the mercy of Allah',
        reference: 'Sahih Muslim 582, Abu Dawud 996',
        words: [
          { arabic: 'السَّلَامُ', transliteration: 'As-salamu', meaning: 'Peace' },
          { arabic: 'عَلَيْكُمْ', transliteration: "'alaykum", meaning: 'be upon you (plural)' },
          { arabic: 'وَرَحْمَةُ', transliteration: 'wa rahmatu', meaning: 'and the mercy of' },
          { arabic: 'اللهِ', transliteration: 'Allahi', meaning: 'Allah' }
        ],
        spiritualContext: 'You end the prayer by spreading peace. When you turn right, you greet the angel recording your good deeds. When you turn left, you greet the angel recording your other deeds. You also greet any believers praying beside you. The prayer that began with "Allahu Akbar" (Allah is Greatest) ends with "As-salamu alaykum" (Peace be upon you) - you entered focusing on Allah\'s greatness, you leave spreading His peace.'
      }
    ]
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getPositionById = (id: string): SalahPosition | undefined => {
  return salahPositions.find(p => p.id === id);
};

export const getPositionsByOrder = (): SalahPosition[] => {
  return [...salahPositions].sort((a, b) => a.order - b.order);
};

export const getAllRecitations = (): SalahRecitation[] => {
  return salahPositions.flatMap(p => p.recitations);
};

export const getAllWords = (): ArabicWord[] => {
  return getAllRecitations().flatMap(r => r.words);
};

export const getUniqueWords = (): ArabicWord[] => {
  const seen = new Set<string>();
  return getAllWords().filter(word => {
    if (seen.has(word.arabic)) return false;
    seen.add(word.arabic);
    return true;
  });
};

// =============================================================================
// TWO RAKAH PRAYER STRUCTURE
// =============================================================================

export const twoRakahPrayer = {
  name: 'Two Rakah Prayer',
  description: 'The structure of a basic two-rakah prayer (like Fajr)',
  rakahs: [
    {
      number: 1,
      positions: [
        'takbir-opening',
        'standing-opening',
        'standing-taawwudh',
        'standing-basmala',
        'standing-fatiha',
        'standing-ameen',
        // Note: Additional surah would be recited here
        'ruku',
        'rising-from-ruku',
        'sujood',
        'sitting-between-sujood',
        'sujood', // Second sujood
      ],
      notes: 'First rakah includes opening dua and additional surah after Fatiha'
    },
    {
      number: 2,
      positions: [
        'standing-basmala',
        'standing-fatiha',
        'standing-ameen',
        // Note: Additional surah would be recited here
        'ruku',
        'rising-from-ruku',
        'sujood',
        'sitting-between-sujood',
        'sujood', // Second sujood
        'tashahhud',
        'salawat',
        'tasleem'
      ],
      notes: 'Second rakah ends with tashahhud, salawat, and tasleem'
    }
  ]
};

// =============================================================================
// QUIZ DATA
// =============================================================================

export interface QuizQuestion {
  id: string;
  type: 'match' | 'fill-blank' | 'sequence' | 'multiple-choice';
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  hint?: string;
  positionId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const generateMatchQuestions = (): QuizQuestion[] => {
  const words = getUniqueWords();
  return words.slice(0, 20).map((word, index) => ({
    id: `match-${index}`,
    type: 'match' as const,
    question: word.arabic,
    correctAnswer: word.meaning,
    options: [
      word.meaning,
      ...words
        .filter(w => w.arabic !== word.arabic)
        .slice(0, 3)
        .map(w => w.meaning)
    ].sort(() => Math.random() - 0.5),
    difficulty: 'easy' as const
  }));
};

export const generateSequenceQuestions = (): QuizQuestion[] => {
  const positions = getPositionsByOrder().slice(0, 8);
  return [{
    id: 'sequence-positions',
    type: 'sequence' as const,
    question: 'Arrange these prayer positions in the correct order:',
    correctAnswer: positions.map(p => p.name),
    options: positions.map(p => p.name).sort(() => Math.random() - 0.5),
    difficulty: 'medium' as const
  }];
};

// =============================================================================
// DAILY PRAYERS (FARD) - PRAY NOW MODE
// =============================================================================

export interface PrayerRakah {
  number: number;
  positions: string[]; // Position IDs to include
  hasTashahhud: boolean;
  isFinal: boolean;
}

export interface DailyPrayer {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  rakahs: number;
  description: string;
  structure: PrayerRakah[];
}

// First rakah positions (full with opening)
const firstRakahPositions = [
  'takbir-opening',
  'standing-opening',
  'standing-taawwudh',
  'standing-basmala',
  'standing-fatiha',
  'standing-ameen',
  'ruku',
  'rising-from-ruku',
  'sujood',
  'sitting-between-sujood',
  'sujood', // Second sujood
];

// Standard rakah (no opening, with Fatiha)
const standardRakahPositions = [
  'standing-basmala',
  'standing-fatiha',
  'standing-ameen',
  'ruku',
  'rising-from-ruku',
  'sujood',
  'sitting-between-sujood',
  'sujood', // Second sujood
];

// Tashahhud positions
const tashahhudPositions = ['tashahhud'];

// Final rakah endings
const finalEndingPositions = ['tashahhud', 'salawat', 'tasleem'];

export const dailyPrayers: DailyPrayer[] = [
  // FAJR - 2 Rakahs
  {
    id: 'fajr',
    name: 'Fajr',
    arabicName: 'صلاة الفجر',
    icon: '🌅',
    rakahs: 2,
    description: 'Dawn prayer - 2 rakahs',
    structure: [
      {
        number: 1,
        positions: [...firstRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 2,
        positions: [...standardRakahPositions, ...finalEndingPositions],
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },

  // DHUHR - 4 Rakahs
  {
    id: 'dhuhr',
    name: 'Dhuhr',
    arabicName: 'صلاة الظهر',
    icon: '☀️',
    rakahs: 4,
    description: 'Noon prayer - 4 rakahs',
    structure: [
      {
        number: 1,
        positions: [...firstRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 2,
        positions: [...standardRakahPositions, ...tashahhudPositions],
        hasTashahhud: true,
        isFinal: false,
      },
      {
        number: 3,
        positions: [...standardRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 4,
        positions: [...standardRakahPositions, ...finalEndingPositions],
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },

  // ASR - 4 Rakahs
  {
    id: 'asr',
    name: 'Asr',
    arabicName: 'صلاة العصر',
    icon: '🌤️',
    rakahs: 4,
    description: 'Afternoon prayer - 4 rakahs',
    structure: [
      {
        number: 1,
        positions: [...firstRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 2,
        positions: [...standardRakahPositions, ...tashahhudPositions],
        hasTashahhud: true,
        isFinal: false,
      },
      {
        number: 3,
        positions: [...standardRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 4,
        positions: [...standardRakahPositions, ...finalEndingPositions],
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },

  // MAGHRIB - 3 Rakahs
  {
    id: 'maghrib',
    name: 'Maghrib',
    arabicName: 'صلاة المغرب',
    icon: '🌅',
    rakahs: 3,
    description: 'Sunset prayer - 3 rakahs',
    structure: [
      {
        number: 1,
        positions: [...firstRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 2,
        positions: [...standardRakahPositions, ...tashahhudPositions],
        hasTashahhud: true,
        isFinal: false,
      },
      {
        number: 3,
        positions: [...standardRakahPositions, ...finalEndingPositions],
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },

  // ISHA - 4 Rakahs
  {
    id: 'isha',
    name: 'Isha',
    arabicName: 'صلاة العشاء',
    icon: '🌙',
    rakahs: 4,
    description: 'Night prayer - 4 rakahs',
    structure: [
      {
        number: 1,
        positions: [...firstRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 2,
        positions: [...standardRakahPositions, ...tashahhudPositions],
        hasTashahhud: true,
        isFinal: false,
      },
      {
        number: 3,
        positions: [...standardRakahPositions],
        hasTashahhud: false,
        isFinal: false,
      },
      {
        number: 4,
        positions: [...standardRakahPositions, ...finalEndingPositions],
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },
];

// Get prayer by ID
export const getPrayerById = (id: string): DailyPrayer | undefined => {
  return dailyPrayers.find(p => p.id === id);
};

// Generate all prayer steps for a specific prayer
export interface PrayerStep {
  positionId: string;
  position: SalahPosition;
  recitationIndex: number;
  rakah: number;
  totalRakahs: number;
}

export const getPrayerSteps = (prayerId: string): PrayerStep[] => {
  const prayer = getPrayerById(prayerId);
  if (!prayer) return [];

  const steps: PrayerStep[] = [];

  prayer.structure.forEach((rakah) => {
    rakah.positions.forEach((positionId) => {
      const position = salahPositions.find(p => p.id === positionId);
      if (position) {
        position.recitations.forEach((_, recIndex) => {
          steps.push({
            positionId,
            position,
            recitationIndex: recIndex,
            rakah: rakah.number,
            totalRakahs: prayer.rakahs,
          });
        });
      }
    });
  });

  return steps;
};
