import { useEffect, useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  DollarSign,
  Settings,
  TrendingUp,
  Calendar,
  FileText,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  is_admin?: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', exact: true },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: GraduationCap, label: 'Teachers', path: '/admin/teachers' },
    { icon: Calendar, label: 'Sessions', path: '/admin/sessions' },
    { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
    { icon: Video, label: 'Recordings', path: '/admin/recordings' },
    { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, is_admin')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      if (!profileData?.is_admin) {
        navigate('/dashboard');
        return;
      }
    } catch (err) {
      console.error('Error checking admin access:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <aside className={`bg-gradient-to-b from-slate-950 to-slate-900 text-white flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} flex flex-col border-r border-slate-800`}>
        <div className="p-6 border-b border-slate-800">
          <button onClick={() => navigate('/')} className="flex items-center space-x-3 hover:opacity-80 transition">
            <BookOpen className="w-8 h-8 text-cyan-400" />
            {!sidebarCollapsed && (
              <div>
                <span className="text-xl font-bold block">Talbiyah.ai</span>
                <span className="text-xs text-amber-400 font-semibold">ADMIN PORTAL</span>
              </div>
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {adminMenuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path, item.exact)
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-950 border-b border-slate-800 flex-shrink-0">
          <div className="px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Manage your academy platform</p>
            </div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-slate-400 hover:text-white transition">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{profile?.full_name || 'Admin'}</p>
                  <p className="text-xs text-amber-400">Administrator</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-red-400 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
