import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle, Star, Users, ArrowLeft, ArrowRight, Play, BookOpen } from 'lucide-react';
import TalbiyahInsightsShowcase from '../components/TalbiyahInsightsShowcase';
import { supabase } from '../lib/supabaseClient';

export default function CourseArabic() {
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
      iconSrc: '/images/icons/icon-conversation.png',
      title: 'Conversational Practice',
      description: 'Develop fluency through interactive dialogue with native speakers'
    },
    {
      iconSrc: '/images/icons/icon-arabic.png',
      title: 'Classical & Modern Arabic',
      description: 'Master both Quranic Arabic and contemporary Standard Arabic'
    },
    {
      iconSrc: '/images/icons/icon-personalize.png',
      title: 'AI Study Tools',
      description: 'Personalised flashcards and quizzes generated from your lessons'
    },
    {
      iconSrc: '/images/icons/icon-mastery.png',
      title: 'Structured Curriculum',
      description: 'Progress from beginner to advanced with proven methods'
    }
  ];

  const benefits = [
    'Read and understand the Quran in its original language',
    'Communicate confidently in Arabic-speaking environments',
    'Access authentic Islamic texts without translation',
    'Learn Arabic script, grammar, and vocabulary systematically',
    'Practice listening, speaking, reading, and writing',
    'Understand nuances lost in translation'
  ];

  const testimonials = [
    {
      name: 'Fatima R.',
      role: 'Student',
      text: 'I can finally read Arabic newspapers and understand Friday khutbahs without translation. The progress has been incredible.',
      rating: 5
    },
    {
      name: 'Omar H.',
      role: 'Professional',
      text: 'Learning Arabic opened up a whole new world. I can now study Islamic texts directly and appreciate their depth.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/images/icons/icon-arabic.png" alt="Arabic" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-bold text-gray-900">Talbiyah.ai</span>
          </div>

          <button
            onClick={() => navigate('/courses-overview')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Courses</span>
          </button>
        </div>
      </nav>

      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="relative bg-gradient-to-br from-blue-500 to-emerald-600 rounded-3xl p-1 mb-8 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-600 opacity-20 blur-2xl"></div>
                <div className="relative rounded-[22px] h-80 overflow-hidden">
                  <img
                    src="/arabiccourse.jpg"
                    alt="Arabic Language"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg px-6 py-3">
                      <p className="text-blue-300 font-bold text-xl">Arabic Language</p>
                      <p className="text-blue-400/80 text-sm mt-1">Classical & Modern Standard Arabic</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg mb-6">
                <img src="/images/icons/icon-arabic.png" alt="Arabic" className="w-5 h-5 object-contain" />
                <span className="text-blue-700 font-semibold text-sm">Comprehensive Language Program</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                Arabic Language
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Master the language of the Quran from basics to fluency. Our structured curriculum covers classical Arabic for religious texts and Modern Standard Arabic for contemporary communication.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700 font-medium">Native Speaking Teachers</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                  <Play className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700 font-medium">Interactive Lessons</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(user ? '/teachers' : '/signup', { state: user ? undefined : { autoRole: 'student' } })}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-lg font-bold transition shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>{user ? 'Browse Teachers' : 'Start Free Assessment'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                {user && (
                  <button
                    onClick={() => navigate('/courses/arabic-progress')}
                    className="px-8 py-4 bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-xl text-lg font-bold transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>My Progress</span>
                  </button>
                )}
                {!user && (
                  <button
                    onClick={() => navigate('/teachers')}
                    className="px-8 py-4 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-900 rounded-xl text-lg font-semibold transition shadow-sm"
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Experience Talbiyah Insights</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              After every session, receive comprehensive AI-generated study materials with vocabulary integration
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <TalbiyahInsightsShowcase courseType="arabic" />
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-10 border-2 border-gray-200 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">What You'll Learn</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Course Features</h2>
            <p className="text-xl text-gray-600">Comprehensive Arabic education at every level</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              return (
                <div key={index} className="bg-gradient-to-br from-blue-500 to-emerald-600 p-1 rounded-2xl shadow-lg hover:shadow-xl transition">
                  <div className="bg-white h-full p-6 rounded-[14px]">
                    <div className="w-16 h-16 mb-4">
                      <img src={feature.iconSrc} alt={feature.title} className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Students Say</h2>
            <p className="text-xl text-gray-600">Real experiences from our learning community</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.text}</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Unlock the Language?
          </h2>
          <p className="text-xl text-blue-50 mb-8">
            Take your free diagnostic assessment. No credit card required.
          </p>
          <button
            onClick={() => navigate('/signup', { state: { autoRole: 'student' } })}
            className="px-10 py-5 bg-white hover:bg-blue-50 text-blue-600 rounded-xl text-xl font-bold transition shadow-2xl inline-flex items-center space-x-2"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}
