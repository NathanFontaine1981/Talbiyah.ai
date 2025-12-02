import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Users,
  Video,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageCircle,
  ChevronDown,
  ArrowRight,
  CreditCard,
  Home
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import StudentDashboardContent from '../../components/StudentDashboardContent';
import TalbiyahBot from '../../components/TalbiyahBot';
import { calculateAge } from '../../utils/ageCalculations';
import ChildrenOverviewWidget from '../../components/parent/ChildrenOverviewWidget';
import PaymentHistoryWidget from '../../components/parent/PaymentHistoryWidget';
import ParentNotificationsWidget from '../../components/parent/ParentNotificationsWidget';

interface Learner {
  id: string;
  name: string;
  age?: number;
  date_of_birth?: string;
  gender?: string;
  gamification_points: number;
}

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'child' | 'payments'>('overview');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      setUserId(user.id);

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Load learners (children)
      const { data: learnersData, error: learnersError } = await supabase
        .from('learners')
        .select('*')
        .eq('parent_id', user.id);

      if (learnersError) {
        console.error('Error fetching learners:', learnersError);
        throw learnersError;
      }

      if (learnersData && learnersData.length > 0) {
        setLearners(learnersData);
        setSelectedLearnerId(learnersData[0].id);
      } else {
        setLearners([]);
        setShowAddChildModal(true);
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const menuItems = [
    { icon: Home, label: 'Overview', onClick: () => setActiveTab('overview'), active: activeTab === 'overview' },
    { icon: Users, label: 'My Children', onClick: () => setActiveTab('child'), active: activeTab === 'child' },
    { icon: CreditCard, label: 'Payments', onClick: () => setActiveTab('payments'), active: activeTab === 'payments' },
    { icon: Video, label: 'Recordings', path: '/recordings/history', active: false },
    { icon: MessageCircle, label: 'Islamic Sources', path: '/islamic-source-reference', active: false },
    { icon: Settings, label: 'Settings', path: '/account/settings', active: false },
  ];

  const selectedLearner = learners.find(l => l.id === selectedLearnerId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
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
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => item.onClick ? item.onClick() : item.path && navigate(item.path)}
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
        {/* Header */}
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
                  <p className="text-sm font-semibold text-white">{userProfile?.full_name || 'Parent'}</p>
                  <p className="text-xs text-slate-400">Parent</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
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
          {learners.length === 0 ? (
            <div className="max-w-2xl mx-auto mt-12">
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-12 text-center">
                <Users className="w-20 h-20 text-purple-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome to Talbiyah.ai</h2>
                <p className="text-lg text-slate-600 mb-8">
                  Add your first child to start managing their Islamic learning journey
                </p>
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-purple-500/30 flex items-center gap-3 mx-auto"
                >
                  <Plus className="w-6 h-6" />
                  Add Your First Child
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && userId && (
                <>
                  {/* Family Overview Widget */}
                  <ChildrenOverviewWidget
                    parentId={userId}
                    onSelectChild={(childId) => {
                      setSelectedLearnerId(childId);
                      setActiveTab('child');
                    }}
                  />

                  {/* Two Column Layout for Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notifications */}
                    <ParentNotificationsWidget
                      parentId={userId}
                      children={learners.map(l => ({ id: l.id, name: l.name }))}
                    />

                    {/* Payment Summary */}
                    <PaymentHistoryWidget parentId={userId} />
                  </div>

                  {/* Islamic Source Reference Card - For Parents */}
                  <div className="mt-6 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">Need Islamic Guidance?</h3>
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
                </>
              )}

              {/* Child Dashboard Tab */}
              {activeTab === 'child' && (
                <>
                  {/* Child Selector */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Viewing Dashboard For:
                        </h3>
                        <div className="relative">
                          <select
                            value={selectedLearnerId || ''}
                            onChange={(e) => setSelectedLearnerId(e.target.value)}
                            className="w-full md:w-auto appearance-none bg-white border-2 border-purple-300 text-purple-900 px-6 py-3 pr-12 rounded-xl font-bold text-lg cursor-pointer hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition shadow-sm"
                          >
                            {learners.map((learner) => (
                              <option key={learner.id} value={learner.id}>
                                {learner.name} {(learner.date_of_birth || learner.age) && `(Age ${learner.date_of_birth ? calculateAge(learner.date_of_birth) : learner.age})`}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-6 h-6 text-purple-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <button
                        onClick={() => setShowAddChildModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition shadow-lg shadow-purple-500/20 flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add Another Child
                      </button>
                    </div>
                  </div>

                  {/* Student Dashboard Content */}
                  {selectedLearnerId && (
                    <StudentDashboardContent
                      learnerId={selectedLearnerId}
                      isParentView={true}
                      onRefresh={loadDashboardData}
                    />
                  )}
                </>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && userId && (
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Payment History</h2>
                    <p className="text-slate-600">View all your credit purchases and transactions</p>
                  </div>

                  <PaymentHistoryWidget parentId={userId} />

                  {/* Buy Credits CTA */}
                  <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Need More Credits?</h3>
                        <p className="text-slate-600">Purchase learning credits to book more lessons for your children.</p>
                      </div>
                      <button
                        onClick={() => navigate('/buy-credits')}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition shadow-lg flex items-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        Buy Credits
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <AddChildModal
          onClose={() => setShowAddChildModal(false)}
          onChildAdded={() => {
            setShowAddChildModal(false);
            loadDashboardData();
          }}
        />
      )}

      <TalbiyahBot />
    </div>
  );
}

interface AddChildModalProps {
  onClose: () => void;
  onChildAdded: () => void;
}

function AddChildModal({ onClose, onChildAdded }: AddChildModalProps) {
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [childGender, setChildGender] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Date constraints for DOB picker
  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 25);
  const minDateStr = minDate.toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!childName.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!childDob) {
      setError('Please enter date of birth');
      return;
    }

    const age = calculateAge(childDob);
    if (age < 3) {
      setError('Child must be at least 3 years old');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('learners')
        .insert({
          parent_id: user.id,
          name: childName.trim(),
          date_of_birth: childDob,
          age: age, // Keep for backwards compatibility
          gender: childGender || null,
          gamification_points: 0
        })
        .select();

      if (insertError) throw insertError;

      onChildAdded();
    } catch (err: any) {
      console.error('Error adding child:', err);
      setError(err.message || 'Failed to add child');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Add a Child</h3>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Child's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Ahmed, Fatima"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={childDob}
                onChange={(e) => setChildDob(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                max={today}
                min={minDateStr}
                required
              />
              {childDob && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg text-sm">
                  <span className="text-slate-600">Age: </span>
                  <span className="font-semibold text-purple-700">{calculateAge(childDob)} years old</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Gender (optional)
              </label>
              <select
                value={childGender}
                onChange={(e) => setChildGender(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition disabled:opacity-50 shadow-lg shadow-purple-500/30"
            >
              {saving ? 'Adding...' : 'Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
