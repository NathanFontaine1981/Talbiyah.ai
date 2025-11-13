import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Award,
  Users,
  TrendingUp,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Send,
  X,
  FileText,
} from 'lucide-react';

interface Teacher {
  teacher_id: string;
  tier: string;
  tier_name: string;
  tier_icon: string;
  teacher_hourly_rate: number;
  student_hourly_price: number;
  platform_margin: number;
  hours_taught: number;
  average_rating: number;
  total_lessons: number;
  completed_lessons: number;
  tier_assigned_at: string;
  next_auto_tier: string | null;
  hours_to_next_tier: number | null;
  total_students: number;
  grandfathered_students: number;
  email?: string;
  full_name?: string;
}

interface Application {
  id: string;
  teacher_id: string;
  requested_tier: string;
  requested_rate: number;
  application_reason: string;
  years_experience: number;
  english_proficiency: string;
  intro_video_url: string;
  recitation_sample_url: string;
  certificates: any;
  status: string;
  review_notes: string;
  created_at: string;
  teacher_email?: string;
  teacher_name?: string;
  teacher_stats?: Teacher;
}

interface TierInfo {
  tier: string;
  tier_level: number;
  tier_name: string;
  tier_icon: string;
  teacher_hourly_rate: number;
  student_hourly_price: number;
  platform_margin: number;
  margin_percentage: number;
  min_hours_taught: number;
  min_rating: number;
  requires_manual_approval: boolean;
}

