import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MessageCircle, Search, Users, Calendar, BookOpen, ArrowLeft } from 'lucide-react';
import LessonMessaging from '../components/messaging/LessonMessaging';

interface Conversation {
  relationship_id: string;
  teacher_id: string;
  student_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_role: 'student' | 'teacher';
  subject_name: string | null;
  subjects: string[];
  total_lessons: number;
  last_lesson_id: string | null;
  last_lesson_time: string | null;
  unread_count: number;
  last_message_text: string | null;
  last_message_time: string | null;
}

interface Lesson {
  id: string;
  scheduled_time: string;
  subject: { name: string } | { name: string }[];
  status: string;
}

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(user.id);

      // Check if user is a teacher or student
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const isTeacher = !!teacherProfile;
      setUserRole(isTeacher ? 'teacher' : 'student');

      // Get all student-teacher relationships
      let query = supabase
        .from('student_teacher_relationships')
        .select(`
          id,
          student_id,
          teacher_id,
          subject_id,
          total_lessons,
          last_lesson_date,
          subjects (name),
          student:learners!student_teacher_relationships_student_id_fkey (
            id,
            name,
            parent:profiles!learners_parent_id_fkey (
              id,
              full_name,
              avatar_url
            )
          ),
          teacher:teacher_profiles!student_teacher_relationships_teacher_id_fkey (
            id,
            user:profiles!teacher_profiles_user_id_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('status', 'active');

      // Filter based on user role
      if (isTeacher) {
        query = query.eq('teacher_id', teacherProfile.id);
      } else {
        // Get learner IDs for this parent
        const { data: learners } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id);

        if (learners && learners.length > 0) {
          const learnerIds = learners.map(l => l.id);
          query = query.in('student_id', learnerIds);
        } else {
          // No learners, return empty
          setConversations([]);
          setLoading(false);
          return;
        }
      }

      const { data: relationships, error } = await query;

      if (error) throw error;

      // Group relationships by teacher (consolidate multiple subjects into one conversation)
      const groupedByTeacher = new Map();

      (relationships || []).forEach((rel: any) => {
        const teacherId = rel.teacher_id;

        if (!groupedByTeacher.has(teacherId)) {
          groupedByTeacher.set(teacherId, {
            teacher_id: teacherId,
            student_id: rel.student_id,
            relationships: [rel],
            teacher: rel.teacher,
            student: rel.student,
            total_lessons: rel.total_lessons,
            subjects: [rel.subjects?.name].filter(Boolean),
          });
        } else {
          const existing = groupedByTeacher.get(teacherId);
          existing.relationships.push(rel);
          existing.total_lessons += rel.total_lessons;
          if (rel.subjects?.name && !existing.subjects.includes(rel.subjects.name)) {
            existing.subjects.push(rel.subjects.name);
          }
        }
      });

      // Get unread message counts and last messages for each teacher
      const conversationsData = await Promise.all(
        Array.from(groupedByTeacher.values()).map(async (group: any) => {
          const otherUserId = isTeacher
            ? group.student.parent.id
            : group.teacher.user.id;
          const otherUserName = isTeacher
            ? group.student.parent.full_name
            : group.teacher.user.full_name;
          const otherUserAvatar = isTeacher
            ? group.student.parent.avatar_url
            : group.teacher.user.avatar_url;

          // Get ALL lessons for this teacher-student pair (across all subjects)
          const { data: relationshipLessons } = await supabase
            .from('lessons')
            .select('id, scheduled_time, status')
            .eq(isTeacher ? 'teacher_id' : 'learner_id', isTeacher ? teacherProfile.id : group.student_id)
            .eq(isTeacher ? 'learner_id' : 'teacher_id', isTeacher ? group.student_id : group.teacher_id)
            .order('scheduled_time', { ascending: false });

          const lastLesson = relationshipLessons?.[0];
          const lessonIds = relationshipLessons?.map(l => l.id) || [];

          // Get unread messages count for this teacher-student pair
          let unreadCount = 0;
          if (lessonIds.length > 0) {
            const { count } = await supabase
              .from('lesson_messages')
              .select('*', { count: 'exact', head: true })
              .in('lesson_id', lessonIds)
              .neq('sender_id', user.id)
              .is('read_at', null);

            unreadCount = count || 0;
          }

          // Get last message (only if we have lessons)
          let lastMessage = null;
          if (lessonIds.length > 0) {
            const { data: lastMessages } = await supabase
              .from('lesson_messages')
              .select('message_text, created_at')
              .in('lesson_id', lessonIds)
              .order('created_at', { ascending: false })
              .limit(1);

            lastMessage = lastMessages?.[0];
          }

          return {
            relationship_id: group.relationships[0].id, // Use first relationship ID for reference
            teacher_id: group.teacher_id,
            student_id: group.student_id,
            other_user_id: otherUserId,
            other_user_name: otherUserName,
            other_user_avatar: otherUserAvatar,
            other_user_role: isTeacher ? 'student' as const : 'teacher' as const,
            subject_name: group.subjects.length > 1
              ? `${group.subjects.length} subjects`
              : group.subjects[0] || null,
            subjects: group.subjects,
            total_lessons: group.total_lessons,
            last_lesson_id: lastLesson?.id || null,
            last_lesson_time: lastLesson?.scheduled_time || null,
            unread_count: unreadCount,
            last_message_text: lastMessage?.message_text || null,
            last_message_time: lastMessage?.created_at || null,
          };
        })
      );

      // Sort by last message time (most recent first)
      conversationsData.sort((a, b) => {
        const timeA = a.last_message_time || a.last_lesson_time || '0';
        const timeB = b.last_message_time || b.last_lesson_time || '0';
        return timeB.localeCompare(timeA);
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Load ALL lessons for this teacher-student pair (all subjects)
    try {
      const { data: lessonsList } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          status,
          subject:subjects(name)
        `)
        .eq('learner_id', conversation.student_id)
        .eq('teacher_id', conversation.teacher_id)
        .order('scheduled_time', { ascending: false });

      setLessons(lessonsList || []);

      // Auto-select the most recent lesson if available
      if (lessonsList && lessonsList.length > 0) {
        setSelectedLessonId(lessonsList[0].id);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatLessonTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate securely with your {userRole === 'teacher' ? 'students' : 'teachers'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm mt-1">
                      Start by booking a lesson with a {userRole === 'teacher' ? 'student' : 'teacher'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.relationship_id}
                      onClick={() => handleConversationClick(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        selectedConversation?.relationship_id === conv.relationship_id
                          ? 'bg-cyan-50 border-l-4 border-cyan-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {conv.other_user_avatar ? (
                            <img
                              src={conv.other_user_avatar}
                              alt={conv.other_user_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            conv.other_user_name.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conv.other_user_name}
                            </h3>
                            {conv.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg animate-pulse">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>

                          {conv.subject_name && (
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {conv.subject_name}
                            </p>
                          )}

                          {conv.last_message_text && (
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {conv.last_message_text}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{conv.total_lessons} {conv.total_lessons === 1 ? 'lesson' : 'lessons'}</span>
                            {conv.last_message_time && (
                              <>
                                <span>•</span>
                                <span>{formatRelativeTime(conv.last_message_time)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {!selectedConversation ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Conversation Header */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xl font-semibold">
                      {selectedConversation.other_user_avatar ? (
                        <img
                          src={selectedConversation.other_user_avatar}
                          alt={selectedConversation.other_user_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        selectedConversation.other_user_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedConversation.other_user_name}
                      </h2>
                      <p className="text-gray-600 flex items-center gap-2 mt-1">
                        <BookOpen className="w-4 h-4" />
                        {selectedConversation.subject_name || 'All subjects'}
                        <span className="mx-2">•</span>
                        {selectedConversation.total_lessons} {selectedConversation.total_lessons === 1 ? 'lesson' : 'lessons'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lesson Selector */}
                {lessons.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select a lesson to view messages
                    </label>
                    <select
                      value={selectedLessonId || ''}
                      onChange={(e) => setSelectedLessonId(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="">Choose a lesson...</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {formatLessonTime(lesson.scheduled_time)} - {Array.isArray(lesson.subject) ? lesson.subject[0]?.name : lesson.subject.name} ({lesson.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Messages */}
                {selectedLessonId ? (
                  <LessonMessaging
                    lessonId={selectedLessonId}
                    currentUserId={currentUserId}
                    userRole={userRole}
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Select a lesson
                    </h3>
                    <p className="text-gray-600">
                      Choose a lesson from the dropdown to view and send messages
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
