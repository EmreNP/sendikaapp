import { validateStringLength } from './commonValidation';
import type { CreateVideoContentRequest, UpdateVideoContentRequest, VideoSource } from '@shared/types/training';

export const validateVideoUrl = (
  url: string, 
  source: VideoSource
): { valid: boolean; error?: string } => {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'Video URL zorunludur' };
  }
  
  if (source === 'youtube') {
    const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubePattern.test(url)) {
      return { valid: false, error: 'Geçersiz YouTube URL formatı' };
    }
  } else if (source === 'vimeo') {
    const vimeoPattern = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    if (!vimeoPattern.test(url)) {
      return { valid: false, error: 'Geçersiz Vimeo URL formatı' };
    }
  } else if (source === 'uploaded') {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return { valid: false, error: 'Geçersiz video URL protokolü' };
      }
    } catch {
      return { valid: false, error: 'Geçersiz video URL formatı' };
    }
  }
  
  return { valid: true };
};

export interface VideoContentValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export const validateCreateVideoContent = (
  data: CreateVideoContentRequest
): VideoContentValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.lessonId || data.lessonId.trim() === '') {
    errors.lessonId = 'Ders ID zorunludur';
  }
  
  const titleValidation = validateStringLength(data.title || '', 'Başlık', 2, 200);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error || 'Geçersiz başlık';
  }
  
  // Validate videoSource
  if (!data.videoSource || !['youtube', 'vimeo', 'uploaded'].includes(data.videoSource)) {
    errors.videoSource = 'Geçersiz video kaynağı';
  } else {
    // For uploaded videos, require videoPath; for YouTube/Vimeo, require videoUrl
    if (data.videoSource === 'uploaded') {
      const hasVideoPath = data.videoPath && data.videoPath.trim() !== '';
      const hasVideoUrl = data.videoUrl && data.videoUrl.trim() !== '';
      
      if (!hasVideoPath && !hasVideoUrl) {
        errors.videoPath = 'Yüklenen videolar için video path zorunludur';
      }
    } else {
      // YouTube or Vimeo - require videoUrl
      if (!data.videoUrl || data.videoUrl.trim() === '') {
        errors.videoUrl = 'Video URL zorunludur';
      } else {
        const videoValidation = validateVideoUrl(data.videoUrl, data.videoSource);
        if (!videoValidation.valid) {
          errors.videoUrl = videoValidation.error || 'Geçersiz video URL';
        }
      }
    }
  }
  
  if (data.duration !== undefined && data.duration < 0) {
    errors.duration = 'Video süresi 0 veya pozitif bir sayı olmalıdır';
  }
  
  if (data.order !== undefined && data.order < 0) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

export const validateUpdateVideoContent = (
  data: UpdateVideoContentRequest
): VideoContentValidationResult => {
  const errors: Record<string, string> = {};
  
  if (data.title !== undefined) {
    const titleValidation = validateStringLength(data.title, 'Başlık', 2, 200);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error || 'Geçersiz başlık';
    }
  }
  
  if (data.videoUrl !== undefined && data.videoUrl.trim() !== '') {
    if (data.videoSource === undefined) {
      errors.videoSource = 'Video kaynağı belirtilmelidir';
    } else if (!['youtube', 'vimeo', 'uploaded'].includes(data.videoSource)) {
      errors.videoSource = 'Geçersiz video kaynağı';
    } else {
      const videoValidation = validateVideoUrl(data.videoUrl, data.videoSource);
      if (!videoValidation.valid) {
        errors.videoUrl = videoValidation.error || 'Geçersiz video URL';
      }
    }
  }
  
  if (data.duration !== undefined && data.duration < 0) {
    errors.duration = 'Video süresi 0 veya pozitif bir sayı olmalıdır';
  }
  
  if (data.order !== undefined && data.order < 0) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

