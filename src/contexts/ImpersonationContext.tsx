import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  getImpersonationState,
  stopImpersonation,
  IMPERSONATION_KEY,
  ImpersonationState,
} from '../lib/impersonation';

interface ImpersonationContextValue {
  isImpersonating: boolean;
  target: { id: string; name: string; email: string } | null;
  /** Restore the admin session and clear impersonation. */
  exit: () => Promise<void>;
  exiting: boolean;
  /** Re-read the flag from storage (e.g. right after starting impersonation). */
  refresh: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  isImpersonating: false,
  target: null,
  exit: async () => {},
  exiting: false,
  refresh: () => {},
});

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImpersonationState | null>(() => getImpersonationState());
  const [exiting, setExiting] = useState(false);

  const refresh = useCallback(() => {
    setState(getImpersonationState());
  }, []);

  useEffect(() => {
    // Re-read on session swaps (verifyOtp/setSession both fire auth events) and
    // on cross-tab storage changes so the banner stays in sync everywhere.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => refresh());

    const onStorage = (e: StorageEvent) => {
      if (e.key === IMPERSONATION_KEY || e.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const exit = useCallback(async () => {
    setExiting(true);
    try {
      await stopImpersonation();
    } finally {
      setExiting(false);
      refresh();
    }
  }, [refresh]);

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating: state !== null,
        target: state ? { id: state.target_user_id, name: state.target_name, email: state.target_email } : null,
        exit,
        exiting,
        refresh,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
