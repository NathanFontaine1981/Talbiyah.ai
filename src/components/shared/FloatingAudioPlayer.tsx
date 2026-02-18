import { Volume2, Pause, Play, X, Loader2 } from 'lucide-react';
import { useTTS } from './TTSProvider';

export default function FloatingAudioPlayer() {
  const { isPlaying, isLoading, activeLabel, activeSectionId, pauseTTS, resumeTTS, stopTTS } = useTTS();

  if (!activeSectionId) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-violet-500/40 flex items-center space-x-4 animate-in slide-in-from-bottom-4">
      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Volume2 className="w-6 h-6" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">
          {isLoading ? 'Generating Audio...' : 'Now Playing'}
        </p>
        <p className="text-violet-200 text-sm truncate">{activeLabel}</p>
      </div>
      <button
        onClick={isPlaying ? pauseTTS : resumeTTS}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition disabled:opacity-50"
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </button>
      <button
        onClick={stopTTS}
        aria-label="Stop and close audio player"
        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
