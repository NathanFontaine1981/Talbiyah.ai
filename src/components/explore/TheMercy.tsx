import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TheMercyProps {
  onComplete: () => void;
  onBack?: () => void;
}

interface MercyScene {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  content: React.ReactNode;
}

const scenes: MercyScene[] = [
  {
    id: 'the-mercy',
    title: 'The Mercy',
    icon: <Heart className="w-10 h-10 text-emerald-400" />,
    iconBg: 'bg-emerald-500/20',
    content: (
      <div className="space-y-5 text-center">
        <p className="text-slate-300 leading-relaxed text-lg">
          But what if I'm weak? What if I can't follow all the rules?
        </p>
        <p className="text-slate-300 leading-relaxed">
          That's okay. Allah knows this. <span className="text-white font-semibold">He created you — He knows you were created weak.</span>
        </p>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-emerald-700/30">
          <p className="text-lg font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
            كُلُّ ابْنِ آدَمَ خَطَّاءٌ وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ
          </p>
          <p className="text-white italic">
            "Every son of Adam sins, and the best of sinners are those who repent."
          </p>
          <p className="text-slate-500 text-sm mt-2">— Hadith (Tirmidhi)</p>
        </div>
        <p className="text-slate-300 leading-relaxed">
          The best of you are not those who never make mistakes.
          They are the <span className="text-emerald-400 font-semibold">repentant sinners</span> — those who fall, ask forgiveness, and strive to correct themselves.
        </p>
        <p className="text-slate-400">
          You will always find Allah Forgiving and Merciful — if you have the correct intention.
        </p>
      </div>
    ),
  },
  {
    id: 'the-reality',
    title: 'The Reality',
    icon: <AlertTriangle className="w-10 h-10 text-rose-400" />,
    iconBg: 'bg-rose-500/20',
    content: (
      <div className="space-y-5 text-center">
        <p className="text-slate-300 leading-relaxed text-lg">
          Ask yourself: what reason do I now have to not be convinced that all this is the truth?
        </p>
        <div className="space-y-3">
          {[
            'You never asked to be here — but you are here.',
            'You are not in control of your organs, your eyes, your sleeping.',
            'One thing you know for certain: you will taste death one day.',
          ].map((point, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-slate-300">{point}</p>
            </div>
          ))}
        </div>
        <p className="text-slate-300 leading-relaxed">
          This book is telling you what you need to do to <span className="text-white font-semibold">prepare for when that day comes</span>.
        </p>
      </div>
    ),
  },
];

function getAudioUrl(sceneId: string): string {
  const { data } = supabase.storage.from('explore-audio').getPublicUrl(`nathan-${sceneId}.mp3`);
  return data.publicUrl;
}

export default function TheMercy({ onComplete, onBack }: TheMercyProps) {
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
