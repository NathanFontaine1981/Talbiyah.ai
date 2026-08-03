import { useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useSalahTrackerSettings } from '../../hooks/useSalahTrackerSettings';
import { buildEffectiveRecords } from '../../lib/prayerAutoMark';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Light weekly check-in, shown only when auto-mark is on: summarises how many
// prayers got auto-marked in the last 7 days so nothing sits uncorrected
// indefinitely. Dismissing resets the 7-day timer; it never blocks the page.
export default function AutoMarkWeeklyNudge() {
  const { settings, updateSettings } = useSalahTrackerSettings();
  const [autoCount, setAutoCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const shouldConsider = settings.auto_mark_enabled && !!settings.auto_mark_enabled_at;
  const dueForNudge = shouldConsider && (
    !settings.last_nudge_shown_at ||
    Date.now() - new Date(settings.last_nudge_shown_at).getTime() >= SEVEN_DAYS_MS
  );

  useEffect(() => {
    if (!dueForNudge) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('salah_daily_record')
        .select('record_date, prayer_name, status, location, sunnah_completed')
        .eq('user_id', user.id)
        .gte('record_date', sevenDaysAgo);

      if (cancelled) return;
      const effective = buildEffectiveRecords(data || [], settings, todayStr);
      const count = effective.filter(r => r.isAuto).length;
      setAutoCount(count);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueForNudge]);

  if (!dueForNudge || dismissed || autoCount === null || autoCount === 0) return null;

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
        <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          {autoCount} prayer{autoCount === 1 ? '' : 's'} auto-marked this week
        </p>
        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
          Worth a quick check on the Salah Tracker - anything to correct before it settles into your record?
        </p>
      </div>
      <button
        onClick={async () => {
          setDismissed(true);
          await updateSettings({ last_nudge_shown_at: new Date().toISOString() });
        }}
        className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 p-1 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
