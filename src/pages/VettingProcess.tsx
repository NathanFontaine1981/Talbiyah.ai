import { Link } from 'react-router-dom';
import {
  FileText,
  Video,
  CheckCircle,
  Heart,
  GraduationCap,
  Shield,
  Users,
  Clock,
  Award,
  TrendingUp,
  ChevronRight,
  Star
} from 'lucide-react';
import { CareerLadder, TEACHER_TIERS } from '../components/teachers';

export default function VettingProcess() {
  const stats = [
    { value: '15%', label: 'Accepted', description: 'Only the best join our team' },
    { value: '2-3', label: 'Weeks', description: 'Thorough vetting process' },
    { value: 'Annual', label: 'Re-cert', description: 'Ongoing quality assurance' },
    { value: '100%', label: 'Trained', description: 'Platform methodology training' }
  ];

  const steps = [
    {
      number: 1,
      title: 'Application & Resume Review',
      icon: FileText,
      color: 'blue',
      description: 'Every teacher submits their qualifications, teaching experience, and educational background.',
      details: [
        'Islamic knowledge and qualifications',
        'Teaching experience (minimum 1 year preferred)',
        'English communication skills',
        'Subject matter expertise'
      ],
      filterRate: '40% of applicants are filtered at this stage'
    },
    {
      number: 2,
      title: 'Demo Lesson Assessment',
      icon: Video,
      color: 'purple',
      description: 'Candidates teach a live 30-minute demo lesson to our evaluation team.',
      details: [
        'Teaching clarity and methodology',
        'Student engagement techniques',
        'Patience and communication style',
        'Technical proficiency with online teaching'
      ],
      filterRate: '25% of remaining candidates are filtered here'
    },
    {
      number: 3,
      title: 'Background Verification',
      icon: CheckCircle,
      color: 'green',
      description: 'We verify all claimed qualifications and conduct reference checks.',
      details: [
        'Qualification certificates verified',
        'References from previous students/institutions',
        'Identity verification'
      ]
    },
    {
      number: 4,
      title: 'Gentleness Evaluation',
      icon: Heart,
      color: 'pink',
      description: 'THE TAJ STANDARD - Named after our founder\'s mentor, the Taj Standard is our commitment to gentle, patient teaching.',
      details: [
        'Patience with struggling students',
        'Encouraging communication style',
        'Ability to adapt to different learning paces',
        'Positive reinforcement techniques'
      ],
      filterRate: 'Teachers who don\'t meet this standard are not accepted, regardless of qualifications',
      isSpecial: true
    },
    {
      number: 5,
      title: 'Platform Training',
      icon: GraduationCap,
      color: 'amber',
      description: 'Accepted teachers complete comprehensive training on our methodology.',
      details: [
        'Talbiyah methodology (Understanding → Fluency → Memorization)',
        'Platform and technology training',
        'Smart-Track system usage',
        'Student progress tracking',
        'Best practices for online teaching'
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; light: string }> = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50' },
      green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' },
      pink: { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-200', light: 'bg-pink-50' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Our Vetting Process
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How We Select Our Teachers
          </h1>
          <p className="text-xl md:text-2xl text-emerald-100 mb-4">
            Only <span className="font-bold text-white">15%</span> of applicants join the Talbiyah family.
          </p>
          <p className="text-lg text-emerald-100">
            We don't hire gigs. We build careers.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-1">
                  {stat.value}
                </div>
                <div className="font-semibold text-gray-900">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Step Process */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our 5-Step Vetting Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every teacher goes through a rigorous evaluation to ensure they meet our high standards for knowledge, pedagogy, and character.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step) => {
              const colors = getColorClasses(step.color);
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className={`bg-white rounded-2xl border ${step.isSpecial ? 'border-pink-300 ring-2 ring-pink-100' : 'border-gray-200'} overflow-hidden`}
                >
                  {/* Step header */}
                  <div className={`${colors.light} px-6 py-4 border-b ${colors.border}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${colors.bg} text-white rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 font-medium">Step {step.number}</div>
                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="p-6">
                    <p className="text-gray-700 mb-4">{step.description}</p>

                    {step.isSpecial && (
                      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4">
                        <p className="text-pink-800 font-medium">
                          "No harshness. No shouting. Only wisdom and patience."
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">We assess:</h4>
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-600">
                            <CheckCircle className={`w-5 h-5 ${colors.text} mt-0.5 flex-shrink-0`} />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {step.filterRate && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
                        <span className="text-red-500">❌</span>
                        {step.filterRate}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Career Ladder Section */}
      <section className="py-16 md:py-24 bg-white border-t border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Career Growth
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Teachers Who Build Careers
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Unlike gig platforms where teachers come and go, Talbiyah teachers are on a career path. Our tier system rewards excellence and commitment.
            </p>
          </div>

          {/* Tier visualization */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            <div className="flex justify-between items-center mb-8 overflow-x-auto pb-4">
              {Object.entries(TEACHER_TIERS).map(([key, tier], index) => (
                <div key={key} className="flex flex-col items-center min-w-[100px]">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                    index === 0 ? 'bg-gray-200' :
                    index === 1 ? 'bg-blue-100' :
                    index === 2 ? 'bg-purple-100' :
                    index === 3 ? 'bg-amber-100' :
                    'bg-pink-100'
                  }`}>
                    {tier.icon}
                  </div>
                  <span className="font-semibold text-gray-900">{tier.name}</span>
                  <span className="text-xs text-gray-500">{tier.shortDescription}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-gray-700">
              <p>Teachers advance through tiers based on:</p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <li className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <span>Hours taught</span>
                </li>
                <li className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <span>Student retention rate</span>
                </li>
                <li className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                  <Star className="w-5 h-5 text-emerald-500" />
                  <span>Quality of teaching</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-emerald-600 mb-2">2+ years</div>
              <div className="text-gray-700">Average teacher tenure at Talbiyah</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="text-3xl font-bold text-emerald-600 mb-2">78%</div>
              <div className="text-gray-700">Student-teacher retention rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Taj Story */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Why Gentleness Matters
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Taj Story
            </h2>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200 p-8 md:p-10">
            <div className="text-6xl mb-6 text-center">💚</div>
            <blockquote className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
              <p className="mb-4">
                "When I first became Muslim, I was lost and overwhelmed. Brother Taj never once raised his voice. He never made me feel stupid for not knowing.
              </p>
              <p className="mb-4">
                He guided me with wisdom and patience. That's what every student deserves. That's the standard every Talbiyah teacher must meet."
              </p>
            </blockquote>
            <div className="text-center">
              <p className="font-semibold text-gray-900">— Nathan, Founder</p>
            </div>
          </div>

          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              The Taj Standard
            </h3>
            <p className="text-gray-600 mb-4">
              Named after Brother Taj, this is our commitment to gentle, patient teaching. Every Talbiyah teacher pledges to:
            </p>
            <ul className="space-y-3">
              {[
                'Never use harsh words or raise their voice',
                'Celebrate small wins and progress',
                'Adapt to each student\'s learning pace',
                'Create a safe space for making mistakes',
                'Focus on understanding, not just memorization'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-3.5 h-3.5 text-pink-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Learn with us */}
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Want to Learn With Us?
              </h3>
              <p className="text-gray-600 mb-6">
                Book a free diagnostic assessment and experience our vetted teachers firsthand.
              </p>
              <Link
                to="/diagnostic"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Book Free Assessment
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Teach with us */}
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Want to Teach With Us?
              </h3>
              <p className="text-gray-600 mb-6">
                Join our team of vetted, career-focused teachers and make a real difference.
              </p>
              <Link
                to="/become-a-teacher"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
              >
                Apply Now
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
