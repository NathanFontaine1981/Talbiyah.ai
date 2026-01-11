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
export const FOUNDATION_CATEGORIES: FoundationCategory[] = [
  {
    slug: 'tawheed',
    name: 'Tawheed',
    arabicName: 'التوحيد',
    description: 'Understanding who Allah is - the foundation of everything. Know your Creator before anything else.',
    icon: 'Sun',
    orderIndex: 1,
    isActive: true,
    isComingSoon: false,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    slug: 'how-to-pray',
    name: 'How to Pray',
    arabicName: 'كيفية الصلاة',
    description: 'Learn the physical movements and words of the five daily prayers.',
    icon: 'Moon',
    orderIndex: 2,
    isActive: true,
    isComingSoon: false,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    slug: 'comparative-religion',
    name: 'Comparative Religion',
    arabicName: 'مقارنة الأديان',
    description: 'Understanding Islam in context - for those coming from other faiths or no faith.',
    icon: 'BookOpen',
    orderIndex: 3,
    isActive: true,
    isComingSoon: true,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    slug: 'history-of-islam',
    name: 'History of Islam',
    arabicName: 'تاريخ الإسلام',
    description: 'The prophets, companions, and the golden age of Islamic civilization.',
    icon: 'History',
    orderIndex: 4,
    isActive: true,
    isComingSoon: true,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600'
  },
  {
    slug: 'names-of-allah',
    name: '99 Names of Allah',
    arabicName: 'أسماء الله الحسنى',
    description: 'Learn the beautiful names and attributes of your Creator.',
    icon: 'Star',
    orderIndex: 5,
    isActive: true,
    isComingSoon: true,
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-600'
  },
  {
    slug: 'fiqh-basics',
    name: 'Fiqh Basics',
    arabicName: 'أساسيات الفقه',
    description: 'The five pillars, wudu, fasting, and essential rulings.',
    icon: 'Scale',
    orderIndex: 6,
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
    orderIndex: 7,
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
