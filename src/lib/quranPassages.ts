import { SURAH_AYAH_COUNTS } from './quranData';

export interface PassageUnit {
  surah: number;
  surahName: string;
  surahNameArabic: string;
  startAyah: number;
  endAyah: number;
  passageLabel: string; // "Ayahs 1–141" or "" for whole surah
}

// Juz boundaries flattened from JUZ_RANGES in QuranProgress.tsx
// Each tuple: [surah, startAyah, endAyah]
// Surahs that span multiple juz appear multiple times with different ranges.
const JUZ_SURAH_RANGES: [number, number, number][] = [
  // Juz 1
  [1, 1, 7], [2, 1, 141],
  // Juz 2
  [2, 142, 252],
  // Juz 3
  [2, 253, 286], [3, 1, 92],
  // Juz 4
  [3, 93, 200], [4, 1, 23],
  // Juz 5
  [4, 24, 147],
  // Juz 6
  [4, 148, 176], [5, 1, 81],
  // Juz 7
  [5, 82, 120], [6, 1, 110],
  // Juz 8
  [6, 111, 165], [7, 1, 87],
  // Juz 9
  [7, 88, 206], [8, 1, 40],
  // Juz 10
  [8, 41, 75], [9, 1, 92],
  // Juz 11
  [9, 93, 129], [10, 1, 109], [11, 1, 5],
  // Juz 12
  [11, 6, 123], [12, 1, 52],
  // Juz 13
  [12, 53, 111], [13, 1, 43], [14, 1, 52],
  // Juz 14
  [15, 1, 99], [16, 1, 128],
  // Juz 15
  [17, 1, 111], [18, 1, 74],
  // Juz 16
  [18, 75, 110], [19, 1, 98], [20, 1, 135],
  // Juz 17
  [21, 1, 112], [22, 1, 78],
  // Juz 18
  [23, 1, 118], [24, 1, 64], [25, 1, 20],
  // Juz 19
  [25, 21, 77], [26, 1, 227], [27, 1, 55],
  // Juz 20
  [27, 56, 93], [28, 1, 88], [29, 1, 45],
  // Juz 21
  [29, 46, 69], [30, 1, 60], [31, 1, 34], [32, 1, 30], [33, 1, 30],
  // Juz 22
  [33, 31, 73], [34, 1, 54], [35, 1, 45], [36, 1, 27],
  // Juz 23
  [36, 28, 83], [37, 1, 182], [38, 1, 88], [39, 1, 31],
  // Juz 24
  [39, 32, 75], [40, 1, 85], [41, 1, 46],
  // Juz 25
  [41, 47, 54], [42, 1, 53], [43, 1, 89], [44, 1, 59], [45, 1, 37],
  // Juz 26
  [46, 1, 35], [47, 1, 38], [48, 1, 29], [49, 1, 18], [50, 1, 45], [51, 1, 30],
  // Juz 27
  [51, 31, 60], [52, 1, 49], [53, 1, 62], [54, 1, 55], [55, 1, 78], [56, 1, 96], [57, 1, 29],
  // Juz 28
  [58, 1, 22], [59, 1, 24], [60, 1, 13], [61, 1, 14], [62, 1, 11], [63, 1, 11], [64, 1, 18], [65, 1, 12], [66, 1, 12],
  // Juz 29
  [67, 1, 30], [68, 1, 52], [69, 1, 52], [70, 1, 44], [71, 1, 28], [72, 1, 28], [73, 1, 20], [74, 1, 56], [75, 1, 40], [76, 1, 31], [77, 1, 50],
  // Juz 30
  [78, 1, 40], [79, 1, 46], [80, 1, 42], [81, 1, 29], [82, 1, 19], [83, 1, 36], [84, 1, 25], [85, 1, 22], [86, 1, 17], [87, 1, 19], [88, 1, 26], [89, 1, 30], [90, 1, 20], [91, 1, 15], [92, 1, 21], [93, 1, 11], [94, 1, 8], [95, 1, 8], [96, 1, 19], [97, 1, 5], [98, 1, 8], [99, 1, 8], [100, 1, 11], [101, 1, 11], [102, 1, 8], [103, 1, 3], [104, 1, 9], [105, 1, 5], [106, 1, 4], [107, 1, 7], [108, 1, 3], [109, 1, 6], [110, 1, 3], [111, 1, 5], [112, 1, 4], [113, 1, 5], [114, 1, 6],
];

/**
 * Convert a list of memorized surah numbers into a flat list of reviewable passages.
 * Long surahs that span multiple juz are split at juz boundaries.
 * Short surahs that fit within one juz stay as single units.
 */
export function buildPassageList(
  memorizedSurahs: number[],
  surahNames: Record<number, { english: string; arabic: string }>
): PassageUnit[] {
  const passages: PassageUnit[] = [];

  for (const surahNum of memorizedSurahs) {
    const totalAyahs = SURAH_AYAH_COUNTS[surahNum] || 7;

    // Find all juz ranges for this surah
    const ranges = JUZ_SURAH_RANGES.filter(([s]) => s === surahNum);

    if (ranges.length <= 1) {
      // Whole surah is one passage
      passages.push({
        surah: surahNum,
        surahName: surahNames[surahNum]?.english || `Surah ${surahNum}`,
        surahNameArabic: surahNames[surahNum]?.arabic || '',
        startAyah: 1,
        endAyah: totalAyahs,
        passageLabel: '',
      });
    } else {
      // Split surah at juz boundaries
      for (const [, start, end] of ranges) {
        passages.push({
          surah: surahNum,
          surahName: surahNames[surahNum]?.english || `Surah ${surahNum}`,
          surahNameArabic: surahNames[surahNum]?.arabic || '',
          startAyah: start,
          endAyah: end,
          passageLabel: `Ayahs ${start}\u2013${end}`,
        });
      }
    }
  }

  return passages;
}
