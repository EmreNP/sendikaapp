import { validateStringLength, validateRequired } from './commonValidation';
import type { 
  CreateContractedInstitutionRequest, 
  UpdateContractedInstitutionRequest,
  HowToUseStep
} from '@shared/types/contracted-institution';

// Title validation
export const validateInstitutionTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim() === '') {
    return { valid: false, error: 'Kurum adı zorunludur' };
  }
  
  const lengthValidation = validateStringLength(title, 'Kurum adı', 2, 200);
  if (!lengthValidation.valid) {
    return lengthValidation;
  }
  
  return { valid: true };
};

// Description validation
export const validateInstitutionDescription = (description: string): { valid: boolean; error?: string } => {
  if (!description || description.trim() === '') {
    return { valid: false, error: 'Anlaşma detayları zorunludur' };
  }
  
  if (description.trim().length < 10) {
    return { valid: false, error: 'Anlaşma detayları en az 10 karakter olmalıdır' };
  }
  
  if (description.length > 5000) {
    return { valid: false, error: 'Anlaşma detayları en fazla 5000 karakter olabilir' };
  }
  
  return { valid: true };
};

// CategoryId validation
export const validateInstitutionCategoryId = (categoryId: string): { valid: boolean; error?: string } => {
  if (!categoryId || categoryId.trim() === '') {
    return { valid: false, error: 'Kategori seçimi zorunludur' };
  }
  
  return { valid: true };
};

// Badge text validation
export const validateBadgeText = (badgeText: string): { valid: boolean; error?: string } => {
  if (!badgeText || badgeText.trim() === '') {
    return { valid: false, error: 'Badge metni zorunludur' };
  }
  
  const lengthValidation = validateStringLength(badgeText, 'Badge metni', 2, 50);
  if (!lengthValidation.valid) {
    return lengthValidation;
  }
  
  return { valid: true };
};

// Cover image URL validation
export const validateCoverImageUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'Kapak fotoğrafı zorunludur' };
  }
  
  return { valid: true };
};

// How to use steps validation
export const validateHowToUseSteps = (steps: HowToUseStep[]): { valid: boolean; error?: string } => {
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return { valid: false, error: 'En az bir kullanım adımı gereklidir' };
  }
  
  if (steps.length > 10) {
    return { valid: false, error: 'En fazla 10 adım eklenebilir' };
  }
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    if (!step.title || step.title.trim() === '') {
      return { valid: false, error: `${i + 1}. adım başlığı zorunludur` };
    }
    
    if (step.title.length > 100) {
      return { valid: false, error: `${i + 1}. adım başlığı en fazla 100 karakter olabilir` };
    }
    
    if (!step.description || step.description.trim() === '') {
      return { valid: false, error: `${i + 1}. adım açıklaması zorunludur` };
    }
    
    if (step.description.length > 500) {
      return { valid: false, error: `${i + 1}. adım açıklaması en fazla 500 karakter olabilir` };
    }
  }
  
  return { valid: true };
};

// Validation Result Interface
export interface ContractedInstitutionValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

// Create Validation
export const validateCreateContractedInstitution = (
  data: CreateContractedInstitutionRequest
): ContractedInstitutionValidationResult => {
  const errors: Record<string, string> = {};
  
  // Title
  const titleValidation = validateInstitutionTitle(data.title || '');
  if (!titleValidation.valid) {
    errors.title = titleValidation.error || 'Geçersiz kurum adı';
  }
  
  // Description
  const descValidation = validateInstitutionDescription(data.description || '');
  if (!descValidation.valid) {
    errors.description = descValidation.error || 'Geçersiz anlaşma detayları';
  }
  
  // Category
  const categoryValidation = validateInstitutionCategoryId(data.categoryId || '');
  if (!categoryValidation.valid) {
    errors.categoryId = categoryValidation.error || 'Geçersiz kategori';
  }
  
  // Badge text
  const badgeValidation = validateBadgeText(data.badgeText || '');
  if (!badgeValidation.valid) {
    errors.badgeText = badgeValidation.error || 'Geçersiz badge metni';
  }
  
  // Cover image
  const coverValidation = validateCoverImageUrl(data.coverImageUrl || '');
  if (!coverValidation.valid) {
    errors.coverImageUrl = coverValidation.error || 'Geçersiz kapak fotoğrafı';
  }
  
  // How to use steps
  const stepsValidation = validateHowToUseSteps(data.howToUseSteps || []);
  if (!stepsValidation.valid) {
    errors.howToUseSteps = stepsValidation.error || 'Geçersiz kullanım adımları';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

// Update Validation
export const validateUpdateContractedInstitution = (
  data: UpdateContractedInstitutionRequest
): ContractedInstitutionValidationResult => {
  const errors: Record<string, string> = {};
  
  // Title (opsiyonel güncelleme)
  if (data.title !== undefined) {
    const titleValidation = validateInstitutionTitle(data.title);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error || 'Geçersiz kurum adı';
    }
  }
  
  // Description (opsiyonel güncelleme)
  if (data.description !== undefined) {
    const descValidation = validateInstitutionDescription(data.description);
    if (!descValidation.valid) {
      errors.description = descValidation.error || 'Geçersiz anlaşma detayları';
    }
  }
  
  // CategoryId (opsiyonel güncelleme)
  if (data.categoryId !== undefined) {
    const categoryValidation = validateInstitutionCategoryId(data.categoryId);
    if (!categoryValidation.valid) {
      errors.categoryId = categoryValidation.error || 'Geçersiz kategori';
    }
  }
  
  // Badge text (opsiyonel güncelleme)
  if (data.badgeText !== undefined) {
    const badgeValidation = validateBadgeText(data.badgeText);
    if (!badgeValidation.valid) {
      errors.badgeText = badgeValidation.error || 'Geçersiz badge metni';
    }
  }
  
  // Cover image (opsiyonel güncelleme)
  if (data.coverImageUrl !== undefined) {
    const coverValidation = validateCoverImageUrl(data.coverImageUrl);
    if (!coverValidation.valid) {
      errors.coverImageUrl = coverValidation.error || 'Geçersiz kapak fotoğrafı';
    }
  }
  
  // How to use steps (opsiyonel güncelleme)
  if (data.howToUseSteps !== undefined) {
    const stepsValidation = validateHowToUseSteps(data.howToUseSteps);
    if (!stepsValidation.valid) {
      errors.howToUseSteps = stepsValidation.error || 'Geçersiz kullanım adımları';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};
