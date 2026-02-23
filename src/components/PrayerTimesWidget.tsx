import { Clock, MapPin } from 'lucide-react';
import { usePrayerTimes } from '../hooks/usePrayerTimes';

interface PrayerTimesWidgetProps {
  userRole?: string;
}

export default function PrayerTimesWidget({ userRole = 'Student' }: PrayerTimesWidgetProps) {
  const { nextPrayer, location } = usePrayerTimes();

  const getColorClasses = () => {
    switch (userRole) {
      case 'Student':
        return {
          mainBg: 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800',
          border: 'border-emerald-600/30',
          iconColor: 'text-emerald-300',
          nextPrayerBg: 'bg-emerald-900/30',
          nextPrayerBorder: 'border-emerald-600/30',
          nextPrayerAccent: 'text-emerald-400',
        };
      case 'Parent':
        return {
          mainBg: 'bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800',
          border: 'border-purple-600/30',
          iconColor: 'text-purple-300',
          nextPrayerBg: 'bg-purple-900/30',
          nextPrayerBorder: 'border-purple-600/30',
          nextPrayerAccent: 'text-purple-400',
        };
      case 'Teacher':
        return {
          mainBg: 'bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800',
          border: 'border-blue-600/30',
          iconColor: 'text-blue-300',
          nextPrayerBg: 'bg-blue-900/30',
          nextPrayerBorder: 'border-blue-600/30',
          nextPrayerAccent: 'text-blue-400',
        };
      case 'Admin':
        return {
          mainBg: 'bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700',
          border: 'border-amber-600/30',
          iconColor: 'text-amber-300',
          nextPrayerBg: 'bg-amber-900/30',
          nextPrayerBorder: 'border-amber-600/30',
          nextPrayerAccent: 'text-amber-400',
        };
      default:
        return {
          mainBg: 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800',
          border: 'border-emerald-600/30',
          iconColor: 'text-emerald-300',
          nextPrayerBg: 'bg-emerald-900/30',
          nextPrayerBorder: 'border-emerald-600/30',
          nextPrayerAccent: 'text-emerald-400',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.mainBg} rounded-2xl p-6 border ${colors.border} backdrop-blur-sm shadow-xl h-full flex flex-col justify-center`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className={`w-5 h-5 ${colors.iconColor}`} />
          <h3 className="text-lg font-semibold text-white">Prayer Times</h3>
        </div>
        <div className="flex items-center space-x-1 text-xs text-white/70">
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
        </div>
      </div>

      {nextPrayer && (
        <div className={`p-6 ${colors.nextPrayerBg} border ${colors.nextPrayerBorder} rounded-xl`}>
          <p className={`text-xs ${colors.nextPrayerAccent} font-medium mb-2`}>Next Prayer</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-white">{nextPrayer.name}</p>
            <p className={`text-3xl font-bold ${colors.nextPrayerAccent}`}>{nextPrayer.time}</p>
          </div>
        </div>
      )}
    </div>
  );
}
