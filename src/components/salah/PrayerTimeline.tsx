import { useState } from 'react';
import { MapPin, Check, Circle, Clock, ChevronDown, ChevronUp, Castle, Home, Building2, Sun, AlertTriangle, Star } from 'lucide-react';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { usePrayerTracking, SUNNAH_PRAYERS, TOTAL_SUNNAH_RAKAHS, NAFL_PRAYERS } from '../../hooks/usePrayerTracking';

interface PrayerTimelineProps {
  variant?: 'light' | 'dark';
}

type PrayerStatus = 'future' | 'active' | 'completed' | 'missed';

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function PrayerTimeline({ variant = 'light' }: PrayerTimelineProps) {
  const { prayerTimes, sunrise, location, loading, currentMinutes } = usePrayerTimes();
  const { completedPrayers, togglePrayer, isPrayerCompleted, toggleSunnah, isSunnahCompleted, sunnahRakahsDone, toggleLocation, getLocation } = usePrayerTracking();
  const [showSunnah, setShowSunnah] = useState(false);
  const [showNafl, setShowNafl] = useState(false);

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
  // Fajr ends at sunrise (not Dhuhr), with a gap segment for sunrise→Dhuhr
  const rawSegments = prayerTimes.map((prayer, i) => {
    const start = prayer.timeInMinutes;
    const isFajr = prayer.name === 'Fajr';
    const end = isFajr && sunrise
      ? sunrise.timeInMinutes
      : i < prayerTimes.length - 1
        ? prayerTimes[i + 1].timeInMinutes
        : 1440; // midnight
    return {
      ...prayer,
      start,
      end,
      duration: end - start,
      isGap: false,
    };
  });

  // Insert a gap segment between sunrise and Dhuhr
  const segments: typeof rawSegments = [];
  for (const seg of rawSegments) {
    segments.push(seg);
    if (seg.name === 'Fajr' && sunrise) {
      const dhuhr = prayerTimes.find(p => p.name === 'Dhuhr');
      if (dhuhr && sunrise.timeInMinutes < dhuhr.timeInMinutes) {
        segments.push({
          name: '',
          time: sunrise.time,
          timeInMinutes: sunrise.timeInMinutes,
          isPassed: currentMinutes > sunrise.timeInMinutes,
          start: sunrise.timeInMinutes,
          end: dhuhr.timeInMinutes,
          duration: dhuhr.timeInMinutes - sunrise.timeInMinutes,
          isGap: true,
        });
      }
    }
  }

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
    if (segments[index].isGap) return 'future'; // gap segments are neutral
    const name = segments[index].name;
    if (isPrayerCompleted(name)) return 'completed';
    if (index === activeIndex) return 'active';
    if (currentMinutes >= segments[index].end) return 'missed';
    return 'future';
  };

  // Find next prayer index (first non-completed future/active prayer, skip gaps)
  const nextPrayerIndex = segments.findIndex((seg, i) => {
    if (seg.isGap) return false;
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
            const bgClass = seg.isGap
              ? (isDark ? 'bg-slate-800/60' : 'bg-slate-100/80')
              : getSegmentBg(status);
            const textClass = getSegmentText(status);
            const timeClass = getSegmentTimeText(status);

            return (
              <div
                key={seg.isGap ? 'sunrise-gap' : seg.name}
                className={`flex flex-col items-center justify-center ${bgClass} transition-colors relative ${i > 0 ? (isDark ? 'border-l border-slate-600/50' : 'border-l border-emerald-200/50') : ''}`}
                style={{ width: `${widthPercent}%`, minWidth: seg.isGap ? '30px' : '40px' }}
              >
                {seg.isGap ? (
                  <>
                    <Sun className={`w-3.5 h-3.5 ${isDark ? 'text-amber-500/60' : 'text-amber-500/50'}`} />
                    <span className={`text-[9px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {sunrise?.time}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-xs font-semibold ${textClass} leading-none`}>
                      {seg.displayName || seg.name}
                    </span>
                    <span className={`text-[10px] mt-1 ${timeClass}`}>
                      {seg.time}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Forbidden time zone around sunrise — 30min before to 15min after */}
        {sunrise && (() => {
          const forbiddenStart = sunrise.timeInMinutes - 30;
          const forbiddenEnd = sunrise.timeInMinutes + 15;
          const barStart = segments[0]?.start ?? 0;
          const startPercent = ((forbiddenStart - barStart) / totalDuration) * 100;
          const widthPercent = ((forbiddenEnd - forbiddenStart) / totalDuration) * 100;
          return (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: `${Math.max(0, startPercent)}%`, width: `${widthPercent}%` }}
            >
              <div className={`h-full ${isDark ? 'bg-red-500/20' : 'bg-red-400/15'} border-l border-r ${isDark ? 'border-red-500/50' : 'border-red-400/40'}`} />
            </div>
          );
        })()}

        {/* Current time marker */}
        {markerPercent !== null && (
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${markerPercent}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`absolute -top-5 text-[10px] font-bold ${isDark ? 'text-white' : 'text-emerald-900'}`}>
              NOW
            </div>
            <div className={`w-0.5 h-full ${isDark ? 'bg-white' : 'bg-emerald-900'}`} />
          </div>
        )}
      </div>

      {/* Forbidden time note */}
      {sunrise && (
        <div className={`flex items-center gap-1.5 mt-6 mb-1 ${isDark ? 'text-red-400/70' : 'text-red-500/60'}`}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <p className="text-[10px] leading-tight">
            Avoid voluntary prayer {formatMinutes(sunrise.timeInMinutes - 30)}–{formatMinutes(sunrise.timeInMinutes + 15)} (around sunrise). Fajr fard is still permitted if needed.
          </p>
        </div>
      )}

      {/* Checkmark button row + location toggle */}
      <div className="flex mt-4">
        {segments.map((seg, i) => {
          const widthPercent = (seg.duration / totalDuration) * 100;

          // Gap segments get an empty spacer
          if (seg.isGap) {
            return (
              <div
                key="check-sunrise-gap"
                style={{ width: `${widthPercent}%`, minWidth: '30px' }}
              />
            );
          }

          const status = getPrayerStatus(i);
          const isFuture = status === 'future';
          const loc = getLocation(seg.name);
          const isJumuah = !!seg.displayName && seg.displayName === "Jumu'ah";

          return (
            <div
              key={`check-${seg.name}`}
              className="flex flex-col items-center gap-1"
              style={{ width: `${widthPercent}%`, minWidth: '40px' }}
            >
              <button
                onClick={() => !isFuture && togglePrayer(seg.name, seg.end, currentMinutes)}
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

              {/* Home / Masjid toggle — only shown when prayer is completed */}
              {status === 'completed' && (
                isJumuah ? (
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}>
                    <Building2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Masjid</span>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleLocation(seg.name)}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                      loc === 'masjid'
                        ? isDark
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                        : isDark
                          ? 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                          : 'bg-emerald-100/60 text-emerald-600 border border-emerald-200/60'
                    }`}
                    aria-label={`${seg.name}: ${loc === 'masjid' ? 'Prayed at masjid (27x reward)' : 'Prayed at home'} — tap to toggle`}
                  >
                    {loc === 'masjid' ? (
                      <>
                        <Building2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Masjid</span>
                      </>
                    ) : (
                      <>
                        <Home className="w-3 h-3" />
                        <span className="hidden sm:inline">Home</span>
                      </>
                    )}
                  </button>
                )
              )}
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
        <p className={`text-center text-xs italic mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-emerald-700'}`}>
          "The most beloved deeds to Allah are the most consistent, even if small."
        </p>
      )}

      {/* Sunnah Rawatib section — gold/black "extra reward" theme */}
      <div className={`mt-4 pt-3 border-t ${isDark ? 'border-amber-800/40' : 'border-amber-300/60'}`}>
        <button
          onClick={() => setShowSunnah(!showSunnah)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Castle className={`w-4 h-4 ${sunnahRakahsDone === TOTAL_SUNNAH_RAKAHS ? (isDark ? 'text-amber-400' : 'text-amber-500') : isDark ? 'text-amber-500/70' : 'text-amber-600'}`} />
            <span className={`text-xs font-semibold ${isDark ? 'text-amber-300' : 'text-gray-900'}`}>
              Sunnah Prayers
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              sunnahRakahsDone === TOTAL_SUNNAH_RAKAHS
                ? isDark ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-amber-400 text-gray-900'
                : sunnahRakahsDone > 0
                  ? isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-800'
                  : isDark ? 'bg-slate-700 text-amber-500/60' : 'bg-amber-50 text-amber-700/60'
            }`}>
              {sunnahRakahsDone}/{TOTAL_SUNNAH_RAKAHS} rak'ahs
            </span>
          </div>
          {showSunnah ? (
            <ChevronUp className={`w-4 h-4 ${isDark ? 'text-amber-500/70' : 'text-amber-600'}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-amber-500/70' : 'text-amber-600'}`} />
          )}
        </button>

        {showSunnah && (
          <div className="mt-3 space-y-2">
            {/* Palace progress */}
            {sunnahRakahsDone === TOTAL_SUNNAH_RAKAHS ? (
              <div className={`text-center py-2.5 px-3 rounded-lg ${isDark ? 'bg-gradient-to-r from-amber-900/40 to-yellow-900/30 border border-amber-600/50' : 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300'}`}>
                <p className={`text-xs font-semibold ${isDark ? 'text-amber-300' : 'text-gray-900'}`}>
                  A palace is being built for you in Paradise today
                </p>
              </div>
            ) : (
              <p className={`text-xs italic text-center ${isDark ? 'text-amber-500/60' : 'text-amber-700/60'}`}>
                "Whoever prays 12 rak'ahs during the day and night, a house will be built for him in Paradise." — Tirmidhi
              </p>
            )}

            {/* Sunnah checkboxes */}
            <div className="grid grid-cols-1 gap-1.5">
              {SUNNAH_PRAYERS.map((sunnah) => {
                const done = isSunnahCompleted(sunnah.key);
                return (
                  <button
                    key={sunnah.key}
                    onClick={() => toggleSunnah(sunnah.key)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${
                      done
                        ? isDark
                          ? 'bg-amber-900/30 border border-amber-600/40'
                          : 'bg-amber-100 border border-amber-300'
                        : isDark
                          ? 'bg-slate-800/50 border border-amber-800/30 hover:bg-amber-900/20'
                          : 'bg-amber-50/50 border border-amber-200/60 hover:bg-amber-100/60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done
                        ? isDark ? 'bg-amber-500 text-gray-900' : 'bg-amber-500 text-gray-900'
                        : isDark ? 'border-2 border-amber-700/50' : 'border-2 border-amber-300'
                    }`}>
                      {done && <Check className="w-3 h-3" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${
                        done
                          ? isDark ? 'text-amber-300' : 'text-gray-900'
                          : isDark ? 'text-slate-300' : 'text-gray-800'
                      }`}>
                        {sunnah.label}
                      </span>
                      <span className={`text-xs ml-1.5 ${isDark ? 'text-amber-600/60' : 'text-amber-600/70'}`}>
                        ({sunnah.rakahs} rak'ahs)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress bar toward 12 */}
            <div className="mt-1">
              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-amber-100'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sunnahRakahsDone === TOTAL_SUNNAH_RAKAHS
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                      : isDark ? 'bg-amber-600' : 'bg-amber-400'
                  }`}
                  style={{ width: `${(sunnahRakahsDone / TOTAL_SUNNAH_RAKAHS) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nafl (Voluntary) prayers section */}
      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-indigo-800/40' : 'border-indigo-300/60'}`}>
        <button
          onClick={() => setShowNafl(!showNafl)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${isDark ? 'text-indigo-400/70' : 'text-indigo-500'}`} />
            <span className={`text-xs font-semibold ${isDark ? 'text-indigo-300' : 'text-gray-900'}`}>
              Nafl Prayers
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              NAFL_PRAYERS.every(n => isSunnahCompleted(n.key))
                ? isDark ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40' : 'bg-indigo-400 text-white'
                : NAFL_PRAYERS.some(n => isSunnahCompleted(n.key))
                  ? isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-100 text-indigo-800'
                  : isDark ? 'bg-slate-700 text-indigo-500/60' : 'bg-indigo-50 text-indigo-700/60'
            }`}>
              {NAFL_PRAYERS.filter(n => isSunnahCompleted(n.key)).length}/{NAFL_PRAYERS.length}
            </span>
          </div>
          {showNafl ? (
            <ChevronUp className={`w-4 h-4 ${isDark ? 'text-indigo-500/70' : 'text-indigo-500'}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-indigo-500/70' : 'text-indigo-500'}`} />
          )}
        </button>

        {showNafl && (
          <div className="mt-3 space-y-2">
            {/* Ishraq / staying after Fajr reward */}
            {NAFL_PRAYERS.every(n => isSunnahCompleted(n.key)) ? (
              <div className={`text-center py-2.5 px-3 rounded-lg ${isDark ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border border-indigo-600/50' : 'bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-300'}`}>
                <p className={`text-xs font-semibold ${isDark ? 'text-indigo-300' : 'text-gray-900'}`}>
                  All nafl prayers completed today. May Allah accept them.
                </p>
              </div>
            ) : (
              <div className={`rounded-lg p-3 ${isDark ? 'bg-indigo-900/20 border border-indigo-700/30' : 'bg-indigo-50 border border-indigo-200'}`}>
                <p className={`text-xs italic text-center leading-relaxed ${isDark ? 'text-indigo-400/80' : 'text-indigo-700/70'}`}>
                  "Whoever prays Fajr in congregation, then sits remembering Allah until the sun rises, then prays two rak'ahs — he will have a reward like that of Hajj and Umrah, complete, complete, complete."
                </p>
                <p className={`text-[10px] text-center mt-1.5 not-italic ${isDark ? 'text-indigo-500/50' : 'text-indigo-500/60'}`}>
                  — Jami' at-Tirmidhi 586
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-1.5">
              {NAFL_PRAYERS.map((nafl) => {
                const done = isSunnahCompleted(nafl.key);
                return (
                  <button
                    key={nafl.key}
                    onClick={() => toggleSunnah(nafl.key)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${
                      done
                        ? isDark
                          ? 'bg-indigo-900/30 border border-indigo-600/40'
                          : 'bg-indigo-100 border border-indigo-300'
                        : isDark
                          ? 'bg-slate-800/50 border border-indigo-800/30 hover:bg-indigo-900/20'
                          : 'bg-indigo-50/50 border border-indigo-200/60 hover:bg-indigo-100/60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done
                        ? isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-500 text-white'
                        : isDark ? 'border-2 border-indigo-700/50' : 'border-2 border-indigo-300'
                    }`}>
                      {done && <Check className="w-3 h-3" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${
                        done
                          ? isDark ? 'text-indigo-300' : 'text-gray-900'
                          : isDark ? 'text-slate-300' : 'text-gray-800'
                      }`}>
                        {nafl.label}
                      </span>
                      <span className={`text-xs ml-1.5 ${isDark ? 'text-indigo-600/60' : 'text-indigo-600/70'}`}>
                        ({nafl.rakahs} rak'ahs)
                      </span>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                        {nafl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
