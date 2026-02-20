import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft, CheckCircle, Play, Trophy, GraduationCap } from 'lucide-react';

interface FoundationIntroProps {
  onComplete: () => void;
}

// Mini pillar preview data
const pillars = [
  { name: 'Tawheed', color: 'from-emerald-500 to-emerald-700', topBar: 'bg-emerald-400' },
  { name: 'How to Pray', color: 'from-teal-500 to-teal-700', topBar: 'bg-teal-400' },
  { name: 'Comparative', color: 'from-blue-500 to-blue-700', topBar: 'bg-blue-400' },
  { name: 'History', color: 'from-purple-500 to-purple-700', topBar: 'bg-purple-400' },
  { name: '99 Names', color: 'from-amber-500 to-amber-700', topBar: 'bg-amber-400' },
  { name: 'Fiqh Basics', color: 'from-rose-500 to-rose-700', topBar: 'bg-rose-400' },
];

export default function FoundationIntro({ onComplete }: FoundationIntroProps) {
  const navigate = useNavigate();
  const features = [
    {
      icon: Play,
      title: 'Video Lessons',
      description: 'Learn from trusted scholars and teachers'
    },
    {
      icon: GraduationCap,
      title: 'Knowledge Tests',
      description: 'Prove understanding with quizzes after each lesson'
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'See completion percentage for each pillar'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-amber-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 relative">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </motion.button>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-200/40 mb-6 ring-4 ring-white"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4"
          >
            For new Muslims &amp; those building foundations
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Unshakeable Foundations
          </h1>

          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed mb-2">
            Welcome home. You've taken the biggest step &mdash; now let us walk with you.
          </p>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Hand-picked videos from trusted scholars covering everything a new Muslim needs &mdash;
            from who Allah is, to how to pray, all in one place.
          </p>
        </motion.div>

        {/* Mini Pillar Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-14"
        >
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="relative"
              >
                <div className={`bg-gradient-to-b ${pillar.color} rounded-xl p-3 text-center min-h-[80px] flex flex-col justify-center relative`}>
                  {/* 3D top bar effect */}
                  <div
                    className={`absolute -top-1.5 left-1.5 right-1.5 h-2.5 ${pillar.topBar} rounded-t-lg`}
                    style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}
                  />
                  <span className="text-white text-xs font-medium relative z-10">{pillar.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-slate-400 text-sm mt-3">6 pillars of knowledge to master</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-4 mb-14"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl mb-4">
                <feature.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-14"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            How It Works
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                1
              </div>
              <h3 className="font-medium text-slate-800 mb-1">Watch Videos</h3>
              <p className="text-sm text-slate-500">Curated lessons from trusted scholars</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                2
              </div>
              <h3 className="font-medium text-slate-800 mb-1">Take the Quiz</h3>
              <p className="text-sm text-slate-500">Test your understanding (70% to pass)</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                3
              </div>
              <h3 className="font-medium text-slate-800 mb-1">Track Progress</h3>
              <p className="text-sm text-slate-500">Complete all pillars for certification</p>
            </div>
          </div>
        </motion.div>

        {/* Why This Matters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-14"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-2">Why Start Here?</h3>
              <p className="text-emerald-700 text-sm leading-relaxed">
                As a new Muslim, you're like a newborn &mdash; everything is fresh and exciting, but you need direction.
                This course gives you exactly that: who Allah is, how to pray, and the essentials of your faith,
                all hand-picked so you don't have to search the internet alone.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full font-semibold text-lg shadow-xl shadow-emerald-200/40 transition-all hover:scale-[1.02] hover:-translate-y-0.5"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-slate-400 text-sm mt-4">
            100% Free • No payment required
          </p>

          {/* Upgrade hint */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-slate-400 text-sm mb-2">Once you're ready for live lessons, Quran reading, and daily practice tools:</p>
            <button
              onClick={() => navigate('/compare-plans')}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium underline underline-offset-2 transition"
            >
              See what the full Student experience includes
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
