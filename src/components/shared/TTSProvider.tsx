import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import FloatingAudioPlayer from './FloatingAudioPlayer';

interface TTSState {
  activeSectionId: string | null;
  isLoading: boolean;
  isPlaying: boolean;
  activeLabel: string;
}

interface TTSContextValue extends TTSState {
  playTTS: (text: string, sectionId: string, label?: string, language?: string) => Promise<void>;
  pauseTTS: () => void;
  resumeTTS: () => void;
  stopTTS: () => void;
}

const TTSContext = createContext<TTSContextValue | null>(null);

export function useTTS() {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error('useTTS must be used within a TTSProvider');
  return ctx;
}

export default function TTSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TTSState>({
    activeSectionId: null,
    isLoading: false,
    isPlaying: false,
    activeLabel: ''
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const stopTTS = useCallback(() => {
    cleanup();
    setState({ activeSectionId: null, isLoading: false, isPlaying: false, activeLabel: '' });
  }, [cleanup]);

  const pauseTTS = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setState(s => ({ ...s, isPlaying: false }));
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && audioUrlRef.current) {
      audioRef.current.play();
      setState(s => ({ ...s, isPlaying: true }));
    }
  }, []);

  const playTTS = useCallback(async (text: string, sectionId: string, label = 'Audio', language = 'english') => {
    // Toggle pause/resume for same section
    if (state.activeSectionId === sectionId && audioRef.current) {
      if (state.isPlaying) {
        pauseTTS();
        return;
      }
      if (audioRef.current.paused && audioUrlRef.current) {
        resumeTTS();
        return;
      }
    }

    // Stop any current audio
    cleanup();

    setState({ activeSectionId: sectionId, isLoading: true, isPlaying: false, activeLabel: label });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-dua-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text, language }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setState(s => ({ ...s, isPlaying: true, isLoading: false }));
      audio.onended = () => {
        setState({ activeSectionId: null, isLoading: false, isPlaying: false, activeLabel: '' });
      };
      audio.onerror = () => {
        console.error('Audio playback error');
        stopTTS();
      };
      audio.onpause = () => setState(s => ({ ...s, isPlaying: false }));

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      stopTTS();
    }
  }, [state.activeSectionId, state.isPlaying, cleanup, pauseTTS, resumeTTS, stopTTS]);

  return (
    <TTSContext.Provider value={{ ...state, playTTS, pauseTTS, resumeTTS, stopTTS }}>
      {children}
      <FloatingAudioPlayer />
    </TTSContext.Provider>
  );
}
