import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Bell,
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
  Trophy,
  Gift,
  Copy,
  CheckCircle,
  ArrowRight,
  MessageCircle,
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
  Menu,
  X,
  Compass,
  UserPlus,
  Moon,
  Lightbulb,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UpcomingSessionsCard from '../components/UpcomingSessionsCard';
import RecentRecordingsCard from '../components/RecentRecordingsCard';
import RecentMessagesCard from '../components/RecentMessagesCard';
import LearningStatsWidget from '../components/LearningStatsWidget';
import RecommendedActionsCard from '../components/RecommendedActionsCard';
import AnnouncementsCard from '../components/AnnouncementsCard';
import MyLearningJourneyCard from '../components/MyLearningJourneyCard';
import PrayerTimesWidget from '../components/PrayerTimesWidget';
import DashboardHeader from '../components/DashboardHeader';
import TeacherSessionsCard from '../components/TeacherSessionsCard';
import TeacherStatsWidget from '../components/TeacherStatsWidget';
import TeacherStudentsCard from '../components/TeacherStudentsCard';
import ReferralWidget from '../components/ReferralWidget';
import TeacherAvailabilityCard from '../components/TeacherAvailabilityCard';
import CreditBalanceWidget from '../components/CreditBalanceWidget';
import MyTeachersSection from '../components/student/MyTeachersSection';
import { DiagnosticCTACard } from '../components/diagnostic';
import {
  ProgressOverview,
  CurriculumProgress,
  SurahProgressMini,
  ProgressChartMini,
  HomeworkSummary,
  MilestoneVerification,
} from '../components/progress';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  roles?: string[];
  referral_code?: string | null;
}

interface LearnerData {
  id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  referral_code?: string;
  learning_credits?: number;
}

interface ChildLink {
  id: string;
  child_id: string;
  child_name: string;
  child_age: number | null;
  child_gender: string | null;
  has_account: boolean;
  account_id: string | null;
}

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

// Premium Glass Card wrapper component
const GlassCard = ({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`
    bg-white/70 backdrop-blur-xl rounded-3xl
    border border-gray-200/60
    shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
    ${hover ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-gray-300/60 transition-all duration-300' : ''}
    ${className}
  `}>
    {children}
  </div>
);

