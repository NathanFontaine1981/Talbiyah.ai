import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gift, Users, Trophy, Heart, Send, BookOpen, ChevronLeft, Sparkles, Award } from 'lucide-react';

export default function ReferralInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold transition"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Gift className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Referral Programme</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Give the Gift of Knowledge.<br />Earn Rewards Forever.
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Invite friends to Talbiyah.ai. You earn free lessons. They get the best start.
            Plus, turn your credits into Sadaqah Jariyah.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-emerald-600 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            <span>Get My Referral Link</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, transparent, and rewarding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm h-full">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6">
                  1
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-3">Share Your Link</h3>
                <p className="text-gray-600">
                  Send your unique referral link to friends and family.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm h-full">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6">
                  2
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-3">They Start Learning</h3>
                <p className="text-gray-600">
                  When they finish their first paid lesson, you earn <strong className="text-emerald-600">1 Free Credit</strong> instantly.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                <ArrowRight className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm h-full">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6">
                  3
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-3">Earn Forever</h3>
                <p className="text-gray-600">
                  For every <strong className="text-emerald-600">10 hours</strong> they learn, you earn another <strong className="text-emerald-600">1 Free Credit</strong>. There is no limit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Bonuses */}
      <div className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Unlock Milestone Bonuses</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The more you share, the more you unlock
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Milestone 1 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-2">Refer 5 Students</h3>
              <div className="bg-emerald-500 text-white rounded-full px-4 py-2 inline-block mt-4">
                <span className="font-bold">Unlock 5 Bonus Credits</span>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border border-amber-200 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-2">Refer 10 Students</h3>
              <div className="space-y-2 mt-4">
                <div className="bg-amber-500 text-white rounded-full px-4 py-2 inline-block">
                  <span className="font-bold">Unlock 10 Bonus Credits</span>
                </div>
                <p className="text-amber-700 font-semibold">+ 'Community Leader' Badge</p>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-2">Refer 20 Students</h3>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-4 py-2 inline-block mt-4">
                <span className="font-bold">Unlock Lifetime Platinum Status</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Ways to Use Your Credits */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">3 Ways to Use Your Credits</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your credits, your choice
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Option 1: Book Free Lessons */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Book Free Lessons</h3>
              <p className="text-gray-600">
                Use credits for your own 1-on-1 Quran or Arabic classes. <strong className="text-emerald-600">1 Credit = 1 Hour.</strong>
              </p>
            </div>

            {/* Option 2: Gift to a Friend */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Send className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Gift to a Friend</h3>
              <p className="text-gray-600">
                Transfer your credits to a family member to help them start their learning journey.
              </p>
            </div>

            {/* Option 3: Donate (Sadaqah Jariyah) */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-full">Sadaqah Jariyah</span>
              </div>
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-3">Donate to Scholarship Fund</h3>
              <p className="text-gray-600">
                Don't need lessons? Donate your credits to our <strong className="text-pink-600">'Revert Scholarship Fund'</strong>.
                We give your free hours to new Muslims who cannot afford tuition.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms / Credit Info */}
      <div className="bg-emerald-50 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border border-emerald-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Credit Terms</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-gray-700">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span><strong>1 Credit = 1 Free Lesson Hour</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span><strong>Credits never expire</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span><strong>Valid for Quran, Arabic, or Islamic Studies</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Sharing?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Sign up for free and get your unique referral link. Every referral helps spread knowledge and earns you rewards.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-lg transition shadow-lg"
            >
              <span>Get My Referral Link</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-lg transition border border-white/20"
            >
              <span>Already have an account? Log in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Talbiyah.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
