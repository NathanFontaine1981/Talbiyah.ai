// Location and language constants for teacher onboarding
// Primarily focused on UK teachers for group lessons

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface City {
  name: string;
  region?: string;
}

// Countries with ISO 3166-1 alpha-2 codes
export const COUNTRIES: Country[] = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
];

// UK cities (primary focus for group lessons)
export const UK_CITIES: City[] = [
  { name: 'London', region: 'Greater London' },
  { name: 'Birmingham', region: 'West Midlands' },
  { name: 'Manchester', region: 'Greater Manchester' },
  { name: 'Leeds', region: 'West Yorkshire' },
  { name: 'Bradford', region: 'West Yorkshire' },
  { name: 'Liverpool', region: 'Merseyside' },
  { name: 'Bristol', region: 'South West' },
  { name: 'Sheffield', region: 'South Yorkshire' },
  { name: 'Leicester', region: 'East Midlands' },
  { name: 'Nottingham', region: 'East Midlands' },
  { name: 'Coventry', region: 'West Midlands' },
  { name: 'Newcastle upon Tyne', region: 'North East' },
  { name: 'Luton', region: 'South East' },
  { name: 'Blackburn', region: 'Lancashire' },
  { name: 'Bolton', region: 'Greater Manchester' },
  { name: 'Oldham', region: 'Greater Manchester' },
  { name: 'Rochdale', region: 'Greater Manchester' },
  { name: 'Preston', region: 'Lancashire' },
  { name: 'Slough', region: 'South East' },
  { name: 'Reading', region: 'South East' },
  { name: 'Cardiff', region: 'Wales' },
  { name: 'Edinburgh', region: 'Scotland' },
  { name: 'Glasgow', region: 'Scotland' },
  { name: 'Belfast', region: 'Northern Ireland' },
  { name: 'Derby', region: 'East Midlands' },
  { name: 'Southampton', region: 'South East' },
  { name: 'Portsmouth', region: 'South East' },
  { name: 'Milton Keynes', region: 'South East' },
  { name: 'Peterborough', region: 'East of England' },
  { name: 'Oxford', region: 'South East' },
  { name: 'Cambridge', region: 'East of England' },
  { name: 'Other', region: '' },
];

// Languages commonly spoken by teachers
export const LANGUAGES: string[] = [
  'English',
  'Arabic',
  'Urdu',
  'Bengali',
  'Somali',
  'Turkish',
  'Pashto',
  'Punjabi',
  'Gujarati',
  'Persian (Farsi)',
  'Malay',
  'Indonesian',
  'French',
  'Spanish',
  'Hindi',
  'Tamil',
  'Swahili',
  'Hausa',
  'Yoruba',
  'Dutch',
  'German',
];

// Group lesson subjects
export const GROUP_LESSON_SUBJECTS = [
  { id: 'islamic_studies', name: 'Islamic Studies', icon: '📖' },
  { id: 'quran_tadabbur', name: 'Quran Tadabbur', icon: '📕' },
  { id: 'seerah', name: 'Seerah', icon: '🕌' },
];

// Group lesson tier definitions (must match database)
export const GROUP_LESSON_TIERS = {
  standard: {
    name: 'Standard',
    icon: '📚',
    teacherRate: 16,
    description: 'UK-based teacher approved for group lessons',
    requirements: ['UK location', 'Approved for 1-to-1 teaching', 'Admin approval for groups'],
  },
  senior: {
    name: 'Senior',
    icon: '🎓',
    teacherRate: 18,
    description: 'Experienced group lesson teacher with proven track record',
    requirements: ['50+ group lesson hours', 'Good student ratings', 'Admin approval'],
  },
  master: {
    name: 'Master',
    icon: '👑',
    teacherRate: 20,
    description: 'Expert group lesson facilitator',
    requirements: ['150+ group lesson hours', 'Excellent ratings', 'Demonstrated expertise'],
  },
};

// Student pricing for group lessons
export const GROUP_LESSON_STUDENT_PRICE = 6; // £6 per student per session
export const GROUP_LESSON_MAX_STUDENTS = 10;

// Helper function to get country by code
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

// Helper function to check if a country is UK
export function isUKCountry(countryCode: string): boolean {
  return countryCode === 'GB';
}

// Helper function to get cities for a country (currently only UK has cities)
export function getCitiesForCountry(countryCode: string): City[] {
  if (countryCode === 'GB') {
    return UK_CITIES;
  }
  return [];
}

// Helper function to calculate teacher earnings for group session
export function calculateTeacherEarnings(
  tier: keyof typeof GROUP_LESSON_TIERS,
  durationHours: number
): number {
  return GROUP_LESSON_TIERS[tier].teacherRate * durationHours;
}

// Helper function to calculate total student revenue
export function calculateStudentRevenue(
  numStudents: number,
  durationHours: number
): number {
  return GROUP_LESSON_STUDENT_PRICE * numStudents * durationHours;
}

// Helper function to calculate platform profit per group session
export function calculatePlatformProfit(
  tier: keyof typeof GROUP_LESSON_TIERS,
  numStudents: number,
  durationHours: number
): number {
  const studentRevenue = calculateStudentRevenue(numStudents, durationHours);
  const teacherCost = calculateTeacherEarnings(tier, durationHours);
  return studentRevenue - teacherCost;
}
