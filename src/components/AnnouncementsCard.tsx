import { useState, useEffect } from 'react';
import { Megaphone, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  description: string;
  tag: string;
  audience: string;
  published_at: string;
}

interface AnnouncementsCardProps {
  userRole?: string;
}

export default function AnnouncementsCard({ userRole }: AnnouncementsCardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        let query = supabase
          .from('announcements')
          .select('id, title, description, tag, audience, published_at')
          .eq('is_active', true)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(5);

        // Filter by audience: show 'all' announcements plus role-specific ones
        const roleLower = userRole?.toLowerCase();
        if (roleLower === 'student' || roleLower === 'learner') {
          query = query.in('audience', ['all', 'students']);
        } else if (roleLower === 'teacher') {
          query = query.in('audience', ['all', 'teachers']);
        } else if (roleLower === 'parent') {
          query = query.in('audience', ['all', 'parents']);
        }
        // Admin sees all

        const { data, error } = await query;
        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, [userRole]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Megaphone className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Announcements</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return null; // Don't render the card if there are no announcements
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Megaphone className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Announcements</h3>
      </div>

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="inline-block px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded text-xs font-medium text-amber-600 dark:text-amber-300">
                    {announcement.tag}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true })}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  {announcement.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{announcement.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition flex-shrink-0 ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
