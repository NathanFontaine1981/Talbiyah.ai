/**
 * Pre-built Dua Library
 * A comprehensive collection of authentic duas from Quran and Sunnah
 * organized by category for the Dua Builder feature.
 */

export interface DuaCategory {
  id: string;
  name: string;
  nameArabic: string;
  icon: string;
  description: string;
  suggestedNames: string[];
  isCore: boolean;
}

export interface LibraryDua {
  id: string;
  category: string;
  title: string;
  titleArabic: string;
  arabic: string;
  transliteration: string;
  english: string;
  source: string;
  sourceArabic?: string;
  isCore: boolean;
}

export const DUA_CATEGORIES: DuaCategory[] = [
  // Core Categories (Daily Essentials)
  {
    id: 'morning',
    name: 'Morning Adhkar',
    nameArabic: 'أذكار الصباح',
    icon: '🌅',
    description: 'Daily morning remembrances after Fajr',
    suggestedNames: ['Ar-Rahman', 'Al-Malik', 'Al-Quddus'],
    isCore: true
  },
  {
    id: 'evening',
    name: 'Evening Adhkar',
    nameArabic: 'أذكار المساء',
    icon: '🌙',
    description: 'Daily evening remembrances after Asr',
    suggestedNames: ['Ar-Rahman', 'Al-Muhaymin', 'As-Salam'],
    isCore: true
  },
  {
    id: 'sleep',
    name: 'Before Sleep',
    nameArabic: 'أذكار النوم',
    icon: '😴',
    description: 'Duas before going to bed',
    suggestedNames: ['Al-Wakil', 'Al-Hafiz', 'Al-Muhaymin'],
    isCore: true
  },
  {
    id: 'waking',
    name: 'Upon Waking',
    nameArabic: 'أذكار الاستيقاظ',
    icon: '☀️',
    description: 'Duas when waking up',
    suggestedNames: ['Al-Muhyi', 'Al-Hayy', 'Al-Qayyum'],
    isCore: true
  },
  {
    id: 'food',
    name: 'Food & Drink',
    nameArabic: 'الطعام والشراب',
    icon: '🍽️',
    description: 'Before and after meals',
    suggestedNames: ['Ar-Razzaq', 'Al-Karim', 'Ash-Shakur'],
    isCore: true
  },
  {
    id: 'travel',
    name: 'Travel',
    nameArabic: 'السفر',
    icon: '✈️',
    description: 'Duas for journeys and traveling',
    suggestedNames: ['Al-Hafiz', 'Al-Wali', 'As-Sami'],
    isCore: true
  },
  // Situational Categories
  {
    id: 'forgiveness',
    name: 'Seeking Forgiveness',
    nameArabic: 'الاستغفار',
    icon: '🤲',
    description: 'Duas for tawbah, istighfar, and seeking pardon',
    suggestedNames: ['Al-Ghaffar', 'At-Tawwab', 'Al-Afuw', 'Ar-Rahman'],
    isCore: false
  },
  {
    id: 'guidance',
    name: 'Seeking Guidance',
    nameArabic: 'طلب الهداية',
    icon: '🌟',
    description: 'Duas for guidance, wisdom, and clarity',
    suggestedNames: ['Al-Hadi', 'An-Nur', 'Al-Hakim', 'Al-Alim'],
    isCore: false
  },
  {
    id: 'protection',
    name: 'Protection',
    nameArabic: 'الحماية',
    icon: '🛡️',
    description: 'Duas for protection from harm and evil',
    suggestedNames: ['Al-Muhaymin', 'Al-Hafiz', 'Al-Wali', 'Al-Mani'],
    isCore: false
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    nameArabic: 'الشكر',
    icon: '💚',
    description: 'Expressing thankfulness to Allah',
    suggestedNames: ['Ash-Shakur', 'Al-Wahhab', 'Al-Karim'],
    isCore: false
  },
  {
    id: 'hardship',
    name: 'Times of Hardship',
    nameArabic: 'وقت الشدة',
    icon: '💪',
    description: 'Duas during trials and difficulties',
    suggestedNames: ['Al-Wakil', 'An-Nasir', 'Al-Fattah', 'Al-Latif'],
    isCore: false
  },
  {
    id: 'anxiety',
    name: 'Anxiety & Worry',
    nameArabic: 'القلق والهم',
    icon: '🕊️',
    description: 'Duas for peace, tranquility, and relief',
    suggestedNames: ['As-Salam', 'Al-Mumin', 'Al-Latif', 'Ar-Rauf'],
    isCore: false
  },
  {
    id: 'health',
    name: 'Health & Healing',
    nameArabic: 'الصحة والشفاء',
    icon: '❤️‍🩹',
    description: 'Duas for wellness, recovery, and cure',
    suggestedNames: ['Ash-Shafi', 'Al-Muhyi', 'Al-Qadir'],
    isCore: false
  },
  {
    id: 'provision',
    name: 'Sustenance & Provision',
    nameArabic: 'الرزق',
    icon: '💰',
    description: 'Duas for halal provision and barakah',
    suggestedNames: ['Ar-Razzaq', 'Al-Wahhab', 'Al-Fattah', 'Al-Ghani'],
    isCore: false
  },
  {
    id: 'family',
    name: 'Family & Children',
    nameArabic: 'الأهل والذرية',
    icon: '👨‍👩‍👧‍👦',
    description: 'Duas for family blessings and righteous offspring',
    suggestedNames: ['Al-Wahhab', 'Al-Barr', 'Ar-Rauf', 'Al-Wadud'],
    isCore: false
  },
  {
    id: 'knowledge',
    name: 'Knowledge & Understanding',
    nameArabic: 'العلم والفهم',
    icon: '📚',
    description: 'Duas for beneficial knowledge and comprehension',
    suggestedNames: ['Al-Alim', 'Al-Hakim', 'Al-Fattah', 'Al-Khabir'],
    isCore: false
  },
  {
    id: 'patience',
    name: 'Patience & Steadfastness',
    nameArabic: 'الصبر والثبات',
    icon: '⚓',
    description: 'Duas for perseverance and firmness',
    suggestedNames: ['As-Sabur', 'Al-Qadir', 'Al-Matin', 'Al-Qawiy'],
    isCore: false
  },
  {
    id: 'success',
    name: 'Success & Achievement',
    nameArabic: 'النجاح والتوفيق',
    icon: '🏆',
    description: 'Duas for tawfiq and accomplishment',
    suggestedNames: ['Al-Fattah', 'An-Nasir', 'Ar-Rashid', 'Al-Hadi'],
    isCore: false
  }
];

