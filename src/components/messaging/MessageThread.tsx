import { useEffect, useRef } from 'react';
import { Clock, CheckCheck, Reply } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  sender_role: 'student' | 'teacher';
  message_text: string;
  template_code: string;
  status: string;
  read_at: string | null;
  created_at: string;
  message_data?: any;
  sender: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
  onReply?: (message: Message) => void;
}

export default function MessageThread({
  messages,
  currentUserId,
  onReply,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getTemplateLabel = (code: string) => {
    const labels: Record<string, string> = {
      student_reschedule: 'Reschedule Request',
      student_late: 'Running Late',
      student_cancel: 'Cancellation',
      student_early: 'Early Start Request',
      student_question: 'Question',
      student_technical: 'Technical Issue',
      student_prepared: 'Ready',
      teacher_approve: 'Approved',
      teacher_decline: 'Declined',
      teacher_counter: 'Counter Offer',
      teacher_reschedule: 'Reschedule Request',
      teacher_reminder: 'Reminder',
      teacher_ready: 'Ready',
      teacher_waiting: 'Waiting',
      teacher_late: 'Running Late',
    };
    return labels[code] || code;
  };

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const isSent = message.sender_id === currentUserId;
        const isStudent = message.sender_role === 'student';

        return (
          <div
            key={message.id}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                isSent
                  ? 'bg-emerald-600 text-white'
                  : isStudent
                  ? 'bg-purple-100 text-purple-900'
                  : 'bg-green-100 text-green-900'
              }`}
            >
              {/* Sender name and template badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">
                  {isSent ? 'You' : message.sender.full_name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isSent
                      ? 'bg-cyan-700 bg-opacity-50'
                      : isStudent
                      ? 'bg-purple-200'
                      : 'bg-green-200'
                  }`}
                >
                  {getTemplateLabel(message.template_code)}
                </span>
              </div>

              {/* Message text */}
              <p className="text-sm leading-relaxed">{message.message_text}</p>

              {/* Timestamp, read status, and reply button */}
              <div className="flex items-center justify-between mt-2">
                <div
                  className={`flex items-center gap-1 text-xs ${
                    isSent ? 'text-cyan-100' : 'text-gray-500'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(message.created_at)}</span>
                  {isSent && message.read_at && (
                    <>
                      <CheckCheck className="w-3 h-3 ml-1" />
                      <span>Read</span>
                    </>
                  )}
                </div>

                {/* Reply button (only show for received messages) */}
                {!isSent && onReply && (
                  <button
                    onClick={() => onReply(message)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-opacity-20 transition ${
                      isStudent
                        ? 'text-purple-700 hover:bg-purple-700'
                        : 'text-green-700 hover:bg-green-700'
                    }`}
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
