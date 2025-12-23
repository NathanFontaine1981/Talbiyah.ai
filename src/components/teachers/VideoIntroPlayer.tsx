import { useState } from 'react';
import { Play, X, Volume2, VolumeX, Maximize2, Pause } from 'lucide-react';

interface VideoIntroPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  teacherName: string;
  duration?: number; // in seconds
  variant?: 'card' | 'modal' | 'inline';
  className?: string;
  onPlay?: () => void;
}

export default function VideoIntroPlayer({
  videoUrl,
  thumbnailUrl,
  teacherName,
  duration,
  variant = 'card',
  className = '',
  onPlay
}: VideoIntroPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if it's a YouTube URL
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.includes('youtu.be')
      ? url.split('/').pop()?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  };

  // Card variant - thumbnail with play button
  if (variant === 'card') {
    return (
      <>
        <button
          onClick={() => {
            setShowModal(true);
            onPlay?.();
          }}
          className={`relative group overflow-hidden rounded-xl aspect-video bg-gray-100 ${className}`}
        >
          {/* Thumbnail */}
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`${teacherName} intro video`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-green-100">
              <div className="text-4xl">🎥</div>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-emerald-600 ml-1" />
            </div>
          </div>

          {/* Play button always visible */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-0 transition-transform">
              <Play className="w-6 h-6 text-emerald-600 ml-0.5" />
            </div>
          </div>

          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
              {formatDuration(duration)}
            </div>
          )}

          {/* Label */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <span className="text-white text-sm font-medium">
              Meet {teacherName}
            </span>
          </div>
        </button>

        {/* Modal */}
        {showModal && (
          <VideoModal
            videoUrl={videoUrl}
            teacherName={teacherName}
            isYouTube={isYouTube}
            getYouTubeEmbedUrl={getYouTubeEmbedUrl}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Inline variant - embedded player
  if (variant === 'inline') {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-black aspect-video ${className}`}>
        {!isPlaying ? (
          <button
            onClick={() => {
              setIsPlaying(true);
              onPlay?.();
            }}
            className="absolute inset-0 flex items-center justify-center group"
          >
            {/* Thumbnail */}
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={`${teacherName} intro video`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-6xl opacity-50">🎥</div>
              </div>
            )}

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-emerald-600 ml-1" />
              </div>
            </div>

            {/* Duration */}
            {duration && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-sm rounded">
                {formatDuration(duration)}
              </div>
            )}
          </button>
        ) : (
          <>
            {isYouTube ? (
              <iframe
                src={getYouTubeEmbedUrl(videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                className="w-full h-full"
                controls
                autoPlay
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Modal variant - just the modal trigger
  return (
    <button
      onClick={() => {
        setShowModal(true);
        onPlay?.();
      }}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors ${className}`}
    >
      <Play className="w-4 h-4" />
      <span className="font-medium">Watch Intro</span>
      {duration && (
        <span className="text-emerald-600/70 text-sm">({formatDuration(duration)})</span>
      )}

      {showModal && (
        <VideoModal
          videoUrl={videoUrl}
          teacherName={teacherName}
          isYouTube={isYouTube}
          getYouTubeEmbedUrl={getYouTubeEmbedUrl}
          onClose={() => setShowModal(false)}
        />
      )}
    </button>
  );
}

// Video Modal Component
function VideoModal({
  videoUrl,
  teacherName,
  isYouTube,
  getYouTubeEmbedUrl,
  onClose
}: {
  videoUrl: string;
  teacherName: string;
  isYouTube: boolean;
  getYouTubeEmbedUrl: (url: string) => string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video */}
        <div className="aspect-video">
          {isYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(videoUrl)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              className="w-full h-full"
              controls
              autoPlay
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 px-4 py-3">
          <p className="text-white font-medium">Meet {teacherName}</p>
        </div>
      </div>
    </div>
  );
}

// Placeholder for when no video is available
export function VideoIntroPlaceholder({
  teacherName,
  variant = 'card',
  className = ''
}: {
  teacherName: string;
  variant?: 'card' | 'inline';
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <div className={`rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 aspect-video flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <div className="text-4xl mb-3 opacity-50">🎥</div>
        <p className="text-gray-600 font-medium">Video introduction coming soon</p>
        <p className="text-gray-500 text-sm mt-1">
          {teacherName} hasn't uploaded an intro video yet
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-gray-50 border border-gray-200 p-4 flex items-center gap-3 ${className}`}>
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-xl opacity-50">🎥</div>
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium">Video intro coming soon</p>
        <p className="text-gray-400 text-xs">{teacherName} is preparing their introduction</p>
      </div>
    </div>
  );
}
