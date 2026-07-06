import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { AGREEMENT_VERSION } from '../data/teacherAgreement';
import { isImpersonating } from '../lib/impersonation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  excludeTeachers?: boolean;
  requireTeacherOrAdmin?: boolean;
  skipOnboardingCheck?: boolean;
  skipAgreementCheck?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  excludeTeachers = false,
  requireTeacherOrAdmin = false,
  skipOnboardingCheck = false,
  skipAgreementCheck = false
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isApprovedTeacher, setIsApprovedTeacher] = useState(false);
  const [needsAgreement, setNeedsAgreement] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth(session: Session | null) {
      try {
        if (!isMounted) return;

        if (!session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check if email is verified
        const { data: { user } } = await supabase.auth.getUser();
        setIsEmailVerified(!!user?.email_confirmed_at);

        // Check user role and onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('roles, role, onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profile) {
          // Check if admin (for requireAdmin prop). Case-insensitive to match the
          // edge functions / RLS, which accept 'admin' or 'Admin'.
          const roles: string[] = Array.isArray(profile.roles) ? profile.roles : [];
          if (roles.some((r) => (r ?? '').toLowerCase() === 'admin')) {
            setIsAdmin(true);
          }

          // Check if teacher (for excludeTeachers prop)
          if (roles.some((r) => (r ?? '').toLowerCase() === 'teacher')) {
            setIsTeacher(true);
          }

          // Check if parent needs onboarding (only for parent role)
          if (profile.role === 'parent' && !profile.onboarding_completed && !skipOnboardingCheck) {
            setNeedsOnboarding(true);
          }
        }

        // Check if user is an approved teacher (for requireTeacherOrAdmin prop)
        const { data: teacherProfile, error: teacherError } = await supabase
          .from('teacher_profiles')
          .select('status, agreement_accepted_at, agreement_version')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (teacherError) {
          // The agreement columns may not exist yet (schema not migrated). Fall back
          // to a status-only read so approval still works, and DON'T gate — gating on
          // a failed query would bounce the user between routes forever.
          console.error('Teacher agreement check failed, falling back:', teacherError);
          const { data: basic } = await supabase
            .from('teacher_profiles')
            .select('status')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (basic?.status === 'approved') setIsApprovedTeacher(true);
          setNeedsAgreement(false);
        } else if (teacherProfile?.status === 'approved') {
          setIsApprovedTeacher(true);

          // Approved teachers must accept the current teaching agreement before
          // they can use the teacher area (hard gate).
          const accepted =
            !!teacherProfile.agreement_accepted_at &&
            teacherProfile.agreement_version === AGREEMENT_VERSION;
          setNeedsAgreement(!accepted);
        } else {
          setNeedsAgreement(false);
        }

        // All checks passed, set loading to false
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      checkAuth(session);
    });

    // Listen for auth state changes (including session refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsTeacher(false);
          setIsApprovedTeacher(false);
          setNeedsAgreement(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkAuth(session);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [skipOnboardingCheck]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if email is verified (skip for admin users and onboarding page).
  // While an admin is impersonating a student, don't bounce to /verify-email —
  // an admin must be able to view students whose email isn't confirmed.
  if (!isEmailVerified && !requireAdmin && !skipOnboardingCheck && !isImpersonating()) {
    return <Navigate to="/verify-email" replace />;
  }

  // Check if parent needs to complete onboarding
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Approved teachers must accept the teaching agreement before accessing anything
  // else (hard gate). The agreement page passes skipAgreementCheck to avoid a loop.
  if (needsAgreement && !skipAgreementCheck && !requireAdmin && !isAdmin) {
    return <Navigate to="/teacher/agreement" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireTeacherOrAdmin && !isAdmin && !isApprovedTeacher) {
    return <Navigate to="/" replace />;
  }

  if (excludeTeachers && isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
