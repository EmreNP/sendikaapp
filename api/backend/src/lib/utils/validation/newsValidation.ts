import { validateStringLength } from './commonValidation';
import type { CreateNewsRequest, UpdateNewsRequest } from '@shared/types/news';

// Title validation
export const validateNewsTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim() === '') {
    return { valid: false, error: 'Başlık zorunludur' };
  }
  
  const lengthValidation = validateStringLength(title, 'Başlık', 2, 200);
  if (!lengthValidation.valid) {
    return lengthValidation;
  }
  
  return { valid: true };
};

// Content validation (HTML)
export const validateNewsContent = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim() === '') {
    return { valid: false, error: 'İçerik zorunludur' };
  }
  
  // HTML tag'lerini temizleyerek uzunluk kontrolü
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  
  if (textContent.length < 10) {
    return { valid: false, error: 'İçerik en az 10 karakter olmalıdır' };
  }
  
  // Max uzunluk kontrolü (HTML dahil)
  if (content.length > 50000) {
    return { valid: false, error: 'İçerik en fazla 50000 karakter olabilir' };
  }
  
  return { valid: true };
};


// Image URL validation
export const validateNewsImageUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url) {
    return { valid: true }; // Opsiyonel
  }
  
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { valid: false, error: 'Geçersiz görsel URL protokolü' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Geçersiz görsel URL formatı' };
  }
};

// Featured validation
export const validateNewsFeatured = (isFeatured: boolean): { valid: boolean; error?: string } => {
  if (typeof isFeatured !== 'boolean') {
    return { valid: false, error: 'isFeatured boolean olmalıdır' };
  }
  return { valid: true };
};


// Validation Result Interface
export interface NewsValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

// Create News Validation
export const validateCreateNews = (data: CreateNewsRequest): NewsValidationResult => {
  const errors: Record<string, string> = {};
  
  // Title validation
  const titleValidation = validateNewsTitle(data.title || '');
  if (!titleValidation.valid) {
    errors.title = titleValidation.error || 'Geçersiz başlık';
  }
  
  // Content validation (zorunlu)
  if (!data.content) {
    errors.content = 'İçerik zorunludur';
  } else {
    const contentValidation = validateNewsContent(data.content);
    if (!contentValidation.valid) {
      errors.content = contentValidation.error || 'Geçersiz içerik';
    }
  }
  
  // Featured validation (opsiyonel)
  if (data.isFeatured !== undefined) {
    const featuredValidation = validateNewsFeatured(data.isFeatured);
    if (!featuredValidation.valid) {
      errors.isFeatured = featuredValidation.error || 'Geçersiz featured değeri';
    }
  }
  
  // ImageUrl validation (opsiyonel)
  if (data.imageUrl) {
    const imageValidation = validateNewsImageUrl(data.imageUrl);
    if (!imageValidation.valid) {
      errors.imageUrl = imageValidation.error || 'Geçersiz görsel URL';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

// Update News Validation (mevcut değerlerle birleştirilmiş)
export const validateUpdateNews = (
  data: UpdateNewsRequest,
  currentNews: { content?: string }
): NewsValidationResult => {
  const errors: Record<string, string> = {};
  
  // Title validation
  if (data.title !== undefined) {
    const titleValidation = validateNewsTitle(data.title);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error || 'Geçersiz başlık';
    }
  }
  
  // Mevcut değerlerle birleştir
  const newContent = data.content !== undefined ? data.content : currentNews.content;
  
  // Content validation (eğer güncelleniyorsa veya mevcut değer yoksa zorunlu)
  if (data.content !== undefined) {
    if (!newContent) {
      errors.content = 'İçerik zorunludur';
    } else {
      const contentValidation = validateNewsContent(newContent);
      if (!contentValidation.valid) {
        errors.content = contentValidation.error || 'Geçersiz içerik';
      }
    }
  } else if (!newContent) {
    // Eğer content güncellenmiyorsa ama mevcut değer de yoksa hata
    errors.content = 'İçerik zorunludur';
  }
  
  // Featured validation (opsiyonel)
  if (data.isFeatured !== undefined) {
    const featuredValidation = validateNewsFeatured(data.isFeatured);
    if (!featuredValidation.valid) {
      errors.isFeatured = featuredValidation.error || 'Geçersiz featured değeri';
    }
  }
  
  // ImageUrl validation (opsiyonel)
  if (data.imageUrl !== undefined && data.imageUrl) {
    const imageValidation = validateNewsImageUrl(data.imageUrl);
    if (!imageValidation.valid) {
      errors.imageUrl = imageValidation.error || 'Geçersiz görsel URL';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

