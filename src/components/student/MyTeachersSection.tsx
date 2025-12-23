import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Calendar, Star, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TeacherRelationship {
  relationship_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  teacher_avatar: string | null;
  subject_name: string | null;
  total_lessons: number;
  total_hours: number;
  first_lesson_date: string;
  last_lesson_date: string | null;
  status: string;
  next_lesson_time: string | null;
}

export default function MyTeachersSection() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTeachers();
  }, []);

  async function fetchMyTeachers() {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get learner ID for this user
      const { data: learners, error: learnerError } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id);

      if (learnerError) throw learnerError;
      if (!learners || learners.length === 0) {
        setTeachers([]);
        setLoading(false);
        return;
      }

      // Fetch teachers using RPC function for first learner
      // (In multi-child accounts, you'd need to aggregate across all children)
      const { data, error } = await supabase.rpc('get_student_teachers', {
        p_student_id: learners[0].id,
      });

      if (error) throw error;

      setTeachers(data || []);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatNextLesson = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 0) return null;
    if (diffHours < 1) return 'Soon';
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays < 7) return `in ${diffDays}d`;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return null; // Don't show section if no teachers yet
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg p-6 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-600" />
            My Teachers
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Your regular instructors
          </p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
          {teachers.length} {teachers.length === 1 ? 'Teacher' : 'Teachers'}
        </div>
      </div>

      {/* Teachers List */}
      <div className="space-y-4">
        {teachers.map((teacher) => {
          const nextLesson = formatNextLesson(teacher.next_lesson_time);

          return (
            <div
              key={teacher.relationship_id}
              className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {teacher.teacher_avatar ? (
                  <img
                    src={teacher.teacher_avatar}
                    alt={teacher.teacher_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl border-2 border-blue-300">
                    {getInitials(teacher.teacher_name)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {teacher.teacher_name}
                      </h3>
                      {teacher.subject_name && (
                        <p className="text-sm text-emerald-600 font-medium">
                          {teacher.subject_name}
                        </p>
                      )}
                    </div>
                    {/* Rating Badge (placeholder) */}
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-700">
                        4.9
                      </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span>
                        <strong className="text-gray-900">{teacher.total_lessons}</strong> lessons
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>
                        <strong className="text-gray-900">
                          {teacher.total_hours.toFixed(1)}
                        </strong>{' '}
                        hours
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {nextLesson ? (
                      <div className="flex-1 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Next lesson {nextLesson}</span>
                        </div>
                        <button
                          onClick={() => navigate('/my-classes')}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/book/${teacher.teacher_id}`)}
                        className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Book Next Lesson
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA for exploring more teachers */}
      {teachers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/teachers')}
            className="w-full text-center text-emerald-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2 group"
          >
            Explore more teachers
            <ArrowRight className="w-4 h-4 group-hover:trangray-x-1 transition" />
          </button>
        </div>
      )}
    </div>
  );
}
