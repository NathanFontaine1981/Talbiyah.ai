import { ImageIcon } from 'lucide-react';

interface ImagePlaceholderProps {
  description: string;
  category: 'landscape' | 'concept' | 'historical' | 'nature' | 'abstract';
  src?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

const categoryColors = {
  landscape: { from: 'from-sky-900/40', to: 'to-slate-900/60', icon: 'text-sky-400/60', border: 'border-sky-700/30' },
  concept: { from: 'from-violet-900/40', to: 'to-slate-900/60', icon: 'text-violet-400/60', border: 'border-violet-700/30' },
  historical: { from: 'from-amber-900/40', to: 'to-slate-900/60', icon: 'text-amber-400/60', border: 'border-amber-700/30' },
  nature: { from: 'from-emerald-900/40', to: 'to-slate-900/60', icon: 'text-emerald-400/60', border: 'border-emerald-700/30' },
  abstract: { from: 'from-rose-900/40', to: 'to-slate-900/60', icon: 'text-rose-400/60', border: 'border-rose-700/30' },
};

const aspectClasses = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
};

export default function ImagePlaceholder({ description, category, src, aspectRatio = '16:9' }: ImagePlaceholderProps) {
  const colors = categoryColors[category];

  if (src) {
    return (
      <div className={`${aspectClasses[aspectRatio]} rounded-xl overflow-hidden`}>
        <img
          src={src}
          alt={description}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${aspectClasses[aspectRatio]} rounded-xl bg-gradient-to-br ${colors.from} ${colors.to} border ${colors.border} flex flex-col items-center justify-center gap-3 px-4`}>
      <ImageIcon className={`w-8 h-8 ${colors.icon}`} />
      <p className="text-slate-500 text-xs text-center leading-relaxed max-w-[200px]">
        {description}
      </p>
    </div>
  );
}
