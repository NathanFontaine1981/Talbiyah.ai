import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bell,
  LogOut,
  ChevronRight,
  Gift,
  Copy,
  ArrowRight,
  MessageCircle,
  CreditCard,
  Mic,
  Home,
  Menu,
  X,
  Play,
  Video,
  Languages,
  Settings,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  ChevronDown,
  Search,
  Users,
  Award,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Premium Dashboard - Bryzos-inspired steel/glass aesthetic
// Features: Frosted glass cards, pinstripe borders, soft gradient background, minimalist luxury

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  roles?: string[];
}

export default function DashboardPreview4() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
  const creditBalance = 127;
  const studyHoursThisMonth = 24.5;

  const weeklyProgress = [
    { day: 'Mon', hours: 1.5, active: false },
    { day: 'Tue', hours: 2.0, active: false },
    { day: 'Wed', hours: 1.0, active: false },
    { day: 'Thu', hours: 2.5, active: true },
    { day: 'Fri', hours: 1.8, active: false },
    { day: 'Sat', hours: 0.5, active: false },
    { day: 'Sun', hours: 0, active: false },
  ];
  const maxHours = Math.max(...weeklyProgress.map(d => d.hours));

  const upcomingSessions = [
    {
      title: "Surah Al-Mulk - Ayat 6-10",
      teacher: "Ustadh Ahmad Hassan",
      time: "Today, 4:00 PM",
      subject: "Qur'an",
      image: "https://api.dicebear.com/7.x/initials/svg?seed=AH&backgroundColor=059669"
    },
    {
      title: "Arabic Grammar - Verb Conjugation",
      teacher: "Ustadha Fatima Ali",
      time: "Tomorrow, 3:00 PM",
      subject: "Arabic",
      image: "https://api.dicebear.com/7.x/initials/svg?seed=FA&backgroundColor=0ea5e9"
    },
  ];

  const recentInsights = [
    { title: "Surah Al-Mulk Breakdown", date: "Dec 15", type: "Lesson Notes" },
    { title: "Arabic Verbs Cheatsheet", date: "Dec 14", type: "Study Guide" },
  ];

  const quickStats = [
    { label: "Study Streak", value: "12", unit: "days", icon: Zap, color: "text-amber-500" },
    { label: "Lessons", value: "48", unit: "completed", icon: Video, color: "text-emerald-500" },
    { label: "Rank", value: "#24", unit: "global", icon: Award, color: "text-purple-500" },
  ];

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: true, path: '/dashboard' },
    { icon: BookOpen, label: "Qur'an", path: '/quran-progress' },
    { icon: Languages, label: 'Arabic', path: '/arabic-progress' },
    { icon: Calendar, label: 'My Lessons', path: '/my-classes' },
    { icon: Video, label: 'Recordings', path: '/recordings/history' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', badge: 3 },
    { icon: Mic, label: 'Khutba Tools', path: '/khutba-reflections' },
    { icon: Settings, label: 'Settings', path: '/account/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-rose-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50/80 to-rose-50/50 flex">
      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Premium Sidebar */}
      <aside className="w-72 bg-white/70 backdrop-blur-xl border-r border-gray-200/80 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/60">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <span className="font-bold text-xl text-gray-800">Talbiyah</span>
              <span className="text-emerald-600 font-bold">.ai</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border border-gray-200/60 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {sidebarItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                item.active
                  ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                  : 'text-gray-600 hover:bg-gray-100/80 border border-transparent hover:border-gray-200/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-5 h-5 ${item.active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-gray-200/60">
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-2xl border border-gray-200/60">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">Premium Student</p>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur-sm text-gray-600 rounded-xl shadow-lg border border-gray-200/60"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-72 h-full bg-white/95 backdrop-blur-xl border-r border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="font-bold text-xl text-gray-800">Talbiyah<span className="text-emerald-600">.ai</span></span>
              </div>
            </div>
            <nav className="p-3 space-y-1">
              {sidebarItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                    item.active
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                      : 'text-gray-600 hover:bg-gray-100 border border-transparent'
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
        {/* Top Header - Glassmorphism */}
        <header className="bg-white/60 backdrop-blur-xl border-b border-gray-200/60 px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="lg:pl-0 pl-12">
            <p className="text-gray-500 text-sm">This Month</p>
            <div className="flex items-baseline space-x-2">
              <h1 className="text-3xl font-bold text-gray-900">{creditBalance.toLocaleString()}</h1>
              <span className="text-gray-500 text-sm">credits</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Stats Pills */}
            <div className="hidden md:flex items-center space-x-2">
              {quickStats.map((stat, idx) => (
                <div key={idx} className="flex items-center space-x-2 px-3 py-1.5 bg-white/80 rounded-full border border-gray-200/60 shadow-sm">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="font-semibold text-gray-800 text-sm">{stat.value}</span>
                  <span className="text-gray-400 text-xs">{stat.unit}</span>
                </div>
              ))}
            </div>

            <button className="relative p-2.5 hover:bg-gray-100/80 rounded-xl transition border border-transparent hover:border-gray-200/60">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-gray-200/60">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2.5 hover:bg-gray-100/80 rounded-xl transition border border-transparent hover:border-gray-200/60"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Top Row - Featured Cards */}
          <div className="grid lg:grid-cols-12 gap-6 mb-6">
            {/* Main Product Card - Featured Lesson */}
            <div className="lg:col-span-5 bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200/50">
                  <BookOpen className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Lesson</p>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Surah Al-Mulk</h3>
                  <p className="text-gray-500 text-sm mb-3">Continue from Ayat 6</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg">Qur'an</span>
                    <span className="text-gray-400 text-xs">35% complete</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/60">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-[35%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Action Card - Book/Select */}
            <div className="lg:col-span-4 bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-semibold text-gray-700">Select Teacher</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>

              <button className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>BOOK A LESSON</span>
              </button>
            </div>

            {/* Score Card - Circular Progress */}
            <div className="lg:col-span-3 bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-6 shadow-sm flex flex-col items-center justify-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Progress Score</p>
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - 0.72)}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">72</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center w-full text-xs">
                <div>
                  <p className="text-gray-400">Lessons</p>
                  <p className="font-semibold text-gray-700">48</p>
                </div>
                <div>
                  <p className="text-gray-400">Hours</p>
                  <p className="font-semibold text-gray-700">24.5</p>
                </div>
                <div>
                  <p className="text-gray-400">Streak</p>
                  <p className="font-semibold text-gray-700">12</p>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Orders/Sessions & Disputes/Insights */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Upcoming Sessions */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-800">Upcoming Sessions</h3>
                <button className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center space-x-1 transition">
                  <span>SEE ALL LESSONS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {upcomingSessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/50 hover:border-gray-300/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={session.image}
                        alt={session.teacher}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800">{session.title}</h4>
                        <p className="text-gray-500 text-sm">{session.teacher}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{session.time.split(',')[0]}</p>
                      <p className="text-sm text-gray-400">{session.time.split(',')[1]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Insights */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-800">Lesson Insights</h3>
                <button className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center space-x-1 transition">
                  <span>SEE ALL INSIGHTS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {recentInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/50 hover:border-gray-300/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center border border-amber-200/50">
                        <Star className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                        <p className="text-gray-500 text-sm">{insight.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{insight.date}</p>
                      <button className="text-emerald-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Third Row - Study Progress Chart */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Weekly Study Time</h3>
                  <p className="text-gray-500 text-sm">{studyHoursThisMonth} hours this month</p>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200/50">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold text-sm">+18%</span>
                </div>
              </div>

              <div className="flex items-end justify-between h-40 gap-3">
                {weeklyProgress.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full relative flex-1 flex items-end">
                      <div
                        className={`w-full rounded-xl transition-all ${
                          day.active
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-gray-200/80'
                        }`}
                        style={{
                          height: `${maxHours > 0 ? (day.hours / maxHours) * 100 : 0}%`,
                          minHeight: day.hours > 0 ? '16px' : '4px'
                        }}
                      />
                    </div>
                    <span className={`text-xs mt-3 font-medium ${day.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {day.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/teachers')}
                  className="w-full p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  <Video className="w-5 h-5" />
                  <span>Book a Lesson</span>
                </button>
                <button
                  onClick={() => navigate('/recordings/history')}
                  className="w-full p-4 bg-gray-50/80 text-gray-700 rounded-2xl font-medium flex items-center justify-center space-x-2 border border-gray-200/60 hover:border-gray-300 hover:bg-gray-100/80 transition"
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Recordings</span>
                </button>
                <button
                  onClick={() => navigate('/khutba-reflections')}
                  className="w-full p-4 bg-gray-50/80 text-gray-700 rounded-2xl font-medium flex items-center justify-center space-x-2 border border-gray-200/60 hover:border-gray-300 hover:bg-gray-100/80 transition"
                >
                  <Mic className="w-5 h-5" />
                  <span>Khutba Reflections</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Banner - Referral */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-3xl p-8 relative overflow-hidden">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Invite Friends & Earn Credits</h3>
                  <p className="text-gray-400">Get 5 free credits for every friend who signs up!</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center space-x-3 border border-gray-600/50">
                  <span className="text-emerald-400 font-mono font-bold">TALBIYAH-ABC123</span>
                  <button className="p-1.5 hover:bg-gray-700/50 rounded-lg transition">
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                </div>
                <button className="px-6 py-3 bg-white text-gray-800 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg">
                  Share Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
