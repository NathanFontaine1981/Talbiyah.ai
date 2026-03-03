import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  BookOpen,
  History,
  Star,
  Scale,
  Languages,
  Sparkles,
  ArrowRight,
  Play,
  Heart,
  RefreshCw,
  Compass,
  ArrowLeft,
  Gift,
  Footprints,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TalbiyahLogo from '../components/TalbiyahLogo';

// Foundation pillars for preview
const foundationPillars = [
  { name: 'Tawheed', arabicName: 'التوحيد', icon: Sun, color: 'from-amber-500 to-orange-600', description: 'Know your Creator' },
  { name: 'How to Pray', arabicName: 'كيفية الصلاة', icon: Moon, color: 'from-emerald-500 to-teal-600', description: 'Connect with Allah' },
  { name: 'Comparative Religion', arabicName: 'مقارنة الأديان', icon: BookOpen, color: 'from-blue-500 to-indigo-600', description: 'Understanding context' },
  { name: 'History of Islam', arabicName: 'تاريخ الإسلام', icon: History, color: 'from-purple-500 to-violet-600', description: 'Prophets & companions' },
  { name: 'Names of Allah', arabicName: 'أسماء الله الحسنى', icon: Star, color: 'from-yellow-500 to-amber-600', description: '99 beautiful names' },
  { name: 'Fiqh Basics', arabicName: 'أساسيات الفقه', icon: Scale, color: 'from-rose-500 to-pink-600', description: 'Essential rulings' },
];

