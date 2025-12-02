import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Award,
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
  FileText,
  UserCog,
  Baby,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UpcomingSessionsCard from '../components/UpcomingSessionsCard';
import RecentRecordingsCard from '../components/RecentRecordingsCard';
import RecentMessagesCard from '../components/RecentMessagesCard';
import LearningStatsWidget from '../components/LearningStatsWidget';
import RecommendedActionsCard from '../components/RecommendedActionsCard';
import TalbiyahBot from '../components/TalbiyahBot';
import AnnouncementsCard from '../components/AnnouncementsCard';
import MyLearningJourneyCard from '../components/MyLearningJourneyCard';
import PrayerTimesWidget from '../components/PrayerTimesWidget';
import PointsRedemption from '../components/PointsRedemption';
import DashboardHeader from '../components/DashboardHeader';
import TeacherSessionsCard from '../components/TeacherSessionsCard';
import TeacherStatsWidget from '../components/TeacherStatsWidget';
import TeacherStudentsCard from '../components/TeacherStudentsCard';
import ReferralWidget from '../components/ReferralWidget';
import TeacherAvailabilityCard from '../components/TeacherAvailabilityCard';
import CreditBalanceWidget from '../components/CreditBalanceWidget';
import MyTeachersSection from '../components/student/MyTeachersSection';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  roles?: string[];
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
  const [referralCopied, setReferralCopied] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(true);
  const [hasChildren, setHasChildren] = useState(true);
  const [isParent, setIsParent] = useState(false);
  const [children, setChildren] = useState<ChildLink[]>([]);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, roles')
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

      if (profileData?.roles && profileData.roles.includes('admin')) {
        setUserRole('Admin');
      } else {
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
          setUserRole('Teacher');

          const { data: availabilityData } = await supabase
            .from('teacher_availability')
            .select('id')
            .eq('teacher_id', teacherProfile.id)
            .eq('is_available', true)
            .limit(1);

          setHasAvailability((availabilityData?.length || 0) > 0);
        } else {
          setUserRole('Student');
        }
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
    if (!learner?.referral_code) return;

    const referralLink = `${window.location.origin}/signup?ref=${learner.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  // Organized menu sections
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

  // Filter sections based on user role
  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.roles.includes(userRole)) return true;
      if (item.label === 'My Children' && profile?.roles?.includes('parent')) return true;
      return false;
    })
  })).filter(section => section.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Booking Success Toast */}
      {showBookingSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center space-x-3 max-w-md">
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

      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 fixed h-full z-40`}
      >
        <div className="p-6 border-b border-slate-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 group w-full"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-white group-hover:text-cyan-400 transition whitespace-nowrap">
                  Talbiyah.ai
                </h1>
                <p className="text-xs text-slate-400 whitespace-nowrap">Islamic Learning</p>
              </div>
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className={section.title ? 'mt-4 first:mt-0' : ''}>
              {section.title && !sidebarCollapsed && (
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {section.title && sidebarCollapsed && (
                <div className="border-t border-slate-800 my-2"></div>
              )}
              <div className="space-y-1">
                {section.items.map((item: MenuItem) => (
                  <button
                    key={`${section.title}-${item.path}-${item.label}`}
                    onClick={() => !item.comingSoon && navigate(item.path)}
                    disabled={item.comingSoon}
                    className={`w-full px-4 py-2.5 rounded-xl flex items-center space-x-3 transition ${
                      item.active
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : item.comingSoon
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">NEW</span>
                    )}
                    {!sidebarCollapsed && item.comingSoon && (
                      <span className="px-1.5 py-0.5 bg-slate-700 text-slate-500 text-[10px] font-medium rounded">SOON</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition text-slate-300 hover:bg-red-500/10 hover:text-red-400"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition shadow-lg"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        <header className="bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <div className="px-6 lg:px-8 py-4 flex items-center justify-between">
            <div></div>

            <div className="flex items-center space-x-6">
              <button className="relative p-2 text-slate-400 hover:text-white transition">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{profile?.full_name || 'Student'}</p>
                  <p className="text-xs text-slate-400">{isParent ? 'Parent' : userRole}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isParent ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                  userRole === 'Student' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                  userRole === 'Teacher' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                  userRole === 'Admin' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                  'bg-gradient-to-br from-emerald-400 to-emerald-600'
                }`}>
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

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <DashboardHeader
                  userName={profile?.full_name?.split(' ')[0] || 'Student'}
                  userRole={isParent ? 'Parent' : userRole}
                />
              </div>

              <div className="lg:col-span-1">
                <PrayerTimesWidget userRole={isParent ? 'Parent' : userRole} />
              </div>
            </div>

            {/* Teacher Availability Warning Banner */}
            {userRole === 'Teacher' && !hasAvailability && (
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

            {/* Courses Card - Prominent at Top */}
            {(userRole === 'Student' || isParent) && (
              <div className="mb-6 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">📚 Start Your Learning Journey</h3>
                    <p className="text-cyan-50 mb-4">
                      Explore our structured courses in Quranic Studies, Arabic Language, Islamic History, and more. Learn at your own pace with expert guidance.
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => navigate('/courses-overview')}
                        className="px-6 py-3 bg-white hover:bg-cyan-50 text-cyan-700 rounded-lg font-bold transition shadow-lg flex items-center space-x-2"
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

            {isParent && !hasChildren && (
              <div className="mb-6 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-6 border-2 border-purple-400 shadow-xl">
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
            <div className="mb-6 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">📖 Need Islamic Guidance?</h3>
                  <p className="text-slate-300 mb-4">
                    Use Islamic Source Reference to find relevant ayahs and authentic Hadith. A helpful reference tool available 24/7.
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => navigate('/islamic-source-reference')}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition shadow-lg flex items-center space-x-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Find Sources Now</span>
                    </button>
                    <button
                      onClick={() => navigate('/about/islamic-source-reference')}
                      className="px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Khutbah Tools Card - For All Users */}
            <div className="mb-6 grid md:grid-cols-2 gap-4">
              {/* Khutbah Creator */}
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-cyan-500/30 backdrop-blur-sm shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🕌</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">Khutbah Creator</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Generate complete, authentic Friday khutbahs for school Jummah, youth groups, or community masajid.
                    </p>
                    <button
                      onClick={() => navigate('/khutba-creator')}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition shadow-lg flex items-center space-x-2 text-sm"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Create Khutbah</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Khutbah Reflections */}
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-amber-500/30 backdrop-blur-sm shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-xl">👨‍👩‍👧‍👦</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">Khutbah Reflections</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Turn today's Jummah khutbah into a family-friendly reflection guide for your weekend "Family Hour".
                    </p>
                    <button
                      onClick={() => navigate('/khutba-reflections')}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg font-semibold transition shadow-lg flex items-center space-x-2 text-sm"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Family Hour</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gamified Referrals - Moved down */}
            {learner?.referral_code && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 mb-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Gamified Referrals</h3>
                    </div>
                    <p className="text-slate-300 mb-2">
                      Share Talbiyah.ai and earn £15 discount for every 10 hours your referrals learn!
                    </p>
                    <div className="flex items-center space-x-4 text-sm flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span className="font-semibold text-white">{learner.learning_credits?.toFixed(1) || '0.0'}h Free Lessons</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 min-w-[280px]">
                    <label className="text-sm font-semibold text-slate-300 mb-2 block">Your Referral Code</label>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg font-mono text-lg font-bold text-cyan-400 text-center">
                        {learner.referral_code}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition flex items-center space-x-2"
                      >
                        {referralCopied ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => navigate('/refer')}
                      className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2 text-sm"
                    >
                      <span>View Referral Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {userRole === 'Teacher' ? (
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
                    <UpcomingSessionsCard />
                    <RecentMessagesCard />
                    <RecentRecordingsCard />
                    <MyLearningJourneyCard />
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    <CreditBalanceWidget />
                    <LearningStatsWidget />
                    <ReferralWidget />
                    {learner && (
                      <PointsRedemption
                        learnerId={learner.id}
                        currentPoints={learner.total_xp || 0}
                        onRedemption={loadUserAndProfile}
                      />
                    )}
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
    </div>
  );
}
