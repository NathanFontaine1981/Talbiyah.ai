import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MessageCircle, Search, Users, Calendar, BookOpen, ArrowLeft, UserPlus } from 'lucide-react';
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
  is_pre_lesson: boolean; // True if this is a relationship with no lessons yet
}

interface Lesson {
  id: string;
  scheduled_time: string;
  subject: { name: string } | { name: string }[];
  status: string;
}

// Raw relationship data from Supabase
interface RawRelationship {
  id: string;
  student_id: string;
  teacher_id: string;
  subject_id: string;
  total_lessons: number;
  last_lesson_date: string | null;
  subjects: { name: string } | null;
  teacher: {
    id: string;
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

interface GroupedTeacher {
  teacher_id: string;
  student_id: string;
  relationships: RawRelationship[];
  teacher: RawRelationship['teacher'];
  student: unknown;
  total_lessons: number;
  subjects: string[];
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');

  // Pre-lesson messaging state
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  // Handle ?teacher=xxx URL parameter to auto-select conversation
  useEffect(() => {
    const teacherIdParam = searchParams.get('teacher');
    if (teacherIdParam && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find(c => c.teacher_id === teacherIdParam);
      if (conversation) {
        handleConversationClick(conversation);
      }
    }
  }, [searchParams, conversations]);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/', { state: { showSignIn: true } });
        return;
      }

      setCurrentUserId(user.id);

      // Check if user is a teacher or student
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isTeacher = !!teacherProfile;
      setUserRole(isTeacher ? 'teacher' : 'student');

      // Get all student-teacher relationships
      // Note: We query relationships with teacher join, then fetch student info separately
      // because RLS on learners may block teachers from reading learner data
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

      ((relationships || []) as RawRelationship[]).forEach((rel) => {
        const teacherId = rel.teacher_id;

        if (!groupedByTeacher.has(teacherId)) {
          groupedByTeacher.set(teacherId, {
            teacher_id: teacherId,
            student_id: rel.student_id,
            relationships: [rel],
            teacher: rel.teacher,
            student: null,
            total_lessons: rel.total_lessons,
            subjects: [rel.subjects?.name].filter(Boolean),
          } as GroupedTeacher);
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
        Array.from(groupedByTeacher.values()).map(async (group: GroupedTeacher) => {
          // Handle null cases for student/parent/teacher data
          let otherUserId: string;
          let otherUserName: string;
          let otherUserAvatar: string | null;

          if (isTeacher) {
            // Teacher viewing - use Edge Function to get student info (bypasses RLS)
            try {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-student-info`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                  },
                  body: JSON.stringify({ student_ids: [group.student_id] })
                }
              );

              if (response.ok) {
                const { students } = await response.json();
                const studentInfo = students[group.student_id];

                if (studentInfo) {
                  otherUserId = group.student_id;
                  otherUserName = studentInfo.name;
                  otherUserAvatar = studentInfo.avatar_url;
                } else {
                  otherUserId = group.student_id;
                  otherUserName = 'Student';
                  otherUserAvatar = null;
                }
              } else {
                // Fallback if Edge Function fails
                otherUserId = group.student_id;
                otherUserName = 'Student';
                otherUserAvatar = null;
              }
            } catch (error) {
              console.error('Error fetching student info:', error);
              otherUserId = group.student_id;
              otherUserName = 'Student';
              otherUserAvatar = null;
            }

          } else {
            // Student viewing - get teacher info
            otherUserId = group.teacher?.user?.id || group.teacher_id;
            otherUserName = group.teacher?.user?.full_name || 'Teacher';
            otherUserAvatar = group.teacher?.user?.avatar_url || null;
          }

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
            is_pre_lesson: group.total_lessons === 0,
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

  // Mark all unread messages as read for a conversation
  const markMessagesAsRead = async (conversation: Conversation) => {
    try {
      // Get all lesson IDs for this teacher-student pair
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('id')
        .eq('learner_id', conversation.student_id)
        .eq('teacher_id', conversation.teacher_id);

      if (!lessonData || lessonData.length === 0) return;

      const lessonIds = lessonData.map(l => l.id);

      // Update all unread messages where current user is NOT the sender
      const { error } = await supabase
        .from('lesson_messages')
        .update({ read_at: new Date().toISOString() })
        .in('lesson_id', lessonIds)
        .neq('sender_id', currentUserId)
        .is('read_at', null);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state to clear unread count for this conversation
      setConversations(prev => prev.map(conv =>
        conv.relationship_id === conversation.relationship_id
          ? { ...conv, unread_count: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLessons([]);
    setSelectedLessonId(null);

    // Mark messages as read for this conversation
    if (conversation.unread_count > 0) {
      markMessagesAsRead(conversation);
    }

    // Skip lesson loading for pre-lesson relationships
    if (conversation.is_pre_lesson) {
      setLoadingLessons(false);
      return;
    }

    setLoadingLessons(true);

    // Load ALL lessons for this teacher-student pair (all subjects)
    try {
      const { data: lessonsList, error } = await supabase
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

      if (error) {
        console.error('Error loading lessons:', error);
        setLoadingLessons(false);
        return;
      }

      setLessons(lessonsList || []);

      // Auto-select the most recent lesson if available
      if (lessonsList && lessonsList.length > 0) {
        setSelectedLessonId(lessonsList[0].id);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoadingLessons(false);
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
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
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
                          : conv.is_pre_lesson
                          ? 'bg-blue-50/50'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative">
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
                          {conv.is_pre_lesson && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <UserPlus className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conv.other_user_name}
                              </h3>
                              {conv.is_pre_lesson && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                  New
                                </span>
                              )}
                            </div>
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

                          {conv.last_message_text ? (
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {conv.last_message_text}
                            </p>
                          ) : conv.is_pre_lesson ? (
                            <p className="text-sm text-blue-600 mb-1 italic">
                              Send your first message!
                            </p>
                          ) : null}

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

                {/* Loading state while fetching lessons */}
                {loadingLessons ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                ) : (selectedConversation.is_pre_lesson || lessons.length === 0) ? (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Welcome Header */}
                    <div className="p-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                          <UserPlus className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Welcome!</h3>
                          <p className="text-cyan-100 text-sm mt-1">
                            You're now connected with {selectedConversation.other_user_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Getting Started Steps */}
                    <div className="p-6 border-b">
                      <h4 className="font-semibold text-gray-900 mb-4">Getting Started</h4>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Book your first lesson</p>
                            <p className="text-sm text-gray-500">Choose a time that works for you</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="font-medium text-gray-400">Wait for confirmation</p>
                            <p className="text-sm text-gray-400">Your teacher will confirm the lesson</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="font-medium text-gray-400">Start learning!</p>
                            <p className="text-sm text-gray-400">Join your video lesson and begin your journey</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="p-6 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg border">
                          <BookOpen className="w-5 h-5 text-cyan-500 mb-2" />
                          <p className="text-sm font-medium text-gray-900">{selectedConversation.subject_name || 'Multiple Subjects'}</p>
                          <p className="text-xs text-gray-500">Subject</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border">
                          <Calendar className="w-5 h-5 text-emerald-500 mb-2" />
                          <p className="text-sm font-medium text-gray-900">Ready to book</p>
                          <p className="text-xs text-gray-500">Status</p>
                        </div>
                      </div>

                      {/* Book Lesson CTA */}
                      <button
                        onClick={() => navigate(`/teacher/${selectedConversation.teacher_id}/book`)}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
                      >
                        <Calendar className="w-5 h-5" />
                        Book Your First Lesson
                      </button>
                      <p className="text-center text-xs text-gray-500 mt-3">
                        Messages will be available once you have a booked lesson
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
