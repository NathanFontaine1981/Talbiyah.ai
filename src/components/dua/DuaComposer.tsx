/**
 * DuaComposer Component
 * Main orchestrator for the modular dua building experience
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Sparkles,
  RotateCcw,
  Download,
  Coins,
  Volume2,
  Pause,
  Play,
  StopCircle,
  X,
  PenLine
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import DuaProgressStepper from './DuaProgressStepper';
import DuaBlockSelector from './DuaBlockSelector';
import DuaPreview from './DuaPreview';
import DuaPersonalInput from './DuaPersonalInput';
import {
  type DuaBlock,
  type DuaBlockType,
  type DuaBlockSet,
  type ComposedDua,
  type CustomBlockText,
  BLOCK_TYPE_ORDER,
  BLOCK_TYPE_INFO,
  getComposedArabicText,
  getComposedEnglish,
  isCompositionComplete
} from '../../data/duaBlocks';
import { DUA_CATEGORIES } from '../../data/duaLibrary';

const DUA_AUDIO_TOKEN_COST = 10;

interface DuaComposerProps {
  userId: string | null;
  tokenBalance: number;
  onTokensUsed: (newBalance: number) => void;
  initialCategoryId?: string;
  initialTemplateId?: string;
}

export default function DuaComposer({
  userId,
  tokenBalance,
  onTokensUsed,
  initialCategoryId,
  initialTemplateId
}: DuaComposerProps) {
  const navigate = useNavigate();

  // Current step in the builder
  const [currentStep, setCurrentStep] = useState<DuaBlockType>('hamd');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategoryId || null);

  // All blocks from database
  const [allBlocks, setAllBlocks] = useState<DuaBlock[]>([]);
  const [blockSets, setBlockSets] = useState<DuaBlockSet[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  // Composition state
  const [composition, setComposition] = useState<ComposedDua>({
    hamdBlock: null,
    salawatBlock: null,
    admissionBlock: null,
    requestBlocks: [],
    othersBlock: null,
    closingBlock: null,
    customText: ''
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(!selectedCategory);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [duaTitle, setDuaTitle] = useState('');

  // Audio state
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load blocks from database
  useEffect(() => {
    loadBlocks();
  }, []);

  // Load template if specified
  useEffect(() => {
    if (initialTemplateId && blockSets.length > 0 && allBlocks.length > 0) {
      const template = blockSets.find(s => s.id === initialTemplateId);
      if (template) {
        applyTemplate(template);
      }
    }
  }, [initialTemplateId, blockSets, allBlocks]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const loadBlocks = async () => {
    setLoadingBlocks(true);
    try {
      // Load all blocks
      const { data: blocks, error: blocksError } = await supabase
        .from('dua_blocks')
        .select('*')
        .order('display_order', { ascending: true });

      if (blocksError) throw blocksError;
      setAllBlocks(blocks || []);

      // Load block sets (templates)
      const { data: sets, error: setsError } = await supabase
        .from('dua_block_sets')
        .select('*')
        .order('display_order', { ascending: true });

      if (setsError) throw setsError;
      setBlockSets(sets || []);
    } catch (error) {
      console.error('Error loading blocks:', error);
      toast.error('Failed to load dua blocks');
    } finally {
      setLoadingBlocks(false);
    }
  };

  const applyTemplate = (template: DuaBlockSet) => {
    const findBlock = (id: string | null) =>
      id ? allBlocks.find(b => b.id === id) || null : null;

    setComposition({
      hamdBlock: findBlock(template.hamd_block_id),
      salawatBlock: findBlock(template.salawat_block_id),
      admissionBlock: findBlock(template.admission_block_id),
      requestBlocks: (template.request_block_ids || [])
        .map(id => allBlocks.find(b => b.id === id))
        .filter(Boolean) as DuaBlock[],
      othersBlock: findBlock(template.others_block_id),
      closingBlock: findBlock(template.closing_block_id),
      customText: ''
    });

    if (template.category_id) {
      setSelectedCategory(template.category_id);
    }
    setShowCategoryPicker(false);
    toast.success(`Loaded "${template.name}" template`);
  };

  const getBlocksForType = (blockType: DuaBlockType): DuaBlock[] => {
    return allBlocks.filter(b => b.block_type === blockType);
  };

  const handleBlockSelect = (blockType: DuaBlockType, blockId: string) => {
    const block = allBlocks.find(b => b.id === blockId);
    if (!block) return;

    setComposition(prev => {
      switch (blockType) {
        case 'hamd':
          return { ...prev, hamdBlock: block, customHamd: undefined };
        case 'salawat':
          return { ...prev, salawatBlock: block, customSalawat: undefined };
        case 'admission':
          return { ...prev, admissionBlock: block, customAdmission: undefined };
        case 'request':
          // Add to list if not already there
          if (prev.requestBlocks.some(b => b.id === blockId)) {
            return prev;
          }
          return { ...prev, requestBlocks: [...prev.requestBlocks, block] };
        case 'others':
          return { ...prev, othersBlock: block, customOthers: undefined };
        case 'closing':
          return { ...prev, closingBlock: block, customClosing: undefined };
        default:
          return prev;
      }
    });
  };

  const handleBlockDeselect = (blockType: DuaBlockType, blockId: string) => {
    if (blockType === 'request') {
      setComposition(prev => ({
        ...prev,
        requestBlocks: prev.requestBlocks.filter(b => b.id !== blockId)
      }));
    }
  };

  const getSelectedBlockId = (blockType: DuaBlockType): string | null => {
    switch (blockType) {
      case 'hamd':
        return composition.hamdBlock?.id || null;
      case 'salawat':
        return composition.salawatBlock?.id || null;
      case 'admission':
        return composition.admissionBlock?.id || null;
      case 'others':
        return composition.othersBlock?.id || null;
      case 'closing':
        return composition.closingBlock?.id || null;
      default:
        return null;
    }
  };

  const getCustomText = (blockType: DuaBlockType): CustomBlockText | undefined => {
    switch (blockType) {
      case 'hamd':
        return composition.customHamd;
      case 'salawat':
        return composition.customSalawat;
      case 'admission':
        return composition.customAdmission;
      case 'request':
        return composition.customRequest;
      case 'others':
        return composition.customOthers;
      case 'closing':
        return composition.customClosing;
      default:
        return undefined;
    }
  };

  const handleCustomTextChange = (blockType: DuaBlockType, customText: CustomBlockText | undefined) => {
    setComposition(prev => {
      const newComposition = { ...prev };

      // If setting custom text, clear the selected block for that type
      switch (blockType) {
        case 'hamd':
          newComposition.customHamd = customText;
          if (customText) newComposition.hamdBlock = null;
          break;
        case 'salawat':
          newComposition.customSalawat = customText;
          if (customText) newComposition.salawatBlock = null;
          break;
        case 'admission':
          newComposition.customAdmission = customText;
          if (customText) newComposition.admissionBlock = null;
          break;
        case 'request':
          newComposition.customRequest = customText;
          break;
        case 'others':
          newComposition.customOthers = customText;
          if (customText) newComposition.othersBlock = null;
          break;
        case 'closing':
          newComposition.customClosing = customText;
          if (customText) newComposition.closingBlock = null;
          break;
      }

      return newComposition;
    });
  };

  const goToNextStep = () => {
    const currentIndex = BLOCK_TYPE_ORDER.indexOf(currentStep);
    if (currentIndex < BLOCK_TYPE_ORDER.length - 1) {
      setCurrentStep(BLOCK_TYPE_ORDER[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = BLOCK_TYPE_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(BLOCK_TYPE_ORDER[currentIndex - 1]);
    }
  };

  const resetComposition = () => {
    setComposition({
      hamdBlock: null,
      salawatBlock: null,
      admissionBlock: null,
      requestBlocks: [],
      othersBlock: null,
      closingBlock: null,
      customText: '',
      customHamd: undefined,
      customSalawat: undefined,
      customAdmission: undefined,
      customRequest: undefined,
      customOthers: undefined,
      customClosing: undefined
    });
    setCurrentStep('hamd');
    setShowCategoryPicker(true);
    setSelectedCategory(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    toast.success('Composition reset');
  };

  const openSaveModal = () => {
    if (!userId) {
      toast.error('Please sign in to save your dua');
      return;
    }

    if (!isCompositionComplete(composition)) {
      toast.error('Please complete all blocks before saving');
      return;
    }

    // Set default title based on category
    const category = selectedCategory
      ? DUA_CATEGORIES.find(c => c.id === selectedCategory)
      : null;
    setDuaTitle(category ? `My ${category.name} Dua` : 'My Custom Dua');
    setShowSaveModal(true);
  };

  const handleSaveComposition = async () => {
    if (!userId) {
      toast.error('Please sign in to save your dua');
      return;
    }

    if (!duaTitle.trim()) {
      toast.error('Please enter a name for your dua');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('user_dua_compositions')
        .insert({
          user_id: userId,
          title: duaTitle.trim(),
          hamd_block_id: composition.hamdBlock?.id,
          salawat_block_id: composition.salawatBlock?.id,
          admission_block_id: composition.admissionBlock?.id,
          request_block_ids: composition.requestBlocks.map(b => b.id),
          others_block_id: composition.othersBlock?.id,
          closing_block_id: composition.closingBlock?.id,
          custom_text: composition.customText || null,
          category_id: selectedCategory,
          is_favorite: false
        })
        .select()
        .single();

      if (error) throw error;

      setShowSaveModal(false);
      setDuaTitle('');
      toast.success('Dua saved to My Duas!');
    } catch (error: any) {
      console.error('Error saving composition:', error);
      toast.error('Failed to save dua');
    } finally {
      setSaving(false);
    }
  };

  // Audio generation
  const handleGenerateAudio = async (text: string, language: 'arabic' | 'english') => {
    setGeneratingAudio(true);

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

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);

      // Auto-play
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      await audio.play();

      toast.success('Playing audio!');
    } catch (error: any) {
      console.error('Error generating audio:', error);
      toast.error(error.message || 'Failed to generate audio');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleDownloadAudio = async (language: 'arabic' | 'english') => {
    if (!userId) {
      toast.error('Please sign in to download audio');
      return;
    }

    if (tokenBalance < DUA_AUDIO_TOKEN_COST) {
      toast.error(`Insufficient tokens. You need ${DUA_AUDIO_TOKEN_COST} tokens to download audio.`, {
        action: {
          label: 'Buy Tokens',
          onClick: () => navigate('/buy-credits?tab=tokens')
        }
      });
      return;
    }

    setDownloadingAudio(true);

    try {
      // Deduct tokens first
      const { data: deductResult, error: deductError } = await supabase.rpc('deduct_user_tokens', {
        p_user_id: userId,
        p_tokens: DUA_AUDIO_TOKEN_COST,
        p_feature: 'dua_audio',
        p_notes: `Downloaded ${language} audio for composed dua`
      });

      if (deductError || !deductResult?.success) {
        throw new Error(deductResult?.error || 'Failed to deduct tokens');
      }

      onTokensUsed(deductResult.new_balance);

      const text = language === 'arabic'
        ? getComposedArabicText(composition)
        : getComposedEnglish(composition);

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
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-dua-${language}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Audio downloaded! ${DUA_AUDIO_TOKEN_COST} tokens used.`);
    } catch (error: any) {
      console.error('Error downloading audio:', error);
      toast.error(error.message || 'Failed to download audio');
    } finally {
      setDownloadingAudio(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const stopPlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const currentStepIndex = BLOCK_TYPE_ORDER.indexOf(currentStep);
  const isLastStep = currentStepIndex === BLOCK_TYPE_ORDER.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Category picker view
  if (showCategoryPicker) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            What are you seeking?
          </h2>
          <p className="text-gray-600">
            Select a category to get relevant dua blocks, or start with a template.
          </p>
        </div>

        {/* Quick start templates */}
        {blockSets.filter(s => s.is_featured).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              Quick Start Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {blockSets.filter(s => s.is_featured).map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl text-left hover:shadow-md transition-all"
                >
                  <p className="font-medium text-gray-900">{template.name}</p>
                  {template.name_arabic && (
                    <p className="text-sm text-amber-700 font-arabic">{template.name_arabic}</p>
                  )}
                  {template.description && (
                    <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category grid */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Or choose a category:
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DUA_CATEGORIES.filter(c => !c.isCore).map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowCategoryPicker(false);
                }}
                className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <span className="text-2xl mb-2 block">{cat.icon}</span>
                <p className="font-medium text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Skip category selection */}
        <div className="text-center">
          <button
            onClick={() => setShowCategoryPicker(false)}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            Skip and start from scratch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress stepper */}
      <DuaProgressStepper
        currentStep={currentStep}
        composition={composition}
        onStepClick={setCurrentStep}
      />

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block selector */}
        <div className="lg:col-span-2">
          <DuaBlockSelector
            blockType={currentStep}
            blocks={getBlocksForType(currentStep)}
            selectedBlockId={getSelectedBlockId(currentStep)}
            selectedBlockIds={currentStep === 'request' ? composition.requestBlocks.map(b => b.id) : undefined}
            onSelect={(blockId) => handleBlockSelect(currentStep, blockId)}
            onDeselect={(blockId) => handleBlockDeselect(currentStep, blockId)}
            allowMultiple={currentStep === 'request'}
            categoryId={selectedCategory}
            isLoading={loadingBlocks}
            customText={getCustomText(currentStep)}
            onCustomTextChange={(text) => handleCustomTextChange(currentStep, text)}
          />

          {/* Personal text input - shown on request step */}
          {currentStep === 'request' && (
            <DuaPersonalInput
              value={composition.customText}
              onChange={(text) => setComposition(prev => ({ ...prev, customText: text }))}
            />
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={goToPreviousStep}
              disabled={isFirstStep}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={resetComposition}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              {isLastStep ? (
                <button
                  onClick={openSaveModal}
                  disabled={saving || !isCompositionComplete(composition)}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  Save Dua
                </button>
              ) : (
                <button
                  onClick={goToNextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <DuaPreview
              composition={composition}
              isCompact={false}
              onGenerateAudio={handleGenerateAudio}
              generatingAudio={generatingAudio}
            />

            {/* Audio controls */}
            {audioUrl && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={togglePlayback}
                    className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button
                    onClick={stopPlayback}
                    className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100"
                  >
                    <StopCircle size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Download buttons */}
            {isCompositionComplete(composition) && userId && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleDownloadAudio('arabic')}
                  disabled={downloadingAudio}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {downloadingAudio ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Download Arabic
                  <span className="text-xs bg-violet-500 px-1.5 py-0.5 rounded">
                    {DUA_AUDIO_TOKEN_COST} tokens
                  </span>
                </button>
                <button
                  onClick={() => handleDownloadAudio('english')}
                  disabled={downloadingAudio}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {downloadingAudio ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Download English
                  <span className="text-xs bg-violet-500 px-1.5 py-0.5 rounded">
                    {DUA_AUDIO_TOKEN_COST} tokens
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PenLine size={20} className="text-emerald-600" />
                Name Your Dua
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dua Name
                </label>
                <input
                  type="text"
                  value={duaTitle}
                  onChange={(e) => setDuaTitle(e.target.value)}
                  placeholder="e.g., My Morning Dua, Dua for Guidance..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && duaTitle.trim()) {
                      handleSaveComposition();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your dua a meaningful name to find it easily later.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveComposition}
                  disabled={saving || !duaTitle.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Dua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
