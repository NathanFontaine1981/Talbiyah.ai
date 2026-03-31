import { useState, useCallback } from 'react';

interface UseTeachingPlanReturn {
  images: File[];
  previews: string[];
  isGenerating: boolean;
  addImages: (files: FileList) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  getImagesAsBase64: () => Promise<{ base64: string; media_type: string }[]>;
}

function resizeImage(file: File, maxWidth = 1500): Promise<{ base64: string; media_type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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

  return {
    images,
    previews,
    isGenerating,
    addImages,
    removeImage,
    clearImages,
    getImagesAsBase64,
  };
}
