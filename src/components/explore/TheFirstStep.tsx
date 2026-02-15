import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Heart, BookOpen, Users, Sparkles, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TheFirstStepProps {
  onTakeStep: () => void;
  onNeedMoreTime: () => void;
  onLearnMore: () => void;
  onBack?: () => void;
}

const COUNTRY_CODES = [
  { code: '+44', label: 'UK (+44)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+966', label: 'SA (+966)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+92', label: 'PK (+92)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+60', label: 'MY (+60)' },
  { code: '+62', label: 'ID (+62)' },
  { code: '+90', label: 'TR (+90)' },
  { code: '+20', label: 'EG (+20)' },
  { code: '+33', label: 'FR (+33)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+61', label: 'AU (+61)' },
  { code: '+27', label: 'ZA (+27)' },
  { code: '+234', label: 'NG (+234)' },
];

export const TheFirstStep = ({ onTakeStep, onNeedMoreTime, onLearnMore, onBack }: TheFirstStepProps) => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'intro' | 'acknowledgment' | 'shahada' | 'paths'>('intro');
  const [acknowledged, setAcknowledged] = useState(false);

  // Shahada form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+44');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const handleShahadaSubmit = async () => {
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Please enter your name');
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError('Please enter your phone number');
      return;
    }

    setSubmitting(true);
    try {
      // Insert into shahada_requests table
      const { error: insertError } = await supabase
        .from('shahada_requests')
        .insert({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          phone_country_code: countryCode,
          email: email.trim() || null,
        });

      if (insertError) {
        console.error('Error saving shahada request:', insertError);
        setFormError('Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      // Send notification email
      await supabase.functions.invoke('notify-shahada-request', {
        body: {
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          phone_country_code: countryCode,
          email: email.trim() || undefined,
        },
      });

      setSubmitted(true);

      // Navigate to Unshakeable Foundations after 3 seconds
      setTimeout(() => {
        navigate('/new-muslim');
      }, 3000);
    } catch (err) {
      console.error('Error submitting shahada request:', err);
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-20 md:top-4 left-6 flex items-center gap-1 text-slate-400 hover:text-white transition z-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      <div className="max-w-xl w-full">
        <AnimatePresence mode="wait">
          {/* Stage 1: Intro - What you've seen */}
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-3xl font-serif text-white mb-6">
                The First Step
              </h2>

              <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  You've seen the evidence. You understand there's a <span className="text-amber-400 font-semibold">Creator</span>.
                </p>
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  That's not a small thing—most people never get this far.
                </p>
                <p className="text-lg text-white leading-relaxed">
                  The question now is: <span className="text-amber-300">what will you do with this knowledge?</span>
                </p>
              </div>

              <button
                onClick={() => setStage('acknowledgment')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Stage 2: The Acknowledgment - Articles of Faith */}
          {stage === 'acknowledgment' && (
            <motion.div
              key="acknowledgment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-emerald-400" />
              </div>

              <h2 className="text-3xl font-serif text-white mb-2">
                The Articles of Faith
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                What a Muslim believes
              </p>

              <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-700 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">1.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in Allah</p>
                      <p className="text-slate-300 text-sm">One God—the Creator, with no partners</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">2.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Angels</p>
                      <p className="text-slate-300 text-sm">Beings of light who carry out Allah's commands</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">3.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Books</p>
                      <p className="text-slate-300 text-sm">The Quran, Torah, Gospel, Psalms—all originally from Allah</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">4.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Prophets</p>
                      <p className="text-slate-300 text-sm">From Adam to Muhammad ﷺ—all sent with the same message</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">5.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Day of Judgment</p>
                      <p className="text-slate-300 text-sm">We will all be held accountable for our choices</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">6.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in Divine Decree</p>
                      <p className="text-slate-300 text-sm">Allah's knowledge encompasses all—past, present, and future</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/40 to-amber-900/40 rounded-2xl p-6 border-2 border-emerald-500/40 mb-6">
                <Heart className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-white text-lg leading-relaxed text-center">
                  If you believe these, you <span className="text-emerald-400 font-bold">already</span> have <span className="text-amber-300 font-bold">Iman</span> (faith) in your heart.
                </p>
                <p className="text-slate-300 text-base mt-2 text-center">
                  The shahada is simply the <span className="text-white font-semibold">declaration</span> of what you already believe.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setAcknowledged(true);
                    setStage('shahada');
                  }}
                  className="w-full px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-lg font-semibold transition"
                >
                  Yes, I believe this
                </button>

                <button
                  onClick={() => setStage('paths')}
                  className="w-full px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl transition"
                >
                  I'm still thinking
                </button>
              </div>
            </motion.div>
          )}

          {/* Stage 3: The Shahada */}
          {stage === 'shahada' && (
            <motion.div
              key="shahada"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {!submitted ? (
                <>
                  {/* Shahada display */}
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-emerald-400" />
                    </div>

                    <h2 className="text-2xl font-serif text-white mb-6">
                      The Shahada
                    </h2>

                    <div className="bg-gradient-to-br from-emerald-900/30 to-amber-900/30 rounded-2xl p-6 border-2 border-emerald-500/30 mb-6">
                      {/* Arabic */}
                      <p className="text-3xl md:text-4xl text-amber-300 leading-relaxed mb-4" dir="rtl" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>
                        أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ
                      </p>

                      {/* Transliteration */}
                      <p className="text-emerald-300 italic text-base mb-3">
                        "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan rasul Allah"
                      </p>

                      {/* Translation */}
                      <p className="text-white text-base">
                        "I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah"
                      </p>
                    </div>

                    {/* What this means */}
                    <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-700 mb-6 text-left">
                      <h3 className="text-white font-semibold mb-3 text-center">What it means to be Muslim</h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <p className="text-slate-300 text-sm">You are choosing to <span className="text-white font-medium">submit to the One Creator</span> who made you and everything around you</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <p className="text-slate-300 text-sm">You join a <span className="text-white font-medium">family of nearly 2 billion people</span> worldwide who share this declaration</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <p className="text-slate-300 text-sm">All your previous sins are <span className="text-white font-medium">completely wiped clean</span>—you start with a fresh slate</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">&#x2022;</span>
                          <p className="text-slate-300 text-sm">You don't need to be perfect—Islam is a <span className="text-white font-medium">journey of growth</span>, one step at a time</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact form */}
                  <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-700 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Phone className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-white font-semibold">Request a Guidance Call</h3>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">
                      We'd love to speak with you personally and help you through this beautiful moment. Leave your details and we'll call you.
                    </p>

                    <div className="space-y-3 text-left">
                      {/* Name */}
                      <div>
                        <label className="text-slate-300 text-sm mb-1 block">Your name *</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="text-slate-300 text-sm mb-1 block">Phone number *</label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="px-3 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition text-sm"
                          >
                            {COUNTRY_CODES.map(({ code, label }) => (
                              <option key={code} value={code}>{label}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Phone number"
                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>
                      </div>

                      {/* Email (optional) */}
                      <div>
                        <label className="text-slate-300 text-sm mb-1 block">Email <span className="text-slate-500">(optional)</span></label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>

                    {formError && (
                      <p className="text-red-400 text-sm mt-3">{formError}</p>
                    )}

                    <button
                      onClick={handleShahadaSubmit}
                      disabled={submitting}
                      className="w-full mt-4 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Phone className="w-5 h-5" />
                          Request a Call
                        </>
                      )}
                    </button>
                  </div>

                  {/* Skip link */}
                  <button
                    onClick={() => navigate('/new-muslim')}
                    className="text-slate-400 hover:text-slate-300 text-sm transition underline underline-offset-4"
                  >
                    I'd like to continue on my own
                  </button>
                </>
              ) : (
                /* Success state */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>

                  <h2 className="text-2xl font-serif text-white mb-3">
                    Welcome to Islam
                  </h2>

                  <p className="text-emerald-300 text-lg mb-2">
                    May Allah bless your journey.
                  </p>
                  <p className="text-slate-300 mb-6">
                    We'll be in touch very soon, {fullName.split(' ')[0]}.
                  </p>

                  <p className="text-slate-400 text-sm mb-4">
                    Taking you to your first course...
                  </p>

                  <button
                    onClick={() => navigate('/new-muslim')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition"
                  >
                    Go to Unshakeable Foundations
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Stage 4: Paths forward */}
          {stage === 'paths' && (
            <motion.div
              key="paths"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {acknowledged && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-8"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-300 text-lg">
                    That's a beautiful first step.
                  </p>
                </motion.div>
              )}

              <h2 className="text-2xl font-serif text-white text-center mb-6">
                {acknowledged ? "What's Next?" : "Take Your Time"}
              </h2>

              <div className="space-y-4">
                {/* Path 1: Learn more about the messenger */}
                <button
                  onClick={onLearnMore}
                  className="w-full bg-slate-900/70 hover:bg-slate-800/70 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Learn About the Messenger
                      </h3>
                      <p className="text-slate-300 text-sm">
                        Continue to the curriculum and learn about Muhammad ﷺ and the complete path
                      </p>
                    </div>
                  </div>
                </button>

                {/* Path 2: Practical guidance */}
                <button
                  onClick={onNeedMoreTime}
                  className="w-full bg-slate-900/70 hover:bg-slate-800/70 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Practical Life Guidance
                      </h3>
                      <p className="text-slate-300 text-sm">
                        See how the Quran's wisdom applies to everyday life challenges
                      </p>
                    </div>
                  </div>
                </button>

                {/* Path 3: Return to dashboard */}
                <button
                  onClick={onTakeStep}
                  className="w-full bg-slate-800/50 hover:bg-slate-800/70 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition text-center"
                >
                  <p className="text-slate-300">
                    Return to Dashboard
                  </p>
                </button>
              </div>

              <p className="text-center text-white/80 text-sm mt-6">
                When you're ready to learn about the full shahada, we'll be here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TheFirstStep;
