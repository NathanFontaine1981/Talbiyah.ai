// Teacher Tier Definitions
// These match the database teacher_tiers table but provide client-side access
// for display purposes without additional database calls

export interface TeacherTier {
  tier: string;
  level: number;
  name: string;
  icon: string;
  color: string;
  badgeColor: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
  shortDescription: string;
  hourlyRate: number;
  studentPrice: number;
  benefits: string[];
}

export const TEACHER_TIERS: Record<string, TeacherTier> = {
  newcomer: {
    tier: 'newcomer',
    level: 1,
    name: 'Newcomer',
    icon: '🌱',
    color: '#10B981',
    badgeColor: '#059669',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-600',
    description: 'New to Talbiyah, eager to help you learn',
    shortDescription: 'New teacher',
    hourlyRate: 5.00,
    studentPrice: 15.00,
    benefits: [
      'Fresh perspective and enthusiasm',
      'Flexible scheduling',
      'Affordable rates'
    ]
  },
  apprentice: {
    tier: 'apprentice',
    level: 2,
    name: 'Apprentice',
    icon: '📚',
    color: '#3B82F6',
    badgeColor: '#2563EB',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    description: 'Building experience, 50+ hours taught',
    shortDescription: '50+ hours taught',
    hourlyRate: 6.00,
    studentPrice: 15.00,
    benefits: [
      'Proven track record',
      '50+ hours teaching experience',
      'Maintains 4.0+ rating'
    ]
  },
  skilled: {
    tier: 'skilled',
    level: 3,
    name: 'Skilled',
    icon: '🎯',
    color: '#8B5CF6',
    badgeColor: '#7C3AED',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-600',
    description: 'Experienced educator, 150+ hours taught',
    shortDescription: '150+ hours taught',
    hourlyRate: 7.00,
    studentPrice: 15.00,
    benefits: [
      'Extensive experience (150+ hours)',
      'Featured profile',
      'Priority support',
      'Maintains 4.2+ rating'
    ]
  },
  expert: {
    tier: 'expert',
    level: 4,
    name: 'Expert',
    icon: '🏆',
    color: '#F59E0B',
    badgeColor: '#D97706',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-600',
    description: 'Verified credentials, ijazah or degree holder',
    shortDescription: 'Verified credentials',
    hourlyRate: 8.50,
    studentPrice: 16.50,
    benefits: [
      'Ijazah or Islamic degree holder',
      'Fluent English (C1+)',
      'Admin-verified credentials',
      'Dedicated student coordinator',
      'Maintains 4.5+ rating'
    ]
  },
  master: {
    tier: 'master',
    level: 5,
    name: 'Master',
    icon: '💎',
    color: '#F59E0B',
    badgeColor: '#D97706',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-600',
    description: 'Elite educator, multiple ijazahs, Al-Azhar or equivalent',
    shortDescription: 'Elite educator',
    hourlyRate: 10.00,
    studentPrice: 18.00,
    benefits: [
      'Multiple ijazahs (Quran + Qira\'at)',
      'Al-Azhar University or equivalent degree',
      'Native/near-native English',
      'Exceptional teaching record',
      'Platform promotion',
      'Elite teacher badge'
    ]
  }
};

