import { validateStringLength } from './commonValidation';
import type { CreateDocumentContentRequest, UpdateDocumentContentRequest } from '@shared/types/training';

export interface DocumentContentValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export const validateCreateDocumentContent = (
  data: CreateDocumentContentRequest
): DocumentContentValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.lessonId || data.lessonId.trim() === '') {
    errors.lessonId = 'Ders ID zorunludur';
  }
  
  const titleValidation = validateStringLength(data.title || '', 'Başlık', 2, 200);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error || 'Geçersiz başlık';
  }
  
  // Accept either documentPath (new) or documentUrl (legacy)
  const hasDocumentPath = data.documentPath && data.documentPath.trim() !== '';
  const hasDocumentUrl = data.documentUrl && data.documentUrl.trim() !== '';
  
  if (!hasDocumentPath && !hasDocumentUrl) {
    errors.documentPath = 'Döküman path veya URL zorunludur';
  } else if (hasDocumentUrl && !hasDocumentPath) {
    // If URL is provided, validate it (unless it's a path)
    if (data.documentUrl && !data.documentUrl.startsWith('http')) {
      // It's actually a path, that's fine
    } else {
      try {
        const urlObj = new URL(data.documentUrl!);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          errors.documentUrl = 'Geçersiz döküman URL protokolü';
        }
      } catch {
        errors.documentUrl = 'Geçersiz döküman URL formatı';
      }
    }
  }
  
  if (!data.documentType || data.documentType.trim() === '') {
    errors.documentType = 'Döküman tipi zorunludur';
  } else if (data.documentType !== 'pdf') {
    errors.documentType = 'Döküman tipi sadece PDF olabilir';
  }
  
  if (data.fileSize !== undefined && data.fileSize < 0) {
    errors.fileSize = 'Dosya boyutu 0 veya pozitif bir sayı olmalıdır';
  }
  
  if (data.order !== undefined && data.order < 0) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

export const validateUpdateDocumentContent = (
  data: UpdateDocumentContentRequest
): DocumentContentValidationResult => {
  const errors: Record<string, string> = {};
  
  if (data.title !== undefined) {
    const titleValidation = validateStringLength(data.title, 'Başlık', 2, 200);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error || 'Geçersiz başlık';
    }
  }
  
  if (data.documentUrl !== undefined && data.documentUrl.trim() !== '') {
    try {
      const urlObj = new URL(data.documentUrl);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        errors.documentUrl = 'Geçersiz döküman URL protokolü';
      }
    } catch {
      errors.documentUrl = 'Geçersiz döküman URL formatı';
    }
  }
  
  if (data.documentType !== undefined && data.documentType.trim() === '') {
    errors.documentType = 'Döküman tipi boş olamaz';
  } else if (data.documentType !== undefined && data.documentType !== 'pdf') {
    errors.documentType = 'Döküman tipi sadece PDF olabilir';
  }
  
  if (data.fileSize !== undefined && data.fileSize < 0) {
    errors.fileSize = 'Dosya boyutu 0 veya pozitif bir sayı olmalıdır';
  }
  
  if (data.order !== undefined && data.order < 0) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

