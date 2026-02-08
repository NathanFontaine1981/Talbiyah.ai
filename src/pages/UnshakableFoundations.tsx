import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Sun,
  Moon,
  Star,
  History,
  Scale,
  Languages,
  Lock,
  CheckCircle,
  Play,
  GraduationCap
} from 'lucide-react';
import {
  FOUNDATION_CATEGORIES,
  FOUNDATION_PROGRESS_KEY,
  DEFAULT_LOCAL_PROGRESS,
  type FoundationCategory,
  type FoundationVideo,
  type LocalFoundationProgress
} from '../data/foundationCategories';

// Import components (to be created)
import FoundationIntro from '../components/foundations/FoundationIntro';
import CategoryGrid from '../components/foundations/CategoryGrid';
import CategoryDetail from '../components/foundations/CategoryDetail';
import VideoPlayer from '../components/foundations/VideoPlayer';
import FoundationExam from '../components/foundations/FoundationExam';

// View types
type ViewMode = 'intro' | 'categories' | 'category-detail' | 'video' | 'exam' | 'results';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  Moon,
  Star,
  History,
  Scale,
  Languages,
  BookOpen
};

export default function UnshakableFoundations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  // Selected content
  const [selectedCategory, setSelectedCategory] = useState<FoundationCategory | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<FoundationVideo | null>(null);

  // Progress
  const [localProgress, setLocalProgress] = useState<LocalFoundationProgress>(DEFAULT_LOCAL_PROGRESS);
  const [dbProgress, setDbProgress] = useState<Record<string, any>>({});

  // Categories and videos from DB
  const [categories, setCategories] = useState<FoundationCategory[]>(FOUNDATION_CATEGORIES);
  const [categoryVideos, setCategoryVideos] = useState<FoundationVideo[]>([]);

  // Load user and progress on mount
  useEffect(() => {
    loadUserAndProgress();

    // Check URL params for direct navigation
    const categorySlug = searchParams.get('category');
    const videoId = searchParams.get('video');

    if (categorySlug) {
      const category = FOUNDATION_CATEGORIES.find(c => c.slug === categorySlug);
      if (category) {
        setSelectedCategory(category);
        setShowIntro(false);
        setViewMode('category-detail');
      }
    }

    // Check if intro was already seen
    const introSeen = localStorage.getItem('talbiyah_foundation_intro_seen');
    if (introSeen === 'true') {
      setShowIntro(false);
      if (!categorySlug) {
        setViewMode('categories');
      }
    }
  }, []);

  async function loadUserAndProgress() {
    try {
      // Load local progress
      const savedProgress = localStorage.getItem(FOUNDATION_PROGRESS_KEY);
      if (savedProgress) {
        setLocalProgress(JSON.parse(savedProgress));
      }

      // Check for user session
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Load progress from database
        const { data: progress } = await supabase
          .from('foundation_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progress) {
          const progressMap: Record<string, any> = {};
          progress.forEach(p => {
            progressMap[p.video_id] = p;
          });
          setDbProgress(progressMap);
        }
      }

      // Load categories from DB - only those with a pillar_id (part of Foundations)
      const { data: dbCategories } = await supabase
        .from('foundation_categories')
        .select('*')
        .eq('is_active', true)
        .not('pillar_id', 'is', null)
        .order('order_index');

      if (dbCategories && dbCategories.length > 0) {
        const mappedCategories = dbCategories.map(c => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          arabicName: c.arabic_name || '',
          description: c.description || '',
          icon: c.icon || 'BookOpen',
          orderIndex: c.order_index,
          isActive: c.is_active,
          isComingSoon: c.is_coming_soon,
          color: FOUNDATION_CATEGORIES.find(fc => fc.slug === c.slug)?.color || 'gray',
          gradient: FOUNDATION_CATEGORIES.find(fc => fc.slug === c.slug)?.gradient || 'from-gray-500 to-gray-600'
        }));
        setCategories(mappedCategories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Save local progress
  function saveLocalProgress(progress: LocalFoundationProgress) {
    progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(FOUNDATION_PROGRESS_KEY, JSON.stringify(progress));
    setLocalProgress(progress);
  }

  // Handle intro completion
  function handleIntroComplete() {
    localStorage.setItem('talbiyah_foundation_intro_seen', 'true');
    setShowIntro(false);
    setViewMode('categories');
  }

  // Handle category selection
  async function handleCategorySelect(category: FoundationCategory) {
    if (category.isComingSoon) {
      // Show coming soon toast or modal
      return;
    }

    setSelectedCategory(category);
    setSearchParams({ category: category.slug });

    // Load videos for this category
    if (category.id) {
      const { data: videos } = await supabase
        .from('foundation_videos')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('order_index');

      if (videos) {
        setCategoryVideos(videos.map(v => ({
          id: v.id,
          categoryId: v.category_id,
          title: v.title,
          description: v.description,
          videoUrl: v.video_url,
          videoId: v.video_id,
          thumbnailUrl: v.thumbnail_url,
          durationMinutes: v.duration_minutes,
          transcript: v.transcript,
          transcriptSource: v.transcript_source,
          orderIndex: v.order_index,
          isActive: v.is_active
        })));
      }
    }

    setViewMode('category-detail');
  }

  // Handle video selection
  function handleVideoSelect(video: FoundationVideo) {
    setSelectedVideo(video);
    setSearchParams({ category: selectedCategory?.slug || '', video: video.id });
    setViewMode('video');
  }

  // Handle video watched
  async function handleVideoWatched(videoId: string) {
    // Update local progress
    const newProgress = { ...localProgress };
    if (!newProgress.watchedVideos.includes(videoId)) {
      newProgress.watchedVideos.push(videoId);
      saveLocalProgress(newProgress);
    }

    // Update DB if logged in
    if (user) {
      await supabase
        .from('foundation_progress')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          watched: true,
          watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        });
    }
  }

  // Handle start exam
  function handleStartExam() {
    if (selectedVideo) {
      setViewMode('exam');
    }
  }

  // Handle exam complete
  async function handleExamComplete(score: number, passed: boolean) {
    if (!selectedVideo) return;

    const videoId = selectedVideo.id;

    // Update local progress
    const newProgress = { ...localProgress };
    newProgress.examScores[videoId] = score;
    if (passed && !newProgress.passedExams.includes(videoId)) {
      newProgress.passedExams.push(videoId);
    }
    saveLocalProgress(newProgress);

    // Update DB if logged in
    if (user) {
      const existingProgress = dbProgress[videoId];
      await supabase
        .from('foundation_progress')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          watched: true,
          exam_score: score,
          exam_passed: passed,
          exam_passed_at: passed ? new Date().toISOString() : null,
          attempts: (existingProgress?.attempts || 0) + 1,
          last_attempt_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        });
    }

    setViewMode('results');
  }

  // Go back handler - always navigate within Unshakeable Foundations
  function handleBack() {
    if (viewMode === 'results' || viewMode === 'exam') {
      setViewMode('video');
    } else if (viewMode === 'video') {
      setViewMode('category-detail');
      setSelectedVideo(null);
      setSearchParams({ category: selectedCategory?.slug || '' });
    } else if (viewMode === 'category-detail') {
      setViewMode('categories');
      setSelectedCategory(null);
      setSearchParams({});
    } else if (viewMode === 'categories') {
      // From main categories view, go back to previous page (landing or dashboard)
      navigate(-1);
    } else {
      navigate('/new-muslim');
    }
  }

  // Get back button text based on current view
  function getBackButtonText(): string {
    if (viewMode === 'categories') {
      return 'Back';
    } else if (viewMode === 'category-detail') {
      return 'All Categories';
    } else if (viewMode === 'video') {
      return selectedCategory?.name || 'Back';
    } else if (viewMode === 'exam' || viewMode === 'results') {
      return 'Back to Video';
    }
    return 'Back';
  }

  // Check if video is completed
  function isVideoCompleted(videoId: string): boolean {
    if (user && dbProgress[videoId]) {
      return dbProgress[videoId].exam_passed === true;
    }
    return localProgress.passedExams.includes(videoId);
  }

  // Check if video is watched
  function isVideoWatched(videoId: string): boolean {
    if (user && dbProgress[videoId]) {
      return dbProgress[videoId].watched === true;
    }
    return localProgress.watchedVideos.includes(videoId);
  }

  // Get category progress
  function getCategoryProgress(categorySlug: string): { watched: number; passed: number; total: number } {
    const categoryData = categories.find(c => c.slug === categorySlug);
    if (!categoryData?.id) return { watched: 0, passed: 0, total: 0 };

    const videos = categoryVideos.filter(v => v.categoryId === categoryData.id);
    const watched = videos.filter(v => isVideoWatched(v.id)).length;
    const passed = videos.filter(v => isVideoCompleted(v.id)).length;

    return { watched, passed, total: videos.length };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg"
      >
        Skip to course content
      </a>

      {/* Header */}
      {viewMode !== 'intro' && (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                aria-label={getBackButtonText()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{getBackButtonText()}</span>
              </button>

              <div className="text-center">
                <h1 className="text-lg font-bold text-gray-900">Unshakeable Foundations</h1>
                {selectedCategory && viewMode !== 'categories' && (
                  <p className="text-sm text-gray-500">{selectedCategory.name}</p>
                )}
              </div>

              <div className="w-20" /> {/* Spacer for centering */}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main id="main-content">
      <AnimatePresence mode="wait">
        {/* Intro View */}
        {(viewMode === 'intro' || showIntro) && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FoundationIntro onComplete={handleIntroComplete} />
          </motion.div>
        )}

        {/* Categories Grid View */}
        {viewMode === 'categories' && !showIntro && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CategoryGrid
              categories={categories}
              iconMap={iconMap}
              onCategorySelect={handleCategorySelect}
              getCategoryProgress={getCategoryProgress}
            />
          </motion.div>
        )}

        {/* Category Detail View */}
        {viewMode === 'category-detail' && selectedCategory && (
          <motion.div
            key="category-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CategoryDetail
              category={selectedCategory}
              videos={categoryVideos}
              onVideoSelect={handleVideoSelect}
              onTakeExam={(video) => {
                setSelectedVideo(video);
                setSearchParams({ category: selectedCategory?.slug || '', video: video.id });
                setViewMode('exam');
              }}
              isVideoWatched={isVideoWatched}
              isVideoCompleted={isVideoCompleted}
            />
          </motion.div>
        )}

        {/* Video Player View */}
        {viewMode === 'video' && selectedVideo && (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VideoPlayer
              video={selectedVideo}
              onWatched={() => handleVideoWatched(selectedVideo.id)}
              onStartExam={handleStartExam}
              isWatched={isVideoWatched(selectedVideo.id)}
              isPassed={isVideoCompleted(selectedVideo.id)}
            />
          </motion.div>
        )}

        {/* Exam View */}
        {viewMode === 'exam' && selectedVideo && (
          <motion.div
            key="exam"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FoundationExam
              videoId={selectedVideo.id}
              videoTitle={selectedVideo.title}
              onComplete={handleExamComplete}
              onBack={() => setViewMode('video')}
            />
          </motion.div>
        )}

        {/* Results View - Simple inline for now */}
        {viewMode === 'results' && selectedVideo && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto px-4 py-12"
          >
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              {localProgress.passedExams.includes(selectedVideo.id) ? (
                <>
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                  <p className="text-gray-600 mb-6">
                    You passed the exam with {localProgress.examScores[selectedVideo.id]}%
                  </p>
                  <button
                    onClick={() => {
                      setViewMode('category-detail');
                      setSelectedVideo(null);
                    }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition"
                  >
                    Continue to Next Video
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <GraduationCap className="w-10 h-10 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Keep Learning!</h2>
                  <p className="text-gray-600 mb-6">
                    You scored {localProgress.examScores[selectedVideo.id]}%. You need 90% to pass.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setViewMode('video')}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
                    >
                      Review Video
                    </button>
                    <button
                      onClick={() => setViewMode('exam')}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition"
                    >
                      Retry Exam
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
