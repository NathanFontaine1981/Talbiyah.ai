import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MessageCircle, ArrowRight, Users, Clock } from 'lucide-react';

interface RecentMessage {
  conversation_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_role: 'student' | 'teacher';
  subject_name: string | null;
  message_text: string;
  message_time: string;
  unread_count: number;
  is_from_me: boolean;
}

export default function RecentMessagesCard() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    loadRecentMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('dashboard_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lesson_messages',
        },
        () => {
          loadRecentMessages();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadRecentMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a teacher
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isTeacher = !!teacherProfile;

      // Get all student-teacher relationships
      const { data: relationships } = await supabase
        .from('student_teacher_relationships')
        .select(`
          id,
          student_id,
          teacher_id,
          subject_id,
          subjects (name),
          student:learners!student_teacher_relationships_student_id_fkey (
            id,
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
        .eq('status', 'active')
        .limit(10);

      if (!relationships || relationships.length === 0) {
        setLoading(false);
        return;
      }

      // Get session once before processing
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // For teachers, batch fetch all student info at once
      let studentInfoMap: Record<string, { name: string; avatar_url: string | null }> = {};
      if (isTeacher && accessToken) {
        const studentIds = relationships.map((rel: any) => rel.student_id).filter(Boolean);
        if (studentIds.length > 0) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-student-info`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ student_ids: studentIds })
              }
            );
            if (response.ok) {
              const { students } = await response.json();
              studentInfoMap = students || {};
            }
          } catch (error) {
            console.error('Error fetching student info:', error);
          }
        }
      }

      // Get recent messages for each relationship
      const recentMessagesData = await Promise.all(
        relationships.map(async (rel: any) => {
          // Handle null cases for student/parent/teacher data
          let otherUserName: string;
          let otherUserAvatar: string | null;

          if (isTeacher) {
            // Teacher viewing - use pre-fetched student info
            const studentInfo = studentInfoMap[rel.student_id];
            if (studentInfo) {
              otherUserName = studentInfo.name;
              otherUserAvatar = studentInfo.avatar_url;
            } else {
              otherUserName = 'Student';
              otherUserAvatar = null;
            }
          } else {
            // Student viewing - get teacher info
            otherUserName = rel.teacher?.user?.full_name || 'Teacher';
            otherUserAvatar = rel.teacher?.user?.avatar_url || null;
          }

          // Get lessons for this relationship
          const { data: relationshipLessons } = await supabase
            .from('lessons')
            .select('id')
            .eq(isTeacher ? 'teacher_id' : 'learner_id', isTeacher ? teacherProfile.id : rel.student_id)
            .eq(isTeacher ? 'learner_id' : 'teacher_id', isTeacher ? rel.student_id : rel.teacher_id);

          const lessonIds = relationshipLessons?.map(l => l.id) || [];
          if (lessonIds.length === 0) return null;

          // Get last message
          const { data: lastMessages } = await supabase
            .from('lesson_messages')
            .select('message_text, created_at, sender_id')
            .in('lesson_id', lessonIds)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!lastMessages || lastMessages.length === 0) return null;

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('lesson_messages')
            .select('id', { count: 'exact', head: true })
            .in('lesson_id', lessonIds)
            .neq('sender_id', user.id)
            .is('read_at', null);

          const lastMessage = lastMessages[0];

          return {
            conversation_id: rel.id,
            other_user_name: otherUserName,
            other_user_avatar: otherUserAvatar,
            other_user_role: isTeacher ? 'student' as const : 'teacher' as const,
            subject_name: rel.subjects?.name || null,
            message_text: lastMessage.message_text,
            message_time: lastMessage.created_at,
            unread_count: unreadCount || 0,
            is_from_me: lastMessage.sender_id === user.id,
          };
        })
      );

      // Filter out null values and sort by message time
      const validMessages = recentMessagesData
        .filter((msg): msg is RecentMessage => msg !== null)
        .sort((a, b) => b.message_time.localeCompare(a.message_time))
        .slice(0, 5); // Show only 5 most recent

      setMessages(validMessages);
      setTotalUnread(validMessages.reduce((sum, msg) => sum + msg.unread_count, 0));
    } catch (error) {
      console.error('Error loading recent messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return null; // Don't show the card if there are no messages
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-50 border-b border-emerald-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Messages</h3>
              <p className="text-emerald-600 text-sm">
                {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/messages')}
            className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-medium transition flex items-center gap-2"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="divide-y">
        {messages.map((message) => (
          <button
            key={message.conversation_id}
            onClick={() => navigate('/messages')}
            className="w-full p-4 hover:bg-gray-50 transition text-left flex items-start gap-3"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {message.other_user_avatar ? (
                <img
                  src={message.other_user_avatar}
                  alt={message.other_user_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                message.other_user_name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900 truncate">
                  {message.other_user_name}
                </h4>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(message.message_time)}
                  </span>
                  {message.unread_count > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {message.unread_count}
                    </span>
                  )}
                </div>
              </div>

              {message.subject_name && (
                <p className="text-xs text-gray-500 mb-1">
                  {message.subject_name}
                </p>
              )}

              <p className={`text-sm truncate ${message.is_from_me ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                {message.is_from_me && 'You: '}
                {message.message_text}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      {messages.length >= 5 && (
        <div className="bg-gray-50 p-4 text-center">
          <button
            onClick={() => navigate('/messages')}
            className="text-emerald-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 mx-auto"
          >
            <Users className="w-4 h-4" />
            View all conversations
          </button>
        </div>
      )}
    </div>
  );
}
