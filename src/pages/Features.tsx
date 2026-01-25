import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, BookOpen, Video, Gamepad2, Languages, GraduationCap,
  Trophy, Users, Briefcase, Heart, ChevronRight, ArrowRight, CheckCircle2,
  Brain, Lightbulb, FileText, Mic, Star, Play, Pause, RotateCcw,
  Clock, Calendar, Shield, Award, Zap, Target, TrendingUp,
  MessageCircle, Download, Eye, Lock, Unlock, ChevronDown, Menu, X
} from 'lucide-react';

// Feature category definitions
const featureCategories = [
  { id: 'ai', name: 'AI-Powered', icon: Sparkles, color: 'purple' },
  { id: 'quran', name: 'Quran Learning', icon: BookOpen, color: 'emerald' },
  { id: 'explore', name: 'Exploring Islam', icon: Eye, color: 'teal' },
  { id: 'foundations', name: 'Foundations', icon: GraduationCap, color: 'amber' },
  { id: 'lessons', name: 'Live Lessons', icon: Video, color: 'emerald' },
  { id: 'games', name: 'Learning Games', icon: Gamepad2, color: 'pink' },
  { id: 'arabic', name: 'Arabic', icon: Languages, color: 'blue' },
  { id: 'gamification', name: 'Gamification', icon: Trophy, color: 'orange' },
  { id: 'parents', name: 'For Parents', icon: Users, color: 'rose' },
  { id: 'teachers', name: 'For Teachers', icon: Briefcase, color: 'slate' },
  { id: 'referral', name: 'Referrals', icon: Heart, color: 'emerald' },
];

