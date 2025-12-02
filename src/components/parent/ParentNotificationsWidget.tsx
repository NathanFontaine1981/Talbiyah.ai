import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  MessageCircle,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Star,
  Video,
  ChevronRight,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Notification {
  id: string;
  type: 'lesson_reminder' | 'lesson_complete' | 'achievement' | 'message' | 'insight' | 'recording' | 'streak' | 'credit_low';
  title: string;
  message: string;
  childName?: string;
  childId?: string;
  lessonId?: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

interface ParentNotificationsWidgetProps {
  parentId: string;
  children: Array<{ id: string; name: string }>;
}

export default function ParentNotificationsWidget({ parentId, children }: ParentNotificationsWidgetProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateNotifications();
  }, [parentId, children]);

  async function generateNotifications() {
    try {
      const notifs: Notification[] = [];
      const now = new Date();
      const childIds = children.map(c => c.id);

      if (childIds.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Get upcoming lessons (within next 24 hours)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { data: upcomingLessons } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_start,
          learner_id,
          subjects(name),
          learners!inner(name)
        `)
        .in('learner_id', childIds)
        .in('status', ['booked', 'scheduled', 'confirmed', 'pending'])
        .gte('scheduled_start', now.toISOString())
        .lte('scheduled_start', tomorrow.toISOString())
        .order('scheduled_start');

      upcomingLessons?.forEach(lesson => {
        const lessonTime = new Date(lesson.scheduled_start);
        const hoursUntil = Math.round((lessonTime.getTime() - now.getTime()) / (1000 * 60 * 60));

        notifs.push({
          id: `lesson-${lesson.id}`,
          type: 'lesson_reminder',
          title: 'Upcoming Lesson',
          message: `${(lesson.learners as any)?.name || 'Your child'} has a ${(lesson.subjects as any)?.name || 'lesson'} in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`,
          childName: (lesson.learners as any)?.name,
          childId: lesson.learner_id,
          lessonId: lesson.id,
          createdAt: now.toISOString(),
          read: false,
          actionUrl: '/dashboard'
        });
      });

      // Get recent completed lessons (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const { data: completedLessons } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_start,
          learner_id,
          subjects(name),
          learners!inner(name)
        `)
        .in('learner_id', childIds)
        .eq('status', 'completed')
        .gte('scheduled_start', weekAgo.toISOString())
        .order('scheduled_start', { ascending: false })
        .limit(5);

      completedLessons?.forEach(lesson => {
        notifs.push({
          id: `complete-${lesson.id}`,
          type: 'lesson_complete',
          title: 'Lesson Completed',
          message: `${(lesson.learners as any)?.name || 'Your child'} completed their ${(lesson.subjects as any)?.name || 'lesson'}!`,
          childName: (lesson.learners as any)?.name,
          childId: lesson.learner_id,
          lessonId: lesson.id,
          createdAt: lesson.scheduled_start,
          read: true
        });
      });

      // Get recent insights
      const { data: recentInsights } = await supabase
        .from('lesson_insights')
        .select(`
          id,
          created_at,
          lesson_id,
          lessons!inner(
            learner_id,
            learners!inner(name)
          )
        `)
        .in('lessons.learner_id', childIds)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      recentInsights?.forEach(insight => {
        const lesson = insight.lessons as any;
        notifs.push({
          id: `insight-${insight.id}`,
          type: 'insight',
          title: 'New Lesson Insights',
          message: `AI-generated insights are ready for ${lesson?.learners?.name || 'your child'}'s recent lesson`,
          childName: lesson?.learners?.name,
          childId: lesson?.learner_id,
          lessonId: insight.lesson_id || undefined,
          createdAt: insight.created_at,
          read: false,
          actionUrl: `/lesson/${insight.lesson_id}/insights`
        });
      });

      // Get recent recordings
      const { data: recentRecordings } = await supabase
        .from('lesson_recordings')
        .select(`
          id,
          created_at,
          lesson_id,
          lessons!inner(
            learner_id,
            subjects(name),
            learners!inner(name)
          )
        `)
        .in('lessons.learner_id', childIds)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      recentRecordings?.forEach(recording => {
        const lesson = recording.lessons as any;
        notifs.push({
          id: `recording-${recording.id}`,
          type: 'recording',
          title: 'Recording Available',
          message: `${lesson?.learners?.name || 'Your child'}'s ${lesson?.subjects?.name || 'lesson'} recording is ready to watch`,
          childName: lesson?.learners?.name,
          childId: lesson?.learner_id,
          lessonId: recording.lesson_id || undefined,
          createdAt: recording.created_at,
          read: false,
          actionUrl: '/recordings/history'
        });
      });

      // Check for streak achievements
      for (const child of children) {
        const { data: learner } = await supabase
          .from('learners')
          .select('current_streak, total_xp, current_level')
          .eq('id', child.id)
          .single();

        if (learner) {
          // Streak milestones
          if (learner.current_streak >= 7 && learner.current_streak < 14) {
            notifs.push({
              id: `streak-${child.id}-7`,
              type: 'streak',
              title: '7-Day Streak!',
              message: `${child.name} has been learning for 7 days straight! Keep it up!`,
              childName: child.name,
              childId: child.id,
              createdAt: now.toISOString(),
              read: false
            });
          } else if (learner.current_streak >= 30) {
            notifs.push({
              id: `streak-${child.id}-30`,
              type: 'streak',
              title: '30-Day Streak!',
              message: `Amazing! ${child.name} has maintained a 30-day learning streak!`,
              childName: child.name,
              childId: child.id,
              createdAt: now.toISOString(),
              read: false
            });
          }
        }
      }

      // Check credit balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('learning_credits')
        .eq('id', parentId)
        .single();

      if (profile && (profile.learning_credits || 0) < 2) {
        notifs.push({
          id: 'credit-low',
          type: 'credit_low',
          title: 'Low Credit Balance',
          message: `You have ${profile.learning_credits || 0} credits remaining. Purchase more to continue booking lessons.`,
          createdAt: now.toISOString(),
          read: false,
          actionUrl: '/buy-credits'
        });
      }

      // Sort by date (newest first)
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(notifs.slice(0, 10)); // Limit to 10 notifications
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'lesson_reminder':
        return <Calendar className={`${iconClass} text-blue-500`} />;
      case 'lesson_complete':
        return <CheckCircle className={`${iconClass} text-emerald-500`} />;
      case 'achievement':
        return <Award className={`${iconClass} text-amber-500`} />;
      case 'message':
        return <MessageCircle className={`${iconClass} text-purple-500`} />;
      case 'insight':
        return <BookOpen className={`${iconClass} text-cyan-500`} />;
      case 'recording':
        return <Video className={`${iconClass} text-indigo-500`} />;
      case 'streak':
        return <Star className={`${iconClass} text-orange-500`} />;
      case 'credit_low':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Bell className={`${iconClass} text-slate-500`} />;
    }
  }

  function getNotificationBg(type: Notification['type']) {
    switch (type) {
      case 'lesson_reminder':
        return 'bg-blue-50 border-blue-200';
      case 'lesson_complete':
        return 'bg-emerald-50 border-emerald-200';
      case 'achievement':
        return 'bg-amber-50 border-amber-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      case 'insight':
        return 'bg-cyan-50 border-cyan-200';
      case 'recording':
        return 'bg-indigo-50 border-indigo-200';
      case 'streak':
        return 'bg-orange-50 border-orange-200';
      case 'credit_low':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function handleNotificationClick(notification: Notification) {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center relative">
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
            <p className="text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No notifications</p>
          <p className="text-sm text-slate-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`rounded-xl p-4 border ${getNotificationBg(notification.type)} ${notification.actionUrl ? 'cursor-pointer hover:shadow-md' : ''} transition`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 text-sm">
                      {notification.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">{formatTime(notification.createdAt)}</span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                  {notification.actionUrl && (
                    <div className="flex items-center mt-2 text-xs text-slate-500">
                      <span>Tap to view</span>
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
