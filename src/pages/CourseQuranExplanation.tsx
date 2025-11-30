import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Star, Users, ArrowLeft, ArrowRight, Play, Award, Target, Zap, TrendingUp, Image as ImageIcon, Brain, Volume2, Heart } from 'lucide-react';
import TalbiyahInsightsShowcase from '../components/TalbiyahInsightsShowcase';
import { supabase } from '../lib/supabaseClient';

export default function CourseQuranExplanation() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  const threeStepApproach = [
    {
      step: 1,
      icon: Brain,
      title: 'Understanding (Tafsir & Tadabbur)',
      description: 'Deep comprehension of meanings',
      details: [
        'Context and themes of each surah',
        'Contemplation and reflection',
        'Connect verses to your life',
        'Understand the wisdom behind the revelation'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      step: 2,
      icon: Volume2,
      title: 'Fluency (Tajweed & Recitation)',
      description: 'Beautiful recitation with proper pronunciation',
      details: [
        'Master tajweed rules',
        'Confident oral delivery',
        'Listening and repetition practice',
        'Perfect your makharij (pronunciation points)'
      ],
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      step: 3,
      icon: Heart,
      title: 'Memorization (Hifz)',
      description: 'Internalize after understanding',
      details: [
        'Proven memorization techniques',
        'Long-term retention strategies',
        'Review and reinforcement',
        'Memorize with meaning, not just sound'
      ],
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const benefits = [
    'Understand what you recite - never read without comprehension again',
    'Follow the methodology of the Sahaba (companions of the Prophet ﷺ)',
    'Build a deep, personal connection with the Quran',
    'Memorization becomes easier when you understand the meanings',
    'Apply Quranic wisdom to your daily life',
    'Learn from qualified teachers with Ijazah and deep Islamic knowledge'
  ];

  const testimonials = [
    {
      name: 'Aisha M.',
      role: 'Student',
      text: 'The personalised approach helped me correct years of incorrect pronunciation. My teacher is patient and knowledgeable.',
      rating: 5
    },
    {
      name: 'Ibrahim K.',
      role: 'Parent',
      text: 'My children look forward to their Quran lessons. The AI study notes help them review between sessions.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="fixed top-0 w-full bg-slate-900/95 backdrop-blur-lg z-50 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <BookOpen className="w-7 h-7 text-emerald-400" />
            <span className="text-2xl font-bold text-white">Talbiyah.ai</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/courses-overview')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Courses</span>
            </button>

            <button
              onClick={() => navigate('/courses/quran-progress')}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition shadow-lg flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View My Progress Tracker</span>
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-1 mb-8 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-20 blur-2xl"></div>
                <div className="relative rounded-[22px] h-80 overflow-hidden">
                  <img
                    src="/qurancourse.jpg"
                    alt="Qur'an with Understanding"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-lg px-6 py-3">
                      <p className="text-emerald-300 font-bold text-xl">Qur'an with Understanding</p>
                      <p className="text-emerald-400/80 text-sm mt-1">Recitation, Tajweed & Tafsir</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border-2 border-emerald-500/30 rounded-lg mb-6">
                <Star className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold text-sm">Most Popular Course</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                Qur'an with Understanding
              </h1>
              <p className="text-2xl text-emerald-400 mb-6 leading-relaxed font-semibold">
                Learn the Quran the way the Sahaba did - understand first, then master
              </p>

              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                The companions of the Prophet ﷺ didn't just memorize the Quran - they understood it deeply before moving forward. They would learn 10 ayat, understand their meanings, reflect on them, and only then memorize and move to the next. This is the Talbiyah method.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-lg border-2 border-slate-700 shadow-sm">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-200 font-medium">Expert Teachers with Ijazah</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-lg border-2 border-slate-700 shadow-sm">
                  <Play className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-200 font-medium">Live 1-to-1 Sessions</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(user ? '/teachers' : '/signup', { state: user ? undefined : { autoRole: 'student' } })}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-lg font-bold transition shadow-xl shadow-emerald-500/30 flex items-center justify-center space-x-2"
                >
                  <span>{user ? 'Browse Teachers' : 'Start Free 30-Min Session'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                {user && (
                  <button
                    onClick={() => navigate('/courses/quran-progress')}
                    className="px-8 py-4 bg-slate-800 hover:bg-emerald-900/50 border-2 border-emerald-500/50 text-emerald-300 rounded-xl text-lg font-bold transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>My Progress</span>
                  </button>
                )}
                {!user && (
                  <button
                    onClick={() => navigate('/teachers')}
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white rounded-xl text-lg font-semibold transition shadow-sm"
                  >
                    Browse Teachers
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Approach Section */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our 3-Step Approach
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Following the Sunnah of the Sahaba: understand deeply, recite beautifully, memorize with meaning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {threeStepApproach.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                    {step.step}
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 rounded-2xl p-8 h-full hover:border-emerald-500/50 transition">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-emerald-400 mb-6 font-medium">
                      {step.description}
                    </p>

                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300 text-sm">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-2 border-blue-500/30 rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Why This Order Matters</h3>
                <p className="text-slate-300 leading-relaxed">
                  When you understand the meaning first, recitation becomes purposeful and memorization becomes natural.
                  This was the way of the Prophet ﷺ and his companions. They didn't race to finish - they absorbed,
                  reflected, and implemented each verse in their lives. The result? A deep, lasting relationship with
                  Allah's words that transforms your heart and actions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Experience Talbiyah Insights</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              After every session, receive comprehensive AI-generated study materials personalised to your learning
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <TalbiyahInsightsShowcase courseType="quran" />
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-10 border-2 border-slate-700 shadow-xl">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">What You'll Gain</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-200">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">What Our Students Say</h2>
            <p className="text-xl text-slate-300">Real experiences from our learning community</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border-2 border-slate-700 shadow-lg hover:border-emerald-500/50 transition">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 mb-6 leading-relaxed">{testimonial.text}</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-emerald-50 mb-8">
            Start with a free 30-minute taster session. No credit card required.
          </p>
          <button
            onClick={() => navigate('/signup', { state: { autoRole: 'student' } })}
            className="px-10 py-5 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl text-xl font-bold transition shadow-2xl inline-flex items-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}
