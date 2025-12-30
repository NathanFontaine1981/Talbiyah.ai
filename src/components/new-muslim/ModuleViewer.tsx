import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Play,
  Pause,
} from 'lucide-react';
import { CurriculumModule, curriculumModules, getNextModule, getPreviousModule } from '../../data/curriculumData';
import CurriculumProgressBar from './CurriculumProgressBar';

interface ModuleViewerProps {
  module: CurriculumModule;
  completedModules: string[];
  onComplete: (moduleId: string) => void;
  onBack: () => void;
  onNavigate: (module: CurriculumModule) => void;
  isCompleted: boolean;
}

export const ModuleViewer = ({
  module,
  completedModules,
  onComplete,
  onBack,
  onNavigate,
  isCompleted,
}: ModuleViewerProps) => {
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  const nextModule = getNextModule(module.id);
  const prevModule = getPreviousModule(module.id);

  const handleMarkComplete = () => {
    onComplete(module.id);
  };

  const handleNext = () => {
    if (nextModule) {
      onNavigate(nextModule);
    }
  };

  const handlePrevious = () => {
    if (prevModule) {
      onNavigate(prevModule);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    >
      {/* Progress Bar */}
      <CurriculumProgressBar
        currentModule={module}
        completedModules={completedModules}
        onModuleClick={onNavigate}
        onBackToDashboard={onBack}
      />

      {/* Content - with padding for fixed progress bar */}
      <div className="max-w-4xl mx-auto px-4 py-8 pt-20 md:pt-16">
        {/* Title section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="text-emerald-400 text-sm font-medium mb-2 block">
            {module.subtitle}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-white mb-4">
            {module.title}
          </h1>
          <p className="text-xl text-slate-300">
            {module.description}
          </p>
        </motion.div>

        {/* Video placeholder */}
        {module.videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="aspect-video bg-slate-800 rounded-2xl mb-8 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <p className="text-slate-400">Video coming soon</p>
            </div>
          </motion.div>
        )}

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 rounded-2xl p-6 sm:p-8 border border-slate-800 mb-8"
        >
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="text-slate-200 leading-relaxed space-y-4">
              {module.content.trim().split('\n\n').map((paragraph, index) => {
                // Handle headers
                if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
                  const title = paragraph.trim().replace(/\*\*/g, '');
                  return (
                    <h3 key={index} className="text-xl font-semibold text-white mt-8 mb-4">
                      {title}
                    </h3>
                  );
                }

                // Handle bullet points
                if (paragraph.includes('- **')) {
                  const items = paragraph.split('\n').filter(line => line.trim().startsWith('-'));
                  return (
                    <ul key={index} className="space-y-2 my-4">
                      {items.map((item, i) => {
                        const text = item.replace(/^-\s*/, '');
                        // Parse bold text
                        const parts = text.split(/\*\*([^*]+)\*\*/);
                        return (
                          <li key={i} className="flex items-start gap-2 text-slate-300">
                            <span className="text-emerald-400 mt-1">•</span>
                            <span>
                              {parts.map((part, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j} className="text-white">{part}</strong>
                                ) : (
                                  part
                                )
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                // Regular paragraphs with bold text
                const parts = paragraph.split(/\*\*([^*]+)\*\*/);
                return (
                  <p key={index} className="text-slate-300 leading-relaxed">
                    {parts.map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="text-white">{part}</strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Key points summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-emerald-900/20 rounded-2xl p-6 border border-emerald-800/50 mb-8"
        >
          <button
            onClick={() => setShowKeyPoints(!showKeyPoints)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Key Takeaways
            </h3>
            <ArrowRight className={`w-5 h-5 text-emerald-400 transition-transform ${showKeyPoints ? 'rotate-90' : ''}`} />
          </button>

          {showKeyPoints && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-3"
            >
              {module.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </motion.ul>
          )}
        </motion.div>

        {/* Completion section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          {isCompleted ? (
            <div className="bg-emerald-900/30 rounded-xl p-6 border border-emerald-700/50">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-emerald-200 text-lg font-medium">
                Chapter Completed
              </p>
              <p className="text-slate-400 text-sm mt-1">
                You've finished this chapter
              </p>
            </div>
          ) : (
            <button
              onClick={handleMarkComplete}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark as Complete
            </button>
          )}
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-between"
        >
          {prevModule ? (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition group"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition" />
              <div className="text-left">
                <p className="text-slate-400 text-xs">Previous</p>
                <p className="text-white font-medium">{prevModule.title}</p>
              </div>
            </button>
          ) : (
            <div />
          )}

          {nextModule ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition group"
            >
              <div className="text-right">
                <p className="text-slate-400 text-xs">Next</p>
                <p className="text-white font-medium">{nextModule.title}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition" />
            </button>
          ) : (
            <button
              onClick={onBack}
              className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition"
            >
              <div className="text-right">
                <p className="text-emerald-200 text-xs">Journey Complete</p>
                <p className="text-white font-medium">Back to Dashboard</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-white" />
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ModuleViewer;