export const DUA_LIBRARY: LibraryDua[] = [
  // === MORNING ADHKAR ===
  {
    id: 'morning-1',
    category: 'morning',
    title: 'Morning Supplication',
    titleArabic: 'دعاء الصباح',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    english: 'We have entered the morning and the dominion belongs to Allah. Praise is to Allah. None has the right to be worshipped but Allah alone, with no partner. To Him belongs the dominion and to Him is the praise, and He is Able to do all things.',
    source: 'Sahih Muslim',
    isCore: true
  },
  {
    id: 'morning-2',
    category: 'morning',
    title: 'Sayyid al-Istighfar',
    titleArabic: 'سيد الاستغفار',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bi ni'matika 'alayya, wa abu'u bi dhanbi faghfir li fa innahu la yaghfirudh-dhunuba illa anta",
    english: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant. I uphold Your covenant and promise as best I can. I seek refuge in You from the evil I have done. I acknowledge Your blessings upon me, and I admit my sins. Forgive me, for none forgives sins but You.",
    source: 'Sahih Bukhari',
    isCore: true
  },
  {
    id: 'morning-3',
    category: 'morning',
    title: 'Seeking Protection (Morning)',
    titleArabic: 'طلب الحماية صباحاً',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa huwas-Sami'ul-'Alim",
    english: 'In the Name of Allah, with Whose Name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
    source: 'Abu Dawud, Tirmidhi',
    isCore: true
  },
  {
    id: 'morning-4',
    category: 'morning',
    title: 'Satisfaction with Allah',
    titleArabic: 'الرضا بالله',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    transliteration: "Raditu billahi rabba, wa bil-islami dina, wa bi Muhammadin sallallahu 'alayhi wa sallama nabiyya",
    english: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.',
    source: 'Abu Dawud',
    isCore: true
  },

  // === EVENING ADHKAR ===
  {
    id: 'evening-1',
    category: 'evening',
    title: 'Evening Supplication',
    titleArabic: 'دعاء المساء',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
    english: 'We have entered the evening and the dominion belongs to Allah. Praise is to Allah. None has the right to be worshipped but Allah alone, with no partner. To Him belongs the dominion and to Him is the praise, and He is Able to do all things.',
    source: 'Sahih Muslim',
    isCore: true
  },
  {
    id: 'evening-2',
    category: 'evening',
    title: 'Ayat al-Kursi',
    titleArabic: 'آية الكرسي',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    transliteration: "Allahu la ilaha illa huwal Hayyul Qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum. Wa la yuhituna bi shay'im-min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard. Wa la ya'uduhu hifzuhuma. Wa huwal 'Aliyyul 'Azim",
    english: 'Allah! There is no god but He, the Living, the Self-Subsisting. Neither slumber nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them. They encompass nothing of His knowledge except what He wills. His Throne extends over the heavens and the earth, and their preservation does not tire Him. He is the Most High, the Most Great.',
    source: 'Quran 2:255',
    isCore: true
  },

  // === SLEEP DUAS ===
  {
    id: 'sleep-1',
    category: 'sleep',
    title: 'Before Sleeping',
    titleArabic: 'قبل النوم',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya',
    english: 'In Your name, O Allah, I die and I live.',
    source: 'Sahih Bukhari',
    isCore: true
  },
  {
    id: 'sleep-2',
    category: 'sleep',
    title: 'Entrusting Soul to Allah',
    titleArabic: 'تفويض الروح لله',
    arabic: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
    transliteration: "Allahumma aslamtu nafsi ilayk, wa fawwadtu amri ilayk, wa wajjahtu wajhi ilayk, wa alja'tu zahri ilayk, raghbatan wa rahbatan ilayk, la malja'a wa la manja minka illa ilayk, amantu bi kitabikal-ladhi anzalt, wa bi nabiyyikal-ladhi arsalt",
    english: "O Allah, I submit myself to You, entrust my affairs to You, turn my face to You, and lay my back on Your support, out of hope and fear of You. There is no refuge or escape from You except to You. I believe in Your Book which You revealed, and in Your Prophet whom You sent.",
    source: 'Sahih Bukhari & Muslim',
    isCore: true
  },
  {
    id: 'sleep-3',
    category: 'sleep',
    title: 'Protection During Sleep',
    titleArabic: 'الحماية أثناء النوم',
    arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
    transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
    english: 'O Allah, protect me from Your punishment on the Day You resurrect Your servants.',
    source: 'Abu Dawud',
    isCore: true
  },

  // === WAKING UP ===
  {
    id: 'waking-1',
    category: 'waking',
    title: 'Upon Waking',
    titleArabic: 'عند الاستيقاظ',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
    english: 'Praise is to Allah who gave us life after He had caused us to die, and to Him is the resurrection.',
    source: 'Sahih Bukhari',
    isCore: true
  },
  {
    id: 'waking-2',
    category: 'waking',
    title: 'First Words Upon Waking',
    titleArabic: 'أول الكلمات عند الاستيقاظ',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Subhanallahi, walhamdu lillahi, wa la ilaha illallahu, wallahu akbar, wa la hawla wa la quwwata illa billah",
    english: 'There is no god but Allah alone, with no partner. To Him belongs the dominion and praise, and He is Able to do all things. Glory be to Allah, praise be to Allah, there is no god but Allah, Allah is the Greatest, there is no power or strength except with Allah.',
    source: 'Sahih Bukhari',
    isCore: true
  },

  // === FOOD & DRINK ===
  {
    id: 'food-1',
    category: 'food',
    title: 'Before Eating',
    titleArabic: 'قبل الطعام',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    english: 'In the name of Allah.',
    source: 'Abu Dawud, Tirmidhi',
    isCore: true
  },
  {
    id: 'food-2',
    category: 'food',
    title: 'After Eating',
    titleArabic: 'بعد الطعام',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
    english: 'Praise is to Allah who fed me this and provided it for me without any power or strength on my part.',
    source: 'Abu Dawud, Tirmidhi',
    isCore: true
  },
  {
    id: 'food-3',
    category: 'food',
    title: 'Comprehensive After Meal',
    titleArabic: 'دعاء شامل بعد الطعام',
    arabic: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ، غَيْرَ مَكْفِيٍّ وَلَا مُوَدَّعٍ وَلَا مُسْتَغْنًى عَنْهُ رَبَّنَا',
    transliteration: "Alhamdu lillahi hamdan kathiran tayyiban mubarakan fih, ghayra makfiyyin wa la muwadda'in wa la mustaghnan 'anhu Rabbana",
    english: 'Praise is to Allah, abundant, pure and blessed praise, a praise that is never cut off, never abandoned, and always needed, O our Lord.',
    source: 'Sahih Bukhari',
    isCore: true
  },

  // === TRAVEL ===
  {
    id: 'travel-1',
    category: 'travel',
    title: 'Beginning a Journey',
    titleArabic: 'بداية السفر',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: "Subhanal-ladhi sakh-khara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun",
    english: 'Glory be to Him who has subjected this to us, and we could not have done it ourselves. And to our Lord we will surely return.',
    source: 'Quran 43:13-14',
    isCore: true
  },
  {
    id: 'travel-2',
    category: 'travel',
    title: 'Traveling Supplication',
    titleArabic: 'دعاء السفر',
    arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الْأَهْلِ',
    transliteration: "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa, wa minal-'amali ma tarda, Allahumma hawwin 'alayna safarana hadha watwi 'anna bu'dah, Allahumma antas-sahibu fis-safar, wal-khalifatu fil-ahl",
    english: 'O Allah, we ask You on this journey for righteousness and piety, and deeds which please You. O Allah, make this journey easy for us and shorten its distance. O Allah, You are the Companion on the journey and the Guardian of the family.',
    source: 'Sahih Muslim',
    isCore: true
  },

  // === FORGIVENESS ===
  {
    id: 'forgiveness-1',
    category: 'forgiveness',
    title: 'Master of Istighfar',
    titleArabic: 'سيد الاستغفار',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bi ni'matika 'alayya, wa abu'u bi dhanbi faghfir li fa innahu la yaghfirudh-dhunuba illa anta",
    english: "O Allah, You are my Lord, there is no god but You. You created me and I am Your servant. I uphold Your covenant and promise as best I can. I seek refuge in You from the evil I have done. I acknowledge Your blessings upon me, and I admit my sins. Forgive me, for none forgives sins but You.",
    source: 'Sahih Bukhari',
    isCore: false
  },
  {
    id: 'forgiveness-2',
    category: 'forgiveness',
    title: 'Simple Istighfar',
    titleArabic: 'استغفار بسيط',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullaha-lladhi la ilaha illa huwal-Hayyul-Qayyumu wa atubu ilayh',
    english: 'I seek forgiveness from Allah, there is no god but He, the Ever-Living, the Self-Subsisting, and I repent to Him.',
    source: 'Abu Dawud, Tirmidhi',
    isCore: false
  },
  {
    id: 'forgiveness-3',
    category: 'forgiveness',
    title: 'Seeking Pardon',
    titleArabic: 'طلب العفو',
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allahumma innaka 'Afuwwun tuhibbul-'afwa fa'fu 'anni",
    english: 'O Allah, You are the Pardoner, You love to pardon, so pardon me.',
    source: 'Tirmidhi',
    isCore: false
  },
  {
    id: 'forgiveness-4',
    category: 'forgiveness',
    title: "Prophet Yunus's Dua",
    titleArabic: 'دعاء النبي يونس',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',
    english: 'There is no god but You, Glory be to You, indeed I have been among the wrongdoers.',
    source: 'Quran 21:87',
    isCore: false
  },

  // === GUIDANCE ===
  {
    id: 'guidance-1',
    category: 'guidance',
    title: 'Dua for Guidance',
    titleArabic: 'دعاء طلب الهداية',
    arabic: 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي',
    transliteration: 'Allahumma-hdini wa saddidni',
    english: 'O Allah, guide me and keep me steadfast.',
    source: 'Sahih Muslim',
    isCore: false
  },
  {
    id: 'guidance-2',
    category: 'guidance',
    title: 'Dua from Al-Fatiha',
    titleArabic: 'دعاء من الفاتحة',
    arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ، صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    transliteration: "Ihdinas-siratal-mustaqim, siratal-ladhina an'amta 'alayhim ghayril-maghdubi 'alayhim wa lad-dallin",
    english: 'Guide us to the straight path, the path of those upon whom You have bestowed favor, not of those who have earned anger or of those who have gone astray.',
    source: 'Quran 1:6-7',
    isCore: false
  },
  {
    id: 'guidance-3',
    category: 'guidance',
    title: 'Istikhara Prayer',
    titleArabic: 'دعاء الاستخارة',
    arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ',
    transliteration: "Allahumma inni astakhiruka bi'ilmik, wa astaqdiruka bi qudratik, wa as'aluka min fadlikal-'azim, fa innaka taqdiru wa la aqdir, wa ta'lamu wa la a'lam, wa anta 'allamul-ghuyub",
    english: 'O Allah, I seek Your guidance by virtue of Your knowledge, and I seek ability by virtue of Your power, and I ask You of Your great bounty. You have power, I have none. You know, I know not. You are the Knower of hidden things.',
    source: 'Sahih Bukhari',
    isCore: false
  },

  // === PROTECTION ===
  {
    id: 'protection-1',
    category: 'protection',
    title: 'Seeking Refuge',
    titleArabic: 'طلب الحماية',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'udhu bi kalimatillahit-tammat min sharri ma khalaq",
    english: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    source: 'Sahih Muslim',
    isCore: false
  },
  {
    id: 'protection-2',
    category: 'protection',
    title: 'Protection from Evil',
    titleArabic: 'الحماية من الشر',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal, wal-bukhli wal-jubn, wa dala'id-dayni wa ghalabatir-rijal",
    english: 'O Allah, I seek refuge in You from anxiety and grief, from weakness and laziness, from miserliness and cowardice, from being overcome by debt and overpowered by men.',
    source: 'Sahih Bukhari',
    isCore: false
  },

  // === GRATITUDE ===
  {
    id: 'gratitude-1',
    category: 'gratitude',
    title: 'Thanks for Blessings',
    titleArabic: 'شكر النعم',
    arabic: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    transliteration: "Allahumma ma asbaha bi min ni'matin aw bi ahadin min khalqik, faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr",
    english: 'O Allah, whatever blessing I or any of Your creation has risen upon, is from You alone, with no partner. To You is all praise and thanks.',
    source: 'Abu Dawud',
    isCore: false
  },
  {
    id: 'gratitude-2',
    category: 'gratitude',
    title: 'For Health',
    titleArabic: 'شكر الصحة',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ',
    transliteration: "Alhamdu lillahil-ladhi 'afani fi jasadi, wa radda 'alayya ruhi, wa adhina li bi dhikrih",
    english: 'Praise is to Allah who gave me health in my body, returned my soul to me, and permitted me to remember Him.',
    source: 'Tirmidhi',
    isCore: false
  },

  // === HARDSHIP ===
  {
    id: 'hardship-1',
    category: 'hardship',
    title: 'Dua for Difficulty',
    titleArabic: 'دعاء الشدة',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
    transliteration: "La ilaha illallahul-'Azimul-Halim, la ilaha illallahu Rabbul-'Arshil-'Azim, la ilaha illallahu Rabbus-samawati wa Rabbul-ardi wa Rabbul-'Arshil-Karim",
    english: 'There is no god but Allah, the Magnificent, the Forbearing. There is no god but Allah, Lord of the Magnificent Throne. There is no god but Allah, Lord of the heavens and Lord of the earth and Lord of the Noble Throne.',
    source: 'Sahih Bukhari & Muslim',
    isCore: false
  },
  {
    id: 'hardship-2',
    category: 'hardship',
    title: "Prophet's Dua in Hardship",
    titleArabic: 'دعاء النبي في الشدة',
    arabic: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ وَأَصْلِحْ لِي شَأْنِي كُلَّهُ لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: "Allahumma rahmataka arju fala takilni ila nafsi tarfata 'ayn, wa aslih li sha'ni kullahu, la ilaha illa anta",
    english: "O Allah, it is Your mercy that I hope for, so do not leave me to myself even for the blink of an eye. Rectify all my affairs for me. There is no god but You.",
    source: 'Abu Dawud',
    isCore: false
  },

  // === ANXIETY ===
  {
    id: 'anxiety-1',
    category: 'anxiety',
    title: 'Relief from Worry',
    titleArabic: 'تفريج الهم',
    arabic: 'اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ، سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ، أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلَاءَ حُزْنِي، وَذَهَابَ هَمِّي',
    transliteration: "Allahumma inni 'abduka, ibnu 'abdika, ibnu amatika, nasiyati biyadika, madin fiyya hukmuka, 'adlun fiyya qada'uka, as'aluka bi kulli ismin huwa laka, sammayta bihi nafsaka, aw anzaltahu fi kitabika, aw 'allamtahu ahadan min khalqika, aw ista'tharta bihi fi 'ilmil-ghaybi 'indaka, an taj'alal-Qur'ana rabi'a qalbi, wa nura sadri, wa jala'a huzni, wa dhahaba hammi",
    english: "O Allah, I am Your servant, son of Your servant, son of Your maidservant. My forelock is in Your hand. Your command over me is forever executed and Your decree over me is just. I ask You by every name belonging to You which You have named Yourself with, or revealed in Your Book, or taught to any of Your creation, or kept hidden in the knowledge of the Unseen with You, that You make the Quran the spring of my heart, the light of my chest, the banisher of my sadness, and the reliever of my distress.",
    source: 'Ahmad',
    isCore: false
  },
  {
    id: 'anxiety-2',
    category: 'anxiety',
    title: 'When Overwhelmed',
    titleArabic: 'عند الضيق',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: "Hasbiyallahu la ilaha illa huwa 'alayhi tawakkaltu wa huwa Rabbul-'Arshil-'Azim",
    english: 'Allah is sufficient for me. There is no god but He. In Him I put my trust, and He is the Lord of the Magnificent Throne.',
    source: 'Quran 9:129',
    isCore: false
  },

  // === HEALTH ===
  {
    id: 'health-1',
    category: 'health',
    title: 'Dua for Healing',
    titleArabic: 'دعاء الشفاء',
    arabic: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
    transliteration: "Allahumma Rabban-nas, adhhibil-ba's, ishfi antash-Shafi, la shifa'a illa shifa'uka, shifa'an la yughadiru saqama",
    english: 'O Allah, Lord of mankind, remove the harm, heal, for You are the Healer. There is no healing except Your healing, a healing that leaves no illness behind.',
    source: 'Sahih Bukhari & Muslim',
    isCore: false
  },
  {
    id: 'health-2',
    category: 'health',
    title: 'Seeking Wellness',
    titleArabic: 'طلب العافية',
    arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari, la ilaha illa anta",
    english: 'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is no god but You.',
    source: 'Abu Dawud',
    isCore: false
  },

  // === PROVISION ===
  {
    id: 'provision-1',
    category: 'provision',
    title: 'Asking for Provision',
    titleArabic: 'طلب الرزق',
    arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    transliteration: "Allahumma-kfini bi halalika 'an haramik, wa aghnini bi fadlika 'amman siwak",
    english: 'O Allah, suffice me with what is lawful against what is unlawful, and make me independent of all besides You by Your grace.',
    source: 'Tirmidhi',
    isCore: false
  },
  {
    id: 'provision-2',
    category: 'provision',
    title: 'Barakah in Provision',
    titleArabic: 'البركة في الرزق',
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي رِزْقِنَا، وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Allahumma barik lana fi rizqina, wa qina 'adhaban-nar",
    english: 'O Allah, bless us in our provision and protect us from the punishment of the Fire.',
    source: 'Tabarani',
    isCore: false
  },

  // === FAMILY ===
  {
    id: 'family-1',
    category: 'family',
    title: 'For Righteous Offspring',
    titleArabic: 'للذرية الصالحة',
    arabic: 'رَبِّ هَبْ لِي مِنْ لَدُنْكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ',
    transliteration: "Rabbi hab li min ladunka dhurriyyatan tayyibatan innaka Sami'ud-du'a",
    english: 'My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.',
    source: 'Quran 3:38',
    isCore: false
  },
  {
    id: 'family-2',
    category: 'family',
    title: 'Coolness of Eyes',
    titleArabic: 'قرة العين',
    arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama",
    english: 'Our Lord, grant us from our spouses and offspring comfort to our eyes, and make us leaders of the righteous.',
    source: 'Quran 25:74',
    isCore: false
  },

  // === KNOWLEDGE ===
  {
    id: 'knowledge-1',
    category: 'knowledge',
    title: 'Increase in Knowledge',
    titleArabic: 'طلب العلم',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: "Rabbi zidni 'ilma",
    english: 'My Lord, increase me in knowledge.',
    source: 'Quran 20:114',
    isCore: false
  },
  {
    id: 'knowledge-2',
    category: 'knowledge',
    title: 'Beneficial Knowledge',
    titleArabic: 'العلم النافع',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    transliteration: "Allahumma inni as'aluka 'ilman nafi'a, wa rizqan tayyiba, wa 'amalan mutaqabbala",
    english: 'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.',
    source: 'Ibn Majah',
    isCore: false
  },

  // === PATIENCE ===
  {
    id: 'patience-1',
    category: 'patience',
    title: 'Patience and Victory',
    titleArabic: 'الصبر والنصر',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    transliteration: "Rabbana afrigh 'alayna sabran wa thabbit aqdamana wansurna 'alal-qawmil-kafirin",
    english: 'Our Lord, pour upon us patience, make our feet firm, and give us victory over the disbelieving people.',
    source: 'Quran 2:250',
    isCore: false
  },
  {
    id: 'patience-2',
    category: 'patience',
    title: 'Steadfastness',
    titleArabic: 'الثبات',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
    transliteration: "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-Wahhab",
    english: 'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. Indeed, You are the Bestower.',
    source: 'Quran 3:8',
    isCore: false
  },

  // === SUCCESS ===
  {
    id: 'success-1',
    category: 'success',
    title: 'Good in Both Worlds',
    titleArabic: 'الحسنة في الدارين',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    english: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    source: 'Quran 2:201',
    isCore: false
  },
  {
    id: 'success-2',
    category: 'success',
    title: 'Ease in Affairs',
    titleArabic: 'تيسير الأمور',
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    transliteration: "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla",
    english: 'O Allah, nothing is easy except what You make easy. And You make difficulty easy if You wish.',
    source: 'Ibn Hibban',
    isCore: false
  }
];

