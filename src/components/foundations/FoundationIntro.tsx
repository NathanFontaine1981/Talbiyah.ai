import { motion } from 'framer-motion';
import { BookOpen, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';

interface FoundationIntroProps {
  onComplete: () => void;
}

export default function FoundationIntro({ onComplete }: FoundationIntroProps) {
  const features = [
    {
      icon: BookOpen,
      title: 'Curated Knowledge',
      description: 'Carefully selected videos from trusted scholars and teachers'
    },
    {
      icon: Shield,
      title: 'Test Your Understanding',
      description: 'Pass exams to prove your knowledge of each topic'
    },
    {
      icon: Star,
      title: 'Track Your Progress',
      description: 'See your completion status across all categories'
    }
  ];

  const categories = [
    'Tawheed - Know Your Creator',
    'How to Pray - Connect 5 Times Daily',
    'Comparative Religion',
    'History of Islam',
    '99 Names of Allah',
    'Fiqh Basics',
    'Arabic Foundations'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Unshakable Foundations
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Build your Islamic knowledge on solid ground. Free, comprehensive learning
            curated by Nathan to help you understand the essentials of your faith.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-4">
                <feature.icon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* What You'll Learn */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You'll Learn
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-700">{category}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Important Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12"
        >
          <h3 className="font-semibold text-amber-800 mb-2">Why This Matters</h3>
          <p className="text-amber-700 text-sm leading-relaxed">
            These foundations are essential for every Muslim. Without understanding Tawheed
            (who Allah is), you cannot properly worship Him. Without knowing how to pray,
            you miss the most important daily connection with your Creator. Start here,
            build strong, and your entire faith will be unshakable.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={onComplete}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold text-lg shadow-lg transition transform hover:scale-105"
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-gray-500 text-sm mt-4">
            100% Free - No payment required
          </p>
        </motion.div>
      </div>
    </div>
  );
}
