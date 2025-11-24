import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Users, Search, Plus, Check, MessageSquare, Star } from 'lucide-react';

interface Teacher {
  id: string;
  user_id: string;
  bio: string | null;
  hourly_rate: number;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  teacher_rating_stats?: {
    average_rating: number;
    total_ratings: number;
  }[];
  is_connected: boolean;
}

interface Subject {
  id: string;
  name: string;
}

export default function MyTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingTeacher, setAddingTeacher] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (studentId) {
      loadTeachers();
    }
  }, [selectedSubject, searchQuery, studentId]);

  const loadData = async () => {
    try {
      // Get current user's learner profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: learnerData } = await supabase
        .from('learners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (learnerData) {
        setStudentId(learnerData.id);
      }

      // Load subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (subjectsData) {
        setSubjects(subjectsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    if (!studentId) return;

    try {
      setLoading(true);

      // Get existing relationships
      const { data: relationships } = await supabase
        .from('student_teacher_relationships')
        .select('teacher_id, subject_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      const connectedTeacherIds = new Set(
        relationships?.map(r => `${r.teacher_id}-${r.subject_id}`) || []
      );

      // Build query for teachers
      let query = supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          hourly_rate,
          profile:profiles!teacher_profiles_user_id_fkey(
            full_name,
            avatar_url
          ),
          teacher_rating_stats(
            average_rating,
            total_ratings
          )
        `)
        .eq('approval_status', 'approved')
        .eq('is_available', true);

      // Add subject filter if selected
      if (selectedSubject) {
        const { data: teacherSubjects } = await supabase
          .from('teacher_subjects')
          .select('teacher_id')
          .eq('subject_id', selectedSubject);

        const teacherIds = teacherSubjects?.map(ts => ts.teacher_id) || [];
        if (teacherIds.length > 0) {
          query = query.in('id', teacherIds);
        } else {
          setTeachers([]);
          setLoading(false);
          return;
        }
      }

      const { data: teachersData, error } = await query;

      if (error) {
        console.error('Error loading teachers:', error);
        return;
      }

      // Filter by search query and mark connected teachers
      let filteredTeachers = (teachersData || []).map(teacher => ({
        ...teacher,
        is_connected: selectedSubject
          ? connectedTeacherIds.has(`${teacher.id}-${selectedSubject}`)
          : false
      }));

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredTeachers = filteredTeachers.filter(teacher =>
          teacher.profile?.full_name?.toLowerCase().includes(query) ||
          teacher.bio?.toLowerCase().includes(query)
        );
      }

      setTeachers(filteredTeachers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setLoading(false);
    }
  };

  const handleAddTeacher = async (teacherId: string) => {
    if (!studentId || !selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    try {
      setAddingTeacher(teacherId);

      // Call the function to create relationship
      const { data, error } = await supabase.rpc('manually_add_teacher_relationship', {
        p_student_id: studentId,
        p_teacher_id: teacherId,
        p_subject_id: selectedSubject
      });

      if (error) {
        console.error('Error adding teacher:', error);
        alert('Failed to add teacher. They may already be in your teachers list.');
      } else {
        // Reload teachers to update UI
        loadTeachers();
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('An error occurred while adding the teacher.');
    } finally {
      setAddingTeacher(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Teachers</h1>
          </div>
          <p className="text-gray-600">
            Connect with teachers to enable messaging and easy lesson booking
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select a subject...</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a subject to view and add teachers
              </p>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Teachers
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or bio..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        {!selectedSubject ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Select a Subject
            </h3>
            <p className="text-gray-500">
              Choose a subject above to see available teachers
            </p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="text-gray-600 mt-4">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Teachers Found
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'No teachers are currently available for this subject'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {teachers.map(teacher => {
              const rating = teacher.teacher_rating_stats?.[0];
              const avgRating = rating?.average_rating || 0;
              const totalRatings = rating?.total_ratings || 0;

              return (
                <div
                  key={teacher.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {teacher.profile?.avatar_url ? (
                        <img
                          src={teacher.profile.avatar_url}
                          alt={teacher.profile.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                          {teacher.profile?.full_name?.[0] || 'T'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {teacher.profile?.full_name || 'Teacher'}
                      </h3>

                      {/* Rating */}
                      {totalRatings > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-700">
                              {avgRating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
                          </span>
                        </div>
                      )}

                      {/* Bio */}
                      {teacher.bio && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {teacher.bio}
                        </p>
                      )}

                      {/* Rate */}
                      <p className="text-sm font-semibold text-teal-600 mb-3">
                        ${teacher.hourly_rate}/hour
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {teacher.is_connected ? (
                          <>
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium px-3 py-1.5 bg-green-50 rounded-lg">
                              <Check className="w-4 h-4" />
                              Connected
                            </div>
                            <Link
                              to="/messages"
                              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium px-3 py-1.5 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Message
                            </Link>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAddTeacher(teacher.id)}
                            disabled={addingTeacher === teacher.id}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            {addingTeacher === teacher.id ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Add Teacher
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
