import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Edit
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UpcomingSessionsCard from '../components/UpcomingSessionsCard';
import RecentRecordingsCard from '../components/RecentRecordingsCard';
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

export default function Dashboard() {
  const navigate = useNavigate();
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

  useEffect(() => {
    loadUserAndProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const baseMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', active: true, roles: ['Student', 'Teacher', 'Admin'] },
    { icon: Calendar, label: 'My Classes', path: '/my-classes', active: false, roles: ['Student', 'Teacher', 'Parent'] },
    { icon: MessageCircle, label: 'Islamic Sources', path: '/about/islamic-source-reference', active: false, roles: ['Student', 'Admin'] },
    { icon: Users, label: 'My Children', path: '/my-children', active: false, roles: ['Parent'] },
    { icon: Calendar, label: 'My Availability', path: '/teacher/availability', active: false, roles: ['Teacher'] },
    { icon: Edit, label: 'Edit Profile', path: '/teacher/edit-profile', active: false, roles: ['Teacher'] },
    { icon: Search, label: 'Book a Class', path: '/subjects', active: false, roles: ['Student'] },
    { icon: Users, label: 'Group Sessions', path: '/group-sessions', active: false, roles: ['Student'] },
    { icon: Video, label: 'Recordings', path: '/recordings/history', active: false, roles: ['Student', 'Teacher'] },
    { icon: GraduationCap, label: 'Courses', path: '/courses-overview', active: false, roles: ['Student'] },
    { icon: Gift, label: 'My Referrals', path: '/my-referrals', active: false, roles: ['Student', 'Admin'] },
    { icon: Award, label: 'Achievements', path: '/achievements', active: false, roles: ['Student'] },
    { icon: Settings, label: 'Settings', path: '/account/settings', active: false, roles: ['Student', 'Teacher', 'Admin'] },
  ];

  const menuItems = baseMenuItems.filter(item => {
    // Show menu item if it matches the current role
    if (item.roles.includes(userRole)) return true;

    // Show "My Children" if user has parent role (even if they're also a student)
    if (item.label === 'My Children' && profile?.roles?.includes('parent')) return true;

    return false;
  });

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

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full px-4 py-3 rounded-xl flex items-center space-x-3 transition ${
                item.active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
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

            {learner?.referral_code && (
              <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 mb-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">🎮 Gamified Referrals</h3>
                    </div>
                    <p className="text-slate-300 mb-2 text-lg">
                      Share Talbiyah.ai and earn £15 discount for every 10 hours your referrals learn! Your balance automatically applies at checkout.
                    </p>
                    <p className="text-slate-400 text-sm">
                      Climb tiers to unlock transfer ability and compete on the leaderboard
                    </p>
                    <div className="flex items-center space-x-4 text-sm flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span className="font-semibold text-white">{learner.learning_credits?.toFixed(1) || '0.0'}h Free Lessons</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300">5 Tiers • 10 Achievements</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 min-w-[320px]">
                    <label className="text-sm font-semibold text-slate-300 mb-2 block">Your Referral Code</label>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg font-mono text-xl font-bold text-cyan-400 text-center">
                        {learner.referral_code}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition flex items-center space-x-2"
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
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                    >
                      <span>View Referral Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
                            onClick={() => {
                              // TODO: Open upgrade modal
                              alert('Create Login feature coming soon!');
                            }}
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
                    <UpcomingSessionsCard />
                    <RecentRecordingsCard />
                    <MyLearningJourneyCard />
                  </div>

                  <div className="lg:col-span-1 space-y-6">
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
