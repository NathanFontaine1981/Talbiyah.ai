export interface LetterForms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

export interface AlphabetLetter {
  id: number;
  glyph: string;
  connects: boolean; // false for the 6 letters that never join to the one after them
  name: string;
  translit: string;
  sound: string;
  exampleArabic: string;
  exampleTranslit: string;
  exampleEnglish: string;
  forms: LetterForms;
}

const TATWEEL = 'ـ'; // joins on both sides - used to show a connecting letter's shape in isolation

function buildForms(glyph: string, connects: boolean): LetterForms {
  if (connects) {
    return {
      isolated: glyph,
      initial: glyph + TATWEEL,
      medial: TATWEEL + glyph + TATWEEL,
      final: TATWEEL + glyph,
    };
  }
  return {
    isolated: glyph,
    initial: glyph,
    medial: TATWEEL + glyph,
    final: TATWEEL + glyph,
  };
}

// [glyph, connects, name, transliteration, sound guide, example word, example transliteration, example meaning]
const RAW: [string, boolean, string, string, string, string, string, string][] = [
  ['ا', true, 'Alif', 'a / ā', 'Starts with a catch in the throat, like the pause in "uh-oh" - then can stretch into a long "aa".', 'ٱللّٰه', 'Allāh', 'Allah'],
  ['ب', true, "Bā'", 'b', 'Like the b in "boy".', 'بَيْت', 'bayt', 'house'],
  ['ت', true, "Tā'", 't', 'Like the t in "top", tongue just behind the teeth.', 'تَمْر', 'tamr', 'dates'],
  ['ث', true, "Thā'", 'th', 'Like th in "think".', 'ثَوْب', 'thawb', 'garment'],
  ['ج', true, 'Jīm', 'j', 'Like the j in "jam".', 'جَنَّة', 'jannah', 'paradise'],
  ['ح', true, "Ḥā'", 'ḥ', 'A breathy h from the middle of the throat - stronger than the English h.', 'حَلَال', 'ḥalāl', 'permissible'],
  ['خ', true, "Khā'", 'kh', 'Like ch in the Scottish "loch".', 'خُبْز', 'khubz', 'bread'],
  ['د', false, 'Dāl', 'd', 'Like the d in "dog".', 'دُعَاء', "du'ā'", 'supplication'],
  ['ذ', false, 'Dhāl', 'dh', 'Like th in "this".', 'ذِكْر', 'dhikr', 'remembrance'],
  ['ر', false, "Rā'", 'r', 'A rolled or tapped r, like Spanish r.', 'رَمَضَان', 'Ramaḍān', 'Ramadan'],
  ['ز', false, 'Zāy', 'z', 'Like the z in "zoo".', 'زَيْت', 'zayt', 'oil'],
  ['س', true, 'Sīn', 's', 'Like the s in "sun".', 'سَلَام', 'salām', 'peace'],
  ['ش', true, 'Shīn', 'sh', 'Like sh in "shoe".', 'شَمْس', 'shams', 'sun'],
  ['ص', true, 'Ṣād', 'ṣ', 'A heavier, deeper s - pull the tongue back a little.', 'صَلَاة', 'ṣalāh', 'prayer'],
  ['ض', true, 'Ḍād', 'ḍ', 'A heavy d unique to Arabic - press the side of the tongue to the back teeth.', 'ضَيْف', 'ḍayf', 'guest'],
  ['ط', true, "Ṭā'", 'ṭ', 'A heavier, deeper t than ت.', 'طَعَام', "ṭa'ām", 'food'],
  ['ظ', true, "Ẓā'", 'ẓ', 'A heavy version of th (like "this", but deeper).', 'ظُهْر', 'ẓuhr', 'midday prayer'],
  ['ع', true, "'Ayn", "'", 'A tight, deep sound from the throat with no English equivalent - best learned by ear from a teacher.', 'عِيد', "'Īd", 'Eid'],
  ['غ', true, 'Ghayn', 'gh', 'A gargled sound, like a soft French r.', 'غَيْم', 'ghaym', 'cloud'],
  ['ف', true, "Fā'", 'f', 'Like the f in "fun".', 'فَجْر', 'fajr', 'dawn prayer'],
  ['ق', true, 'Qāf', 'q', 'A deep k made from the very back of the throat.', 'قُرْآن', "Qur'ān", 'the Qur’an'],
  ['ك', true, 'Kāf', 'k', 'Like the k in "kite".', 'كِتَاب', 'kitāb', 'book'],
  ['ل', true, 'Lām', 'l', 'Like the l in "lamp".', 'لَيْل', 'layl', 'night'],
  ['م', true, 'Mīm', 'm', 'Like the m in "moon".', 'مَسْجِد', 'masjid', 'mosque'],
  ['ن', true, 'Nūn', 'n', 'Like the n in "nice".', 'نُور', 'nūr', 'light'],
  ['ه', true, "Hā'", 'h', 'Like the h in "hat" - softer than ح.', 'هِلَال', 'hilāl', 'crescent moon'],
  ['و', false, 'Wāw', 'w', 'Like the w in "wow" - can also stretch into a long "oo".', 'وُضُوء', "wuḍū'", 'ablution'],
  ['ي', true, "Yā'", 'y', 'Like the y in "yes" - can also stretch into a long "ee".', 'يَوْم', 'yawm', 'day'],
];

export const ALPHABET_LETTERS: AlphabetLetter[] = RAW.map((r, i) => ({
  id: i,
  glyph: r[0],
  connects: r[1],
  name: r[2],
  translit: r[3],
  sound: r[4],
  exampleArabic: r[5],
  exampleTranslit: r[6],
  exampleEnglish: r[7],
  forms: buildForms(r[0], r[1]),
}));

export const TOTAL_LETTERS = ALPHABET_LETTERS.length;
