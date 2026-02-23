import { MapPin, Check, Circle, Clock } from 'lucide-react';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { usePrayerTracking } from '../../hooks/usePrayerTracking';

interface PrayerTimelineProps {
  variant?: 'light' | 'dark';
}

type PrayerStatus = 'future' | 'active' | 'completed' | 'missed';

export default function PrayerTimeline({ variant = 'light' }: PrayerTimelineProps) {
  const { prayerTimes, location, loading, currentMinutes } = usePrayerTimes();
  const { completedPrayers, togglePrayer, isPrayerCompleted } = usePrayerTracking();

  const isDark = variant === 'dark';

  if (loading || prayerTimes.length === 0) {
    return (
      <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-900/60 border border-slate-700/50' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'}`}>
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-emerald-700'}`}>
            Loading prayer times...
          </span>
        </div>
      </div>
    );
  }

  // Calculate segment widths proportional to duration
  const segments = prayerTimes.map((prayer, i) => {
    const start = prayer.timeInMinutes;
    const end = i < prayerTimes.length - 1
      ? prayerTimes[i + 1].timeInMinutes
      : 1440; // midnight
    return {
      ...prayer,
      start,
      end,
      duration: end - start,
    };
  });

  const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

  // Find which segment the current time falls in
  const activeIndex = segments.findIndex(
    (s) => currentMinutes >= s.start && currentMinutes < s.end
  );

  // Calculate the position of the "now" marker as a percentage of the full bar
  const getMarkerPercent = (): number | null => {
    if (activeIndex === -1) return null;
    if (currentMinutes < prayerTimes[0].timeInMinutes) return null;

    let cumulative = 0;
    for (let i = 0; i < activeIndex; i++) {
      cumulative += segments[i].duration;
    }
    const withinSegment = currentMinutes - segments[activeIndex].start;
    cumulative += withinSegment;
    return (cumulative / totalDuration) * 100;
  };

  const markerPercent = getMarkerPercent();

  // Determine status for each prayer
  const getPrayerStatus = (index: number): PrayerStatus => {
    const name = segments[index].name;
    if (isPrayerCompleted(name)) return 'completed';
    if (index === activeIndex) return 'active';
    if (currentMinutes >= segments[index].end) return 'missed';
    return 'future';
  };

  // Find next prayer index (first non-completed future/active prayer)
  const nextPrayerIndex = segments.findIndex((_, i) => {
    const status = getPrayerStatus(i);
    return status === 'active' || status === 'future';
  });

  // Get next prayer time string for status message
  const nextPrayerTime = nextPrayerIndex >= 0 && nextPrayerIndex < segments.length - 1
    ? segments[nextPrayerIndex + 1]?.time
    : null;

  // Status message logic
  const completedCount = completedPrayers.length;
  const currentPrayerStatus = activeIndex >= 0 ? getPrayerStatus(activeIndex) : null;

  const getStatusMessage = (): string => {
    if (completedCount === 5) {
      return 'All 5 prayers completed today. May Allah accept them.';
    }
    if (currentPrayerStatus === 'completed' && nextPrayerTime) {
      return `Your connection is secured until ${nextPrayerTime}`;
    }
    if (currentPrayerStatus === 'active') {
      return 'Time to renew your connection with Allah';
    }
    if (completedCount > 0) {
      return `${completedCount}/5 prayers today. Keep going — establish your prayer gradually.`;
    }
    return '';
  };

  const statusMessage = getStatusMessage();

  // Segment colors based on prayer status
  const getSegmentBg = (status: PrayerStatus): string => {
    switch (status) {
      case 'completed':
        return isDark ? 'bg-emerald-700' : 'bg-emerald-500';
      case 'active':
        return isDark ? 'bg-amber-600 animate-pulse' : 'bg-amber-500 animate-pulse';
      case 'missed':
        return isDark ? 'bg-amber-900/60' : 'bg-amber-200';
      case 'future':
        return isDark ? 'bg-slate-700' : 'bg-teal-100/60';
    }
  };

  const getSegmentText = (status: PrayerStatus): string => {
    switch (status) {
      case 'completed':
        return 'text-white';
      case 'active':
        return 'text-white';
      case 'missed':
        return isDark ? 'text-amber-300' : 'text-amber-700';
      case 'future':
        return isDark ? 'text-slate-300' : 'text-emerald-800';
    }
  };

  const getSegmentTimeText = (status: PrayerStatus): string => {
    switch (status) {
      case 'completed':
        return 'text-white/70';
      case 'active':
        return 'text-white/80';
      case 'missed':
        return isDark ? 'text-amber-400/60' : 'text-amber-500';
      case 'future':
        return isDark ? 'text-slate-400' : 'text-emerald-500';
    }
  };

  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-slate-900/60 border border-slate-700/50' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80'}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-emerald-900'}`}>
          Today's Prayer Times
        </h3>
        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-emerald-600'}`}>
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative">
        <div className="flex rounded-xl overflow-hidden h-14">
          {segments.map((seg, i) => {
            const widthPercent = (seg.duration / totalDuration) * 100;
            const status = getPrayerStatus(i);
            const bgClass = getSegmentBg(status);
            const textClass = getSegmentText(status);
            const timeClass = getSegmentTimeText(status);

            return (
              <div
                key={seg.name}
                className={`flex flex-col items-center justify-center ${bgClass} transition-colors relative ${i > 0 ? (isDark ? 'border-l border-slate-600/50' : 'border-l border-emerald-200/50') : ''}`}
                style={{ width: `${widthPercent}%`, minWidth: '40px' }}
              >
                <span className={`text-xs font-semibold ${textClass} leading-none`}>
                  {seg.name}
                </span>
                <span className={`text-[10px] mt-1 ${timeClass}`}>
                  {seg.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current time marker */}
        {markerPercent !== null && (
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${markerPercent}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-0.5 h-full ${isDark ? 'bg-white' : 'bg-emerald-900'}`} />
            <div className={`absolute -bottom-5 text-[10px] font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>
              NOW
            </div>
          </div>
        )}
      </div>

      {/* Checkmark button row */}
      <div className="flex mt-4">
        {segments.map((seg, i) => {
          const widthPercent = (seg.duration / totalDuration) * 100;
          const status = getPrayerStatus(i);
          const isFuture = status === 'future';

          return (
            <div
              key={`check-${seg.name}`}
              className="flex items-center justify-center"
              style={{ width: `${widthPercent}%`, minWidth: '40px' }}
            >
              <button
                onClick={() => !isFuture && togglePrayer(seg.name)}
                disabled={isFuture}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  status === 'completed'
                    ? isDark
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                      : 'bg-emerald-500 text-white shadow-md shadow-emerald-300/50'
                    : status === 'active'
                      ? isDark
                        ? 'bg-indigo-900/50 border-2 border-indigo-400 text-indigo-300 hover:bg-indigo-800/50'
                        : 'bg-emerald-100 border-2 border-emerald-400 text-emerald-500 hover:bg-emerald-200'
                      : status === 'missed'
                        ? isDark
                          ? 'bg-amber-900/30 border-2 border-amber-500/50 text-amber-400 hover:bg-amber-900/50'
                          : 'bg-amber-50 border-2 border-amber-300 text-amber-500 hover:bg-amber-100'
                        : isDark
                          ? 'bg-slate-800 text-slate-600 cursor-default'
                          : 'bg-teal-50 text-emerald-300 cursor-default'
                }`}
                aria-label={
                  status === 'completed'
                    ? `${seg.name} completed — tap to undo`
                    : isFuture
                      ? `${seg.name} hasn't started yet`
                      : `Mark ${seg.name} as completed`
                }
              >
                {status === 'completed' ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : isFuture ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Status message */}
      {statusMessage && (
        <p className={`text-center text-sm mt-3 ${
          completedCount === 5
            ? isDark ? 'text-emerald-300 font-medium' : 'text-emerald-700 font-medium'
            : currentPrayerStatus === 'completed'
              ? isDark ? 'text-emerald-400' : 'text-emerald-600'
              : currentPrayerStatus === 'active'
                ? isDark ? 'text-amber-300' : 'text-amber-600'
                : isDark ? 'text-slate-300' : 'text-emerald-700'
        }`}>
          {statusMessage}
        </p>
      )}

      {/* Hadith motivation when 0 prayers done */}
      {completedCount === 0 && (
        <p className={`text-center text-xs italic mt-2 leading-relaxed ${isDark ? 'text-slate-500' : 'text-emerald-500/70'}`}>
          "The first matter the slave will be brought to account for on the Day of Judgment is the prayer."
          <span className="not-italic"> — Sunan an-Nasa'i</span>
        </p>
      )}

      {/* Gentle encouragement when partially done */}
      {completedCount > 0 && completedCount < 5 && (
        <p className={`text-center text-xs italic mt-2 leading-relaxed ${isDark ? 'text-slate-500' : 'text-emerald-500/70'}`}>
          "The most beloved deeds to Allah are the most consistent, even if small."
        </p>
      )}
    </div>
  );
}
