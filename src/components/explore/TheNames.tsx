import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, Clock, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TheNamesProps {
  onComplete: () => void;
  onBack?: () => void;
}

interface NameScene {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  content: React.ReactNode;
}

const scenes: NameScene[] = [
  {
    id: 'the-names',
    title: 'The Names',
    icon: <Globe className="w-10 h-10 text-purple-400" />,
    iconBg: 'bg-purple-500/20',
    content: (
      <div className="space-y-5 text-center">
        <p className="text-slate-300 leading-relaxed">
          The name <span className="text-amber-300 font-semibold">"Allah"</span> might sound foreign to you. But consider this:
        </p>
        <p className="text-slate-300 leading-relaxed">
          Jesus spoke Aramaic. What name did he use for God?
        </p>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-purple-700/30">
          <p className="text-2xl text-white font-semibold">Alaha / Elah</p>
          <p className="text-slate-400 text-sm mt-1">The Aramaic word for God — almost identical to "Allah"</p>
        </div>
        <p className="text-slate-300 leading-relaxed">
          The Aramaic language doesn't have the letter <span className="text-white font-semibold">J</span>.
          So what was Jesus' actual name in his own language?
        </p>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-purple-700/30">
          <p className="text-2xl text-white font-semibold">Yeshua / Isa</p>
          <p className="text-slate-400 text-sm mt-1">The same name used in the Quran: عيسى (Isa)</p>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Jesus was born in Jerusalem — the Middle East. Most of the prophet names you know have been Latinised.
          That's why the original names feel foreign.
        </p>
      </div>
    ),
  },
  {
    id: 'the-revelation',
    title: 'The 23-Year Revelation',
    icon: <Clock className="w-10 h-10 text-purple-400" />,
    iconBg: 'bg-purple-500/20',
    content: (
      <div className="space-y-5 text-center">
        <p className="text-slate-300 leading-relaxed">
          This book was revealed over <span className="text-white font-semibold">23 years</span> — not in order, but as situations arose.
          Yet when compiled, it flows perfectly.
        </p>
        <p className="text-slate-300 leading-relaxed">
          No contradictions. No revisions. No <span className="text-white font-medium">"I was wrong earlier."</span>
        </p>
        <p className="text-slate-300 leading-relaxed">
          The Arabs of that era were masters of language. They prided themselves on their poetry, their ability to rhyme,
          their powerful memorisation. This was their boast.
        </p>
        <p className="text-slate-300 leading-relaxed">
          Yet the Quran <span className="text-amber-300 font-semibold">silenced them</span>.
          They could not produce anything like it. The challenge still stands today.
        </p>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-purple-700/30">
          <p className="text-slate-300 leading-relaxed text-sm">
            It has a rhythmic flow, soothing to the ears — yet it explains everything about life, death, law, history, and the unseen.
            No filler. No padding. <span className="text-white font-medium">Straight to the point.</span>
          </p>
        </div>
      </div>
    ),
  },
];

function getAudioUrl(sceneId: string): string {
  const { data } = supabase.storage.from('explore-audio').getPublicUrl(`nathan-${sceneId}.mp3`);
  return data.publicUrl;
}

export default function TheNames({ onComplete, onBack }: TheNamesProps) {
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
