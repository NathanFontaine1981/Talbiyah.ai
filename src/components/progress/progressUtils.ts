// Progress Utility Functions and Constants
// The Talbiyah Methodology: Understanding (Fahm) → Fluency (Itqan) → Memorization (Hifz)

// ================================
// Constants
// ================================

export const PILLARS = {
  fahm: {
    key: 'fahm',
    label: 'Understanding',
    labelArabic: 'فهم',
    description: 'Comprehend the meanings and context',
    color: 'blue',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
    borderClass: 'border-blue-200',
  },
  itqan: {
    key: 'itqan',
    label: 'Fluency',
    labelArabic: 'إتقان',
    description: 'Read with proper Tajweed and rhythm',
    color: 'emerald',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-100',
    borderClass: 'border-emerald-200',
  },
  hifz: {
    key: 'hifz',
    label: 'Memorization',
    labelArabic: 'حفظ',
    description: 'Commit to memory for life',
    color: 'purple',
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-100',
    borderClass: 'border-purple-200',
  },
} as const;

export type PillarKey = keyof typeof PILLARS;

// Surah data for Juz Amma
export const SURAHS = {
  1: { name: 'Al-Fatiha', nameArabic: 'الفاتحة', ayat: 7, juz: 1 },
  78: { name: 'An-Naba', nameArabic: 'النبأ', ayat: 40, juz: 30 },
  79: { name: 'An-Naziat', nameArabic: 'النازعات', ayat: 46, juz: 30 },
  80: { name: 'Abasa', nameArabic: 'عبس', ayat: 42, juz: 30 },
  81: { name: 'At-Takwir', nameArabic: 'التكوير', ayat: 29, juz: 30 },
  82: { name: 'Al-Infitar', nameArabic: 'الانفطار', ayat: 19, juz: 30 },
  83: { name: 'Al-Mutaffifin', nameArabic: 'المطففين', ayat: 36, juz: 30 },
  84: { name: 'Al-Inshiqaq', nameArabic: 'الانشقاق', ayat: 25, juz: 30 },
  85: { name: 'Al-Buruj', nameArabic: 'البروج', ayat: 22, juz: 30 },
  86: { name: 'At-Tariq', nameArabic: 'الطارق', ayat: 17, juz: 30 },
  87: { name: 'Al-Ala', nameArabic: 'الأعلى', ayat: 19, juz: 30 },
  88: { name: 'Al-Ghashiyah', nameArabic: 'الغاشية', ayat: 26, juz: 30 },
  89: { name: 'Al-Fajr', nameArabic: 'الفجر', ayat: 30, juz: 30 },
  90: { name: 'Al-Balad', nameArabic: 'البلد', ayat: 20, juz: 30 },
  91: { name: 'Ash-Shams', nameArabic: 'الشمس', ayat: 15, juz: 30 },
  92: { name: 'Al-Layl', nameArabic: 'الليل', ayat: 21, juz: 30 },
  93: { name: 'Ad-Duha', nameArabic: 'الضحى', ayat: 11, juz: 30 },
  94: { name: 'Ash-Sharh', nameArabic: 'الشرح', ayat: 8, juz: 30 },
  95: { name: 'At-Tin', nameArabic: 'التين', ayat: 8, juz: 30 },
  96: { name: 'Al-Alaq', nameArabic: 'العلق', ayat: 19, juz: 30 },
  97: { name: 'Al-Qadr', nameArabic: 'القدر', ayat: 5, juz: 30 },
  98: { name: 'Al-Bayyinah', nameArabic: 'البينة', ayat: 8, juz: 30 },
  99: { name: 'Az-Zalzalah', nameArabic: 'الزلزلة', ayat: 8, juz: 30 },
  100: { name: 'Al-Adiyat', nameArabic: 'العاديات', ayat: 11, juz: 30 },
  101: { name: 'Al-Qariah', nameArabic: 'القارعة', ayat: 11, juz: 30 },
  102: { name: 'At-Takathur', nameArabic: 'التكاثر', ayat: 8, juz: 30 },
  103: { name: 'Al-Asr', nameArabic: 'العصر', ayat: 3, juz: 30 },
  104: { name: 'Al-Humazah', nameArabic: 'الهمزة', ayat: 9, juz: 30 },
  105: { name: 'Al-Fil', nameArabic: 'الفيل', ayat: 5, juz: 30 },
  106: { name: 'Quraysh', nameArabic: 'قريش', ayat: 4, juz: 30 },
  107: { name: 'Al-Maun', nameArabic: 'الماعون', ayat: 7, juz: 30 },
  108: { name: 'Al-Kawthar', nameArabic: 'الكوثر', ayat: 3, juz: 30 },
  109: { name: 'Al-Kafirun', nameArabic: 'الكافرون', ayat: 6, juz: 30 },
  110: { name: 'An-Nasr', nameArabic: 'النصر', ayat: 3, juz: 30 },
  111: { name: 'Al-Masad', nameArabic: 'المسد', ayat: 5, juz: 30 },
  112: { name: 'Al-Ikhlas', nameArabic: 'الإخلاص', ayat: 4, juz: 30 },
  113: { name: 'Al-Falaq', nameArabic: 'الفلق', ayat: 5, juz: 30 },
  114: { name: 'An-Nas', nameArabic: 'الناس', ayat: 6, juz: 30 },
} as const;

