import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, BookOpen, Video, Gamepad2, Languages, GraduationCap,
  Trophy, Users, Briefcase, Heart, ArrowRight, CheckCircle2,
  Brain, Lightbulb, FileText, Mic, Star,
  Calendar, Shield, Award, Zap, Target, TrendingUp,
  MessageCircle, Download, Eye, ChevronDown, Menu, X,
  Check, Gift
} from 'lucide-react';

// Import extracted components
import {
  PricingBadge,
  SectionHeader,
  ComparisonTable,
  QuickPricing,
  FeatureCard,
  FeatureCardWithPricing,
  FlashcardDemo,
  MultipleChoiceDemo,
  MatchingDemo,
  EpisodeCard,
  PillarMini,
  GameTypeCard,
  GamificationCard,
  CTABanner,
  TeacherPreviewCard,
} from '../components/features';

// Feature category definitions - reordered to lead with free content
const featureCategories = [
  { id: 'comparison', name: 'Free vs Premium', icon: Gift, color: 'emerald' },
  { id: 'courses', name: 'Free Courses', icon: GraduationCap, color: 'teal' },
  { id: 'tools', name: 'Free Tools', icon: Heart, color: 'pink' },
  { id: 'games', name: 'Learning Games', icon: Gamepad2, color: 'purple' },
  { id: 'gamification', name: 'Gamification', icon: Trophy, color: 'orange' },
  { id: 'ai', name: 'Premium AI', icon: Sparkles, color: 'violet' },
  { id: 'lessons', name: 'Live Lessons', icon: Video, color: 'emerald' },
  { id: 'quran', name: 'Quran Tracking', icon: BookOpen, color: 'blue' },
  { id: 'arabic', name: 'Arabic', icon: Languages, color: 'indigo' },
  { id: 'parents', name: 'For Parents', icon: Users, color: 'rose' },
  { id: 'teachers', name: 'For Teachers', icon: Briefcase, color: 'slate' },
];

