import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Scale } from 'lucide-react';

interface BiasBlurProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const BiasBlur = ({ onComplete, onBack }: BiasBlurProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-20 md:top-4 left-6 flex items-center gap-1 text-slate-400 hover:text-white transition z-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

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
            <p className="text-slate-300 leading-relaxed mb-4">
              I was brought up with <span className="text-white font-medium">Christian values</span>. I went to Saturday school, Sunday school, and was part of the <span className="text-white font-medium">70th London Boys' Brigade</span> in Tooting, London. I learned a lot of good manners, respect, and values.
            </p>
            <p className="text-slate-300 leading-relaxed mb-4">
              At the age of <span className="text-white font-medium">23</span>, I was told that I actually held certain beliefs that were in line with Islam — and went against my own religion. This prompted me to research both.
            </p>
            <p className="text-slate-300 leading-relaxed">
              I decided: <span className="text-white font-medium">"I'm an adult now. Surely I can work out for myself if Christianity is true, if Islam is true, or if religion is man-made after all."</span>
            </p>
          </div>

          <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
            <p className="text-amber-300 leading-relaxed text-center">
              I took on the challenge. I didn't know how or what method I was going to use — but I got there in the end. When you keep probing, you will find evidence. <span className="text-white font-medium">Truth stands up in the face of falsehood</span>, because that's the nature of falsehood — it perishes when hurled at truth.
            </p>
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
