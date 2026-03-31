import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UseTeachingPlanReturn {
  images: File[];
  previews: string[];
  isGenerating: boolean;
  addImages: (files: FileList) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  getImagesAsBase64: () => Promise<{ base64: string; media_type: string }[]>;
  uploadImagesToStorage: (sessionId: string) => Promise<string[]>;
}

function resizeImage(file: File, maxWidth = 1024): Promise<{ base64: string; media_type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        // Scale down to fit within maxWidth
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        // Also cap height
        const maxHeight = 1400;
        if (h > maxHeight) {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, media_type: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useTeachingPlan(): UseTeachingPlanReturn {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addImages = useCallback((files: FileList) => {
    const newFiles = Array.from(files);
    setImages(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const removeImage = useCallback((index: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setImages([]);
    setPreviews([]);
  }, [previews]);

  const getImagesAsBase64 = useCallback(async () => {
    return Promise.all(images.map(f => resizeImage(f)));
  }, [images]);

  const uploadImagesToStorage = useCallback(async (sessionId: string) => {
    const urls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `teaching-plans/${sessionId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage
        .from('course_assets')
        .upload(filePath, file, { upsert: true });
      if (error) throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage
        .from('course_assets')
        .getPublicUrl(filePath);
      urls.push(publicUrl);
    }
    return urls;
  }, [images]);

  return {
    images,
    previews,
    isGenerating,
    addImages,
    removeImage,
    clearImages,
    getImagesAsBase64,
    uploadImagesToStorage,
  };
}
