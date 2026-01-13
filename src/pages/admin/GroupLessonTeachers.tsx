import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  Users,
  Globe,
  Languages,
  MapPin,
  CheckCircle,
  XCircle,
  Award,
  ArrowLeft,
  Search,
  Filter,
  X,
  Send,
} from 'lucide-react';
import {
  GROUP_LESSON_TIERS,
  GROUP_LESSON_STUDENT_PRICE,
  GROUP_LESSON_MAX_STUDENTS,
  getCountryByCode,
} from '../../data/locationConstants';

interface Teacher {
  teacher_profile_id: string;
  user_id: string;
  full_name: string;
  email: string;
  country: string;
  city: string;
  languages: string[];
  timezone: string;
  status: string;
  current_tier: string;
  hourly_rate: number;
  group_lesson_enabled: boolean;
  group_lesson_tier: string | null;
  group_lesson_hourly_rate: number | null;
  group_lesson_tier_assigned_at: string | null;
  hours_taught?: number;
}

export default function GroupLessonTeachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<'all' | 'GB' | 'other'>('all');
  const [filterGroupEnabled, setFilterGroupEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignData, setAssignData] = useState({
    tier: 'standard' as keyof typeof GROUP_LESSON_TIERS,
    notes: '',
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...teachers];

    // Filter by country
    if (filterCountry === 'GB') {
      filtered = filtered.filter((t) => t.country === 'GB');
    } else if (filterCountry === 'other') {
      filtered = filtered.filter((t) => t.country !== 'GB');
    }

    // Filter by group enabled status
    if (filterGroupEnabled === 'enabled') {
      filtered = filtered.filter((t) => t.group_lesson_enabled);
    } else if (filterGroupEnabled === 'disabled') {
      filtered = filtered.filter((t) => !t.group_lesson_enabled);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.full_name?.toLowerCase().includes(query) ||
          t.email?.toLowerCase().includes(query) ||
          t.city?.toLowerCase().includes(query) ||
          t.languages?.some((l) => l.toLowerCase().includes(query))
      );
    }

    setFilteredTeachers(filtered);
  }, [teachers, filterCountry, filterGroupEnabled, searchQuery]);

  async function loadTeachers() {
    try {
      setLoading(true);

      // Get approved teachers with their profile info
      const { data: teacherProfiles, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          status,
          current_tier,
          hourly_rate,
          group_lesson_enabled,
          group_lesson_tier,
          group_lesson_hourly_rate,
          group_lesson_tier_assigned_at,
          group_lesson_notes
        `)
        .eq('status', 'approved');

      if (teacherError) throw teacherError;

      if (!teacherProfiles || teacherProfiles.length === 0) {
        setTeachers([]);
        return;
      }

      // Get profile info for these teachers
      const userIds = teacherProfiles.map((t) => t.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, country, city, languages, timezone')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const combinedData: Teacher[] = teacherProfiles.map((tp) => {
        const profile = profiles?.find((p) => p.id === tp.user_id);
        return {
          teacher_profile_id: tp.id,
          user_id: tp.user_id,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          country: profile?.country || '',
          city: profile?.city || '',
          languages: profile?.languages || ['English'],
          timezone: profile?.timezone || 'UTC',
          status: tp.status,
          current_tier: tp.current_tier,
          hourly_rate: tp.hourly_rate,
          group_lesson_enabled: tp.group_lesson_enabled || false,
          group_lesson_tier: tp.group_lesson_tier,
          group_lesson_hourly_rate: tp.group_lesson_hourly_rate,
          group_lesson_tier_assigned_at: tp.group_lesson_tier_assigned_at,
        };
      });

      // Sort: UK teachers first, then by name
      combinedData.sort((a, b) => {
        if (a.country === 'GB' && b.country !== 'GB') return -1;
        if (a.country !== 'GB' && b.country === 'GB') return 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });

      setTeachers(combinedData);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }

  async function assignGroupLessonTier() {
    if (!selectedTeacher) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tierInfo = GROUP_LESSON_TIERS[assignData.tier];

      const { error } = await supabase
        .from('teacher_profiles')
        .update({
          group_lesson_enabled: true,
          group_lesson_tier: assignData.tier,
          group_lesson_hourly_rate: tierInfo.teacherRate,
          group_lesson_tier_assigned_at: new Date().toISOString(),
          group_lesson_tier_assigned_by: user.id,
          group_lesson_notes: assignData.notes || null,
        })
        .eq('id', selectedTeacher.teacher_profile_id);

      if (error) throw error;

      toast.success(
        `${selectedTeacher.full_name} enabled for group lessons at ${tierInfo.name} tier (£${tierInfo.teacherRate}/hr)`
      );
      setShowAssignModal(false);
      setSelectedTeacher(null);
      loadTeachers();
    } catch (error) {
      console.error('Error assigning tier:', error);
      toast.error('Failed to assign group lesson tier');
    }
  }

  async function disableGroupLessons(teacher: Teacher) {
    if (!confirm(`Disable group lessons for ${teacher.full_name}?`)) return;

    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({
          group_lesson_enabled: false,
        })
        .eq('id', teacher.teacher_profile_id);

      if (error) throw error;

      toast.success(`Group lessons disabled for ${teacher.full_name}`);
      loadTeachers();
    } catch (error) {
      console.error('Error disabling group lessons:', error);
      toast.error('Failed to disable group lessons');
    }
  }

  const ukTeachersCount = teachers.filter((t) => t.country === 'GB').length;
  const groupEnabledCount = teachers.filter((t) => t.group_lesson_enabled).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin</span>
          </button>

          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-emerald-400" />
            Group Lesson Teachers
          </h1>
          <p className="text-gray-400">
            Manage UK teachers for group lessons (Islamic Studies, Quran Tadabbur, Seerah)
          </p>
        </div>

        {/* Pricing Info */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
          <p className="text-emerald-300 text-sm">
            <span className="font-semibold">Group Lesson Pricing:</span> Students pay{' '}
            <span className="font-bold text-white">£{GROUP_LESSON_STUDENT_PRICE}</span> per session.
            Up to <span className="font-bold text-white">{GROUP_LESSON_MAX_STUDENTS}</span> students per group.
            Teacher earns £16-20/hr based on tier.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <span className="text-sm text-gray-400">Total Approved Teachers</span>
            </div>
            <p className="text-3xl font-bold text-white">{teachers.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <Globe className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-gray-400">UK Teachers</span>
            </div>
            <p className="text-3xl font-bold text-white">{ukTeachersCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span className="text-sm text-gray-400">Group Enabled</span>
            </div>
            <p className="text-3xl font-bold text-white">{groupEnabledCount}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="w-6 h-6 text-amber-400" />
              <span className="text-sm text-gray-400">Potential Revenue</span>
            </div>
            <p className="text-3xl font-bold text-white">
              £{(groupEnabledCount * GROUP_LESSON_STUDENT_PRICE * GROUP_LESSON_MAX_STUDENTS).toLocaleString()}/session
            </p>
          </div>
        </div>

        {/* Tier Legend */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">GROUP LESSON TIERS</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(GROUP_LESSON_TIERS).map(([key, tier]) => (
              <div
                key={key}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10"
              >
                <span className="text-xl">{tier.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{tier.name}</p>
                  <p className="text-xs text-emerald-400">£{tier.teacherRate}/hr</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, city, language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Country Filter */}
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-400" />
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value as any)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all" className="bg-gray-800">All Countries</option>
                <option value="GB" className="bg-gray-800">UK Only</option>
                <option value="other" className="bg-gray-800">Non-UK</option>
              </select>
            </div>

            {/* Group Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterGroupEnabled}
                onChange={(e) => setFilterGroupEnabled(e.target.value as any)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all" className="bg-gray-800">All Status</option>
                <option value="enabled" className="bg-gray-800">Group Enabled</option>
                <option value="disabled" className="bg-gray-800">Not Enabled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Languages
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    1-to-1 Tier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Group Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTeachers.map((teacher) => {
                  const country = getCountryByCode(teacher.country);
                  const tierInfo = teacher.group_lesson_tier
                    ? GROUP_LESSON_TIERS[teacher.group_lesson_tier as keyof typeof GROUP_LESSON_TIERS]
                    : null;

                  return (
                    <tr key={teacher.teacher_profile_id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{teacher.full_name}</p>
                          <p className="text-xs text-gray-400">{teacher.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {country && <span className="text-lg">{country.flag}</span>}
                          <div>
                            <p className="text-sm text-white">{teacher.city || 'N/A'}</p>
                            <p className="text-xs text-gray-400">{country?.name || teacher.country || 'Not set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.languages?.slice(0, 3).map((lang) => (
                            <span
                              key={lang}
                              className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                            >
                              {lang}
                            </span>
                          ))}
                          {teacher.languages?.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs">
                              +{teacher.languages.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white capitalize">{teacher.current_tier}</p>
                        <p className="text-xs text-emerald-400">£{teacher.hourly_rate}/hr</p>
                      </td>
                      <td className="px-6 py-4">
                        {teacher.group_lesson_enabled ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{tierInfo?.icon}</span>
                            <div>
                              <p className="text-sm text-emerald-400 font-semibold">{tierInfo?.name}</p>
                              <p className="text-xs text-gray-400">£{teacher.group_lesson_hourly_rate}/hr</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not enabled</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {teacher.group_lesson_enabled ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setAssignData({
                                  tier: (teacher.group_lesson_tier || 'standard') as keyof typeof GROUP_LESSON_TIERS,
                                  notes: '',
                                });
                                setShowAssignModal(true);
                              }}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition"
                            >
                              Change Tier
                            </button>
                            <button
                              onClick={() => disableGroupLessons(teacher)}
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs font-semibold transition"
                            >
                              Disable
                            </button>
                          </div>
                        ) : teacher.country === 'GB' ? (
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setAssignData({ tier: 'standard', notes: '' });
                              setShowAssignModal(true);
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Enable
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">UK only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No teachers found matching your filters</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </p>
      </div>

      {/* Assign Tier Modal */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-lg w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedTeacher.group_lesson_enabled ? 'Change Group Tier' : 'Enable Group Lessons'}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-1">Teacher</p>
              <p className="text-lg font-semibold text-white">{selectedTeacher.full_name}</p>
              <div className="flex items-center gap-2 mt-1">
                {getCountryByCode(selectedTeacher.country) && (
                  <span className="text-lg">{getCountryByCode(selectedTeacher.country)?.flag}</span>
                )}
                <span className="text-sm text-gray-400">
                  {selectedTeacher.city}, {getCountryByCode(selectedTeacher.country)?.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTeacher.languages?.map((lang) => (
                  <span key={lang} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3">
                  Select Group Lesson Tier
                </label>
                <div className="space-y-2">
                  {Object.entries(GROUP_LESSON_TIERS).map(([key, tier]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition ${
                        assignData.tier === key
                          ? 'bg-emerald-500/20 border-emerald-500'
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={key}
                        checked={assignData.tier === key}
                        onChange={(e) =>
                          setAssignData({ ...assignData, tier: e.target.value as keyof typeof GROUP_LESSON_TIERS })
                        }
                        className="w-4 h-4 text-emerald-500"
                      />
                      <span className="text-2xl">{tier.icon}</span>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{tier.name}</p>
                        <p className="text-xs text-gray-400">{tier.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">£{tier.teacherRate}/hr</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Notes (optional)</label>
                <textarea
                  value={assignData.notes}
                  onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Any notes about this assignment..."
                />
              </div>

              {/* Submit */}
              <div className="flex space-x-4">
                <button
                  onClick={assignGroupLessonTier}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>
                    {selectedTeacher.group_lesson_enabled ? 'Update Tier' : 'Enable Group Lessons'}
                  </span>
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
