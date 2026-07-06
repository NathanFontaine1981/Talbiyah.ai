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

function drawResizedToCanvas(file: File, maxWidth = 1024, maxHeight = 1400): Promise<HTMLCanvasElement> {
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
        if (h > maxHeight) {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function resizeImage(file: File): Promise<{ base64: string; media_type: string }> {
  const canvas = await drawResizedToCanvas(file);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
  return { base64: dataUrl.split(',')[1], media_type: 'image/jpeg' };
}

async function resizeImageToBlob(file: File): Promise<Blob> {
  const canvas = await drawResizedToCanvas(file);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      'image/jpeg',
      0.85,
    );
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
      const blob = await resizeImageToBlob(images[i]);
      const filePath = `teaching-plans/${sessionId}/${Date.now()}-${i}.jpg`;
      const { error } = await supabase.storage
        .from('course_assets')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
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
