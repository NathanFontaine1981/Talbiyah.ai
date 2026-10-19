import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

/**
 * Wraps the 1:1 /dashboard. Madrasa teachers (org members with no 1:1 teacher profile, not platform admins)
 * have nothing useful on the student dashboard, so send them to the madrasa area. Everyone else is untouched,
 * and any lookup failure falls through to the normal dashboard.
 */
export default function MadrasaDashboardGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'madrasa' | 'normal'>('checking');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setState('normal'); return; }
        const [{ data: member }, { data: teacher }, { data: profile }] = await Promise.all([
          supabase.from('madrasa_org_members').select('role').eq('user_id', user.id).limit(1),
          supabase.from('teacher_profiles').select('id').eq('user_id', user.id).limit(1),
          supabase.from('profiles').select('roles, is_admin').eq('id', user.id).maybeSingle(),
        ]);
        const roles: string[] = Array.isArray(profile?.roles) ? profile!.roles : [];
        const isAdmin = profile?.is_admin === true || roles.some((r) => (r ?? '').toLowerCase() === 'admin');
        setState(member?.length && !teacher?.length && !isAdmin ? 'madrasa' : 'normal');
      } catch {
        setState('normal');
      }
    })();
  }, []);

  if (state === 'checking') return <div className="p-8 text-gray-500">Loading…</div>;
  if (state === 'madrasa') return <Navigate to="/madrasa" replace />;
  return <>{children}</>;
}
