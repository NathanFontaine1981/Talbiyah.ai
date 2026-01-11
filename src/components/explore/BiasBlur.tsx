import { motion } from 'framer-motion';
import { ArrowRight, Scale, Gavel } from 'lucide-react';

interface BiasBlurProps {
  onComplete: () => void;
}

export const BiasBlur = ({ onComplete }: BiasBlurProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
    >
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-serif text-white mb-2">
            Before We Begin
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-600">
            <p className="text-slate-300 leading-relaxed">
              I came to realise there is actually <span className="text-white font-medium">only one book in the world</span> that claims to be our Creator communicating with us directly. That makes things simple.
            </p>
          </div>

          <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
            <div className="flex items-center justify-center gap-2">
              <Gavel className="w-5 h-5 text-amber-400" />
              <p className="text-amber-300 font-medium">Let's see what's in this book.</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={onComplete}
            className="w-full px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
          >
            Present the Evidence
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BiasBlur;
