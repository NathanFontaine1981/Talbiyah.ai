import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Search,
  Users,
  Video,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gift,
  Calendar,
  Edit,
  CreditCard,
  Briefcase,
  Scroll,
  Mic,
  Home,
  Library,
  Headphones,
  Baby,
  TrendingUp,
  Sparkles,
  X,
  Compass,
  UserPlus,
  Receipt,
  Moon,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  active: boolean;
  roles: string[];
  unreadCount?: number;
  isNew?: boolean;
  comingSoon?: boolean;
  external?: boolean;
}

interface MenuSection {
  title: string | null;
  items: MenuItem[];
}

interface DashboardSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedViewRole: string;
  unreadMessageCount: number;
  profileRoles?: string[];
  onSignOut: () => void;
}

export default function DashboardSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen,
  selectedViewRole,
  unreadMessageCount,
  profileRoles,
  onSignOut,
}: DashboardSidebarProps) {
  const navigate = useNavigate();

  // Organised menu sections - simplified structure
  const menuSections: MenuSection[] = [
    {
      title: null,
      items: [
        { icon: Home, label: 'Dashboard', path: '/dashboard', active: true, roles: ['Student', 'Teacher', 'Admin', 'Parent'] },
      ]
    },
    {
      title: 'My Learning',
      items: [
        { icon: Calendar, label: 'My Lessons', path: '/my-classes', active: false, roles: ['Student', 'Parent'] },
        { icon: Users, label: 'My Teachers', path: '/my-teachers', active: false, roles: ['Student'] },
        { icon: Search, label: 'Find Teachers', path: '/teachers', active: false, roles: ['Student', 'Parent'] },
        { icon: Video, label: 'Recordings', path: '/recordings/history', active: false, roles: ['Student'] },
        { icon: GraduationCap, label: 'Courses', path: '/courses-overview', active: false, roles: ['Student', 'Parent'] },
        { icon: Users, label: 'Group Classes', path: '/group-classes', active: false, roles: ['Student', 'Parent'] },
      ]
    },
    {
      title: 'Teach',
      items: [
        { icon: Briefcase, label: 'Teacher Hub', path: '/teacher/hub', active: false, roles: ['Teacher'] },
        { icon: Users, label: 'My Students', path: '/teacher/my-students', active: false, roles: ['Teacher'] },
        { icon: Calendar, label: 'My Calendar', path: '/teacher/schedule', active: false, roles: ['Teacher'] },
        { icon: Calendar, label: 'My Lessons', path: '/my-classes', active: false, roles: ['Teacher'] },
        { icon: Calendar, label: 'Availability', path: '/teacher/availability', active: false, roles: ['Teacher'] },
        { icon: Video, label: 'Recordings', path: '/recordings/history', active: false, roles: ['Teacher'] },
        { icon: Edit, label: 'Edit Profile', path: '/teacher/edit-profile', active: false, roles: ['Teacher'] },
      ]
    },
    {
      title: 'Messages',
      items: [
        { icon: MessageCircle, label: 'Conversations', path: '/messages', active: false, roles: ['Student', 'Teacher'], unreadCount: unreadMessageCount },
      ]
    },
    {
      title: 'Tools & Resources',
      items: [
        { icon: Moon, label: 'Learn Salah', path: '/salah', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
        { icon: Sparkles, label: 'Daily Practice', path: '/daily-review', active: false, roles: ['Student', 'Parent'], isNew: true },
        { icon: Sparkles, label: 'Dua Builder', path: '/dua-builder', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'], isNew: true },
        { icon: Scroll, label: 'Islamic Sources', path: '/islamic-source-reference', active: false, roles: ['Student', 'Admin'] },
        { icon: Mic, label: 'Khutbah Creator', path: '/khutba-creator', active: false, roles: ['Admin'], isNew: true },
        { icon: Home, label: 'Khutbah Reflections', path: '/insights-library', active: false, roles: ['Student', 'Parent', 'Teacher'] },
        { icon: Home, label: 'Khutbah Reflections', path: '/khutba-reflections', active: false, roles: ['Admin'] },
        { icon: Compass, label: 'Exploring Islam', path: '/explore', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
        { icon: UserPlus, label: 'Foundations', path: '/new-muslim', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
        { icon: Library, label: 'Islamic Library', path: '#', active: false, roles: ['Student'], comingSoon: true },
        { icon: Headphones, label: 'Lecture Series', path: '#', active: false, roles: ['Student'], comingSoon: true },
        { icon: Lightbulb, label: 'Suggestions', path: '/suggestions', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
      ]
    },
    {
      title: 'Credits & Billing',
      items: [
        { icon: CreditCard, label: 'Buy Credits', path: '/buy-credits', active: false, roles: ['Student', 'Parent'] },
        { icon: Receipt, label: 'Payment History', path: '/payment-history', active: false, roles: ['Student', 'Parent'] },
        { icon: Gift, label: 'Referrals', path: '/my-referrals', active: false, roles: ['Student'] },
      ]
    },
    {
      title: 'Admin',
      items: [
        { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin', active: false, roles: ['Admin'] },
        { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics', active: false, roles: ['Admin'] },
        { icon: Users, label: 'Manage Users', path: '/admin/users', active: false, roles: ['Admin'] },
        { icon: GraduationCap, label: 'Manage Teachers', path: '/admin/teachers', active: false, roles: ['Admin'] },
        { icon: Sparkles, label: 'Insights Generator', path: '/admin/insights-generator', active: false, roles: ['Admin'] },
        { icon: Lightbulb, label: 'User Suggestions', path: '/admin/suggestions', active: false, roles: ['Admin'] },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: Baby, label: 'My Children', path: '/my-children', active: false, roles: ['Parent'] },
        { icon: Settings, label: 'Settings', path: '/account/settings', active: false, roles: ['Student', 'Teacher', 'Admin', 'Parent'] },
      ]
    },
  ];

  // Filter sections based on selected view role
  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.roles.includes(selectedViewRole)) return true;
      if (item.label === 'My Children' && profileRoles?.includes('parent')) return true;
      return false;
    })
  })).filter(section => section.items.length > 0);

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      } w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 fixed h-full z-50
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <button
          onClick={() => {
            navigate('/');
            setMobileMenuOpen(false);
          }}
          className="flex items-center space-x-3 group flex-1"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition whitespace-nowrap">
                Talbiyah<span className="text-emerald-500">.ai</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Islamic Learning</p>
            </div>
          )}
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className={section.title ? 'mt-4 first:mt-0' : ''}>
            {section.title && !sidebarCollapsed && (
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            {section.title && sidebarCollapsed && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            )}
            <div className="space-y-1">
              {section.items.map((item: MenuItem) => (
                <button
                  key={`${section.title}-${item.path}-${item.label}`}
                  onClick={() => {
                    if (!item.comingSoon) {
                      if (item.external) {
                        window.open(item.path, '_blank');
                      } else {
                        navigate(item.path);
                      }
                      setMobileMenuOpen(false);
                    }
                  }}
                  disabled={item.comingSoon}
                  className={`w-full px-4 py-2.5 rounded-xl flex items-center space-x-3 transition ${
                    item.active
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : item.comingSoon
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarCollapsed && item.unreadCount && item.unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="font-medium whitespace-nowrap flex-1 text-left text-sm">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.unreadCount && item.unreadCount > 0 && (
                    <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </span>
                  )}
                  {!sidebarCollapsed && item.isNew && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded">NEW</span>
                  )}
                  {!sidebarCollapsed && item.comingSoon && (
                    <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-medium rounded">SOON</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            onSignOut();
            setMobileMenuOpen(false);
          }}
          className="w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
          title={sidebarCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Desktop collapse button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center text-gray-400 hover:text-emerald-500 hover:border-emerald-300 transition shadow-md"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
