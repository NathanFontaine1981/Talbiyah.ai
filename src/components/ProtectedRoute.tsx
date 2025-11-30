import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  excludeTeachers?: boolean;
  requireTeacherOrAdmin?: boolean;
  skipOnboardingCheck?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  excludeTeachers = false,
  requireTeacherOrAdmin = false,
  skipOnboardingCheck = false
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isApprovedTeacher, setIsApprovedTeacher] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('Session error:', error);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

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
          // Check if admin (for requireAdmin prop)
          if (profile.roles && profile.roles.includes('admin')) {
            setIsAdmin(true);
          }

          // Check if teacher (for excludeTeachers prop)
          if (profile.roles && profile.roles.includes('teacher')) {
            setIsTeacher(true);
          }

          // Check if parent needs onboarding (only for parent role)
          if (profile.role === 'parent' && !profile.onboarding_completed && !skipOnboardingCheck) {
            setNeedsOnboarding(true);
          }
        }

        // Check if user is an approved teacher (for requireTeacherOrAdmin prop)
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('status')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (teacherProfile?.status === 'approved') {
          setIsApprovedTeacher(true);
        }

        // All checks passed, set loading to false
        if (isMounted) {
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Error checking auth:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Check if email is verified (skip for admin users and onboarding page)
  if (!isEmailVerified && !requireAdmin && !skipOnboardingCheck) {
    return <Navigate to="/verify-email" replace />;
  }

  // Check if parent needs to complete onboarding
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
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
