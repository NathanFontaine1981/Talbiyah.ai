import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SalahTrackerSettings } from '../lib/prayerAutoMark';

const DEFAULT_SETTINGS: SalahTrackerSettings = {
  auto_mark_enabled: false,
  auto_mark_sunnah_enabled: true,
  auto_mark_enabled_at: null,
  last_nudge_shown_at: null,
};

export function useSalahTrackerSettings() {
  const [settings, setSettings] = useState<SalahTrackerSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setLoading(false); return; }

      const { data } = await supabase
        .from('salah_tracker_settings')
        .select('auto_mark_enabled, auto_mark_sunnah_enabled, auto_mark_enabled_at, last_nudge_shown_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        if (data) setSettings(data as SalahTrackerSettings);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateSettings = useCallback(async (patch: Partial<SalahTrackerSettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Stamp auto_mark_enabled_at the first moment auto-mark is turned on, so
    // backfill stays onward-only even if the setting is toggled off and on again.
    const next = { ...settings, ...patch };
    if (patch.auto_mark_enabled && !settings.auto_mark_enabled_at) {
      next.auto_mark_enabled_at = new Date().toISOString();
    }
    if (patch.auto_mark_enabled === false) {
      next.auto_mark_enabled_at = null;
    }

    setSettings(next);

    await supabase.from('salah_tracker_settings').upsert(
      {
        user_id: user.id,
        auto_mark_enabled: next.auto_mark_enabled,
        auto_mark_sunnah_enabled: next.auto_mark_sunnah_enabled,
        auto_mark_enabled_at: next.auto_mark_enabled_at,
        last_nudge_shown_at: next.last_nudge_shown_at,
      },
      { onConflict: 'user_id' }
    );
  }, [settings]);

  return { settings, loading, updateSettings };
}
