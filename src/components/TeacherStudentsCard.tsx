import { useEffect, useState } from 'react';
import { Users, User, RefreshCw, BookOpen, Clock, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
  total_lessons: number;
  total_hours: number;
  is_assigned: boolean;
  assigned_at?: string;
  notes?: string;
}

export default function TeacherStudentsCard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacherProfile) {
        setLoading(false);
        return;
      }

      const studentMap = new Map<string, Student>();

      // Load assigned students from student_teachers table
      // Note: We join through profiles since student_teachers.student_id -> profiles.id
      // and learners.parent_id -> profiles.id
      const { data: assignedStudents } = await supabase
        .from('student_teachers')
        .select(`
          assigned_at,
          notes,
          student_id,
          profiles!student_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .eq('is_active', true);

      // Add assigned students to map
      if (assignedStudents) {
        assignedStudents.forEach((assignment: any) => {
          const studentId = assignment.student_id;
          const profile = assignment.profiles;

          if (profile) {
            studentMap.set(studentId, {
              id: studentId,
              name: profile.full_name || 'Student',
              avatar_url: profile.avatar_url,
              total_lessons: 0,
              total_hours: 0,
              is_assigned: true,
              assigned_at: assignment.assigned_at,
              notes: assignment.notes
            });
          }
        });
      }

      // Load students from all lessons (booked or completed)
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select(`
          learner_id,
          duration_minutes,
          status,
          learners!inner(
            id,
            name,
            parent_id
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .in('status', ['booked', 'completed']);

      // Merge lesson data with assigned students
      if (lessonsData) {
        lessonsData.forEach((lesson: any) => {
          const learnerId = lesson.learner_id;

          if (!studentMap.has(learnerId)) {
            studentMap.set(learnerId, {
              id: learnerId,
              name: lesson.learners?.name || 'Student',
              avatar_url: null,
              total_lessons: 0,
              total_hours: 0,
              is_assigned: false
            });
          }

          const student = studentMap.get(learnerId)!;
          // Only count completed lessons towards totals
          if (lesson.status === 'completed') {
            student.total_lessons += 1;
            student.total_hours += lesson.duration_minutes / 60;
          }
        });
      }

      // Sort: assigned students first, then by total lessons
      const studentsArray = Array.from(studentMap.values()).sort((a, b) => {
        if (a.is_assigned && !b.is_assigned) return -1;
        if (!a.is_assigned && b.is_assigned) return 1;
        return b.total_lessons - a.total_lessons;
      });

      setStudents(studentsArray);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">My Students</h3>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl text-gray-700 mb-2">No students yet.</p>
          <p className="text-gray-500 mb-8">Students will appear here when they assign you as their teacher or after completing lessons</p>

          <button
            onClick={loadStudents}
            className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-medium rounded-xl transition flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">My Students</h3>
        <button
          onClick={loadStudents}
          className="p-2 text-gray-500 hover:text-emerald-600 transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-500/30 transition"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300 flex-shrink-0">
                {student.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-base font-semibold text-gray-900 truncate">
                    {student.name}
                  </h4>
                  {student.is_assigned && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-medium text-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>Assigned</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs">
                  {student.total_lessons > 0 && (
                    <>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{student.total_lessons} lessons</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{student.total_hours.toFixed(1)}h</span>
                      </div>
                    </>
                  )}
                  {student.is_assigned && student.assigned_at && (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Since {new Date(student.assigned_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
