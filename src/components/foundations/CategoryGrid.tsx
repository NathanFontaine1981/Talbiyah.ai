import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, ChevronRight, Trophy, BookOpen, Play, ArrowLeft, Film, ExternalLink, Headphones, Search } from 'lucide-react';
import { type FoundationCategory, type FoundationVideo } from '../../data/foundationCategories';
import { supabase } from '../../lib/supabaseClient';

interface Pillar {
  id: string;
  slug: string;
  name: string;
  arabic_name: string;
  description: string;
  icon: string;
  order_index: number;
  color: string;
  gradient: string;
}

interface ExternalResource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  url: string;
  year: number;
}

interface CategoryGridProps {
  categories: FoundationCategory[];
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  onCategorySelect: (category: FoundationCategory) => void;
  getCategoryProgress: (slug: string) => { watched: number; passed: number; total: number };
  onStartInvestigation?: (pillarSlug: string) => void;
  isInvestigationCompleted?: (pillarSlug: string) => boolean;
}

// Define pillar colors
const pillarColors: Record<string, { gradient: string; bg: string; border: string; text: string }> = {
  'allah': {
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700'
  },
  'muhammad': {
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700'
  },
  'prophets': {
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700'
  },
  'angels': {
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700'
  },
  'hereafter': {
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700'
  },
  'history': {
    gradient: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700'
  }
};

// Pillar icons/emojis
const pillarIcons: Record<string, string> = {
  'allah': '☀️',
  'muhammad': '🌙',
  'prophets': '📜',
  'angels': '✨',
  'hereafter': '⚖️',
  'history': '🏛️'
};

