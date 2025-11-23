import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, Filter, TrendingUp, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import StudentCard from '../../components/teacher/StudentCard';

interface StudentRelationship {
  relationship_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  subject_name: string | null;
  total_lessons: number;
  total_hours: number;
  first_lesson_date: string;
  last_lesson_date: string | null;
  status: string;
  next_lesson_time: string | null;
}

export default function MyStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRelationship[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'lessons' | 'hours' | 'name'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('active');

  useEffect(() => {
    fetchMyStudents();
  }, []);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...students];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.student_name.toLowerCase().includes(query) ||
          s.student_email.toLowerCase().includes(query) ||
          s.subject_name?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return (
            new Date(b.last_lesson_date || b.first_lesson_date).getTime() -
            new Date(a.last_lesson_date || a.first_lesson_date).getTime()
          );
        case 'lessons':
          return b.total_lessons - a.total_lessons;
        case 'hours':
          return Number(b.total_hours) - Number(a.total_hours);
        case 'name':
          return a.student_name.localeCompare(b.student_name);
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchQuery, sortBy, filterStatus]);

  async function fetchMyStudents() {
    try {
      setLoading(true);

      // Get current user and teacher profile
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data: teacherProfile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !teacherProfile) throw new Error('Teacher profile not found');

      // Fetch students using RPC function
      const { data, error } = await supabase.rpc('get_teacher_students', {
        p_teacher_id: teacherProfile.id,
      });

      if (error) throw error;

      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      alert(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  const totalLessons = students.reduce((sum, s) => sum + s.total_lessons, 0);
  const totalHours = students.reduce((sum, s) => sum + Number(s.total_hours), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/hub')}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            <span>Back to Teacher Hub</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-cyan-400" />
                My Students
              </h1>
              <p className="text-slate-300">
                Manage your student relationships and track progress
              </p>
            </div>

            {/* Summary Stats */}
            <div className="hidden md:flex gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-cyan-400/30">
                <p className="text-cyan-300 text-sm">Total Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-purple-400/30">
                <p className="text-purple-300 text-sm">Total Lessons</p>
                <p className="text-3xl font-bold">{totalLessons}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-emerald-400/30">
                <p className="text-emerald-300 text-sm">Total Hours</p>
                <p className="text-3xl font-bold">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="active" className="bg-slate-800">Active</option>
                <option value="paused" className="bg-slate-800">Paused</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="recent" className="bg-slate-800">Most Recent</option>
                <option value="lessons" className="bg-slate-800">Most Lessons</option>
                <option value="hours" className="bg-slate-800">Most Hours</option>
                <option value="name" className="bg-slate-800">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Cards Grid */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 text-center border border-white/10">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || filterStatus !== 'active'
                ? 'No students found'
                : 'No students yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Student relationships are created automatically when they book their first paid lesson with you'}
            </p>
            {!searchQuery && filterStatus === 'active' && (
              <button
                onClick={() => navigate('/teacher/hub')}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.relationship_id}
                  relationshipId={student.relationship_id}
                  studentId={student.student_id}
                  studentName={student.student_name}
                  studentEmail={student.student_email}
                  studentAvatar={student.student_avatar}
                  subjectName={student.subject_name}
                  totalLessons={student.total_lessons}
                  totalHours={student.total_hours}
                  firstLessonDate={student.first_lesson_date}
                  lastLessonDate={student.last_lesson_date}
                  nextLessonTime={student.next_lesson_time}
                  status={student.status}
                />
              ))}
            </div>

            {/* Results Count */}
            <div className="mt-6 text-center text-gray-400 text-sm">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </>
        )}
      </div>
    </div>
  );
}
