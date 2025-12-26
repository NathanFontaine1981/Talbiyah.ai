// Progress Components - Prompt 1C
// Implements the Talbiyah Methodology: Understanding (Fahm) → Fluency (Itqan) → Memorization (Hifz)

// Overview & Stats
export { default as ProgressOverview, ProgressOverviewCompact } from './ProgressOverview';
export { default as ProgressCharts, ProgressChartMini, WeeklyGoalProgress } from './ProgressCharts';

// Curriculum & Milestones
export { default as CurriculumProgress, ThreePillarsLegend } from './CurriculumProgress';
export { default as SurahProgress, SurahProgressMini } from './SurahProgress';

// Lessons
export { default as DetailedLessonCard, RecentLessonsList } from './DetailedLessonCard';

// Homework
export { default as HomeworkList, HomeworkSummary } from './HomeworkList';

// Teacher Components
export { default as MilestoneVerification, QuickVerifyButton } from './MilestoneVerification';
export { default as PostLessonForm } from './PostLessonForm';

// Student Feedback Components
export { default as AreasToFocusCard } from './AreasToFocusCard';

// Utility functions and constants
export * from './progressUtils';
