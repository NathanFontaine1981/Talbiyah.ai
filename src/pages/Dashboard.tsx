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
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UpcomingSessionsCard from '../components/UpcomingSessionsCard';
import RecentMessagesCard from '../components/RecentMessagesCard';
import LearningStatsWidget from '../components/LearningStatsWidget';
import RecommendedActionsCard from '../components/RecommendedActionsCard';
import DailyPracticeWidget from '../components/DailyPracticeWidget';
import TalbiyahBot from '../components/TalbiyahBot';
import FeedbackWidget from '../components/FeedbackWidget';
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
  MilestoneVerification,
} from '../components/progress';
import ThemeToggle from '../components/ThemeToggle';
import ConnectReferrerWidget from '../components/ConnectReferrerWidget';

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
}

export default function Dashboard() {
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

    // Subscribe to new messages for real-time badge updates
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

    // Check for booking success
    const bookingSuccess = searchParams.get('booking_success');
    const paymentMethod = searchParams.get('payment');
    if (bookingSuccess === 'true') {
      setShowBookingSuccess(true);
      setBookingPaymentMethod(paymentMethod);
      // Clear the query params
      setSearchParams({});
      // Auto-hide after 5 seconds
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUnreadMessageCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all unread messages where user is not the sender
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

      // Check if user is a parent
      const userIsParent = profileData?.roles?.includes('parent') || false;
      setIsParent(userIsParent);

      // If user is a parent, load their children
      if (userIsParent) {
        const { data: childrenData } = await supabase
          .from('parent_children')
          .select('id, child_id, child_name, child_age, child_gender, has_account, account_id')
          .eq('parent_id', user.id);

        const childrenList = childrenData || [];
        setChildren(childrenList);
        setHasChildren(childrenList.length > 0);
      }

      // Build available roles for this user
      const roles: string[] = [];

      // Check for admin role
      const isAdmin = profileData?.roles?.includes('admin') || false;
      if (isAdmin) {
        roles.push('Admin');
      }

      // Check for teacher role
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        if (teacherProfile.status === 'pending_approval') {
          navigate('/teacher/pending-approval');
          return;
        } else if (teacherProfile.status === 'rejected') {
          navigate('/teacher/rejected');
          return;
        }
        roles.push('Teacher');

        const { data: availabilityData } = await supabase
          .from('teacher_availability')
          .select('id')
          .eq('teacher_id', teacherProfile.id)
          .eq('is_available', true)
          .limit(1);

        setHasAvailability((availabilityData?.length || 0) > 0);
      }

      // Check for student role (either explicitly in roles array or as default)
      const isStudent = profileData?.roles?.includes('student') || (!teacherProfile && !isAdmin);
      if (isStudent) {
        roles.push('Student');
      }

      setAvailableRoles(roles);

      // Set primary role (for display) - Admin takes precedence, then Teacher, then Student
      let primaryRole = 'Student';
      if (isAdmin) {
        primaryRole = 'Admin';
      } else if (teacherProfile) {
        primaryRole = 'Teacher';
      }
      setUserRole(primaryRole);

      // Set selected view role - if user has multiple roles, default to Admin view; they can switch
      // But if they explicitly have student role alongside admin, start with Student view for familiar UX
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

  // Organised menu sections
  const menuSections = [
    {
      title: null, // No header for home section
      items: [
        { icon: Home, label: 'Dashboard', path: '/dashboard', active: true, roles: ['Student', 'Teacher', 'Admin', 'Parent'] },
      ]
    },
    {
      title: 'Learn',
      items: [
        { icon: GraduationCap, label: 'Courses', path: '/courses-overview', active: false, roles: ['Student', 'Parent'] },
        { icon: BookOpen, label: 'Learn Salah', path: '/salah', active: false, roles: ['Student', 'Parent'], isNew: true },
        { icon: Search, label: 'Find Teachers', path: '/teachers', active: false, roles: ['Student', 'Parent'] },
        { icon: Users, label: 'My Teachers', path: '/my-teachers', active: false, roles: ['Student'] },
        { icon: Calendar, label: 'My Lessons', path: '/my-classes', active: false, roles: ['Student', 'Parent'] },
        { icon: Sparkles, label: 'Daily Practice', path: '/daily-review', active: false, roles: ['Student', 'Parent'], isNew: true },
        { icon: Users, label: 'Group Classes', path: '/group-classes', active: false, roles: ['Student', 'Parent'] },
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
        { icon: Mic, label: 'Khutbah Creator', path: '/khutba-creator', active: false, roles: ['Admin'], isNew: true },
        { icon: Home, label: 'Khutbah Reflections', path: '/insights-library', active: false, roles: ['Student', 'Parent', 'Teacher'] },
        { icon: Home, label: 'Khutbah Reflections', path: '/khutba-reflections', active: false, roles: ['Admin'] },
        { icon: Scroll, label: 'Islamic Sources', path: '/islamic-source-reference', active: false, roles: ['Student', 'Admin'] },
        { icon: Library, label: 'Islamic Library', path: '#', active: false, roles: ['Student'], comingSoon: true },
        { icon: Headphones, label: 'Lecture Series', path: '#', active: false, roles: ['Student'], comingSoon: true },
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

  // Filter sections based on selected view role (allows dual-role users to switch views)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Booking Success Toast */}
      {showBookingSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center space-x-3 max-w-md">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">Lesson Booked Successfully!</h4>
              <p className="text-sm text-emerald-100">
                {bookingPaymentMethod === 'credits'
                  ? 'Your credits have been used. Check your upcoming sessions below.'
                  : 'Your lesson has been confirmed. Check your upcoming sessions below.'}
              </p>
            </div>
            <button
              onClick={() => setShowBookingSuccess(false)}
              className="text-white/80 hover:text-white ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 fixed h-full z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className={section.title ? 'mt-4 first:mt-0' : ''}>
              {section.title && !sidebarCollapsed && (
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {section.title && sidebarCollapsed && (
                <div className="border-t border-gray-200 my-2"></div>
              )}
              <div className="space-y-1">
                {section.items.map((item: MenuItem) => (
                  <button
                    key={`${section.title}-${item.path}-${item.label}`}
                    onClick={() => {
                      if (!item.comingSoon) {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }
                    }}
                    disabled={item.comingSoon}
                    className={`w-full px-4 py-2.5 rounded-xl flex items-center space-x-3 transition ${
                      item.active
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : item.comingSoon
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="relative">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarCollapsed && item.unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span className="font-medium whitespace-nowrap flex-1 text-left text-sm">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.unreadCount > 0 && (
                      <span className="min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </span>
                    )}
                    {!sidebarCollapsed && item.isNew && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded">NEW</span>
                    )}
                    {!sidebarCollapsed && item.comingSoon && (
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-medium rounded">SOON</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              handleSignOut();
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition text-gray-600 hover:bg-red-50 hover:text-red-600"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>

        {/* Desktop collapse button - hidden on mobile */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-emerald-500 hover:border-emerald-300 transition shadow-md"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0 transition-all duration-300`}>
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition rounded-lg hover:bg-gray-100"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden lg:block"></div>

            <div className="flex items-center space-x-2 sm:space-x-6">
              <ThemeToggle variant="dropdown" />
              <button className="relative p-2 text-gray-500 hover:text-gray-700 transition">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Role Switcher for users with multiple roles */}
              {availableRoles.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      selectedViewRole === 'Admin' ? 'bg-amber-500' :
                      selectedViewRole === 'Teacher' ? 'bg-blue-500' :
                      'bg-emerald-500'
                    }`}></span>
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">{selectedViewRole} View</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showRoleSwitcher ? 'rotate-90' : ''}`} />
                  </button>

                  {showRoleSwitcher && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Switch Dashboard View</p>
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
                          <span className="font-medium">{role} Dashboard</span>
                          {selectedViewRole === role && (
                            <CheckCircle className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.full_name || 'Student'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{isParent ? 'Parent' : (availableRoles.length > 1 ? availableRoles.join(' & ') : userRole)}</p>
                </div>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  isParent ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                  selectedViewRole === 'Student' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                  selectedViewRole === 'Teacher' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                  selectedViewRole === 'Admin' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                  'bg-gradient-to-br from-emerald-400 to-emerald-600'
                }`}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="hidden sm:block p-2 text-gray-500 hover:text-red-500 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <DashboardHeader
                  userName={profile?.full_name?.split(' ')[0] || 'Student'}
                  userRole={isParent ? 'Parent' : selectedViewRole}
                />
              </div>

              <div className="lg:col-span-1">
                <PrayerTimesWidget userRole={isParent ? 'Parent' : selectedViewRole} />
              </div>
            </div>

            {/* Teacher Availability Warning Banner */}
            {selectedViewRole === 'Teacher' && !hasAvailability && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 mb-6 border border-amber-400/30 shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Set Your Availability</h3>
                    <p className="text-amber-50 mb-4">
                      Students can't book lessons with you until you set your available time slots. Set your schedule now to start receiving bookings!
                    </p>
                    <button
                      onClick={() => navigate('/teacher/availability')}
                      className="px-6 py-3 bg-white hover:bg-amber-50 text-amber-600 rounded-lg font-semibold transition shadow-lg flex items-center space-x-2"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Set Availability Now</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Connect Referrer - Only shows if eligible (no referrer, no completed lessons) */}
            {(selectedViewRole === 'Student' || isParent) && userId && (
              <div className="mb-6">
                <ConnectReferrerWidget userId={userId} />
              </div>
            )}

            {/* PRIORITY 1: Your Progress - Students want to see immediate stats */}
            {(selectedViewRole === 'Student' || isParent) && (
              <div className="mb-6">
                <ProgressOverview />
              </div>
            )}

            {/* PRIORITY 2: Credits & Booking */}
            {(selectedViewRole === 'Student' || isParent) && (
              <div className="mb-6">
                <CreditBalanceWidget />
              </div>
            )}

            {/* PRIORITY 2: Upcoming Sessions - What's coming next */}
            {(selectedViewRole === 'Student' || isParent) && (
              <div className="mb-6">
                <UpcomingSessionsCard />
              </div>
            )}

            {/* PRIORITY 4: My Learning Journey - Recent recordings/insights */}
            {(selectedViewRole === 'Student' || isParent) && (
              <div className="mb-6">
                <MyLearningJourneyCard />
              </div>
            )}

            {/* PRIORITY 5: Start Learning Journey - Course browsing (lower priority for existing students) */}
            {(selectedViewRole === 'Student' || isParent) && (
              <div className="mb-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Explore Courses</h3>
                    <p className="text-amber-50 mb-4">
                      Browse structured courses in Quranic Studies, Arabic Language, Islamic History, and more.
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => navigate('/courses-overview')}
                        className="px-6 py-3 bg-white hover:bg-amber-50 text-amber-700 rounded-full font-bold transition shadow-lg flex items-center space-x-2"
                      >
                        <GraduationCap className="w-5 h-5" />
                        <span>Browse Courses</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Learn Salah - Interactive Prayer Tutorial */}
            {(selectedViewRole === 'Student' || isParent) && (
              <div className="mb-6 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">🕌</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Learn Salah</h3>
                    <p className="text-emerald-50 mb-4">
                      Understand what you're saying to Allah. Learn the meaning of every word in your prayer.
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => navigate('/salah')}
                        className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-700 rounded-full font-bold transition shadow-lg flex items-center space-x-2"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>Start Learning</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRIORITY 6: Diagnostic Assessment - One-time, not daily priority */}
            {(selectedViewRole === 'Student' && userId) && (
              <div className="mb-6">
                <DiagnosticCTACard userId={userId} />
              </div>
            )}

            {isParent && !hasChildren && (
              <div className="mb-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 border-2 border-purple-400 shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Add Your First Child</h3>
                    <p className="text-purple-50 mb-4 text-sm">
                      Create student accounts for your children to manage their learning journey, book lessons on their behalf, and track their progress all in one place.
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
              </div>
            )}

            {isParent && hasChildren && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
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
                    <div
                      key={child.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {child.child_name?.[0] || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{child.child_name}</h3>
                            {child.child_age && (
                              <p className="text-sm text-gray-500">Age {child.child_age}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        {child.has_account ? (
                          <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                            Full Account
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            No account yet
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => navigate(`/child/${child.id}/dashboard`)}
                          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition text-sm"
                        >
                          View Dashboard
                        </button>
                        {!child.has_account && (
                          <button
                            onClick={() => navigate('/my-children')}
                            className="w-full px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition text-sm flex items-center justify-center gap-1"
                          >
                            <span>🔓</span>
                            Create Login
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Islamic Source Reference Card - For All Users */}
            <div className="mb-6 bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Need Islamic Guidance?</h3>
                  <p className="text-gray-500 mb-4">
                    Use Islamic Source Reference to find relevant ayahs and authentic Hadith. A helpful reference tool available 24/7.
                  </p>
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/islamic-source-reference"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition shadow-md flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Find Sources Now</span>
                    </Link>
                    <Link
                      to="/about/islamic-source-reference"
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Khutbah Tools Card - For All Users */}
            <div className="mb-6 grid md:grid-cols-2 gap-4">
              {/* Khutbah Creator */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Khutbah Creator</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Generate complete, authentic Friday khutbahs for school Jummah, youth groups, or community masajid.
                    </p>
                    <button
                      onClick={() => navigate('/khutba-creator')}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition shadow-md flex items-center space-x-2 text-sm"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Create Khutbah</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Khutbah Reflections */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Khutbah Reflections</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Turn today's Jummah khutbah into a family-friendly reflection guide for your weekend "Family Hour".
                    </p>
                    <button
                      onClick={() => navigate('/khutba-reflections')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold transition shadow-md flex items-center space-x-2 text-sm"
                    >
                      <Users className="w-4 h-4" />
                      <span>Family Hour</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Referrals */}
            {profile?.referral_code && (
              <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Your Referrals</h3>
                    </div>
                    <p className="text-gray-500 mb-2">
                      Share Talbiyah.ai and earn 1 free credit for every 10 hours your referrals complete!
                    </p>
                    <div className="flex items-center space-x-4 text-sm flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-gray-900">{Math.floor(learner?.learning_credits || 0)} Free Credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-w-[320px]">
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Your Referral Code</label>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-xl font-bold text-emerald-600 text-center">
                        {profile.referral_code}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2"
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
                      className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition flex items-center justify-center space-x-2 text-sm"
                    >
                      <span>View Referral Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedViewRole === 'Teacher' ? (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => navigate('/teacher/availability')}
                    className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition shadow-lg flex items-center space-x-3"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Manage Your Availability</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                  <div className="lg:col-span-3 space-y-6">
                    <TeacherSessionsCard />
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Verifications</h3>
                      <MilestoneVerification variant="dashboard" />
                    </div>
                    <RecentMessagesCard />
                    <TeacherAvailabilityCard />
                    <TeacherStudentsCard />
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <TeacherStatsWidget />
                    <AnnouncementsCard />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                  <div className="lg:col-span-3 space-y-6">
                    <MyTeachersSection />
                    <RecentMessagesCard />
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <DailyPracticeWidget />
                    <LearningStatsWidget />
                    <ReferralWidget />
                    <RecommendedActionsCard />
                    <AnnouncementsCard />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <TalbiyahBot />
      <FeedbackWidget />
    </div>
  );
}
