import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Users, Search, MessageSquare, Star, Calendar, ChevronLeft, BookOpen, Clock, Video, UserPlus } from 'lucide-react';

interface TeacherRelationship {
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  teacher_bio: string | null;
  subjects: string[];
  total_lessons: number;
  last_lesson_date: string | null;
  average_rating: number | null;
  total_ratings: number;
  is_new_relationship: boolean; // Indicates if this is a pre-lesson relationship
}

export default function MyTeachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMyTeachers();
  }, []);

  const loadMyTeachers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get student profile ID - use learner ID since that's what student_teacher_relationships references
      let studentId: string | null = null;

      // Get learner ID (student_teacher_relationships uses learner_id as student_id)
      const { data: learnerData } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (learnerData) {
        studentId = learnerData.id;
      }

      if (!studentId) {
        setLoading(false);
        return;
      }

      // Get all teacher relationships for this student (including those with 0 lessons)
      const { data: relationships, error } = await supabase
        .from('student_teacher_relationships')
        .select(`
          id,
          teacher_id,
          subject_id,
          total_lessons,
          last_lesson_date,
          status,
          created_at,
          subjects(name)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading relationships:', error);
        setLoading(false);
        return;
      }

      if (!relationships || relationships.length === 0) {
        setTeachers([]);
        setLoading(false);
        return;
      }

      // Group by teacher and collect subjects
      const teacherMap = new Map<string, {
        teacher_id: string;
        subjects: string[];
        total_lessons: number;
        last_lesson_date: string | null;
        created_at: string | null;
      }>();

      for (const rel of relationships) {
        const existing = teacherMap.get(rel.teacher_id);
        const subjectName = (rel.subjects as any)?.name || 'Unknown';

        if (existing) {
          if (!existing.subjects.includes(subjectName)) {
            existing.subjects.push(subjectName);
          }
          existing.total_lessons += rel.total_lessons || 0;
          if (rel.last_lesson_date && (!existing.last_lesson_date || rel.last_lesson_date > existing.last_lesson_date)) {
            existing.last_lesson_date = rel.last_lesson_date;
          }
          // Keep earliest created_at
          if (rel.created_at && (!existing.created_at || rel.created_at < existing.created_at)) {
            existing.created_at = rel.created_at;
          }
        } else {
          teacherMap.set(rel.teacher_id, {
            teacher_id: rel.teacher_id,
            subjects: [subjectName],
            total_lessons: rel.total_lessons || 0,
            last_lesson_date: rel.last_lesson_date,
            created_at: rel.created_at || null
          });
        }
      }

      // Get teacher profiles
      const teacherIds = Array.from(teacherMap.keys());

      const { data: teacherProfiles } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          bio,
          profiles!teacher_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .in('id', teacherIds);

      // Get ratings for teachers
      const { data: ratings } = await supabase
        .from('teacher_rating_stats')
        .select('teacher_id, average_rating, total_ratings')
        .in('teacher_id', teacherIds);

      const ratingsMap = new Map(ratings?.map(r => [r.teacher_id, r]) || []);

      // Build final teacher list
      const teachersList: TeacherRelationship[] = [];

      for (const [teacherId, data] of teacherMap) {
        const profile = teacherProfiles?.find(p => p.id === teacherId);
        const rating = ratingsMap.get(teacherId);

        teachersList.push({
          teacher_id: teacherId,
          teacher_name: (profile?.profiles as any)?.full_name || 'Unknown Teacher',
          teacher_avatar: (profile?.profiles as any)?.avatar_url || null,
          teacher_bio: profile?.bio || null,
          subjects: data.subjects,
          total_lessons: data.total_lessons,
          last_lesson_date: data.last_lesson_date,
          average_rating: rating?.average_rating || null,
          total_ratings: rating?.total_ratings || 0,
          is_new_relationship: data.total_lessons === 0
        });
      }

      // Sort: New relationships first (to encourage messaging), then by most recent lesson
      teachersList.sort((a, b) => {
        // New relationships (no lessons yet) come first
        if (a.is_new_relationship && !b.is_new_relationship) return -1;
        if (!a.is_new_relationship && b.is_new_relationship) return 1;

        // Then sort by most recent lesson date
        if (!a.last_lesson_date && !b.last_lesson_date) return 0;
        if (!a.last_lesson_date) return 1;
        if (!b.last_lesson_date) return -1;
        return new Date(b.last_lesson_date).getTime() - new Date(a.last_lesson_date).getTime();
      });

      setTeachers(teachersList);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No lessons yet';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Teachers</h1>
                <p className="text-xs text-gray-500">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/teachers')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-gray-900 rounded-lg font-semibold transition text-sm"
            >
              Find New Teacher
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Search */}
        {teachers.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teachers or subjects..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {teachers.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl border border-gray-200">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Teachers Yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't added any teachers yet. Browse our teachers and add them to your list to start a conversation before booking!
            </p>
            <button
              onClick={() => navigate('/teachers')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-gray-900 rounded-lg font-semibold transition"
            >
              <Search className="w-5 h-5" />
              <span>Find a Teacher</span>
            </button>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-2xl border border-gray-200">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No teachers match your search</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.teacher_id}
                className={`bg-white rounded-xl border ${teacher.is_new_relationship ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-gray-200'} hover:border-gray-200 transition overflow-hidden`}
              >
                {/* New Relationship Badge */}
                {teacher.is_new_relationship && (
                  <div className="px-6 py-3 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-blue-500/30">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">Newly Added - Send a message to introduce yourself!</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {teacher.teacher_avatar ? (
                        <img
                          src={teacher.teacher_avatar}
                          alt={teacher.teacher_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-gray-900 font-bold text-xl">
                          {teacher.teacher_name[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {teacher.teacher_name}
                      </h3>

                      {/* Rating */}
                      {teacher.total_ratings > 0 && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-900">
                              {teacher.average_rating?.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ({teacher.total_ratings} {teacher.total_ratings === 1 ? 'rating' : 'ratings'})
                          </span>
                        </div>
                      )}

                      {/* Subjects */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {teacher.subjects.map((subject, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs font-medium text-emerald-600"
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            {subject}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Video className="w-4 h-4 mr-1" />
                          {teacher.total_lessons} lesson{teacher.total_lessons !== 1 ? 's' : ''}
                        </span>
                        {teacher.total_lessons > 0 && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(teacher.last_lesson_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/messages?teacher=${teacher.teacher_id}`)}
                    className={`flex items-center space-x-2 px-4 py-2 ${
                      teacher.is_new_relationship
                        ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-gray-900 font-semibold'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    } rounded-lg transition text-sm`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/${teacher.teacher_id}/book`)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-900 rounded-lg font-semibold transition text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Lesson</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