export default function CategoryGrid({
  categories,
  iconMap,
  onCategorySelect,
  getCategoryProgress,
  onStartInvestigation,
  isInvestigationCompleted
}: CategoryGridProps) {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [pillarCategories, setPillarCategories] = useState<FoundationCategory[]>([]);
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPillars();
  }, []);

  async function loadPillars() {
    try {
      const { data, error } = await supabase
        .from('foundation_pillars')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (data && !error) {
        setPillars(data);
      }
    } catch (err) {
      console.error('Error loading pillars:', err);
    } finally {
      setLoading(false);
    }
  }

  // Cross-referenced categories that should appear under multiple pillars
  const crossReferencedCategories: Record<string, string[]> = {
    'muhammad': ['umar-series'] // Omar Ibn Khattab Series also relevant to Muhammad ﷺ
  };

  async function handlePillarSelect(pillar: Pillar) {
    setSelectedPillar(pillar);

    // Load categories for this pillar
    const { data: cats } = await supabase
      .from('foundation_categories')
      .select('*')
      .eq('pillar_id', pillar.id)
      .eq('is_active', true)
      .order('order_index');

    let allCats = cats || [];

    // Load cross-referenced categories for this pillar
    const crossRefSlugs = crossReferencedCategories[pillar.slug];
    if (crossRefSlugs && crossRefSlugs.length > 0) {
      const { data: extraCats } = await supabase
        .from('foundation_categories')
        .select('*')
        .in('slug', crossRefSlugs)
        .eq('is_active', true);

      if (extraCats) {
        // Avoid duplicates
        const existingSlugs = new Set(allCats.map(c => c.slug));
        const newCats = extraCats.filter(c => !existingSlugs.has(c.slug));
        allCats = [...allCats, ...newCats];
      }
    }

    const mappedCats = allCats.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      arabicName: c.arabic_name || '',
      description: c.description || '',
      icon: c.icon || 'BookOpen',
      orderIndex: c.order_index,
      isActive: c.is_active,
      isComingSoon: c.is_coming_soon,
      color: pillarColors[pillar.slug]?.text.replace('text-', '') || 'gray',
      gradient: pillarColors[pillar.slug]?.gradient || 'from-gray-500 to-gray-600'
    }));
    setPillarCategories(mappedCats);

    // Load external resources for this pillar
    const { data: resources } = await supabase
      .from('foundation_external_resources')
      .select('*')
      .eq('pillar_id', pillar.id)
      .eq('is_active', true)
      .order('order_index');

    if (resources) {
      setExternalResources(resources);
    } else {
      setExternalResources([]);
    }
  }

  function handleBackToPillars() {
    setSelectedPillar(null);
    setPillarCategories([]);
    setExternalResources([]);
  }

  // Calculate pillar progress (sum of all categories in pillar)
  function getPillarProgress(pillarId: string): { watched: number; passed: number; total: number } {
    const pillarCats = categories.filter(c => {
      // Match categories to pillars based on our known structure
      const pillar = pillars.find(p => p.id === pillarId);
      if (!pillar) return false;

      // Known mappings
      if (pillar.slug === 'allah') return ['tawheed', 'names-of-allah'].includes(c.slug);
      if (pillar.slug === 'muhammad') return ['seerah-meccan', 'seerah-medinan', 'umar-series'].includes(c.slug);
      if (pillar.slug === 'prophets') return c.slug === 'lives-of-prophets';
      if (pillar.slug === 'angels') return c.slug === 'angels-series';
      if (pillar.slug === 'hereafter') return c.slug === 'hereafter-series';
      if (pillar.slug === 'history') return ['history-of-islam', 'umar-series'].includes(c.slug);
      return false;
    });

    return pillarCats.reduce((acc, cat) => {
      const progress = getCategoryProgress(cat.slug);
      return {
        watched: acc.watched + progress.watched,
        passed: acc.passed + progress.passed,
        total: acc.total + progress.total
      };
    }, { watched: 0, passed: 0, total: 0 });
  }

  // Calculate overall progress
  const overallProgress = pillars.reduce((acc, pillar) => {
    const progress = getPillarProgress(pillar.id);
    return {
      watched: acc.watched + progress.watched,
      passed: acc.passed + progress.passed,
      total: acc.total + progress.total
    };
  }, { watched: 0, passed: 0, total: 0 });

  const overallPercent = overallProgress.total > 0
    ? Math.round((overallProgress.passed / overallProgress.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show categories within selected pillar
  if (selectedPillar) {
    const colors = pillarColors[selectedPillar.slug] || pillarColors['allah'];

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={handleBackToPillars}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>All Pillars</span>
          </button>

          {/* Pillar Header */}
          <div className={`bg-gradient-to-r ${colors.gradient} rounded-2xl p-6 mb-8 text-white`}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{pillarIcons[selectedPillar.slug]}</span>
              <div>
                <h2 className="text-2xl font-bold">{selectedPillar.name}</h2>
                <p className="text-white/80 text-sm">{selectedPillar.arabic_name}</p>
              </div>
            </div>
            <p className="mt-3 text-white/90">{selectedPillar.description}</p>
          </div>

          {/* Investigation Card */}
          {onStartInvestigation && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onStartInvestigation(selectedPillar.slug)}
              className="w-full text-left mb-6"
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white hover:shadow-xl transition group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <div className="w-full h-full bg-white rounded-full transform translate-x-16 -translate-y-16" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {isInvestigationCompleted?.(selectedPillar.slug) ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Search className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">Investigate Islam</h4>
                      {isInvestigationCompleted?.(selectedPillar.slug) && (
                        <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">Completed</span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mt-0.5">
                      {(() => {
                        const scenarios: Record<string, string> = {
                          allah: 'Who wrote the Quran?',
                          muhammad: 'How do we identify a true prophet?',
                          prophets: 'Would God leave humanity without guidance?',
                          angels: 'How did the universe come into existence?',
                          hereafter: 'Is the complexity of life accidental or intentional?',
                          history: 'Has any religious text survived unchanged?'
                        };
                        return scenarios[selectedPillar.slug] || 'Examine the evidence';
                      })()}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </div>
            </motion.button>
          )}

          {/* Categories in this Pillar */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Courses</h3>
          <div className="space-y-4 mb-8">
            {pillarCategories.map((category, index) => {
              const progress = getCategoryProgress(category.slug);
              const percent = progress.total > 0 ? Math.round((progress.passed / progress.total) * 100) : 0;
              const isComplete = progress.total > 0 && progress.passed === progress.total;

              return (
                <motion.button
                  key={category.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !category.isComingSoon && onCategorySelect(category)}
                  disabled={category.isComingSoon}
                  className={`w-full text-left ${colors.bg} ${colors.border} border rounded-2xl p-4 transition hover:shadow-md ${
                    category.isComingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                        {category.isComingSoon ? (
                          <Lock className="w-5 h-5 text-white" />
                        ) : isComplete ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-500">
                          {category.isComingSoon ? 'Coming Soon' : `${progress.total} lessons`}
                        </p>
                      </div>
                    </div>

                    {!category.isComingSoon && progress.total > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`text-lg font-bold ${colors.text}`}>{percent}%</span>
                          <p className="text-xs text-gray-500">{progress.passed}/{progress.total}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}

                    {!category.isComingSoon && progress.total === 0 && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Progress bar */}
                  {!category.isComingSoon && progress.total > 0 && (
                    <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </motion.button>
              );
            })}

            {pillarCategories.length === 0 && (
              <div className={`${colors.bg} ${colors.border} border rounded-xl p-8 text-center`}>
                <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Content coming soon</p>
              </div>
            )}
          </div>

          {/* External Resources (Movies, Podcasts, etc.) */}
          {externalResources.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Recommended Media
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {externalResources.map((resource) => {
                  const isPodcast = resource.resource_type === 'Podcast' || resource.url.includes('spotify.com');
                  const ResourceIcon = isPodcast ? Headphones : Film;
                  const iconBg = isPodcast ? 'bg-green-100' : 'bg-gray-100';
                  const iconColor = isPodcast ? 'text-green-600' : 'text-gray-600';

                  return (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <ResourceIcon className={`w-6 h-6 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">{resource.title}</h4>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">{resource.description}</p>
                          <span className="text-xs text-gray-400 mt-1 inline-block">
                            {resource.resource_type} • {resource.year}
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main Pillars Grid
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative">
        {/* Quran Verse - Top */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-8"
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full px-6 py-4 text-center">
            <p className="text-lg font-arabic text-amber-800 mb-1" dir="rtl">
              يَا أَيُّهَا الَّذِينَ آمَنُوا ادْخُلُوا فِي السِّلْمِ كَافَّةً
            </p>
            <p className="text-amber-700 text-sm">
              "O you who have believed, enter into Islam completely." — <span className="text-amber-600">Surah Al-Baqarah (2:208)</span>
            </p>
          </div>
        </motion.div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-amber-600 text-sm font-semibold uppercase tracking-widest mb-3"
          >
            The 6 Articles of Faith
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3"
          >
            Unshakeable Foundations
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 max-w-2xl mx-auto"
          >
            Build your knowledge on certain foundations. Like a house built on solid ground,
            your faith will never crumble when you understand these pillars.
          </motion.p>
        </div>

        {/* Overall Progress Card */}
        {overallProgress.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Your Progress</h3>
                    <p className="text-sm text-slate-500">{overallProgress.passed} of {overallProgress.total} lessons completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-amber-600">{overallPercent}%</span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPercent}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* 6 Pillars Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {pillars.map((pillar, index) => {
            const colors = pillarColors[pillar.slug] || pillarColors['allah'];
            const progress = getPillarProgress(pillar.id);
            const percent = progress.total > 0 ? Math.round((progress.passed / progress.total) * 100) : 0;
            const isComplete = progress.total > 0 && progress.passed === progress.total;
            const hasContent = progress.total > 0;

            return (
              <motion.button
                key={pillar.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                onClick={() => handlePillarSelect(pillar)}
                className="group relative"
              >
                <div className={`bg-gradient-to-br ${colors.gradient} rounded-3xl p-5 sm:p-6 text-left transform transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl min-h-[180px] sm:min-h-[220px] flex flex-col relative overflow-hidden`}>

                  {/* Decorative pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <div className="w-full h-full bg-white rounded-full transform translate-x-16 -translate-y-16" />
                  </div>

                  {/* Progress indicator */}
                  <div className="absolute top-4 right-4">
                    {isComplete ? (
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                    ) : hasContent ? (
                      <div className="relative w-10 h-10">
                        <svg className="w-10 h-10 -rotate-90">
                          <circle cx="20" cy="20" r="16" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          <circle cx="20" cy="20" r="16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${percent * 1.005} 100.5`} />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                          {percent}%
                        </span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-white/20 rounded-full">
                        <span className="text-white/80 text-xs">New</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <span className="text-3xl sm:text-4xl mb-3 block">{pillarIcons[pillar.slug]}</span>
                    <h3 className="text-white font-bold text-lg sm:text-xl mb-1">{pillar.name}</h3>
                    <p className="text-white/70 text-sm">{pillar.arabic_name}</p>
                  </div>

                  {/* Bottom info */}
                  <div className="mt-4 flex items-center justify-between">
                    {hasContent ? (
                      <span className="text-white/80 text-sm">{progress.passed}/{progress.total} lessons</span>
                    ) : (
                      <span className="text-white/60 text-sm">Get started</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Progress bar */}
                  {hasContent && (
                    <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