export default function Features() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('ai');
  const [showStickyNav, setShowStickyNav] = useState(true); // Always show sticky nav
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle scroll for section tracking (sticky nav always visible)
  useEffect(() => {
    const handleScroll = () => {
      // Track active section
      const scrollPosition = window.scrollY + 200;
      for (const category of featureCategories) {
        const section = sectionRefs.current[category.id];
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(category.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const section = sectionRefs.current[id];
    if (section) {
      const offset = 140; // Account for main nav (64px) + sticky nav (~48px) + padding
      const top = section.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const toggleFlipCard = (cardId: string) => {
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Talbiyah.ai" className="h-8 w-auto" />
              <span className="font-serif text-xl font-semibold text-gray-900 dark:text-white">Talbiyah.ai</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">Home</Link>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Features</span>
              <Link to="/explore" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">Exploring Islam</Link>
              <Link to="/teachers" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">Teachers</Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link to="/signup" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">Sign In</Link>
              <Link
                to="/signup"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition shadow-lg shadow-emerald-500/25"
              >
                Start Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 px-4">
            <div className="space-y-3">
              <Link to="/" className="block text-gray-600 dark:text-gray-300">Home</Link>
              <span className="block text-emerald-600 dark:text-emerald-400 font-semibold">Features</span>
              <Link to="/explore" className="block text-gray-600 dark:text-gray-300">Exploring Islam</Link>
              <Link to="/teachers" className="block text-gray-600 dark:text-gray-300">Teachers</Link>
              <Link to="/signup" className="block text-gray-600 dark:text-gray-300">Sign In</Link>
              <Link
                to="/signup"
                className="block w-full text-center px-6 py-2.5 bg-emerald-500 text-white rounded-full font-medium"
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Sticky Feature Navigation - Always visible */}
      <div className="fixed top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 min-w-max">
            {featureCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center space-x-2 ${
                  activeSection === cat.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-purple-50/30 dark:from-gray-900 dark:via-emerald-900/10 dark:to-purple-900/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>40+ Features for Serious Islamic Learners</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-normal text-gray-900 dark:text-white mb-6">
            Everything You Need to<br />
            <span className="text-emerald-600 dark:text-emerald-400">Master Your Deen</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
            From AI-powered insights to live teacher sessions, Quran tracking to interactive games —
            discover why thousands choose Talbiyah.ai for their Islamic education journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('ai')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center space-x-2"
            >
              <span>Explore Features</span>
              <ChevronDown className="w-5 h-5" />
            </button>
            <Link
              to="/signup"
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-full text-lg font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center space-x-2"
            >
              <span>Start Free Today</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Animated Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <AnimatedStat value={114} label="Surahs Tracked" />
            <AnimatedStat value={6236} label="Ayahs" suffix="+" />
            <AnimatedStat value={40} label="Features" suffix="+" />
          </div>
        </div>
      </section>

      {/* Section 1: AI-Powered Features */}
      <section
        ref={(el) => (sectionRefs.current['ai'] = el)}
        id="ai"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Powered by Advanced AI"
            badgeColor="purple"
            title="The Smart-Track Engine That Learns With You"
            subtitle="AI that understands your Islamic learning journey and adapts to your needs"
          />

          {/* AI Insights Demo */}
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-purple-200 dark:border-purple-800">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Talbiyah Insights — Our Flagship AI Feature</h3>
              </div>
              <p className="mt-2 text-purple-100">Every lesson automatically generates personalized study notes</p>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-purple-500" />
                    <span>Your Questions During the Lesson</span>
                  </h4>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center text-sm font-medium text-purple-700 dark:text-purple-300">Q</div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">"Why do we say 'Bismillah' before starting?"</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center text-sm font-medium text-purple-700 dark:text-purple-300">Q</div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">"What's the difference between Fard and Sunnah prayers?"</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span>AI-Generated Key Concepts</span>
                  </h4>
                  <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Bismillah means "In the name of Allah"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Fard = obligatory, Sunnah = recommended</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">5 daily prayers are Fard upon every Muslim</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <Link to="/demo" className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300">
                  <span>See Full Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Other AI Features */}
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Brain}
              title="AI Homework Generation"
              description="Custom quizzes based on your actual lesson content and knowledge gaps"
              color="purple"
            />
            <FeatureCard
              icon={Target}
              title="Knowledge Gap Analysis"
              description="AI identifies exactly what you're missing and targets those areas"
              color="indigo"
            />
            <FeatureCard
              icon={Heart}
              title="Dua Builder"
              description="Generate personalized duas using the 99 Names of Allah"
              color="pink"
              link="/dua-builder"
            />
            <FeatureCard
              icon={Mic}
              title="Khutbah Creator"
              description="Create sermon outlines with authentic Islamic sources"
              color="violet"
              link="/khutba-creator"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Quran Learning */}
      <section
        ref={(el) => (sectionRefs.current['quran'] = el)}
        id="quran"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="114 Surahs • 6,236 Ayahs"
            badgeColor="emerald"
            title="Track Every Verse of Your Quran Journey"
            subtitle="Comprehensive progress tracking that shows exactly where you are"
          />

          {/* 3-Stage System */}
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6">
                <Lightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Understanding</h3>
              <p className="text-gray-600 dark:text-gray-400">First, learn the meaning and context of each ayah. Know what you're reciting.</p>
              <div className="mt-4 h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6">
                <Languages className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Fluency</h3>
              <p className="text-gray-600 dark:text-gray-400">Perfect your pronunciation and tajweed. Read smoothly without hesitation.</p>
              <div className="mt-4 h-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Memorization</h3>
              <p className="text-gray-600 dark:text-gray-400">Finally, commit to memory. Recall perfectly without looking.</p>
              <div className="mt-4 h-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                <div className="h-full w-full bg-amber-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Quran Progress Features */}
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={BookOpen}
              title="Surah-by-Surah Tracking"
              description="Progress bars for all 114 surahs showing your mastery level"
              color="emerald"
            />
            <FeatureCard
              icon={Target}
              title="Ayah-by-Ayah Progress"
              description="Granular tracking down to individual verses"
              color="teal"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Juz Organization"
              description="Track progress across all 30 juz (paras)"
              color="cyan"
            />
          </div>
        </div>
      </section>

      {/* Section 3: Exploring Islam */}
      <section
        ref={(el) => (sectionRefs.current['explore'] = el)}
        id="explore"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Free • 13 Episodes • ~40 minutes"
            badgeColor="teal"
            title="For the Curious Mind"
            subtitle="Evidence-based journey through Islamic concepts — no pressure, just discovery"
          />

          <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-teal-200 dark:border-teal-800">
            <div className="p-8 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
              <h3 className="text-2xl font-semibold mb-2">Your Intellectual Journey Awaits</h3>
              <p className="text-teal-100">Perfect for non-Muslims, those questioning, or anyone wanting to understand Islam through reason and evidence</p>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-4 gap-6">
                <EpisodeCard number={1} title="Axiom Check" description="Establish what we can all agree on" />
                <EpisodeCard number={2} title="Authority Match" description="How do we know what's true?" />
                <EpisodeCard number={3} title="Chain of Custody" description="Verifying historical sources" />
                <EpisodeCard number={4} title="Probability & Evidence" description="Weighing the evidence" />
              </div>
              <div className="mt-8 text-center">
                <Link
                  to="/explore"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-semibold transition shadow-lg"
                >
                  <span>Start Exploring — It's Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Unshakable Foundations */}
      <section
        ref={(el) => (sectionRefs.current['foundations'] = el)}
        id="foundations"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="New Muslim Essentials"
            badgeColor="amber"
            title="Build Knowledge That Cannot Be Shaken"
            subtitle="6 comprehensive modules covering the core pillars of Islamic belief"
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PillarCard
              title="Allah"
              subtitle="Understanding the Creator"
              color="emerald"
              icon="🕌"
            />
            <PillarCard
              title="Muhammad ﷺ"
              subtitle="The Final Prophet"
              color="amber"
              icon="☪️"
            />
            <PillarCard
              title="The Prophets"
              subtitle="The Messenger Lineage"
              color="blue"
              icon="📜"
            />
            <PillarCard
              title="Angels"
              subtitle="The Unseen Realm"
              color="purple"
              icon="✨"
            />
            <PillarCard
              title="Salah"
              subtitle="Connection Through Prayer"
              color="teal"
              icon="🤲"
            />
            <PillarCard
              title="The Hereafter"
              subtitle="Life After Death"
              color="rose"
              icon="🌙"
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/new-muslim"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold transition shadow-lg"
            >
              <span>Begin Foundations</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Video lessons + exams for each module</p>
          </div>
        </div>
      </section>

      {/* Section 5: Live Lessons */}
      <section
        ref={(el) => (sectionRefs.current['lessons'] = el)}
        id="lessons"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Live 1-on-1 Learning"
            badgeColor="emerald"
            title="Learn Directly From Qualified Teachers"
            subtitle="Real human connection powered by smart technology"
          />

          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            {/* Main Video Feature */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white">
              <Video className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-semibold mb-4">HD Video Lessons</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Crystal clear video & audio</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Interactive whiteboard</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Screen sharing for materials</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Real-time chat messaging</span>
                </li>
              </ul>
            </div>

            {/* Supporting Features */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureCard
                icon={Award}
                title="Teacher Tiers"
                description="Standard to Elite — choose your level"
                color="emerald"
                compact
              />
              <FeatureCard
                icon={Download}
                title="Recordings"
                description="Every lesson recorded for review"
                color="teal"
                compact
              />
              <FeatureCard
                icon={FileText}
                title="PDF Materials"
                description="Study materials shared in-lesson"
                color="cyan"
                compact
              />
              <FeatureCard
                icon={Calendar}
                title="Flexible Scheduling"
                description="Book any time, any timezone"
                color="emerald"
                compact
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner />

      {/* Section 6: Learning Games */}
      <section
        ref={(el) => (sectionRefs.current['games'] = el)}
        id="games"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="7+ Game Types"
            badgeColor="pink"
            title="Learn Through Play"
            subtitle="Gamified practice that makes memorization stick"
          />

          {/* Interactive Flashcard Demo */}
          <div className="mt-12 mb-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Try a Flashcard</h3>
            <div className="flex justify-center">
              <FlashcardDemo />
            </div>
          </div>

          {/* Game Types Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GameTypeCard
              icon="🎴"
              title="Flashcards"
              description="Flip to reveal answers"
              color="pink"
            />
            <GameTypeCard
              icon="✅"
              title="Multiple Choice"
              description="Test your knowledge"
              color="purple"
            />
            <GameTypeCard
              icon="🔗"
              title="Matching"
              description="Connect related concepts"
              color="indigo"
            />
            <GameTypeCard
              icon="✏️"
              title="Fill-in-the-Blank"
              description="Complete the ayah"
              color="blue"
            />
            <GameTypeCard
              icon="🌐"
              title="Translation"
              description="Arabic ↔ English"
              color="teal"
            />
            <GameTypeCard
              icon="⌨️"
              title="Type Recall"
              description="Type from memory"
              color="emerald"
            />
            <GameTypeCard
              icon="📝"
              title="Word Ordering"
              description="Arrange words correctly"
              color="amber"
            />
            <GameTypeCard
              icon="🎯"
              title="First Word"
              description="Recall ayah openings"
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* Section 7: Arabic Language */}
      <section
        ref={(el) => (sectionRefs.current['arabic'] = el)}
        id="arabic"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Al-Arabi Bayna Yadayk Curriculum"
            badgeColor="blue"
            title="Unlock the Language of the Quran"
            subtitle="From reading to conversation — structured Arabic learning"
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={BookOpen}
              title="Structured Curriculum"
              description="Industry-standard Al-Arabi textbooks with level progression"
              color="blue"
            />
            <FeatureCard
              icon={Languages}
              title="Grammar Courses"
              description="Nahw and Sarf — the foundations of Arabic grammar"
              color="indigo"
            />
            <FeatureCard
              icon={Brain}
              title="Vocabulary Building"
              description="Flashcard system for retention with spaced repetition"
              color="violet"
            />
            <FeatureCard
              icon={MessageCircle}
              title="Conversation Practice"
              description="Practical dialogue skills with native speakers"
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* Section 8: Gamification */}
      <section
        ref={(el) => (sectionRefs.current['gamification'] = el)}
        id="gamification"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Stay Motivated"
            badgeColor="orange"
            title="Make Learning Addictive"
            subtitle="Gamification that keeps you coming back"
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <GamificationCard
              icon={Zap}
              title="XP System"
              description="Earn points for every activity"
              color="yellow"
            />
            <GamificationCard
              icon={TrendingUp}
              title="Levels"
              description="Progress through 50+ levels"
              color="orange"
            />
            <GamificationCard
              icon="🔥"
              title="Streaks"
              description="Build daily habits"
              color="red"
              emoji
            />
            <GamificationCard
              icon={Award}
              title="Badges"
              description="Unlock achievements"
              color="amber"
            />
            <GamificationCard
              icon={Trophy}
              title="Leaderboards"
              description="Compete globally"
              color="yellow"
            />
          </div>
        </div>
      </section>

      {/* Section 9: Parent Features */}
      <section
        ref={(el) => (sectionRefs.current['parents'] = el)}
        id="parents"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Family Learning Hub"
            badgeColor="rose"
            title="Manage Your Children's Islamic Education"
            subtitle="Complete oversight with easy management"
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Users}
              title="Multi-Child Management"
              description="Add unlimited children to one parent account"
              color="rose"
            />
            <FeatureCard
              icon={Eye}
              title="Progress Monitoring"
              description="See exactly what each child is learning"
              color="pink"
            />
            <FeatureCard
              icon={Star}
              title="Shared Credits"
              description="Use lesson credits across all family members"
              color="fuchsia"
            />
            <FeatureCard
              icon={Calendar}
              title="Lesson Scheduling"
              description="Book and manage lessons for all children"
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* Section 10: Teacher Features */}
      <section
        ref={(el) => (sectionRefs.current['teachers'] = el)}
        id="teachers"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="For Qualified Educators"
            badgeColor="slate"
            title="A Platform Built for Teachers"
            subtitle="Everything you need to teach effectively"
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Briefcase}
              title="Teacher Dashboard"
              description="Comprehensive hub for managing your teaching"
              color="slate"
            />
            <FeatureCard
              icon={Calendar}
              title="Availability Management"
              description="Set your own schedule, any timezone"
              color="gray"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Earnings Tracking"
              description="Transparent payments with detailed breakdown"
              color="zinc"
            />
            <FeatureCard
              icon={Users}
              title="Student Progress"
              description="See where each student needs help"
              color="neutral"
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/apply-to-teach"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-slate-700 hover:bg-slate-800 text-white rounded-full font-semibold transition shadow-lg"
            >
              <span>Apply to Teach</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 11: Referral Program */}
      <section
        ref={(el) => (sectionRefs.current['referral'] = el)}
        id="referral"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
      >
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Sadaqah Jariyah"
            badgeColor="emerald"
            title="Earn Rewards That Last Forever"
            subtitle="Every referral brings ongoing spiritual rewards"
          />

          <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
            <div className="p-8 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-center">
              <Heart className="w-12 h-12 mx-auto mb-4" />
              <p className="text-xl font-medium max-w-2xl mx-auto">
                "By referring others to learn Islam, you share in the reward of every hour they study — even after you pass away."
              </p>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Share Your Link</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Get your unique referral code from your dashboard</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Friend Signs Up</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">They create an account and start learning</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">You Earn Credits</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Free lesson credits for every referral milestone</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-serif font-normal mb-6">
            Ready to Transform Your Islamic Learning?
          </h2>
          <p className="text-xl text-emerald-100 mb-10">
            Join thousands of students already mastering their Deen with Talbiyah.ai
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-10 py-5 bg-white text-emerald-700 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Create Free Account
            </Link>
            <Link
              to="/explore"
              className="px-10 py-5 border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all"
            >
              Explore Islam First
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Talbiyah.ai" className="h-8 w-auto" />
              <span className="font-serif text-xl font-semibold text-white">Talbiyah.ai</span>
            </div>
            <p className="text-sm">At Your Service — AI-powered Islamic learning for the modern Muslim.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Learn</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/explore" className="hover:text-emerald-400 transition">Exploring Islam</Link></li>
              <li><Link to="/new-muslim" className="hover:text-emerald-400 transition">Foundations</Link></li>
              <li><Link to="/teachers" className="hover:text-emerald-400 transition">Find Teachers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Teachers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/apply-to-teach" className="hover:text-emerald-400 transition">Apply to Teach</Link></li>
              <li><Link to="/teachers/vetting-process" className="hover:text-emerald-400 transition">Vetting Process</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/features" className="hover:text-emerald-400 transition">Features</Link></li>
              <li><a href="mailto:contact@talbiyah.ai" className="hover:text-emerald-400 transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          <p>© {new Date().getFullYear()} Talbiyah.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Component: Animated Stat Counter
function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const increment = value / (duration / 16);

          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-400">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-600 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

// Component: Section Header
function SectionHeader({ badge, badgeColor, title, subtitle }: { badge: string; badgeColor: string; title: string; subtitle: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400',
  };

  return (
    <div className="text-center">
      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${colorClasses[badgeColor]}`}>
        {badge}
      </span>
      <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {subtitle}
      </p>
    </div>
  );
}

// Component: Feature Card
function FeatureCard({ icon: Icon, title, description, color, link, compact }: { icon: any; title: string; description: string; color: string; link?: string; compact?: boolean }) {
  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', icon: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', icon: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
    fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', icon: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
    slate: { bg: 'bg-slate-50 dark:bg-slate-800/50', icon: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    gray: { bg: 'bg-gray-50 dark:bg-gray-800/50', icon: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
    zinc: { bg: 'bg-zinc-50 dark:bg-zinc-800/50', icon: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' },
    neutral: { bg: 'bg-neutral-50 dark:bg-neutral-800/50', icon: 'text-neutral-600 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-700' },
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  const content = (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl ${compact ? 'p-4' : 'p-6'} hover:shadow-lg transition-all group`}>
      <div className={`w-${compact ? '10' : '12'} h-${compact ? '10' : '12'} ${colors.bg} rounded-xl flex items-center justify-center mb-${compact ? '3' : '4'}`}>
        <Icon className={`w-${compact ? '5' : '6'} h-${compact ? '5' : '6'} ${colors.icon}`} />
      </div>
      <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white mb-2`}>{title}</h3>
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>{description}</p>
      {link && (
        <div className="mt-3 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700">
          <span>Try it</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

// Component: Episode Card (for Exploring Islam)
function EpisodeCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-4 text-center hover:bg-teal-100 dark:hover:bg-teal-900/50 transition">
      <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
        {number}
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// Component: Pillar Card (for Unshakable Foundations)
function PillarCard({ title, subtitle, color, icon }: { title: string; subtitle: string; color: string; icon: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600 border-emerald-300',
    amber: 'from-amber-500 to-amber-600 border-amber-300',
    blue: 'from-blue-500 to-blue-600 border-blue-300',
    purple: 'from-purple-500 to-purple-600 border-purple-300',
    teal: 'from-teal-500 to-teal-600 border-teal-300',
    rose: 'from-rose-500 to-rose-600 border-rose-300',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 text-white shadow-lg hover:scale-105 transition-transform cursor-pointer`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-1">{title}</h3>
      <p className="text-white/80 text-sm">{subtitle}</p>
    </div>
  );
}

