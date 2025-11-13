import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  excludeTeachers?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, excludeTeachers = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if email is verified
      const { data: { user } } = await supabase.auth.getUser();
      setIsEmailVerified(!!user?.email_confirmed_at);

      // Check user role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (profile) {
        // Check if admin (for requireAdmin prop)
        if (profile.roles && profile.roles.includes('admin')) {
          setIsAdmin(true);
        }

        // Check if teacher (for excludeTeachers prop)
        if (profile.roles && profile.roles.includes('teacher')) {
          setIsTeacher(true);
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

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

  // Check if email is verified (skip for admin users)
  if (!isEmailVerified && !requireAdmin) {
    return <Navigate to="/verify-email" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (excludeTeachers && isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
