import { SalahTrackerSettings } from '../../lib/prayerAutoMark';

interface Props {
  settings: SalahTrackerSettings;
  updateSettings: (patch: Partial<SalahTrackerSettings>) => Promise<void>;
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        on ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function SalahAutoMarkSettings({ settings, updateSettings }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Auto-mark prayers</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Off by default. Nothing in the past gets backfilled - only days from the moment you turn this on.
      </p>

      <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-mark prayers as done</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-md">
            Assumes each fard was prayed on time, unless you say otherwise. You'll still be able to correct any day.
          </p>
        </div>
        <Toggle
          on={settings.auto_mark_enabled}
          onClick={() => updateSettings({ auto_mark_enabled: !settings.auto_mark_enabled })}
        />
      </div>

      <div className="flex items-start justify-between gap-4 py-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700 mt-1">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Include confirmed sunnah by default</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-md">
            Also assumes the mu'akkadah sunnah for that prayer (2 before Fajr, 4+2 around Dhuhr, 2 after Maghrib, 2 after Isha). Asr has no confirmed sunnah either way.
          </p>
        </div>
        <Toggle
          on={settings.auto_mark_sunnah_enabled}
          disabled={!settings.auto_mark_enabled}
          onClick={() => updateSettings({ auto_mark_sunnah_enabled: !settings.auto_mark_sunnah_enabled })}
        />
      </div>
    </div>
  );
}
