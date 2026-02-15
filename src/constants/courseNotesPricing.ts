// Course Study Notes Pricing
// One-off payment to unlock AI study notes for all sessions in a course

export const COURSE_NOTES_PRICING = {
  /** Price per session in pence */
  pricePerSessionPence: 200,
  /** Price per session in pounds */
  pricePerSession: 2.00,
  /** Maximum total price in pence */
  maxPricePence: 1000,
  /** Maximum total price in pounds */
  maxPrice: 10.00,
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
  /** Calculate price based on total sessions: £2/session, max £10 */
  calculatePrice(totalSessions: number): { pence: number; pounds: number } {
    const pence = Math.min(totalSessions * 200, 1000);
    return { pence, pounds: pence / 100 };
  },
} as const;
