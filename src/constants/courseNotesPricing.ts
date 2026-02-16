// Course Study Notes Pricing
// One-off payment to unlock AI study notes for all sessions in a course

export const COURSE_NOTES_PRICING = {
  /** Flat price in pence */
  flatPricePence: 500,
  /** Flat price in pounds */
  flatPrice: 5.00,
  /** Session 1 is always free (FOMO hook) */
  firstSessionFree: true,
  displayName: 'Course Study Notes',
  shortDescription: 'AI-powered study notes for every session in this course',
  features: [
    'AI-generated notes for every session',
    'Interactive quizzes to test understanding',
    'Arabic vocabulary flashcards with tashkeel',
    "Qur'anic verse references with context",
    'Hadith references with scholarly sources',
    'Action points and reflection prompts',
    'Print-ready PDF format',
    'Lifetime access to all course notes',
  ],
  /** Flat £5 for all course study notes */
  calculatePrice(_totalSessions: number): { pence: number; pounds: number } {
    return { pence: 500, pounds: 5 };
  },
} as const;
