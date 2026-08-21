// Registry of optional Student-dashboard widgets. Prayer Times and Upcoming
// Lessons are the fixed "core" and are never in this list - they always
// show. Everything here can be revealed/hidden per user via the Discover
// Widgets page and is stored as an array of keys in profiles.dashboard_widgets.

export interface DashboardWidgetDef {
  key: string;
  label: string;
  description: string;
}

export const DASHBOARD_WIDGETS: DashboardWidgetDef[] = [
  {
    key: 'quran_day',
    label: 'Your Day with the Qur\'an',
    description: 'Today\'s Qur\'an review and recitation plan, tailored to what you\'re learning.',
  },
  {
    key: 'quran_tracker',
    label: 'Qur\'an Progress',
    description: 'Track how much of the Qur\'an you understand, read fluently, and have memorised.',
  },
  {
    key: 'alphabet',
    label: 'Arabic Alphabet',
    description: 'A shortcut to Huruf Hijaiyyah, for anyone still learning the letters from scratch.',
  },
  {
    key: 'progress_overview',
    label: 'Your Progress',
    description: 'An overview of your learning progress across everything you\'re studying.',
  },
  {
    key: 'credits',
    label: 'Credits & Tokens',
    description: 'Your lesson credit and AI token balances at a glance.',
  },
  {
    key: 'learning_journey',
    label: 'My Learning Journey',
    description: 'How far through each of your courses you\'ve come.',
  },
  {
    key: 'diagnostic',
    label: 'Diagnostic Assessment',
    description: 'A quick assessment to help place you at the right level.',
  },
];

// Brand-new users (no saved preference yet) start with none of the optional
// widgets - just the fixed core (Prayer Times + Upcoming Lessons).
export const NEW_USER_DEFAULT_WIDGETS: string[] = [];

// Existing users with no saved preference keep seeing everything they
// already had, so this change doesn't remove anything from under them.
export const LEGACY_DEFAULT_WIDGETS: string[] = DASHBOARD_WIDGETS.map(w => w.key);

export function resolveEnabledWidgets(
  savedPref: string[] | null | undefined,
  isNewUser: boolean
): Set<string> {
  if (Array.isArray(savedPref)) return new Set(savedPref);
  return new Set(isNewUser ? NEW_USER_DEFAULT_WIDGETS : LEGACY_DEFAULT_WIDGETS);
}

// A user counts as "new" if they haven't completed a lesson yet and their
// account is under a week old. Shared by Dashboard.tsx and the Discover
// page so the two never silently diverge on what "new" means.
export async function computeIsNewUser(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  userId: string,
  userCreatedAt: string | undefined
): Promise<boolean> {
  const { count: lessonCount } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .or(`student_id.eq.${userId},teacher_id.eq.${userId}`)
    .eq('status', 'completed');

  const accountAge = userCreatedAt
    ? (Date.now() - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  return (lessonCount === 0 || lessonCount === null) && accountAge < 7;
}
