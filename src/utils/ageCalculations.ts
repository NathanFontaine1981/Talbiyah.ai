/**
 * Age and School Year Calculation Utilities
 * For UK-based school year calculations
 */

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string | Date): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate UK school year from date of birth
 * UK school year runs September 1 - August 31
 */
export function calculateSchoolYear(dob: string | Date): string {
  const age = calculateAge(dob);

  const schoolYears: Record<number, string> = {
    3: 'Nursery',
    4: 'Reception',
    5: 'Year 1',
    6: 'Year 2',
    7: 'Year 3',
    8: 'Year 4',
    9: 'Year 5',
    10: 'Year 6',
    11: 'Year 7',
    12: 'Year 8',
    13: 'Year 9',
    14: 'Year 10',
    15: 'Year 11',
    16: 'Year 12',
    17: 'Year 13',
  };

  if (age < 3) return 'Pre-Nursery';
  if (age > 17) return 'Adult';

  return schoolYears[age] || 'Unknown';
}

/**
 * Get age group category
 */
export function getAgeGroup(dob: string | Date): string {
  const age = calculateAge(dob);

  if (age < 5) return 'Early Years';
  if (age <= 10) return 'Primary';
  if (age <= 16) return 'Secondary';
  if (age <= 18) return 'Sixth Form';
  return 'Adult';
}

/**
 * Check if birthday is today
 */
export function isBirthdayToday(dob: string | Date): boolean {
  const birthDate = new Date(dob);
  const today = new Date();

  return birthDate.getMonth() === today.getMonth() &&
         birthDate.getDate() === today.getDate();
}

/**
 * Get days until next birthday
 */
export function daysUntilBirthday(dob: string | Date): number {
  const birthDate = new Date(dob);
  const today = new Date();

  const nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validate date of birth
 * Returns error message or null if valid
 */
export function validateDOB(dob: string): string | null {
  if (!dob) {
    return 'Date of birth is required';
  }

  const birthDate = new Date(dob);
  const today = new Date();
  const age = calculateAge(dob);

  if (isNaN(birthDate.getTime())) {
    return 'Invalid date format';
  }

  if (birthDate > today) {
    return 'Date of birth cannot be in the future';
  }

  if (age < 3) {
    return 'Child must be at least 3 years old';
  }

  if (age > 25) {
    return 'Please check the date of birth';
  }

  return null; // Valid
}

/**
 * Get min/max date constraints for date picker
 */
export function getDateConstraints(): { min: string; max: string } {
  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 25);

  return {
    min: minDate.toISOString().split('T')[0],
    max: maxDate
  };
}

/**
 * Format age for display
 */
export function formatAge(dob: string | Date): string {
  const age = calculateAge(dob);
  return `${age} year${age === 1 ? '' : 's'} old`;
}
