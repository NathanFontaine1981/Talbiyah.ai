import { Volume2, Pause, Loader2 } from 'lucide-react';
import { useTTS } from './TTSProvider';

interface TextToSpeechButtonProps {
  text: string;
  sectionId: string;
  label?: string;
  language?: string;
  variant?: 'button' | 'icon' | 'mini';
}

export default function TextToSpeechButton({
  text,
  sectionId,
  label = 'Listen',
  language = 'english',
  variant = 'icon'
}: TextToSpeechButtonProps) {
  const { playTTS, activeSectionId, isLoading, isPlaying } = useTTS();

  const isActive = activeSectionId === sectionId;
  const isThisLoading = isActive && isLoading;
  const isThisPlaying = isActive && isPlaying;

  const displayLabel = text.length > 5000 ? 'Listen to summary' : label;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    playTTS(text, sectionId, displayLabel, language);
  }

  if (variant === 'mini') {
    return (
      <button
        onClick={handleClick}
        aria-label={isThisPlaying ? 'Pause' : displayLabel}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
          isActive
            ? 'bg-violet-100 text-violet-600'
            : 'bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600'
        }`}
      >
        {isThisLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
         isThisPlaying ? <Pause className="w-3.5 h-3.5" /> :
         <Volume2 className="w-3.5 h-3.5" />}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        aria-label={isThisPlaying ? 'Pause' : displayLabel}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
          isActive
            ? 'bg-violet-100 text-violet-600'
            : 'bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600'
        }`}
      >
        {isThisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
         isThisPlaying ? <Pause className="w-4 h-4" /> :
         <Volume2 className="w-4 h-4" />}
      </button>
    );
  }

  // variant === 'button'
  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        isActive
          ? 'bg-violet-100 text-violet-700'
          : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700'
      }`}
    >
      {isThisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
       isThisPlaying ? <Pause className="w-4 h-4" /> :
       <Volume2 className="w-4 h-4" />}
      <span>{isThisPlaying ? 'Pause' : displayLabel}</span>
    </button>
  );
}
