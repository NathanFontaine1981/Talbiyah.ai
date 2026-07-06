import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Admin "act as student" impersonation.
//
// Flow: an admin mints a magic-link token for a target student (server-side,
// admin-gated), then the browser swaps its live Supabase session to that student
// via verifyOtp. Every student page/route/edge-function then works verbatim
// because auth.uid() IS the student. On exit we restore the admin's session from
// a stash saved at the start.
//
// The one admin superpower a student doesn't have — comping a booking — is done
// by calling the booking edge function with the STASHED ADMIN token via
// adminAuthedInvoke(), independent of the swapped-in student session.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// localStorage keys.
export const ADMIN_STASH_KEY = 'talbiyah_admin_stash';
export const IMPERSONATION_KEY = 'talbiyah_impersonation';

interface AdminStash {
  access_token: string;
  refresh_token: string;
}

export interface ImpersonationState {
  target_user_id: string;
  target_name: string;
  target_email: string;
  log_id: string | null;
  started_at: number; // epoch ms
}

export function getStashedAdminSession(): AdminStash | null {
  try {
    const raw = localStorage.getItem(ADMIN_STASH_KEY);
    return raw ? (JSON.parse(raw) as AdminStash) : null;
  } catch {
    return null;
  }
}

export function getImpersonationState(): ImpersonationState | null {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as ImpersonationState;
    // No silent time-based expiry. A lazy null-on-expiry here is dangerous: the
    // live Supabase session is still the STUDENT until an explicit Exit restores
    // the admin, so "expiring" only the flag would (a) strand the admin on the
    // student session with no banner/Exit, and (b) make a "comp" booking fall
    // through to the normal payment path and silently charge the student.
    // Impersonation therefore persists until Exit (the banner is always visible).
    return state;
  } catch {
    return null;
  }
}

export function isImpersonating(): boolean {
  return getImpersonationState() !== null;
}

function clearImpersonationStorage() {
  localStorage.removeItem(ADMIN_STASH_KEY);
  localStorage.removeItem(IMPERSONATION_KEY);
}

/**
 * Invoke an edge function authenticated as the ADMIN, using the stashed admin
 * token — independent of whatever session is currently live (which, during
 * impersonation, is the student). Refreshes the admin token if it has expired
 * and writes the refreshed tokens back to the stash.
 */
export async function adminAuthedInvoke<T = unknown>(
  fnName: string,
  body: Record<string, unknown>
): Promise<T> {
  const stash = getStashedAdminSession();
  if (!stash) throw new Error('No admin session available — please exit and sign in again.');

  // A throwaway client that does NOT touch the shared persisted session.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  // setSession validates and, if the access token is expired, refreshes it using
  // the refresh token — returning the fresh pair.
  const { data: sessionData, error: sessionError } = await adminClient.auth.setSession({
    access_token: stash.access_token,
    refresh_token: stash.refresh_token,
  });

  if (sessionError || !sessionData.session) {
    throw new Error('Admin session expired — please exit impersonation and sign in again.');
  }

  // Persist any refreshed tokens back to the stash so the next call is valid.
  if (sessionData.session.access_token !== stash.access_token) {
    localStorage.setItem(
      ADMIN_STASH_KEY,
      JSON.stringify({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      })
    );
  }

  const { data, error } = await adminClient.functions.invoke(fnName, { body });
  if (error) throw error;
  if (data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

/**
 * Start impersonating a student. Stashes the admin session, mints a student
 * session server-side, and swaps the live session to the student.
 */
export async function startImpersonation(targetUserId: string): Promise<void> {
  // 1. Stash the admin's current session FIRST (before anything overwrites auth storage).
  const { data: { session: adminSession } } = await supabase.auth.getSession();
  if (!adminSession) throw new Error('You must be signed in as an admin.');

  localStorage.setItem(
    ADMIN_STASH_KEY,
    JSON.stringify({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    })
  );

  // 2. Ask the admin-gated function to mint a magic-link token for the target.
  //    The live session is still the admin here, so a normal invoke is correct.
  const { data, error } = await supabase.functions.invoke('admin-impersonation', {
    body: { action: 'start', target_user_id: targetUserId },
  });

  if (error || (data && (data as { error?: string }).error)) {
    localStorage.removeItem(ADMIN_STASH_KEY);
    throw new Error(
      (data as { error?: string })?.error || error?.message || 'Failed to start impersonation.'
    );
  }

  const { token_hash, email, target_name, log_id } = data as {
    token_hash: string;
    email: string;
    target_name: string;
    log_id: string | null;
  };

  // 3. Record the impersonation flag before swapping (survives the session change / reloads).
  const state: ImpersonationState = {
    target_user_id: targetUserId,
    target_name,
    target_email: email,
    log_id,
    started_at: Date.now(),
  };
  localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(state));

  // 4. Swap the live session to the student. Fires SIGNED_IN → ProtectedRoute recomputes.
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash,
  });

  if (otpError) {
    // Roll back: restore admin session and clear flags.
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    });
    clearImpersonationStorage();
    throw new Error(otpError.message || 'Failed to enter the student session.');
  }
}

/**
 * Stop impersonating: restore the admin session, stamp the audit log, and clear storage.
 */
export async function stopImpersonation(): Promise<void> {
  const state = (() => {
    try {
      const raw = localStorage.getItem(IMPERSONATION_KEY);
      return raw ? (JSON.parse(raw) as ImpersonationState) : null;
    } catch {
      return null;
    }
  })();
  const stash = getStashedAdminSession();

  // 1. Restore the admin's session. Fires SIGNED_IN → ProtectedRoute recomputes isAdmin.
  if (stash) {
    let restoreError: unknown = null;
    try {
      const { error } = await supabase.auth.setSession({
        access_token: stash.access_token,
        refresh_token: stash.refresh_token,
      });
      restoreError = error;
    } catch (e) {
      restoreError = e;
    }
    if (restoreError) {
      // Admin session couldn't be restored; force a clean sign-out so the user
      // re-authenticates rather than being stuck as the student.
      clearImpersonationStorage();
      await supabase.auth.signOut();
      throw new Error('Could not restore your admin session — please sign in again.');
    }
  } else if (state) {
    // We were impersonating but the admin stash is gone — we cannot restore the
    // admin session. Sign out cleanly rather than silently leaving the admin
    // stranded on the student session.
    clearImpersonationStorage();
    await supabase.auth.signOut();
    throw new Error('Your admin session was lost — please sign in again.');
  }

  // 2. Best-effort: stamp ended_at (we're the admin again now, so a normal invoke works).
  if (state?.log_id) {
    try {
      await supabase.functions.invoke('admin-impersonation', { body: { action: 'end', log_id: state.log_id } });
    } catch (e) {
      console.error('Failed to close impersonation log (non-blocking):', e);
    }
  }

  // 3. Clear storage.
  clearImpersonationStorage();
}
