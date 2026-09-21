import { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CheadleMasjidCommunityWidgetProps {
  userId: string;
}

interface WhatsappGroup {
  id: string;
  title: string;
  description: string | null;
  whatsapp_url: string;
}

export default function CheadleMasjidCommunityWidget({ userId }: CheadleMasjidCommunityWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [groups, setGroups] = useState<WhatsappGroup[]>([]);

  useEffect(() => {
    load();
  }, [userId]);

  async function load() {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('attends_cheadle_masjid')
        .eq('id', userId)
        .single();

      if (!profile?.attends_cheadle_masjid) {
        setEligible(false);
        setLoading(false);
        return;
      }
      setEligible(true);

      const { data } = await supabase
        .from('whatsapp_groups')
        .select('id, title, description, whatsapp_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      setGroups(data || []);
    } catch (error) {
      console.error('Error loading Cheadle Masjid community widget:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !eligible || groups.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-800/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-5">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Cheadle Masjid Community</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Join a group for the activities you're into</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {groups.map((group) => (
          <a
            key={group.id}
            href={group.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition group flex items-start gap-3"
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{group.title}</h4>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
              </div>
              {group.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{group.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
