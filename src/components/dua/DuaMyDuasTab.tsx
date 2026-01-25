/**
 * DuaMyDuasTab Component
 * Displays saved compositions and legacy saved duas
 */

import { useState, useEffect } from 'react';
import {
  Heart,
  Trash2,
  Volume2,
  Copy,
  Check,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  PenLine,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { type DuaBlock, type UserDuaComposition } from '../../data/duaBlocks';
import { DUA_CATEGORIES } from '../../data/duaLibrary';

interface SavedDua {
  id: string;
  title: string;
  arabic_text: string;
  transliteration: string;
  english_text: string;
  category_id: string;
  allah_names_used: string[];
  is_favorite: boolean;
  source: string;
  created_at: string;
}

interface CompositionWithBlocks extends UserDuaComposition {
  hamd_block?: DuaBlock | null;
  salawat_block?: DuaBlock | null;
  admission_block?: DuaBlock | null;
  request_blocks?: DuaBlock[];
  others_block?: DuaBlock | null;
  closing_block?: DuaBlock | null;
}

interface DuaMyDuasTabProps {
  userId: string | null;
  onGenerateAudio: (text: string, language: 'arabic' | 'english') => Promise<void>;
  generatingAudio: boolean;
}

export default function DuaMyDuasTab({
  userId,
  onGenerateAudio,
  generatingAudio
}: DuaMyDuasTabProps) {
  const [activeSection, setActiveSection] = useState<'compositions' | 'saved'>('compositions');
  const [compositions, setCompositions] = useState<CompositionWithBlocks[]>([]);
  const [savedDuas, setSavedDuas] = useState<SavedDua[]>([]);
  const [allBlocks, setAllBlocks] = useState<DuaBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameType, setRenameType] = useState<'composition' | 'saved'>('composition');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (userId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Load all blocks first (for composition display)
      const { data: blocks } = await supabase
        .from('dua_blocks')
        .select('*');
      setAllBlocks(blocks || []);

      // Load compositions
      const { data: comps, error: compsError } = await supabase
        .from('user_dua_compositions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (compsError) throw compsError;

      // Enrich compositions with block data
      const enrichedComps = (comps || []).map(comp => {
        const findBlock = (id: string | null) =>
          id ? (blocks || []).find(b => b.id === id) || null : null;

        return {
          ...comp,
          hamd_block: findBlock(comp.hamd_block_id),
          salawat_block: findBlock(comp.salawat_block_id),
          admission_block: findBlock(comp.admission_block_id),
          request_blocks: (comp.request_block_ids || [])
            .map((id: string) => (blocks || []).find(b => b.id === id))
            .filter(Boolean) as DuaBlock[],
          others_block: findBlock(comp.others_block_id),
          closing_block: findBlock(comp.closing_block_id),
        };
      });
      setCompositions(enrichedComps);

      // Load legacy saved duas
      const { data: saved, error: savedError } = await supabase
        .from('saved_duas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;
      setSavedDuas(saved || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load saved duas');
    } finally {
      setLoading(false);
    }
  };

  const getCompositionText = (comp: CompositionWithBlocks) => {
    const parts: string[] = [];
    if (comp.hamd_block) parts.push(comp.hamd_block.arabic_text);
    if (comp.salawat_block) parts.push(comp.salawat_block.arabic_text);
    if (comp.admission_block) parts.push(comp.admission_block.arabic_text);
    (comp.request_blocks || []).forEach(b => parts.push(b.arabic_text));
    if (comp.custom_text) parts.push(comp.custom_text);
    if (comp.others_block) parts.push(comp.others_block.arabic_text);
    if (comp.closing_block) parts.push(comp.closing_block.arabic_text);
    return parts.join('\n\n');
  };

  const getCompositionEnglish = (comp: CompositionWithBlocks) => {
    const parts: string[] = [];
    if (comp.hamd_block) parts.push(comp.hamd_block.english_translation);
    if (comp.salawat_block) parts.push(comp.salawat_block.english_translation);
    if (comp.admission_block) parts.push(comp.admission_block.english_translation);
    (comp.request_blocks || []).forEach(b => parts.push(b.english_translation));
    if (comp.custom_text) parts.push(`[Personal: ${comp.custom_text}]`);
    if (comp.others_block) parts.push(comp.others_block.english_translation);
    if (comp.closing_block) parts.push(comp.closing_block.english_translation);
    return parts.join('\n\n');
  };

  const getCompositionTransliteration = (comp: CompositionWithBlocks) => {
    const parts: string[] = [];
    if (comp.hamd_block) parts.push(comp.hamd_block.transliteration);
    if (comp.salawat_block) parts.push(comp.salawat_block.transliteration);
    if (comp.admission_block) parts.push(comp.admission_block.transliteration);
    (comp.request_blocks || []).forEach(b => parts.push(b.transliteration));
    if (comp.others_block) parts.push(comp.others_block.transliteration);
    if (comp.closing_block) parts.push(comp.closing_block.transliteration);
    return parts.join('\n\n');
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const toggleCompositionFavorite = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('user_dua_compositions')
        .update({ is_favorite: !currentState })
        .eq('id', id);

      if (error) throw error;

      setCompositions(prev =>
        prev.map(c => c.id === id ? { ...c, is_favorite: !currentState } : c)
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const deleteComposition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_dua_compositions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompositions(prev => prev.filter(c => c.id !== id));
      toast.success('Composition deleted');
    } catch (error) {
      console.error('Error deleting composition:', error);
      toast.error('Failed to delete');
    }
  };

  const toggleSavedFavorite = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_duas')
        .update({ is_favorite: !currentState })
        .eq('id', id);

      if (error) throw error;

      setSavedDuas(prev =>
        prev.map(d => d.id === id ? { ...d, is_favorite: !currentState } : d)
      );
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const deleteSavedDua = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_duas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedDuas(prev => prev.filter(d => d.id !== id));
      toast.success('Dua removed');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openRenameModal = (id: string, currentName: string, type: 'composition' | 'saved') => {
    setRenameId(id);
    setRenameType(type);
    setNewName(currentName);
    setRenameModalOpen(true);
  };

  const handleRename = async () => {
    if (!renameId || !newName.trim()) return;

    try {
      if (renameType === 'composition') {
        const { error } = await supabase
          .from('user_dua_compositions')
          .update({ title: newName.trim() })
          .eq('id', renameId);

        if (error) throw error;

        setCompositions(prev =>
          prev.map(c => c.id === renameId ? { ...c, title: newName.trim() } : c)
        );
      } else {
        const { error } = await supabase
          .from('saved_duas')
          .update({ title: newName.trim() })
          .eq('id', renameId);

        if (error) throw error;

        setSavedDuas(prev =>
          prev.map(d => d.id === renameId ? { ...d, title: newName.trim() } : d)
        );
      }

      setRenameModalOpen(false);
      setRenameId(null);
      setNewName('');
      toast.success('Dua renamed');
    } catch (error) {
      console.error('Error renaming:', error);
      toast.error('Failed to rename');
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to save duas</h3>
        <p className="text-gray-500">Create an account to save and organize your favorite duas.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  const favoriteComps = compositions.filter(c => c.is_favorite);
  const favoriteSaved = savedDuas.filter(d => d.is_favorite);

  return (
    <div className="space-y-6">
      {/* Section toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveSection('compositions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'compositions'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers size={16} />
          Built Duas ({compositions.length})
        </button>
        <button
          onClick={() => setActiveSection('saved')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'saved'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText size={16} />
          Saved Duas ({savedDuas.length})
        </button>
      </div>

      {/* Compositions section */}
      {activeSection === 'compositions' && (
        <div className="space-y-4">
          {compositions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <Layers size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No built duas yet</h3>
              <p className="text-gray-500">
                Use the Build tab to create your own duas using the modular composer.
              </p>
            </div>
          ) : (
            <>
              {/* Favorites */}
              {favoriteComps.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
                    <Heart size={14} className="text-red-500" fill="currentColor" /> Favorites
                  </h3>
                  <div className="space-y-3">
                    {favoriteComps.map(comp => renderComposition(comp))}
                  </div>
                </div>
              )}

              {/* All compositions */}
              <div className="space-y-3">
                {compositions.filter(c => !c.is_favorite).map(comp => renderComposition(comp))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Saved duas section */}
      {activeSection === 'saved' && (
        <div className="space-y-4">
          {savedDuas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved duas yet</h3>
              <p className="text-gray-500">
                Save duas from the Library tab or generated duas to build your collection.
              </p>
            </div>
          ) : (
            <>
              {/* Favorites */}
              {favoriteSaved.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
                    <Heart size={14} className="text-red-500" fill="currentColor" /> Favorites
                  </h3>
                  <div className="space-y-3">
                    {favoriteSaved.map(dua => renderSavedDua(dua))}
                  </div>
                </div>
              )}

              {/* All saved */}
              <div className="space-y-3">
                {savedDuas.filter(d => !d.is_favorite).map(dua => renderSavedDua(dua))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Rename Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PenLine size={20} className="text-emerald-600" />
                Rename Dua
              </h3>
              <button
                onClick={() => {
                  setRenameModalOpen(false);
                  setRenameId(null);
                  setNewName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter a new name for your dua..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim()) {
                      handleRename();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setRenameModalOpen(false);
                    setRenameId(null);
                    setNewName('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  disabled={!newName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderComposition(comp: CompositionWithBlocks) {
    const isExpanded = expandedId === comp.id;
    const arabicText = getCompositionText(comp);
    const englishText = getCompositionEnglish(comp);
    const transliteration = getCompositionTransliteration(comp);
    const category = DUA_CATEGORIES.find(c => c.id === comp.category_id);

    return (
      <div key={comp.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setExpandedId(isExpanded ? null : comp.id)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
        >
          <div>
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              {comp.title || 'My Custom Dua'}
              {comp.is_favorite && <Heart size={14} className="text-red-500" fill="currentColor" />}
            </h4>
            {category && (
              <p className="text-sm text-gray-500">
                {category.icon} {category.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {new Date(comp.created_at).toLocaleDateString()}
            </span>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 border-t border-gray-100 space-y-4">
            {/* Arabic */}
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-lg font-arabic text-gray-900 text-right leading-loose" dir="rtl">
                {arabicText}
              </p>
            </div>

            {/* Transliteration */}
            <p className="text-sm text-gray-600 italic">{transliteration}</p>

            {/* English */}
            <p className="text-gray-700">{englishText}</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => onGenerateAudio(arabicText, 'arabic')}
                disabled={generatingAudio}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
              >
                {generatingAudio ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                Play
              </button>
              <button
                onClick={() => handleCopy(`${arabicText}\n\n${transliteration}\n\n${englishText}`, comp.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {copiedId === comp.id ? <Check size={14} /> : <Copy size={14} />}
                Copy
              </button>
              <button
                onClick={() => toggleCompositionFavorite(comp.id, comp.is_favorite)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
                  comp.is_favorite
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart size={14} fill={comp.is_favorite ? 'currentColor' : 'none'} />
                {comp.is_favorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button
                onClick={() => openRenameModal(comp.id, comp.title || 'My Custom Dua', 'composition')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <PenLine size={14} />
                Rename
              </button>
              <button
                onClick={() => deleteComposition(comp.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSavedDua(dua: SavedDua) {
    const isExpanded = expandedId === `saved-${dua.id}`;

    return (
      <div key={dua.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setExpandedId(isExpanded ? null : `saved-${dua.id}`)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
        >
          <div>
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              {dua.title}
              {dua.is_favorite && <Heart size={14} className="text-red-500" fill="currentColor" />}
            </h4>
            <p className="text-sm text-gray-500">
              {dua.source === 'generated' ? 'AI Generated' : 'From Library'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {new Date(dua.created_at).toLocaleDateString()}
            </span>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 border-t border-gray-100 space-y-4">
            <p className="text-lg font-arabic text-gray-900 text-right" dir="rtl">
              {dua.arabic_text}
            </p>
            <p className="text-sm text-gray-600 italic">{dua.transliteration}</p>
            <p className="text-gray-700">{dua.english_text}</p>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => onGenerateAudio(dua.arabic_text, 'arabic')}
                disabled={generatingAudio}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
              >
                <Volume2 size={14} /> Play
              </button>
              <button
                onClick={() => handleCopy(`${dua.arabic_text}\n\n${dua.transliteration}\n\n${dua.english_text}`, dua.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {copiedId === dua.id ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
              <button
                onClick={() => toggleSavedFavorite(dua.id, dua.is_favorite)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
                  dua.is_favorite ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Heart size={14} fill={dua.is_favorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => openRenameModal(dua.id, dua.title, 'saved')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <PenLine size={14} />
              </button>
              <button
                onClick={() => deleteSavedDua(dua.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
