// Remember where a signed-out visitor was heading (e.g. the link in a notes email) so we can send them
// there after they sign in. ProtectedRoute sends signed-out users to "/" and forgets the destination.
const KEY = 'madrasa_return_to';
const MAX_AGE_MS = 60 * 60 * 1000;

export function saveReturnTo(path: string): void {
  try { localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() })); } catch { /* storage unavailable */ }
}

/** Returns the saved path once (and clears it). Only same-site madrasa paths are honoured. */
export function takeReturnTo(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const { path, at } = JSON.parse(raw) as { path: string; at: number };
    if (Date.now() - at > MAX_AGE_MS) return null;
    return /^\/madrasa(\/|\?|$)/.test(path) ? path : null;
  } catch { return null; }
}
