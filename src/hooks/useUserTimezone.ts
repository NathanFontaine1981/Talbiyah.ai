import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Resolves the current signed-in user's saved timezone (profiles.timezone) for
// displaying lesson/session times in their chosen zone rather than the device's
// local zone. Falls back to the browser zone until/unless a saved zone is found.
//
// The result is cached at module scope so the many components that render lesson
// times don't each issue a separate query.

const browserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

let cachedTimeZone: string | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchUserTimeZone(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .maybeSingle();
  return data?.timezone ?? null;
}

export function useUserTimezone(): string {
  const [timeZone, setTimeZone] = useState<string>(
    cachedTimeZone ?? browserTimeZone(),
  );

  useEffect(() => {
    let cancelled = false;

    if (cachedTimeZone) {
      setTimeZone(cachedTimeZone);
      return;
    }

    if (!inflight) inflight = fetchUserTimeZone();
    const pending = inflight;
    pending
      .then((value) => {
        if (value) {
          cachedTimeZone = value;
          if (!cancelled) setTimeZone(value);
        }
      })
      .catch(() => {
        /* keep browser-zone fallback on error */
      })
      .finally(() => {
        if (inflight === pending) inflight = null;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return timeZone;
}