export default function NewMuslimLanding() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  const handleBeginFoundations = () => {
    if (user) {
      navigate('/new-muslim');
    } else {
      navigate('/signup?role=revert');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <TalbiyahLogo size="sm" dark linkTo="/" />
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </nav>

      {/* Hero Section - Darkness to Light */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Tunnel effect background */}
        <div className="absolute inset-0">
          {/* Deep darkness outer layer */}
          <div className="absolute inset-0 bg-black" />

          {/* Concentric gradient rings creating tunnel effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[200%] h-[200%] absolute">
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black" />
            </div>

            {/* Light at the center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 40%, transparent 70%)',
              }}
            />

            {/* Pulsing glow */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute w-[300px] h-[300px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 70%)',
              }}
            />
          </div>

          {/* Perspective lines suggesting tunnel */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                className="absolute w-[1px] bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent"
                style={{
                  height: '150%',
                  transform: `rotate(${i * 45}deg)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">From Darkness to Light</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Allah has brought you
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              out of darkness into light
            </span>
          </motion.h1>

          {/* Arabic verse */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-2xl md:text-3xl font-arabic text-slate-400 mb-4"
            dir="rtl"
          >
            يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-slate-500 text-sm mb-8"
          >
            — Surah Al-Baqarah (2:257)
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            onClick={handleBeginFoundations}
            className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            <span className="flex items-center gap-2">
              Begin Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2"
            >
              <motion.div className="w-1 h-2 bg-slate-500 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Video Section Placeholder */}
      <section className="py-24 px-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Personal Welcome</h2>
            <p className="text-slate-400 text-lg">A message just for you</p>
          </motion.div>

          {/* Video placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 transition-colors">
                  <Play className="w-8 h-8 text-emerald-400 ml-1" />
                </div>
                <p className="text-slate-500">Video coming soon</p>
              </div>
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Newborn Baby Analogy Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Heart icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-8 border border-rose-500/20"
            >
              <Heart className="w-10 h-10 text-rose-400" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Like a <span className="text-rose-400">Newborn Baby</span>
            </h2>

            <div className="space-y-6 text-lg text-slate-300 max-w-2xl mx-auto">
              <p>
                When you entered Islam, something miraculous happened.
              </p>
              <p className="text-xl font-medium text-white">
                Every sin you ever committed has been erased.
              </p>
              <p>
                You come to Allah with a clean slate, pure and free from burden —
                just like a newborn baby entering this world.
              </p>
            </div>

            {/* Hadith reference */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 max-w-2xl mx-auto"
            >
              <p className="text-slate-400 italic">
                "Islam wipes out whatever sins came before it."
              </p>
              <p className="text-slate-500 text-sm mt-2">— Prophet Muhammad ﷺ (Sahih Muslim)</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Your Welcome Pack Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-8 border border-amber-500/20"
            >
              <Gift className="w-10 h-10 text-amber-400" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Your <span className="text-amber-400">Welcome Pack</span>
            </h2>

            <div className="space-y-6 text-lg text-slate-300 max-w-2xl mx-auto">
              <p>
                You are part of a family now. The Muslim community — your community —
                is here to support you every step of the way.
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-xl font-medium text-white"
              >
                Come to the masjid to receive your welcome pack.
              </motion.p>
              <p>
                We've prepared practical essentials to help you begin your journey —
                a prayer mat, a beginner's guide, and key contacts for ongoing support.
              </p>
            </div>

            {/* Welcome items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto"
            >
              {[
                { label: 'Prayer Mat & Essentials', desc: 'Everything you need to establish your prayer' },
                { label: "Beginner's Guide", desc: 'A clear, simple roadmap for your first steps' },
                { label: 'Community Contacts', desc: 'People who are here to help whenever you need' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20"
                >
                  <p className="font-medium text-amber-300 text-sm mb-1">{item.label}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Fresh Start - Sins Transformed Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-slate-950 to-black">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Refresh icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-8 border border-emerald-500/20"
            >
              <RefreshCw className="w-10 h-10 text-emerald-400" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Not Just Forgiven — <span className="text-emerald-400">Transformed</span>
            </h2>

            <div className="space-y-6 text-lg text-slate-300 max-w-2xl mx-auto">
              <p>
                Allah's mercy goes even further. The sincere repentance that brought you to Islam
                doesn't just erase your sins...
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400"
              >
                It transforms them into good deeds.
              </motion.p>
            </div>

            {/* Quran verse */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 max-w-2xl mx-auto"
            >
              <p className="text-2xl font-arabic text-emerald-300 mb-4" dir="rtl">
                فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ
              </p>
              <p className="text-slate-300 italic">
                "...for those, Allah will replace their evil deeds with good."
              </p>
              <p className="text-slate-500 text-sm mt-2">— Surah Al-Furqan (25:70)</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* The Journey Ahead Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black via-indigo-950/30 to-black">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Footprints icon */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-8 border border-blue-500/20"
            >
              <Footprints className="w-10 h-10 text-blue-400" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The <span className="text-blue-400">Journey Ahead</span>
            </h2>

            <div className="space-y-6 text-lg text-slate-300 max-w-2xl mx-auto">
              <p>
                Your next step should be the <span className="text-white font-medium">Unshakable Foundations</span> journey —
                a structured path covering everything a new Muslim needs to know.
              </p>
              <p>
                Take your time. Baby steps, at the pace you are comfortable with.
                There is no rush, no pressure.
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-xl font-medium text-white"
              >
                But never remain idle — even at 1 mph, keep moving forward.
              </motion.p>
              <p>
                Learning something new every day builds over time. Being idle is actually
                going backwards, because we forget what we don't revisit.
              </p>
            </div>

            {/* Stepping stones visual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 flex items-center justify-center gap-3 max-w-md mx-auto"
            >
              {[0.3, 0.45, 0.6, 0.75, 0.9, 1].map((opacity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center"
                  style={{ opacity }}
                >
                  <div className="w-3 h-3 rounded-full bg-blue-400" style={{ opacity }} />
                </motion.div>
              ))}
              <ArrowRight className="w-5 h-5 text-blue-400 ml-1" />
            </motion.div>

            {/* Prayer - the lifeline */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-12 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 max-w-2xl mx-auto"
            >
              <p className="text-lg text-emerald-300 font-medium mb-2">
                Establish the prayer — your lifeline with your Creator.
              </p>
              <p className="text-slate-400">
                Salah is the direct connection between you and Allah. It is the first thing
                to establish and the foundation upon which everything else is built.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Foundations Framework Preview */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Build Your <span className="text-emerald-400">Unshakeable Foundations</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A structured framework covering the essential knowledge every Muslim needs.
              Master these, and everything else becomes clearer.
            </p>
          </motion.div>

          {/* Foundation pillars grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {foundationPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{pillar.name}</h3>
                  <p className="text-slate-500 text-sm">{pillar.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button
              onClick={handleBeginFoundations}
              className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <span className="flex items-center gap-2">
                Build Your Foundations
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <p className="text-slate-500 text-sm mt-4">Free to start • No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-slate-950 to-black">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Your Journey Begins Now
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Allah guided you to Islam for a reason. Don't let the vastness of knowledge
              overwhelm you. Start with the foundations, and the rest will follow.
            </p>
            <button
              onClick={handleBeginFoundations}
              className="group px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <span className="flex items-center gap-2">
                Begin Unshakable Foundations
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <p className="text-slate-500 text-sm mt-4">
              Establish your prayer connection while you build your knowledge.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Talbiyah.ai • Your Path to Islamic Knowledge
          </p>
        </div>
      </footer>
    </div>
  );
}