export default function DashboardPremium() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [learner, setLearner] = useState<LearnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('Student');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedViewRole, setSelectedViewRole] = useState<string>('Student');
  const [referralCopied, setReferralCopied] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(true);
  const [hasChildren, setHasChildren] = useState(true);
  const [isParent, setIsParent] = useState(false);
  const [children, setChildren] = useState<ChildLink[]>([]);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let successTimeout: NodeJS.Timeout;

    loadUserAndProfile();
    loadUnreadMessageCount();

    const channel = supabase
      .channel('sidebar_unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_messages',
        },
        () => {
          if (isMounted) {
            loadUnreadMessageCount();
          }
        }
      )
      .subscribe();

    const bookingSuccess = searchParams.get('booking_success');
    const paymentMethod = searchParams.get('payment');
    if (bookingSuccess === 'true') {
      setShowBookingSuccess(true);
      setBookingPaymentMethod(paymentMethod);
      setSearchParams({});
      successTimeout = setTimeout(() => {
        if (isMounted) {
          setShowBookingSuccess(false);
        }
      }, 5000);
    }

    return () => {
      isMounted = false;
      channel.unsubscribe();
      if (successTimeout) clearTimeout(successTimeout);
    };
  }, []);

  async function loadUnreadMessageCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('lesson_messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', user.id)
        .is('read_at', null);

      setUnreadMessageCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  async function loadUserAndProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      setUserId(user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, roles, referral_code')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const userIsParent = profileData?.roles?.includes('parent') || false;
      setIsParent(userIsParent);

      if (userIsParent) {
        const { data: childrenData } = await supabase
          .from('parent_children')
          .select('id, child_id, child_name, child_age, child_gender, has_account, account_id')
          .eq('parent_id', user.id);

        const childrenList = childrenData || [];
        setChildren(childrenList);
        setHasChildren(childrenList.length > 0);
      }

      const roles: string[] = [];
      const isAdmin = profileData?.roles?.includes('admin') || false;
      if (isAdmin) {
        roles.push('Admin');
      }

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile?.status === 'approved') {
        roles.push('Teacher');

        const { data: availabilityData } = await supabase
          .from('teacher_availability')
          .select('id')
          .eq('teacher_id', teacherProfile.id)
          .eq('is_available', true)
          .limit(1);

        setHasAvailability((availabilityData?.length || 0) > 0);
      }

      // Pending/rejected teachers are still students
      const isApprovedTeacher = teacherProfile?.status === 'approved';
      const isStudent = profileData?.roles?.includes('student') || (!isApprovedTeacher && !isAdmin);
      if (isStudent) {
        roles.push('Student');
      }

      setAvailableRoles(roles);

      let primaryRole = 'Student';
      if (isAdmin) {
        primaryRole = 'Admin';
      } else if (teacherProfile) {
        primaryRole = 'Teacher';
      }
      setUserRole(primaryRole);

      if (roles.length > 1 && roles.includes('Student')) {
        setSelectedViewRole('Student');
      } else {
        setSelectedViewRole(primaryRole);
      }

      const { data: learnerData } = await supabase
        .from('learners')
        .select('id, total_xp, current_level, current_streak, referral_code, learning_credits')
        .eq('parent_id', user.id)
        .maybeSingle();

      setLearner(learnerData);
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  function copyReferralLink() {
    if (!profile?.referral_code) return;

    const referralLink = `${window.location.origin}/signup?ref=${profile.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  const menuSections = [
    {
      title: null,
      items: [
        { icon: Home, label: 'Dashboard', path: '/dashboard', active: true, roles: ['Student', 'Teacher', 'Admin', 'Parent'] },
      ]
    },
    {
      title: 'Learn',
      items: [
        { icon: GraduationCap, label: 'Courses', path: '/courses-overview', active: false, roles: ['Student', 'Parent'] },
        { icon: Search, label: 'Find Teachers', path: '/teachers', active: false, roles: ['Student', 'Parent'] },
        { icon: Users, label: 'My Teachers', path: '/my-teachers', active: false, roles: ['Student'] },
        { icon: Calendar, label: 'My Lessons', path: '/my-classes', active: false, roles: ['Student', 'Parent'] },
        { icon: Users, label: 'Group Classes', path: '/group-classes', active: false, roles: ['Student', 'Parent'], isNew: true },
        { icon: Video, label: 'Recordings', path: '/recordings/history', active: false, roles: ['Student'] },
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
      title: 'Credits',
      items: [
        { icon: CreditCard, label: 'Buy Credits', path: '/buy-credits', active: false, roles: ['Student', 'Parent'] },
        { icon: Gift, label: 'Referrals', path: '/my-referrals', active: false, roles: ['Student'] },
      ]
    },
    {
      title: 'Resources',
      items: [
        { icon: Compass, label: 'Exploring Islam', path: '/explore', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
        { icon: UserPlus, label: 'Unshakeable Foundations', path: '/new-muslim', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
        { icon: Moon, label: 'Learn Salah', path: '/salah', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
        { icon: Mic, label: 'Khutbah Creator', path: '/khutba-creator', active: false, roles: ['Admin'], isNew: true },
        { icon: Home, label: 'Khutbah Reflections', path: '/insights-library', active: false, roles: ['Student', 'Parent', 'Teacher'] },
        { icon: Home, label: 'Khutbah Reflections', path: '/khutba-reflections', active: false, roles: ['Admin'] },
        { icon: Scroll, label: 'Islamic Sources', path: '/islamic-source-reference', active: false, roles: ['Student', 'Admin'] },
        { icon: Library, label: 'Islamic Library', path: '#', active: false, roles: ['Student'], comingSoon: true },
        { icon: Headphones, label: 'Lecture Series', path: '#', active: false, roles: ['Student'], comingSoon: true },
        { icon: Lightbulb, label: 'Suggestions', path: '/suggestions', active: false, roles: ['Student', 'Parent', 'Teacher', 'Admin'] },
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
      title: 'Profile',
      items: [
        { icon: UserIcon, label: 'My Account', path: '/account/settings', active: false, roles: ['Student', 'Teacher', 'Admin'] },
        { icon: Baby, label: 'My Children', path: '/my-children', active: false, roles: ['Parent'] },
        { icon: Settings, label: 'Settings', path: '/account/settings', active: false, roles: ['Student', 'Teacher', 'Admin'] },
      ]
    },
  ];

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.roles.includes(selectedViewRole)) return true;
      if (item.label === 'My Children' && profile?.roles?.includes('parent')) return true;
      return false;
    })
  })).filter(section => section.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50/80 to-rose-50/30 flex">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to dashboard content
      </a>

      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Booking Success Toast */}
      {showBookingSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <GlassCard className="px-6 py-4 flex items-center space-x-3 max-w-md border-emerald-200/60">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Lesson Booked Successfully!</h4>
              <p className="text-sm text-gray-500">
                {bookingPaymentMethod === 'credits'
                  ? 'Your credits have been used. Check your upcoming sessions below.'
                  : 'Your lesson has been confirmed. Check your upcoming sessions below.'}
              </p>
            </div>
            <button
              onClick={() => setShowBookingSuccess(false)}
              aria-label="Dismiss notification"
              className="text-gray-500 hover:text-gray-700 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </GlassCard>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Premium Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        } w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex flex-col transition-all duration-300 fixed h-full z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200/60 flex items-center justify-between">
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className="flex items-center space-x-3 group flex-1"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition whitespace-nowrap">
                  Talbiyah<span className="text-emerald-500">.ai</span>
                </h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">Islamic Learning</p>
              </div>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition rounded-xl hover:bg-gray-100/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="px-4 py-4">
            <div className="relative">
              <label htmlFor="sidebar-search" className="sr-only">Search</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                id="sidebar-search"
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border border-gray-200/60 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className={section.title ? 'mt-4 first:mt-0' : ''}>
              {section.title && !sidebarCollapsed && (
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {section.title && sidebarCollapsed && (
                <div className="border-t border-gray-200/60 my-2"></div>
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
                    className={`w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition-all duration-200 ${
                      item.active
                        ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                        : item.comingSoon
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100/80 border border-transparent hover:border-gray-200/60'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="relative">
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-emerald-600' : ''}`} />
                      {sidebarCollapsed && item.unreadCount && item.unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="font-medium whitespace-nowrap flex-1 text-left text-sm">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.unreadCount && item.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </span>
                    )}
                    {!sidebarCollapsed && item.isNew && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-lg">NEW</span>
                    )}
                    {!sidebarCollapsed && item.comingSoon && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-lg">SOON</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/60">
          <button
            onClick={() => {
              handleSignOut();
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition text-gray-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200/60"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>

        {/* Desktop collapse button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-500 hover:text-emerald-500 hover:border-emerald-300 transition shadow-md"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} ml-0 transition-all duration-300`}>
        {/* Premium Header */}
        <header className="bg-white/60 backdrop-blur-xl border-b border-gray-200/60 flex-shrink-0 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden p-2.5 text-gray-500 hover:text-gray-700 transition rounded-xl hover:bg-gray-100/80 border border-transparent hover:border-gray-200/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden lg:block"></div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button aria-label="Notifications" className="relative p-2.5 text-gray-500 hover:text-gray-700 transition rounded-xl hover:bg-gray-100/80 border border-transparent hover:border-gray-200/60">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              {availableRoles.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    aria-expanded={showRoleSwitcher}
                    aria-label="Switch dashboard view"
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/60 rounded-xl transition"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      selectedViewRole === 'Admin' ? 'bg-amber-500' :
                      selectedViewRole === 'Teacher' ? 'bg-blue-500' :
                      'bg-emerald-500'
                    }`}></span>
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">{selectedViewRole}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${showRoleSwitcher ? 'rotate-90' : ''}`} />
                  </button>

                  {showRoleSwitcher && (
                    <GlassCard className="absolute right-0 top-full mt-2 w-48 overflow-hidden z-50 p-0">
                      <div className="px-3 py-2 border-b border-gray-200/60">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Switch View</p>
                      </div>
                      {availableRoles.map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            setSelectedViewRole(role);
                            setShowRoleSwitcher(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center space-x-3 transition ${
                            selectedViewRole === role
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            role === 'Admin' ? 'bg-amber-500' :
                            role === 'Teacher' ? 'bg-blue-500' :
                            'bg-emerald-500'
                          }`}></span>
                          <span className="font-medium">{role}</span>
                          {selectedViewRole === role && (
                            <CheckCircle className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                      ))}
                    </GlassCard>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200/60">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{profile?.full_name || 'Student'}</p>
                  <p className="text-xs text-gray-500">{isParent ? 'Parent' : selectedViewRole}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  isParent ? 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/20' :
                  selectedViewRole === 'Student' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20' :
                  selectedViewRole === 'Teacher' ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/20' :
                  'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20'
                }`}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {/* Header Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <GlassCard className="p-6">
                  <DashboardHeader
                    userName={profile?.full_name?.split(' ')[0] || 'Student'}
                    userRole={isParent ? 'Parent' : selectedViewRole}
                  />
                </GlassCard>
              </div>

              <div className="lg:col-span-1">
                <GlassCard className="p-6 h-full">
                  <PrayerTimesWidget userRole={isParent ? 'Parent' : selectedViewRole} />
                </GlassCard>
              </div>
            </div>

            {/* Teacher Availability Warning */}
            {selectedViewRole === 'Teacher' && !hasAvailability && (
              <GlassCard className="p-6 mb-6 border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/80">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Set Your Availability</h3>
                    <p className="text-gray-600 mb-4">
                      Students can't book lessons with you until you set your available time slots.
                    </p>
                    <button
                      onClick={() => navigate('/teacher/availability')}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition shadow-lg shadow-amber-500/20 flex items-center space-x-2"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Set Availability</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Diagnostic CTA */}
            {(selectedViewRole === 'Student' && userId) && (
              <div className="mb-6">
                <GlassCard className="overflow-hidden">
                  <DiagnosticCTACard userId={userId} />
                </GlassCard>
              </div>
            )}

            {/* Courses CTA */}
            {(selectedViewRole === 'Student' || isParent) && (
              <GlassCard className="mb-6 p-6 bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 border-emerald-400/30">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Start Your Learning Journey</h3>
                    <p className="text-emerald-50 mb-4">
                      Explore our structured courses in Quranic Studies, Arabic Language, Islamic History, and more.
                    </p>
                    <button
                      onClick={() => navigate('/courses-overview')}
                      className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl font-bold transition shadow-lg flex items-center space-x-2"
                    >
                      <GraduationCap className="w-5 h-5" />
                      <span>Browse Courses</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Parent Children Section */}
            {isParent && !hasChildren && (
              <GlassCard className="mb-6 p-6 bg-gradient-to-r from-purple-500/90 to-purple-600/90 border-purple-400/30">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Add Your First Child</h3>
                    <p className="text-purple-50 mb-4 text-sm">
                      Create student accounts for your children to manage their learning journey.
                    </p>
                    <button
                      onClick={() => navigate('/my-children')}
                      className="px-6 py-3 bg-white hover:bg-purple-50 text-purple-600 rounded-xl font-bold transition shadow-lg flex items-center space-x-2"
                    >
                      <Users className="w-5 h-5" />
                      <span>Add Child Now</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {isParent && hasChildren && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600" />
                    My Children
                  </h2>
                  <button
                    onClick={() => navigate('/my-children')}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1"
                  >
                    Manage All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map((child) => (
                    <GlassCard key={child.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                            {child.child_name?.[0] || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{child.child_name}</h3>
                            {child.child_age && (
                              <p className="text-sm text-gray-500">Age {child.child_age}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        {child.has_account ? (
                          <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg">
                            Full Account
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                            No account yet
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/child/${child.id}/dashboard`)}
                          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition text-sm"
                        >
                          View Dashboard
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {/* Islamic Source Reference Card */}
            <GlassCard className="mb-6 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Need Islamic Guidance?</h3>
                  <p className="text-gray-500 mb-4">
                    Use Islamic Source Reference to find relevant ayahs and authentic Hadith.
                  </p>
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/islamic-source-reference"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Find Sources</span>
                    </Link>
                    <Link
                      to="/about/islamic-source-reference"
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Khutbah Tools */}
            <div className="mb-6 grid md:grid-cols-2 gap-4">
              <GlassCard className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Khutbah Creator</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Generate complete, authentic Friday khutbahs.
                    </p>
                    <button
                      onClick={() => navigate('/khutba-creator')}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-500/20 flex items-center space-x-2 text-sm"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Create Khutbah</span>
                    </button>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Khutbah Reflections</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Turn today's Jummah into a family reflection guide.
                    </p>
                    <button
                      onClick={() => navigate('/khutba-reflections')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 text-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>Family Hour</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Referral Section */}
            {profile?.referral_code && (
              <GlassCard className="p-6 mb-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Gamified Referrals</h3>
                    </div>
                    <p className="text-gray-500 mb-2">
                      Earn 1 credit for every 10 hours your referrals complete!
                    </p>
                    <div className="flex items-center space-x-4 text-sm flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-gray-800">{Math.floor(learner?.learning_credits || 0)} Free Credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 min-w-[320px]">
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Your Referral Code</label>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl font-mono text-xl font-bold text-emerald-600 text-center">
                        {profile.referral_code}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition flex items-center space-x-2"
                        title="Copy full referral link"
                      >
                        {referralCopied ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="mb-3 p-2 bg-white border border-gray-200 rounded text-xs text-gray-600 break-all">
                      {`${window.location.origin}/signup?ref=${profile.referral_code}`}
                    </div>
                    <button
                      onClick={() => navigate('/refer')}
                      className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition flex items-center justify-center space-x-2 text-sm"
                    >
                      <span>View Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Main Content Grid */}
            {selectedViewRole === 'Teacher' ? (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => navigate('/teacher/availability')}
                    className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition shadow-lg shadow-blue-500/20 flex items-center space-x-3"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Manage Your Availability</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                  <div className="lg:col-span-3 space-y-6">
                    <GlassCard><TeacherSessionsCard /></GlassCard>
                    <GlassCard className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Milestone Verifications</h3>
                      <MilestoneVerification variant="dashboard" />
                    </GlassCard>
                    <GlassCard><RecentMessagesCard /></GlassCard>
                    <GlassCard><TeacherAvailabilityCard /></GlassCard>
                    <GlassCard><TeacherStudentsCard /></GlassCard>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <GlassCard><TeacherStatsWidget /></GlassCard>
                    <GlassCard><AnnouncementsCard /></GlassCard>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Progress Overview */}
                <div className="mb-6">
                  <GlassCard className="p-6">
                    <ProgressOverview />
                  </GlassCard>
                </div>

                {/* Curriculum & Surah Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2">
                    <GlassCard className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Curriculum Progress</h3>
                      <CurriculumProgress variant="compact" />
                    </GlassCard>
                  </div>
                  <div className="lg:col-span-1 space-y-4">
                    <GlassCard className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Surah Progress</h3>
                      <SurahProgressMini />
                    </GlassCard>
                    <GlassCard className="p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Study Activity</h4>
                      <ProgressChartMini />
                    </GlassCard>
                    <GlassCard className="p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Homework</h4>
                      <HomeworkSummary />
                    </GlassCard>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                  <div className="lg:col-span-3 space-y-6">
                    <GlassCard><MyTeachersSection /></GlassCard>
                    <GlassCard><UpcomingSessionsCard /></GlassCard>
                    <GlassCard><RecentMessagesCard /></GlassCard>
                    <GlassCard><RecentRecordingsCard /></GlassCard>
                    <GlassCard><MyLearningJourneyCard /></GlassCard>
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <GlassCard><CreditBalanceWidget /></GlassCard>
                    <GlassCard><LearningStatsWidget /></GlassCard>
                    <GlassCard><ReferralWidget /></GlassCard>
                    <GlassCard><RecommendedActionsCard /></GlassCard>
                    <GlassCard><AnnouncementsCard /></GlassCard>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
