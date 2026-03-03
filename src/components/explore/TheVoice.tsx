import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquare, BookOpen, Shield, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TheVoiceProps {
  onComplete: () => void;
  onBack?: () => void;
}

interface VoiceScene {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  content: React.ReactNode;
}

const scenes: VoiceScene[] = [
  {
    id: 'voice',
    title: 'The Voice',
    icon: <MessageSquare className="w-10 h-10 text-amber-400" />,
    iconBg: 'bg-amber-500/20',
    content: (
      <div className="space-y-5 text-center">
        <p className="text-slate-300 leading-relaxed text-lg">
          When you read the Quran, you instantly notice something strange.
          <span className="text-white font-semibold"> It doesn't speak like a person.</span>
        </p>
        <p className="text-slate-300 leading-relaxed">
          There are only two possibilities: either someone is trying to impersonate God,
          or <span className="text-amber-300 font-semibold">it really is God</span>.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Given all the evidence we've examined — facts no human could have known in the 7th century —
          we've ruled out human authorship. And humans don't speak with such assured knowledge.
        </p>
      </div>
    ),
  },
  {
    id: 'declaration',
    title: 'The Declaration',
    icon: <BookOpen className="w-10 h-10 text-blue-400" />,
    iconBg: 'bg-blue-500/20',
    content: (
      <div className="space-y-5 text-center">
        <p className="text-slate-300 leading-relaxed">
          The book wastes no time. In the very second chapter, it declares:
        </p>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-blue-700/30">
          <p className="text-xl font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
            ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ
          </p>
          <p className="text-white italic">
            "This is the Book about which there is no doubt, a guidance for those conscious of Allah."
          </p>
          <p className="text-slate-500 text-sm mt-2">— Surah Al-Baqarah, 2:2</p>
        </div>
        <p className="text-slate-300 leading-relaxed">
          No hesitation. No hedging. <span className="text-white font-semibold">Absolute certainty.</span>
        </p>
        <p className="text-slate-400">
          What human would stake their reputation on such a bold claim?
        </p>
      </div>
    ),
  },
  {
    id: 'the-promise',
    title: 'The Promise',
    icon: <Shield className="w-10 h-10 text-emerald-400" />,
    iconBg: 'bg-emerald-500/20',
    content: (
      <div className="space-y-5 text-center">
        <p className="text-slate-300 leading-relaxed">
          The Quran doesn't just claim to be from God — it promises it will <span className="text-white font-semibold">never be corrupted</span>:
        </p>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-emerald-700/30">
          <p className="text-xl font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
            إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ
          </p>
          <p className="text-white italic">
            "Indeed, it is We who sent down the Reminder, and indeed, We will be its Guardian."
          </p>
          <p className="text-slate-500 text-sm mt-2">— Surah Al-Hijr, 15:9</p>
        </div>
        <p className="text-slate-300 leading-relaxed">
          No other religious scripture makes this claim. And for good reason — it would be too easy to disprove.
          If even one word had been changed over 1,400 years, this promise would be shattered.
        </p>
        <p className="text-slate-400">
          Only someone who knows the future with certainty could make such a bold promise.
        </p>
      </div>
    ),
  },
];

function getAudioUrl(sceneId: string): string {
  const { data } = supabase.storage.from('explore-audio').getPublicUrl(`nathan-${sceneId}.mp3`);
  return data.publicUrl;
}

export default function TheVoice({ onComplete, onBack }: TheVoiceProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [audioMuted, setAudioMuted] = useState(() => {
    return localStorage.getItem('explore_audio_muted') === 'true';
  });
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scene = scenes[currentScene];
  const isLast = currentScene === scenes.length - 1;
  const isFirst = currentScene === 0;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAudioPlaying(false);
    }
    if (audioMuted) return;

    const audio = new Audio(getAudioUrl(scene.id));
    audioRef.current = audio;
    const onPlay = () => setAudioPlaying(true);
    const onEnd = () => setAudioPlaying(false);
    const onError = () => setAudioPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    const timer = setTimeout(() => { audio.play().catch(() => setAudioPlaying(false)); }, 600);
    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, [currentScene, audioMuted, scene.id]);

  const handleNext = () => {
    if (isLast) onComplete();
    else setCurrentScene(prev => prev + 1);
  };

  const handleBack = () => {
    if (isFirst) onBack?.();
    else setCurrentScene(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      {/* Audio toggle */}
      <div className="fixed top-20 right-6 z-40">
        <button
          onClick={() => {
            setAudioMuted(m => {
              const next = !m;
              localStorage.setItem('explore_audio_muted', String(next));
              if (next && audioRef.current) audioRef.current.pause();
              return next;
            });
          }}
          className="text-slate-400 hover:text-white transition p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50"
        >
          {audioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className={`w-5 h-5 ${audioPlaying ? 'animate-pulse text-amber-400' : ''}`} />}
        </button>
      </div>

      <div className="max-w-2xl w-full pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${scene.iconBg} mb-4`}>
                {scene.icon}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{scene.title}</h2>
              <p className="text-slate-500 text-sm mt-2">{currentScene + 1} / {scenes.length}</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
              {scene.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all"
          >
            <span>{isLast ? 'Continue' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
