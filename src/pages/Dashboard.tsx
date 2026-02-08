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
  GraduationCap,
  ChevronRight,
  Trophy,
  Gift,
  Copy,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Calendar,
  CreditCard,
  Mic,
  Sparkles,
  Menu,
  X,
  Compass,
  Settings,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UpcomingSessionsCard from '../components/UpcomingSessionsCard';
import RecentMessagesCard from '../components/RecentMessagesCard';
import LearningStatsWidget from '../components/LearningStatsWidget';
import RecommendedActionsCard from '../components/RecommendedActionsCard';
import DailyPracticeWidget from '../components/DailyPracticeWidget';
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
import TokenBalanceWidget from '../components/TokenBalanceWidget';
import MyTeachersSection from '../components/student/MyTeachersSection';
import { DiagnosticCTACard } from '../components/diagnostic';
import {
  ProgressOverview,
  MilestoneVerification,
} from '../components/progress';
import ThemeToggle from '../components/ThemeToggle';
import ConnectReferrerWidget from '../components/ConnectReferrerWidget';
import { DashboardSidebar } from '../components/dashboard';

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
  const [isNewUser, setIsNewUser] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

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

    // Keyboard shortcuts handler
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Show help with ?
      if (key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
        return;
      }

      // Escape closes modals
      if (key === 'escape') {
        setShowKeyboardShortcuts(false);
        setShowRoleSwitcher(false);
        setMobileMenuOpen(false);
        setPendingKey(null);
        return;
      }

      // Two-key shortcuts (g + letter)
      if (pendingKey === 'g') {
        e.preventDefault();
        setPendingKey(null);
        switch (key) {
          case 'd': navigate('/dashboard'); break;
          case 't': navigate('/teachers'); break;
          case 'm': navigate('/messages'); break;
          case 'c': navigate('/courses-overview'); break;
          case 'l': navigate('/my-classes'); break;
          case 's': navigate('/account/settings'); break;
        }
        return;
      }

      // Start of two-key sequence
      if (key === 'g') {
        setPendingKey('g');
        // Clear pending key after 1 second
        setTimeout(() => setPendingKey(null), 1000);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      channel.unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
      if (successTimeout) clearTimeout(successTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey]);

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
        if (teacherProfile.status === 'rejected') {
          navigate('/teacher/rejected');
          return;
        } else if (teacherProfile.status === 'approved' || teacherProfile.status === 'pending_approval') {
          // Grant Teacher dashboard for both approved and pending teachers
          roles.push('Teacher');

          const { data: availabilityData } = await supabase
            .from('teacher_availability')
            .select('id')
            .eq('teacher_id', teacherProfile.id)
            .eq('is_available', true)
            .limit(1);

          setHasAvailability((availabilityData?.length || 0) > 0);
        }
        // If status is neither pending, rejected, nor approved, don't grant Teacher role
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
      } else if (teacherProfile && teacherProfile.status === 'approved') {
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

      // Check if user is new (no lessons completed, account created within last 7 days)
      const { count: lessonCount } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`)
        .eq('status', 'completed');

      const accountAge = user.created_at ?
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24) : 999;

      const userIsNew = (lessonCount === 0 || lessonCount === null) && accountAge < 7;
      setIsNewUser(userIsNew);

      // Show welcome banner if new and hasn't dismissed it
      // Add ?welcome=test to URL to force show banner for testing
      const forceWelcome = searchParams.get('welcome') === 'test';
      if (forceWelcome) {
        localStorage.removeItem('talbiyah_welcome_dismissed');
      }
      const dismissedWelcome = localStorage.getItem('talbiyah_welcome_dismissed');
      if ((userIsNew || forceWelcome) && !dismissedWelcome) {
        setShowWelcomeBanner(true);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        {/* Skeleton Sidebar */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </aside>

        {/* Skeleton Content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse lg:hidden"></div>
              <div className="hidden lg:block"></div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-8">
            <div className="max-w-[1600px] mx-auto">
              {/* Header skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"></div>
              </div>
              {/* Content skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                  <div className="h-48 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                  <div className="h-64 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-40 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                  <div className="h-40 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

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

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowKeyboardShortcuts(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Navigation</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Go to Dashboard</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">g</kbd>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">d</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Find Teachers</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">g</kbd>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">t</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Messages</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">g</kbd>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">m</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Courses</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">g</kbd>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">c</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">My Lessons</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">g</kbd>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">l</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Settings</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">g</kbd>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">s</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">General</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Show this help</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">?</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Close modal / Cancel</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-400 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">?</kbd> anytime to toggle this help
            </p>
          </div>
        </div>
      )}

      {/* Pending Key Indicator */}
      {pendingKey && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-700 rounded text-sm font-mono">{pendingKey}</kbd>
          <span className="text-gray-300 text-sm">waiting for next key...</span>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <DashboardSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        selectedViewRole={selectedViewRole}
        unreadMessageCount={unreadMessageCount}
        profileRoles={profile?.roles}
        onSignOut={handleSignOut}
      />

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
              <button
                className="relative p-2 text-gray-500 hover:text-gray-700 transition"
                aria-label="Notifications (new notifications available)"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></span>
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
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Switch View</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Changes this page's layout</p>
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
                              ? role === 'Admin' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            role === 'Admin' ? 'bg-amber-500' :
                            role === 'Teacher' ? 'bg-blue-500' :
                            'bg-emerald-500'
                          }`}></span>
                          <span className="font-medium">{role} View</span>
                          {selectedViewRole === role && (
                            <CheckCircle className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                      ))}
                      {availableRoles.includes('Admin') && (
                        <>
                          <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                          <Link
                            to="/admin"
                            onClick={() => setShowRoleSwitcher(false)}
                            className="w-full px-4 py-3 flex items-center space-x-3 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="font-medium">Go to Admin Panel</span>
                            <ArrowRight className="w-4 h-4 ml-auto" />
                          </Link>
                        </>
                      )}
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

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
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

            {/* New User Welcome Banner */}
            {showWelcomeBanner && (selectedViewRole === 'Student' || isParent) && (
              <div className="mb-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Welcome to Talbiyah.ai! 🎉</h2>
                      <p className="text-emerald-50">Here's how to get started with your Islamic learning journey:</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowWelcomeBanner(false);
                        localStorage.setItem('talbiyah_welcome_dismissed', 'true');
                      }}
                      className="text-white/70 hover:text-white transition p-1"
                      aria-label="Dismiss welcome banner"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/15 backdrop-blur rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">1</div>
                        <h3 className="font-semibold text-white">Find a Teacher</h3>
                      </div>
                      <p className="text-emerald-50 text-sm">Browse our qualified teachers and book your first lesson</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">2</div>
                        <h3 className="font-semibold text-white">Explore Free Courses</h3>
                      </div>
                      <p className="text-emerald-50 text-sm">Start with Exploring Islam or Unshakeable Foundations - completely free!</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">3</div>
                        <h3 className="font-semibold text-white">Try AI Tools</h3>
                      </div>
                      <p className="text-emerald-50 text-sm">Use Dua Builder, Khutbah Creator, and more - many features are free!</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate('/teachers')}
                      className="px-5 py-2.5 bg-white hover:bg-gray-100 text-emerald-600 rounded-full font-semibold transition shadow-lg flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Find Teachers
                    </button>
                    <button
                      onClick={() => navigate('/explore')}
                      className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold transition flex items-center gap-2"
                    >
                      <Compass className="w-4 h-4" />
                      Exploring Islam
                    </button>
                    <button
                      onClick={() => navigate('/features')}
                      className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold transition flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      See All Features
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              <div className="mb-6 grid md:grid-cols-2 gap-4">
                <CreditBalanceWidget />
                <TokenBalanceWidget />
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
    </div>
  );
}