export default function TeacherTiers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [assignData, setAssignData] = useState({
    new_tier: '',
    reason: '',
    disable_auto_progression: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Get all teachers with tier stats
      const { data: teachersData, error: teachersError } = await supabase
        .from('teacher_tier_stats')
        .select('*')
        .order('hours_taught', { ascending: false });

      if (teachersError) throw teachersError;

      // Get user emails for teachers
      const teacherIds = teachersData?.map((t) => t.teacher_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', teacherIds);

      const teachersWithEmails = teachersData?.map((teacher) => {
        const profile = profiles?.find((p) => p.id === teacher.teacher_id);
        return {
          ...teacher,
          email: profile?.email,
          full_name: profile?.full_name,
        };
      });

      setTeachers(teachersWithEmails || []);

      // Get all tier info
      const { data: tiersData } = await supabase
        .from('teacher_tiers')
        .select('*')
        .order('tier_level');

      setTiers(tiersData || []);

      // Get pending applications
      const { data: appsData } = await supabase
        .from('teacher_tier_applications')
        .select('*')
        .in('status', ['pending', 'under_review', 'interview_scheduled'])
        .order('created_at', { ascending: false });

      // Enrich applications with teacher data
      if (appsData) {
        const enrichedApps = await Promise.all(
          appsData.map(async (app) => {
            const teacher = teachersWithEmails?.find((t) => t.teacher_id === app.teacher_id);
            return {
              ...app,
              teacher_email: teacher?.email,
              teacher_name: teacher?.full_name,
              teacher_stats: teacher,
            };
          })
        );
        setApplications(enrichedApps);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function assignTier() {
    if (!selectedTeacher || !assignData.new_tier) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assign-tier`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            teacher_id: selectedTeacher.teacher_id,
            new_tier: assignData.new_tier,
            reason: assignData.reason,
            application_id: selectedApplication?.id,
            disable_auto_progression: assignData.disable_auto_progression,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`Tier updated successfully!\n${result.old_tier} → ${result.new_tier}`);
        setShowAssignModal(false);
        setShowApplicationModal(false);
        loadData();
      } else {
        alert(result.error || 'Failed to assign tier');
      }
    } catch (error) {
      console.error('Error assigning tier:', error);
      alert('Failed to assign tier');
    }
  }

  async function updateApplicationStatus(appId: string, status: string, notes: string) {
    try {
      await supabase
        .from('teacher_tier_applications')
        .update({
          status,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', appId);

      alert(`Application ${status}`);
      loadData();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Teacher Tier Management</h1>
          <p className="text-slate-400">Manage teacher tiers, applications, and promotions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-cyan-400" />
              <span className="text-sm text-slate-400">Total Teachers</span>
            </div>
            <p className="text-3xl font-bold text-white">{teachers.length}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-6 h-6 text-amber-400" />
              <span className="text-sm text-slate-400">Pending Applications</span>
            </div>
            <p className="text-3xl font-bold text-white">{applications.length}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-2">
              <Award className="w-6 h-6 text-emerald-400" />
              <span className="text-sm text-slate-400">Expert+ Teachers</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {teachers.filter((t) => ['expert', 'master'].includes(t.tier)).length}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <span className="text-sm text-slate-400">Auto-Eligible</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {teachers.filter((t) => t.next_auto_tier && t.hours_to_next_tier === 0).length}
            </p>
          </div>
        </div>

        {/* Pending Applications */}
        {applications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-amber-400" />
              <span>Pending Applications</span>
            </h2>

            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {app.teacher_name || app.teacher_email}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Applying for <span className="text-amber-400 capitalize font-semibold">{app.requested_tier}</span> tier
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === 'under_review'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : app.status === 'interview_scheduled'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Current Stats */}
                  {app.teacher_stats && (
                    <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-slate-900/50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Current Tier</p>
                        <p className="text-sm font-semibold text-white capitalize">
                          {app.teacher_stats.tier_icon} {app.teacher_stats.tier}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Hours Taught</p>
                        <p className="text-sm font-semibold text-white">
                          {app.teacher_stats.hours_taught.toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Rating</p>
                        <p className="text-sm font-semibold text-white">
                          {app.teacher_stats.average_rating.toFixed(1)} ★
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Experience</p>
                        <p className="text-sm font-semibold text-white">{app.years_experience}y</p>
                      </div>
                    </div>
                  )}

                  {/* Application Details */}
                  <div className="mb-4">
                    <p className="text-sm text-slate-300 mb-2">{app.application_reason}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-300">
                        English: {app.english_proficiency}
                      </span>
                      {app.intro_video_url && (
                        <a
                          href={app.intro_video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300 hover:bg-purple-500/30 transition"
                        >
                          Intro Video
                        </a>
                      )}
                      {app.recitation_sample_url && (
                        <a
                          href={app.recitation_sample_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300 hover:bg-purple-500/30 transition"
                        >
                          Recitation Sample
                        </a>
                      )}
                    </div>
                  </div>

                  {app.review_notes && (
                    <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                      <p className="text-xs text-amber-300">{app.review_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedApplication(app);
                        setSelectedTeacher(app.teacher_stats || null);
                        setAssignData({
                          new_tier: app.requested_tier,
                          reason: `Approved application for ${app.requested_tier} tier`,
                          disable_auto_progression: false,
                        });
                        setShowApplicationModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => {
                        const notes = prompt('Rejection reason:');
                        if (notes) {
                          updateApplicationStatus(app.id, 'rejected', notes);
                        }
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => {
                        const notes = prompt('Interview notes or scheduled date:');
                        if (notes) {
                          updateApplicationStatus(app.id, 'interview_scheduled', notes);
                        }
                      }}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Interview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Teachers Table */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">All Teachers</h2>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {teachers.map((teacher) => (
                    <tr key={teacher.teacher_id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {teacher.full_name || 'No name'}
                          </p>
                          <p className="text-xs text-slate-400">{teacher.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{teacher.tier_icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-white capitalize">
                              {teacher.tier_name}
                            </p>
                            {teacher.next_auto_tier && teacher.hours_to_next_tier === 0 && (
                              <p className="text-xs text-emerald-400">Ready for promotion!</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{teacher.hours_taught.toFixed(1)}h</p>
                        {teacher.hours_to_next_tier !== null && teacher.hours_to_next_tier > 0 && (
                          <p className="text-xs text-slate-400">
                            {teacher.hours_to_next_tier.toFixed(1)}h to next
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{teacher.average_rating.toFixed(1)} ★</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-emerald-400 font-semibold">
                          £{teacher.teacher_hourly_rate.toFixed(2)}/h
                        </p>
                        <p className="text-xs text-slate-400">
                          Students pay: £{teacher.student_hourly_price.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{teacher.total_students}</p>
                        {teacher.grandfathered_students > 0 && (
                          <p className="text-xs text-slate-400">
                            {teacher.grandfathered_students} locked
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setAssignData({
                              new_tier: teacher.tier,
                              reason: '',
                              disable_auto_progression: false,
                            });
                            setShowAssignModal(true);
                          }}
                          className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition"
                        >
                          Assign Tier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Tier Modal */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Assign Tier</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-1">Teacher</p>
              <p className="text-lg font-semibold text-white">
                {selectedTeacher.full_name || selectedTeacher.email}
              </p>
              <p className="text-sm text-slate-400">
                Current: {selectedTeacher.tier_icon} {selectedTeacher.tier_name}
              </p>
            </div>

            <div className="space-y-6">
              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  New Tier
                </label>
                <select
                  value={assignData.new_tier}
                  onChange={(e) => setAssignData({ ...assignData, new_tier: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select tier...</option>
                  {tiers.map((tier) => (
                    <option key={tier.tier} value={tier.tier}>
                      {tier.tier_icon} {tier.tier_name} - £{tier.teacher_hourly_rate.toFixed(2)}/h
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Reason for Change
                </label>
                <textarea
                  value={assignData.reason}
                  onChange={(e) => setAssignData({ ...assignData, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                  placeholder="Explain why this tier is being assigned..."
                />
              </div>

              {/* Auto-progression toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="disable-auto"
                  checked={assignData.disable_auto_progression}
                  onChange={(e) =>
                    setAssignData({ ...assignData, disable_auto_progression: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                />
                <label htmlFor="disable-auto" className="text-sm text-slate-300">
                  Disable automatic tier progression (manual control only)
                </label>
              </div>

              {/* Submit */}
              <div className="flex space-x-4">
                <button
                  onClick={assignTier}
                  disabled={!assignData.new_tier || !assignData.reason}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Assign Tier</span>
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Review Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Approve Application</h2>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Teacher</p>
                <p className="text-lg font-semibold text-white">
                  {selectedApplication.teacher_name || selectedApplication.teacher_email}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Requested Tier</p>
                <p className="text-lg font-semibold text-white capitalize">
                  {selectedApplication.requested_tier}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Assign Tier
                </label>
                <select
                  value={assignData.new_tier}
                  onChange={(e) => setAssignData({ ...assignData, new_tier: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {tiers.map((tier) => (
                    <option key={tier.tier} value={tier.tier}>
                      {tier.tier_icon} {tier.tier_name} - £{tier.teacher_hourly_rate.toFixed(2)}/h
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Approval Notes
                </label>
                <textarea
                  value={assignData.reason}
                  onChange={(e) => setAssignData({ ...assignData, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                  placeholder="Notes about this approval..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={assignTier}
                  disabled={!assignData.new_tier || !assignData.reason}
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve & Assign</span>
                </button>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
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
