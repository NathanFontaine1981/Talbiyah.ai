import { motion } from 'framer-motion';
import { Lock, CheckCircle, ExternalLink } from 'lucide-react';
import { type FoundationCategory } from '../../data/foundationCategories';

interface CategoryGridProps {
  categories: FoundationCategory[];
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  onCategorySelect: (category: FoundationCategory) => void;
  getCategoryProgress: (slug: string) => { watched: number; passed: number; total: number };
}

export default function CategoryGrid({
  categories,
  iconMap,
  onCategorySelect,
  getCategoryProgress
}: CategoryGridProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Choose Your Path
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Start with Tawheed - understanding who Allah is forms the foundation of everything else.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => {
          const Icon = iconMap[category.icon] || iconMap.BookOpen;
          const progress = getCategoryProgress(category.slug);
          const isComplete = progress.total > 0 && progress.passed === progress.total;
          const hasProgress = progress.passed > 0;

          return (
            <motion.button
              key={category.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onCategorySelect(category)}
              disabled={category.isComingSoon}
              className={`relative group text-left bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                category.isComingSoon
                  ? 'border-gray-200 opacity-60 cursor-not-allowed'
                  : 'border-gray-200 hover:border-amber-300 hover:shadow-lg cursor-pointer'
              }`}
            >
              {/* Coming Soon Badge */}
              {category.isComingSoon && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Completion Badge */}
              {isComplete && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${category.gradient}`}>
                {category.isComingSoon ? (
                  <Lock className="w-7 h-7 text-white/80" />
                ) : (
                  <Icon className="w-7 h-7 text-white" />
                )}
              </div>

              {/* Content */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  {category.slug === 'how-to-pray' && (
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500 font-arabic">{category.arabicName}</p>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description}
              </p>

              {/* Progress Bar */}
              {!category.isComingSoon && progress.total > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{progress.passed} / {progress.total} completed</span>
                    <span>{Math.round((progress.passed / progress.total) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${category.gradient} transition-all duration-500`}
                      style={{ width: `${(progress.passed / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Start/Continue CTA */}
              {!category.isComingSoon && !isComplete && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className={`text-sm font-medium ${
                    hasProgress ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {hasProgress ? 'Continue Learning →' : 'Start Learning →'}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-emerald-800 mb-2">
            Ready for the Next Step?
          </h3>
          <p className="text-emerald-700 text-sm mb-4">
            Once you've built your foundations, continue your journey with personalized
            1-on-1 Quran lessons and Arabic language courses.
          </p>
          <a
            href="/teachers"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
          >
            Explore Quran Lessons
          </a>
        </div>
      </div>
    </div>
  );
}
