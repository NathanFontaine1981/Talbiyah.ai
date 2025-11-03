import { CheckCircle, UserPlus, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecommendedActionsCard() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: UserPlus,
      title: 'Complete Profile',
      points: '+50 XP',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      route: '/account/settings'
    },
    {
      icon: Calendar,
      title: 'Book Next Session',
      points: '+100 XP',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      route: '/choose-course'
    },
    {
      icon: BookOpen,
      title: 'Daily Qur\'an Verse',
      points: '+25 XP',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      route: '/courses/quran-progress'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4">Recommended Actions</h3>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => navigate(action.route)}
            className={`w-full ${action.bgColor} rounded-xl p-4 border ${action.borderColor} hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${action.bgColor} border ${action.borderColor} rounded-lg flex items-center justify-center`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{action.title}</p>
                  <p className={`text-xs ${action.color} font-medium`}>{action.points}</p>
                </div>
              </div>
              <CheckCircle className={`w-5 h-5 ${action.color}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
