import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Search,
  Lightbulb,
  Mail,
} from 'lucide-react';
import { HELP_CATEGORIES, QUICK_START_GUIDES, HelpGuide, HelpCategory } from '../data/helpGuides';

type ViewMode = 'categories' | 'guide';

export default function HowToPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedGuide, setSelectedGuide] = useState<{ guide: HelpGuide; category: HelpCategory } | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const openGuide = (guide: HelpGuide, category: HelpCategory) => {
    setSelectedGuide({ guide, category });
    setViewMode('guide');
  };

  const closeGuide = () => {
    setSelectedGuide(null);
    setViewMode('categories');
  };

  // Filter guides based on search
  const filteredCategories = searchQuery
    ? HELP_CATEGORIES.map(category => ({
        ...category,
        guides: category.guides.filter(
          guide =>
            guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            guide.steps.some(step =>
              step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              step.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
        ),
      })).filter(category => category.guides.length > 0)
    : HELP_CATEGORIES;

  // Count total guides
  const totalGuides = HELP_CATEGORIES.reduce((acc, cat) => acc + cat.guides.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-blue-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          {viewMode === 'categories' ? (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Back to Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Dashboard
                </button>
              </motion.div>

              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-200/40 mb-6 ring-4 ring-white"
                >
                  <Lightbulb className="w-10 h-10 text-white" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3"
                >
                  Help Center
                </motion.p>

                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                  How To Use Talbiyah.ai
                </h1>

                <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                  Find guides and tutorials for every feature. Learn how to get the most out of your Islamic learning journey.
                </p>

                {/* Search Bar */}
                <div className="max-w-md mx-auto relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search guides..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-700"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <p className="text-gray-400 text-sm mt-3">
                  {totalGuides} guides across {HELP_CATEGORIES.length} categories
                </p>
              </motion.div>

              {/* Quick Start Guide */}
              {!searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8"
                >
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🚀</span>
                    Quick Start
                  </h2>
                  <p className="text-slate-500 text-sm mb-6">
                    New to Talbiyah.ai? Follow these 3 steps to get started.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    {QUICK_START_GUIDES.map((item, index) => (
                      <motion.button
                        key={item.step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        onClick={() => navigate(item.path)}
                        className="bg-slate-50 hover:bg-slate-100 rounded-xl p-4 text-left transition-all group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                            {item.step}
                          </div>
                          <span className="text-2xl">{item.icon}</span>
                        </div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">{item.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Category Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 mb-12"
              >
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No guides found</h3>
                    <p className="text-gray-500">
                      Try a different search term or{' '}
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-emerald-600 hover:underline"
                      >
                        browse all categories
                      </button>
                    </p>
                  </div>
                ) : (
                  filteredCategories.map((category, categoryIndex) => {
                    const isExpanded = expandedCategories.includes(category.id) || searchQuery.length > 0;

                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * categoryIndex }}
                        className={`rounded-2xl border overflow-hidden transition-all ${category.bgColor} ${category.borderColor}`}
                      >
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/30 transition-colors"
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${category.iconBg}`}>
                            {category.icon}
                          </div>

                          <div className="flex-1">
                            <h3 className={`font-bold text-lg ${category.color}`}>
                              {category.name}
                            </h3>
                            <p className="text-gray-600 text-sm">{category.description}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              {category.guides.length} guide{category.guides.length !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className={`w-5 h-5 ${category.color}`} />
                          </div>
                        </button>

                        {/* Expanded Guides */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4">
                                <div className="bg-white/70 rounded-xl p-3 space-y-2">
                                  {category.guides.map(guide => (
                                    <button
                                      key={guide.id}
                                      onClick={() => openGuide(guide, category)}
                                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
                                    >
                                      <ChevronRight className={`w-4 h-4 ${category.color} flex-shrink-0`} />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 text-sm">{guide.title}</p>
                                        <p className="text-gray-500 text-xs truncate">{guide.description}</p>
                                      </div>
                                      <span className="text-gray-400 text-xs flex-shrink-0">
                                        {guide.steps.length} steps
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>

              {/* Still Need Help */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-center text-white"
              >
                <h2 className="text-2xl font-bold mb-3">Still Need Help?</h2>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Can't find what you're looking for? Our support team is here to help you.
                </p>
                <a
                  href="mailto:support@talbiyah.ai"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Contact Support
                </a>
              </motion.div>
            </motion.div>
          ) : (
            /* Guide Detail View */
            <motion.div
              key="guide"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {selectedGuide && (
                <>
                  {/* Back Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                  >
                    <button
                      onClick={closeGuide}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back to Help Center
                    </button>
                  </motion.div>

                  {/* Guide Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 mb-6 ${selectedGuide.category.bgColor} border ${selectedGuide.category.borderColor}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${selectedGuide.category.iconBg} flex-shrink-0`}>
                        {selectedGuide.category.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${selectedGuide.category.color} mb-1`}>
                          {selectedGuide.category.name}
                        </p>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                          {selectedGuide.guide.title}
                        </h1>
                        <p className="text-gray-600">
                          {selectedGuide.guide.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Steps */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4 mb-8"
                  >
                    {selectedGuide.guide.steps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${selectedGuide.category.gradient}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-2">
                              {step.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {step.content}
                            </p>
                            {step.tip && (
                              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-amber-800 text-sm">
                                  <span className="font-semibold">Tip:</span> {step.tip}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Related Page Link */}
                  {selectedGuide.guide.relatedPage && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center mb-8"
                    >
                      <button
                        onClick={() => navigate(selectedGuide.guide.relatedPage!)}
                        className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${selectedGuide.category.gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
                      >
                        Go to {selectedGuide.guide.title.split(' ').slice(0, 3).join(' ')}
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}

                  {/* Other Guides in Category */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6"
                  >
                    <h3 className="font-semibold text-gray-800 mb-4">
                      More in {selectedGuide.category.name}
                    </h3>
                    <div className="space-y-2">
                      {selectedGuide.category.guides
                        .filter(g => g.id !== selectedGuide.guide.id)
                        .map(guide => (
                          <button
                            key={guide.id}
                            onClick={() => openGuide(guide, selectedGuide.category)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                          >
                            <ChevronRight className={`w-4 h-4 ${selectedGuide.category.color}`} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-700 text-sm">{guide.title}</p>
                            </div>
                            <span className="text-gray-400 text-xs">
                              {guide.steps.length} steps
                            </span>
                          </button>
                        ))}
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
