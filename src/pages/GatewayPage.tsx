import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  BookOpen,
  Users,
  GraduationCap,
  LogIn,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface JourneyPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  gradient: string;
  hoverGradient: string;
}

const journeyPaths: JourneyPath[] = [
  {
    id: 'curious',
    title: "I'm curious about Islam",
    subtitle: 'Explore freely',
    description: 'No signup needed. Discover the truth at your own pace.',
    icon: <Search className="w-8 h-8" />,
    route: '/explore',
    gradient: 'from-amber-500/20 to-orange-500/20',
    hoverGradient: 'from-amber-500/30 to-orange-500/30',
  },
  {
    id: 'new-muslim',
    title: "I'm new to Islam",
    subtitle: 'Begin your journey',
    description: 'For those who have recently embraced Islam or are ready to take the step.',
    icon: <Sparkles className="w-8 h-8" />,
    route: '/new-muslim-landing',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    hoverGradient: 'from-emerald-500/30 to-teal-500/30',
  },
  {
    id: 'student',
    title: "I'm a Student of Islam",
    subtitle: 'Deepen your knowledge',
    description: 'Learn Quran, Arabic, and Islamic sciences with expert teachers.',
    icon: <BookOpen className="w-8 h-8" />,
    route: '/home',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    hoverGradient: 'from-blue-500/30 to-indigo-500/30',
  },
  {
    id: 'parent',
    title: "I'm a Parent",
    subtitle: 'Guide your family',
    description: 'Manage your children\'s Islamic education journey.',
    icon: <Users className="w-8 h-8" />,
    route: '/home?role=parent',
    gradient: 'from-purple-500/20 to-pink-500/20',
    hoverGradient: 'from-purple-500/30 to-pink-500/30',
  },
  {
    id: 'teacher',
    title: 'I want to Teach',
    subtitle: 'Share your knowledge',
    description: 'Join our community of qualified teachers and inspire others.',
    icon: <GraduationCap className="w-8 h-8" />,
    route: '/home?role=teacher',
    gradient: 'from-rose-500/20 to-red-500/20',
    hoverGradient: 'from-rose-500/30 to-red-500/30',
  },
];

export default function GatewayPage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  const handlePathClick = (path: JourneyPath) => {
    navigate(path.route);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInForm.email,
        password: signInForm.password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setSignInError(err.message || 'Sign in failed');
    } finally {
      setSignInLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">ت</span>
            </div>
            <span className="text-2xl font-bold text-white">Talbiyah.ai</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Where are you on your journey?
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Choose your path and we'll guide you to the right experience
          </p>
        </motion.div>

        {/* Journey cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full mb-8"
        >
          {journeyPaths.slice(0, 4).map((path, index) => (
            <motion.button
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              onClick={() => handlePathClick(path)}
              onMouseEnter={() => setHoveredCard(path.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`
                relative p-6 rounded-2xl border border-slate-700/50
                bg-gradient-to-br ${hoveredCard === path.id ? path.hoverGradient : path.gradient}
                backdrop-blur-sm transition-all duration-300
                hover:border-slate-600/50 hover:scale-[1.02]
                text-left group
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  p-3 rounded-xl bg-slate-800/50 text-white
                  group-hover:scale-110 transition-transform duration-300
                `}>
                  {path.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {path.title}
                  </h3>
                  <p className="text-emerald-400 text-sm mb-2">{path.subtitle}</p>
                  <p className="text-slate-400 text-sm">{path.description}</p>
                </div>
                <ArrowRight className={`
                  w-5 h-5 text-slate-500 mt-1
                  group-hover:text-white group-hover:translate-x-1
                  transition-all duration-300
                `} />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Teacher option - full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="max-w-4xl w-full mb-12"
        >
          <button
            onClick={() => handlePathClick(journeyPaths[4])}
            onMouseEnter={() => setHoveredCard('teacher')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              w-full p-6 rounded-2xl border border-slate-700/50
              bg-gradient-to-r ${hoveredCard === 'teacher' ? journeyPaths[4].hoverGradient : journeyPaths[4].gradient}
              backdrop-blur-sm transition-all duration-300
              hover:border-slate-600/50 hover:scale-[1.01]
              text-left group
            `}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-slate-800/50 text-white group-hover:scale-110 transition-transform duration-300">
                {journeyPaths[4].icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {journeyPaths[4].title}
                </h3>
                <p className="text-slate-400 text-sm">{journeyPaths[4].description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </button>
        </motion.div>

        {/* Sign in section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          {!showSignIn ? (
            <button
              onClick={() => setShowSignIn(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mx-auto"
            >
              <LogIn className="w-5 h-5" />
              <span>Already have an account? Sign in</span>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 max-w-sm w-full mx-auto border border-slate-700/50"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Welcome back</h3>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
                {signInError && (
                  <p className="text-red-400 text-sm">{signInError}</p>
                )}
                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {signInLoading ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignIn(false)}
                  className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Back to journey selection
                </button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Talbiyah.ai • Your Path to Islamic Knowledge</p>
      </footer>
    </div>
  );
}