// ================================
// Helper Functions
// ================================

/**
 * Get surah info by number
 */
export function getSurahInfo(surahNumber: number) {
  return SURAHS[surahNumber as keyof typeof SURAHS] || null;
}

/**
 * Get surah name by number
 */
export function getSurahName(surahNumber: number): string {
  const surah = getSurahInfo(surahNumber);
  return surah?.name || `Surah ${surahNumber}`;
}

/**
 * Get pillar config by key
 */
export function getPillarConfig(pillar: PillarKey | string | null) {
  if (!pillar || !(pillar in PILLARS)) return null;
  return PILLARS[pillar as PillarKey];
}

/**
 * Calculate overall progress percentage from three pillars
 */
export function calculateOverallProgress(
  fahmProgress: number,
  itqanProgress: number,
  hifzProgress: number,
  totalAyat: number
): number {
  if (totalAyat === 0) return 0;

  // Weight each pillar equally
  const fahmPercent = (fahmProgress / totalAyat) * 100;
  const itqanPercent = (itqanProgress / totalAyat) * 100;
  const hifzPercent = (hifzProgress / totalAyat) * 100;

  return Math.round((fahmPercent + itqanPercent + hifzPercent) / 3);
}

/**
 * Format hours for display
 */
export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 1) {
    return `${minutes} min`;
  }
  return `${hours.toFixed(1)}h`;
}

/**
 * Calculate learning streak (consecutive weeks with lessons)
 */
export function calculateStreak(lessonDates: Date[]): number {
  if (lessonDates.length === 0) return 0;

  const sortedDates = [...lessonDates].sort((a, b) => b.getTime() - a.getTime());
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Check if there was a lesson in the past week
  const hasRecentLesson = sortedDates.some((date) => date >= oneWeekAgo);
  if (!hasRecentLesson) return 0;

  let streak = 1;
  let checkDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 52; i++) {
    const weekStart = new Date(checkDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hasLessonInWeek = sortedDates.some(
      (date) => date >= weekStart && date < checkDate
    );

    if (hasLessonInWeek) {
      streak++;
      checkDate = weekStart;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get progress status label
 */
export function getProgressStatus(percentage: number): {
  label: string;
  color: string;
} {
  if (percentage === 0) {
    return { label: 'Not Started', color: 'gray' };
  }
  if (percentage < 25) {
    return { label: 'Just Started', color: 'blue' };
  }
  if (percentage < 50) {
    return { label: 'In Progress', color: 'blue' };
  }
  if (percentage < 75) {
    return { label: 'Good Progress', color: 'emerald' };
  }
  if (percentage < 100) {
    return { label: 'Almost There', color: 'amber' };
  }
  return { label: 'Complete', color: 'emerald' };
}

/**
 * Get milestone status config
 */
export function getMilestoneStatusConfig(status: string) {
  switch (status) {
    case 'verified':
    case 'mastered':
      return {
        label: 'Verified',
        icon: 'check-circle',
        color: 'emerald',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-600',
      };
    case 'pending_verification':
      return {
        label: 'Pending Review',
        icon: 'clock',
        color: 'amber',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-600',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        icon: 'circle',
        color: 'blue',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-600',
      };
    default:
      return {
        label: 'Not Started',
        icon: 'circle-dashed',
        color: 'gray',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-500',
      };
  }
}

/**
 * Format date for lesson display
 */
export function formatLessonDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Generate encouragement message based on progress
 */
export function getEncouragementMessage(stats: {
  totalHours: number;
  streak: number;
  milestonesVerified: number;
  ayatMemorized: number;
}): string {
  if (stats.streak >= 4) {
    return "Amazing consistency! You're building a beautiful habit of learning.";
  }
  if (stats.milestonesVerified >= 10) {
    return "Your dedication is paying off! Keep reaching for new milestones.";
  }
  if (stats.ayatMemorized >= 50) {
    return "MashaAllah! Your memorization journey is truly inspiring.";
  }
  if (stats.totalHours >= 20) {
    return "Your commitment to learning is remarkable. Keep going!";
  }
  if (stats.streak >= 2) {
    return "Great job maintaining your learning streak!";
  }
  if (stats.totalHours >= 5) {
    return "You're making wonderful progress. Every minute counts!";
  }
  return "Every journey starts with a single step. You've got this!";
}

/**
 * Calculate estimated time to complete a phase
 */
export function estimateTimeToComplete(
  remainingMilestones: number,
  averageLessonsPerMilestone: number = 2,
  lessonsPerWeek: number = 2,
  minutesPerLesson: number = 30
): string {
  const totalLessons = remainingMilestones * averageLessonsPerMilestone;
  const weeks = Math.ceil(totalLessons / lessonsPerWeek);

  if (weeks <= 1) {
    return 'This week';
  }
  if (weeks <= 4) {
    return `~${weeks} weeks`;
  }
  const months = Math.ceil(weeks / 4);
  return `~${months} month${months > 1 ? 's' : ''}`;
}
