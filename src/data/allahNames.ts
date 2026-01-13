/**
 * The 99 Beautiful Names of Allah (Al-Asma ul-Husna)
 * Each name includes Arabic text with full harakat, transliteration, meaning,
 * description, and the dua categories where this name is most appropriate.
 */

export interface AllahName {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  description: string;
  duaCategories: string[];
}

export const ALLAH_NAMES: AllahName[] = [
  {
    number: 1,
    arabic: 'الرَّحْمَٰنُ',
    transliteration: 'Ar-Rahman',
    meaning: 'The Most Gracious',
    description: 'The One who has plenty of mercy for believers and non-believers in this world and exclusively for believers in the Hereafter.',
    duaCategories: ['forgiveness', 'gratitude', 'hardship', 'morning', 'evening']
  },
  {
    number: 2,
    arabic: 'الرَّحِيمُ',
    transliteration: 'Ar-Rahim',
    meaning: 'The Most Merciful',
    description: 'The One who has plenty of mercy for the believers, especially in the Hereafter.',
    duaCategories: ['forgiveness', 'hardship', 'anxiety', 'health']
  },
  {
    number: 3,
    arabic: 'الْمَلِكُ',
    transliteration: 'Al-Malik',
    meaning: 'The King',
    description: 'The One who has complete dominion, the King of kings, the Owner of all.',
    duaCategories: ['morning', 'protection', 'success']
  },
  {
    number: 4,
    arabic: 'الْقُدُّوسُ',
    transliteration: 'Al-Quddus',
    meaning: 'The Most Holy',
    description: 'The One who is pure from any imperfection and free from any partner.',
    duaCategories: ['morning', 'forgiveness', 'gratitude']
  },
  {
    number: 5,
    arabic: 'السَّلَامُ',
    transliteration: 'As-Salam',
    meaning: 'The Source of Peace',
    description: 'The One who is free from every imperfection and grants peace and security.',
    duaCategories: ['anxiety', 'protection', 'evening', 'sleep']
  },
  {
    number: 6,
    arabic: 'الْمُؤْمِنُ',
    transliteration: "Al-Mu'min",
    meaning: 'The Guardian of Faith',
    description: 'The One who witnessed for Himself that no one deserves to be worshipped but Him, and grants faith and security.',
    duaCategories: ['anxiety', 'protection', 'guidance']
  },
  {
    number: 7,
    arabic: 'الْمُهَيْمِنُ',
    transliteration: 'Al-Muhaymin',
    meaning: 'The Protector',
    description: 'The One who watches over and protects all things.',
    duaCategories: ['protection', 'sleep', 'evening', 'travel']
  },
  {
    number: 8,
    arabic: 'الْعَزِيزُ',
    transliteration: "Al-'Aziz",
    meaning: 'The Almighty',
    description: 'The One who defeats and is never defeated, the Mighty One.',
    duaCategories: ['hardship', 'patience', 'success']
  },
  {
    number: 9,
    arabic: 'الْجَبَّارُ',
    transliteration: 'Al-Jabbar',
    meaning: 'The Compeller',
    description: 'The One who mends all that is broken and restores all that is deficient.',
    duaCategories: ['hardship', 'health', 'anxiety']
  },
  {
    number: 10,
    arabic: 'الْمُتَكَبِّرُ',
    transliteration: 'Al-Mutakabbir',
    meaning: 'The Supreme',
    description: 'The One who is clear of the attributes of creatures and greater than all.',
    duaCategories: ['gratitude', 'morning']
  },
  {
    number: 11,
    arabic: 'الْخَالِقُ',
    transliteration: 'Al-Khaliq',
    meaning: 'The Creator',
    description: 'The One who brings everything from non-existence to existence.',
    duaCategories: ['gratitude', 'family', 'knowledge']
  },
  {
    number: 12,
    arabic: 'الْبَارِئُ',
    transliteration: "Al-Bari'",
    meaning: 'The Originator',
    description: 'The One who created all creatures and fashioned them.',
    duaCategories: ['gratitude', 'health']
  },
  {
    number: 13,
    arabic: 'الْمُصَوِّرُ',
    transliteration: 'Al-Musawwir',
    meaning: 'The Fashioner',
    description: 'The One who forms and shapes all creatures.',
    duaCategories: ['gratitude', 'family']
  },
  {
    number: 14,
    arabic: 'الْغَفَّارُ',
    transliteration: 'Al-Ghaffar',
    meaning: 'The Ever-Forgiving',
    description: 'The One who forgives the sins of His servants time and time again.',
    duaCategories: ['forgiveness']
  },
  {
    number: 15,
    arabic: 'الْقَهَّارُ',
    transliteration: 'Al-Qahhar',
    meaning: 'The Subduer',
    description: 'The One who has the perfect ability to overcome all things.',
    duaCategories: ['protection', 'hardship']
  },
  {
    number: 16,
    arabic: 'الْوَهَّابُ',
    transliteration: 'Al-Wahhab',
    meaning: 'The Bestower',
    description: 'The One who gives freely without expecting any return.',
    duaCategories: ['provision', 'family', 'gratitude', 'knowledge']
  },
  {
    number: 17,
    arabic: 'الرَّزَّاقُ',
    transliteration: 'Ar-Razzaq',
    meaning: 'The Provider',
    description: 'The One who sustains all of creation with all forms of provision.',
    duaCategories: ['provision', 'food', 'gratitude']
  },
  {
    number: 18,
    arabic: 'الْفَتَّاحُ',
    transliteration: 'Al-Fattah',
    meaning: 'The Opener',
    description: 'The One who opens the gates of mercy, provision, and guidance.',
    duaCategories: ['success', 'provision', 'guidance', 'knowledge', 'hardship']
  },
  {
    number: 19,
    arabic: 'الْعَلِيمُ',
    transliteration: "Al-'Alim",
    meaning: 'The All-Knowing',
    description: 'The One whose knowledge encompasses all things.',
    duaCategories: ['knowledge', 'guidance', 'forgiveness']
  },
  {
    number: 20,
    arabic: 'الْقَابِضُ',
    transliteration: 'Al-Qabid',
    meaning: 'The Withholder',
    description: 'The One who withholds provision by His wisdom.',
    duaCategories: ['patience', 'hardship']
  },
  {
    number: 21,
    arabic: 'الْبَاسِطُ',
    transliteration: 'Al-Basit',
    meaning: 'The Expander',
    description: 'The One who expands provision for whom He wills.',
    duaCategories: ['provision', 'success', 'anxiety']
  },
  {
    number: 22,
    arabic: 'الْخَافِضُ',
    transliteration: 'Al-Khafid',
    meaning: 'The Abaser',
    description: 'The One who lowers whoever He wills by His destruction.',
    duaCategories: ['patience', 'hardship']
  },
  {
    number: 23,
    arabic: 'الرَّافِعُ',
    transliteration: "Ar-Rafi'",
    meaning: 'The Exalter',
    description: 'The One who raises and elevates whom He wills.',
    duaCategories: ['success', 'guidance', 'knowledge']
  },
  {
    number: 24,
    arabic: 'الْمُعِزُّ',
    transliteration: "Al-Mu'izz",
    meaning: 'The Bestower of Honor',
    description: 'The One who gives honor to whom He wills.',
    duaCategories: ['success', 'patience']
  },
  {
    number: 25,
    arabic: 'الْمُذِلُّ',
    transliteration: 'Al-Mudhill',
    meaning: 'The Humiliator',
    description: 'The One who degrades and humiliates whoever He wills.',
    duaCategories: ['protection']
  },
  {
    number: 26,
    arabic: 'السَّمِيعُ',
    transliteration: "As-Sami'",
    meaning: 'The All-Hearing',
    description: 'The One who hears all things without any barrier.',
    duaCategories: ['travel', 'forgiveness', 'anxiety']
  },
  {
    number: 27,
    arabic: 'الْبَصِيرُ',
    transliteration: 'Al-Basir',
    meaning: 'The All-Seeing',
    description: 'The One who sees all things without any limitation.',
    duaCategories: ['forgiveness', 'guidance', 'hardship']
  },
  {
    number: 28,
    arabic: 'الْحَكَمُ',
    transliteration: 'Al-Hakam',
    meaning: 'The Judge',
    description: 'The One who judges between His creatures with justice.',
    duaCategories: ['hardship', 'patience']
  },
  {
    number: 29,
    arabic: 'الْعَدْلُ',
    transliteration: "Al-'Adl",
    meaning: 'The Just',
    description: 'The One who is absolutely just in His judgment.',
    duaCategories: ['hardship', 'patience', 'gratitude']
  },
  {
    number: 30,
    arabic: 'اللَّطِيفُ',
    transliteration: 'Al-Latif',
    meaning: 'The Subtle One',
    description: 'The One who knows the finest details and is gentle with His servants.',
    duaCategories: ['anxiety', 'hardship', 'guidance']
  },
  {
    number: 31,
    arabic: 'الْخَبِيرُ',
    transliteration: 'Al-Khabir',
    meaning: 'The All-Aware',
    description: 'The One from whom nothing is hidden, aware of innermost secrets.',
    duaCategories: ['knowledge', 'guidance', 'hardship']
  },
  {
    number: 32,
    arabic: 'الْحَلِيمُ',
    transliteration: 'Al-Halim',
    meaning: 'The Forbearing',
    description: 'The One who delays punishment and gives chance for repentance.',
    duaCategories: ['forgiveness', 'anxiety', 'patience']
  },
  {
    number: 33,
    arabic: 'الْعَظِيمُ',
    transliteration: "Al-'Azim",
    meaning: 'The Magnificent',
    description: 'The One who is greater than everything in status and attributes.',
    duaCategories: ['gratitude', 'morning', 'evening']
  },
  {
    number: 34,
    arabic: 'الْغَفُورُ',
    transliteration: 'Al-Ghafur',
    meaning: 'The Most Forgiving',
    description: 'The One who forgives extensively, covering sins and overlooking faults.',
    duaCategories: ['forgiveness']
  },
  {
    number: 35,
    arabic: 'الشَّكُورُ',
    transliteration: 'Ash-Shakur',
    meaning: 'The Most Appreciative',
    description: 'The One who appreciates the small deeds and gives great rewards.',
    duaCategories: ['gratitude', 'food', 'provision']
  },
  {
    number: 36,
    arabic: 'الْعَلِيُّ',
    transliteration: "Al-'Aliyy",
    meaning: 'The Most High',
    description: 'The One who is above and beyond everything.',
    duaCategories: ['gratitude', 'morning']
  },
  {
    number: 37,
    arabic: 'الْكَبِيرُ',
    transliteration: 'Al-Kabir',
    meaning: 'The Most Great',
    description: 'The One who is greater than everything in His essence and attributes.',
    duaCategories: ['gratitude', 'morning', 'evening']
  },
  {
    number: 38,
    arabic: 'الْحَفِيظُ',
    transliteration: 'Al-Hafiz',
    meaning: 'The Preserver',
    description: 'The One who protects and preserves all things.',
    duaCategories: ['protection', 'travel', 'sleep']
  },
  {
    number: 39,
    arabic: 'الْمُقِيتُ',
    transliteration: 'Al-Muqit',
    meaning: 'The Sustainer',
    description: 'The One who sustains and maintains all creation.',
    duaCategories: ['provision', 'food']
  },
  {
    number: 40,
    arabic: 'الْحَسِيبُ',
    transliteration: 'Al-Hasib',
    meaning: 'The Reckoner',
    description: 'The One who gives sufficient attention to every detail.',
    duaCategories: ['hardship', 'protection']
  },
  {
    number: 41,
    arabic: 'الْجَلِيلُ',
    transliteration: 'Al-Jalil',
    meaning: 'The Majestic',
    description: 'The One who is attributed with greatness and majesty.',
    duaCategories: ['gratitude', 'morning']
  },
  {
    number: 42,
    arabic: 'الْكَرِيمُ',
    transliteration: 'Al-Karim',
    meaning: 'The Most Generous',
    description: 'The One who gives abundantly without being asked.',
    duaCategories: ['provision', 'forgiveness', 'family', 'food']
  },
  {
    number: 43,
    arabic: 'الرَّقِيبُ',
    transliteration: 'Ar-Raqib',
    meaning: 'The Watchful',
    description: 'The One who watches over His creation constantly.',
    duaCategories: ['forgiveness', 'guidance']
  },
  {
    number: 44,
    arabic: 'الْمُجِيبُ',
    transliteration: 'Al-Mujib',
    meaning: 'The Responsive',
    description: 'The One who responds to supplications.',
    duaCategories: ['hardship', 'anxiety', 'forgiveness']
  },
  {
    number: 45,
    arabic: 'الْوَاسِعُ',
    transliteration: "Al-Wasi'",
    meaning: 'The All-Encompassing',
    description: 'The One whose mercy and knowledge encompasses all things.',
    duaCategories: ['provision', 'forgiveness', 'knowledge']
  },
  {
    number: 46,
    arabic: 'الْحَكِيمُ',
    transliteration: 'Al-Hakim',
    meaning: 'The All-Wise',
    description: 'The One who possesses perfect wisdom in all matters.',
    duaCategories: ['guidance', 'knowledge', 'patience']
  },
  {
    number: 47,
    arabic: 'الْوَدُودُ',
    transliteration: 'Al-Wadud',
    meaning: 'The Most Loving',
    description: 'The One who loves His righteous servants.',
    duaCategories: ['family', 'gratitude', 'forgiveness']
  },
  {
    number: 48,
    arabic: 'الْمَجِيدُ',
    transliteration: 'Al-Majid',
    meaning: 'The Most Glorious',
    description: 'The One who is glorious in His actions and attributes.',
    duaCategories: ['gratitude', 'morning']
  },
  {
    number: 49,
    arabic: 'الْبَاعِثُ',
    transliteration: "Al-Ba'ith",
    meaning: 'The Resurrector',
    description: 'The One who will resurrect all creation on the Day of Judgment.',
    duaCategories: ['waking', 'forgiveness']
  },
  {
    number: 50,
    arabic: 'الشَّهِيدُ',
    transliteration: 'Ash-Shahid',
    meaning: 'The Witness',
    description: 'The One who witnesses all things.',
    duaCategories: ['forgiveness', 'hardship']
  },
  {
    number: 51,
    arabic: 'الْحَقُّ',
    transliteration: 'Al-Haqq',
    meaning: 'The Truth',
    description: 'The One who is the absolute truth.',
    duaCategories: ['guidance', 'knowledge', 'patience']
  },
  {
    number: 52,
    arabic: 'الْوَكِيلُ',
    transliteration: 'Al-Wakil',
    meaning: 'The Trustee',
    description: 'The One who can be relied upon for all matters.',
    duaCategories: ['hardship', 'sleep', 'anxiety', 'travel']
  },
  {
    number: 53,
    arabic: 'الْقَوِيُّ',
    transliteration: 'Al-Qawiyy',
    meaning: 'The Strong',
    description: 'The One who possesses ultimate strength.',
    duaCategories: ['patience', 'hardship', 'protection']
  },
  {
    number: 54,
    arabic: 'الْمَتِينُ',
    transliteration: 'Al-Matin',
    meaning: 'The Firm',
    description: 'The One who is firm and whose strength is forever.',
    duaCategories: ['patience', 'hardship']
  },
  {
    number: 55,
    arabic: 'الْوَلِيُّ',
    transliteration: 'Al-Waliyy',
    meaning: 'The Protecting Friend',
    description: 'The One who is the supporter and protector of the believers.',
    duaCategories: ['protection', 'travel', 'guidance']
  },
  {
    number: 56,
    arabic: 'الْحَمِيدُ',
    transliteration: 'Al-Hamid',
    meaning: 'The Praiseworthy',
    description: 'The One who deserves all praise.',
    duaCategories: ['gratitude', 'morning', 'evening']
  },
  {
    number: 57,
    arabic: 'الْمُحْصِي',
    transliteration: 'Al-Muhsi',
    meaning: 'The Counter',
    description: 'The One who keeps count of all things.',
    duaCategories: ['knowledge', 'forgiveness']
  },
  {
    number: 58,
    arabic: 'الْمُبْدِئُ',
    transliteration: "Al-Mubdi'",
    meaning: 'The Originator',
    description: 'The One who started all creation.',
    duaCategories: ['gratitude', 'waking']
  },
  {
    number: 59,
    arabic: 'الْمُعِيدُ',
    transliteration: "Al-Mu'id",
    meaning: 'The Restorer',
    description: 'The One who will restore all creation.',
    duaCategories: ['health', 'hardship']
  },
  {
    number: 60,
    arabic: 'الْمُحْيِي',
    transliteration: 'Al-Muhyi',
    meaning: 'The Giver of Life',
    description: 'The One who gives life.',
    duaCategories: ['health', 'waking', 'family']
  },
  {
    number: 61,
    arabic: 'الْمُمِيتُ',
    transliteration: 'Al-Mumit',
    meaning: 'The Taker of Life',
    description: 'The One who causes death.',
    duaCategories: ['sleep', 'patience']
  },
  {
    number: 62,
    arabic: 'الْحَيُّ',
    transliteration: 'Al-Hayy',
    meaning: 'The Ever-Living',
    description: 'The One who is eternally alive.',
    duaCategories: ['waking', 'morning', 'hardship']
  },
  {
    number: 63,
    arabic: 'الْقَيُّومُ',
    transliteration: 'Al-Qayyum',
    meaning: 'The Self-Sustaining',
    description: 'The One who sustains and maintains all things.',
    duaCategories: ['waking', 'morning', 'hardship', 'anxiety']
  },
  {
    number: 64,
    arabic: 'الْوَاجِدُ',
    transliteration: 'Al-Wajid',
    meaning: 'The Finder',
    description: 'The One who finds whatever He wishes.',
    duaCategories: ['provision', 'success']
  },
  {
    number: 65,
    arabic: 'الْمَاجِدُ',
    transliteration: 'Al-Majid',
    meaning: 'The Noble',
    description: 'The One who is noble and generous.',
    duaCategories: ['gratitude', 'provision']
  },
  {
    number: 66,
    arabic: 'الْوَاحِدُ',
    transliteration: 'Al-Wahid',
    meaning: 'The One',
    description: 'The One who has no partner.',
    duaCategories: ['morning', 'evening', 'guidance']
  },
  {
    number: 67,
    arabic: 'الْأَحَدُ',
    transliteration: 'Al-Ahad',
    meaning: 'The Unique',
    description: 'The One who is unique and indivisible.',
    duaCategories: ['morning', 'evening', 'guidance']
  },
  {
    number: 68,
    arabic: 'الصَّمَدُ',
    transliteration: 'As-Samad',
    meaning: 'The Eternal',
    description: 'The One who everything depends on, yet He depends on none.',
    duaCategories: ['hardship', 'protection', 'morning', 'evening']
  },
  {
    number: 69,
    arabic: 'الْقَادِرُ',
    transliteration: 'Al-Qadir',
    meaning: 'The All-Powerful',
    description: 'The One who has power over all things.',
    duaCategories: ['health', 'hardship', 'patience']
  },
  {
    number: 70,
    arabic: 'الْمُقْتَدِرُ',
    transliteration: 'Al-Muqtadir',
    meaning: 'The All-Determiner',
    description: 'The One whose power is absolute.',
    duaCategories: ['hardship', 'success']
  },
  {
    number: 71,
    arabic: 'الْمُقَدِّمُ',
    transliteration: 'Al-Muqaddim',
    meaning: 'The Expediter',
    description: 'The One who brings forward whom He wills.',
    duaCategories: ['success', 'guidance']
  },
  {
    number: 72,
    arabic: 'الْمُؤَخِّرُ',
    transliteration: "Al-Mu'akhkhir",
    meaning: 'The Delayer',
    description: 'The One who puts back whom He wills.',
    duaCategories: ['patience', 'guidance']
  },
  {
    number: 73,
    arabic: 'الْأَوَّلُ',
    transliteration: 'Al-Awwal',
    meaning: 'The First',
    description: 'The One who was before everything.',
    duaCategories: ['morning', 'gratitude']
  },
  {
    number: 74,
    arabic: 'الْآخِرُ',
    transliteration: 'Al-Akhir',
    meaning: 'The Last',
    description: 'The One who will remain after all else.',
    duaCategories: ['evening', 'sleep']
  },
  {
    number: 75,
    arabic: 'الظَّاهِرُ',
    transliteration: 'Az-Zahir',
    meaning: 'The Manifest',
    description: 'The One whose existence is evident through His creation.',
    duaCategories: ['guidance', 'knowledge']
  },
  {
    number: 76,
    arabic: 'الْبَاطِنُ',
    transliteration: 'Al-Batin',
    meaning: 'The Hidden',
    description: 'The One whose essence cannot be perceived.',
    duaCategories: ['knowledge', 'guidance']
  },
  {
    number: 77,
    arabic: 'الْوَالِي',
    transliteration: 'Al-Wali',
    meaning: 'The Governor',
    description: 'The One who manages and governs all affairs.',
    duaCategories: ['guidance', 'success']
  },
  {
    number: 78,
    arabic: 'الْمُتَعَالِي',
    transliteration: "Al-Muta'ali",
    meaning: 'The Most Exalted',
    description: 'The One who is exalted beyond imagination.',
    duaCategories: ['gratitude', 'morning']
  },
  {
    number: 79,
    arabic: 'الْبَرُّ',
    transliteration: 'Al-Barr',
    meaning: 'The Source of Goodness',
    description: 'The One who is kind and treats creation with goodness.',
    duaCategories: ['family', 'gratitude', 'forgiveness']
  },
  {
    number: 80,
    arabic: 'التَّوَّابُ',
    transliteration: 'At-Tawwab',
    meaning: 'The Acceptor of Repentance',
    description: 'The One who accepts repentance and forgives.',
    duaCategories: ['forgiveness']
  },
  {
    number: 81,
    arabic: 'الْمُنْتَقِمُ',
    transliteration: 'Al-Muntaqim',
    meaning: 'The Avenger',
    description: 'The One who justly punishes wrongdoers.',
    duaCategories: ['hardship', 'patience']
  },
  {
    number: 82,
    arabic: 'الْعَفُوُّ',
    transliteration: "Al-'Afuww",
    meaning: 'The Pardoner',
    description: 'The One who pardons and erases sins completely.',
    duaCategories: ['forgiveness']
  },
  {
    number: 83,
    arabic: 'الرَّؤُوفُ',
    transliteration: "Ar-Ra'uf",
    meaning: 'The Most Kind',
    description: 'The One who shows tender compassion.',
    duaCategories: ['anxiety', 'family', 'health']
  },
  {
    number: 84,
    arabic: 'مَالِكُ الْمُلْكِ',
    transliteration: 'Malik al-Mulk',
    meaning: 'Owner of Sovereignty',
    description: 'The One who has absolute authority over all dominion.',
    duaCategories: ['gratitude', 'success']
  },
  {
    number: 85,
    arabic: 'ذُو الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Dhul-Jalali wal-Ikram',
    meaning: 'Lord of Majesty and Bounty',
    description: 'The One who possesses both majesty and generosity.',
    duaCategories: ['gratitude', 'morning', 'evening']
  },
  {
    number: 86,
    arabic: 'الْمُقْسِطُ',
    transliteration: 'Al-Muqsit',
    meaning: 'The Equitable',
    description: 'The One who acts with justice and equity.',
    duaCategories: ['hardship', 'patience']
  },
  {
    number: 87,
    arabic: 'الْجَامِعُ',
    transliteration: "Al-Jami'",
    meaning: 'The Gatherer',
    description: 'The One who gathers all creation.',
    duaCategories: ['family', 'guidance']
  },
  {
    number: 88,
    arabic: 'الْغَنِيُّ',
    transliteration: 'Al-Ghaniyy',
    meaning: 'The Self-Sufficient',
    description: 'The One who needs nothing and is free of all needs.',
    duaCategories: ['provision', 'gratitude']
  },
  {
    number: 89,
    arabic: 'الْمُغْنِي',
    transliteration: 'Al-Mughni',
    meaning: 'The Enricher',
    description: 'The One who enriches whom He wills.',
    duaCategories: ['provision', 'success']
  },
  {
    number: 90,
    arabic: 'الْمَانِعُ',
    transliteration: "Al-Mani'",
    meaning: 'The Withholder',
    description: 'The One who prevents harm and withholds by His wisdom.',
    duaCategories: ['protection', 'patience']
  },
  {
    number: 91,
    arabic: 'الضَّارُّ',
    transliteration: 'Ad-Darr',
    meaning: 'The Distresser',
    description: 'The One who can cause harm by His will.',
    duaCategories: ['patience', 'protection']
  },
  {
    number: 92,
    arabic: 'النَّافِعُ',
    transliteration: "An-Nafi'",
    meaning: 'The Propitious',
    description: 'The One who benefits and provides advantage.',
    duaCategories: ['health', 'knowledge', 'success']
  },
  {
    number: 93,
    arabic: 'النُّورُ',
    transliteration: 'An-Nur',
    meaning: 'The Light',
    description: 'The One who illuminates and guides.',
    duaCategories: ['guidance', 'knowledge']
  },
  {
    number: 94,
    arabic: 'الْهَادِي',
    transliteration: 'Al-Hadi',
    meaning: 'The Guide',
    description: 'The One who guides to the right path.',
    duaCategories: ['guidance', 'knowledge', 'success']
  },
  {
    number: 95,
    arabic: 'الْبَدِيعُ',
    transliteration: "Al-Badi'",
    meaning: 'The Originator',
    description: 'The One who creates in wonderful ways.',
    duaCategories: ['gratitude', 'knowledge']
  },
  {
    number: 96,
    arabic: 'الْبَاقِي',
    transliteration: 'Al-Baqi',
    meaning: 'The Everlasting',
    description: 'The One whose existence has no end.',
    duaCategories: ['evening', 'sleep', 'patience']
  },
  {
    number: 97,
    arabic: 'الْوَارِثُ',
    transliteration: 'Al-Warith',
    meaning: 'The Inheritor',
    description: 'The One who remains after all passes away.',
    duaCategories: ['family', 'patience']
  },
  {
    number: 98,
    arabic: 'الرَّشِيدُ',
    transliteration: 'Ar-Rashid',
    meaning: 'The Guide to the Right Path',
    description: 'The One who guides rightly and directs to success.',
    duaCategories: ['guidance', 'success', 'patience']
  },
  {
    number: 99,
    arabic: 'الصَّبُورُ',
    transliteration: 'As-Sabur',
    meaning: 'The Patient',
    description: 'The One who is most patient and delays punishment.',
    duaCategories: ['patience', 'forgiveness', 'hardship']
  }
];

/**
 * Get Names of Allah that are most appropriate for a specific dua category
 */
export function getNamesByCategory(category: string): AllahName[] {
  return ALLAH_NAMES.filter(name => name.duaCategories.includes(category));
}

/**
 * Search Names of Allah by transliteration, meaning, or description
 */
export function searchNames(query: string): AllahName[] {
  const lowerQuery = query.toLowerCase();
  return ALLAH_NAMES.filter(name =>
    name.transliteration.toLowerCase().includes(lowerQuery) ||
    name.meaning.toLowerCase().includes(lowerQuery) ||
    name.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get a Name of Allah by number (1-99)
 */
export function getNameByNumber(num: number): AllahName | undefined {
  return ALLAH_NAMES.find(name => name.number === num);
}
