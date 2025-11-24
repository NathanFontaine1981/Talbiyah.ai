import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MessageCircle, Send, Shield, X, Reply } from 'lucide-react';
import MessageTemplateSelector from './MessageTemplateSelector';
import MessageThread from './MessageThread';

interface LessonMessagingProps {
  lessonId: string;
  currentUserId: string;
  userRole: 'student' | 'teacher';
  onClose?: () => void;
}

interface Message {
  id: string;
  lesson_id: string;
  sender_id: string;
  sender_role: 'student' | 'teacher';
  template_code: string;
  message_text: string;
  message_data: any;
  status: string;
  read_at: string | null;
  created_at: string;
  sender: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface MessageTemplate {
  id: string;
  template_code: string;
  template_text: string;
  sender_role: 'student' | 'teacher';
  requires_response: boolean;
  requires_data: any;
  display_order: number;
}

export default function LessonMessaging({
  lessonId,
  currentUserId,
  userRole,
  onClose,
}: LessonMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
    fetchTemplates();
    const subscription = subscribeToMessages();
    markMessagesAsRead();

    return () => {
      subscription?.unsubscribe();
    };
  }, [lessonId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_messages')
        .select(`
          *,
          sender:profiles!lesson_messages_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('sender_role', userRole)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`lesson_messages_${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lesson_messages',
          filter: `lesson_id=eq.${lessonId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('lesson_messages')
            .select(`
              *,
              sender:profiles!lesson_messages_sender_id_fkey(full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
            if (data.sender_id !== currentUserId) {
              markMessagesAsRead();
            }
          }
        }
      )
      .subscribe();

    return channel;
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase.rpc('mark_messages_as_read', {
        p_user_id: currentUserId,
        p_lesson_id: lessonId,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setShowTemplates(true);
  };

  const handleSendMessage = async (templateCode: string, data: any) => {
    setSending(true);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'send-lesson-message',
        {
          body: {
            lesson_id: lessonId,
            template_code: templateCode,
            message_data: data,
            reply_to_message_id: replyingTo?.id || null,
          },
        }
      );

      if (error) throw error;

      setShowTemplates(false);
      setReplyingTo(null);
      // Message will appear via real-time subscription
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Lesson Messages
            </h3>
            <p className="text-sm text-cyan-50 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Template-based secure messaging
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Hide messages"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">
              Send a message using the templates below
            </p>
          </div>
        ) : (
          <MessageThread
            messages={messages}
            currentUserId={currentUserId}
            onReply={handleReply}
          />
        )}
      </div>

      {/* Reply Context */}
      {replyingTo && (
        <div className="border-t p-3 bg-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Reply className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800">
              Replying to <strong>{replyingTo.sender.full_name}</strong>:{' '}
              <span className="text-blue-600 italic">
                {replyingTo.message_text.substring(0, 50)}
                {replyingTo.message_text.length > 50 ? '...' : ''}
              </span>
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-blue-100 rounded transition"
            title="Cancel reply"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      )}

      {/* Send Message */}
      <div className="border-t p-4 bg-gray-50">
        {!showTemplates ? (
          <button
            onClick={() => setShowTemplates(true)}
            disabled={sending}
            className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
            Send Message
          </button>
        ) : (
          <MessageTemplateSelector
            templates={templates}
            onSelect={handleSendMessage}
            onCancel={() => setShowTemplates(false)}
            sending={sending}
          />
        )}
      </div>

      {/* Anti-Poaching Notice */}
      <div className="border-t p-3 bg-blue-50">
        <p className="text-xs text-blue-800 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <strong>Secure messaging:</strong> All messages use approved templates
          to protect both parties
        </p>
      </div>
    </div>
  );
}
