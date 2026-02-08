// Unshakable Foundations - Category Definitions
// These match the database seeded categories

export interface FoundationCategory {
  id?: string;
  slug: string;
  name: string;
  arabicName: string;
  description: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
  isComingSoon: boolean;
  color: string; // Tailwind color for theming
  gradient: string; // Gradient classes for cards
  audioUrl?: string; // Spotify or podcast link for audio version
}

export interface FoundationVideo {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  videoUrl: string;
  videoId?: string; // YouTube video ID
  thumbnailUrl?: string;
  durationMinutes?: number;
  transcript?: string;
  transcriptSource?: 'youtube_auto' | 'manual';
  orderIndex: number;
  isActive: boolean;
}

export interface FoundationExam {
  id: string;
  videoId: string;
  questions: ExamQuestion[];
  passingScore: number;
  generatedBy: 'ai' | 'manual';
}

export interface ExamQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation: string;
}

export interface FoundationProgress {
  videoId: string;
  watched: boolean;
  watchedAt?: string;
  examScore?: number;
  examPassed: boolean;
  examPassedAt?: string;
  attempts: number;
}

// Static category data for UI (before DB fetch)
// These are categories within the 6 Pillars
export const FOUNDATION_CATEGORIES: FoundationCategory[] = [
  // Pillar 1: Allah
  {
    slug: 'tawheed',
    name: 'Tawheed',
    arabicName: 'التوحيد',
    description: 'Understanding who Allah is - the foundation of everything.',
    icon: 'Sun',
    orderIndex: 1,
    isActive: true,
    isComingSoon: false,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    slug: 'names-of-allah',
    name: '99 Names of Allah',
    arabicName: 'أسماء الله الحسنى',
    description: 'Learn the beautiful names and attributes of your Creator.',
    icon: 'Star',
    orderIndex: 2,
    isActive: true,
    isComingSoon: false,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600'
  },
  // Pillar 2: Muhammad ﷺ
  {
    slug: 'seerah-meccan',
    name: 'Meccan Period',
    arabicName: 'العهد المكي',
    description: 'The early years of revelation and persecution.',
    icon: 'Moon',
    orderIndex: 1,
    isActive: true,
    isComingSoon: true,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    audioUrl: 'https://open.spotify.com/show/3cHN4rbGsV0L2GNtieT99c'
  },
  {
    slug: 'seerah-medinan',
    name: 'Medinan Period',
    arabicName: 'العهد المدني',
    description: 'The establishment of the Islamic state.',
    icon: 'Moon',
    orderIndex: 2,
    isActive: true,
    isComingSoon: true,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    audioUrl: 'https://open.spotify.com/show/3cHN4rbGsV0L2GNtieT99c'
  },
  // Pillar 3: Prophets
  {
    slug: 'lives-of-prophets',
    name: 'Lives of the Prophets',
    arabicName: 'قصص الأنبياء',
    description: 'The inspiring stories from Allah\'s messengers.',
    icon: 'BookOpen',
    orderIndex: 1,
    isActive: true,
    isComingSoon: true,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    audioUrl: 'https://open.spotify.com/playlist/53naeAXtGSAhTGSArju0qW'
  },
  // Pillar 4: Angels
  {
    slug: 'angels-series',
    name: 'The Angels',
    arabicName: 'الملائكة',
    description: 'Understanding the noble servants of Allah.',
    icon: 'Sparkles',
    orderIndex: 1,
    isActive: true,
    isComingSoon: true,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600'
  },
  // Pillar 5: Hereafter
  {
    slug: 'hereafter-series',
    name: 'The Hereafter',
    arabicName: 'الآخرة',
    description: 'Day of Judgment, Paradise, Hell, and life after death.',
    icon: 'Scale',
    orderIndex: 1,
    isActive: true,
    isComingSoon: true,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600'
  },
  // Pillar 6: History
  {
    slug: 'history-of-islam',
    name: 'History of Islam',
    arabicName: 'تاريخ الإسلام',
    description: 'The golden age of Islamic civilization.',
    icon: 'Landmark',
    orderIndex: 1,
    isActive: true,
    isComingSoon: true,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600'
  }
];

// Standalone sections (not part of Unshakable Foundations)
export const STANDALONE_SECTIONS: FoundationCategory[] = [
  {
    slug: 'how-to-pray',
    name: 'How to Pray',
    arabicName: 'كيفية الصلاة',
    description: 'Learn the physical movements and words of the five daily prayers.',
    icon: 'Moon',
    orderIndex: 1,
    isActive: true,
    isComingSoon: false,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    slug: 'fiqh-basics',
    name: 'Fiqh Basics',
    arabicName: 'أساسيات الفقه',
    description: 'The five pillars, wudu, fasting, and essential rulings.',
    icon: 'Scale',
    orderIndex: 2,
    isActive: true,
    isComingSoon: true,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600'
  },
  {
    slug: 'arabic-foundations',
    name: 'Arabic Foundations',
    arabicName: 'أساسيات العربية',
    description: 'Basic Arabic to help you connect with the Quran directly.',
    icon: 'Languages',
    orderIndex: 3,
    isActive: true,
    isComingSoon: true,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600'
  }
];

// localStorage key for anonymous progress
export const FOUNDATION_PROGRESS_KEY = 'talbiyah_foundation_progress';

// Default local progress structure
export interface LocalFoundationProgress {
  watchedVideos: string[];
  passedExams: string[];
  examScores: Record<string, number>;
  lastUpdated: string;
}

export const DEFAULT_LOCAL_PROGRESS: LocalFoundationProgress = {
  watchedVideos: [],
  passedExams: [],
  examScores: {},
  lastUpdated: new Date().toISOString()
};
