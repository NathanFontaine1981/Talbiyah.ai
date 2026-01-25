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
  Settings,
  TrendingUp,
  Calendar,
  ChevronLeft,
  Award,
  DollarSign,
  Sparkles,
  Mic,
  Home,
  Plus,
  Brain,
  UsersRound,
  FileVideo,
  Tag,
  MessageSquare,
  ClipboardCheck,
  Shield,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  roles?: string[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Menu sections for better organization
  const menuSections = [
    {
      title: 'Navigation',
      items: [
        { icon: Home, label: 'Home Dashboard', path: '/dashboard', exact: true },
        { icon: LayoutDashboard, label: 'Admin Overview', path: '/admin', exact: true },
      ]
    },
    {
      title: 'User Management',
      items: [
        { icon: Users, label: 'All Users', path: '/admin/users' },
        { icon: GraduationCap, label: 'Teachers', path: '/admin/teachers' },
        { icon: Award, label: 'Teacher Tiers', path: '/admin/teacher-tiers' },
        { icon: DollarSign, label: 'Teacher Payouts', path: '/admin/teacher-payouts' },
        { icon: FileText, label: 'Legacy Billing', path: '/admin/legacy-billing' },
      ]
    },
    {
      title: 'Sessions & Classes',
      items: [
        { icon: Calendar, label: '1-on-1 Sessions', path: '/admin/sessions' },
        { icon: UsersRound, label: 'Group Sessions', path: '/admin/group-sessions' },
        { icon: Plus, label: 'Group Class Creator', path: '/admin/group-session-creator' },
        { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
      ]
    },
    {
      title: 'Quality Control',
      items: [
        { icon: ClipboardCheck, label: 'Diagnostic Assessments', path: '/admin/diagnostic-assessments' },
        { icon: Shield, label: 'Content Moderation', path: '/admin/content-moderation' },
      ]
    },
    {
      title: 'Content & Recordings',
      items: [
        { icon: FileVideo, label: 'Recordings', path: '/admin/recordings' },
        { icon: Sparkles, label: 'Insights Generator', path: '/admin/insights-generator' },
        { icon: Brain, label: 'AI Templates', path: '/admin/insight-templates' },
      ]
    },
    {
      title: 'Analytics & Tools',
      items: [
        { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
        { icon: Mic, label: 'Khutbah Reflections', path: '/khutba-reflections' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: MessageSquare, label: 'User Feedback', path: '/admin/feedback' },
        { icon: Tag, label: 'Promo Codes', path: '/admin/promo-codes' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
      ]
    },
  ];

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, roles')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      if (!profileData?.roles || !profileData.roles.includes('admin')) {
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <aside className={`bg-gradient-to-b from-gray-950 to-gray-900 flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'} flex flex-col border-r border-gray-800`}>
        <div className="p-6 border-b border-gray-800">
          <button onClick={() => navigate('/')} className="flex items-center space-x-3 hover:opacity-80 transition">
            <BookOpen className="w-8 h-8 text-emerald-400" />
            {!sidebarCollapsed && (
              <div>
                <span className="text-xl font-bold text-white block">Talbiyah.ai</span>
                <span className="text-xs text-amber-400 font-semibold">ADMIN PORTAL</span>
              </div>
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {!sidebarCollapsed && (
                  <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                {sidebarCollapsed && sectionIndex > 0 && (
                  <div className="border-t border-gray-700 my-2" />
                )}
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        to={item.path}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition ${
                          isActive(item.path, item.exact)
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your academy platform</p>
            </div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name || 'Admin'}</p>
                  <p className="text-xs text-amber-500">Administrator</p>
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
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
