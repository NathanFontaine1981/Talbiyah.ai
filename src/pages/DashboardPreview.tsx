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
  Clock,
  Play,
  Star,
  Award,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Preview dashboard with new design - mirrors actual dashboard content

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  roles?: string[];
}

export default function DashboardPreview() {
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

  // Mock data for the preview
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
    { id: 1, time: '09:20', title: 'Quran Recitation', teacher: 'Ustadh Ahmed', subject: "Surah Al-Mulk" },
    { id: 2, time: '14:00', title: 'Arabic Grammar', teacher: 'Ustadha Fatima', subject: "Verb Conjugation" }
  ];

  const recentRecordings = [
    { id: 1, title: 'Surah Al-Kahf - Part 3', date: 'Dec 15', duration: '45 min' },
    { id: 2, title: 'Arabic Vocabulary', date: 'Dec 14', duration: '30 min' }
  ];

  // Menu sections
  const menuSections = [
    {
      title: null,
      items: [
        { icon: Home, label: 'Dashboard', path: '/dashboard-preview', active: true },
      ]
    },
    {
      title: 'Learn',
      items: [
        { icon: GraduationCap, label: 'Courses', path: '/courses-overview' },
        { icon: Search, label: 'Find Teachers', path: '/teachers' },
        { icon: Users, label: 'My Teachers', path: '/my-teachers' },
        { icon: Calendar, label: 'My Lessons', path: '/my-classes' },
        { icon: Video, label: 'Recordings', path: '/recordings/history' },
      ]
    },
    {
      title: 'Messages',
      items: [
        { icon: MessageCircle, label: 'Conversations', path: '/messages', badge: 3 },
      ]
    },
    {
      title: 'Credits',
      items: [
        { icon: CreditCard, label: 'Buy Credits', path: '/buy-credits' },
        { icon: Gift, label: 'Referrals', path: '/my-referrals' },
      ]
    },
    {
      title: 'Profile',
      items: [
        { icon: UserIcon, label: 'My Account', path: '/account/settings' },
        { icon: Settings, label: 'Settings', path: '/account/settings' },
      ]
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 flex flex-col transition-all duration-300 fixed h-full z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-xl lg:shadow-none`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className="flex items-center space-x-3 group flex-1"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition whitespace-nowrap">
                  Talbiyah<span className="text-emerald-500">.ai</span>
                </h1>
                <p className="text-xs text-gray-400 whitespace-nowrap">Islamic Learning</p>
              </div>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition rounded-xl hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className={section.title ? 'mt-6 first:mt-0' : ''}>
              {section.title && !sidebarCollapsed && (
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {section.title && sidebarCollapsed && (
                <div className="border-t border-gray-200/50 my-3"></div>
              )}
              <div className="space-y-1">
                {section.items.map((item: any) => (
                  <button
                    key={`${section.title}-${item.path}-${item.label}`}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-2xl flex items-center space-x-3 transition ${
                      item.active
                        ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="relative">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    </div>
                    {!sidebarCollapsed && (
                      <span className="font-medium whitespace-nowrap flex-1 text-left text-sm">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge && (
                      <span className="min-w-[20px] h-[20px] bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              handleSignOut();
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-3 rounded-2xl flex items-center space-x-3 transition text-gray-500 hover:bg-red-50 hover:text-red-500"
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-emerald-500 hover:border-emerald-300 transition shadow-md"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0 transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex-shrink-0 sticky top-0 z-30">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition rounded-xl hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Preview Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Design Preview</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition"
              >
                Back to Current
              </button>

              <button className="relative p-2.5 text-gray-400 hover:text-gray-600 transition rounded-xl hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'Student'}</p>
                  <p className="text-xs text-gray-400">Student</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* Welcome Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Assalamu Alaikum, {profile?.full_name?.split(' ')[0] || 'Student'}!
                </h1>
                <p className="text-gray-500 mt-1">Ready for another day of learning?</p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="px-4 py-2 bg-white rounded-2xl border border-gray-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Top Row - Study Time + Weekly Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study Time Card */}
              <div className="bg-gradient-to-br from-emerald-100 via-emerald-50 to-green-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Study Time</h2>
                  <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-medium text-emerald-700">Today</span>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="relative w-44 h-44">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="88" cy="88" r="80" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="12" />
                      <circle
                        cx="88" cy="88" r="80" fill="none"
                        stroke="url(#progressGradient)" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${0.65 * 2 * Math.PI * 80} ${2 * Math.PI * 80}`}
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#34D399" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-gray-800">01:45</span>
                      <span className="text-sm text-gray-500">hours today</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">02</p>
                        <p className="text-xs text-gray-500">Sessions Today</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">12<span className="text-sm font-normal">h</span></p>
                        <p className="text-xs text-gray-500">This Month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Progress Chart */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Weekly Progress</h2>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">This Week</span>
                </div>

                <div className="flex items-end justify-between h-40 gap-3 mb-4">
                  {weeklyProgress.map((day, index) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <div
                          className={`w-full max-w-[40px] rounded-xl transition-all duration-500 ${
                            index === 3 ? 'bg-emerald-500' : 'bg-emerald-200'
                          }`}
                          style={{ height: `${(day.hours / maxHours) * 100}%`, minHeight: day.hours > 0 ? '8px' : '0' }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{day.day}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-gray-500">Quran Study</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-200" />
                    <span className="text-xs text-gray-500">Arabic Study</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses CTA */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-lg shadow-emerald-500/20">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Start Your Learning Journey</h3>
                  <p className="text-emerald-50 text-sm">Explore our structured courses in Quranic Studies, Arabic Language, and more.</p>
                </div>
                <button className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-700 rounded-2xl font-bold transition shadow-lg flex items-center gap-2">
                  <span>Browse Courses</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Sessions, Messages, Recordings */}
              <div className="lg:col-span-2 space-y-6">

                {/* Today's Sessions */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-800">Today's Sessions</h2>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">2</span>
                    </div>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
                        <div className="text-center w-16">
                          <p className="text-xl font-bold text-gray-800">{session.time}</p>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{session.title}</h3>
                          <p className="text-sm text-gray-500">{session.teacher} · {session.subject}</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {session.teacher.split(' ')[1]?.[0] || 'T'}
                        </div>
                        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition">
                          <Play className="w-4 h-4" />
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Messages */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="bg-emerald-50 p-6 border-b border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Recent Messages</h3>
                          <p className="text-emerald-600 text-sm">3 unread messages</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl font-medium transition flex items-center gap-2 text-sm">
                        View All <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    <div className="p-4 hover:bg-gray-50 transition flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">A</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Ustadh Ahmed</h4>
                          <span className="text-xs text-gray-400">2h ago</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">Great progress today! Keep practicing...</p>
                      </div>
                      <span className="w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                    </div>
                    <div className="p-4 hover:bg-gray-50 transition flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">F</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Ustadha Fatima</h4>
                          <span className="text-xs text-gray-400">Yesterday</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">Your homework has been reviewed...</p>
                      </div>
                      <span className="w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                    </div>
                  </div>
                </div>

                {/* Recent Recordings */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Recent Recordings</h2>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {recentRecordings.map((recording) => (
                      <div key={recording.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Play className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{recording.title}</h3>
                          <p className="text-sm text-gray-500">{recording.date} · {recording.duration}</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl font-medium text-sm transition">
                          Watch
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* My Learning Journey */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">My Learning Journey</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Qur'an with Understanding", progress: 35, color: 'emerald', icon: BookOpen },
                      { name: 'Arabic Language', progress: 22, color: 'blue', icon: Scroll },
                      { name: 'Islamic Studies', progress: 10, color: 'purple', icon: Star },
                    ].map((course) => (
                      <div key={course.name} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-${course.color}-100 rounded-xl flex items-center justify-center`}>
                              <course.icon className={`w-5 h-5 text-${course.color}-600`} />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{course.name}</h4>
                              <p className={`text-xs text-${course.color}-600 font-medium`}>{course.progress}% Complete</p>
                            </div>
                          </div>
                          <button className={`px-4 py-2 bg-${course.color}-500 hover:bg-${course.color}-600 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition`}>
                            Continue <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className={`h-full bg-${course.color}-500 transition-all duration-500`} style={{ width: `${course.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Widgets */}
              <div className="space-y-6">

                {/* Credit Balance */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Credits Balance</h3>
                      <p className="text-xs text-gray-500">Available for lessons</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">5</span>
                    <span className="text-gray-500 ml-1">credits</span>
                  </div>
                  <button className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Buy More Credits
                  </button>
                </div>

                {/* Current Focus */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl p-6 border border-purple-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Current Focus</h3>
                      <p className="text-sm text-purple-600">Surah Al-Mulk</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Memorization</span>
                      <span className="font-medium text-gray-800">12/30 Ayat</span>
                    </div>
                    <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>

                {/* Learning Stats */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4">This Week</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-gray-600">New Verses</span>
                      </div>
                      <span className="font-bold text-gray-800">+24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Star className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-sm text-gray-600">Streak</span>
                      </div>
                      <span className="font-bold text-gray-800">7 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">Total Hours</span>
                      </div>
                      <span className="font-bold text-gray-800">9.5h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Video className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-600">Lessons</span>
                      </div>
                      <span className="font-bold text-gray-800">6</span>
                    </div>
                  </div>
                </div>

                {/* Referral Widget */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                      <Gift className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Invite Friends</h3>
                      <p className="text-xs text-gray-500">Earn free lessons!</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-mono text-sm font-bold text-emerald-600 text-center">NATHAN123</span>
                      <button className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition">
                    View Referral Dashboard
                  </button>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-800">Announcements</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium mb-2">New Feature</span>
                      <h4 className="text-sm font-semibold text-gray-900">AI Study Notes Released</h4>
                      <p className="text-xs text-gray-500 mt-1">Enhanced study notes and quiz generation now available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
