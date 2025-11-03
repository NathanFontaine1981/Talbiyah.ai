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
  MessageCircle
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

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  is_admin?: boolean;
}

interface LearnerData {
  id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  referral_code?: string;
  learning_credits?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [learner, setLearner] = useState<LearnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('Student');
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    loadUserAndProfile();
  }, []);

  async function loadUserAndProfile() {
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

      if (profileData?.is_admin) {
        setUserRole('Admin');
      } else {
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacherProfile) {
          setUserRole('Teacher');
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

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', active: true },
    { icon: MessageCircle, label: 'Virtual Imam', path: '/about/virtual-imam', active: false },
    { icon: Search, label: 'Book a Class', path: '/choose-course', active: false },
    { icon: Users, label: 'Group Sessions', path: '/group-sessions', active: false },
    { icon: Video, label: 'Recordings', path: '/recordings/history', active: false },
    { icon: GraduationCap, label: 'Courses', path: '/courses-overview', active: false },
    { icon: Gift, label: 'Refer & Earn', path: '/refer', active: false },
    { icon: Award, label: 'Achievements', path: '/achievements', active: false },
    { icon: Settings, label: 'Settings', path: '/account/settings', active: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
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
                  <p className="text-xs text-slate-400">{userRole}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
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
                <DashboardHeader userName={profile?.full_name?.split(' ')[0] || 'Student'} />
              </div>

              <div className="lg:col-span-1">
                <PrayerTimesWidget />
              </div>
            </div>

            {learner?.referral_code && (
              <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl p-8 mb-6 border border-emerald-400/20 shadow-xl">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-white">
                    <div className="flex items-center space-x-3 mb-3">
                      <Gift className="w-8 h-8" />
                      <h3 className="text-2xl font-bold">Earn Free Lessons</h3>
                    </div>
                    <p className="text-emerald-50 mb-2 text-lg">
                      Share Talbiyah.ai with friends and earn 1 free hour for every 10 hours they complete!
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-amber-300" />
                        <span className="font-semibold">{learner.learning_credits?.toFixed(1) || 0} Free Hours Earned</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 min-w-[320px]">
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Your Referral Code</label>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xl font-bold text-emerald-600 text-center">
                        {learner.referral_code}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2"
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
                      className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                    >
                      <span>View Full Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <div className="lg:col-span-3 space-y-6">
                <UpcomingSessionsCard />
                <RecentRecordingsCard />
                <MyLearningJourneyCard />
              </div>

              <div className="lg:col-span-1 space-y-6">
                <LearningStatsWidget />
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
          </div>
        </main>
      </div>
      <TalbiyahBot />
    </div>
  );
}