// Teacher Specializations
export interface TeacherSpecialization {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const TEACHER_SPECIALIZATIONS: TeacherSpecialization[] = [
  {
    id: 'tajweed',
    name: 'Tajweed',
    icon: '📖',
    description: 'Quran recitation with proper pronunciation rules',
    color: 'emerald'
  },
  {
    id: 'hifz',
    name: 'Hifz (Memorization)',
    icon: '🧠',
    description: 'Quran memorization techniques and retention',
    color: 'blue'
  },
  {
    id: 'tafsir',
    name: 'Tafsir',
    icon: '📚',
    description: 'Quranic interpretation and explanation',
    color: 'purple'
  },
  {
    id: 'arabic_beginners',
    name: 'Arabic for Beginners',
    icon: '🌱',
    description: 'Foundation Arabic for new learners',
    color: 'green'
  },
  {
    id: 'quranic_arabic',
    name: 'Quranic Arabic',
    icon: '📜',
    description: 'Classical Arabic for understanding the Quran',
    color: 'amber'
  },
  {
    id: 'conversational_arabic',
    name: 'Conversational Arabic',
    icon: '💬',
    description: 'Practical speaking skills for daily use',
    color: 'blue'
  },
  {
    id: 'children',
    name: 'Children\'s Education',
    icon: '👶',
    description: 'Specialized in teaching young learners',
    color: 'emerald'
  },
  {
    id: 'adults',
    name: 'Adult Learners',
    icon: '👨‍🎓',
    description: 'Experienced with adult education needs',
    color: 'blue'
  },
  {
    id: 'converts',
    name: 'New Muslim Support',
    icon: '🌙',
    description: 'Patient guidance for those new to Islam',
    color: 'green'
  },
  {
    id: 'islamic_studies',
    name: 'Islamic Studies',
    icon: '🕌',
    description: 'Comprehensive Islamic knowledge',
    color: 'purple'
  }
];

// Get tier info by tier name
export function getTierInfo(tierName: string): TeacherTier {
  return TEACHER_TIERS[tierName] || TEACHER_TIERS.newcomer;
}

// Get specialization by ID
export function getSpecialization(id: string): TeacherSpecialization | undefined {
  return TEACHER_SPECIALIZATIONS.find(s => s.id === id);
}

// Teacher vetting badges - what parents see to build trust
export interface VettingBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  priority: number;
}

export const VETTING_BADGES: VettingBadge[] = [
  {
    id: 'identity_verified',
    name: 'Identity Verified',
    icon: '✓',
    description: 'Government ID verified by Talbiyah team',
    priority: 1
  },
  {
    id: 'credentials_verified',
    name: 'Credentials Verified',
    icon: '🎓',
    description: 'Educational certificates verified',
    priority: 2
  },
  {
    id: 'ijazah_holder',
    name: 'Ijazah Holder',
    icon: '📜',
    description: 'Holds verified chain of Quran transmission',
    priority: 3
  },
  {
    id: 'talbiyah_certified',
    name: 'Talbiyah Certified',
    icon: '⭐',
    description: 'Completed Talbiyah methodology training',
    priority: 4
  },
  {
    id: 'safeguarding_trained',
    name: 'Safeguarding Trained',
    icon: '🛡️',
    description: 'Completed child safeguarding training',
    priority: 5
  }
];

// Gentleness Guarantee copy
export const GENTLENESS_GUARANTEE = {
  title: 'Gentleness Guarantee',
  tagline: 'Learning should feel safe, not scary',
  icon: '🤲',
  description: 'Every Talbiyah teacher commits to patience and kindness. If your child ever feels uncomfortable or scared, we\'ll find you a better match - no questions asked.',
  commitments: [
    'No shouting or harsh discipline',
    'Encouragement over criticism',
    'Age-appropriate expectations',
    'Patient with mistakes',
    'Celebrates small wins'
  ],
  guarantee: 'Not happy? We\'ll match you with a new teacher free of charge.'
};

// Helper to format hours taught for display
export function formatHoursTaught(hours: number): string {
  if (hours < 1) return 'New';
  if (hours < 50) return `${Math.round(hours)}h`;
  if (hours < 100) return '50+ hours';
  if (hours < 200) return '100+ hours';
  if (hours < 500) return '200+ hours';
  return '500+ hours';
}

// Helper to get rating display
export function getRatingDisplay(rating: number, count: number): { stars: number; text: string } {
  if (count === 0) return { stars: 0, text: 'New teacher' };
  return {
    stars: Math.round(rating * 2) / 2, // Round to nearest 0.5
    text: `${rating.toFixed(1)} (${count} ${count === 1 ? 'review' : 'reviews'})`
  };
}
