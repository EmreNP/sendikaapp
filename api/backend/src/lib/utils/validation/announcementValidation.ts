import { validateStringLength } from './commonValidation';
import type { CreateAnnouncementRequest, UpdateAnnouncementRequest } from '@shared/types/announcement';

// Title validation
export const validateAnnouncementTitle = (title: string): { valid: boolean; error?: string } => {
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
export const validateAnnouncementContent = (content: string): { valid: boolean; error?: string } => {
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

// External URL validation
export const validateAnnouncementExternalUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'Dış link zorunludur' };
  }
  
  try {
    const urlObj = new URL(url);
    // Sadece http ve https protokollerine izin ver
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { valid: false, error: 'Geçersiz URL protokolü. Sadece http ve https desteklenir' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Geçersiz URL formatı' };
  }
};

// Image URL validation
export const validateAnnouncementImageUrl = (url: string): { valid: boolean; error?: string } => {
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
export const validateAnnouncementFeatured = (isFeatured: boolean): { valid: boolean; error?: string } => {
  if (typeof isFeatured !== 'boolean') {
    return { valid: false, error: 'isFeatured boolean olmalıdır' };
  }
  return { valid: true };
};

// Content/ExternalUrl mutual exclusivity check
export const validateAnnouncementData = (data: {
  content?: string;
  externalUrl?: string;
}): { valid: boolean; error?: string } => {
  const hasContent = !!data.content;
  const hasExternalUrl = !!data.externalUrl;
  
  // İkisi de yoksa hata
  if (!hasContent && !hasExternalUrl) {
    return { 
      valid: false, 
      error: 'İçerik (content) veya dış link (externalUrl) alanlarından en az biri zorunludur' 
    };
  }
  
  // İkisi de varsa hata
  if (hasContent && hasExternalUrl) {
    return { 
      valid: false, 
      error: 'İçerik (content) ve dış link (externalUrl) aynı anda kullanılamaz' 
    };
  }
  
  return { valid: true };
};

// Validation Result Interface
export interface AnnouncementValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

// Create Announcement Validation
export const validateCreateAnnouncement = (data: CreateAnnouncementRequest): AnnouncementValidationResult => {
  const errors: Record<string, string> = {};
  
  // Title validation
  const titleValidation = validateAnnouncementTitle(data.title || '');
  if (!titleValidation.valid) {
    errors.title = titleValidation.error || 'Geçersiz başlık';
  }
  
  // Content/ExternalUrl mutual exclusivity check
  const dataValidation = validateAnnouncementData({
    content: data.content,
    externalUrl: data.externalUrl
  });
  if (!dataValidation.valid) {
    errors.content = dataValidation.error || 'Geçersiz veri';
    errors.externalUrl = dataValidation.error || 'Geçersiz veri';
  }
  
  // Content validation (eğer varsa)
  if (data.content) {
    const contentValidation = validateAnnouncementContent(data.content);
    if (!contentValidation.valid) {
      errors.content = contentValidation.error || 'Geçersiz içerik';
    }
  }
  
  // ExternalUrl validation (eğer varsa)
  if (data.externalUrl) {
    const urlValidation = validateAnnouncementExternalUrl(data.externalUrl);
    if (!urlValidation.valid) {
      errors.externalUrl = urlValidation.error || 'Geçersiz URL';
    }
  }
  
  // Featured validation (opsiyonel)
  if (data.isFeatured !== undefined) {
    const featuredValidation = validateAnnouncementFeatured(data.isFeatured);
    if (!featuredValidation.valid) {
      errors.isFeatured = featuredValidation.error || 'Geçersiz featured değeri';
    }
  }
  
  // ImageUrl validation (opsiyonel)
  if (data.imageUrl) {
    const imageValidation = validateAnnouncementImageUrl(data.imageUrl);
    if (!imageValidation.valid) {
      errors.imageUrl = imageValidation.error || 'Geçersiz görsel URL';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

// Update Announcement Validation (mevcut değerlerle birleştirilmiş)
export const validateUpdateAnnouncement = (
  data: UpdateAnnouncementRequest,
  currentAnnouncement: { content?: string; externalUrl?: string }
): AnnouncementValidationResult => {
  const errors: Record<string, string> = {};
  
  // Title validation
  if (data.title !== undefined) {
    const titleValidation = validateAnnouncementTitle(data.title);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error || 'Geçersiz başlık';
    }
  }
  
  // Mevcut değerlerle birleştir
  const newContent = data.content !== undefined ? data.content : currentAnnouncement.content;
  const newExternalUrl = data.externalUrl !== undefined ? data.externalUrl : currentAnnouncement.externalUrl;
  
  // Content/ExternalUrl mutual exclusivity check
  const dataValidation = validateAnnouncementData({
    content: newContent,
    externalUrl: newExternalUrl
  });
  if (!dataValidation.valid) {
    errors.content = dataValidation.error || 'Geçersiz veri';
    errors.externalUrl = dataValidation.error || 'Geçersiz veri';
  }
  
  // Content validation (eğer varsa)
  if (newContent) {
    const contentValidation = validateAnnouncementContent(newContent);
    if (!contentValidation.valid) {
      errors.content = contentValidation.error || 'Geçersiz içerik';
    }
  }
  
  // ExternalUrl validation (eğer varsa)
  if (newExternalUrl) {
    const urlValidation = validateAnnouncementExternalUrl(newExternalUrl);
    if (!urlValidation.valid) {
      errors.externalUrl = urlValidation.error || 'Geçersiz URL';
    }
  }
  
  // Featured validation (opsiyonel)
  if (data.isFeatured !== undefined) {
    const featuredValidation = validateAnnouncementFeatured(data.isFeatured);
    if (!featuredValidation.valid) {
      errors.isFeatured = featuredValidation.error || 'Geçersiz featured değeri';
    }
  }
  
  // ImageUrl validation (opsiyonel)
  if (data.imageUrl !== undefined && data.imageUrl) {
    const imageValidation = validateAnnouncementImageUrl(data.imageUrl);
    if (!imageValidation.valid) {
      errors.imageUrl = imageValidation.error || 'Geçersiz görsel URL';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

