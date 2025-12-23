import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Gift,
  Copy,
  ArrowRight,
  MessageCircle,
  CreditCard,
  Scroll,
  Mic,
  Home,
  Library,
  Menu,
  X,
  Play,
  Star,
  Video,
  Languages,
  MoreHorizontal,
  Settings,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Preview dashboard with steel/metal aesthetic - sleek thin borders, metallic feel

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  roles?: string[];
}

export default function DashboardPreview3() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
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
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  // Mock data
  const weeklyProgress = [
    { day: 'Mon', hours: 1.5 },
    { day: 'Tue', hours: 2.0 },
    { day: 'Wed', hours: 1.0 },
    { day: 'Thu', hours: 2.5 },
    { day: 'Fri', hours: 1.8 },
    { day: 'Sat', hours: 0.5 },
    { day: 'Sun', hours: 0 },
  ];
  const maxHours = Math.max(...weeklyProgress.map(d => d.hours));

  const upcomingSessions = [
    { title: "Qur'an Recitation", teacher: "Ustadh Ahmad", time: "Today, 4:00 PM", subject: "Qur'an" },
    { title: "Arabic Grammar", teacher: "Ustadha Fatima", time: "Tomorrow, 3:00 PM", subject: "Arabic" },
  ];

  const recentLessons = [
    { title: "Surah Al-Mulk - Ayat 1-5", date: "Dec 15, 2025", duration: "45 min" },
    { title: "Arabic Verbs - Past Tense", date: "Dec 14, 2025", duration: "30 min" },
  ];

  const courses = [
    { name: "Qur'an with Understanding", progress: 35, icon: BookOpen },
    { name: 'Arabic Language', progress: 22, icon: Languages },
    { name: 'Islamic Studies', progress: 15, icon: Star },
  ];

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: BookOpen, label: "Qur'an" },
    { icon: Languages, label: 'Arabic' },
    { icon: Video, label: 'Lessons' },
    { icon: MessageCircle, label: 'Messages' },
    { icon: Library, label: 'Resources' },
    { icon: Scroll, label: 'Insights' },
    { icon: Settings, label: 'Settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-gray-500 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Steel card component style
  const steelCardClass = "bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/50 shadow-[0_0_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]";
  const steelCardInnerClass = "bg-gradient-to-br from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/30";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      {/* Steel Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700/50 hidden md:flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-gray-700/50">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">Talbiyah</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition border border-transparent hover:border-gray-600/50"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronLeft className="w-5 h-5 text-gray-400" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${
                item.active
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent hover:border-gray-600/30'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-700/50">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-xl bg-gray-800/30 border border-gray-700/30`}>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-500/20">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-gray-300 rounded-lg shadow-lg border border-gray-600/50"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 h-full bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700/50" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-200">Talbiyah</span>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {sidebarItems.map((item, idx) => (
                <button
                  key={idx}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                    item.active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header - Metallic */}
        <header className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="relative p-2.5 hover:bg-gray-800/50 rounded-xl transition border border-gray-700/50 hover:border-gray-600">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"></span>
            </button>
            <button
              onClick={handleSignOut}
              className="p-2.5 hover:bg-gray-800/50 rounded-xl transition border border-gray-700/50 hover:border-gray-600"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Top Row - Credit Balance & Quick Stats */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Credit Balance Card - Steel Featured */}
            <div className={`lg:col-span-2 ${steelCardClass} p-8`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Your Balance
                  </p>
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    42 Credits
                  </h2>
                  <p className="text-gray-500 text-sm mt-2">Last purchase: Dec 10, 2025</p>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition flex items-center space-x-2 border border-cyan-400/30">
                  <CreditCard className="w-5 h-5" />
                  <span>Buy Credits</span>
                </button>
              </div>

              {/* Mini chart area - Steel inner */}
              <div className={`${steelCardInnerClass} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Weekly Study Time
                  </span>
                  <span className="text-sm text-cyan-400 font-semibold">+12% this week</span>
                </div>
                <div className="flex items-end justify-between h-24 gap-2">
                  {weeklyProgress.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          idx === 3
                            ? 'bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-lg shadow-cyan-500/30'
                            : 'bg-gray-600/50'
                        }`}
                        style={{ height: `${maxHours > 0 ? (day.hours / maxHours) * 100 : 0}%`, minHeight: '4px' }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study Time Circle - Steel */}
            <div className={`${steelCardClass} p-6 flex flex-col items-center justify-center`}>
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="rgba(71, 85, 105, 0.5)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="url(#steelGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - 0.65)}
                    className="drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                  />
                  <defs>
                    <linearGradient id="steelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-100">6.5</span>
                  <span className="text-gray-400 text-sm">hrs today</span>
                </div>
              </div>
              <p className="text-gray-300 font-medium mt-4">Daily Goal: 10 hrs</p>
              <p className="text-cyan-400 text-sm">65% complete</p>
            </div>
          </div>

          {/* Second Row - Sessions & Learning Journey */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Upcoming Sessions - Steel */}
            <div className={`${steelCardClass} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-200">Upcoming Sessions</h3>
                <button className="text-cyan-400 text-sm font-medium hover:text-cyan-300 flex items-center space-x-1 transition">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {upcomingSessions.map((session, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 ${steelCardInnerClass} hover:border-gray-500/50 transition cursor-pointer`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        idx === 0
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-cyan-500/10 border-cyan-500/30'
                      }`}>
                        {idx === 0 ? (
                          <BookOpen className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Languages className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-200">{session.title}</h4>
                        <p className="text-gray-500 text-sm">{session.teacher}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-300">{session.time.split(',')[0]}</p>
                      <p className="text-sm text-gray-500">{session.time.split(',')[1]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Journey Progress - Steel */}
            <div className={`${steelCardClass} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-200">My Learning Journey</h3>
                <button className="p-2 hover:bg-gray-700/50 rounded-lg transition border border-transparent hover:border-gray-600/30">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                {courses.map((course, idx) => (
                  <div key={idx} className={`p-4 ${steelCardInnerClass}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                          <course.icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="font-medium text-gray-200">{course.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-cyan-400">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Third Row - Recent Lessons & Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Lessons - Steel */}
            <div className={`lg:col-span-2 ${steelCardClass} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-200">Recent Lessons</h3>
                <button className="text-cyan-400 text-sm font-medium hover:text-cyan-300 flex items-center space-x-1 transition">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentLessons.map((lesson, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 ${steelCardInnerClass} hover:border-gray-500/50 transition group cursor-pointer`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition">
                        <Play className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-200">{lesson.title}</h4>
                        <p className="text-gray-500 text-sm">{lesson.date} &bull; {lesson.duration}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-xl font-medium text-sm border border-cyan-500/30 hover:bg-cyan-500/20 transition opacity-0 group-hover:opacity-100">
                      Watch
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions - Steel */}
            <div className={`${steelCardClass} p-6`}>
              <h3 className="text-lg font-bold text-gray-200 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium flex items-center justify-center space-x-3 hover:shadow-lg hover:shadow-cyan-500/30 transition border border-cyan-400/30">
                  <Video className="w-5 h-5" />
                  <span>Book a Lesson</span>
                </button>
                <button className={`w-full p-4 ${steelCardInnerClass} text-gray-300 font-medium flex items-center justify-center space-x-3 hover:border-gray-500/50 hover:text-gray-200 transition`}>
                  <MessageCircle className="w-5 h-5" />
                  <span>Message Teacher</span>
                </button>
                <button className={`w-full p-4 ${steelCardInnerClass} text-gray-300 font-medium flex items-center justify-center space-x-3 hover:border-gray-500/50 hover:text-gray-200 transition`}>
                  <Mic className="w-5 h-5" />
                  <span>Khutba Insights</span>
                </button>
                <button className={`w-full p-4 ${steelCardInnerClass} text-gray-300 font-medium flex items-center justify-center space-x-3 hover:border-gray-500/50 hover:text-gray-200 transition`}>
                  <Gift className="w-5 h-5" />
                  <span>Refer a Friend</span>
                </button>
              </div>
            </div>
          </div>

          {/* Fourth Row - Referral Banner - Steel Accent */}
          <div className="bg-gradient-to-r from-gray-800/90 via-cyan-900/30 to-gray-800/90 rounded-2xl p-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
            {/* Metallic shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-100 mb-2">Invite Friends & Earn Rewards</h3>
                <p className="text-gray-400 mb-4">Get 5 free credits for every friend who signs up!</p>
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center space-x-2 border border-gray-600/50">
                    <span className="text-cyan-400 font-mono">TALBIYAH-ABC123</span>
                    <button className="p-1 hover:bg-gray-700/50 rounded transition">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition border border-cyan-400/30">
                    Share Link
                  </button>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-28 h-28 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                  <Gift className="w-14 h-14 text-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
