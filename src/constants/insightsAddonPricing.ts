// Insights Addon Pricing
// This is the revenue model for independent teachers on Talbiyah

export const INSIGHTS_ADDON = {
  /** Price per lesson in pence */
  pricePerLessonPence: 250,
  /** Price per lesson in pounds */
  pricePerLesson: 2.50,
  /** First lesson is free (trial to create FOMO) */
  firstLessonFree: true,
  /** Approximate cost to Talbiyah per lesson (Claude API + transcription) */
  costPerLesson: 0.25,
  /** Display label for checkout */
  displayName: 'Talbiyah AI Insights',
  /** Short description for checkout */
  shortDescription: 'AI-powered study notes, quizzes & revision materials from your lesson recording',
  /** Features included */
  features: [
    'AI-generated lesson notes & study guide',
    'Interactive quiz based on lesson content',
    'Vocabulary lists with Arabic tashkeel',
    'First Word Prompter for Quran memorisation',
    'Scholarly tafsir from Ibn Kathir',
    'Homework assignments & practice tasks',
    'Lesson recording saved for 7 days',
  ],
} as const;
