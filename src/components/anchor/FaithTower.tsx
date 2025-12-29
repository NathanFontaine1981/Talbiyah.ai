import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Fact } from '../../types/db';
import { calculateCompoundProbability } from '../../data/certaintyData';

interface FaithTowerProps {
  facts: Fact[];
  verifiedIds: string[];
  currentFactId?: string;
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  prophecy: { bg: 'bg-purple-500/80', border: 'border-purple-400', text: 'text-purple-200' },
  preservation: { bg: 'bg-emerald-500/80', border: 'border-emerald-400', text: 'text-emerald-200' },
  historical: { bg: 'bg-amber-500/80', border: 'border-amber-400', text: 'text-amber-200' },
  mathematical: { bg: 'bg-blue-500/80', border: 'border-blue-400', text: 'text-blue-200' },
  linguistic: { bg: 'bg-rose-500/80', border: 'border-rose-400', text: 'text-rose-200' },
};

export const FaithTower = ({ facts, verifiedIds, currentFactId }: FaithTowerProps) => {
  const probability = useMemo(() => {
    return calculateCompoundProbability(verifiedIds);
  }, [verifiedIds]);

  const percentageDisplay = (probability * 100).toFixed(1);

  // Get verified facts in order
  const verifiedFacts = facts.filter(f => verifiedIds.includes(f.id));
  const pendingFacts = facts.filter(f => !verifiedIds.includes(f.id));

  return (
    <div className="flex flex-col items-center">
      {/* Certainty Meter at Top */}
      <div className="mb-6 text-center">
        <div className="relative w-32 h-32 mx-auto mb-3">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-700"
            />
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-emerald-500"
              initial={{ strokeDasharray: '0, 352' }}
              animate={{
                strokeDasharray: `${probability * 352}, 352`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              key={percentageDisplay}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold text-white"
            >
              {percentageDisplay}%
            </motion.span>
          </div>
        </div>
        <p className="text-sm text-slate-400">Certainty Level</p>
        <p className="text-xs text-slate-500">
          {verifiedIds.length} fact{verifiedIds.length !== 1 ? 's' : ''} verified
        </p>
      </div>

      {/* The Tower */}
      <div className="relative w-48">
        {/* Foundation */}
        <div className="bg-slate-800 border-2 border-slate-600 rounded-b-lg h-4 w-full" />

        {/* Tower blocks - verified facts */}
        <div className="flex flex-col-reverse">
          {verifiedFacts.map((fact, index) => {
            const colors = categoryColors[fact.category] || categoryColors.historical;
            const isLatest = index === verifiedFacts.length - 1;

            return (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: index * 0.1,
                }}
                className={`relative ${colors.bg} border-2 ${colors.border} h-8 w-full
                  flex items-center justify-center
                  ${index === 0 ? '' : '-mt-0.5'}
                  ${isLatest ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-950' : ''}`}
                style={{
                  width: `${100 - index * 2}%`,
                  marginLeft: `${index}%`,
                }}
              >
                <span className={`text-xs font-medium ${colors.text} truncate px-2`}>
                  {fact.title.split(' ').slice(0, 2).join(' ')}
                </span>

                {/* Glow effect on latest */}
                {isLatest && (
                  <motion.div
                    className="absolute inset-0 rounded-sm"
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(255,255,255,0.3)',
                        '0 0 20px rgba(255,255,255,0.5)',
                        '0 0 10px rgba(255,255,255,0.3)',
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Ghost blocks for pending facts */}
        {pendingFacts.length > 0 && verifiedFacts.length > 0 && (
          <div className="mt-2 opacity-30">
            {pendingFacts.slice(0, 3).map((fact, index) => {
              const adjustedIndex = verifiedFacts.length + index;
              return (
                <div
                  key={fact.id}
                  className="bg-slate-700 border border-dashed border-slate-500 h-6 flex items-center justify-center -mt-0.5"
                  style={{
                    width: `${100 - adjustedIndex * 2}%`,
                    marginLeft: `${adjustedIndex}%`,
                  }}
                >
                  <span className="text-xs text-slate-500">?</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Crown at top when complete */}
        {probability > 0.9 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl"
          >
            ☪️
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {Object.entries(categoryColors).map(([category, colors]) => (
          <div key={category} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${colors.bg}`} />
            <span className="text-xs text-slate-400 capitalize">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaithTower;