export default function Features() {
  const [activeSection, setActiveSection] = useState('comparison');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle scroll for section tracking
  useEffect(() => {
    const handleScroll = () => {
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
      const offset = 140;
      const top = section.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Skip to Main Content - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

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
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">Sign In</Link>
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
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
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
              <Link to="/login" className="block text-gray-600 dark:text-gray-300">Sign In</Link>
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

      {/* Sticky Feature Navigation */}
      <div className="fixed top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-7xl mx-auto relative">
          {/* Scroll Indicators for Mobile */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none z-10 md:hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none z-10 md:hidden" />

          <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
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
      </div>

      {/* Main Content */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-white to-violet-50 dark:from-emerald-900/20 dark:via-gray-900 dark:to-violet-900/20">
          <div className="max-w-7xl mx-auto text-center">
            {/* FREE Badge */}
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-400 font-semibold mb-8">
              <Gift className="w-5 h-5" />
              <span>Most Features are 100% FREE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-gray-900 dark:text-white mb-6">
              Learn Islam <span className="text-green-600 dark:text-green-400">FREE</span> —<br />
              <span className="text-violet-600 dark:text-violet-400">Premium</span> When You're Ready
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
              Start your Islamic education journey today at no cost. Upgrade only when you want advanced AI audio or live lessons.
            </p>

            {/* FREE vs Premium Quick Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <div className="flex items-center space-x-3 bg-green-50 dark:bg-green-900/20 px-5 py-3 rounded-xl border border-green-200 dark:border-green-800">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong className="text-green-600 dark:text-green-400">FREE:</strong> Duas, Courses, Games, Progress Tracking
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-violet-50 dark:bg-violet-900/20 px-5 py-3 rounded-xl border border-violet-200 dark:border-violet-800">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong className="text-violet-600 dark:text-violet-400">PREMIUM:</strong> Live lessons, AI audio downloads
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center space-x-2"
              >
                <Gift className="w-5 h-5" />
                <span>Start Free — No Card Required</span>
              </Link>
              <button
                onClick={() => scrollToSection('comparison')}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-full text-lg font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center space-x-2"
              >
                <span>See What's FREE</span>
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">9+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">FREE Features</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">13</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">FREE Episodes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">8</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Game Types</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">£0</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">To Get Started</div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex flex-col items-center">
              <div className="flex items-center space-x-1 mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Trusted by <strong className="text-gray-900 dark:text-white">2,500+</strong> learners worldwide
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: FREE vs Premium Comparison Table */}
        <section
          ref={(el) => (sectionRefs.current['comparison'] = el)}
          id="comparison"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
        >
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              badge="Transparent Pricing"
              badgeColor="emerald"
              title="FREE vs Premium — At a Glance"
              subtitle="See exactly what's included free and what's premium"
            />

            {/* Comparison Table */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <ComparisonTable />
            </div>

            {/* Quick Pricing Summary */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
                Premium Pricing (Only When You Need It)
              </h3>
              <QuickPricing />
            </div>

            {/* Guarantee */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Cancel anytime • No hidden fees • 7-day refund on credits</span>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link
                to="/signup"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition shadow-lg"
              >
                <Gift className="w-5 h-5" />
                <span>Start Free Today</span>
              </Link>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No credit card required</p>
            </div>
          </div>
        </section>

        {/* Section 2: Free Courses */}
        <section
          ref={(el) => (sectionRefs.current['courses'] = el)}
          id="courses"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              badge="100% FREE"
              badgeColor="teal"
              title="Complete Courses — Completely Free"
              subtitle="Full educational content with no paywalls or limits"
            />

            <div className="mt-12 grid lg:grid-cols-2 gap-8">
              {/* Exploring Islam */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-teal-200 dark:border-teal-800">
                <div className="p-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <PricingBadge type="free" />
                      <h3 className="text-2xl font-semibold mt-2">Exploring Islam</h3>
                      <p className="text-teal-100">13 episodes • ~40 minutes</p>
                    </div>
                    <Eye className="w-12 h-12 text-teal-200" />
                  </div>
                  {/* Course Stats */}
                  <div className="flex items-center space-x-4 mt-4 text-sm text-teal-100">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      2,341 enrolled
                    </span>
                    <span className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-300" />
                      4.9 (127)
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Evidence-based journey through Islamic concepts. Perfect for non-Muslims, those questioning, or anyone wanting to understand Islam through reason.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <EpisodeCard number={1} title="Axiom Check" description="Common ground" />
                    <EpisodeCard number={2} title="Authority Match" description="Truth verification" />
                    <EpisodeCard number={3} title="Chain of Custody" description="Historical sources" />
                    <EpisodeCard number={4} title="Probability" description="Weighing evidence" />
                  </div>
                  {/* Testimonial */}
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      "Finally understood why Islam makes sense logically. Changed my perspective."
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">— Sarah M.</p>
                  </div>
                  <Link
                    to="/explore"
                    className="inline-flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700"
                  >
                    <span>Start Exploring — It's Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Unshakable Foundations */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-amber-200 dark:border-amber-800">
                <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <PricingBadge type="free" />
                      <h3 className="text-2xl font-semibold mt-2">Unshakable Foundations</h3>
                      <p className="text-amber-100">6 complete modules</p>
                    </div>
                    <GraduationCap className="w-12 h-12 text-amber-200" />
                  </div>
                  {/* Course Stats */}
                  <div className="flex items-center space-x-4 mt-4 text-sm text-amber-100">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      1,856 enrolled
                    </span>
                    <span className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-300" />
                      4.8 (98)
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Build unshakeable Islamic knowledge. 6 comprehensive modules covering the core pillars of belief with video lessons + exams.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <PillarMini title="Allah" icon="🕌" />
                    <PillarMini title="Muhammad ﷺ" icon="☪️" />
                    <PillarMini title="Prophets" icon="📜" />
                    <PillarMini title="Angels" icon="✨" />
                    <PillarMini title="Salah" icon="🤲" />
                    <PillarMini title="Hereafter" icon="🌙" />
                  </div>
                  <Link
                    to="/new-muslim"
                    className="inline-flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-medium hover:text-amber-700"
                  >
                    <span>Begin Foundations — It's Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Salah Tutorial */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🤲</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salah Tutorial</h3>
                      <PricingBadge type="free" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Complete step-by-step guide to prayer</p>
                  </div>
                </div>
                <Link
                  to="/salah-guide"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition"
                >
                  Learn Salah Free
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Free Tools */}
        <section
          ref={(el) => (sectionRefs.current['tools'] = el)}
          id="tools"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              badge="FREE Tools"
              badgeColor="pink"
              title="Powerful Tools — Zero Cost"
              subtitle="AI-assisted tools to enhance your Islamic practice"
            />

            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCardWithPricing
                icon={Heart}
                title="Dua Builder"
                description="Generate personalized duas using the 99 Names of Allah"
                color="pink"
                link="/dua-builder"
                pricing={[
                  { label: 'Text generation', type: 'free' },
                  { label: 'Audio download', type: 'tokens', cost: 10 },
                ]}
              />
              <FeatureCardWithPricing
                icon={BookOpen}
                title="Qunut Practice"
                description="Full page with audio for practicing the Qunut supplication"
                color="rose"
                link="/qunut"
                pricing={[
                  { label: 'Full access', type: 'free' },
                ]}
              />
              <FeatureCardWithPricing
                icon={Mic}
                title="Khutbah Creator"
                description="Create sermon outlines with authentic Islamic sources"
                color="violet"
                link="/khutba-creator"
                pricing={[
                  { label: 'Text creation', type: 'limited-free', cost: 2 },
                  { label: 'Additional', type: 'tokens', cost: 20 },
                  { label: 'Audio', type: 'tokens', cost: 25 },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Section 4: Learning Games */}
        <section
          ref={(el) => (sectionRefs.current['games'] = el)}
          id="games"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <PricingBadge type="free" label="ALL FREE" />
            </div>
            <SectionHeader
              badge="8 Game Types"
              badgeColor="purple"
              title="Learn Through Play"
              subtitle="Gamified practice that makes memorization stick — all free"
            />

            {/* Interactive Demos */}
            <div className="mt-12 mb-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">Try Our Games</h3>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-3">🎴 Flashcards</p>
                  <FlashcardDemo />
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">✅ Multiple Choice</p>
                  <MultipleChoiceDemo />
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-3">🔗 Matching</p>
                  <MatchingDemo />
                </div>
              </div>
            </div>

            {/* Game Types Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GameTypeCard icon="🎴" title="Flashcards" description="Flip to reveal answers" color="pink" badge="Most Popular" />
              <GameTypeCard icon="✅" title="Multiple Choice" description="Test your knowledge" color="purple" />
              <GameTypeCard icon="🔗" title="Matching" description="Connect related concepts" color="indigo" />
              <GameTypeCard icon="✏️" title="Fill-in-the-Blank" description="Complete the ayah" color="blue" />
              <GameTypeCard icon="🌐" title="Translation" description="Arabic ↔ English" color="teal" />
              <GameTypeCard icon="⌨️" title="Type Recall" description="Type from memory" color="emerald" />
              <GameTypeCard icon="📝" title="Word Ordering" description="Arrange words correctly" color="amber" />
              <GameTypeCard icon="🎯" title="First Word" description="Recall ayah openings" color="orange" />
            </div>
          </div>
        </section>

        {/* Section 5: Gamification */}
        <section
          ref={(el) => (sectionRefs.current['gamification'] = el)}
          id="gamification"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <PricingBadge type="free" label="ALL FREE" />
            </div>
            <SectionHeader
              badge="Stay Motivated"
              badgeColor="orange"
              title="Make Learning Addictive"
              subtitle="Gamification that keeps you coming back — no premium required"
            />

            {/* XP Preview Card */}
            <div className="mt-12 max-w-md mx-auto">
              <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-80">Your Level</p>
                    <p className="text-3xl font-bold">Level 12</p>
                    <p className="text-xs opacity-60">Explorer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">2,450 XP</p>
                    <p className="text-xs opacity-80">550 to Level 13</p>
                  </div>
                </div>
                <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-white rounded-full transition-all duration-500" />
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-xl">🔥</span>
                    <span>7 day streak</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xl">🏆</span>
                    <span>#47 Global</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                Example progress — this could be you
              </p>
            </div>

            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <GamificationCard icon={Zap} title="XP System" description="Earn points for every activity" color="yellow" />
              <GamificationCard icon={TrendingUp} title="Levels" description="Progress through 50+ levels" color="orange" />
              <GamificationCard icon="🔥" title="Streaks" description="Build daily habits" color="red" emoji />
              <GamificationCard icon={Award} title="Badges" description="Unlock achievements" color="amber" />
              <GamificationCard icon={Trophy} title="Leaderboards" description="Compete globally" color="yellow" />
            </div>

            {/* Badge Showcase */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Unlock badges as you learn:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center space-x-2 bg-amber-100 dark:bg-amber-900/30 px-3 py-2 rounded-full">
                  <span className="text-xl">🤲</span>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">First Dua</span>
                </div>
                <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-2 rounded-full">
                  <span className="text-xl">🔥</span>
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">7-Day Streak</span>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-2 rounded-full">
                  <span className="text-xl">📖</span>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Surah Master</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full opacity-50">
                  <span className="text-xl">🏆</span>
                  <span className="text-sm font-medium text-gray-500">Top 10</span>
                  <span className="text-xs text-gray-400">Locked</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Premium AI Features */}
        <section
          ref={(el) => (sectionRefs.current['ai'] = el)}
          id="ai"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <PricingBadge type="tokens" label="PREMIUM" />
            </div>
            <SectionHeader
              badge="AI-Powered Extras"
              badgeColor="violet"
              title="Premium AI Features"
              subtitle="Advanced AI capabilities for when you want more"
            />

            {/* AI Insights Demo */}
            <div className="mt-12 relative">
              {/* Premium glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20" />
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-violet-200 dark:border-violet-800">
                <div className="p-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-6 h-6" />
                      <h3 className="text-xl font-semibold">Talbiyah Insights</h3>
                    </div>
                    <div className="flex space-x-2">
                      <PricingBadge type="free" label="Text FREE" />
                      <PricingBadge type="tokens" cost={15} label="Audio 15" />
                      <PricingBadge type="tokens" cost={10} label="PDF 10" />
                    </div>
                  </div>
                  <p className="mt-2 text-violet-100">Every lesson automatically generates personalized study notes</p>
                </div>
                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5 text-violet-500" />
                        <span>Your Questions During the Lesson</span>
                      </h4>
                      <div className="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-violet-200 dark:bg-violet-800 rounded-full flex items-center justify-center text-sm font-medium text-violet-700 dark:text-violet-300">Q</div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">"Why do we say 'Bismillah' before starting?"</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-violet-200 dark:bg-violet-800 rounded-full flex items-center justify-center text-sm font-medium text-violet-700 dark:text-violet-300">Q</div>
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

                  {/* Audio Preview */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">Premium: Download as audio</p>
                    <div className="flex items-center space-x-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl p-4 max-w-md mx-auto">
                      <button className="w-12 h-12 bg-violet-500 hover:bg-violet-600 rounded-full flex items-center justify-center transition flex-shrink-0" aria-label="Play audio preview">
                        <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                      <div className="flex-1">
                        <div className="h-2 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-violet-500 rounded-full" />
                        </div>
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">AI-generated insight preview (0:47)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Premium AI Features */}
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCardWithPricing
                icon={Download}
                title="Dua Audio Download"
                description="Download AI-generated audio of your personalized duas"
                color="violet"
                pricing={[{ label: 'Per download', type: 'tokens', cost: 10 }]}
              />
              <FeatureCardWithPricing
                icon={Mic}
                title="Khutbah Audio"
                description="Generate audio versions of your khutbah outlines"
                color="purple"
                pricing={[{ label: 'Per audio', type: 'tokens', cost: 25 }]}
              />
              <FeatureCardWithPricing
                icon={Brain}
                title="AI Homework Generation"
                description="Custom quizzes based on your actual lesson content"
                color="indigo"
                pricing={[{ label: 'With lessons', type: 'free' }]}
              />
              <FeatureCardWithPricing
                icon={Target}
                title="Knowledge Gap Analysis"
                description="AI identifies exactly what you're missing"
                color="blue"
                pricing={[{ label: 'With lessons', type: 'free' }]}
              />
            </div>
          </div>
        </section>

        {/* Section 7: Live Lessons */}
        <section
          ref={(el) => (sectionRefs.current['lessons'] = el)}
          id="lessons"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <PricingBadge type="credits" cost={1} />
            </div>
            <SectionHeader
              badge="Live 1-on-1 Learning"
              badgeColor="emerald"
              title="Learn From Qualified Teachers"
              subtitle="Real human connection powered by smart technology — £12-14 per lesson"
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
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>AI insights generated after each lesson</span>
                  </li>
                </ul>
              </div>

              {/* Supporting Features */}
              <div className="grid grid-cols-2 gap-4">
                <FeatureCard icon={Award} title="Teacher Tiers" description="Standard to Elite — choose your level" color="emerald" compact />
                <FeatureCard icon={Download} title="Recordings" description="Every lesson recorded for review" color="teal" compact />
                <FeatureCard icon={FileText} title="PDF Materials" description="Study materials shared in-lesson" color="cyan" compact />
                <FeatureCard icon={Calendar} title="Flexible Scheduling" description="Book any time, any timezone" color="emerald" compact />
              </div>
            </div>

            {/* Teacher Preview Carousel */}
            <div className="mt-12">
              <h4 className="font-semibold text-gray-900 dark:text-white text-center mb-6">Meet Your Teachers</h4>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                <TeacherPreviewCard
                  initials="UA"
                  name="Ustadh Ahmed"
                  specialty="Quran & Tajweed"
                  rating={4.9}
                  lessons={340}
                  tier="Elite"
                />
                <TeacherPreviewCard
                  initials="UF"
                  name="Ustadha Fatima"
                  specialty="Arabic Language"
                  rating={4.8}
                  lessons={220}
                  tier="Standard"
                />
                <TeacherPreviewCard
                  initials="UY"
                  name="Ustadh Yusuf"
                  specialty="Islamic Studies"
                  rating={4.9}
                  lessons={185}
                  tier="Elite"
                />
                <TeacherPreviewCard
                  initials="UA"
                  name="Ustadha Aisha"
                  specialty="Kids Quran"
                  rating={5.0}
                  lessons={412}
                  tier="Elite"
                />
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                Scroll to see more teachers • 50+ qualified educators available
              </p>
            </div>

            {/* Pricing Explanation */}
            <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <strong className="text-gray-900 dark:text-white">Standard teachers:</strong> £12/lesson
                <br />
                <strong className="text-gray-900 dark:text-white">Elite teachers:</strong> £14/lesson
                <br />
                <span className="text-xs text-gray-500">Elite = 100+ lessons & 4.9+ rating</span>
              </p>
            </div>

            {/* Lesson Testimonial */}
            <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-emerald-200 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">AK</span>
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "My son's Quran recitation has improved dramatically. The teacher is patient and the AI notes help us practice between lessons."
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <strong>Amina K.</strong> — Parent, 6 months of lessons
                  </p>
                </div>
              </div>
            </div>

            {/* Guarantee */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">100% satisfaction guarantee — full refund if not happy with first lesson</span>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <CTABanner />

        {/* Section 8: Quran Tracking */}
        <section
          ref={(el) => (sectionRefs.current['quran'] = el)}
          id="quran"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <PricingBadge type="free" label="FREE" />
            </div>
            <SectionHeader
              badge="114 Surahs • 6,236 Ayahs"
              badgeColor="blue"
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
                <p className="text-gray-600 dark:text-gray-400">First, learn the meaning and context of each ayah.</p>
                <div className="mt-4 h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6">
                  <Languages className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Fluency</h3>
                <p className="text-gray-600 dark:text-gray-400">Perfect your pronunciation and tajweed.</p>
                <div className="mt-4 h-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                  <div className="h-full w-2/3 bg-emerald-500 rounded-full"></div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Memorization</h3>
                <p className="text-gray-600 dark:text-gray-400">Finally, commit to memory. Recall perfectly.</p>
                <div className="mt-4 h-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                  <div className="h-full w-full bg-amber-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Quran Progress Features */}
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard icon={BookOpen} title="Surah-by-Surah Tracking" description="Progress bars for all 114 surahs" color="blue" />
              <FeatureCard icon={Target} title="Ayah-by-Ayah Progress" description="Granular tracking down to individual verses" color="cyan" />
              <FeatureCard icon={TrendingUp} title="Juz Organization" description="Track progress across all 30 juz" color="teal" />
            </div>

            {/* Interface Preview */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-blue-100 dark:border-blue-900 max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span>Your Quran Progress</span>
              </h4>
              <div className="space-y-4">
                {/* Al-Fatiha */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Al-Fatiha</span>
                      <span className="text-xs text-green-600 dark:text-green-400">Complete</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="flex-1 h-2 bg-blue-500 rounded-full" title="Understanding: 100%" />
                      <div className="flex-1 h-2 bg-emerald-500 rounded-full" title="Fluency: 100%" />
                      <div className="flex-1 h-2 bg-amber-500 rounded-full" title="Memorized: 100%" />
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                {/* Al-Baqarah */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Al-Baqarah</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">In Progress</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-[45%] bg-blue-500 rounded-full" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-[30%] bg-emerald-500 rounded-full" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-[12%] bg-amber-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">286 ayahs</span>
                </div>
                {/* Al-Imran */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Al-Imran</span>
                      <span className="text-xs text-gray-500">Not started</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">200 ayahs</span>
                </div>
              </div>
              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>Understanding</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded" />
                  <span>Fluency</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-amber-500 rounded" />
                  <span>Memorized</span>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <blockquote className="mt-8 max-w-2xl mx-auto border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
              "I've tried 5 Quran apps. Talbiyah is the only one that tracks understanding AND memorization separately. Game changer."
              <footer className="text-sm text-gray-500 dark:text-gray-500 mt-2 not-italic">— Omar K., memorized 3 juz in 6 months</footer>
            </blockquote>
          </div>
        </section>

        {/* Section 9: Arabic Language */}
        <section
          ref={(el) => (sectionRefs.current['arabic'] = el)}
          id="arabic"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              badge="Al-Arabi Bayna Yadayk Curriculum"
              badgeColor="indigo"
              title="Unlock the Language of the Quran"
              subtitle="From reading to conversation — structured Arabic learning"
            />

            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard icon={BookOpen} title="Structured Curriculum" description="Industry-standard Al-Arabi textbooks" color="indigo" />
              <FeatureCard icon={Languages} title="Grammar Courses" description="Nahw and Sarf foundations" color="violet" />
              <FeatureCard icon={Brain} title="Vocabulary Building" description="Flashcard system with spaced repetition" color="purple" />
              <FeatureCard icon={MessageCircle} title="Conversation Practice" description="Practical dialogue skills" color="fuchsia" />
            </div>

            {/* Curriculum Explanation */}
            <div className="mt-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800 max-w-3xl mx-auto">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Why Al-Arabi Bayna Yadayk?</h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                The world's most trusted Arabic curriculum, used by 500+ Islamic universities worldwide.
                Designed specifically for non-native speakers learning Quranic and conversational Arabic.
              </p>
              {/* Level System */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-indigo-600 dark:text-indigo-400">Levels:</span>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">1 - Beginner</span>
                <span className="px-3 py-1 bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 rounded-full text-xs font-medium">2 - Elementary</span>
                <span className="px-3 py-1 bg-indigo-300 dark:bg-indigo-600 text-indigo-900 dark:text-indigo-100 rounded-full text-xs font-medium">3 - Intermediate</span>
                <span className="px-3 py-1 bg-indigo-400 dark:bg-indigo-500 text-white rounded-full text-xs font-medium">4 - Advanced</span>
              </div>
              <Link
                to="/arabic-assessment"
                className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 text-sm"
              >
                <span>Take free placement test (5 min)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 10: Parent Features */}
        <section
          ref={(el) => (sectionRefs.current['parents'] = el)}
          id="parents"
          className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <PricingBadge type="free" label="FREE" />
            </div>
            <SectionHeader
              badge="Family Learning Hub"
              badgeColor="rose"
              title="Manage Your Children's Islamic Education"
              subtitle="Complete oversight with easy management — all free features included"
            />

            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard icon={Users} title="Multi-Child Management" description="Add unlimited children to one account" color="rose" />
              <FeatureCard icon={Eye} title="Progress Monitoring" description="See exactly what each child is learning" color="pink" />
              <FeatureCard icon={Star} title="Shared Credits" description="Use lesson credits across all family" color="fuchsia" />
              <FeatureCard icon={Calendar} title="Lesson Scheduling" description="Book and manage all children's lessons" color="purple" />
            </div>

            {/* Safety Reassurance */}
            <div className="mt-12 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Your Child's Safety First</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-rose-500" />
                      <span>All teachers background-checked and verified</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-rose-500" />
                      <span>Lesson recordings available for parent review</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-rose-500" />
                      <span>Parent notified of all lesson activity</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-rose-500" />
                      <span>No unmonitored direct messaging</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Parent Testimonial */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-rose-100 dark:border-rose-900">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-rose-200 dark:bg-rose-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">FH</span>
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    "I can finally see exactly what my kids are learning. The progress reports are amazing — I know exactly which surahs they're working on."
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <strong>Fatima H.</strong> — Parent of 3
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 11: Teacher Features */}
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
              <FeatureCard icon={Briefcase} title="Teacher Dashboard" description="Comprehensive hub for managing teaching" color="slate" />
              <FeatureCard icon={Calendar} title="Availability Management" description="Set your own schedule, any timezone" color="gray" />
              <FeatureCard icon={TrendingUp} title="Earnings Tracking" description="Transparent payments with breakdown" color="zinc" />
              <FeatureCard icon={Users} title="Student Progress" description="See where each student needs help" color="neutral" />
            </div>

            {/* Earnings Transparency */}
            <div className="mt-12 grid md:grid-cols-2 gap-8">
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Teacher Earnings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">£8-10</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">per lesson (Standard)</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">£10-12</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">per lesson (Elite)</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Top teachers earn £2,000+/month teaching 20 lessons/week
                </p>
              </div>

              {/* Teacher Testimonial */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "I left my 9-5 to teach full-time on Talbiyah. Better schedule, better students, and I'm teaching something meaningful."
                </p>
                <div className="flex items-center space-x-3 mt-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">UI</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Ustadh Ibrahim</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">400+ lessons taught</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/apply-to-teach"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-slate-700 hover:bg-slate-800 text-white rounded-full font-semibold transition shadow-lg"
              >
                <span>Apply to Teach</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Applications reviewed within 48 hours
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-700">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Social Proof */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-1 mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-emerald-100">
                Rated <strong className="text-white">4.9/5</strong> by 500+ learners
              </p>
            </div>

            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                <Gift className="w-4 h-4 mr-2" />
                Most Features are FREE
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif font-normal mb-6">
              Ready to Transform Your Islamic Learning?
            </h2>
            <p className="text-xl text-emerald-100 mb-10">
              Start with everything free. Upgrade only when you're ready for live lessons or premium AI features.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="px-10 py-5 bg-white text-emerald-700 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2"
              >
                <Gift className="w-5 h-5" />
                <span>Start Free — No Card Required</span>
              </Link>
              <Link
                to="/explore"
                className="px-10 py-5 border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all"
              >
                Explore Islam First
              </Link>
            </div>

            {/* Email Capture for Hesitant Users */}
            <div className="mt-12 border-t border-white/20 pt-8">
              <p className="text-emerald-100 mb-4">Not ready? Get our free Islamic learning tips:</p>
              <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full font-medium transition"
                >
                  Send Tips
                </button>
              </form>
              <p className="text-xs text-emerald-200 mt-2">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Talbiyah.ai" className="h-8 w-auto" />
              <span className="font-serif text-xl font-semibold text-white">Talbiyah.ai</span>
            </div>
            <p className="text-sm">At Your Service — AI-powered Islamic learning for the modern Muslim.</p>
            {/* Trust Badges */}
            <div className="flex items-center space-x-3 mt-4">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>SSL Secured</span>
              </div>
            </div>
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
              <li><Link to="/pricing" className="hover:text-emerald-400 transition">Pricing</Link></li>
              <li><a href="mailto:contact@talbiyah.ai" className="hover:text-emerald-400 transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400 transition">Terms of Service</Link></li>
              <li><Link to="/refund" className="hover:text-emerald-400 transition">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-sm">
          <p>© {new Date().getFullYear()} Talbiyah.ai. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Link to="/privacy" className="hover:text-emerald-400 transition">Privacy</Link>
            <span className="text-gray-700">•</span>
            <Link to="/terms" className="hover:text-emerald-400 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
