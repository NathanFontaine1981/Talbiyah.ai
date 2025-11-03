import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, Star, Users, ArrowLeft, ArrowRight, Play, Award, Target, Zap, TrendingUp, Image as ImageIcon } from 'lucide-react';
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

  const features = [
    {
      icon: BookOpen,
      title: 'Expert Tajweed Instruction',
      description: 'Learn perfect pronunciation with qualified teachers who have Ijazah'
    },
    {
      icon: Target,
      title: 'Personalized Learning Path',
      description: 'Customized curriculum based on your current level and goals'
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Automatic study notes and quizzes generated from your lessons'
    },
    {
      icon: Award,
      title: 'Understanding Tafsir',
      description: 'Dive deep into meanings and context with scholarly explanations'
    }
  ];

  const benefits = [
    'Master Tajweed rules with practical application',
    'Understand Arabic grammar as it relates to Quranic text',
    'Learn the historical and spiritual context of revelations',
    'Memorization techniques from experienced Huffadh',
    'Develop a deeper connection with Allah through His words',
    'Flexible scheduling that fits your lifestyle'
  ];

  const testimonials = [
    {
      name: 'Aisha M.',
      role: 'Student',
      text: 'The personalized approach helped me correct years of incorrect pronunciation. My teacher is patient and knowledgeable.',
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
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span className="text-2xl font-bold text-slate-900">Talbiyah.ai</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/courses-overview')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition"
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
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-1 mb-8 shadow-2xl">
                <div className="bg-slate-100 rounded-[22px] h-80 flex items-center justify-center">
                  <div className="text-center flex flex-col items-center justify-center">
                    <ImageIcon className="w-24 h-24 text-emerald-500 mb-4" />
                    <p className="text-slate-600 font-semibold">Qur'an Course Image Placeholder</p>
                    <p className="text-sm text-slate-500 mt-2">Beautiful Qur'an imagery</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-100 border-2 border-emerald-300 rounded-lg mb-6">
                <Star className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-700 font-semibold text-sm">Most Popular Course</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900">
                Qur'an with Understanding
              </h1>
              <p className="text-xl text-slate-700 mb-8 leading-relaxed">
                Experience the beauty of Quranic recitation while comprehending its profound meanings. Our expert teachers guide you through Tajweed, Arabic grammar, and Tafsir in personalized 1-to-1 sessions.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border-2 border-slate-200 shadow-sm">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-slate-700 font-medium">Expert Teachers with Ijazah</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border-2 border-slate-200 shadow-sm">
                  <Play className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-slate-700 font-medium">Live 1-to-1 Sessions</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(user ? '/teachers' : '/signup', { state: user ? undefined : { autoRole: 'student' } })}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-lg font-bold transition shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>{user ? 'Browse Teachers' : 'Start Free 30-Min Session'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                {!user && (
                  <button
                    onClick={() => navigate('/teachers')}
                    className="px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-900 rounded-xl text-lg font-semibold transition shadow-sm"
                  >
                    Browse Teachers
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Experience Talbiyah Insights</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              After every session, receive comprehensive AI-generated study materials personalized to your learning
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <TalbiyahInsightsShowcase courseType="quran" />
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-10 border-2 border-slate-200 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">What You'll Learn</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Course Features</h2>
            <p className="text-xl text-slate-600">Everything you need for Quranic excellence</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1 rounded-2xl shadow-lg hover:shadow-xl transition">
                  <div className="bg-white h-full p-6 rounded-[14px]">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">What Our Students Say</h2>
            <p className="text-xl text-slate-600">Real experiences from our learning community</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-lg">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">{testimonial.text}</p>
                <div>
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
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
