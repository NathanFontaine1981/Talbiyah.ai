// Subject color utility - consistent colors across the app
// Quran = Green (emerald), Arabic = Blue, others have distinct colors

export interface SubjectColorScheme {
  gradient: string;
  gradientHover: string;
  bg: string;
  bgHover: string;
  text: string;
  border: string;
  light: string;
}

export function getSubjectColors(subjectName: string | undefined | null): SubjectColorScheme {
  const name = (subjectName || '').toLowerCase();

  // Quran - Emerald Green
  if (name.includes('quran') || name.includes('qur\'an') || name.includes('tajweed')) {
    return {
      gradient: 'from-emerald-500 to-emerald-600',
      gradientHover: 'hover:from-emerald-600 hover:to-emerald-700',
      bg: 'bg-emerald-500',
      bgHover: 'hover:bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-500',
      light: 'bg-emerald-100 text-emerald-700',
    };
  }

  // Arabic Language - Blue
  if (name.includes('arabic')) {
    return {
      gradient: 'from-blue-500 to-blue-600',
      gradientHover: 'hover:from-blue-600 hover:to-blue-700',
      bg: 'bg-blue-500',
      bgHover: 'hover:bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-500',
      light: 'bg-blue-100 text-blue-700',
    };
  }

  // Islamic Studies / Fiqh - Purple
  if (name.includes('fiqh') || name.includes('islamic studies') || name.includes('aqeedah')) {
    return {
      gradient: 'from-purple-500 to-purple-600',
      gradientHover: 'hover:from-purple-600 hover:to-purple-700',
      bg: 'bg-purple-500',
      bgHover: 'hover:bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-500',
      light: 'bg-purple-100 text-purple-700',
    };
  }

  // Hadith - Amber
  if (name.includes('hadith') || name.includes('sunnah')) {
    return {
      gradient: 'from-amber-500 to-amber-600',
      gradientHover: 'hover:from-amber-600 hover:to-amber-700',
      bg: 'bg-amber-500',
      bgHover: 'hover:bg-amber-600',
      text: 'text-amber-600',
      border: 'border-amber-500',
      light: 'bg-amber-100 text-amber-700',
    };
  }

  // Seerah / History - Teal
  if (name.includes('seerah') || name.includes('history') || name.includes('sirah')) {
    return {
      gradient: 'from-teal-500 to-teal-600',
      gradientHover: 'hover:from-teal-600 hover:to-teal-700',
      bg: 'bg-teal-500',
      bgHover: 'hover:bg-teal-600',
      text: 'text-teal-600',
      border: 'border-teal-500',
      light: 'bg-teal-100 text-teal-700',
    };
  }

  // Default - Slate/Gray
  return {
    gradient: 'from-slate-500 to-slate-600',
    gradientHover: 'hover:from-slate-600 hover:to-slate-700',
    bg: 'bg-slate-500',
    bgHover: 'hover:bg-slate-600',
    text: 'text-slate-600',
    border: 'border-slate-500',
    light: 'bg-slate-100 text-slate-700',
  };
}

// Quick helper for gradient buttons
export function getSubjectGradientClasses(subjectName: string | undefined | null): string {
  const colors = getSubjectColors(subjectName);
  return `${colors.gradient} ${colors.gradientHover}`;
}