/**
 * Get duas by category
 */
export function getDuasByCategory(categoryId: string): LibraryDua[] {
  return DUA_LIBRARY.filter(dua => dua.category === categoryId);
}

/**
 * Get core duas only
 */
export function getCoreDuas(): LibraryDua[] {
  return DUA_LIBRARY.filter(dua => dua.isCore);
}

/**
 * Get situational duas only
 */
export function getSituationalDuas(): LibraryDua[] {
  return DUA_LIBRARY.filter(dua => !dua.isCore);
}

/**
 * Search duas by title, Arabic, transliteration, or English
 */
export function searchDuas(query: string): LibraryDua[] {
  const lowerQuery = query.toLowerCase();
  return DUA_LIBRARY.filter(dua =>
    dua.title.toLowerCase().includes(lowerQuery) ||
    dua.arabic.includes(query) ||
    dua.transliteration.toLowerCase().includes(lowerQuery) ||
    dua.english.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): DuaCategory | undefined {
  return DUA_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get core categories
 */
export function getCoreCategories(): DuaCategory[] {
  return DUA_CATEGORIES.filter(cat => cat.isCore);
}

/**
 * Get situational categories
 */
export function getSituationalCategories(): DuaCategory[] {
  return DUA_CATEGORIES.filter(cat => !cat.isCore);
}
