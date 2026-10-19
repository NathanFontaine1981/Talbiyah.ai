import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { saveReturnTo } from '../../lib/madrasaReturn';

/** Wrap a madrasa route (outside ProtectedRoute): if the visitor is signed out, remember the page they wanted. */
export default function RememberReturn({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) saveReturnTo(pathname + search); });
  }, [pathname, search]);
  return <>{children}</>;
}
