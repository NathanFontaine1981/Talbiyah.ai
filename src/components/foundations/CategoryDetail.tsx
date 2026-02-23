import { motion } from 'framer-motion';
import { Play, CheckCircle, Clock, Star, BookOpen, FileQuestion, ChevronRight } from 'lucide-react';
import { type FoundationCategory, type FoundationVideo } from '../../data/foundationCategories';
import TextToSpeechButton from '../shared/TextToSpeechButton';

interface CategoryDetailProps {
  category: FoundationCategory;
  videos: FoundationVideo[];
  onVideoSelect: (video: FoundationVideo) => void;
  onTakeExam?: (video: FoundationVideo) => void;
  isVideoWatched: (videoId: string) => boolean;
  isVideoCompleted: (videoId: string) => boolean;
}

export default function CategoryDetail({
  category,
  videos,
  onVideoSelect,
  onTakeExam,
  isVideoWatched,
  isVideoCompleted
}: CategoryDetailProps) {
  const completedCount = videos.filter(v => isVideoCompleted(v.id)).length;
  const watchedCount = videos.filter(v => isVideoWatched(v.id)).length;
  const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  // Get YouTube thumbnail
  function getThumbnail(video: FoundationVideo): string {
    if (video.thumbnailUrl) return video.thumbnailUrl;
    if (video.videoId) return `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
    return '/placeholder-video.jpg';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Category Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${category.gradient} rounded-2xl p-6 mb-8 text-white`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{category.name}</h1>
            <p className="text-white/80 font-arabic text-lg">{category.arabicName}</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-white/70 text-sm max-w-lg">{category.description}</p>
              {category.description && (
                <TextToSpeechButton
                  text={category.description}
                  sectionId={`cat-desc-${category.slug}`}
                  label={category.name}
                  variant="mini"
                />
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <span className="text-3xl font-bold">{progressPercent}%</span>
            </div>
            <p className="text-white/80 text-sm">{completedCount}/{videos.length} Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Audio link (e.g. Spotify) */}
        {category.audioUrl && (
          <a
            href={category.audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition group"
          >
            <svg className="w-5 h-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Listen to the Qur'an in English</p>
              <p className="text-white/60 text-xs">Understand Allah's words while you learn Arabic</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </a>
        )}
      </motion.div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 text-center border border-gray-200"
        >
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Coming Soon</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            We're working on curating the best videos for this category.
            Check back soon or start with Tawheed while you wait!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {videos.map((video, index) => {
            const watched = isVideoWatched(video.id);
            const completed = isVideoCompleted(video.id);

            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onVideoSelect(video)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onVideoSelect(video);
                  }
                }}
                className={`w-full text-left bg-white rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                  completed
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : watched
                    ? 'border-amber-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={getThumbnail(video)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-video.jpg';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-gray-900 ml-1" />
                      </div>
                    </div>

                    {/* Status Badge */}
                    {completed && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Passed</span>
                      </div>
                    )}
                    {watched && !completed && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Watched
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {index + 1}. {video.title}
                      </h3>
                      {completed && (
                        <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      )}
                    </div>

                    {video.description && (
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                      {video.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {video.durationMinutes} min
                        </span>
                      )}

                      {!watched && !completed && (
                        <span className="text-emerald-600 font-medium">
                          Start Learning →
                        </span>
                      )}

                      {watched && !completed && (
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">
                            Review →
                          </span>
                          {onTakeExam && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTakeExam(video);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-xs transition shadow-sm"
                            >
                              <FileQuestion className="w-3.5 h-3.5" />
                              Take Test
                            </button>
                          )}
                        </div>
                      )}

                      {completed && (
                        <span className="text-emerald-600 font-medium">
                          Review Video →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Category Complete Message */}
      {videos.length > 0 && completedCount === videos.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">
            Category Complete!
          </h3>
          <p className="text-emerald-700 mb-4">
            MashaAllah! You've completed all videos in {category.name}.
            Your foundation in this area is now solid.
          </p>
          <a
            href="/new-muslim"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
          >
            Continue to Next Category
          </a>
        </motion.div>
      )}
    </div>
  );
}
