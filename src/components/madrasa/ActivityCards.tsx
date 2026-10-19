import { arabize } from './ArabicText';

export interface Activity {
  title: string;
  type: string;
  duration_minutes: number;
  materials: string[];
  how_to_run: string[];
  learning_point: string;
  extension: string;
}

const TYPE_CHIP: Record<string, string> = {
  game: 'bg-violet-100 text-violet-800',
  drill: 'bg-sky-100 text-sky-800',
  'role-play': 'bg-rose-100 text-rose-800',
  discussion: 'bg-amber-100 text-amber-800',
  movement: 'bg-lime-100 text-lime-800',
  art: 'bg-pink-100 text-pink-800',
  quiz: 'bg-indigo-100 text-indigo-800',
};

/** Teacher-facing only. Never shown to parents. */
export default function ActivityCards({ activities }: { activities: Activity[] }) {
  return (
    <ol className="space-y-4">
      {activities.map((a, i) => (
        <li key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-gray-900">{i + 1}. {arabize(a.title)}</h4>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_CHIP[a.type.toLowerCase()] ?? 'bg-gray-100 text-gray-700'}`}>{a.type}</span>
            <span className="text-xs text-gray-500">{a.duration_minutes} min</span>
          </div>
          <p className="mb-2 text-sm text-gray-600"><span className="font-medium text-gray-700">You need:</span> {a.materials.length ? a.materials.join(', ') : 'nothing'}</p>
          <ol className="mb-3 list-decimal space-y-1 pl-5 text-[15px] leading-6 text-gray-800">
            {a.how_to_run.map((s, j) => <li key={j}>{arabize(s)}</li>)}
          </ol>
          <p className="text-sm text-gray-700"><span className="font-medium">Learning point:</span> {arabize(a.learning_point)}</p>
          <p className="text-sm text-gray-700"><span className="font-medium">Stretch / support:</span> {arabize(a.extension)}</p>
        </li>
      ))}
    </ol>
  );
}
