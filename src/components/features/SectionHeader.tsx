interface SectionHeaderProps {
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
}

const colorClasses: Record<string, string> = {
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400',
  violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
};

export function SectionHeader({ badge, badgeColor, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="text-center">
      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${colorClasses[badgeColor]}`}>
        {badge}
      </span>
      <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
}