// Component: Game Type Card
function GameTypeCard({ icon, title, description, color }: { icon: string; title: string; description: string; color: string }) {
  const colorClasses: Record<string, string> = {
    pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-2xl p-6 text-center hover:shadow-lg transition-all cursor-pointer group`}>
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// Component: Gamification Card
function GamificationCard({ icon, title, description, color, emoji }: { icon: any; title: string; description: string; color: string; emoji?: boolean }) {
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
  };

  const Icon = icon;

  return (
    <div className={`${colorClasses[color]} border rounded-2xl p-6 text-center hover:shadow-lg transition-all`}>
      {emoji ? (
        <div className="text-4xl mb-3">{icon}</div>
      ) : (
        <Icon className="w-10 h-10 mx-auto mb-3" />
      )}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// Component: CTA Banner
function CTABanner() {
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white text-lg font-medium text-center sm:text-left">
          Ready to experience these features? Start your free trial today.
        </p>
        <Link
          to="/signup"
          className="px-6 py-3 bg-white text-emerald-700 rounded-full font-semibold hover:bg-gray-100 transition whitespace-nowrap"
        >
          Start Free
        </Link>
      </div>
    </div>
  );
}

// Component: Interactive Flashcard Demo
function FlashcardDemo() {
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);

  const cards = [
    { front: 'بِسْمِ اللَّهِ', back: 'In the name of Allah' },
    { front: 'الْحَمْدُ لِلَّهِ', back: 'All praise is due to Allah' },
    { front: 'السَّلَامُ عَلَيْكُمْ', back: 'Peace be upon you' },
  ];

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  return (
    <div className="w-full max-w-sm">
      <div
        onClick={() => setFlipped(!flipped)}
        className={`relative w-full h-48 cursor-pointer transition-all duration-500 transform-gpu preserve-3d ${flipped ? 'rotate-y-180' : ''}`}
        style={{ perspective: '1000px' }}
      >
        {/* Front */}
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 flex items-center justify-center text-white shadow-xl backface-hidden ${flipped ? 'invisible' : ''}`}>
          <span className="text-3xl font-arabic">{cards[cardIndex].front}</span>
        </div>
        {/* Back */}
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 flex items-center justify-center text-white shadow-xl backface-hidden rotate-y-180 ${!flipped ? 'invisible' : ''}`}>
          <span className="text-xl">{cards[cardIndex].back}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => setFlipped(!flipped)}
          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
        >
          {flipped ? 'Show Arabic' : 'Show English'}
        </button>
        <button
          onClick={nextCard}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          Next Card
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
        Click the card to flip • Card {cardIndex + 1} of {cards.length}
      </p>
    </div>
  );
}
