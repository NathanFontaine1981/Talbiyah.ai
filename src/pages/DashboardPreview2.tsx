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
  Clock,
  Play,
  Star,
  Award,
  Zap,
  Wallet,
  ShoppingBag,
  Package,
  MoreHorizontal,
  Languages
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Preview dashboard with second design variant - dark sidebar with purple accents

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  roles?: string[];
}

export default function DashboardPreview2() {
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
    { name: "Qur'an with Understanding", progress: 35, color: 'from-emerald-500 to-teal-500', icon: BookOpen },
    { name: 'Arabic Language', progress: 22, color: 'from-violet-500 to-purple-500', icon: Languages },
    { name: 'Islamic Studies', progress: 15, color: 'from-amber-500 to-orange-500', icon: Star },
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Dark Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white hidden md:flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Talbiyah</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition ${
                item.active
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-800">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-400">Student</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 h-full bg-gray-900 text-white" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">Talbiyah</span>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item, idx) => (
                <button
                  key={idx}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                    item.active
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800'
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
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-xl transition">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Top Row - Credit Balance & Quick Stats */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Credit Balance Card - Featured */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Your Balance</p>
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    42 Credits
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">Last purchase: Dec 10, 2025</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/30 transition flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Buy Credits</span>
                  </button>
                </div>
              </div>

              {/* Mini chart area */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Weekly Study Time</span>
                  <span className="text-sm text-violet-600 font-semibold">+12% this week</span>
                </div>
                <div className="flex items-end justify-between h-24 gap-2">
                  {weeklyProgress.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          idx === 3 ? 'bg-gradient-to-t from-violet-500 to-purple-400' : 'bg-violet-200'
                        }`}
                        style={{ height: `${maxHours > 0 ? (day.hours / maxHours) * 100 : 0}%`, minHeight: '4px' }}
                      ></div>
                      <span className="text-xs text-gray-400 mt-2">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study Time Circle */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - 0.65)}
                  />
                  <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">6.5</span>
                  <span className="text-gray-500 text-sm">hrs today</span>
                </div>
              </div>
              <p className="text-gray-600 font-medium mt-4">Daily Goal: 10 hrs</p>
              <p className="text-violet-600 text-sm">65% complete</p>
            </div>
          </div>

          {/* Second Row - Sessions & Learning Journey */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Upcoming Sessions</h3>
                <button className="text-violet-600 text-sm font-medium hover:text-violet-700 flex items-center space-x-1">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {upcomingSessions.map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        idx === 0 ? 'bg-emerald-100' : 'bg-violet-100'
                      }`}>
                        {idx === 0 ? (
                          <BookOpen className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Languages className="w-6 h-6 text-violet-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{session.title}</h4>
                        <p className="text-gray-500 text-sm">{session.teacher}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{session.time.split(',')[0]}</p>
                      <p className="text-sm text-gray-500">{session.time.split(',')[1]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Journey Progress */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">My Learning Journey</h3>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                {courses.map((course, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${course.color} rounded-xl flex items-center justify-center`}>
                          <course.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{course.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${course.color} rounded-full transition-all duration-500`}
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
            {/* Recent Lessons */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Lessons</h3>
                <button className="text-violet-600 text-sm font-medium hover:text-violet-700 flex items-center space-x-1">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentLessons.map((lesson, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition group cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition">
                        <Play className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                        <p className="text-gray-500 text-sm">{lesson.date} • {lesson.duration}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-violet-100 text-violet-700 rounded-xl font-medium text-sm hover:bg-violet-200 transition opacity-0 group-hover:opacity-100">
                      Watch
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-medium flex items-center justify-center space-x-3 hover:shadow-lg hover:shadow-violet-500/30 transition">
                  <Video className="w-5 h-5" />
                  <span>Book a Lesson</span>
                </button>
                <button className="w-full p-4 bg-gray-50 text-gray-700 rounded-2xl font-medium flex items-center justify-center space-x-3 hover:bg-gray-100 transition">
                  <MessageCircle className="w-5 h-5" />
                  <span>Message Teacher</span>
                </button>
                <button className="w-full p-4 bg-gray-50 text-gray-700 rounded-2xl font-medium flex items-center justify-center space-x-3 hover:bg-gray-100 transition">
                  <Mic className="w-5 h-5" />
                  <span>Khutba Insights</span>
                </button>
                <button className="w-full p-4 bg-gray-50 text-gray-700 rounded-2xl font-medium flex items-center justify-center space-x-3 hover:bg-gray-100 transition">
                  <Gift className="w-5 h-5" />
                  <span>Refer a Friend</span>
                </button>
              </div>
            </div>
          </div>

          {/* Fourth Row - Referral Banner */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Invite Friends & Earn Rewards</h3>
                <p className="text-violet-200 mb-4">Get 5 free credits for every friend who signs up!</p>
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center space-x-2">
                    <span className="text-white font-mono">TALBIYAH-ABC123</span>
                    <button className="p-1 hover:bg-white/20 rounded transition">
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <button className="px-6 py-2 bg-white text-violet-600 rounded-xl font-semibold hover:bg-violet-50 transition">
                    Share Link
                  </button>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Gift className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
