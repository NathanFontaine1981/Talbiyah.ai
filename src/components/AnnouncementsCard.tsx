import { Megaphone, ChevronRight } from 'lucide-react';

export default function AnnouncementsCard() {
  const announcements = [
    {
      title: 'New AI Features Released',
      date: 'Oct 30, 2025',
      description: 'Enhanced study notes and quiz generation now available',
      tag: 'New Feature'
    },
    {
      title: 'Ramadan Schedule Updates',
      date: 'Oct 28, 2025',
      description: 'Special session times during the blessed month',
      tag: 'Important'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <Megaphone className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
      </div>

      <div className="space-y-3">
        {announcements.map((announcement, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="inline-block px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-600">
                    {announcement.tag}
                  </span>
                  <span className="text-xs text-gray-500">{announcement.date}</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                  {announcement.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{announcement.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition flex-shrink-0 ml-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
