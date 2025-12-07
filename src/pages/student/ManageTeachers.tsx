import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Plus, User, BookOpen, X, UserPlus, Trash2 } from 'lucide-react';

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  hourly_rate: number;
  subjects: string[];
  experience_years?: number;
}

interface AssignedTeacher extends Teacher {
  assignment_id: string;
  assigned_at: string;
  notes?: string;
}

export default function ManageTeachers() {
  const navigate = useNavigate();
  const [assignedTeachers, setAssignedTeachers] = useState<AssignedTeacher[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Load assigned teachers
      const { data: assignments, error: assignError } = await supabase
        .from('student_teachers')
        .select(`
          id,
          assigned_at,
          notes,
          teacher_profiles!inner(
            id,
            user_id,
            bio,
            hourly_rate,
            profiles!inner(full_name)
          )
        `)
        .eq('student_id', user.id)
        .eq('is_active', true);

      if (assignError) throw assignError;

      // Get subjects for each assigned teacher
      const assignedTeachersList: AssignedTeacher[] = [];
      for (const assignment of assignments || []) {
        const { data: teacherSubjects } = await supabase
          .from('teacher_subjects')
          .select(`
            subjects!inner(name)
          `)
          .eq('teacher_id', assignment.teacher_profiles.id);

        assignedTeachersList.push({
          id: assignment.teacher_profiles.id,
          user_id: assignment.teacher_profiles.user_id,
          full_name: assignment.teacher_profiles.profiles.full_name,
          bio: assignment.teacher_profiles.bio,
          hourly_rate: assignment.teacher_profiles.hourly_rate,
          subjects: teacherSubjects?.map((ts: any) => ts.subjects.name) || [],
          assignment_id: assignment.id,
          assigned_at: assignment.assigned_at,
          notes: assignment.notes
        });
      }

      setAssignedTeachers(assignedTeachersList);

      // Load all approved teachers
      const { data: allTeachers, error: teachersError } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          hourly_rate,
          profiles!inner(full_name)
        `)
        .eq('status', 'approved');

      if (teachersError) throw teachersError;

      // Get subjects for all teachers
      const allTeachersList: Teacher[] = [];
      for (const teacher of allTeachers || []) {
        const { data: teacherSubjects } = await supabase
          .from('teacher_subjects')
          .select(`
            subjects!inner(name)
          `)
          .eq('teacher_id', teacher.id);

        allTeachersList.push({
          id: teacher.id,
          user_id: teacher.user_id,
          full_name: teacher.profiles.full_name,
          bio: teacher.bio,
          hourly_rate: teacher.hourly_rate,
          subjects: teacherSubjects?.map((ts: any) => ts.subjects.name) || []
        });
      }

      // Filter out already assigned teachers
      const assignedIds = assignedTeachersList.map(t => t.id);
      const available = allTeachersList.filter(t => !assignedIds.includes(t.id));
      setAvailableTeachers(available);

    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function assignTeacher(teacherId: string) {
    setAssigning(teacherId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('student_teachers')
        .insert({
          student_id: user.id,
          teacher_id: teacherId,
          is_active: true
        });

      if (error) throw error;

      await loadTeachers();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      alert(error.message || 'Failed to assign teacher');
    } finally {
      setAssigning(null);
    }
  }

  async function removeTeacher(assignmentId: string) {
    if (!confirm('Are you sure you want to remove this teacher?')) return;

    setRemoving(assignmentId);
    try {
      const { error } = await supabase
        .from('student_teachers')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      await loadTeachers();
    } catch (error: any) {
      console.error('Error removing teacher:', error);
      alert(error.message || 'Failed to remove teacher');
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-white">My Teachers</h1>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">My Teachers</h2>
            <p className="text-slate-400">Manage your assigned teachers and track your progress</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Teacher</span>
          </button>
        </div>

        {/* Assigned Teachers List */}
        {assignedTeachers.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
            <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <User className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Teachers Assigned</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Start by assigning a teacher to track your learning progress and get personalized guidance.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Teacher</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedTeachers.map((teacher) => (
              <div
                key={teacher.assignment_id}
                className="bg-slate-900/80 rounded-xl p-6 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{teacher.full_name}</h3>
                      {teacher.bio && (
                        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{teacher.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {teacher.subjects.map((subject, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-medium text-cyan-400"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>{subject}</span>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>Assigned {new Date(teacher.assigned_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>£{teacher.hourly_rate.toFixed(2)}/hour</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/teacher/${teacher.id}`)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition text-sm"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => removeTeacher(teacher.assignment_id)}
                      disabled={removing === teacher.assignment_id}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-medium transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {removing === teacher.assignment_id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-2xl font-bold text-white">Assign a Teacher</h3>
                <p className="text-slate-400 text-sm mt-1">Choose a teacher to track your learning progress</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableTeachers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">All available teachers have been assigned.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-white mb-2">{teacher.full_name}</h4>
                            {teacher.bio && (
                              <p className="text-slate-400 text-sm mb-3 line-clamp-2">{teacher.bio}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {teacher.subjects.map((subject, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center space-x-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-medium text-cyan-400"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>{subject}</span>
                                </span>
                              ))}
                            </div>
                            <div className="text-sm text-slate-500">
                              £{teacher.hourly_rate.toFixed(2)}/hour
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => assignTeacher(teacher.id)}
                          disabled={assigning === teacher.id}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ml-4"
                        >
                          {assigning === teacher.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Assigning...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>Assign Teacher</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
