import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  Clock,
  Star,
  CheckCircle,
  Lock,
  ArrowRight,
  DollarSign,
  Users,
  Shield,
  Zap,
  Target,
  Crown,
  ArrowLeft,
} from 'lucide-react';

interface TierLevel {
  tier: string;
  level: number;
  name: string;
  icon: string;
  color: string;
  teacherRate: number;
  studentPrice: number;
  hoursRequired: number;
  ratingRequired: number;
  requiresApproval: boolean;
  qualifications: string[];
  benefits: string[];
}

const tiers: TierLevel[] = [
  {
    tier: 'newcomer',
    level: 1,
    name: 'Newcomer',
    icon: '🌱',
    color: 'emerald',
    teacherRate: 4.00,
    studentPrice: 15.00,
    hoursRequired: 0,
    ratingRequired: 0,
    requiresApproval: false,
    qualifications: [
      'None - Starting point for new teachers',
      'Basic English communication',
      'Passion for teaching'
    ],
    benefits: [
      'Access to student bookings',
      'Flexible scheduling',
      'Platform training & resources',
      'Teacher community access'
    ]
  },
  {
    tier: 'apprentice',
    level: 2,
    name: 'Apprentice',
    icon: '📚',
    color: 'blue',
    teacherRate: 5.00,
    studentPrice: 15.00,
    hoursRequired: 50,
    ratingRequired: 4.0,
    requiresApproval: false,
    qualifications: [
      '50+ hours taught on platform',
      'Maintain 4.0+ star rating',
      '70%+ student retention rate'
    ],
    benefits: [
      'All Newcomer benefits',
      'Monthly bonus eligible',
      'Priority in student matching',
      '£50 tier unlock bonus'
    ]
  },
  {
    tier: 'skilled',
    level: 3,
    name: 'Skilled',
    icon: '🎯',
    color: 'purple',
    teacherRate: 6.00,
    studentPrice: 15.00,
    hoursRequired: 150,
    ratingRequired: 4.5,
    requiresApproval: false,
    qualifications: [
      '150+ hours taught on platform',
      'Maintain 4.5+ star rating',
      '75%+ student retention rate',
      '20+ completed lessons'
    ],
    benefits: [
      'All Apprentice benefits',
      'Featured profile badge',
      'Priority support',
      'Higher visibility in search',
      '£100 tier unlock bonus'
    ]
  },
  {
    tier: 'expert',
    level: 4,
    name: 'Expert',
    icon: '🏆',
    color: 'amber',
    teacherRate: 7.00,
    studentPrice: 16.00,
    hoursRequired: 250,
    ratingRequired: 4.5,
    requiresApproval: true,
    qualifications: [
      'Ijazah in Quran OR Islamic degree',
      'OR 5+ years teaching experience',
      'Fluent English (C1+ level)',
      'Verified credentials',
      'Admin interview passed'
    ],
    benefits: [
      'All Skilled benefits',
      'Dedicated student coordinator',
      'Premium student priority',
      'Custom availability rules',
      '£200 tier unlock bonus'
    ]
  },
  {
    tier: 'master',
    level: 5,
    name: 'Master',
    icon: '💎',
    color: 'pink',
    teacherRate: 8.00,
    studentPrice: 16.00,
    hoursRequired: 500,
    ratingRequired: 4.7,
    requiresApproval: true,
    qualifications: [
      'Multiple Ijazahs (Quran + Qira\'at)',
      'Al-Azhar University degree OR equivalent',
      'Native/Near-native English',
      'Exceptional teaching record',
      'Admin interview + demonstration'
    ],
    benefits: [
      'All Expert benefits',
      'Elite teacher badge',
      'Platform promotion & marketing',
      'VIP support line',
      '£500 tier unlock bonus',
      'Ability to set custom premium pricing'
    ]
  }
];

const getTierColor = (color: string) => {
  const colors: Record<string, { bg: string, border: string, text: string, accent: string }> = {
    emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', accent: 'text-emerald-300' },
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', accent: 'text-blue-300' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', accent: 'text-purple-300' },
    amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', accent: 'text-amber-300' },
    pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400', accent: 'text-pink-300' },
  };
  return colors[color] || colors.emerald;
};

export default function TeacherTierInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-full mb-4">
            <Crown className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">Teacher Tier System</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Path to Excellence
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Progress through five tiers as you teach, grow your skills, and increase your earnings.
            Each tier unlocks better pay, exclusive benefits, and recognition.
          </p>
        </div>

        {/* How it Works */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-cyan-400" />
            How Progression Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg flex-shrink-0">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Teach & Build Hours</h3>
                <p className="text-sm text-slate-400">
                  Complete lessons and accumulate teaching hours on the platform. Your progress is tracked automatically.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg flex-shrink-0">
                <Star className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Maintain High Quality</h3>
                <p className="text-sm text-slate-400">
                  Deliver excellent lessons to earn 5-star reviews. Higher tiers require higher ratings.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Auto-Promote or Apply</h3>
                <p className="text-sm text-slate-400">
                  Tiers 1-3 promote automatically. Expert & Master require credential verification and approval.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="space-y-8 mb-12">
          {tiers.map((tier, index) => {
            const colorScheme = getTierColor(tier.color);
            const isLocked = tier.requiresApproval;

            return (
              <div
                key={tier.tier}
                className={`bg-slate-800 rounded-xl shadow-lg border ${colorScheme.border} p-8 relative overflow-hidden`}
              >
                {/* Tier Level Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 ${colorScheme.bg} border ${colorScheme.border} rounded-full text-sm font-medium ${colorScheme.text}`}>
                    Level {tier.level}
                  </div>
                </div>

                {/* Tier Header */}
                <div className="flex items-start gap-6 mb-6">
                  <div className={`text-6xl ${colorScheme.bg} p-4 rounded-2xl border ${colorScheme.border}`}>
                    {tier.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-3xl font-bold ${colorScheme.accent} mb-2 flex items-center gap-3`}>
                      {tier.name}
                      {isLocked && <Lock className="w-6 h-6 text-slate-500" />}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <DollarSign className="w-4 h-4" />
                        <span>Earn <strong className={colorScheme.text}>£{tier.teacherRate.toFixed(2)}/hour</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Users className="w-4 h-4" />
                        <span>Students pay £{tier.studentPrice.toFixed(2)}/hour</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-cyan-400" />
                      Requirements
                    </h4>
                    <div className="space-y-2">
                      {tier.hoursRequired > 0 && (
                        <div className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorScheme.text}`} />
                          <span>{tier.hoursRequired}+ hours taught</span>
                        </div>
                      )}
                      {tier.ratingRequired > 0 && (
                        <div className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorScheme.text}`} />
                          <span>{tier.ratingRequired}+ star rating</span>
                        </div>
                      )}
                      {tier.qualifications.map((qual, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorScheme.text}`} />
                          <span>{qual}</span>
                        </div>
                      ))}
                      {isLocked && (
                        <div className="flex items-start gap-2 text-sm text-amber-400 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span><strong>Manual Approval Required</strong> - Submit application after meeting requirements</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      Benefits
                    </h4>
                    <div className="space-y-2">
                      {tier.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Arrow */}
                {index < tiers.length - 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="p-3 bg-slate-900 rounded-full">
                      <ArrowRight className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-xl shadow-lg border border-cyan-500/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Start Your Journey?</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            View your current tier status, track your progress towards the next level, and see how much you can earn.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/teacher/earnings')}
              className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              View My Progress
            </button>
            <button
              onClick={() => navigate('/apply-to-teach')}
              className="px-6 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Not a teacher yet? Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
