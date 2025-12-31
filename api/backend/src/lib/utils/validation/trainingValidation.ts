import { validateStringLength } from './commonValidation';
import type { CreateTrainingRequest, UpdateTrainingRequest } from '@shared/types/training';

export const validateTrainingTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || title.trim() === '') {
    return { valid: false, error: 'Başlık zorunludur' };
  }
  return validateStringLength(title, 'Başlık', 2, 200);
};

export interface TrainingValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export const validateCreateTraining = (data: CreateTrainingRequest): TrainingValidationResult => {
  const errors: Record<string, string> = {};
  
  const titleValidation = validateTrainingTitle(data.title || '');
  if (!titleValidation.valid) {
    errors.title = titleValidation.error || 'Geçersiz başlık';
  }
  
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.isActive = 'isActive boolean olmalıdır';
  }
  
  if (data.order !== undefined && (typeof data.order !== 'number' || data.order < 0)) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

export const validateUpdateTraining = (data: UpdateTrainingRequest): TrainingValidationResult => {
  const errors: Record<string, string> = {};
  
  if (data.title !== undefined) {
    const titleValidation = validateTrainingTitle(data.title);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error || 'Geçersiz başlık';
    }
  }
  
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.isActive = 'isActive boolean olmalıdır';
  }
  
  if (data.order !== undefined && (typeof data.order !== 'number' || data.order < 0)) {
    errors.order = 'Sıralama 0 veya pozitif bir sayı olmalıdır';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
};

