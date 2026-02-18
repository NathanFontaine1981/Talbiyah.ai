export interface HelpStep {
  title: string;
  content: string;
  tip?: string;
}

export interface HelpGuide {
  id: string;
  title: string;
  description: string;
  steps: HelpStep[];
  relatedPage?: string;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  gradient: string;
  guides: HelpGuide[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'learning',
    name: 'Learning & Progress',
    description: 'Track Quran, memorization, and daily review',
    icon: '📚',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    gradient: 'from-emerald-500 to-teal-600',
    guides: [
      {
        id: 'quran-progress',
        title: 'Track Your Quran Progress',
        description: 'See your memorization, fluency, and understanding across all surahs',
        steps: [
          {
            title: 'Access Progress',
            content: 'From your Dashboard, click "My Progress" in the quick actions, or go to Progress → Quran Progress in the menu.',
          },
          {
            title: 'Understand the Grid',
            content: 'Each cell represents a Juz (Para). Colors indicate your level: green for mastered, yellow for in-progress, gray for not started.',
          },
          {
            title: 'Update Your Progress',
            content: 'Click any Juz to expand it and mark individual surahs as memorized, reviewed, or in-progress.',
            tip: 'Set weekly goals to stay consistent with your Quran journey!',
          },
        ],
        relatedPage: '/progress/quran',
      },
      {
        id: 'memorization-goals',
        title: 'Set Up Memorization Goals',
        description: 'Create personalized memorization targets and track your hifdh journey',
        steps: [
          {
            title: 'Go to Memorization Setup',
            content: 'Navigate to My Memorization from the dashboard or sidebar menu.',
          },
          {
            title: 'Choose Your Goal',
            content: 'Select what you want to memorize: specific surahs, a Juz, or set a custom daily ayah target.',
          },
          {
            title: 'Track Daily Progress',
            content: 'Mark ayahs as memorized each day. The app will remind you to review older memorization too.',
            tip: 'Start small - even 2-3 ayahs per day adds up to a full Juz in a few months!',
          },
        ],
        relatedPage: '/my-memorization',
      },
      {
        id: 'daily-maintenance',
        title: 'Use Daily Maintenance',
        description: 'Keep your memorization fresh with spaced repetition review',
        steps: [
          {
            title: 'Access Daily Review',
            content: 'Click "Daily Practice" in the sidebar or find it in Tools & Resources.',
          },
          {
            title: 'Complete Your Review',
            content: 'The app will show you ayahs based on when you last reviewed them. Recite each one and mark how well you remembered.',
          },
          {
            title: 'Stay Consistent',
            content: 'Try to complete your daily review at the same time each day - after Fajr is ideal for many.',
            tip: 'Even 10 minutes of daily review is better than an hour once a week!',
          },
        ],
        relatedPage: '/daily-review',
      },
      {
        id: 'lesson-insights',
        title: 'Understanding Lesson Insights',
        description: 'Get AI-powered summaries and notes from your lessons',
        steps: [
          {
            title: 'Find Your Lesson',
            content: 'Go to Recordings in the sidebar and find the lesson you want to review.',
          },
          {
            title: 'View Insights',
            content: 'Click on any recording to see AI-generated insights including key topics, vocabulary, and action items.',
          },
          {
            title: 'Use Deep Study Mode',
            content: 'Toggle to Deep Study mode for detailed notes, or Memorization mode for focused review of key concepts.',
            tip: 'Insights are generated automatically after each lesson - check back a few hours after your class!',
          },
        ],
        relatedPage: '/recordings/history',
      },
    ],
  },
  {
    id: 'sessions',
    name: 'Sessions & Teachers',
    description: 'Booking, teachers, and group classes',
    icon: '👨‍🏫',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    gradient: 'from-blue-500 to-indigo-600',
    guides: [
      {
        id: 'book-first-lesson',
        title: 'Book Your First Lesson',
        description: 'Schedule a one-on-one session with a qualified teacher',
        steps: [
          {
            title: 'Browse Teachers',
            content: 'Go to Find Teachers from the sidebar. You can filter by subject, language, and availability.',
          },
          {
            title: 'Choose a Teacher',
            content: 'Click on a teacher\'s profile to see their bio, qualifications, reviews, and available time slots.',
          },
          {
            title: 'Select a Time',
            content: 'Pick a time that works for you from their calendar. Times are shown in your local timezone.',
          },
          {
            title: 'Confirm & Pay',
            content: 'Use your credits to book the lesson. You\'ll receive a confirmation email with the meeting link.',
            tip: 'Book your first lesson with a new teacher as a trial - you can always switch if it\'s not the right fit.',
          },
        ],
        relatedPage: '/teachers',
      },
      {
        id: 'find-teacher',
        title: 'Find the Right Teacher',
        description: 'Use filters and profiles to match with your ideal instructor',
        steps: [
          {
            title: 'Use Filters',
            content: 'Filter teachers by subject (Quran, Arabic, Tajweed), gender, language, and price range.',
          },
          {
            title: 'Read Profiles',
            content: 'Each teacher has a detailed profile with their background, teaching style, and student reviews.',
          },
          {
            title: 'Check Availability',
            content: 'Look at their calendar to see if their schedule matches yours before committing.',
            tip: 'Try the matchmaking feature for personalized teacher recommendations based on your goals!',
          },
        ],
        relatedPage: '/teachers',
      },
      {
        id: 'group-classes',
        title: 'Join Group Classes',
        description: 'Learn with other students in structured group sessions',
        steps: [
          {
            title: 'Browse Group Classes',
            content: 'Go to Group Classes from the sidebar to see all available group sessions.',
          },
          {
            title: 'Find Your Level',
            content: 'Classes are organized by topic and skill level. Choose one that matches your current ability.',
          },
          {
            title: 'Enroll & Attend',
            content: 'Click to enroll in a class. You\'ll get reminders before each session starts.',
            tip: 'Group classes are more affordable and great for motivation - learn alongside peers!',
          },
        ],
        relatedPage: '/group-classes',
      },
      {
        id: 'manage-schedule',
        title: 'Manage Your Schedule',
        description: 'View, reschedule, or cancel your upcoming lessons',
        steps: [
          {
            title: 'View Upcoming Lessons',
            content: 'Go to My Lessons to see all your scheduled sessions in calendar or list view.',
          },
          {
            title: 'Reschedule if Needed',
            content: 'Click on any lesson to reschedule. You can change the time up to 24 hours before the lesson.',
          },
          {
            title: 'Join Your Lesson',
            content: 'When it\'s time, click the "Join Lesson" button. Make sure your camera and mic are ready!',
            tip: 'Enable notifications to get reminders 15 minutes before your lessons start.',
          },
        ],
        relatedPage: '/my-classes',
      },
    ],
  },
  {
    id: 'practice',
    name: 'Practice & Worship',
    description: 'Salah, Dua builder, and Istikhara',
    icon: '🕌',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconBg: 'bg-amber-100',
    gradient: 'from-amber-500 to-orange-600',
    guides: [
      {
        id: 'learn-salah',
        title: 'Learn to Pray (Salah Tutorial)',
        description: 'Step-by-step guide to performing the five daily prayers',
        steps: [
          {
            title: 'Start the Tutorial',
            content: 'Go to Learn Salah from the sidebar. The tutorial is organized into 6 sections covering every part of prayer.',
          },
          {
            title: 'Learn Each Position',
            content: 'Click through each section to learn the physical positions, Arabic recitations, and meanings.',
          },
          {
            title: 'Practice with Audio',
            content: 'Use the audio playback to hear correct pronunciation. Practice along until you feel confident.',
          },
          {
            title: 'Take the Quiz',
            content: 'Test your knowledge with the quiz mode, then use Practice mode to go through a complete prayer.',
            tip: 'Use "Pray Now" mode during actual prayer times to follow along in real-time!',
          },
        ],
        relatedPage: '/salah',
      },
      {
        id: 'dua-builder',
        title: 'Build Custom Duas',
        description: 'Create personalized supplications with translations',
        steps: [
          {
            title: 'Open Dua Builder',
            content: 'Navigate to Dua Builder from the Tools & Resources section.',
          },
          {
            title: 'Choose Categories',
            content: 'Select from categories like morning/evening, before eating, traveling, or create your own.',
          },
          {
            title: 'Customize Your Collection',
            content: 'Add duas to your personal collection. Each dua shows Arabic text, transliteration, and meaning.',
            tip: 'Set daily reminders to recite your morning and evening adhkar!',
          },
        ],
        relatedPage: '/dua-builder',
      },
      {
        id: 'istikhara',
        title: 'Perform Salatul Istikhara',
        description: 'Learn the prayer for seeking guidance in decisions',
        steps: [
          {
            title: 'Understand Istikhara',
            content: 'Go to Istikhara Practice to learn when and how to pray this special prayer for guidance.',
          },
          {
            title: 'Learn the Dua',
            content: 'Memorize the Istikhara dua with audio guidance. The app breaks it down into manageable parts.',
          },
          {
            title: 'Perform the Prayer',
            content: 'Pray 2 rakah of voluntary prayer, then recite the dua while thinking about your decision.',
            tip: 'Istikhara is about seeking Allah\'s guidance - the answer may come as feelings, events, or clarity over time.',
          },
        ],
        relatedPage: '/istikhara-practice',
      },
      {
        id: 'qunut-witr',
        title: 'Practice Qunut for Witr',
        description: 'Master the dua qunut for your night prayers',
        steps: [
          {
            title: 'Access Qunut Practice',
            content: 'Find Qunut Practice in the Tools & Resources or navigate directly to the practice page.',
          },
          {
            title: 'Learn the Dua',
            content: 'Follow along with the Arabic text, transliteration, and audio to memorize the dua qunut.',
          },
          {
            title: 'Understand the Meaning',
            content: 'Read the translation to understand what you\'re asking Allah for in this powerful supplication.',
            tip: 'Qunut is recited in the last rakah of Witr prayer, after ruku or before it depending on your madhab.',
          },
        ],
        relatedPage: '/qunut-practice',
      },
      {
        id: 'khutbah-creator',
        title: 'Use the Khutbah Creator',
        description: 'Build structured, meaningful khutbahs with AI-powered assistance',
        steps: [
          {
            title: 'Open Khutbah Creator',
            content: 'Navigate to Khutbah Creator from the sidebar under Tools & Resources. This tool helps you draft complete Friday sermons or short reminders.',
          },
          {
            title: 'Choose Your Topic',
            content: 'Select a topic or theme for your khutbah. You can choose from common themes like gratitude, patience, family, or enter your own custom topic.',
            tip: 'Great for students practising public speaking - try writing khutbahs on topics you\'re studying to deepen your understanding!',
          },
          {
            title: 'Build Your Structure',
            content: 'The creator guides you through the traditional khutbah format: opening praise (hamd), Quranic ayahs, hadith references, main message, and closing dua. Each section has prompts to help you write.',
          },
          {
            title: 'Get AI Suggestions',
            content: 'Use AI assistance to find relevant Quran verses, authentic hadith, and scholarly quotes that support your theme. The AI helps with Arabic text, transliteration, and translations.',
          },
          {
            title: 'Review & Save',
            content: 'Preview your complete khutbah, make any edits, and save it to your library. You can revisit and refine it anytime before delivering.',
            tip: 'Even if you\'re not a khateeb, writing khutbahs is an excellent way to organise your Islamic knowledge and practise articulating your faith.',
          },
        ],
        relatedPage: '/khutbah-creator',
      },
    ],
  },
  {
    id: 'homework',
    name: 'Homework & Assessment',
    description: 'Smart homework, AI verification, and diagnostics',
    icon: '📝',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-100',
    gradient: 'from-purple-500 to-violet-600',
    guides: [
      {
        id: 'smart-homework',
        title: 'Complete Smart Homework',
        description: 'Submit and track your homework assignments',
        steps: [
          {
            title: 'View Your Homework',
            content: 'Go to Homework from the dashboard to see all pending assignments from your teachers.',
          },
          {
            title: 'Complete Assignments',
            content: 'Each homework shows what to practice. Record yourself or write your answers as instructed.',
          },
          {
            title: 'Submit for Review',
            content: 'Upload your recording or written work. Your teacher will review and provide feedback.',
            tip: 'Complete homework before your next lesson so your teacher can build on your progress!',
          },
        ],
        relatedPage: '/homework',
      },
      {
        id: 'diagnostic',
        title: 'Take Diagnostic Assessment',
        description: 'Get evaluated to find your exact level and learning path',
        steps: [
          {
            title: 'Start Assessment',
            content: 'Go to Diagnostic Assessment to begin. This helps us understand your current Quran level.',
          },
          {
            title: 'Complete the Test',
            content: 'You\'ll be asked to recite specific ayahs and answer questions. Be honest - this helps us help you!',
          },
          {
            title: 'Get Your Results',
            content: 'Receive a detailed report showing your strengths, areas to improve, and recommended learning path.',
            tip: 'Take the diagnostic before your first lesson so your teacher can personalize their approach.',
          },
        ],
        relatedPage: '/diagnostic/start',
      },
      {
        id: 'ai-feedback',
        title: 'Review AI Feedback',
        description: 'Understand the AI-generated feedback on your recitation',
        steps: [
          {
            title: 'Find Your Submission',
            content: 'Go to Homework and click on any completed assignment to see its feedback.',
          },
          {
            title: 'Review AI Analysis',
            content: 'The AI highlights specific words or phrases where you can improve, with suggestions for correction.',
          },
          {
            title: 'Practice the Feedback',
            content: 'Focus on the areas marked for improvement. Re-record and compare to track your progress.',
            tip: 'AI feedback complements your teacher\'s guidance - use both for the best results!',
          },
        ],
        relatedPage: '/homework',
      },
      {
        id: 'improve-insights',
        title: 'Improve from Insights',
        description: 'Use lesson insights to accelerate your learning',
        steps: [
          {
            title: 'Review After Each Lesson',
            content: 'Check your lesson insights within 24 hours while the content is fresh in your mind.',
          },
          {
            title: 'Focus on Action Items',
            content: 'Each insight includes specific action items - practice points your teacher emphasized.',
          },
          {
            title: 'Track Your Improvement',
            content: 'Over time, compare insights from different lessons to see how you\'re progressing.',
            tip: 'Share insights with family members so they can help you practice at home!',
          },
        ],
        relatedPage: '/recordings/history',
      },
    ],
  },
  {
    id: 'foundations',
    name: 'Foundations & Explore',
    description: 'Core Islamic knowledge and faith journey',
    icon: '🏛️',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconBg: 'bg-rose-100',
    gradient: 'from-rose-500 to-pink-600',
    guides: [
      {
        id: 'unshakable-foundations',
        title: 'Start Unshakeable Foundations',
        description: 'Learn the essential pillars of Islamic knowledge',
        steps: [
          {
            title: 'Access the Course',
            content: 'Go to Unshakeable Foundations from the sidebar. This free course covers the essentials every Muslim should know.',
          },
          {
            title: 'Choose a Pillar',
            content: 'Start with any pillar: Tawheed, How to Pray, Islamic History, 99 Names of Allah, or Fiqh Basics.',
          },
          {
            title: 'Watch & Learn',
            content: 'Each pillar has video lessons from trusted scholars. Watch at your own pace.',
          },
          {
            title: 'Take the Quiz',
            content: 'After each lesson, take a quiz to test your understanding. Score 70% or higher to pass!',
            tip: 'Start with Tawheed - understanding who Allah is forms the foundation of everything else.',
          },
        ],
        relatedPage: '/new-muslim',
      },
      {
        id: 'foundation-exams',
        title: 'Take Foundation Exams',
        description: 'Test your knowledge and earn completion certificates',
        steps: [
          {
            title: 'Complete the Lessons',
            content: 'Watch all videos in a pillar category before attempting the exam.',
          },
          {
            title: 'Start the Exam',
            content: 'Click "Take Exam" on any completed pillar. Exams test comprehensive understanding.',
          },
          {
            title: 'Pass & Progress',
            content: 'Score 70% or higher to pass. You can retake exams if needed - learning is the goal!',
            tip: 'Review the lessons before exams. Take notes on key concepts as you watch.',
          },
        ],
        relatedPage: '/new-muslim',
      },
      {
        id: 'explore-faith',
        title: 'Explore Your Faith Journey',
        description: 'Discover content tailored to where you are in your journey',
        steps: [
          {
            title: 'Visit Explore',
            content: 'Go to Exploring Islam from the sidebar for a curated collection of Islamic content.',
          },
          {
            title: 'Browse Topics',
            content: 'Explore categories like prayer, Quran, Islamic history, and contemporary issues.',
          },
          {
            title: 'Save Favorites',
            content: 'Bookmark content you want to return to. Build your personal Islamic library.',
            tip: 'Perfect for new Muslims or anyone wanting to deepen their understanding of Islam.',
          },
        ],
        relatedPage: '/explore',
      },
      {
        id: 'audio-resources',
        title: 'Access Audio Resources',
        description: 'Listen to lectures and recitations on Spotify',
        steps: [
          {
            title: 'Find Audio Content',
            content: 'Many of our video lessons have audio-only versions available on Spotify.',
          },
          {
            title: 'Listen on the Go',
            content: 'Perfect for commutes, workouts, or anytime you can\'t watch video.',
          },
          {
            title: 'Follow Our Playlists',
            content: 'We curate playlists for different topics - follow to get updates when new content is added.',
            tip: 'Listening to Quran recitation, even without understanding, brings spiritual benefits!',
          },
        ],
      },
    ],
  },
  {
    id: 'account',
    name: 'Account & Billing',
    description: 'Credits, referrals, and settings',
    icon: '⚙️',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    iconBg: 'bg-cyan-100',
    gradient: 'from-cyan-500 to-teal-600',
    guides: [
      {
        id: 'buy-credits',
        title: 'Buy & Use Credits',
        description: 'Purchase lesson credits and understand pricing',
        steps: [
          {
            title: 'Go to Buy Credits',
            content: 'Navigate to Buy Credits from the sidebar or click your credit balance in the header.',
          },
          {
            title: 'Choose a Package',
            content: 'Select a credit package. Larger packages offer better per-credit pricing.',
          },
          {
            title: 'Complete Payment',
            content: 'Pay securely with card or other payment methods. Credits are added instantly.',
          },
          {
            title: 'Use Your Credits',
            content: 'Credits are automatically deducted when you book lessons. Check your balance anytime.',
            tip: 'Credits never expire! Buy in bulk to save money on your learning journey.',
          },
        ],
        relatedPage: '/buy-credits',
      },
      {
        id: 'referrals',
        title: 'Refer Friends (Earn Rewards)',
        description: 'Share Talbiyah.ai and earn free credits',
        steps: [
          {
            title: 'Find Your Referral Link',
            content: 'Go to Referrals in the sidebar to get your unique referral link and code.',
          },
          {
            title: 'Share with Friends',
            content: 'Send your link to friends, family, or share on social media. Anyone can use it!',
          },
          {
            title: 'Earn Rewards',
            content: 'When someone signs up using your link and books their first lesson, you both get bonus credits!',
            tip: 'The more people who use your code, the more you earn. There\'s no limit!',
          },
        ],
        relatedPage: '/my-referrals',
      },
      {
        id: 'manage-profile',
        title: 'Manage Your Profile',
        description: 'Update your personal information and preferences',
        steps: [
          {
            title: 'Go to Settings',
            content: 'Click Settings in the sidebar or go to Account Settings from your profile.',
          },
          {
            title: 'Update Information',
            content: 'Change your name, email, phone number, timezone, and profile picture.',
          },
          {
            title: 'Adjust Preferences',
            content: 'Set notification preferences, language, and other account options.',
            tip: 'Make sure your timezone is correct so lesson times display accurately!',
          },
        ],
        relatedPage: '/account/settings',
      },
      {
        id: 'transfer-credits',
        title: 'Transfer Credits',
        description: 'Send credits to family members or other users',
        steps: [
          {
            title: 'Access Transfer',
            content: 'Go to Buy Credits and look for the "Transfer Credits" option.',
          },
          {
            title: 'Enter Recipient',
            content: 'Enter the email address of the person you want to send credits to.',
          },
          {
            title: 'Confirm Transfer',
            content: 'Choose the amount and confirm. The recipient will be notified immediately.',
            tip: 'Great for parents buying credits for children, or gifting lessons to friends!',
          },
        ],
        relatedPage: '/transfer-credits',
      },
    ],
  },
];

export const QUICK_START_GUIDES = [
  {
    step: 1,
    title: 'Set Up Your Profile',
    description: 'Add your name, timezone, and learning goals',
    icon: '👤',
    path: '/account/settings',
  },
  {
    step: 2,
    title: 'Book Your First Lesson',
    description: 'Find a teacher and schedule your first session',
    icon: '📅',
    path: '/teachers',
  },
  {
    step: 3,
    title: 'Explore Free Resources',
    description: 'Check out Salah tutorial, Foundations, and more',
    icon: '🎁',
    path: '/salah',
  },
];
