import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, ChevronDown, ChevronUp, GraduationCap, Play } from 'lucide-react';
import { type FoundationVideo } from '../../data/foundationCategories';

interface VideoPlayerProps {
  video: FoundationVideo;
  onWatched: () => void;
  onStartExam: () => void;
  isWatched: boolean;
  isPassed: boolean;
}

export default function VideoPlayer({
  video,
  onWatched,
  onStartExam,
  isWatched,
  isPassed
}: VideoPlayerProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [markedWatched, setMarkedWatched] = useState(isWatched);

  // Extract YouTube video ID from URL
  function getYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  const youtubeId = video.videoId || getYouTubeId(video.videoUrl);

  function handleMarkWatched() {
    setMarkedWatched(true);
    onWatched();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Video Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
        {video.description && (
          <p className="text-gray-600">{video.description}</p>
        )}
      </motion.div>

      {/* Video Player */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-black rounded-2xl overflow-hidden mb-6 shadow-lg"
      >
        {youtubeId ? (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">Video player loading...</p>
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block"
              >
                Watch on YouTube →
              </a>
            </div>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 mb-8"
      >
        {/* Already Passed Badge */}
        {isPassed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Exam Passed!</p>
              <p className="text-sm text-emerald-600">You've already completed this lesson</p>
            </div>
          </div>
        )}

        {/* Mark as Watched / Take Exam Buttons */}
        {!isPassed && (
          <div className="flex flex-col sm:flex-row gap-3">
            {!markedWatched ? (
              <button
                onClick={handleMarkWatched}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition"
              >
                <CheckCircle className="w-5 h-5" />
                <span>I've Watched This Video</span>
              </button>
            ) : (
              <button
                onClick={onStartExam}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Take Exam to Complete</span>
              </button>
            )}
          </div>
        )}

        {/* Review Exam Button (if passed) */}
        {isPassed && (
          <button
            onClick={onStartExam}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
          >
            <GraduationCap className="w-5 h-5" />
            <span>Review Exam</span>
          </button>
        )}
      </motion.div>

      {/* Transcript Section */}
      {video.transcript && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <span className="font-semibold text-gray-900">Video Transcript</span>
            </div>
            {showTranscript ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showTranscript && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="mt-4 p-4 bg-gray-50 rounded-xl max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {video.transcript}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* No Transcript Message */}
      {!video.transcript && markedWatched && !isPassed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-700 text-sm">
            This video's exam will be based on key concepts covered. Ready to test your understanding?
          </p>
        </div>
      )}
    </div>
  );
}
